// The damage formula (docs/FORMULA.md). Pure functions: inputs in, numbers and their sources out.
import { activeBuffs, activeStacks, activeStats, buffMatches, cardBuffs, findCharacter, type ActiveBuff, type ActiveStacks, type ActiveStat, type Source } from './buffs'
import type { Build, Card, CardPreset, CharacterPreset, CharacterSave, PotentialUpgrade, Presets, RotationPlay, Settings, StatName } from './types'

export interface Stat {
  value: number
  sources: Source[]
}

export interface FinalStats {
  atk: Stat
  def: Stat
  critRate: Stat
  critDmg: Stat
  elemDmg: Stat
  extraDmg: Stat
  dotDmg: Stat
  weaknessDmg: Stat
}

export interface Factor {
  value: number
  sources: Source[]
}

/** Every factor of one hit, so the UI can draw the formula. A null factor doesn't apply to this hit. */
export interface Hit {
  /** 1-based hit number across the whole rotation (Vulnerable / Weakness debuff stacks use this order). */
  globalHit: number
  hitNo: number
  /** The card's %: the base when a potential upgrade applies, otherwise as shown in-game. */
  cardPct: number
  /** Basic / Signature Card Upgrade potential (card % x this); null for cards without one. */
  potential: Factor | null
  multFactor: Factor
  additive: Factor
  weakness: Factor | null
  vulnerable: Factor | null
  enemyDr: Factor | null
  weaknessDebuff: Factor | null
  ravaged: Factor | null
  cardMult: number
  /** ATK, or ATK x 0.3 + DEF x 2.1 for DEF cards. */
  stat: Factor
  constant: number
  elemDmg: Factor | null
  mechDmg: Factor | null
  enemyDef: Factor | null
  critDmg: number
  critRate: number
  /** Final Crit DMG / Crit Chance plus this card's crit buffs. */
  critDmgSources: Source[]
  critRateSources: Source[]
  nonCrit: number
  crit: number
  expected: number
}

export interface Play {
  /** The card as played (with this play's hit count). */
  card: Card
  /** Position in the rotation (0-based). */
  index: number
  hits: Hit[]
  /** Rotation counters (Ember, Spirit of the Aromata...) after this play's gains, before its hits; then after its hits. */
  counters: { name: string; before: number; after: number }[]
  nonCrit: number
  crit: number
  expected: number
}

export interface BuildResult {
  stats: FinalStats
  plays: Play[]
  nonCrit: number
  crit: number
  expected: number
}

function sumStat(stats: ActiveStat[], name: StatName): Stat {
  const sources = stats.filter((s) => s.stat === name).map((s) => ({
    label: s.stacks !== 1 ? `${s.label} x${s.stacks}` : s.label, value: s.value * s.stacks, unit: s.unit,
  }))
  return { value: sources.reduce((a, s) => a + s.value, 0), sources }
}

/** Final stats: stats screen + boosts. ATK/DEF = screen x (1 + %) + flat. */
export function finalStats(presets: Presets, charName: string, cs: CharacterSave, build: Build, settings: Settings): FinalStats {
  const st = activeStats(presets, charName, cs, build)
  const s = build.stats
  const element = findCharacter(presets, charName)?.element
  const screen = (label: string, value: number, unit: Source['unit']): Source => ({ label: `Stats screen ${label}`, value, unit })
  const plus = (base: Source, extra: Stat): Stat => ({
    value: base.value + extra.value, sources: [base, ...extra.sources],
  })
  const scaled = (label: string, screenVal: number, pct: Stat, flat: Stat): Stat => ({
    value: screenVal * (1 + pct.value) + flat.value,
    sources: [screen(label, screenVal, 'flat'), ...pct.sources, ...flat.sources],
  })
  const critRate = plus(screen('Crit Chance', s.critChance, '%'), sumStat(st, 'Crit Rate'))
  if (critRate.value > settings.critCap) {
    critRate.sources.push({ label: 'Capped (Settings)', value: settings.critCap, unit: '%' })
    critRate.value = settings.critCap
  }
  return {
    atk: scaled('Attack', s.attack, sumStat(st, 'ATK%'), sumStat(st, 'Flat ATK')),
    def: scaled('Defense', s.defense, sumStat(st, 'DEF%'), sumStat(st, 'Flat DEF')),
    critRate,
    critDmg: plus(screen('Crit DMG', s.critDmg, '%'), sumStat(st, 'Crit DMG')),
    elemDmg: plus(screen(`${element ?? ''} DMG`, element ? s.elemDmg[element] || 0 : 0, '%'), sumStat(st, 'Elemental DMG%')),
    extraDmg: plus(screen('Extra DMG', s.extraDmg, '%'), sumStat(st, 'Extra DMG%')),
    dotDmg: plus(screen('DoT', s.dotDmg, '%'), sumStat(st, 'DoT DMG%')),
    weaknessDmg: plus(screen('Weakness DMG', s.weaknessDmg, '%'), sumStat(st, 'Weakness DMG')),
  }
}

/** Which card upgrade potential raises a preset card: Basic cards Basic, Ego skills none, the rest Signature. */
export function cardUpgrade(p: CardPreset): PotentialUpgrade | undefined {
  if ((p.tags ?? '').split(',').some((t) => t.trim() === 'Basic')) return 'Basic'
  if (p.category === 'Ego Skill') return undefined
  return 'Signature'
}

/** Potential factor for a card upgrade: 1 + per level x (build level + the Manifest Ego bonus, if unlocked). */
export function potentialFactor(upgrade: PotentialUpgrade | undefined, build: Build, ch: CharacterPreset | undefined,
  settings: Settings): Factor | null {
  if (!upgrade) return null
  const set = (upgrade === 'Basic' ? build.basicLevel : build.signatureLevel) || 0
  const ego = ch?.potentialEgo && (build.egoLevel ?? 0) >= ch.potentialEgo.level ? ch.potentialEgo : undefined
  const level = set + (ego?.levels ?? 0)
  const sources: Source[] = [{ label: `${upgrade} Card Upgrade level ${set}`, value: set * settings.potentialPerLevel, unit: '%' }]
  if (ego) sources.push({ label: `E${ego.level}: +${ego.levels} levels`, value: ego.levels * settings.potentialPerLevel, unit: '%' })
  return { value: 1 + level * settings.potentialPerLevel, sources }
}

/** The card as played: the play's own hit count, if set, replaces the card's. */
export function playCard(card: Card, play: RotationPlay): Card {
  return play.hits === undefined ? card : { ...card, hits: play.hits }
}

/** Damage of every hit of every play in the rotation, for one build. */
export function computeBuild(presets: Presets, charName: string, cs: CharacterSave, build: Build, settings: Settings): BuildResult {
  const stats = finalStats(presets, charName, cs, build, settings)
  const buffs = activeBuffs(presets, charName, cs, build, settings)
  const fixedBuffs = buffs.filter((b) => !b.counter)
  const counterBuffs = buffs.filter((b) => b.counter)
  const gains = activeStacks(presets, charName, cs, build)
  // A counter holds at most the smallest max stacks of the buffs that read it
  const caps = new Map<string, number>()
  for (const b of counterBuffs) if (b.maxStacks) caps.set(b.counter!, Math.min(caps.get(b.counter!) ?? Infinity, b.maxStacks))
  const counters = new Map<string, number>()
  const started = new Set<ActiveStacks>()
  const ch = findCharacter(presets, charName)
  const cards = new Map(cs.cards.map((c) => [c.id, c]))
  const perCard = new Map<string, ReturnType<typeof cardBuffs>>()
  const plays: Play[] = []
  let k = 0
  cs.rotation.forEach((play, index) => {
    const base = cards.get(play.cardId)
    if (!base) return
    // A per-play hit count also counts for '2+ hits' buffs, so it's buffed as its own card
    const card = playCard(base, play)
    const hitCount = Math.max(0, Math.floor(card.hits))
    // Stacks land before the card's damage (owner, 2026-10-25)
    const damaging = card.pct > 0 && hitCount > 0
    for (const g of gains) {
      const own = !!g.cardId && card.preset === g.cardId
      if (g.trigger === 'afterSelf' && own) started.add(g)
      if ((g.trigger === 'self' && !own) || (g.trigger === 'afterSelf' && !started.has(g))) continue
      if (g.damagingOnly && !damaging) continue
      if (!buffMatches({ appliesTo: g.on, condition: 'Always' }, card)) continue
      counters.set(g.counter, Math.min(caps.get(g.counter) ?? Infinity, (counters.get(g.counter) ?? 0) + g.amount))
    }
    const before = new Map(counters)
    const key = `${card.id}|${card.hits}`
    let fixedCb = perCard.get(key)
    if (!fixedCb) perCard.set(key, (fixedCb = cardBuffs(fixedBuffs, card)))
    const upgradable = !(card.scaling === 'Fixed' && !settings.potentialFixed)
    const potential = upgradable ? potentialFactor(card.upgrade, build, ch, settings) : null
    const hits: Hit[] = []
    for (let h = 1; h <= hitCount; h++) {
      k++
      const live: ActiveBuff[] = counterBuffs.map((b) => ({ ...b, stacks: Math.min(counters.get(b.counter!) ?? 0, b.maxStacks ?? Infinity) }))
      const cb = live.some((b) => b.stacks > 0) ? cardBuffs([...fixedBuffs, ...live], card) : fixedCb
      hits.push(computeHit(card, h, k, cb, potential, stats, build, settings))
      // A consumed counter (Ember) loses one stack per hit it boosted
      for (const name of new Set(live.filter((b) => b.consumePerHit && b.stacks > 0 && buffMatches(b, card)).map((b) => b.counter!))) {
        counters.set(name, (counters.get(name) ?? 0) - 1)
      }
    }
    const sum = (f: (x: Hit) => number) => hits.reduce((a, x) => a + f(x), 0)
    plays.push({ card, index, hits, counters: [...before].map(([name, n]) => ({ name, before: n, after: counters.get(name) ?? 0 })),
      nonCrit: sum((x) => x.nonCrit), crit: sum((x) => x.crit), expected: sum((x) => x.expected) })
  })
  const sum = (f: (x: Play) => number) => plays.reduce((a, x) => a + f(x), 0)
  return { stats, plays, nonCrit: sum((x) => x.nonCrit), crit: sum((x) => x.crit), expected: sum((x) => x.expected) }
}

function computeHit(card: Card, hitNo: number, k: number, cb: ReturnType<typeof cardBuffs>, potential: Factor | null,
  stats: FinalStats, build: Build, settings: Settings): Hit {
  const first = hitNo === 1
  // Card % buffs raise the base % like the card upgrade potentials, so only on cards entered at base %
  const cardPctSources = potential ? [...cb.cardPct.all.sources, ...(first ? cb.cardPct.first.sources : [])] : []
  if (potential && cardPctSources.length) {
    potential = {
      value: potential.value * (1 + cardPctSources.reduce((a, s) => a + s.value, 0)),
      sources: [...potential.sources, ...cardPctSources],
    }
  }
  const pct = card.pct * (potential?.value ?? 1)
  const multSources = [...cb.multiplicative.all.sources, ...(first ? cb.multiplicative.first.sources : [])]
  const multValue = settings.multMode === 'Chained'
    ? multSources.reduce((a, s) => a * (1 + s.value), 1)
    : 1 + multSources.reduce((a, s) => a + s.value, 0)
  const addSources = [...cb.additive.all.sources, ...(first ? cb.additive.first.sources : [])]
  const additive = { value: addSources.reduce((a, s) => a + s.value, 0), sources: addSources }

  const weakApplies = card.weaknessApplies || cb.weaknessAttack.length > 0
  const weakness: Factor | null = weakApplies ? {
    value: stats.weaknessDmg.value * (1 + settings.extraWeakness),
    sources: [
      ...stats.weaknessDmg.sources,
      ...(card.weaknessApplies ? [] : cb.weaknessAttack.map((s) => ({ ...s, label: `Weakness Attack: ${s.label}` }))),
      ...(settings.extraWeakness ? [{ label: 'Extra weakness factor (Settings)', value: settings.extraWeakness, unit: '%' as const }] : []),
    ],
  } : null
  const vulnerable = k <= (build.vulnerable || 0)
    ? { value: 1 + settings.vulnerable, sources: [{ label: `Vulnerable stack (hit ${k} of ${build.vulnerable})`, value: settings.vulnerable, unit: '%' as const }] }
    : null
  const enemyDr = build.enemyDr
    ? { value: 1 - build.enemyDr, sources: [{ label: 'Enemy damage reduction', value: build.enemyDr, unit: '%' as const }] }
    : null
  const weaknessDebuff = k <= (build.weaknessDebuff || 0)
    ? { value: 1 - settings.weaknessDebuff, sources: [{ label: `Weakness debuff stack (hit ${k} of ${build.weaknessDebuff})`, value: settings.weaknessDebuff, unit: '%' as const }] }
    : null
  const ravaged = card.targetRavaged && settings.ravaged
    ? { value: 1 + settings.ravaged, sources: [{ label: 'Ravaged target (Settings)', value: settings.ravaged, unit: '%' as const }] }
    : null
  const cardMult = (pct * multValue + additive.value) * (weakness?.value ?? 1) * (vulnerable?.value ?? 1)
    * (enemyDr?.value ?? 1) * (weaknessDebuff?.value ?? 1) * (ravaged?.value ?? 1)

  const stat: Factor = card.scaling === 'DEF'
    ? {
      value: stats.atk.value * settings.defCardAtkCoef + stats.def.value * settings.defCardDefCoef,
      sources: [
        { label: `Final ATK ${round(stats.atk.value)} x ${settings.defCardAtkCoef}`, value: stats.atk.value * settings.defCardAtkCoef, unit: 'flat' },
        { label: `Final DEF ${round(stats.def.value)} x ${settings.defCardDefCoef}`, value: stats.def.value * settings.defCardDefCoef, unit: 'flat' },
      ],
    }
    : stats.atk
  const elemDmg = stats.elemDmg.value ? { value: 1 + stats.elemDmg.value, sources: stats.elemDmg.sources } : null
  const mech = card.kind === 'Extra Attack' ? stats.extraDmg : card.kind === 'DoT' ? stats.dotDmg : null
  const mechDmg = mech && mech.value ? { value: 1 + mech.value, sources: mech.sources } : null
  const enemyDef = build.enemyDefMult !== 1
    ? { value: build.enemyDefMult, sources: [{ label: 'Enemy DEF multiplier', value: build.enemyDefMult, unit: 'x' as const }] }
    : null
  const critBuffs = (b: typeof cb.critDmg) => [...b.all.sources, ...(first ? b.first.sources : [])]
  const critDmgSources = [...stats.critDmg.sources, ...critBuffs(cb.critDmg)]
  const critDmg = stats.critDmg.value + critBuffs(cb.critDmg).reduce((a, s) => a + s.value, 0)
  const critRateSources = [...stats.critRate.sources, ...critBuffs(cb.critRate)]
  let critRate = stats.critRate.value + critBuffs(cb.critRate).reduce((a, s) => a + s.value, 0)
  if (critRate > settings.critCap) {
    if (!critRateSources.some((s) => s.label === 'Capped (Settings)')) critRateSources.push({ label: 'Capped (Settings)', value: settings.critCap, unit: '%' })
    critRate = settings.critCap
  }

  let nonCrit: number, crit: number, expected: number
  if (card.scaling === 'Fixed') {
    nonCrit = crit = expected = pct   // Fixed damage ignores every multiplier and can't crit (Unconfirmed)
  } else {
    nonCrit = cardMult * stat.value * settings.atkConstant * (elemDmg?.value ?? 1) * (mechDmg?.value ?? 1) * (enemyDef?.value ?? 1)
    crit = nonCrit * critDmg
    expected = nonCrit * (1 + critRate * (critDmg - 1))
  }
  return {
    globalHit: k, hitNo, cardPct: card.pct, potential, multFactor: { value: multValue, sources: multSources }, additive,
    weakness, vulnerable, enemyDr, weaknessDebuff, ravaged, cardMult, stat, constant: settings.atkConstant,
    elemDmg, mechDmg, enemyDef, critDmg, critRate, critDmgSources, critRateSources, nonCrit, crit, expected,
  }
}

function round(n: number): string {
  return (Math.round(n * 10) / 10).toString()
}
