// Which stat boosts and buffs are active for a build, and which buffs match a card.
import type {
  BuffEffect, BuffType, Build, Card, CharacterPreset, CharacterSave, Condition, Effect, HitScope, PartnerPreset,
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
  ownerKind: 'Character' | 'Partner'
  effect: Effect
  /** Class-limited partner effect with a class mismatch. */
  classBlocked: boolean
  stacks: number
}

export function findCharacter(presets: Presets, name: string): CharacterPreset | undefined {
  return presets.characters.find((c) => c.name === name)
}

export function findPartner(presets: Presets, name: string): PartnerPreset | undefined {
  return presets.partners.find((p) => p.name === name)
}

/** Key of a preset effect in Build.presetSwitches. */
export function presetKey(owner: string, effect: Effect): string {
  return `${owner}|${effect.id}`
}

/** The preset effects of the build's character and partner, with their switch state. */
export function presetStates(presets: Presets, charName: string, build: Build): PresetState[] {
  const out: PresetState[] = []
  const ch = findCharacter(presets, charName)
  const add = (owner: string, ownerKind: PresetState['ownerKind'], effects: Effect[], blocked: (e: Effect) => boolean) => {
    for (const e of effects) {
      const sw = build.presetSwitches[presetKey(owner, e)]
      const classBlocked = blocked(e)
      const stacks = classBlocked ? 0 : switchStacks(sw === undefined ? true : sw, e.defaultStacks)
      out.push({ owner, ownerKind, effect: e, classBlocked, stacks })
    }
  }
  if (ch) add(ch.name, 'Character', ch.effects, () => false)
  const p = build.partner ? findPartner(presets, build.partner) : undefined
  if (p) add(p.name, 'Partner', p.effects, (e) => !!e.classLimited && p.class !== ch?.class)
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
    out.push({ label: `${s.owner}: ${e.name}`, type: buffType(e.value), value: parseBuffValue(e.value),
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

/** "Applies to" matches ALL, the exact card name, or one of the card's comma-separated tags (case-insensitive). */
export function buffMatches(buff: Pick<ActiveBuff, 'appliesTo' | 'condition'>, card: Card): boolean {
  const target = buff.appliesTo.replace(/\s/g, '').toLowerCase()
  if (!target) return false
  if (buff.condition === 'Ravaged only' && !card.targetRavaged) return false
  if (target === 'all' || target === card.name.replace(/\s/g, '').toLowerCase()) return true
  return card.tags.split(',').some((t) => t.replace(/\s/g, '').toLowerCase() === target)
}

export interface Bucket {
  value: number
  sources: Source[]
}

export interface CardBuffs {
  additive: { all: Bucket; first: Bucket }
  multiplicative: { all: Bucket; first: Bucket }
  weaknessAttack: Source[]
}

/** Sum the buffs that match a card into additive / multiplicative buckets (all hits vs first hit only). */
export function cardBuffs(buffs: ActiveBuff[], card: Card): CardBuffs {
  const b = (): Bucket => ({ value: 0, sources: [] })
  const out: CardBuffs = { additive: { all: b(), first: b() }, multiplicative: { all: b(), first: b() }, weaknessAttack: [] }
  for (const buff of buffs) {
    if (!buffMatches(buff, card)) continue
    const label = buff.stacks !== 1 ? `${buff.label} x${buff.stacks}` : buff.label
    if (buff.type === 'Weakness Attack') {
      out.weaknessAttack.push({ label, value: 0, unit: 'x' })
      continue
    }
    const v = buff.value * buff.stacks
    const bucket = (buff.type === 'Additive' ? out.additive : out.multiplicative)[buff.hitScope === 'First hit only' ? 'first' : 'all']
    bucket.value += v
    bucket.sources.push({ label: buff.hitScope === 'First hit only' ? `${label} (first hit)` : label, value: v, unit: '%' })
  }
  return out
}
