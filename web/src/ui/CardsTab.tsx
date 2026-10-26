// Cards: the character's card library and the ordered rotation (one entry per play).
import { DndContext, KeyboardSensor, PointerSensor, TouchSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useState } from 'react'
import { PRESETS } from '../data/presets'
import { playCard } from '../engine/calc'
import { findCharacter } from '../engine/buffs'
import { CARD_TYPES, ELEMENTS, type Card, type CardPreset, type CardType, type DamageKind, type Element, type Scaling } from '../engine/types'
import { cardFromPreset, newCard, newId } from '../store/save'
import { useCharacter } from '../store/store'
import { pct } from './format'
import { NumberField, Section, SelectField, Stepper, TextField, Toggle } from './inputs'

export function CardsTab() {
  return (
    <>
      <RotationSection />
      <LibrarySection />
      <PresetPicker />
    </>
  )
}

const COSTS = ['0', '1', '2', '3', '4', '5']

function cardSummary(c: Card): string {
  const amount = c.scaling === 'Fixed' ? `${c.pct} fixed` : pct(c.pct, 2)
  return `${c.cost === null ? '' : `${c.cost} AP · `}${c.cardType} · ${amount} × ${c.hits} hit${c.hits === 1 ? '' : 's'}${c.scaling === 'DEF' ? ' · DEF' : ''}${c.kind !== 'Normal' ? ` · ${c.kind}` : ''}`
}

function presetText(p: CardPreset): string {
  return `${p.cost === undefined ? '' : `${p.cost} AP · `}${p.cardType} · ${p.text}`
}

/** The character's preset cards, grouped by base card; tapping + Add copies one into the library. */
function PresetPicker() {
  const { name, cs, updateCs } = useCharacter()!
  const ch = findCharacter(PRESETS, name)
  const [open, setOpen] = useState<string | null>(null)
  if (!ch?.cards?.length) return null
  const all = ch.cards
  const groups = [...new Set(all.map((p) => p.base))]
  const counts = new Map<string, number>()
  for (const c of cs.cards) if (c.preset) counts.set(c.preset, (counts.get(c.preset) ?? 0) + 1)
  return (
    <Section title={`${ch.name}'s cards`} help="Base values, without potentials: after adding, edit the damage % to match the card in-game. Buffs a card gives show on the Buffs tab while it's in the library.">
      <ul className="rows">
        {groups.map((g) => {
          const variants = all.filter((p) => p.base === g)
          return (
            <li key={g} className="row col">
              <button className="row-main link" onClick={() => setOpen(open === g ? null : g)} aria-expanded={open === g}>
                <div className="row-title">{g}</div>
                <div className="row-sub">{variants.length > 1 ? `Base + ${variants.length - 1} epiphanies` : presetText(variants[0])}</div>
              </button>
              {open === g && (
                <ul className="rows">
                  {variants.map((p) => {
                    const n = counts.get(p.id) ?? 0
                    return (
                      <li key={p.id} className="row">
                        <div className="row-main">
                          <div className="row-title">{p.name}{n > 0 && <span className="tag">in library{n > 1 ? ` ×${n}` : ''}</span>}</div>
                          <div className="row-sub">{presetText(p)}</div>
                          {p.notes && <div className="row-note">{p.notes}</div>}
                        </div>
                        <button className="btn small" onClick={() => updateCs((s) => { s.cards.push(cardFromPreset(p, ch.element)) })}>+ Add</button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </li>
          )
        })}
      </ul>
    </Section>
  )
}

function LibrarySection() {
  const { name, cs, updateCs } = useCharacter()!
  const [open, setOpen] = useState<string | null>(null)
  const ch = findCharacter(PRESETS, name)
  const presetCards = ch?.cards ?? []
  return (
    <Section title="Card library" help="Enter each card's damage % exactly as the card shows it in-game (it already includes potentials and epiphany), or add one from the character's cards below. Cards are shared by all builds."
      actions={<button className="btn small" onClick={() => {
        const c = newCard(ch?.element ?? ELEMENTS[0])
        updateCs((x) => { x.cards.push(c) })
        setOpen(c.id)
      }}>+ Add</button>}>
      {!cs.cards.length && <p className="muted">No cards yet. Add one (or pick from the character's cards below), then tap “+ Play” to put it in the rotation.</p>}
      <ul className="rows">
        {cs.cards.map((c, i) => {
          const upd = (fn: (x: Card) => void) => updateCs((s) => fn(s.cards[i]))
          const preset = c.preset ? presetCards.find((p) => p.id === c.preset) : undefined
          return (
            <li key={c.id} className="row col">
              <div className="row-line">
                <button className="row-main link" onClick={() => setOpen(open === c.id ? null : c.id)} aria-expanded={open === c.id}>
                  <div className="row-title">{c.name || 'Unnamed card'}</div>
                  <div className="row-sub">{cardSummary(c)}{c.tags && ` · ${c.tags}`}</div>
                </button>
                <button className="btn small" onClick={() => updateCs((s) => { s.rotation.push({ cardId: c.id }) })}>+ Play</button>
              </div>
              {open === c.id && (
                <div className="editor grid2">
                  {preset && (
                    <div className="full-row">
                      <div className="row-sub">From {preset.name}: {presetText(preset)}</div>
                      {preset.notes && <div className="row-note">{preset.notes}</div>}
                    </div>
                  )}
                  <TextField label="Name" value={c.name} onChange={(v) => upd((x) => { x.name = v })} />
                  <TextField label="Tags" value={c.tags} placeholder="Basic Attack, Strike" help="Comma-separated, e.g. Exhaust, Basic Attack. Buffs can target a tag." onChange={(v) => upd((x) => { x.tags = v })} />
                  <SelectField<CardType> label="Card type" value={c.cardType} options={CARD_TYPES}
                    help="Buffs can target it like a tag (e.g. 'Attack')." onChange={(v) => upd((x) => { x.cardType = v })} />
                  <SelectField<Element> label="Element" value={c.element} options={ELEMENTS}
                    help="Buffs can target it like a tag (e.g. 'Passion')." onChange={(v) => upd((x) => { x.element = v })} />
                  <SelectField label="Cost (AP)" value={c.cost === null ? '' : String(c.cost)}
                    options={[{ value: '', label: 'None (Ego skill)' }, ...new Set([...COSTS, ...(c.cost === null ? [] : [String(c.cost)])])]}
                    help="Buffs can target '1-cost' or '2+ cost'." onChange={(v) => upd((x) => { x.cost = v === '' ? null : Number(v) })} />
                  <NumberField label={c.scaling === 'Fixed' ? 'Damage per hit' : 'Damage % per hit'} pct={c.scaling !== 'Fixed'} value={c.pct}
                    onChange={(v) => upd((x) => { x.pct = v })} />
                  <NumberField label="Hits" value={c.hits} min={0} onChange={(v) => upd((x) => { x.hits = Math.floor(v) })} />
                  <SelectField<Scaling> label="Scaling" value={c.scaling} options={['ATK', 'DEF', 'Fixed']}
                    help="DEF cards use ATK × 0.3 + DEF × 2.1. Fixed damage ignores every multiplier and doesn't crit."
                    onChange={(v) => upd((x) => { x.scaling = v })} />
                  <SelectField<DamageKind> label="Damage kind" value={c.kind} options={['Normal', 'Extra Attack', 'DoT']}
                    help="Extra Attack cards get Extra DMG; DoT cards get Damage over time."
                    onChange={(v) => upd((x) => { x.kind = v })} />
                  <div className="toggle-field">
                    <span>Weakness DMG applies</span>
                    <Toggle label="Weakness DMG applies" checked={c.weaknessApplies} onChange={(v) => upd((x) => { x.weaknessApplies = v })} />
                  </div>
                  <div className="toggle-field">
                    <span>Target Ravaged</span>
                    <Toggle label="Target Ravaged" checked={c.targetRavaged} onChange={(v) => upd((x) => { x.targetRavaged = v })} />
                  </div>
                  <div className="btn-row">
                    <button className="btn" onClick={() => updateCs((s) => {
                      const copy = { ...structuredClone(s.cards[i]), id: newId(), name: `${c.name} (copy)` }
                      s.cards.splice(i + 1, 0, copy)
                    })}>Duplicate</button>
                    <button className="btn danger" onClick={() => {
                      if (!confirm(`Delete ${c.name || 'this card'}? It's also removed from the rotation.`)) return
                      updateCs((s) => {
                        s.cards.splice(i, 1)
                        s.rotation = s.rotation.filter((p) => p.cardId !== c.id)
                      })
                    }}>Delete</button>
                  </div>
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </Section>
  )
}

/** Rotation entries need unique ids for drag and drop; the saved rotation is just card ids. */
function RotationSection() {
  const { cs, updateCs } = useCharacter()!
  const cards = new Map(cs.cards.map((c) => [c.id, c]))
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  const ids = cs.rotation.map((_, i) => `p${i}`)
  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return
    const from = ids.indexOf(String(e.active.id)), to = ids.indexOf(String(e.over.id))
    updateCs((s) => { s.rotation = arrayMove(s.rotation, from, to) })
  }
  const played = cs.rotation.map((p) => { const c = cards.get(p.cardId); return c && playCard(c, p) })
  const ends = played.reduce<number[]>((acc, c) => {
    acc.push((acc.at(-1) ?? 0) + (c ? Math.max(0, Math.floor(c.hits)) : 0))
    return acc
  }, [])
  return (
    <Section title="Rotation" help="The cards you play, in order. Vulnerable and Weakness-debuff stacks are used up hit by hit in this order. Drag ⠿ to reorder. − / + sets the hits of that play only (Combo, extra-hit effects)."
      actions={cs.rotation.length > 0 && <button className="btn small" onClick={() => { if (confirm('Clear the rotation?')) updateCs((s) => { s.rotation = [] }) }}>Clear</button>}>
      {!cs.rotation.length && <p className="muted">Empty. Tap “+ Play” on a card below to add it.</p>}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <ol className="rows rotation">
            {cs.rotation.map((play, i) => {
              const c = played[i], base = cards.get(play.cardId)
              const first = (ends[i - 1] ?? 0) + 1, hit = ends[i]
              return (
                <RotationItem key={ids[i]} id={ids[i]} index={i} card={c} baseHits={play.hits === undefined ? undefined : base?.hits}
                  hits={c && c.hits > 0 ? (first === hit ? `hit ${hit}` : `hits ${first}–${hit}`) : ''}
                  onHits={(n) => updateCs((s) => { s.rotation[i].hits = n === base?.hits ? undefined : n })}
                  onRemove={() => updateCs((s) => { s.rotation.splice(i, 1) })} />
              )
            })}
          </ol>
        </SortableContext>
      </DndContext>
    </Section>
  )
}

/** baseHits: the card's own hits, set when this play overrides them. */
function RotationItem({ id, index, card, baseHits, hits, onHits, onRemove }: {
  id: string; index: number; card?: Card; baseHits?: number; hits: string; onHits: (n: number) => void; onRemove: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  return (
    <li ref={setNodeRef} className={`row ${isDragging ? 'dragging' : ''}`}
      style={{ transform: CSS.Transform.toString(transform), transition }}>
      <button className="drag" aria-label={`Move play ${index + 1}`} {...attributes} {...listeners}>⠿</button>
      <div className="row-main">
        <div className="row-title"><span className="play-no">{index + 1}</span> {card?.name || 'Unnamed card'}</div>
        <div className="row-sub">{card ? `${cardSummary(card)} · ${hits}` : 'Card was deleted'}</div>
        {baseHits !== undefined && <div className="row-note">Hits set for this play (card: {baseHits})</div>}
      </div>
      {card && (card.pct !== 0 || baseHits !== undefined) && (
        <Stepper label={`Play ${index + 1} hits`} value={card.hits} onChange={onHits} />
      )}
      <button className="icon-btn" aria-label={`Remove play ${index + 1}`} onClick={onRemove}>×</button>
    </li>
  )
}
