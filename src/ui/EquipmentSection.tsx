// Setup > Equipment: the build's weapon, armor and trinket. Each slot opens a searchable list of the pieces (80+ names are too many
// for a dropdown on a phone); a rarity alone can be picked too, for the flat stat without a named piece.
import { useState } from 'react'
import { PRESETS } from '../data/presets'
import { EQUIP_STAT, equipmentDoubles, equipped, type Equipped } from '../engine/buffs'
import { EQUIP_RARITIES, EQUIP_SLOTS, type EquipmentPreset, type EquipPick, type EquipRarity, type EquipSlot } from '../engine/types'
import { useCharacter } from '../store/store'
import { Section, Sheet } from './inputs'

const SLOT_NAME: Record<EquipSlot, string> = { weapon: 'Weapon', armor: 'Armor', trinket: 'Trinket' }
const flatOf = (slot: EquipSlot, rarity: EquipRarity) => PRESETS.equipFlat?.[slot]?.[rarity] ?? 0
const flatText = (slot: EquipSlot, rarity: EquipRarity) => `+${flatOf(slot, rarity)} ${EQUIP_STAT[slot].label}`

function Icon({ piece }: { piece?: EquipmentPreset }) {
  const [broken, setBroken] = useState(false)
  return (
    <span className="equip-icon" aria-hidden="true">
      {piece?.image && !broken && <img src={`${import.meta.env.BASE_URL}${piece.image}`} alt="" width={40} height={40} loading="lazy" onError={() => setBroken(true)} />}
    </span>
  )
}

/** What a piece's text does for the numbers: counted (its effects are preset switches), partly, or not at all. */
function Counted({ piece }: { piece: EquipmentPreset }) {
  const counted = piece.effects.length > 0 || !!piece.triggers?.length
  if (counted && !piece.notCounted) return <span className="tag counted">counted</span>
  return <span className="tag">{counted ? `partly counted: ${piece.notCounted}` : `not counted${piece.notCounted ? `: ${piece.notCounted}` : ''}`}</span>
}

export function EquipmentSection() {
  const { build, updateBuild } = useCharacter()!
  const [open, setOpen] = useState<EquipSlot | null>(null)
  const worn = equipped(PRESETS, build.equipment)
  const doubles = equipmentDoubles(PRESETS, build)
  const pick = (slot: EquipSlot, p: EquipPick | undefined) => updateBuild((b) => {
    if (p) b.equipment = { ...b.equipment, [slot]: p }
    else if (b.equipment) {
      delete b.equipment[slot]
      if (!Object.keys(b.equipment).length) delete b.equipment
    }
  })
  return (
    <Section title="Equipment" help="A piece's flat Attack, Defense or Health isn't on the stats screen: it only counts in battle, so it's added here from the piece's rarity (the value at its top level). Pick a piece by name and its effects that change damage show under Stat boosts from presets and on the Buffs tab, with a switch each; an effect marked not counted is shown as text only. Or pick just a rarity for the flat stat. Health isn't used in damage yet.">
      <ul className="rows equip-slots">
        {EQUIP_SLOTS.map((slot) => {
          const e = worn.find((x) => x.slot === slot)
          return (
            <li key={slot} className="row col">
              <button type="button" className="equip-slot" aria-label={`${SLOT_NAME[slot]}: ${slotTitle(e)}`} onClick={() => setOpen(slot)}>
                <Icon piece={e?.piece} />
                <span className="row-main">
                  <span className="equip-kind">{SLOT_NAME[slot]}</span>
                  <span className="row-title">{slotTitle(e)}</span>
                  {e && <span className="row-sub">{e.piece ? `${e.rarity} · ` : ''}{flatText(slot, e.rarity)}</span>}
                </span>
                <span className="equip-change">{e ? 'Change' : 'Pick'}</span>
              </button>
              {e?.piece && <p className="equip-text pre-line">{e.piece.text} <Counted piece={e.piece} /></p>}
              {e?.lost && <p className="muted"><span className="warn">This piece ({e.lost}) is not in the presets any more.</span> Its rarity still gives the flat {EQUIP_STAT[slot].label}; pick it again for its effects.</p>}
            </li>
          )
        })}
      </ul>
      {doubles.map((d) => <p key={d} className="muted"><span className="warn">{d}</span></p>)}
      {open && <PieceSheet slot={open} current={build.equipment?.[open]} onClose={() => setOpen(null)}
        onPick={(p) => { pick(open, p); setOpen(null) }} />}
    </Section>
  )
}

const slotTitle = (e: Equipped | undefined) => !e ? 'None' : e.piece?.name ?? (e.lost ? `Unknown piece (${e.rarity})` : `${e.rarity}, no named piece`)

/** Every word typed must be in the piece's name, text, rarity or source. */
function matches(p: EquipmentPreset, query: string): boolean {
  const hay = `${p.name} ${p.text} ${p.rarity} ${p.source ?? ''}${p.seasonal ? ' seasonal' : ''}`.toLowerCase()
  return query.toLowerCase().split(/\s+/).filter(Boolean).every((w) => hay.includes(w))
}

function PieceSheet({ slot, current, onPick, onClose }: {
  slot: EquipSlot; current: EquipPick | undefined; onPick: (p: EquipPick | undefined) => void; onClose: () => void
}) {
  const [query, setQuery] = useState('')
  const [rarity, setRarity] = useState<EquipRarity | ''>('')
  const all = (PRESETS.equipment ?? []).filter((p) => p.slot === slot)
  const shown = all.filter((p) => (!rarity || p.rarity === rarity) && matches(p, query))
  const name = SLOT_NAME[slot].toLowerCase()
  return (
    <Sheet title={SLOT_NAME[slot]} onClose={onClose}>
      <div className="equip-filter">
        <input type="search" aria-label={`Search ${name}`} placeholder={`Search ${all.length}: name, effect, where it drops`} value={query}
          onChange={(e) => setQuery(e.target.value)} />
        <div className="equip-rarities" role="group" aria-label="Show rarity">
          {(['', ...EQUIP_RARITIES] as const).map((r) => (
            <button key={r} type="button" className={`btn small ${rarity === r ? 'primary' : ''}`} aria-pressed={rarity === r} onClick={() => setRarity(r)}>
              {r || 'All'}
            </button>
          ))}
        </div>
      </div>
      {!query && (
        <div className="equip-plain">
          <span className="muted">No named piece, just the flat {EQUIP_STAT[slot].label}:</span>
          <div className="btn-row tight">
            <button type="button" className={`btn small ${!current ? 'primary' : ''}`} onClick={() => onPick(undefined)}>None</button>
            {EQUIP_RARITIES.map((r) => (
              <button key={r} type="button" className={`btn small ${current && !current.piece && current.rarity === r ? 'primary' : ''}`}
                aria-label={`${r} ${name}, no named piece (${flatText(slot, r)})`} onClick={() => onPick({ rarity: r })}>
                {r} +{flatOf(slot, r)}
              </button>
            ))}
          </div>
        </div>
      )}
      <p className="muted small" role="status">{shown.length === all.length ? `${all.length} pieces` : `${shown.length} of ${all.length} pieces`}</p>
      <ul className="rows equip-list">
        {shown.map((p) => (
          <li key={p.id}>
            <button type="button" className={`equip-row ${current?.piece === p.id ? 'sel' : ''}`} aria-pressed={current?.piece === p.id}
              onClick={() => onPick({ rarity: p.rarity, piece: p.id })}>
              <Icon piece={p} />
              <span className="row-main">
                <span className="row-title">{p.name}<span className="tag">{p.rarity}</span>{p.seasonal && <span className="tag">Seasonal</span>}</span>
                <span className="row-sub">{p.text}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      {!shown.length && <p className="muted">Nothing matches. Try fewer words, or another rarity.</p>}
    </Sheet>
  )
}
