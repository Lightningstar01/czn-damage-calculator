// Combines a character imported from Prydwen with our additions (buffs, notes, corrections).
import { buffMatches } from '../engine/buffs'
import { allNodesOn, presetCard } from '../engine/deck'
import { ELEMENTS, type Card, type CardPreset, type CharacterAdditions, type CharacterPreset, type Effect, type FragmentSetPreset, type ImportedCharacter, type PartnerPreset } from '../engine/types'

/** The Manifest Ego levels whose text raises the card upgrade potentials ('...Card Upgrade]... by 3'); some have two (E3, E5). */
export function potentialEgo(ch: ImportedCharacter): CharacterPreset['potentialEgo'] {
  return ch.manifestEgo.flatMap((m) => {
    const hit = /Basic Card Upgrade\].*?by (\d+)/s.exec(m.text)
    return hit ? [{ level: m.level, levels: Number(hit[1]) }] : []
  })
}

const joinNotes = (...notes: (string | undefined)[]) => notes.filter(Boolean).join('. ') || undefined

export function mergeCharacter(imported: ImportedCharacter, additions: CharacterAdditions = {}): CharacterPreset {
  const cards: CardPreset[] = imported.cards.map((card) => {
    const add = additions.cards?.[card.id]
    if (!add) return card
    const { replaceNotes, ...fields } = add
    return { ...card, ...fields, notes: replaceNotes ? add.notes : joinNotes(card.notes, add.notes) }
  })
  cards.push(...(additions.extraCards ?? []))
  return {
    name: imported.name,
    slug: imported.slug,
    element: imported.element,
    class: imported.class,
    rarity: imported.rarity,
    notes: additions.notes,
    ...(additions.verified ? { verified: additions.verified } : {}),
    effects: additions.effects ?? [],
    cards,
    potentials: imported.potentials.map((p) => ({ ...p, ...additions.potentials?.[p.node] })),
    manifestEgo: imported.manifestEgo.map((m) => ({ ...m, ...additions.ego?.[m.level] })),
    potentialEgo: potentialEgo(imported),
    ...(additions.triggers ? { triggers: additions.triggers } : {}),
  }
}

/** Problems with the additions files: unknown characters or card ids, duplicate effect ids, bad ego levels. Checked by the tests. */
export function checkAdditions(imported: Record<string, ImportedCharacter>, additions: Record<string, CharacterAdditions>): string[] {
  const problems: string[] = []
  for (const [slug, add] of Object.entries(additions)) {
    const ch = imported[slug]
    if (!ch) {
      problems.push(`characters/${slug}.ts: no imported character with slug '${slug}'`)
      continue
    }
    for (const id of Object.keys(add.cards ?? {})) {
      if (!ch.cards.some((c) => c.id === id)) problems.push(`characters/${slug}.ts: no card '${id}' in prydwen/${slug}.json`)
    }
    const extra = add.extraCards ?? []
    for (const c of extra) {
      if (ch.cards.some((x) => x.id === c.id) || extra.filter((x) => x.id === c.id).length > 1) {
        problems.push(`characters/${slug}.ts: extra card id '${c.id}' is used twice`)
      }
    }
    const ids = new Set([...ch.cards.map((c) => c.id), ...extra.map((c) => c.id)])
    const egoCheck = (level: number | undefined, where: string) => {
      if (level !== undefined && !ch.manifestEgo.some((m) => m.level === level)) problems.push(`characters/${slug}.ts: ${where} has Manifest Ego level ${level}, which ${ch.name} doesn't have`)
    }
    const nodeCheck = (node: string, where: string) => {
      if (!ch.potentials.some((p) => p.node === node)) problems.push(`characters/${slug}.ts: ${where} names Potential node '${node}', not in prydwen/${slug}.json`)
    }
    const dupes = (owner: string, effects: { id: string }[] = []) => {
      const seen = new Set<string>()
      for (const e of effects) {
        if (seen.has(e.id)) problems.push(`characters/${slug}.ts: effect id '${e.id}' used twice on ${owner}`)
        seen.add(e.id)
      }
    }
    if (!add.verified) problems.push(`characters/${slug}.ts: no verified date and game version`)
    for (const node of Object.keys(add.potentials ?? {})) nodeCheck(node, 'potentials')
    for (const level of Object.keys(add.ego ?? {})) egoCheck(Number(level), 'ego')
    for (const t of add.triggers ?? []) {
      if (!ids.has(t.card)) problems.push(`characters/${slug}.ts: a trigger adds unknown card '${t.card}'`)
      egoCheck(t.egoLevel, 'a trigger')
    }
    const cards = [...Object.entries(add.cards ?? {}), ...extra.map((c) => [c.id, c] as const)]
    for (const [id, c] of cards) {
      for (const made of c.creates ?? []) if (!ids.has(made)) problems.push(`characters/${slug}.ts: card '${id}' creates unknown card '${made}'`)
      for (const t of c.triggers ?? []) {
        if (!ids.has(t.card)) problems.push(`characters/${slug}.ts: card '${id}' triggers unknown card '${t.card}'`)
        egoCheck(t.egoLevel, `card '${id}' trigger`)
      }
      const text = tokens(c.text ?? '')
      for (const node of [...Object.keys(c.nodeTags ?? {}), ...Object.keys(c.nodeCard ?? {}), ...text.nodes]) nodeCheck(node, `card '${id}'`)
      for (const ref of text.refs) if (!ids.has(ref)) problems.push(`characters/${slug}.ts: card '${id}' text reads unknown card '${ref}'`)
      for (const level of text.egos) egoCheck(level, `card '${id}' text`)
      egoCheck(c.egoLevel, `card '${id}'`)
      dupes(id, c.effects)
    }
    dupes(ch.name, add.effects)
    for (const e of [...(add.effects ?? []), ...cards.flatMap(([, c]) => c.effects ?? [])]) {
      if (e.node !== undefined) nodeCheck(e.node, `effect '${e.id}'`)
      egoCheck(e.egoLevel, `effect '${e.id}'`)
      egoCheck(e.egoBelow, `effect '${e.id}'`)
    }
  }
  return problems
}

/** Potential nodes ({P3-1:...}), Manifest Ego levels ({E3:...}) and other cards ({120%@id}) named by a card text's tokens (engine/cardText.ts). */
function tokens(text: string): { nodes: string[]; egos: number[]; refs: string[] } {
  return {
    nodes: [...text.matchAll(/\{P([\d-]+):/g)].map((m) => m[1]),
    egos: [...text.matchAll(/\{E(\d+):/g)].map((m) => Number(m[1])),
    refs: [...text.matchAll(/%@([^{}]+)\}/g)].map((m) => m[1]),
  }
}

/** "Applies to" words that no card matches on purpose: effects waiting for a mechanic that's not modeled yet (DoT: Sanguine Thorn). */
const NO_CARD_YET = new Set(['DoT'])

const VALUE = /^[+-]?\d+(\.\d+)?%?$/

/** Problems that make an effect silently do nothing: an "Applies to" (or trigger, or follow-up) no card matches, a value that doesn't parse.
 * A character's own effects must match one of their cards; what reaches allies or the enemy, and partners and sets, any card. */
export function checkEffects(characters: CharacterPreset[], others: { name: string; effects: Effect[] }[]): string[] {
  const cardsOf = (ch: CharacterPreset): Card[] => (ch.cards ?? []).map((p) => presetCard(p, ch.element ?? ELEMENTS[0], p.id, allNodesOn))
  const everyCard = characters.flatMap(cardsOf)
  const problems: string[] = []
  const matches = (appliesTo: string, cards: Card[]) => NO_CARD_YET.has(appliesTo) || cards.some((c) => buffMatches({ appliesTo, condition: 'Always' }, c))
  const check = (owner: string, e: Effect, own: Card[]) => {
    const value = (v: string) => { if (!VALUE.test(v.trim()) && v.trim().toUpperCase() !== 'WEAKNESS ATTACK') problems.push(`${owner}: effect '${e.id}' has the value '${v}', which can't be read`) }
    value(e.value)
    if (e.kind !== 'Buff') return
    if (e.thresholdBonus) value(e.thresholdBonus.value)
    if (e.thresholdBonus?.max !== undefined) value(e.thresholdBonus.max)
    if (!matches(e.appliesTo, e.target === 'allies' || e.target === 'enemy' ? everyCard : own)) problems.push(`${owner}: effect '${e.id}' applies to '${e.appliesTo}', which no card matches`)
  }
  for (const ch of characters) {
    const own = cardsOf(ch)
    for (const e of ch.effects) check(ch.name, e, own)
    for (const p of ch.cards ?? []) {
      for (const e of p.effects ?? []) check(`${ch.name} ${p.name}`, e, own)
      if (p.followUp && !matches(p.followUp.appliesTo, own)) problems.push(`${ch.name} ${p.name}: its follow-up applies to '${p.followUp.appliesTo}', which no card matches`)
    }
    for (const t of [...(ch.triggers ?? []), ...(ch.cards ?? []).flatMap((p) => p.triggers ?? [])]) {
      if (!matches(t.on, everyCard)) problems.push(`${ch.name}: a trigger of '${t.card}' is set off by '${t.on}', which no card matches`)
    }
  }
  for (const o of others) for (const e of o.effects) check(o.name, e, everyCard)
  return problems
}

/** Problems with the hand-entered partners and sets: a file without a default export, repeated names or effect ids (saved switches are keyed "Owner|effectId"). Checked by the tests. */
export function checkPartnersAndSets(partners: Record<string, PartnerPreset | undefined>, sets: FragmentSetPreset[]): string[] {
  const problems: string[] = []
  const names = new Set<string>()
  const owners = [
    ...Object.entries(partners).map(([slug, p]) => [`partners/${slug}.ts`, p] as const),
    ...sets.map((s) => ['fragmentSets.ts', s] as const),
  ]
  for (const [file, owner] of owners) {
    if (!owner) {
      problems.push(`${file}: no default export`)
      continue
    }
    if (names.has(owner.name)) problems.push(`${file}: the name '${owner.name}' is used twice`)
    names.add(owner.name)
    const ids = new Set<string>()
    for (const e of owner.effects) {
      if (ids.has(e.id)) problems.push(`${file}: effect id '${e.id}' used twice on ${owner.name}`)
      ids.add(e.id)
    }
  }
  return problems
}
