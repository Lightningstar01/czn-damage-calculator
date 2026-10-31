// Shorthands for writing character additions (src/data/characters/<slug>.ts).
import type { BuffEffect } from '../engine/types'

/** E3 / E5's wording in game (the +3 itself is read from the import: potentialEgo in merge.ts). */
export const EGO_POTENTIALS_PLUS_3 = 'Increase the level of [Basic Card Upgrade], [Signature Card Upgrade], and [Common Card Upgrade] in Potentials by 3.'

/** A card's buff on all hits, always on; category Card Epiphany. */
export const cardBuff = (id: string, name: string, value: string, appliesTo: string, extra: Partial<BuffEffect> = {}): BuffEffect => ({
  kind: 'Buff', id, name, category: 'Card Epiphany', value, appliesTo, hitScope: 'All hits', condition: 'Always', ...extra,
})
