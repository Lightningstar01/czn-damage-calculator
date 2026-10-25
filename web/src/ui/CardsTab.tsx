// Cards: the character's card library and the ordered rotation (one entry per play).
import { DndContext, KeyboardSensor, PointerSensor, TouchSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useState } from 'react'
import { CARD_TYPES, type Card, type CardType, type DamageKind, type Scaling } from '../engine/types'
import { newCard, newId } from '../store/save'
import { useCharacter } from '../store/store'
import { pct } from './format'
import { NumberField, Section, SelectField, TextField, Toggle } from './inputs'

export function CardsTab() {
  return (
    <>
      <RotationSection />
      <LibrarySection />
    </>
  )
}

function cardSummary(c: Card): string {
  const amount = c.scaling === 'Fixed' ? `${c.pct} fixed` : pct(c.pct, 2)
  return `${c.cardType} · ${amount} × ${c.hits} hit${c.hits === 1 ? '' : 's'}${c.scaling === 'DEF' ? ' · DEF' : ''}${c.kind !== 'Normal' ? ` · ${c.kind}` : ''}`
}

function LibrarySection() {
  const { cs, updateCs } = useCharacter()!
  const [open, setOpen] = useState<string | null>(null)
  return (
    <Section title="Card library" help="Enter each card's damage % exactly as the card shows it in-game (it already includes potentials and epiphany). Cards are shared by all builds."
      actions={<button className="btn small" onClick={() => {
        const c = newCard()
        updateCs((x) => { x.cards.push(c) })
        setOpen(c.id)
      }}>+ Add</button>}>
      {!cs.cards.length && <p className="muted">No cards yet. Add one, then tap “+ Play” to put it in the rotation.</p>}
      <ul className="rows">
        {cs.cards.map((c, i) => {
          const upd = (fn: (x: Card) => void) => updateCs((s) => fn(s.cards[i]))
          return (
            <li key={c.id} className="row col">
              <div className="row-line">
                <button className="row-main link" onClick={() => setOpen(open === c.id ? null : c.id)} aria-expanded={open === c.id}>
                  <div className="row-title">{c.name || 'Unnamed card'}</div>
                  <div className="row-sub">{cardSummary(c)}{c.tags && ` · ${c.tags}`}</div>
                </button>
                <button className="btn small" onClick={() => updateCs((s) => { s.rotation.push(c.id) })}>+ Play</button>
              </div>
              {open === c.id && (
                <div className="editor grid2">
                  <TextField label="Name" value={c.name} onChange={(v) => upd((x) => { x.name = v })} />
                  <TextField label="Tags" value={c.tags} placeholder="Basic Attack, Strike" help="Comma-separated, e.g. element, Exhaust, 1-cost. Buffs can target a tag." onChange={(v) => upd((x) => { x.tags = v })} />
                  <SelectField<CardType> label="Card type" value={c.cardType} options={CARD_TYPES}
                    help="Buffs can target it like a tag (e.g. 'Attack')." onChange={(v) => upd((x) => { x.cardType = v })} />
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
                        s.rotation = s.rotation.filter((id) => id !== c.id)
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
  const ends = cs.rotation.reduce<number[]>((acc, id) => {
    const c = cards.get(id)
    acc.push((acc.at(-1) ?? 0) + (c ? Math.max(0, Math.floor(c.hits)) : 0))
    return acc
  }, [])
  return (
    <Section title="Rotation" help="The cards you play, in order. Vulnerable and Weakness-debuff stacks are used up hit by hit in this order. Drag ⠿ to reorder."
      actions={cs.rotation.length > 0 && <button className="btn small" onClick={() => { if (confirm('Clear the rotation?')) updateCs((s) => { s.rotation = [] }) }}>Clear</button>}>
      {!cs.rotation.length && <p className="muted">Empty. Tap “+ Play” on a card below to add it.</p>}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <ol className="rows rotation">
            {cs.rotation.map((cardId, i) => {
              const c = cards.get(cardId)
              const first = (ends[i - 1] ?? 0) + 1, hit = ends[i]
              return (
                <RotationItem key={ids[i]} id={ids[i]} index={i} card={c} hits={c && c.hits > 0 ? (first === hit ? `hit ${hit}` : `hits ${first}–${hit}`) : ''}
                  onRemove={() => updateCs((s) => { s.rotation.splice(i, 1) })} />
              )
            })}
          </ol>
        </SortableContext>
      </DndContext>
    </Section>
  )
}

function RotationItem({ id, index, card, hits, onRemove }: { id: string; index: number; card?: Card; hits: string; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  return (
    <li ref={setNodeRef} className={`row ${isDragging ? 'dragging' : ''}`}
      style={{ transform: CSS.Transform.toString(transform), transition }}>
      <button className="drag" aria-label={`Move play ${index + 1}`} {...attributes} {...listeners}>⠿</button>
      <div className="row-main">
        <div className="row-title"><span className="play-no">{index + 1}</span> {card?.name || 'Unnamed card'}</div>
        <div className="row-sub">{card ? `${cardSummary(card)} · ${hits}` : 'Card was deleted'}</div>
      </div>
      <button className="icon-btn" aria-label={`Remove play ${index + 1}`} onClick={onRemove}>×</button>
    </li>
  )
}
