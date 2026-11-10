// Shorthands for writing character additions (src/data/characters/<slug>.ts).
import type { BuffEffect, CardPreset, Element, Trigger } from '../engine/types'

/** E3 / E5's wording in game (the +3 itself is read from the import: potentialEgo in merge.ts). */
export const EGO_POTENTIALS_PLUS_3 = 'Increase the level of [Basic Card Upgrade], [Signature Card Upgrade], and [Common Card Upgrade] in Potentials by 3.'

/** A card's buff on all hits, always on; category Card Epiphany. */
export const cardBuff = (id: string, name: string, value: string, appliesTo: string, extra: Partial<BuffEffect> = {}): BuffEffect => ({
  kind: 'Buff', id, name, category: 'Card Epiphany', value, appliesTo, hitScope: 'All hits', condition: 'Always', ...extra,
})

/** A character's maker of hits from effects, not cards being played (Mark, Metallization, E2...), for extraCards. Normal ATK damage, 1 hit, unraised by
 * card upgrades, unless `defaults` or the hit's `extra` say otherwise (upgrade: undefined = raised like their other generated cards). */
export const effectHits = (defaults: Pick<CardPreset, 'element'> & Partial<CardPreset>) =>
  (id: string, name: string, pct: number, text: string, extra: Partial<CardPreset> = {}): CardPreset => ({
    id, base: name, name, category: 'Generated Card', cardType: 'Attack', cost: null, tags: '', scaling: 'ATK', kind: 'Normal', hits: 1,
    weaknessApplies: false, upgrade: null, notACard: true, ...defaults, pct, text, ...extra,
  })

/** The Mark keyword's wording in game. */
export const MARK_TEXT = 'When an Attack Card is activated, inflict 100% Extra Attack, and decrease Mark by 1'

/** The Mark keyword, the same for every character (owner, 2026-11-09): "When an Attack Card is activated, inflict 100% Extra Attack ... and
 * decrease Mark by 1". The inflicter's own 100% Extra Attack, unraised by card upgrades, set off by every Attack Card play (anyone's) while
 * the play's Mark counter is above 0. Each inflicter has its own counter ('Mark (Luke)'; Selena's is plain 'Mark'), so the hit uses their
 * build. `card` goes in the character's extraCards; `trigger` in its triggers, or those of the card that inflicts it. */
export function markKeyword(element: Element, counter: string,
  { id = 'mark', name = 'Mark', text = MARK_TEXT, ...extra }: Partial<CardPreset> = {}): { card: CardPreset; trigger: Trigger } {
  return {
    card: effectHits({ element, kind: 'Extra Attack' })(id, name, 1, text, { tags: 'Mark', ...extra }),
    trigger: { card: id, on: 'Attack', counter },
  }
}
