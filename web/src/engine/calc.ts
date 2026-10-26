// The damage formula (docs/FORMULA.md). Pure functions: inputs in, numbers and their sources out.
import { activeBuffs, activeStats, cardBuffs, findCharacter, type ActiveStat, type Source } from './buffs'
import type { Build, Card, CharacterSave, Presets, RotationPlay, Settings, StatName } from './types'

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
  cardPct: number
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

/** The card as played: the play's own hit count, if set, replaces the card's. */
export function playCard(card: Card, play: RotationPlay): Card {
  return play.hits === undefined ? card : { ...card, hits: play.hits }
}

/** Damage of every hit of every play in the rotation, for one build. */
export function computeBuild(presets: Presets, charName: string, cs: CharacterSave, build: Build, settings: Settings): BuildResult {
  const stats = finalStats(presets, charName, cs, build, settings)
  const buffs = activeBuffs(presets, charName, cs, build, settings)
  const cards = new Map(cs.cards.map((c) => [c.id, c]))
  const perCard = new Map<string, ReturnType<typeof cardBuffs>>()
  const plays: Play[] = []
  let k = 0
  cs.rotation.forEach((play, index) => {
    const base = cards.get(play.cardId)
    if (!base) return
    // A per-play hit count also counts for '2+ hits' buffs, so it's buffed as its own card
    const card = playCard(base, play)
    const key = `${card.id}|${card.hits}`
    let cb = perCard.get(key)
    if (!cb) perCard.set(key, (cb = cardBuffs(buffs, card)))
    const hits: Hit[] = []
    for (let h = 1; h <= Math.max(0, Math.floor(card.hits)); h++) {
      k++
      hits.push(computeHit(card, h, k, cb, stats, build, settings))
    }
    const sum = (f: (x: Hit) => number) => hits.reduce((a, x) => a + f(x), 0)
    plays.push({ card, index, hits, nonCrit: sum((x) => x.nonCrit), crit: sum((x) => x.crit), expected: sum((x) => x.expected) })
  })
  const sum = (f: (x: Play) => number) => plays.reduce((a, x) => a + f(x), 0)
  return { stats, plays, nonCrit: sum((x) => x.nonCrit), crit: sum((x) => x.crit), expected: sum((x) => x.expected) }
}

function computeHit(card: Card, hitNo: number, k: number, cb: ReturnType<typeof cardBuffs>, stats: FinalStats,
  build: Build, settings: Settings): Hit {
  const first = hitNo === 1
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
  const cardMult = (card.pct * multValue + additive.value) * (weakness?.value ?? 1) * (vulnerable?.value ?? 1)
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
    nonCrit = crit = expected = card.pct   // Fixed damage ignores every multiplier and can't crit (Unconfirmed)
  } else {
    nonCrit = cardMult * stat.value * settings.atkConstant * (elemDmg?.value ?? 1) * (mechDmg?.value ?? 1) * (enemyDef?.value ?? 1)
    crit = nonCrit * critDmg
    expected = nonCrit * (1 + critRate * (critDmg - 1))
  }
  return {
    globalHit: k, hitNo, cardPct: card.pct, multFactor: { value: multValue, sources: multSources }, additive,
    weakness, vulnerable, enemyDr, weaknessDebuff, ravaged, cardMult, stat, constant: settings.atkConstant,
    elemDmg, mechDmg, enemyDef, critDmg, critRate, critDmgSources, critRateSources, nonCrit, crit, expected,
  }
}

function round(n: number): string {
  return (Math.round(n * 10) / 10).toString()
}
