// Combines a character imported from Prydwen with our additions (buffs, notes, corrections).
import type { CardPreset, CharacterAdditions, CharacterPreset, ImportedCharacter } from '../engine/types'

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
    effects: additions.effects ?? [],
    cards,
    potentials: imported.potentials.map((p) => ({ ...p, ...additions.potentials?.[p.node] })),
    manifestEgo: imported.manifestEgo,
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
    for (const [id, c] of [...Object.entries(add.cards ?? {}), ...extra.map((c) => [c.id, c] as const)]) {
      for (const made of c.creates ?? []) if (!ids.has(made)) problems.push(`characters/${slug}.ts: card '${id}' creates unknown card '${made}'`)
      for (const t of c.triggers ?? []) if (!ids.has(t.card)) problems.push(`characters/${slug}.ts: card '${id}' triggers unknown card '${t.card}'`)
    }
    for (const t of add.triggers ?? []) if (!ids.has(t.card)) problems.push(`characters/${slug}.ts: a trigger adds unknown card '${t.card}'`)
    for (const node of Object.keys(add.potentials ?? {})) {
      if (!ch.potentials.some((p) => p.node === node)) problems.push(`characters/${slug}.ts: no Potential node '${node}' in prydwen/${slug}.json`)
    }
    const dupes = (owner: string, effects: { id: string }[] = []) => {
      const seen = new Set<string>()
      for (const e of effects) {
        if (seen.has(e.id)) problems.push(`characters/${slug}.ts: effect id '${e.id}' used twice on ${owner}`)
        seen.add(e.id)
      }
    }
    dupes(ch.name, add.effects)
    for (const e of [...(add.effects ?? []), ...[...Object.values(add.cards ?? {}), ...extra].flatMap((c) => c.effects ?? [])]) {
      for (const level of [e.egoLevel, e.egoBelow]) {
        if (level !== undefined && !ch.manifestEgo.some((m) => m.level === level)) {
          problems.push(`characters/${slug}.ts: effect '${e.id}' has Manifest Ego level ${level}, which ${ch.name} doesn't have`)
        }
      }
    }
    for (const [id, c] of Object.entries(add.cards ?? {})) dupes(id, c.effects)
    for (const c of extra) dupes(c.id, c.effects)
  }
  return problems
}
