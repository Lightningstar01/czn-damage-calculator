// Shorthands for writing character additions (src/data/characters/<slug>.ts).
import type { BuffEffect } from '../engine/types'

/** A card's buff on all hits, always on; category Card Epiphany. */
export const cardBuff = (id: string, name: string, value: string, appliesTo: string, extra: Partial<BuffEffect> = {}): BuffEffect => ({
  kind: 'Buff', id, name, category: 'Card Epiphany', value, appliesTo, hitScope: 'All hits', condition: 'Always', ...extra,
})
