// One line of small chips for a buff or stat boost, in the formula strip's colors (value) and grey (what it applies to, conditions).
import { buffType, parseStatValue, statIsPct } from '../engine/buffs'
import type { BuffType, Condition, EffectTarget, HitScope, StatName } from '../engine/types'
import type { ChipGroup } from './FormulaStrip'
import { num, pct } from './format'

export interface Pill {
  text: string
  group: ChipGroup
}

const STAT_GROUP: Record<StatName, ChipGroup> = {
  'ATK%': 'stat', 'Flat ATK': 'stat', 'DEF%': 'stat', 'Flat DEF': 'stat', 'Crit Rate': 'crit', 'Crit DMG': 'crit',
  'Weakness DMG': 'weak', 'Elemental DMG%': 'elem', 'Extra DMG%': 'elem', 'DoT DMG%': 'elem',
}
const STAT_LABEL: Partial<Record<StatName, string>> = {
  'ATK%': 'ATK', 'Flat ATK': 'ATK', 'DEF%': 'DEF', 'Flat DEF': 'DEF', 'Crit Rate': 'Crit Chance', 'Elemental DMG%': 'Element DMG',
  'Extra DMG%': 'Extra DMG', 'DoT DMG%': 'DoT DMG',
}
const TARGET_PILL: Record<EffectTarget, string> = { self: '', allies: 'all allies', enemy: 'on the enemy' }

export function statPill(stat: StatName, value: string): Pill {
  const v = parseStatValue(stat, value)
  const shown = statIsPct(stat) ? pct(v) : `+${num(v, 1)}`
  return { text: `${shown} ${STAT_LABEL[stat] ?? stat}`, group: STAT_GROUP[stat] }
}

export function buffPill(value: string, type: BuffType): Pill {
  switch (type) {
    case 'Additive': return { text: `${value} Add`, group: 'add' }
    case 'Multiplicative': return { text: `${value} Mult`, group: 'mult' }
    case 'Weakness Attack': return { text: 'Weakness DMG applies', group: 'weak' }
    case 'Weakness DMG': return { text: `${value} Weakness DMG`, group: 'weak' }
    case 'Card %': return { text: `${value} Card %`, group: 'card' }
    case 'Card +': return { text: `${value} card`, group: 'card' }
    case 'Base %': return { text: `${value} base`, group: 'card' }
    case 'Final': return { text: `${value} Final`, group: 'mult' }
    case 'Flat': return { text: `${value} of the number, as damage`, group: 'card' }
    default: return { text: `${value} ${type}`, group: 'crit' }
  }
}

/** The grey chips after the value: what it applies to, hit scope, condition, stacks, target, hint. */
export function conditionPills(b: {
  appliesTo: string; hitScope: HitScope; condition: Condition; maxStacks?: number | null; counter?: string
  target?: EffectTarget; hint?: string; from?: string
}): Pill[] {
  const grey = (text: string): Pill => ({ text, group: 'const' })
  const stacks = b.counter ? `per stack${b.maxStacks ? ` (max ${b.maxStacks})` : ''}, set per play`
    : b.maxStacks && b.maxStacks > 1 ? `per stack (max ${b.maxStacks})` : ''
  return [
    grey(b.appliesTo === 'ALL' ? 'All cards' : b.appliesTo || 'no cards'),
    ...(b.hitScope === 'First hit only' ? [grey('first hit')] : []),
    ...(b.condition === 'Ravaged only' ? [{ text: 'vs Ravaged', group: 'weak' as const }] : []),
    ...(stacks ? [grey(stacks)] : []),
    ...(b.target && TARGET_PILL[b.target] ? [grey(TARGET_PILL[b.target])] : []),
    ...(b.hint ? [grey(b.hint)] : []),
    ...(b.from ? [grey(`from ${b.from}`)] : []),
  ]
}

export function ownBuffPills(x: { value: string; typeOverride: BuffType | '' } & Parameters<typeof conditionPills>[0]): Pill[] {
  return [buffPill(x.value || '—', buffType(x.value, x.typeOverride)), ...conditionPills(x)]
}

export function Pills({ pills }: { pills: Pill[] }) {
  return (
    <div className="pills">
      {pills.map((p, i) => <span key={i} className={`pill g-${p.group}`}>{p.text}</span>)}
    </div>
  )
}
