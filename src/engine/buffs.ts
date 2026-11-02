// Which stat boosts and buffs are active for a build, and which buffs match a card.
import { buildDeck, deckPresets, teammateDeck } from './deck'
import { CARD_TYPES } from './types'
import type {
  BuffEffect, BuffType, Build, Card, CardPreset, CharacterPreset, CharacterSave, Condition, Effect, FragmentSetPreset, HitScope, LiveBuild, PartnerPreset,
  Presets, ScreenStats, Settings, StatEffect, StatName, Switch,
} from './types'

/** Where a number came from, for the "tap a chip" breakdown. */
export interface Source {
  label: string
  value: number
  /** How the value is shown: '%' (fraction) or 'flat'. */
  unit: '%' | 'flat' | 'x'
  /** Only counts once the card targets the enemy (a 'Ravaged only' buff such as Ember, or an onTarget effect), so not in the in-hand card %. */
  onTarget?: boolean
}

/** Stat value as typed: '16%' -> 0.16, '74' -> 74, '+5%' -> 0.05. */
export function parseStatValue(text: string): number {
  const t = text.trim()
  if (!t) return 0
  const n = Number(t.replace(/[+%\s]/g, ''))
  if (!Number.isFinite(n)) return 0
  return t.includes('%') ? n / 100 : n
}

/** Buff value as typed: '+30%' -> 0.3, '30%' -> 0.3, '30' -> 0.3; 'Weakness Attack' -> 0. */
export function parseBuffValue(text: string): number {
  const n = Number(text.trim().replace(/[+%\s]/g, ''))
  return text.trim() && Number.isFinite(n) ? n / 100 : 0
}

/** Threshold stats kept as a share (0.6 = 60%), shown as a %. */
export const thresholdIsPct = (stat: BuffEffect['thresholdStat']) => stat === 'Critical Chance' || stat === 'Critical Damage' || stat === 'Extra Damage' || stat === 'Damage over Time'

/** A preset buff's value for its owner: its own value (0 below thresholdMin), plus its thresholdBonus when the owner's stats-screen Attack
 * (or Defense / Health / Critical Chance / Critical Damage / Extra Damage / Damage over Time, with thresholdStat) is above the threshold (once, or for every `every` above it up to `max`).
 * stats: the owner's ("If Mei Lin's Attack is 500 or higher"), not the receiver's; without them no threshold is met. */
export function presetBuffValue(e: BuffEffect, stats: ScreenStats | undefined): { value: number; bonus: boolean } {
  const atk = !stats ? -Infinity : e.thresholdStat === 'Defense' ? stats.defense : e.thresholdStat === 'Health' ? stats.health
    : e.thresholdStat === 'Critical Chance' ? stats.critChance : e.thresholdStat === 'Critical Damage' ? stats.critDmg
    : e.thresholdStat === 'Extra Damage' ? stats.extraDmg : e.thresholdStat === 'Damage over Time' ? stats.dotDmg : stats.attack
  if (e.thresholdMin !== undefined && atk < e.thresholdMin) return { value: 0, bonus: false }
  const ab = e.thresholdBonus
  const bonus = !!ab && (ab.orEqual ? atk >= ab.above : atk > ab.above)
  let extra = bonus ? parseBuffValue(ab!.value) : 0
  if (bonus && ab!.every) {
    extra *= Math.floor((atk - ab!.above) / ab!.every)
    if (ab!.max) extra = Math.min(extra, parseBuffValue(ab!.max))
  }
  return { value: parseBuffValue(e.value) + extra, bonus: extra > 0 }
}

/** '+X%' = Additive, 'X%' = Multiplicative (owner's rule), 'Weakness Attack' = Weakness DMG applies. */
export function buffType(text: string, override: BuffType | '' = ''): BuffType {
  if (override) return override
  const t = text.trim()
  if (t.toUpperCase() === 'WEAKNESS ATTACK') return 'Weakness Attack'
  return t.startsWith('+') ? 'Additive' : 'Multiplicative'
}

/** Effective stacks of a switch: true = default stacks, a number = that many, false/0 = off. */
export function switchStacks(sw: Switch | undefined, defaultStacks = 1): number {
  if (sw === true) return defaultStacks || 1
  if (typeof sw === 'number' && Number.isFinite(sw)) return Math.max(0, sw)
  return 0
}

export interface ActiveStat {
  label: string
  stat: StatName
  value: number
  stacks: number
  unit: '%' | 'flat'
}

export interface ActiveBuff {
  label: string
  type: BuffType
  value: number
  stacks: number
  appliesTo: string
  hitScope: HitScope
  condition: Condition
  /** Per-play counter that sets the stacks (filled in per play by the engine). */
  counter?: string
  maxStacks?: number
  /** See BuffEffect.onTarget. */
  onTarget?: boolean
}

/** Why a preset effect is (in)active for a build — shown greyed out in the UI. */
export interface PresetState {
  owner: string
  ownerKind: 'Character' | 'Partner' | 'Memory Fragment' | 'Card'
  effect: Effect
  /** Class-limited partner effect with a class mismatch. */
  classBlocked: boolean
  /** Stat already on the stats screen: shown for reference, not added. */
  onStatsScreen: boolean
  /** Needs a higher Manifest Ego level than the build has, or is replaced at the build's level (egoBelow). */
  egoLocked: boolean
  /** Comes from a Potential node that's switched off (Setup > Potentials). */
  nodeLocked: boolean
  /** The stats of whoever owns the effect, read by its thresholds; missing for a teammate without a linked build. */
  ownerStats?: ScreenStats
  stacks: number
  /** Card preset id, for effects of a library card. */
  cardId?: string
  /** Team slot (0-based) for a teammate's effect; undefined = the build's own character. */
  teammate?: number
  /** The teammate's character name (teammate effects only). */
  teammateName?: string
  /** Key in Build.presetSwitches. */
  key: string
}

export function findCharacter(presets: Presets, name: string): CharacterPreset | undefined {
  return presets.characters.find((c) => c.name === name)
}

export function findPartner(presets: Presets, name: string): PartnerPreset | undefined {
  return presets.partners.find((p) => p.name === name)
}

export function findFragmentSet(presets: Presets, name: string): FragmentSetPreset | undefined {
  return presets.fragmentSets.find((f) => f.name === name)
}

/** The build's distinct memory fragment sets (a set picked twice counts once). */
export function buildFragmentSets(presets: Presets, build: Build): FragmentSetPreset[] {
  return distinctSets(presets, build.fragments ?? [])
}

function distinctSets(presets: Presets, fragments: string[]): FragmentSetPreset[] {
  const names = [...new Set(fragments.filter(Boolean))]
  return names.map((n) => findFragmentSet(presets, n)).filter((f): f is FragmentSetPreset => !!f)
}

/** Fragment pieces the build's picked sets use (every pick counts, so a set picked twice is over-counted on purpose). */
export function fragmentPiecesUsed(presets: Presets, build: Build): number {
  return (build.fragments ?? []).reduce((n, name) => n + (findFragmentSet(presets, name)?.pieces ?? 0), 0)
}

/** Key of a preset effect in Build.presetSwitches. */
export function presetKey(owner: string, effect: Effect): string {
  return `${owner}|${effect.id}`
}

/** Key of a teammate's preset effect: prefixed with the teammate, so the same partner or set on two characters keeps two switches. */
export function teamKey(teammate: string, owner: string, effect: Effect): string {
  return `${teammate}>${presetKey(owner, effect)}`
}

/** The build has at least one teammate picked. */
export function hasTeam(build: Pick<Build, 'team'>): boolean {
  return (build.team ?? []).some((t) => !!t.character)
}

/** Effects of a teammate that reach the build's character: ally buffs and enemy debuffs. */
export function reachesTeam(e: Effect): boolean {
  return e.target === 'allies' || e.target === 'enemy'
}

/** Label prefix of a preset state: the owner, or 'Teammate › owner' for a teammate's partner, set or card. */
export function stateLabel(s: Pick<PresetState, 'owner' | 'teammateName'>): string {
  return s.teammateName && s.teammateName !== s.owner ? `${s.teammateName} › ${s.owner}` : s.owner
}

/** Whose effects are being listed: their Manifest Ego level, stats and Potential nodes. */
interface Who {
  ego: number
  stats?: ScreenStats
  nodes?: Build['potentialNodes']
}

/** The preset effects of the build's character, partner, memory fragment sets and deck cards, with their switch state;
 * then each teammate's ally / enemy effects (character, partner, sets, deck cards). */
export function presetStates(presets: Presets, charName: string, build: LiveBuild): PresetState[] {
  const out: PresetState[] = []
  const add = (owner: string, ownerKind: PresetState['ownerKind'], effects: Effect[], blocked: (e: Effect) => boolean,
    who: Who, cardId?: string, team?: { slot: number; name: string }) => {
    const ego = who.ego
    for (const e of effects) {
      if (team && !reachesTeam(e)) continue
      const key = team ? teamKey(team.name, owner, e) : presetKey(owner, e)
      const sw = build.presetSwitches[key]
      const classBlocked = blocked(e)
      // On the stats screen means the build's own screen; a teammate's ally stat isn't on it
      const onStatsScreen = !team && e.kind === 'Stat' && !!e.onStatsScreen
      const egoLocked = (e.egoLevel ?? 0) > ego || (e.egoBelow !== undefined && ego >= e.egoBelow)
      const nodeLocked = e.node !== undefined && who.nodes?.[e.node] === false
      const stacks = classBlocked || onStatsScreen || egoLocked || nodeLocked ? 0 : switchStacks(sw === undefined ? true : sw, e.defaultStacks)
      out.push({ owner, ownerKind, effect: e, classBlocked, onStatsScreen, egoLocked, nodeLocked, ownerStats: who.stats, stacks, cardId, key,
        ...(team ? { teammate: team.slot, teammateName: team.name } : {}) })
    }
  }
  const addAll = (ch: CharacterPreset | undefined, partner: string, fragments: string[], who: Who, cardPresets: CardPreset[],
    team?: { slot: number; name: string }) => {
    if (ch) add(ch.name, 'Character', ch.effects, () => false, who, undefined, team)
    const p = partner ? findPartner(presets, partner) : undefined
    if (p) add(p.name, 'Partner', p.effects, (e) => !!e.classLimited && p.class !== ch?.class, who, undefined, team)
    for (const f of distinctSets(presets, fragments)) add(f.name, 'Memory Fragment', f.effects, () => false, who, undefined, team)
    for (const c of cardPresets) add(c.name, 'Card', c.effects ?? [], () => false, who, c.id, team)
  }
  const ch = findCharacter(presets, charName)
  addAll(ch, build.partner, build.fragments ?? [], { ego: build.egoLevel ?? 0, stats: build.stats, nodes: build.potentialNodes }, deckPresets(buildDeck(ch, build)))
  ;(build.team ?? []).forEach((t, slot) => {
    if (!t.character || t.character === charName) return
    const tch = findCharacter(presets, t.character)
    addAll(tch, t.partner, t.fragments ?? [], { ego: t.egoLevel ?? 0, stats: t.live?.stats, nodes: t.live?.potentialNodes },
      deckPresets(teammateDeck(tch, t)), { slot, name: t.character })
  })
  return out
}

/** Stat boosts active for the build: preset stat effects, then the owner's own boosts. */
export function activeStats(presets: Presets, charName: string, cs: CharacterSave, build: LiveBuild): ActiveStat[] {
  const out: ActiveStat[] = []
  for (const s of presetStates(presets, charName, build)) {
    if (s.effect.kind !== 'Stat' || s.stacks <= 0) continue
    const e = s.effect as StatEffect
    out.push({ label: `${stateLabel(s)}: ${e.name}`, stat: e.stat, value: parseStatValue(e.value), stacks: s.stacks,
      unit: e.value.includes('%') ? '%' : 'flat' })
  }
  for (const b of cs.boosts) {
    const stacks = switchStacks(b.switches[build.id])
    if (stacks <= 0) continue
    out.push({ label: b.source || b.stat, stat: b.stat, value: parseStatValue(b.value), stacks,
      unit: b.value.includes('%') ? '%' : 'flat' })
  }
  return out
}

/** Buffs active for the build: Morale, preset buffs, then the owner's own buffs (max stacks applied). */
export function activeBuffs(presets: Presets, charName: string, cs: CharacterSave, build: LiveBuild, settings: Settings): ActiveBuff[] {
  const out: ActiveBuff[] = []
  const morale = Math.min(Math.max(0, build.morale || 0), settings.moraleMax)
  if (morale > 0) {
    out.push({ label: 'Morale', type: 'Additive', value: settings.moralePerStack, stacks: morale,
      appliesTo: 'ALL', hitScope: 'All hits', condition: 'Always' })
  }
  for (const s of presetStates(presets, charName, build)) {
    if (s.effect.kind !== 'Buff' || s.stacks <= 0) continue
    const e = s.effect as BuffEffect
    const v = presetBuffValue(e, s.ownerStats)
    const above = e.thresholdBonus && thresholdIsPct(e.thresholdStat) ? `${Math.round(e.thresholdBonus.above * 100)}%` : e.thresholdBonus?.above
    out.push({ label: `${stateLabel(s)}: ${e.name}${v.bonus ? ` (${e.thresholdStat ?? 'Attack'} ${e.thresholdBonus!.orEqual ? `${above}+` : `above ${above}`})` : ''}`,
      type: buffType(e.value, e.type), value: v.value,
      stacks: e.counter ? 0 : e.maxStacks ? Math.min(s.stacks, e.maxStacks) : s.stacks,
      appliesTo: e.appliesTo, hitScope: e.hitScope, condition: e.condition,
      ...(e.counter ? { counter: e.counter, maxStacks: e.maxStacks } : {}), ...(e.onTarget ? { onTarget: true } : {}) })
  }
  for (const b of cs.buffs) {
    const st = switchStacks(b.switches[build.id])
    if (st <= 0) continue
    out.push({ label: b.source || b.value, type: buffType(b.value, b.typeOverride), value: parseBuffValue(b.value),
      stacks: b.maxStacks ? Math.min(st, b.maxStacks) : st,
      appliesTo: b.appliesTo, hitScope: b.hitScope, condition: b.condition })
  }
  return out
}

/** A number set on each play. amount: it holds an amount the damage is worked out from (Maribell's Shield owned), typed in, not a few stacks. */
export interface PlayCounter {
  name: string
  max: number | null
  amount?: boolean
}

/** Per-play counters of the switched-on buffs, with the highest max stacks of the buffs reading each (none if one of them has no max):
 * each buff still stops at its own (Beryl's Times Retained: Charged Shot IV at 1, the others go on). A Flat buff's counter is an amount. */
export function activeCounters(buffs: ActiveBuff[]): PlayCounter[] {
  const out = new Map<string, PlayCounter>()
  for (const b of buffs) {
    if (!b.counter) continue
    const prev = out.get(b.counter)
    const own = b.maxStacks || null
    const max = !prev ? own : prev.max === null || own === null ? null : Math.max(prev.max, own)
    out.set(b.counter, { name: b.counter, max, ...(prev?.amount || b.type === 'Flat' ? { amount: true } : {}) })
  }
  return [...out.values()]
}

const norm = (s: string) => s.replace(/\s/g, '').toLowerCase()

/** One "Applies to" word: ALL, the card name, a tag, the card type (Attack / Skill / Upgrade), the element, the card kind (DoT / Extra Attack),
 * Defense-Based (DEF cards), 'N-cost', 'N+ cost' or 'N+ hits'. */
function termMatches(term: string, card: Card, tags: string[]): boolean {
  if (term === 'all' || term === norm(card.name) || tags.includes(term)) return true
  if (term === norm(card.element ?? '')) return true
  // An effect's hit (Mark, Coordinated Attack) isn't a card being played: it has no card type
  if (CARD_TYPES.some((t) => term === norm(t))) return !card.notACard && term === norm(card.cardType ?? '')
  if (card.kind !== 'Normal' && term === norm(card.kind)) return true
  if (term === 'defense-based') return card.scaling === 'DEF'
  const cost = /^(\d+)-cost$/.exec(term)
  if (cost) return card.cost === Number(cost[1])
  const min = /^(\d+)\+(hits?|cost)$/.exec(term)
  if (!min) return false
  if (min[2] === 'cost') return card.cost !== null && card.cost >= Number(min[1])
  return card.hits >= Number(min[1])
}

/** "Applies to" (case-insensitive): words joined by '&' must all match; '/' between words means any of them. */
export function buffMatches(buff: Pick<ActiveBuff, 'appliesTo' | 'condition'>, card: Card): boolean {
  const target = norm(buff.appliesTo)
  if (!target) return false
  if (buff.condition === 'Ravaged only' && !card.targetRavaged) return false
  if (target === norm(card.name)) return true
  const tags = card.tags.split(',').map(norm).filter(Boolean)
  return target.split('&').every((all) => all.split('/').some((any) => termMatches(any, card, tags)))
}

export interface Bucket {
  value: number
  sources: Source[]
}

export interface CardBuffs {
  additive: { all: Bucket; first: Bucket }
  multiplicative: { all: Bucket; first: Bucket }
  weaknessAttack: Source[]
  /** Crit Chance / Crit DMG buffs on this card only (fractions added to the final stat). */
  critRate: { all: Bucket; first: Bucket }
  critDmg: { all: Bucket; first: Bucket }
  /** Card % buffs (raise the card's base %, like potentials). */
  cardPct: { all: Bucket; first: Bucket }
  /** Card + buffs (added to the card's base %, before potentials). */
  cardAdd: { all: Bucket; first: Bucket }
  /** Base % buffs (added to the card % after the potential). */
  basePct: { all: Bucket; first: Bucket }
  /** Final damage buffs (their own multiplier). */
  final: { all: Bucket; first: Bucket }
  /** Flat buffs: damage, not fractions (value x the counter's number). */
  flat: { all: Bucket; first: Bucket }
}

/** Sum the buffs that match a card into additive / multiplicative buckets (all hits vs first hit only). */
export function cardBuffs(buffs: ActiveBuff[], card: Card): CardBuffs {
  const b = (): Bucket => ({ value: 0, sources: [] })
  const out: CardBuffs = { additive: { all: b(), first: b() }, multiplicative: { all: b(), first: b() }, weaknessAttack: [],
    critRate: { all: b(), first: b() }, critDmg: { all: b(), first: b() }, cardPct: { all: b(), first: b() },
    cardAdd: { all: b(), first: b() }, basePct: { all: b(), first: b() }, final: { all: b(), first: b() }, flat: { all: b(), first: b() } }
  for (const buff of buffs) {
    if (buff.stacks <= 0 || !buffMatches(buff, card)) continue
    const label = buff.stacks !== 1 ? `${buff.label} x${buff.stacks}` : buff.label
    if (buff.type === 'Weakness Attack') {
      out.weaknessAttack.push({ label, value: 0, unit: 'x' })
      continue
    }
    const v = buff.value * buff.stacks
    const group = { Additive: out.additive, Multiplicative: out.multiplicative, 'Crit Chance': out.critRate, 'Crit DMG': out.critDmg,
      'Card %': out.cardPct, 'Card +': out.cardAdd, 'Base %': out.basePct, Final: out.final, Flat: out.flat }[buff.type]
    const bucket = group[buff.hitScope === 'First hit only' ? 'first' : 'all']
    bucket.value += v
    bucket.sources.push({ label: buff.hitScope === 'First hit only' ? `${label} (first hit)` : label, value: v, unit: '%',
      ...(buff.condition === 'Ravaged only' || buff.onTarget ? { onTarget: true } : {}) })
  }
  return out
}
