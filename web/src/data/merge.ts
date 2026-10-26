// Combines a character imported from Prydwen with our additions (buffs, notes, corrections).
import type { CardPreset, CharacterAdditions, CharacterPreset, ImportedCharacter } from '../engine/types'

const joinNotes = (...notes: (string | undefined)[]) => notes.filter(Boolean).join('. ') || undefined

export function mergeCharacter(imported: ImportedCharacter, additions: CharacterAdditions = {}): CharacterPreset {
  const cards: CardPreset[] = imported.cards.map((card) => {
    const add = additions.cards?.[card.id]
    if (!add) return card
    return { ...card, ...add, notes: joinNotes(card.notes, add.notes) }
  })
  return {
    name: imported.name,
    slug: imported.slug,
    element: imported.element,
    class: imported.class,
    rarity: imported.rarity,
    notes: additions.notes,
    effects: additions.effects ?? [],
    cards,
    potentials: imported.potentials,
    manifestEgo: imported.manifestEgo,
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
    const dupes = (owner: string, effects: { id: string }[] = []) => {
      const seen = new Set<string>()
      for (const e of effects) {
        if (seen.has(e.id)) problems.push(`characters/${slug}.ts: effect id '${e.id}' used twice on ${owner}`)
        seen.add(e.id)
      }
    }
    dupes(ch.name, add.effects)
    for (const e of [...(add.effects ?? []), ...Object.values(add.cards ?? {}).flatMap((c) => c.effects ?? [])]) {
      if (e.egoLevel !== undefined && !ch.manifestEgo.some((m) => m.level === e.egoLevel)) {
        problems.push(`characters/${slug}.ts: effect '${e.id}' has egoLevel ${e.egoLevel}, which ${ch.name} doesn't have`)
      }
    }
    for (const [id, c] of Object.entries(add.cards ?? {})) dupes(id, c.effects)
  }
  return problems
}
