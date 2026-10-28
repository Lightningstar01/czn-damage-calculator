// Cards: the active build's attack list (one entry per play), its deck (pictures of the picked cards; the Ego skill and created
// cards come with them) and the card picker: a character's base cards, then a card's epiphanies, then Add (owner, 2026-10-27).
import { DndContext, KeyboardSensor, PointerSensor, TouchSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useState } from 'react'
import { PRESETS } from '../data/presets'
import { playCard, playCount } from '../engine/calc'
import { activeBuffs, activeCounters, findCharacter } from '../engine/buffs'
import { buildDeck, changeEpiphany, deckItems, prunePlays, teammateDeck, type DeckItem } from '../engine/deck'
import { TEAM_SIZE, type Card, type CardPreset, type CharacterPreset, type RotationPlay, type Teammate } from '../engine/types'
import { newId } from '../store/save'
import { useCharacter, useStore } from '../store/store'
import { CardFace, customText, useCardText } from './CardFace'
import { pct } from './format'
import { Section, SelectField, Sheet, Stepper, Toggle } from './inputs'

export function CardsTab() {
  return (
    <>
      <RotationSection />
      <DeckSection />
      <AddCardsSection />
    </>
  )
}

function cardSummary(c: Card): string {
  const amount = `${c.scaling === 'Fixed' ? `${+c.pct.toFixed(4)} fixed` : pct(c.pct, 2)}${c.upgrade ? ` base (${c.upgrade})` : ''}`
  return `${c.cost === null ? '' : `${c.cost} AP · `}${c.cardType} · ${amount} × ${c.hits} hit${c.hits === 1 ? '' : 's'}${c.scaling === 'DEF' ? ' · DEF' : ''}${c.kind !== 'Normal' ? ` · ${c.kind}` : ''}`
}

/** Whose cards: the build's character, a teammate slot (no ch when empty), or Other (neutral / seasonal cards, later). */
interface Owner {
  key: string
  name: string
  ch?: CharacterPreset
  /** Teammate slot and teammate, for a teammate's cards. */
  slot?: number
  teammate?: Teammate
}

const OTHER: Owner = { key: 'other', name: 'Other' }

function useOwners(): Owner[] {
  const { name, build } = useCharacter()!
  const team = Array.from({ length: TEAM_SIZE }, (_, i) => build.team?.[i])
  return [
    { key: 'main', name, ch: findCharacter(PRESETS, name) },
    ...team.map((t, i): Owner => t?.character
      ? { key: `t${i}`, name: t.character, ch: findCharacter(PRESETS, t.character), slot: i, teammate: t }
      : { key: `t${i}`, name: `Teammate ${i + 1}`, slot: i }),
  ]
}

/** A character's base cards (Starting and Unique cards; not Ego skills or created cards), each with its versions (base + epiphanies). */
function baseCards(ch: CharacterPreset | undefined): { base: CardPreset; versions: CardPreset[] }[] {
  const all = ch?.cards ?? []
  const bases = [...new Set(all.filter((p) => p.category === 'Starting Card' || p.category === 'Unique Card').map((p) => p.base))]
  return bases.map((b) => {
    const versions = all.filter((p) => p.base === b && p.category !== 'Generated Card' && p.category !== 'Ego Skill')
    return { base: versions.find((p) => p.name === b) ?? versions[0], versions }
  })
}

function versionsOf(ch: CharacterPreset | undefined, p: CardPreset): CardPreset[] {
  return baseCards(ch).find((b) => b.versions.some((v) => v.id === p.id))?.versions ?? [p]
}

/** A deck tile: copies of a picked card share one (×N). entries: their ids (a teammate's: index in Teammate.cards). */
interface Tile { item: DeckItem; entries: string[] }

function toTiles(items: DeckItem[], isCustom: (i: DeckItem) => boolean): Tile[] {
  const out: Tile[] = []
  for (const item of items) {
    const same = item.entry && !isCustom(item) && out.find((t) => t.item.entry && !isCustom(t.item) && t.item.preset?.id === item.preset?.id)
    if (same) same.entries.push(item.entry!)
    else out.push({ item, entries: item.entry ? [item.entry] : [] })
  }
  return out
}

const createdNote = (by?: string) => by === 'Auto' ? 'Comes with every deck' : by ? `Created by ${by}` : undefined

/** The build's deck: the character's cards, each teammate's (they only bring buffs), then custom cards from older saves. */
function DeckSection() {
  const { cs, build, updateBuild } = useCharacter()!
  const owners = useOwners()
  const [open, setOpen] = useState<{ owner: Owner; tile: Tile } | null>(null)
  const others = cs.builds.filter((b) => b.id !== build.id)
  const main = owners[0]
  const items = buildDeck(main.ch, build)
  const isCustom = (i: DeckItem) => !!i.entry && !!build.deck.find((d) => d.id === i.entry)?.custom
  const groups = [
    { owner: main, items: items.filter((i) => !isCustom(i)) },
    ...owners.slice(1).filter((o) => o.teammate).map((o) => ({ owner: o, items: teammateDeck(o.ch, o.teammate!) })),
    { owner: OTHER, items: items.filter(isCustom) },
  ].filter((g) => g.items.length)
  return (
    <Section title={`${build.name} deck`}
      help="The cards this build brings, picked under Add cards. The Ego skill comes with every deck, and the cards a card creates (like Rossweisse's shards) come with that card. Their buffs show on the Buffs tab. Teammates' cards only bring their buffs for allies and the enemy. Tap a card to play it, change its epiphany or remove it. Each build has its own deck.">
      {others.length > 0 && (
        <SelectField label="Copy the deck from" value=""
          options={[{ value: '', label: 'Pick a build…' }, ...others.map((b) => ({ value: b.id, label: `${b.name} (${b.deck?.length ?? 0} cards)` }))]}
          onChange={(id) => {
            const src = others.find((b) => b.id === id)
            if (!src || (build.deck.length && !confirm(`Replace ${build.name}'s cards with ${src.name}'s? Plays of cards that aren't in it go.`))) return
            updateBuild((b) => { b.deck = structuredClone(src.deck ?? []); prunePlays(main.ch, b) })
          }} />
      )}
      {groups.map((g) => (
        <DeckGroup key={g.owner.key} owner={g.owner} tiles={toTiles(g.items, isCustom)} onOpen={(tile) => setOpen({ owner: g.owner, tile })} />
      ))}
      {open && <DeckCardSheet owner={open.owner} tile={open.tile} onClose={() => setOpen(null)} />}
    </Section>
  )
}

function DeckGroup({ owner, tiles, onOpen }: { owner: Owner; tiles: Tile[]; onOpen: (t: Tile) => void }) {
  const text = useCardText(owner.teammate)
  return (
    <>
      <h3 className="deck-owner">{owner.name}{owner.teammate && <span className="tag">buffs only</span>}</h3>
      <div className="card-grid">
        {tiles.map((t) => (
          <CardFace key={t.item.card.id} preset={t.item.preset} card={t.item.card} note={createdNote(t.item.createdBy)}
            text={owner.key === 'other' || !t.item.preset ? customText(t.item.card) : text(t.item.preset)} onClick={() => onOpen(t)}
            badges={t.entries.length > 1 && <span className="cf-badge">×{t.entries.length}</span>} />
        ))}
      </div>
    </>
  )
}

/** A deck card, large: + Play (the build's character), Change epiphany, Remove (one copy). Cards that come with others: + Play only. */
function DeckCardSheet({ owner, tile, onClose }: { owner: Owner; tile: Tile; onClose: () => void }) {
  const { build, updateBuild } = useCharacter()!
  const text = useCardText(owner.teammate)
  const [changing, setChanging] = useState(false)
  const [played, setPlayed] = useState(0)
  const { item } = tile
  const custom = owner.key === 'other'
  const p = custom ? undefined : item.preset
  const entry = tile.entries[tile.entries.length - 1]
  const versions = p && entry ? versionsOf(owner.ch, p) : []
  const isMain = !owner.teammate
  const plays = (build.rotation ?? []).filter((x) => x.cardId === item.card.id).length
  const remove = () => {
    if (isMain) {
      if (plays && !confirm(`Remove ${item.card.name}? Its ${plays} play${plays === 1 ? '' : 's'} in the attack list go too.`)) return
      updateBuild((b) => { b.deck = b.deck.filter((d) => d.id !== entry); prunePlays(findCharacter(PRESETS, owner.name), b) })
    } else {
      updateBuild((b) => { b.team[owner.slot!].cards.splice(Number(entry), 1) })
    }
    onClose()
  }
  const change = (to: CardPreset) => {
    if (isMain) updateBuild((b) => changeEpiphany(owner.ch, b, entry, to.id))
    else updateBuild((b) => { b.team[owner.slot!].cards[Number(entry)] = to.id })
    onClose()
  }
  return (
    <Sheet title={item.card.name} onClose={onClose}>
      <div className="sheet-card">
        <CardFace size="big" preset={item.preset} card={item.card} text={p ? text(p) : customText(item.card)} note={createdNote(item.createdBy)} />
      </div>
      {tile.entries.length > 1 && <p className="muted">{tile.entries.length} copies in the deck: Change epiphany and Remove act on one of them.</p>}
      {!isMain && <p className="muted">{owner.name}'s card: its buffs for allies and the enemy count; their damage isn't counted.</p>}
      <div className="btn-row">
        {isMain && (
          <button className="btn primary" onClick={() => { updateBuild((b) => { b.rotation.push({ cardId: item.card.id }) }); setPlayed(played + 1) }}>
            + Play
          </button>
        )}
        {versions.length > 1 && <button className="btn" aria-expanded={changing} onClick={() => setChanging(!changing)}>Change epiphany</button>}
        {entry && <button className="btn danger" onClick={remove}>Remove</button>}
      </div>
      {played > 0 && <p className="muted">Added {played === 1 ? 'a play' : `${played} plays`} at the end of the attack list.</p>}
      {changing && p && (
        <div className="card-grid gap-top">
          {versions.map((v) => (
            <CardFace key={v.id} preset={v} text={text(v)} onClick={v.id === p.id ? undefined : () => change(v)}
              badges={v.id === p.id && <span className="cf-badge">Now</span>} />
          ))}
        </div>
      )}
    </Sheet>
  )
}

/** Pick whose cards, then a base card, then (if it has epiphanies) the version, then confirm. */
function AddCardsSection() {
  const { build, updateBuild } = useCharacter()!
  const owners = useOwners()
  const [who, setWho] = useState('main')
  const [base, setBase] = useState<string | null>(null)
  const [adding, setAdding] = useState<CardPreset | null>(null)
  // A teammate slot that was emptied falls back to the build's character
  const owner = who === OTHER.key ? OTHER : owners.find((o) => o.key === who && (o.ch || o.key === 'main')) ?? owners[0]
  const text = useCardText(owner.teammate)
  const bases = baseCards(owner.ch)
  const picked = owner.teammate ? owner.teammate.cards : build.deck.flatMap((d) => d.preset ?? [])
  const inDeck = (ids: string[]) => picked.filter((id) => ids.includes(id)).length
  const open = base !== null ? bases.find((b) => b.base.base === base) : undefined
  const add = (p: CardPreset) => {
    updateBuild((b) => {
      if (owner.slot === undefined) b.deck.push({ id: newId(), preset: p.id })
      else b.team[owner.slot].cards.push(p.id)
    })
    setAdding(null)
    setBase(null)
  }
  const inDeckBadge = (n: number) => n > 0 && <span className="cf-badge">In deck{n > 1 ? ` ×${n}` : ''}</span>
  return (
    <Section title="Add cards" help="Pick whose cards, then a card. A card with epiphanies shows its base version and its 5 epiphanies next. The card text uses this build's potentials and Manifest Ego (Setup tab); teammates' cards show their base %. Teammates are picked on the Setup tab.">
      <div className="owner-chips" role="tablist">
        {[...owners, OTHER].map((o) => (
          <button key={o.key} role="tab" aria-selected={owner.key === o.key} className={`owner-chip ${owner.key === o.key ? 'active' : ''}`}
            disabled={o.key.startsWith('t') && !o.ch} onClick={() => { setWho(o.key); setBase(null) }}>
            {o.name}
          </button>
        ))}
      </div>
      {owner === OTHER ? (
        <p className="muted">Neutral and seasonal cards will be here later.</p>
      ) : open ? (
        <>
          <div className="picker-head">
            <button className="link" onClick={() => setBase(null)}>‹ All cards</button>
            <span className="muted">{open.base.base}: base + {open.versions.length - 1} epiphanies</span>
          </div>
          <div className="card-grid">
            {open.versions.map((v) => (
              <CardFace key={v.id} preset={v} text={text(v)} onClick={() => setAdding(v)} badges={inDeckBadge(inDeck([v.id]))} />
            ))}
          </div>
        </>
      ) : (
        <div className="card-grid">
          {bases.map(({ base: b, versions }) => (
            <CardFace key={b.id} preset={b} text={text(b)} onClick={() => versions.length > 1 ? setBase(b.base) : setAdding(b)}
              note={versions.length > 1 ? `Base + ${versions.length - 1} epiphanies ›` : undefined}
              badges={inDeckBadge(inDeck(versions.map((v) => v.id)))} />
          ))}
        </div>
      )}
      {owner.teammate && <p className="muted">{owner.name}'s cards only bring their buffs for allies and the enemy.</p>}
      <p className="muted small">Card art: Chaos Zero Nightmare, via cznmetadecks.com and Prydwen.gg.</p>
      {adding && (
        <Sheet title={`Add ${adding.name}?`} onClose={() => setAdding(null)}>
          <div className="sheet-card"><CardFace size="big" preset={adding} text={text(adding)} /></div>
          {!!adding.creates?.length && (
            <p className="muted">Comes with: {deckItems(owner.ch, [{ id: 'new', preset: adding.id }])
              .filter((i) => i.createdBy && i.createdBy !== 'Auto').map((i) => i.card.name).join(', ')}</p>
          )}
          <div className="btn-row">
            <button className="btn primary" onClick={() => add(adding)}>Add{owner.teammate ? ` to ${owner.name}'s cards` : ''}</button>
            <button className="btn" onClick={() => setAdding(null)}>Cancel</button>
          </div>
        </Sheet>
      )}
    </Section>
  )
}

/** The attack list's "+ Play": the deck's cards as small pictures; each tap adds a play at the end. */
function PlayPicker({ onClose }: { onClose: () => void }) {
  const { name, build, updateBuild } = useCharacter()!
  // Copies of a card show once
  const items = buildDeck(findCharacter(PRESETS, name), build)
    .filter((i, n, all) => !i.card.preset || all.findIndex((x) => x.card.preset === i.card.preset) === n)
  const [added, setAdded] = useState<string[]>([])
  return (
    <Sheet title="Add plays" onClose={onClose}>
      {!items.length && <p className="muted">The deck is empty: add cards under Add cards first.</p>}
      <div className="card-grid mini">
        {items.map((i) => (
          <CardFace key={i.card.id} size="mini" preset={i.preset} card={i.card} label={`Play ${i.card.name}`}
            onClick={() => { updateBuild((b) => { b.rotation.push({ cardId: i.card.id }) }); setAdded([...added, i.card.name]) }} />
        ))}
      </div>
      {added.length > 0 && <p className="muted">Added: {added.join(', ')}</p>}
      <div className="btn-row"><button className="btn primary" onClick={onClose}>Done</button></div>
    </Sheet>
  )
}

/** The active build's attack list. Entries need unique ids for drag and drop. */
function RotationSection() {
  const { name, cs, build, updateBuild } = useCharacter()!
  const { data: { settings } } = useStore()
  const [open, setOpen] = useState<number | null>(null)
  const [picking, setPicking] = useState(false)
  const ch = findCharacter(PRESETS, name)
  const cards = new Map(buildDeck(ch, build).map((i) => [i.card.id, i.card]))
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
      actions={(
        <span className="btn-row tight">
          {rotation.length > 0 && <button className="btn small" onClick={() => { if (confirm(`Clear ${build.name}'s attack list?`)) updateBuild((b) => { b.rotation = [] }) }}>Clear</button>}
          <button className="btn small primary" onClick={() => setPicking(true)}>+ Play</button>
        </span>
      )}>
      {!rotation.length && <p className="muted">Empty. Tap “+ Play”, or a card in the deck below.</p>}
      {others.length > 0 && (
        <SelectField label="Copy the attack list from" value=""
          options={[{ value: '', label: 'Pick a build…' }, ...others.map((b) => ({ value: b.id, label: `${b.name} (${b.rotation?.length ?? 0} plays)` }))]}
          onChange={(id) => {
            const src = others.find((b) => b.id === id)
            if (!src || (rotation.length && !confirm(`Replace ${build.name}'s attack list with ${src.name}'s?`))) return
            // Its cards that this deck lacks come along
            updateBuild((b) => {
              b.rotation = structuredClone(src.rotation ?? [])
              for (const d of src.deck ?? []) if (!b.deck.some((x) => x.id === d.id) && b.rotation.some((x) => x.cardId === d.id)) b.deck.push(structuredClone(d))
            })
          }} />
      )}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <ol className="rows rotation">
            {rotation.map((play, i) => {
              const base = cards.get(play.cardId)
              return (
                <RotationItem key={ids[i]} id={ids[i]} index={i} play={play} card={base && playCard(base, play)} baseHits={base?.hits} baseCost={base?.cost}
                  counters={counters} open={open === i} onToggle={() => setOpen(open === i ? null : i)}
                  onChange={(fn) => updateBuild((b) => fn(b.rotation[i]))}
                  onRemove={() => { updateBuild((b) => { b.rotation.splice(i, 1) }); setOpen(null) }} />
              )
            })}
          </ol>
        </SortableContext>
      </DndContext>
      {picking && <PlayPicker onClose={() => setPicking(false)} />}
    </Section>
  )
}

function playFlags(play: RotationPlay): string {
  const stacks = Object.entries(play.stacks ?? {}).filter(([, n]) => n > 0).map(([name, n]) => `${name} ${n}`)
  return [...(play.vulnerable ? ['Vulnerable'] : []), ...(play.weaknessDebuff ? ['Weakness debuff'] : []), ...stacks].join(' · ')
}

/** baseHits: the card's own hits. counters: the per-play stacks the switched-on buffs read. */
function RotationItem({ id, index, play, card, baseHits, baseCost, counters, open, onToggle, onChange, onRemove }: {
  id: string; index: number; play: RotationPlay; card?: Card; baseHits?: number; baseCost?: number | null
  counters: { name: string; max: number | null }[]
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
          <div className="row-sub">{card ? cardSummary(card) : 'Card is not in the deck'}</div>
          {play.hits !== undefined && <div className="row-note">Hits set for this play (card: {baseHits})</div>}
          {card?.perCost && <div className="row-note">Damage × Cost {card.cost}{play.cost !== undefined ? ` (card: ${baseCost})` : ''}</div>}
          {card?.perCount && play.stacks?.[card.perCount] === undefined && <div className="row-note">Damage × {card.perCount} 1</div>}
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
          {card.perCost && (
            <div className="toggle-field"><span>Cost (damage × Cost)</span>
              <Stepper label={`Play ${index + 1} cost`} value={card.cost ?? 1} min={1} max={9}
                onChange={(n) => onChange((p) => { if (n === baseCost) delete p.cost; else p.cost = n })} />
            </div>
          )}
          {card.perCount && (
            <div className="toggle-field"><span>{card.perCount} (damage × count)</span>
              <Stepper label={`Play ${index + 1} ${card.perCount}`} value={playCount(card.perCount, play)} min={0}
                onChange={(n) => onChange((p) => {
                  p.stacks ??= {}
                  if (n !== 1) p.stacks[card.perCount!] = n
                  else delete p.stacks[card.perCount!]
                  if (!Object.keys(p.stacks).length) delete p.stacks
                })} />
            </div>
          )}
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
