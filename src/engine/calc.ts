// The damage formula (docs/FORMULA.md). Pure functions: inputs in, numbers and their sources out.
import { activeBuffs, activeCounters, activeStats, buffMatches, cardBuffs, findCharacter, type ActiveBuff, type ActiveStat, type Source } from './buffs'
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
  /** 1-based hit number across the build's whole attack list. */
  globalHit: number
  hitNo: number
  /** The card's %: the base when a potential upgrade applies, otherwise as shown in-game. */
  cardPct: number
  /** Basic / Signature Card Upgrade potential (card % x this); null for cards without one. */
  potential: Factor | null
  /** Base % buffs, added to the card % after the potential (null: none). */
  basePct: Factor | null
  multFactor: Factor
  additive: Factor
  weakness: Factor | null
  vulnerable: Factor | null
  enemyDr: Factor | null
  weaknessDebuff: Factor | null
  ravaged: Factor | null
  /** Card % as shown in hand: (card % x Mult + Add), without the buffs that need a target (owner, 2026-10-25). */
  inHand: number
  /** Card % when targeting the enemy: everything up to here (Weakness DMG, Vulnerable, Ravaged...). */
  cardMult: number
  /** ATK, or ATK x 0.3 + DEF x 2.1 for DEF cards. */
  stat: Factor
  constant: number
  elemDmg: Factor | null
  mechDmg: Factor | null
  enemyDef: Factor | null
  /** Final damage buffs: x (1 + their sum). */
  final: Factor | null
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
  /** Position in the build's attack list (0-based). */
  index: number
  hits: Hit[]
  /** Per-play counter stacks (Ember, Spirit of the Aromata...) set on this play, capped by max stacks; only those above 0. */
  counters: { name: string; stacks: number }[]
  vulnerable: boolean
  weaknessDebuff: boolean
  /** Fixed damage an earlier card (Rossweisse's Ego skill) adds to this play: a share of its damage, included in the totals. */
  followUp?: FollowUp
  nonCrit: number
  crit: number
  expected: number
}

export interface FollowUp {
  /** The card that set it up. */
  from: string
  share: number
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
  if (p.upgrade !== undefined) return p.upgrade ?? undefined
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

/** The % the game shows on a card for a base % (1 = 100%): raised by the card's potential and the Card % buffs that match it. */
export function shownPct(base: number, card: Card, build: Build, ch: CharacterPreset | undefined, buffs: ActiveBuff[],
  settings: Settings): number {
  if (card.scaling === 'Fixed' && !settings.potentialFixed) return base
  const potential = potentialFactor(card.upgrade, build, ch, settings)
  if (!potential) return base
  const cb = cardBuffs(buffs.filter((b) => !b.counter), card)
  const cardPct = [...cb.cardPct.all.sources, ...cb.cardPct.first.sources].reduce((a, s) => a + s.value, 0)
  return base * potential.value * (1 + cardPct)
}

/** The card as played: the play's own hit count, if set, replaces the card's. */
export function playCard(card: Card, play: RotationPlay): Card {
  return play.hits === undefined ? card : { ...card, hits: play.hits }
}

/** Damage of every hit of every play in the build's attack list. */
export function computeBuild(presets: Presets, charName: string, cs: CharacterSave, build: Build, settings: Settings): BuildResult {
  const stats = finalStats(presets, charName, cs, build, settings)
  const buffs = activeBuffs(presets, charName, cs, build, settings)
  const fixedBuffs = buffs.filter((b) => !b.counter)
  const counterBuffs = buffs.filter((b) => b.counter)
  const counterCaps = activeCounters(buffs)
  const ch = findCharacter(presets, charName)
  const cards = new Map(cs.cards.map((c) => [c.id, c]))
  const plays: Play[] = []
  let k = 0
  let pending: { from: string; appliesTo: string; share: number } | null = null
  // Snapshot (owner, 2026-10-26): every switched-on buff counts on every hit; each play sets its own debuffs and counter stacks
  ;(build.rotation ?? []).forEach((play, index) => {
    const base = cards.get(play.cardId)
    if (!base) return
    // A per-play hit count also counts for '2+ hits' buffs, so it's buffed as its own card
    const card = playCard(base, play)
    const hitCount = Math.max(0, Math.floor(card.hits))
    const counters = counterCaps.map(({ name, max }) => ({ name, stacks: Math.min(Math.max(0, play.stacks?.[name] ?? 0), max ?? Infinity) }))
    const live: ActiveBuff[] = counterBuffs.map((b) => ({ ...b, stacks: counters.find((c) => c.name === b.counter)?.stacks ?? 0 }))
    const cb = cardBuffs([...fixedBuffs, ...live], card)
    const upgradable = !(card.scaling === 'Fixed' && !settings.potentialFixed)
    const potential = upgradable ? potentialFactor(card.upgrade, build, ch, settings) : null
    const hits: Hit[] = []
    for (let h = 1; h <= hitCount; h++) hits.push(computeHit(card, h, ++k, cb, potential, stats, build, play, settings))
    const sum = (f: (x: Hit) => number) => hits.reduce((a, x) => a + f(x), 0)
    const own = { nonCrit: sum((x) => x.nonCrit), crit: sum((x) => x.crit), expected: sum((x) => x.expected) }
    // Fixed damage set up by an earlier play: a share of this play's damage (crit or not), on the next matching card
    let followUp: FollowUp | undefined
    if (pending && buffMatches({ appliesTo: pending.appliesTo, condition: 'Always' }, card)) {
      const { from, share } = pending
      followUp = { from, share, nonCrit: own.nonCrit * share, crit: own.crit * share, expected: own.expected * share }
      pending = null
    }
    const fu = ch?.cards?.find((p) => p.id === base.preset)?.followUp
    if (fu) pending = { from: card.name, appliesTo: fu.appliesTo, share: fu.ego && (build.egoLevel ?? 0) >= fu.ego.level ? fu.ego.share : fu.share }
    plays.push({ card, index, hits, counters: counters.filter((c) => c.stacks > 0),
      vulnerable: !!play.vulnerable, weaknessDebuff: !!play.weaknessDebuff, followUp,
      nonCrit: own.nonCrit + (followUp?.nonCrit ?? 0), crit: own.crit + (followUp?.crit ?? 0),
      expected: own.expected + (followUp?.expected ?? 0) })
  })
  const sum = (f: (x: Play) => number) => plays.reduce((a, x) => a + f(x), 0)
  return { stats, plays, nonCrit: sum((x) => x.nonCrit), crit: sum((x) => x.crit), expected: sum((x) => x.expected) }
}

function computeHit(card: Card, hitNo: number, k: number, cb: ReturnType<typeof cardBuffs>, potential: Factor | null,
  stats: FinalStats, build: Build, play: RotationPlay, settings: Settings): Hit {
  const first = hitNo === 1
  // Card % buffs raise the base % like the card upgrade potentials, so only on cards entered at base %
  const cardPctSources = potential ? [...cb.cardPct.all.sources, ...(first ? cb.cardPct.first.sources : [])] : []
  if (potential && cardPctSources.length) {
    potential = {
      value: potential.value * (1 + cardPctSources.reduce((a, s) => a + s.value, 0)),
      sources: [...potential.sources, ...cardPctSources],
    }
  }
  const both = (b: { all: { sources: Source[] }; first: { sources: Source[] } }) => [...b.all.sources, ...(first ? b.first.sources : [])]
  const total = (sources: Source[]) => sources.reduce((a, s) => a + s.value, 0)
  const baseSources = both(cb.basePct)
  const basePct: Factor | null = baseSources.length ? { value: total(baseSources), sources: baseSources } : null
  const pct = card.pct * (potential?.value ?? 1) + (basePct?.value ?? 0)
  const finalSources = both(cb.final)
  const final: Factor | null = finalSources.length ? { value: 1 + total(finalSources), sources: finalSources } : null
  const multSources = [...cb.multiplicative.all.sources, ...(first ? cb.multiplicative.first.sources : [])]
  const combine = (sources: Source[]) => settings.multMode === 'Chained'
    ? sources.reduce((a, s) => a * (1 + s.value), 1)
    : 1 + sources.reduce((a, s) => a + s.value, 0)
  const multValue = combine(multSources)
  const addSources = [...cb.additive.all.sources, ...(first ? cb.additive.first.sources : [])]
  const additive = { value: addSources.reduce((a, s) => a + s.value, 0), sources: addSources }
  const inHand = pct * combine(multSources.filter((s) => !s.onTarget))
    + addSources.filter((s) => !s.onTarget).reduce((a, s) => a + s.value, 0)

  const weakApplies = card.weaknessApplies || cb.weaknessAttack.length > 0
  const weakness: Factor | null = weakApplies ? {
    value: stats.weaknessDmg.value * (1 + settings.extraWeakness),
    sources: [
      ...stats.weaknessDmg.sources,
      ...(card.weaknessApplies ? [] : cb.weaknessAttack.map((s) => ({ ...s, label: `Weakness Attack: ${s.label}` }))),
      ...(settings.extraWeakness ? [{ label: 'Extra weakness factor (Settings)', value: settings.extraWeakness, unit: '%' as const }] : []),
    ],
  } : null
  const vulnerable = play.vulnerable
    ? { value: 1 + settings.vulnerable, sources: [{ label: 'Vulnerable on the target (this play)', value: settings.vulnerable, unit: '%' as const }] }
    : null
  const enemyDr = build.enemyDr
    ? { value: 1 - build.enemyDr, sources: [{ label: 'Enemy damage reduction', value: build.enemyDr, unit: '%' as const }] }
    : null
  const weaknessDebuff = play.weaknessDebuff
    ? { value: 1 - settings.weaknessDebuff, sources: [{ label: 'Weakness debuff on you (this play)', value: settings.weaknessDebuff, unit: '%' as const }] }
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
      * (final?.value ?? 1)
    crit = nonCrit * critDmg
    expected = nonCrit * (1 + critRate * (critDmg - 1))
  }
  return {
    globalHit: k, hitNo, cardPct: card.pct, potential, basePct, multFactor: { value: multValue, sources: multSources }, additive,
    weakness, vulnerable, enemyDr, weaknessDebuff, ravaged, inHand, cardMult, stat, constant: settings.atkConstant,
    elemDmg, mechDmg, enemyDef, final, critDmg, critRate, critDmgSources, critRateSources, nonCrit, crit, expected,
  }
}

function round(n: number): string {
  return (Math.round(n * 10) / 10).toString()
}
