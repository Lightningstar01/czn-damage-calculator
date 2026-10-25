// Which stat boosts and buffs are active for a build, and which buffs match a card.
import type {
  BuffEffect, BuffType, Build, Card, CharacterPreset, CharacterSave, Condition, Effect, FragmentSetPreset, HitScope, PartnerPreset,
  Presets, Settings, StatEffect, StatName, Switch,
} from './types'

/** Where a number came from, for the "tap a chip" breakdown. */
export interface Source {
  label: string
  value: number
  /** How the value is shown: '%' (fraction) or 'flat'. */
  unit: '%' | 'flat' | 'x'
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
}

/** Why a preset effect is (in)active for a build — shown greyed out in the UI. */
export interface PresetState {
  owner: string
  ownerKind: 'Character' | 'Partner' | 'Memory Fragment'
  effect: Effect
  /** Class-limited partner effect with a class mismatch. */
  classBlocked: boolean
  /** Stat already on the stats screen: shown for reference, not added. */
  onStatsScreen: boolean
  stacks: number
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
  const names = [...new Set((build.fragments ?? []).filter(Boolean))]
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

/** The preset effects of the build's character, partner and memory fragment sets, with their switch state. */
export function presetStates(presets: Presets, charName: string, build: Build): PresetState[] {
  const out: PresetState[] = []
  const ch = findCharacter(presets, charName)
  const add = (owner: string, ownerKind: PresetState['ownerKind'], effects: Effect[], blocked: (e: Effect) => boolean) => {
    for (const e of effects) {
      const sw = build.presetSwitches[presetKey(owner, e)]
      const classBlocked = blocked(e)
      const onStatsScreen = e.kind === 'Stat' && !!e.onStatsScreen
      const stacks = classBlocked || onStatsScreen ? 0 : switchStacks(sw === undefined ? true : sw, e.defaultStacks)
      out.push({ owner, ownerKind, effect: e, classBlocked, onStatsScreen, stacks })
    }
  }
  if (ch) add(ch.name, 'Character', ch.effects, () => false)
  const p = build.partner ? findPartner(presets, build.partner) : undefined
  if (p) add(p.name, 'Partner', p.effects, (e) => !!e.classLimited && p.class !== ch?.class)
  for (const f of buildFragmentSets(presets, build)) add(f.name, 'Memory Fragment', f.effects, () => false)
  return out
}

/** Stat boosts active for the build: preset stat effects, then the owner's own boosts. */
export function activeStats(presets: Presets, charName: string, cs: CharacterSave, build: Build): ActiveStat[] {
  const out: ActiveStat[] = []
  for (const s of presetStates(presets, charName, build)) {
    if (s.effect.kind !== 'Stat' || s.stacks <= 0) continue
    const e = s.effect as StatEffect
    out.push({ label: `${s.owner}: ${e.name}`, stat: e.stat, value: parseStatValue(e.value), stacks: s.stacks,
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
export function activeBuffs(presets: Presets, charName: string, cs: CharacterSave, build: Build, settings: Settings): ActiveBuff[] {
  const out: ActiveBuff[] = []
  const morale = Math.min(Math.max(0, build.morale || 0), settings.moraleMax)
  if (morale > 0) {
    out.push({ label: 'Morale', type: 'Additive', value: settings.moralePerStack, stacks: morale,
      appliesTo: 'ALL', hitScope: 'All hits', condition: 'Always' })
  }
  for (const s of presetStates(presets, charName, build)) {
    if (s.effect.kind !== 'Buff' || s.stacks <= 0) continue
    const e = s.effect as BuffEffect
    out.push({ label: `${s.owner}: ${e.name}`, type: buffType(e.value, e.type), value: parseBuffValue(e.value),
      stacks: e.maxStacks ? Math.min(s.stacks, e.maxStacks) : s.stacks,
      appliesTo: e.appliesTo, hitScope: e.hitScope, condition: e.condition })
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

const norm = (s: string) => s.replace(/\s/g, '').toLowerCase()

/** One "Applies to" word: ALL, the card name, a tag, the card kind (DoT / Extra Attack), 'N+ hits', or 'N+ cost' (vs tags like '2-cost'). */
function termMatches(term: string, card: Card, tags: string[]): boolean {
  if (term === 'all' || term === norm(card.name) || tags.includes(term)) return true
  if (card.kind !== 'Normal' && term === norm(card.kind)) return true
  const min = /^(\d+)\+(hits?|cost)$/.exec(term)
  if (!min) return false
  if (min[2] === 'cost') return tags.some((t) => { const c = /^(\d+)-cost$/.exec(t); return !!c && Number(c[1]) >= Number(min[1]) })
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
}

/** Sum the buffs that match a card into additive / multiplicative buckets (all hits vs first hit only). */
export function cardBuffs(buffs: ActiveBuff[], card: Card): CardBuffs {
  const b = (): Bucket => ({ value: 0, sources: [] })
  const out: CardBuffs = { additive: { all: b(), first: b() }, multiplicative: { all: b(), first: b() }, weaknessAttack: [],
    critRate: { all: b(), first: b() }, critDmg: { all: b(), first: b() } }
  for (const buff of buffs) {
    if (!buffMatches(buff, card)) continue
    const label = buff.stacks !== 1 ? `${buff.label} x${buff.stacks}` : buff.label
    if (buff.type === 'Weakness Attack') {
      out.weaknessAttack.push({ label, value: 0, unit: 'x' })
      continue
    }
    const v = buff.value * buff.stacks
    const group = { Additive: out.additive, Multiplicative: out.multiplicative, 'Crit Chance': out.critRate, 'Crit DMG': out.critDmg }[buff.type]
    const bucket = group[buff.hitScope === 'First hit only' ? 'first' : 'all']
    bucket.value += v
    bucket.sources.push({ label: buff.hitScope === 'First hit only' ? `${label} (first hit)` : label, value: v, unit: '%' })
  }
  return out
}
