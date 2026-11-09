// A build's deck: the cards picked on the Cards tab, plus the cards that come with them: the Ego skill, and the cards
// a picked card creates (CardPreset.creates, e.g. Rossweisse's shards), which no one adds by hand (owner, 2026-10-27).
import { withLinkedTeam, type Saves } from './team'
import { ELEMENTS, type Build, type Card, type CardPreset, type CardTargets, type CharacterPreset, type DeckCard, type Element, type LiveTeammate, type PotentialUpgrade } from './types'

/** Id prefix of the cards that come with others: 'auto:<preset id>', so attack list plays can point at them. */
export const AUTO = 'auto:'

export interface DeckItem {
  card: Card
  preset?: CardPreset
  /** The picked DeckCard's id (a teammate's: its index in Teammate.cards); missing for cards that come with others. */
  entry?: string
  /** For cards that come with others: the card that creates it, 'Auto' for the Ego skill, 'E6' for a Manifest Ego card. */
  createdBy?: string
}

/** Who a card's damage hits, from its text's first line with "Damage" in it (owner, 2026-11-08: "reviewed from card text"): 'to all
 * enemies' = All, 'random enemy/enemies' = Random, anything else (or no damage line) = Single. CardPreset.targets overrides it. */
export function cardTargets(text: string): CardTargets {
  const line = text.split('\n').find((l) => /damage/i.test(l)) ?? ''
  if (/all enemies/i.test(line)) return 'All'
  if (/random enem/i.test(line)) return 'Random'
  return 'Single'
}

/** Potential that raises a preset card: Basic cards Basic, Ego skills none, the rest (generated too) Signature. */
export function cardUpgrade(p: CardPreset): PotentialUpgrade | undefined {
  if (p.upgrade !== undefined) return p.upgrade ?? undefined
  if ((p.tags ?? '').split(',').some((t) => t.trim() === 'Basic')) return 'Basic'
  if (p.category === 'Ego Skill') return undefined
  return 'Signature'
}

/** Whether a Potential node is on: missing switches count as on (unlinked teammates have none). */
export type NodeOn = (node: string) => boolean
export const allNodesOn: NodeOn = () => true
export const buildNodeOn = (build: Pick<Build, 'potentialNodes'>): NodeOn => (node) => build.potentialNodes?.[node] !== false

/** The preset's tags plus the ones its switched-on Potential nodes add (nodeTags). */
export function presetTags(p: CardPreset, nodeOn: NodeOn = allNodesOn): string {
  const added = Object.entries(p.nodeTags ?? {}).filter(([node]) => nodeOn(node)).map(([, tags]) => tags)
  return [p.tags ?? '', ...added].filter(Boolean).join(', ')
}

/** The card a preset plays as; element: the character's (unless the preset sets its own). */
export function presetCard(p: CardPreset, element: Element, id: string, nodeOn: NodeOn = allNodesOn): Card {
  const changed = Object.entries(p.nodeCard ?? {}).filter(([node]) => nodeOn(node)).map(([, fields]) => fields)
  const targets = p.targets ?? cardTargets(p.text ?? '')
  return {
    id, name: p.name, cardType: p.cardType, element: p.element ?? element, cost: p.cost ?? null, tags: presetTags(p, nodeOn),
    scaling: p.scaling ?? 'ATK', kind: p.kind ?? 'Normal', pct: p.pct, hits: p.hits, ...Object.assign({}, ...changed), weaknessApplies: !!p.weaknessApplies,
    targetRavaged: !!p.targetRavaged, upgrade: cardUpgrade(p), preset: p.id, ...(p.perCost ? { perCost: true } : {}),
    ...(p.perCount ? { perCount: p.perCount } : {}), ...(p.maxCount ? { maxCount: p.maxCount } : {}), ...(p.countsHits ? { countsHits: true } : {}), ...(p.counterHits ? { counterHits: p.counterHits } : {}), ...(p.ravagedHits ? { ravagedHits: p.ravagedHits } : {}), ...(p.fixedOf ? { fixedOf: p.fixedOf } : {}), ...(p.notACard ? { notACard: true } : {}),
    ...(targets !== 'Single' ? { targets } : {}),
  }
}

/** The cards of a deck in order: the Ego skill and the Manifest Ego cards unlocked at egoLevel first, then each picked card
 * followed by the cards it creates (once each). */
export function deckItems(ch: CharacterPreset | undefined, picked: DeckCard[], nodeOn: NodeOn = allNodesOn, egoLevel = 0): DeckItem[] {
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
    out.push({ card: presetCard(p, element, AUTO + p.id, nodeOn), preset: p, createdBy: by })
    bringCreated(p)
  }
  for (const p of all) if (p.category === 'Ego Skill') bring(p, 'Auto')
  for (const p of all) if (p.egoLevel !== undefined && egoLevel >= p.egoLevel) bring(p, `E${p.egoLevel}`)
  for (const d of picked) {
    if (d.custom) {
      // A custom card copied from a preset keeps the preset's effects
      out.push({ card: { ...d.custom, id: d.id }, preset: d.custom.preset ? byId.get(d.custom.preset) : undefined, entry: d.id })
      continue
    }
    const p = d.preset ? byId.get(d.preset) : undefined
    if (!p) continue
    out.push({ card: presetCard(p, element, d.id, nodeOn), preset: p, entry: d.id })
    bringCreated(p)
  }
  return out
}

/** The build's deck; nodeTags follow the build's Potential nodes, Manifest Ego cards its Ego level. */
export function buildDeck(ch: CharacterPreset | undefined, build: Pick<Build, 'deck' | 'potentialNodes' | 'egoLevel'>): DeckItem[] {
  return deckItems(ch, build.deck ?? [], buildNodeOn(build), build.egoLevel ?? 0)
}

/** A teammate's deck: their picked cards (entry = index in Teammate.cards; card id = the preset id, so attack list plays keep
 * pointing at it when another card is removed), Ego skill and created cards. nodeOn: their linked build's Potential nodes (a
 * withLinkedTeam teammate's live ones; all on without). */
export function teammateDeck(ch: CharacterPreset | undefined, t: Pick<LiveTeammate, 'cards' | 'egoLevel' | 'live'>,
  nodeOn: NodeOn = buildNodeOn({ potentialNodes: t.live?.potentialNodes })): DeckItem[] {
  return deckItems(ch, (t.cards ?? []).map((preset, i) => ({ id: String(i), preset })), nodeOn, t.egoLevel ?? 0)
    .map((i) => i.entry !== undefined && i.preset ? { ...i, card: { ...i.card, id: i.preset.id } } : i)
}

/** The distinct card presets of a deck (a card picked twice counts once), in deck order. */
export function deckPresets(items: DeckItem[]): CardPreset[] {
  return [...new Map(items.filter((i) => i.preset).map((i) => [i.preset!.id, i.preset!])).values()]
}

/** Drop the main character's attack list plays whose card left the deck (removed, or no longer created by anything). */
export function prunePlays(ch: CharacterPreset | undefined, build: Build): void {
  const ids = new Set(buildDeck(ch, build).map((i) => i.card.id))
  build.rotation = (build.rotation ?? []).filter((p) => p.by !== undefined || ids.has(p.cardId))
}

/** Drop a teammate slot's plays whose card left their deck (all of them when the slot is empty). saves: a linked slot's deck has its
 * saved build's Manifest Ego cards and Potential nodes. */
export function pruneTeamPlays(ch: CharacterPreset | undefined, build: Build, slot: number, saves: Saves = {}): void {
  const t = withLinkedTeam(build, saves).team?.[slot]
  const ids = new Set(t?.character ? teammateDeck(ch, t).map((i) => i.card.id) : [])
  build.rotation = (build.rotation ?? []).filter((p) => p.by !== slot || ids.has(p.cardId))
}

/** Give a picked card another epiphany. Its plays follow (same entry id); plays of the cards the old version created move to the
 * new version's card in the same place of `creates` (Shard:Light (Amped) -> Shard:Light (Cycle)), then plays left without a card go. */
export function changeEpiphany(ch: CharacterPreset | undefined, build: Build, entryId: string, presetId: string): void {
  const d = build.deck.find((x) => x.id === entryId)
  if (!d) return
  const from = d.preset
  d.preset = presetId
  delete d.custom
  const moved = createdMoves(ch, from, presetId, new Set(buildDeck(ch, build).map((i) => i.card.id)))
  for (const p of build.rotation ?? []) if (p.by === undefined) p.cardId = moved.get(p.cardId) ?? p.cardId
  prunePlays(ch, build)
}

/** changeEpiphany for a teammate's picked card (index in Teammate.cards): their plays follow it, unless another copy keeps the old
 * version, and so do the plays of the cards it creates. */
export function changeTeammateEpiphany(ch: CharacterPreset | undefined, build: Build, slot: number, index: number, presetId: string,
  saves: Saves = {}): void {
  const cards = build.team[slot].cards
  const from = cards[index]
  cards[index] = presetId
  const t = withLinkedTeam(build, saves).team[slot]
  const moved = createdMoves(ch, from, presetId, new Set(teammateDeck(ch, t).map((i) => i.card.id)))
  if (!cards.includes(from)) moved.set(from, presetId)
  for (const p of build.rotation ?? []) if (p.by === slot) p.cardId = moved.get(p.cardId) ?? p.cardId
  pruneTeamPlays(ch, build, slot, saves)
}

/** Plays of the cards an old epiphany created move to the ones the new one creates, unless another card still creates them (still: the deck's ids now). */
function createdMoves(ch: CharacterPreset | undefined, from: string | undefined, to: string, still: Set<string>): Map<string, string> {
  const find = (id?: string) => ch?.cards?.find((p) => p.id === id)
  const after = find(to)?.creates ?? []
  const moved = new Map<string, string>()
  ;(find(from)?.creates ?? []).forEach((id, i) => { if (after[i] && !still.has(AUTO + id)) moved.set(AUTO + id, AUTO + after[i]) })
  return moved
}
