// Cards: the active build's attack list (one entry per play) and the character's card library (shared by all builds).
import { DndContext, KeyboardSensor, PointerSensor, TouchSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useState } from 'react'
import { PRESETS } from '../data/presets'
import { playCard } from '../engine/calc'
import { activeBuffs, activeCounters, findCharacter } from '../engine/buffs'
import { CARD_CATEGORIES, CARD_TYPES, ELEMENTS, type Card, type CardPreset, type CardType, type DamageKind, type Element, type PotentialUpgrade, type RotationPlay, type Scaling } from '../engine/types'
import { cardFromPreset, newCard, newId } from '../store/save'
import { useCharacter, useStore } from '../store/store'
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

const COSTS = Array.from({ length: 10 }, (_, i) => String(i))

function cardSummary(c: Card): string {
  const amount = `${c.scaling === 'Fixed' ? `${c.pct} fixed` : pct(c.pct, 2)}${c.upgrade ? ` base (${c.upgrade})` : ''}`
  return `${c.cost === null ? '' : `${c.cost} AP · `}${c.cardType} · ${amount} × ${c.hits} hit${c.hits === 1 ? '' : 's'}${c.scaling === 'DEF' ? ' · DEF' : ''}${c.kind !== 'Normal' ? ` · ${c.kind}` : ''}`
}

function presetText(p: CardPreset): string {
  return `${p.cost == null ? '' : `${p.cost} AP · `}${p.cardType} · ${p.text.replace(/\n/g, ' ')}`
}

/** The character's preset cards, by category (Starting, Unique...) and base card; tapping + Add copies one into the library. */
function PresetPicker() {
  const { name, cs, updateCs } = useCharacter()!
  const ch = findCharacter(PRESETS, name)
  const [open, setOpen] = useState<string | null>(null)
  if (!ch?.cards?.length) return null
  const all = ch.cards
  const groups = [...new Set(all.map((p) => p.base))]
  // A base card's category (its epiphanies are 'Epiphany Card'); unknown categories go last
  const categoryOf = (g: string) => (all.find((p) => p.name === g) ?? all.find((p) => p.base === g))?.category ?? 'Other'
  const order = (cat: string) => { const i = (CARD_CATEGORIES as readonly string[]).indexOf(cat); return i < 0 ? CARD_CATEGORIES.length : i }
  const categories = [...new Set(groups.map(categoryOf))].sort((a, b) => order(a) - order(b))
  const counts = new Map<string, number>()
  for (const c of cs.cards) if (c.preset) counts.set(c.preset, (counts.get(c.preset) ?? 0) + 1)
  return (
    <Section title={`${ch.name}'s cards`} help="Base values, without potentials: the build's Basic / Signature Card Upgrade levels (Setup tab) are applied. Buffs a card gives show on the Buffs tab while it's in the library.">
      {categories.map((cat) => (
        <div key={cat}>
          {categories.length > 1 && <div className="muted">{cat}s</div>}
          <ul className="rows">
          {groups.filter((g) => categoryOf(g) === cat).map((g) => {
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
        </div>
      ))}
    </Section>
  )
}

function LibrarySection() {
  const { name, cs, build, updateCs, updateBuild } = useCharacter()!
  const [open, setOpen] = useState<string | null>(null)
  const ch = findCharacter(PRESETS, name)
  const presetCards = ch?.cards ?? []
  return (
    <Section title="Card library" help="Add cards from the character's cards below (base %, the build's potentials applied), or add your own. For a card with no potential upgrade, enter the damage % exactly as the card shows it in-game. Cards are shared by all builds."
      actions={<button className="btn small" onClick={() => {
        const c = newCard(ch?.element ?? ELEMENTS[0])
        updateCs((x) => { x.cards.push(c) })
        setOpen(c.id)
      }}>+ Add</button>}>
      {!cs.cards.length && <p className="muted">No cards yet. Add one (or pick from the character's cards below), then tap “+ Play” to put it in the active build's attack list.</p>}
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
                <button className="btn small" onClick={() => updateBuild((b) => { b.rotation.push({ cardId: c.id }) })} aria-label={`Play ${c.name} in ${build.name}`}>+ Play</button>
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
                    options={[{ value: '', label: 'None' }, ...new Set([...COSTS, ...(c.cost === null ? [] : [String(c.cost)])])]}
                    help="Buffs can target '1-cost' or '2+ cost'." onChange={(v) => upd((x) => { x.cost = v === '' ? null : Number(v) })} />
                  <SelectField label="Potential upgrade" value={c.upgrade ?? ''}
                    options={[{ value: '', label: 'None' }, { value: 'Basic', label: 'Basic Card Upgrade' }, { value: 'Signature', label: 'Signature Card Upgrade' }]}
                    help="Basic cards: Basic. The character's other cards (generated ones too): Signature. Ego skills and cards from other characters: None."
                    onChange={(v) => upd((x) => { if (v) x.upgrade = v as PotentialUpgrade; else delete x.upgrade })} />
                  <NumberField label={`${c.scaling === 'Fixed' ? 'Damage per hit' : 'Damage % per hit'}${c.upgrade ? ' (base)' : ' (in-game)'}`}
                    pct={c.scaling !== 'Fixed'} value={c.pct}
                    help={c.upgrade ? "Without potentials: the build's card upgrade level is applied." : 'As the card shows it in-game.'}
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
                      if (!confirm(`Delete ${c.name || 'this card'}? It's also removed from every build's attack list.`)) return
                      updateCs((s) => {
                        s.cards.splice(i, 1)
                        for (const b of s.builds) b.rotation = (b.rotation ?? []).filter((p) => p.cardId !== c.id)
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

/** The active build's attack list. Entries need unique ids for drag and drop. */
function RotationSection() {
  const { name, cs, build, updateBuild } = useCharacter()!
  const { data: { settings } } = useStore()
  const [open, setOpen] = useState<number | null>(null)
  const cards = new Map(cs.cards.map((c) => [c.id, c]))
  const rotation = build.rotation ?? []
  const counters = activeCounters(activeBuffs(PRESETS, name, cs, build, settings))
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  const ids = rotation.map((_, i) => `p${i}`)
  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return
    const from = ids.indexOf(String(e.active.id)), to = ids.indexOf(String(e.over.id))
    updateBuild((b) => { b.rotation = arrayMove(b.rotation, from, to) })
    setOpen(null)
  }
  const others = cs.builds.filter((b) => b.id !== build.id)
  return (
    <Section title={`${build.name} attack list`} help={`The main character's plays for this build (each build has its own list). Every buff that's on counts on every play (snapshot). Tap a play to set its hits (Combo, extra-hit effects), whether Vulnerable (×${1 + settings.vulnerable}) or the Weakness debuff (×${1 - settings.weaknessDebuff}) is up, and the stacks of per-play buffs (Ember, Spirit of the Aromata...). Drag ⠿ to reorder.`}
      actions={rotation.length > 0 && <button className="btn small" onClick={() => { if (confirm(`Clear ${build.name}'s attack list?`)) updateBuild((b) => { b.rotation = [] }) }}>Clear</button>}>
      {!rotation.length && <p className="muted">Empty. Tap “+ Play” on a card below to add it.</p>}
      {others.length > 0 && (
        <SelectField label="Copy the attack list from" value=""
          options={[{ value: '', label: 'Pick a build…' }, ...others.map((b) => ({ value: b.id, label: `${b.name} (${b.rotation?.length ?? 0} plays)` }))]}
          onChange={(id) => {
            const src = others.find((b) => b.id === id)
            if (!src || (rotation.length && !confirm(`Replace ${build.name}'s attack list with ${src.name}'s?`))) return
            updateBuild((b) => { b.rotation = structuredClone(src.rotation ?? []) })
          }} />
      )}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <ol className="rows rotation">
            {rotation.map((play, i) => {
              const base = cards.get(play.cardId)
              return (
                <RotationItem key={ids[i]} id={ids[i]} index={i} play={play} card={base && playCard(base, play)} baseHits={base?.hits}
                  counters={counters} open={open === i} onToggle={() => setOpen(open === i ? null : i)}
                  onChange={(fn) => updateBuild((b) => fn(b.rotation[i]))}
                  onRemove={() => { updateBuild((b) => { b.rotation.splice(i, 1) }); setOpen(null) }} />
              )
            })}
          </ol>
        </SortableContext>
      </DndContext>
    </Section>
  )
}

function playFlags(play: RotationPlay): string {
  const stacks = Object.entries(play.stacks ?? {}).filter(([, n]) => n > 0).map(([name, n]) => `${name} ${n}`)
  return [...(play.vulnerable ? ['Vulnerable'] : []), ...(play.weaknessDebuff ? ['Weakness debuff'] : []), ...stacks].join(' · ')
}

/** baseHits: the card's own hits. counters: the per-play stacks the switched-on buffs read. */
function RotationItem({ id, index, play, card, baseHits, counters, open, onToggle, onChange, onRemove }: {
  id: string; index: number; play: RotationPlay; card?: Card; baseHits?: number; counters: { name: string; max: number | null }[]
  open: boolean; onToggle: () => void; onChange: (fn: (p: RotationPlay) => void) => void; onRemove: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const flags = playFlags(play)
  return (
    <li ref={setNodeRef} className={`row col ${isDragging ? 'dragging' : ''}`}
      style={{ transform: CSS.Transform.toString(transform), transition }}>
      <div className="row-line">
        <button className="drag" aria-label={`Move play ${index + 1}`} {...attributes} {...listeners}>⠿</button>
        <button className="row-main link" onClick={onToggle} aria-expanded={open}>
          <div className="row-title"><span className="play-no">{index + 1}</span> {card?.name || 'Unnamed card'}</div>
          <div className="row-sub">{card ? cardSummary(card) : 'Card was deleted'}</div>
          {play.hits !== undefined && <div className="row-note">Hits set for this play (card: {baseHits})</div>}
          {flags && <div className="row-note">{flags}</div>}
        </button>
        <button className="icon-btn" aria-label={`Remove play ${index + 1}`} onClick={onRemove}>×</button>
      </div>
      {open && card && (
        <div className="play-opts">
          <div className="toggle-field"><span>Hits</span>
            <Stepper label={`Play ${index + 1} hits`} value={card.hits}
              onChange={(n) => onChange((p) => { p.hits = n === baseHits ? undefined : n })} />
          </div>
          <div className="toggle-field"><span>Vulnerable</span>
            <Toggle label="Vulnerable" checked={!!play.vulnerable} onChange={(v) => onChange((p) => { if (v) p.vulnerable = true; else delete p.vulnerable })} />
          </div>
          <div className="toggle-field"><span>Weakness debuff</span>
            <Toggle label="Weakness debuff" checked={!!play.weaknessDebuff} onChange={(v) => onChange((p) => { if (v) p.weaknessDebuff = true; else delete p.weaknessDebuff })} />
          </div>
          {counters.map((c) => (
            <div key={c.name} className="toggle-field"><span>{c.name}</span>
              <Stepper label={`Play ${index + 1} ${c.name} stacks`} value={play.stacks?.[c.name] ?? 0} max={c.max ?? undefined}
                onChange={(n) => onChange((p) => {
                  p.stacks ??= {}
                  if (n > 0) p.stacks[c.name] = n
                  else delete p.stacks[c.name]
                  if (!Object.keys(p.stacks).length) delete p.stacks
                })} />
            </div>
          ))}
        </div>
      )}
    </li>
  )
}
