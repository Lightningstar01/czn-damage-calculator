// A build's deck: the cards picked on the Cards tab, plus the cards that come with them: the Ego skill, and the cards
// a picked card creates (CardPreset.creates, e.g. Rossweisse's shards), which no one adds by hand (owner, 2026-10-27).
import { ELEMENTS, type Build, type Card, type CardPreset, type CharacterPreset, type DeckCard, type Element, type PotentialUpgrade, type Teammate } from './types'

/** Id prefix of the cards that come with others: 'auto:<preset id>', so attack list plays can point at them. */
export const AUTO = 'auto:'

export interface DeckItem {
  card: Card
  preset?: CardPreset
  /** The picked DeckCard's id (a teammate's: its index in Teammate.cards); missing for cards that come with others. */
  entry?: string
  /** For cards that come with others: the card that creates it, or 'Auto' for the Ego skill. */
  createdBy?: string
}

/** Potential that raises a preset card: Basic cards Basic, Ego skills none, the rest (generated too) Signature. */
export function cardUpgrade(p: CardPreset): PotentialUpgrade | undefined {
  if (p.upgrade !== undefined) return p.upgrade ?? undefined
  if ((p.tags ?? '').split(',').some((t) => t.trim() === 'Basic')) return 'Basic'
  if (p.category === 'Ego Skill') return undefined
  return 'Signature'
}

/** The card a preset plays as; element: the character's (unless the preset sets its own). */
export function presetCard(p: CardPreset, element: Element, id: string): Card {
  return {
    id, name: p.name, cardType: p.cardType, element: p.element ?? element, cost: p.cost ?? null, tags: p.tags ?? '',
    scaling: p.scaling ?? 'ATK', kind: p.kind ?? 'Normal', pct: p.pct, hits: p.hits, weaknessApplies: !!p.weaknessApplies,
    targetRavaged: !!p.targetRavaged, upgrade: cardUpgrade(p), preset: p.id, ...(p.perCost ? { perCost: true } : {}),
  }
}

/** The cards of a deck in order: the Ego skill first, then each picked card followed by the cards it creates (once each). */
export function deckItems(ch: CharacterPreset | undefined, picked: DeckCard[]): DeckItem[] {
  const all = ch?.cards ?? []
  const byId = new Map(all.map((p) => [p.id, p]))
  const element = ch?.element ?? ELEMENTS[0]
  const out: DeckItem[] = []
  const brought = new Set<string>()
  const bringCreated = (p: CardPreset) => {
    for (const id of p.creates ?? []) {
      const c = byId.get(id)
      if (c) bring(c, p.name)
    }
  }
  const bring = (p: CardPreset, by: string) => {
    if (brought.has(p.id)) return
    brought.add(p.id)
    out.push({ card: presetCard(p, element, AUTO + p.id), preset: p, createdBy: by })
    bringCreated(p)
  }
  for (const p of all) if (p.category === 'Ego Skill') bring(p, 'Auto')
  for (const d of picked) {
    if (d.custom) {
      // A custom card copied from a preset keeps the preset's effects
      out.push({ card: { ...d.custom, id: d.id }, preset: d.custom.preset ? byId.get(d.custom.preset) : undefined, entry: d.id })
      continue
    }
    const p = d.preset ? byId.get(d.preset) : undefined
    if (!p) continue
    out.push({ card: presetCard(p, element, d.id), preset: p, entry: d.id })
    bringCreated(p)
  }
  return out
}

/** The build's deck. */
export function buildDeck(ch: CharacterPreset | undefined, build: Pick<Build, 'deck'>): DeckItem[] {
  return deckItems(ch, build.deck ?? [])
}

/** A teammate's deck: their picked cards (entry = index in Teammate.cards), Ego skill and created cards. */
export function teammateDeck(ch: CharacterPreset | undefined, t: Teammate): DeckItem[] {
  return deckItems(ch, (t.cards ?? []).map((preset, i) => ({ id: String(i), preset })))
}

/** The distinct card presets of a deck (a card picked twice counts once), in deck order. */
export function deckPresets(items: DeckItem[]): CardPreset[] {
  return [...new Map(items.filter((i) => i.preset).map((i) => [i.preset!.id, i.preset!])).values()]
}

/** Drop attack list plays whose card left the deck (removed, or no longer created by anything). */
export function prunePlays(ch: CharacterPreset | undefined, build: Build): void {
  const ids = new Set(buildDeck(ch, build).map((i) => i.card.id))
  build.rotation = (build.rotation ?? []).filter((p) => ids.has(p.cardId))
}

/** Give a picked card another epiphany. Its plays follow (same entry id); plays of the cards the old version created move to the
 * new version's card in the same place of `creates` (Shard:Light (Amped) -> Shard:Light (Cycle)), then plays left without a card go. */
export function changeEpiphany(ch: CharacterPreset | undefined, build: Build, entryId: string, presetId: string): void {
  const d = build.deck.find((x) => x.id === entryId)
  if (!d) return
  const find = (id?: string) => ch?.cards?.find((p) => p.id === id)
  const before = find(d.preset)?.creates ?? []
  const after = find(presetId)?.creates ?? []
  d.preset = presetId
  delete d.custom
  const still = new Set(buildDeck(ch, build).map((i) => i.card.id))
  const moved = new Map<string, string>()
  before.forEach((id, i) => { if (after[i] && !still.has(AUTO + id)) moved.set(AUTO + id, AUTO + after[i]) })
  for (const p of build.rotation ?? []) p.cardId = moved.get(p.cardId) ?? p.cardId
  prunePlays(ch, build)
}
