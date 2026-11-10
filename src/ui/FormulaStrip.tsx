// Color-coded formula of one hit: each multiplier is a chip; tap a chip to see where it comes from.
import { useState, type ReactNode } from 'react'
import type { Source } from '../engine/buffs'
import { isFixedDot, isPlainFixed, type Factor, type Hit } from '../engine/calc'
import type { Card } from '../engine/types'
import { num, pct, times } from './format'

export type ChipGroup = 'card' | 'add' | 'mult' | 'weak' | 'enemy' | 'stat' | 'elem' | 'const' | 'crit' | 'result' | 'total'

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
  /** Bracket before / after the chip, e.g. around card % x Potential + Base when Mult multiplies all of it. */
  open?: boolean
  close?: boolean
}

const HAND_NOTE = 'Card % as shown on the card in your hand: (card % × Mult + Add), without the buffs that need a target (Ember, vs Ravaged, in Agony).'
const TARGET_NOTE = 'Card % when you target the enemy: in hand plus the buffs that need a target, × Weakness DMG, Vulnerable, enemy damage reduction, Weakness debuff and Ravaged.'

function sourceText(s: Source): string {
  if (s.unit === '%') return `${s.value >= 0 ? '+' : ''}${pct(s.value)}`
  if (s.unit === 'x') return s.value ? times(s.value) : ''
  return `${s.value >= 0 ? '+' : ''}${num(s.value, 1)}`
}

function factorChip(key: string, group: ChipGroup, label: string, f: Factor | null, note?: string): Chip | null {
  return f ? { key, op: '×', group, label, value: times(f.value), sources: f.sources, note } : null
}

/** The upgraded % the game shows: for one unit on a per-Cost or per-count card, and whether it was rounded (Settings). */
function upgradedNote(hit: Hit, card: Card): string {
  const units = card.pctUnits || 1
  const exact = hit.cardPct * hit.potential!.value
  return `In-game card %: ${pct(hit.upgradedPct / units, 2)}${units !== 1 ? ` × ${units}` : ''}${Math.abs(exact - hit.upgradedPct) > 1e-9 ? ` (${pct(exact / units, 2)} rounded, Settings)` : ''}.`
}

function potentialChip(f: Factor, note: string): Chip {
  return { key: 'pot', op: '×', group: 'card', label: 'Potential', value: times(f.value), sources: f.sources, note }
}

function baseChip(f: Factor, note: string): Chip {
  return { key: 'base', op: '+', group: 'card', label: 'Base', value: `+${pct(f.value)}`, sources: f.sources, note }
}

/** Flat damage as it reaches the bracket: raised: its value x the multipliers already inside. */
function flatChip(f: Factor, raised: number, note: string): Chip {
  return { key: 'flat', op: '+', group: 'card', label: 'Flat', value: `+${num(f.value * raised, 1)}`, sources: f.sources, note }
}

export function chipsFor(hit: Hit, card: Card): { inner: Chip[]; outer: Chip[] } {
  if (card.scaling === 'Fixed') {
    const dot = isFixedDot(card)
    const inner: Chip[] = [{ key: 'fixed', op: '', group: 'card', label: 'Fixed', value: pct(hit.cardPct, 2),
      note: dot ? 'Fixed DoT: one hit per stack, and each can crit. The element and DoT stats and Enemy DEF raise it; Vulnerable does not.' : 'Fixed damage ignores every multiplier and crit.',
      ...(hit.cardAdd.length ? { sources: hit.cardAdd } : {}) }]
    if (hit.potential) inner.push(potentialChip(hit.potential, `Potential upgrades apply to Fixed damage (Settings). ${upgradedNote(hit, card)}`))
    if (hit.basePct) inner.push(baseChip(hit.basePct, 'Added to the Fixed % after the potential.'))
    return { inner, outer: [
      { key: 'stat', op: '×', group: 'stat', label: card.fixedOf ?? 'ATK', value: num(hit.stat.value, 1), sources: hit.stat.sources },
      ...(card.fixedOf ? [] : [{ key: 'const', op: '×', group: 'const', label: 'Const', value: String(hit.constant), note: 'Fixed damage constant (Settings, Unconfirmed).' } satisfies Chip]),
      ...(hit.flat ? [dot
        ? { ...flatChip(hit.flat, 1, 'Damage, not a %: the factors after the bracket raise it, not the stat or Const.'), close: true }
        : flatChip(hit.flat, 1, 'Damage, not a %, added as it is.')] : []),
      ...(dot ? [factorChip('elem', 'elem', 'Element', hit.elemDmg), factorChip('mech', 'elem', 'DoT', hit.mechDmg), factorChip('def', 'enemy', 'Enemy DEF', hit.enemyDef)].filter((c): c is Chip => c !== null) : []),
      ...(dot && hit.multFactor.sources.length ? [{ key: 'mult', op: '×', group: 'mult', label: 'Mult', value: times(hit.multFactor.value), sources: hit.multFactor.sources,
        note: 'Only buffs marked as reaching Fixed DoT raise it (Olga\'s Shard Erosion); other damage buffs don\'t.' } satisfies Chip] : []),
    ] }
  }
  const inner: Chip[] = [{ key: 'card', op: '', group: 'card', label: card.name || 'Card', value: pct(hit.cardPct, 2),
    ...(hit.cardAdd.length ? { sources: hit.cardAdd } : {}),
    note: hit.potential ? 'Base damage % of the card (without potentials).' : 'Damage % as shown on the card in-game.' }]
  if (hit.potential) inner.push(potentialChip(hit.potential, upgradedNote(hit, card)))
  if (hit.basePct) {
    inner.push(baseChip(hit.basePct, '"+X% base Damage Amount" is added to the card % after the potential, so Mult raises it too.'))
    if (hit.multFactor.sources.length) { inner[0].open = true; inner[inner.length - 1].close = true }
  }
  if (hit.multFactor.sources.length) {
    inner.push({ key: 'mult', op: '×', group: 'mult', label: 'Mult', value: times(hit.multFactor.value), sources: hit.multFactor.sources,
      note: 'Buffs without "+" combine here (Settings: Summed or Chained).' })
  }
  if (hit.additive.sources.length) {
    inner.push({ key: 'add', op: '+', group: 'add', label: 'Add', value: `+${pct(hit.additive.value)}`, sources: hit.additive.sources,
      note: '"+X%" buffs and Morale are added to the card %.' })
  }
  const onTarget = [
    factorChip('weak', 'weak', 'Weakness', hit.weakness),
    factorChip('vuln', 'enemy', 'Vulnerable', hit.vulnerable),
    factorChip('dr', 'enemy', 'Enemy DR', hit.enemyDr),
    factorChip('wdebuff', 'enemy', 'Weak debuff', hit.weaknessDebuff),
    factorChip('rav', 'enemy', 'Ravaged', hit.ravaged),
  ]
  const scale: Chip[] = [
    { key: 'stat', op: '×', group: 'stat', label: card.scaling === 'DEF' ? 'DEF stat' : 'ATK', value: num(hit.stat.value, 1), sources: hit.stat.sources },
    { key: 'const', op: '×', group: 'const', label: 'Const', value: String(hit.constant), note: 'ATK damage constant (Settings).' },
  ]
  // Flat damage skips the stat and constant, so they move inside a bracket with it: [(...) x stat x const + Flat] x the rest
  const outer = [
    ...(hit.flat
      ? [...scale, { ...flatChip(hit.flat, hit.multFactor.value, 'Damage, not a %: Mult (included here) and the factors after the bracket raise it, not the stat or Const.'), close: true }, ...onTarget]
      : [...onTarget, ...scale]),
    factorChip('elem', 'elem', 'Element', hit.elemDmg),
    factorChip('mech', 'elem', card.kind === 'DoT' ? 'DoT' : 'Extra', hit.mechDmg),
    factorChip('def', 'enemy', 'Enemy DEF', hit.enemyDef),
    factorChip('final', 'mult', 'Final', hit.final, '"final Damage Amount" buffs: their own multiplier, x (1 + their sum).'),
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
  const cardPcts: Chip[] = card.scaling === 'Fixed' ? [] : [
    { key: 'hand', op: '', group: 'total', label: 'In hand', value: pct(hit.inHand, 1), note: HAND_NOTE },
    { key: 'target', op: '', group: 'total', label: 'On target', value: pct(hit.cardMult, 1), note: TARGET_NOTE },
  ]
  const selected = [...all, ...cardPcts, critChip].find((c) => c.key === sel)

  // One term = operator + chip (+ bracket), kept on one line so the strip only wraps between terms
  const chip = (c: Chip, before?: ReactNode, after?: ReactNode) => (
    <span key={c.key} className="term">
      {c.op && <span className="op">{c.op}</span>}
      {before}
      <button type="button" className={`chip g-${c.group} ${sel === c.key ? 'sel' : ''}`} onClick={() => setSel(sel === c.key ? null : c.key)}>
        <span className="chip-label">{c.label}</span>
        <span className="chip-value">{c.value}</span>
      </button>
      {after}
    </span>
  )
  const result = (label: string, value: number) => (
    <span className="term">
      <span className="op">=</span>
      <span className="chip g-result"><span className="chip-label">{label}</span><span className="chip-value">{num(value)}</span></span>
    </span>
  )
  const paren = inner.length > 1
  // Plain Fixed damage adds its Flat damage at the end, with nothing after it to bracket
  const flatBracket = !!hit.flat && !isPlainFixed(card)
  return (
    <div className="strip-wrap">
      <div className="strip">
        {inner.map((c, i) => chip(c, <>{flatBracket && i === 0 && <span className="paren">(</span>}{paren && i === 0 && <span className="paren">(</span>}{c.open && <span className="paren">(</span>}</>,
          <>{c.close && <span className="paren">)</span>}{paren && i === inner.length - 1 && <span className="paren">)</span>}</>))}
        {outer.map((c) => chip(c, undefined, c.close && <span className="paren">)</span>))}
        {result('Hit', hit.nonCrit)}
      </div>
      {cardPcts.length > 0 && <div className="strip">{cardPcts.map((c) => chip(c))}</div>}
      {showCrit && !isPlainFixed(card) && (
        <div className="strip crit-line">
          {chip({ ...critChip, op: '' })}
          {result('Crit', hit.crit)}
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
