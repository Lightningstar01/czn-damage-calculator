// Shorthands for writing character additions (src/data/characters/<slug>.ts).
import type { BuffEffect, StackEffect, StackTrigger } from '../engine/types'

/** A card's buff on all hits, always on; category Card Epiphany. */
export const cardBuff = (id: string, name: string, value: string, appliesTo: string, extra: Partial<BuffEffect> = {}): BuffEffect => ({
  kind: 'Buff', id, name, category: 'Card Epiphany', value, appliesTo, hitScope: 'All hits', condition: 'Always', ...extra,
})

/** Adds stacks to a rotation counter (e.g. 'Ember') when cards are played; category Card Epiphany. */
export const stacks = (id: string, name: string, counter: string, amount: number, trigger: StackTrigger,
  extra: Partial<StackEffect> = {}): StackEffect => ({
  kind: 'Stacks', id, name, category: 'Card Epiphany', counter, amount, trigger, ...extra,
})
