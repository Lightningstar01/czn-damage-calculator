// Color-coded formula of one hit: each multiplier is a chip; tap a chip to see where it comes from.
import { Fragment, useState } from 'react'
import type { Source } from '../engine/buffs'
import type { Factor, Hit } from '../engine/calc'
import type { Card } from '../engine/types'
import { num, pct, times } from './format'

export type ChipGroup = 'card' | 'add' | 'mult' | 'weak' | 'enemy' | 'stat' | 'elem' | 'const' | 'crit' | 'result'

export const LEGEND: { group: ChipGroup; label: string }[] = [
  { group: 'card', label: 'Card %' },
  { group: 'mult', label: 'Multiplicative buffs' },
  { group: 'add', label: 'Additive buffs' },
  { group: 'weak', label: 'Weakness DMG' },
  { group: 'enemy', label: 'Enemy / debuffs' },
  { group: 'stat', label: 'ATK / DEF' },
  { group: 'elem', label: 'Element / Extra / DoT' },
  { group: 'crit', label: 'Crit' },
]

interface Chip {
  key: string
  op: '' | '×' | '+'
  group: ChipGroup
  label: string
  value: string
  sources?: Source[]
  note?: string
}

function sourceText(s: Source): string {
  if (s.unit === '%') return `${s.value >= 0 ? '+' : ''}${pct(s.value)}`
  if (s.unit === 'x') return s.value ? times(s.value) : ''
  return `${s.value >= 0 ? '+' : ''}${num(s.value, 1)}`
}

function factorChip(key: string, group: ChipGroup, label: string, f: Factor | null, note?: string): Chip | null {
  return f ? { key, op: '×', group, label, value: times(f.value), sources: f.sources, note } : null
}

function potentialChip(f: Factor, note: string): Chip {
  return { key: 'pot', op: '×', group: 'card', label: 'Potential', value: times(f.value), sources: f.sources, note }
}

function chipsFor(hit: Hit, card: Card): { inner: Chip[]; outer: Chip[] } {
  if (card.scaling === 'Fixed') {
    return { inner: [], outer: [
      { key: 'fixed', op: '', group: 'card', label: 'Fixed', value: num(card.pct), note: 'Fixed damage ignores every multiplier and crit.' },
      ...(hit.potential ? [potentialChip(hit.potential, 'Potential upgrades apply to Fixed damage (Settings).')] : []),
    ] }
  }
  const inner: Chip[] = [{ key: 'card', op: '', group: 'card', label: card.name || 'Card', value: pct(hit.cardPct, 2),
    note: hit.potential ? 'Base damage % of the card (without potentials).' : 'Damage % as shown on the card in-game.' }]
  if (hit.potential) inner.push(potentialChip(hit.potential, `In-game card %: ${pct(hit.cardPct * hit.potential.value, 2)}.`))
  if (hit.multFactor.sources.length) {
    inner.push({ key: 'mult', op: '×', group: 'mult', label: 'Mult', value: times(hit.multFactor.value), sources: hit.multFactor.sources,
      note: 'Buffs without "+" combine here (Settings: Summed or Chained).' })
  }
  if (hit.additive.sources.length) {
    inner.push({ key: 'add', op: '+', group: 'add', label: 'Add', value: `+${pct(hit.additive.value)}`, sources: hit.additive.sources,
      note: '"+X%" buffs and Morale are added to the card %.' })
  }
  const outer = [
    factorChip('weak', 'weak', 'Weakness', hit.weakness),
    factorChip('vuln', 'enemy', 'Vulnerable', hit.vulnerable),
    factorChip('dr', 'enemy', 'Enemy DR', hit.enemyDr),
    factorChip('wdebuff', 'enemy', 'Weak debuff', hit.weaknessDebuff),
    factorChip('rav', 'enemy', 'Ravaged', hit.ravaged),
    { key: 'stat', op: '×' as const, group: 'stat' as const, label: card.scaling === 'DEF' ? 'DEF stat' : 'ATK', value: num(hit.stat.value, 1), sources: hit.stat.sources },
    { key: 'const', op: '×' as const, group: 'const' as const, label: 'Const', value: String(hit.constant), note: 'ATK damage constant (Settings).' },
    factorChip('elem', 'elem', 'Element', hit.elemDmg),
    factorChip('mech', 'elem', card.kind === 'DoT' ? 'DoT' : 'Extra', hit.mechDmg),
    factorChip('def', 'enemy', 'Enemy DEF', hit.enemyDef),
  ].filter((c): c is Chip => c !== null)
  return { inner, outer }
}

export function FormulaStrip({ hit, card, showCrit = true }: { hit: Hit; card: Card; showCrit?: boolean }) {
  const [sel, setSel] = useState<string | null>(null)
  const { inner, outer } = chipsFor(hit, card)
  const all = [...inner, ...outer]
  const critChip: Chip = { key: 'crit', op: '×', group: 'crit', label: 'Crit DMG', value: pct(hit.critDmg),
    sources: [...hit.critDmgSources, ...hit.critRateSources.map((s) => ({ ...s, label: `Crit Chance: ${s.label}` }))],
    note: `Crit hit = non-crit × Crit DMG. Expected uses ${pct(hit.critRate)} crit rate: × (1 + rate × (Crit DMG − 1)).` }
  const selected = [...all, critChip].find((c) => c.key === sel)
  const chip = (c: Chip) => (
    <Fragment key={c.key}>
      {c.op && <span className="op">{c.op}</span>}
      <button type="button" className={`chip g-${c.group} ${sel === c.key ? 'sel' : ''}`} onClick={() => setSel(sel === c.key ? null : c.key)}>
        <span className="chip-label">{c.label}</span>
        <span className="chip-value">{c.value}</span>
      </button>
    </Fragment>
  )
  return (
    <div className="strip-wrap">
      <div className="strip">
        {inner.length > 1 && <span className="paren">(</span>}
        {inner.map(chip)}
        {inner.length > 1 && <span className="paren">)</span>}
        {outer.map(chip)}
        <span className="op">=</span>
        <span className="chip g-result"><span className="chip-label">Hit</span><span className="chip-value">{num(hit.nonCrit)}</span></span>
      </div>
      {showCrit && card.scaling !== 'Fixed' && (
        <div className="strip crit-line">
          {chip({ ...critChip, op: '' })}
          <span className="op">=</span>
          <span className="chip g-result"><span className="chip-label">Crit</span><span className="chip-value">{num(hit.crit)}</span></span>
          <span className="op sep">·</span>
          <span className="chip g-result"><span className="chip-label">Expected</span><span className="chip-value">{num(hit.expected)}</span></span>
        </div>
      )}
      {selected && (
        <div className="sources">
          <div className="sources-title">{selected.label} {selected.value}</div>
          {selected.note && <div className="muted">{selected.note}</div>}
          {selected.sources && (
            <ul>
              {selected.sources.map((s, i) => <li key={i}><span>{s.label}</span><span>{sourceText(s)}</span></li>)}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
