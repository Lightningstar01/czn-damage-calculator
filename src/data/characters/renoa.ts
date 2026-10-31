// Renoa: our additions to the Prydwen import (src/data/prydwen/renoa.json). Card keys are the import's ids.
// Damage % follows the "+" rule: 'by 20%' (no "+") = multiplicative, '+20%' = additive (owner, 2026-10-25).
// Potentials 3-1 and 7 add to the base % before the upgrade, measured on the cards (Card +): Dirge Bullet 238% = (160% + 40% + 5%) x 1.16,
// its Extra Attack 168% = (120% + 20% + 5%) x 1.16, Finale 238% = (200% + 5%) x 1.16 and 191% = (160% + 5%) x 1.16.
// Each discarded Dirge Bullet's Extra Attack is set off by a number on the play, for any play of the team (owner, 2026-10-30).
// Ballad III's Mark is the Mark keyword, here Renoa's own 100% Extra Attack; Flower III boosts Renoa's next card only (owner, 2026-10-30).
import type { CardPreset, CharacterAdditions } from '../../engine/types'
import { cardBuff, EGO_POTENTIALS_PLUS_3 } from '../helpers'

const DISCARDED = 'Dirge Bullets discarded'
const FINALES = 'Dirge Bullets: Finale discarded'
const BULLET_ART = 'cards/renoa/unique_1041_06.webp'

/** A hit from an effect, not a card: Renoa's Extra Attack. Raised by Signature Card Upgrade unless upgrade: null. */
const extraAttack = (id: string, name: string, pct: number, text: string, extra: Partial<CardPreset> = {}): CardPreset => ({
  id, base: name, name, category: 'Generated Card', cardType: 'Attack', cost: null, element: 'Void', tags: '', scaling: 'ATK',
  kind: 'Extra Attack', pct, hits: 1, weaknessApplies: false, notACard: true, text, ...extra,
})

/** "Discard ... +X% Damage Amount": per Dirge Bullet (or Finale) discarded on this play. */
const perDiscard = (value: string, card: string, extra: { egoLevel?: number; idSuffix?: string } = {}) => {
  const { idSuffix = '', ...rest } = extra
  return [
    cardBuff(`discard${idSuffix}`, 'Damage Amount for each Dirge Bullet discarded', value, card, { counter: DISCARDED, ...rest }),
    cardBuff(`finale${idSuffix}`, 'Damage Amount for each Dirge Bullet: Finale discarded', value, card, { counter: FINALES, ...rest }),
  ]
}

const inHand = (value: string, card: string) =>
  [cardBuff('in-hand', 'base Damage Amount for each Dirge Bullet in hand', value, card, { type: 'Base %', counter: 'Dirge Bullets in hand' })]

const creates = ['card-29']

export default {
  verified: { date: '2026-10-30', gameVersion: '841' },
  notes: 'Card upgrades are set on the Setup tab. Per play (Cards tab): Dirge Bullets discarded on any play by anyone (each adds the 168% '
    + 'Extra Attack; also Last-Ditch Assault\'s and Instant Judgment\'s bonus), Dirge Bullets in hand (Ballad of Pitch Black, I), Dirge '
    + 'Bullets exhausted (Ballad V), Ballad IV (on for that turn\'s plays), Cost discarded (Flower III), Mark (Ballad III), Rose\'s '
    + 'Resolve (E4), Dirge Bullets drawn (E6), Finales discarded (E2). Instant Judgment III: add 1 hit on the play. Instant Judgment IV\'s '
    + 'discard hit and V\'s end-of-turn hit are plays of their own. Not counted: Shields, draws, Tenacity',
  // Potential nodes in the game's wording (owner's screenshots, 2026-10-30)
  potentials: {
    '3-1': { name: 'Signature Card Proficiency', text: '+40% Damage Amount to Dirge Bullet, +20% Damage Amount to Extra Attacks' },
    '5-1': { text: "+5% Damage Amount to Renoa's Annihilation Shot\nIf Renoa's Critical Chance is 20% or higher, add an additional +5% to the modifier" },
    '7': { text: "+5% Damage Amount to Dirge Bullet\nIf Renoa's Critical Chance is 60% or higher, add an additional +10% to the modifier" },
  },
  // Manifest Ego in the game's wording (owner's screenshots, 2026-10-31)
  ego: {
    1: { text: "+20% Damage Amount to the Last-Ditch Assault card's Damage Amount added for each Dirge Bullet Discarded effect" },
    2: { text: 'For every 4 Dirge Bullet Cards created, create 1 Dirge Bullet: Finale Card.' },
    3: { text: '+200% Damage Amount to Black Thorn.' },
    4: { text: "Each time the Dirge Bullet card is Discarded, gain 1 Rose's Resolve.\nRose's Resolve: +10% to Renoa's Damage Amount, and on Shuffle, remove Rose's Resolve (max 4 stacks)" },
    5: { text: EGO_POTENTIALS_PLUS_3 },
    6: { text: 'Each time the Dirge Bullet card is Drawn, inflict 50% Extra Attack to a random enemy.' },
  },
  effects: [
    // 3-1 Signature Card Proficiency (in game): "+40% Damage Amount to Dirge Bullet, +20% Damage Amount to Extra Attacks". The +20% shows on
    // Dirge Bullet's Extra Attack only: Instant Judgment IV's is 290% = 250% x 1.16, Finale's 191% = (160% + 5%) x 1.16
    { kind: 'Buff', id: 'p3-1-bullet', node: '3-1', name: 'Signature Card Proficiency', category: 'Potential', type: 'Card +', value: '+40%',
      appliesTo: 'Dirge Bullet', hitScope: 'All hits', condition: 'Always' },
    { kind: 'Buff', id: 'p3-1-extra', node: '3-1', name: 'Signature Card Proficiency: Extra Attack', category: 'Potential', type: 'Card +', value: '+20%',
      appliesTo: 'Dirge Bullet (Discard)', hitScope: 'All hits', condition: 'Always' },
    // 5-1 Basic Card Proficiency (in game): "+5% Damage Amount to Renoa's Annihilation Shot. If Renoa's Critical Chance is 20% or
    // higher, add an additional +5% to the modifier" (locked for the owner: 110% = 100% x 1.1)
    { kind: 'Buff', id: 'p5-1-shot', node: '5-1', name: 'Basic Card Proficiency', category: 'Potential', type: 'Card +', value: '+5%',
      appliesTo: 'Annihilation Shot', hitScope: 'All hits', condition: 'Always', thresholdStat: 'Critical Chance',
      thresholdBonus: { above: 0.2, value: '+5%', orEqual: true } },
    // 7 (in game): "+5% Damage Amount to Dirge Bullet. If Renoa's Critical Chance is 60% or higher, add an additional +10% to the
    // modifier". Shows on both hits of Dirge Bullet and of Finale, at the owner's Critical Chance of 53.6% without the +10%
    { kind: 'Buff', id: 'p7-bullet', node: '7', name: 'Unique Stat Upgrade', category: 'Potential', type: 'Card +', value: '+5%',
      appliesTo: 'Dirge Bullet/Dirge Bullet: Finale/Dirge Bullet (Discard)/Dirge Bullet: Finale (Discard)', hitScope: 'All hits',
      condition: 'Always', thresholdStat: 'Critical Chance', thresholdBonus: { above: 0.6, value: '+10%', orEqual: true } },
    // E3 Vivid Memory (in game): "+200% Damage Amount to Black Thorn"
    { kind: 'Buff', id: 'e3-black-thorn', name: 'E3 Vivid Memory', category: 'Ego Manifestation', value: '+200%', appliesTo: 'Black Thorn',
      hitScope: 'All hits', condition: 'Always', egoLevel: 3 },
    // E4 Inner Memory (in game): "Each time the Dirge Bullet card is Discarded, gain 1 Rose's Resolve. Rose's Resolve: +10% to Renoa's
    // Damage Amount, and on Shuffle, remove Rose's Resolve (max 4 stacks)"
    { kind: 'Buff', id: 'e4-rose', name: "Rose's Resolve", category: 'Ego Manifestation', value: '+10%', appliesTo: 'ALL',
      hitScope: 'All hits', condition: 'Always', counter: "Rose's Resolve", maxStacks: 4, egoLevel: 4 },
  ],
  triggers: [
    { card: 'dirge-discard', on: 'ALL', counter: DISCARDED, perStack: true },
    { card: 'finale-discard', on: 'ALL', counter: FINALES, perStack: true, egoLevel: 2 },
    // E6 Liberated Memory (in game): "Each time the Dirge Bullet card is Drawn, inflict 50% Extra Attack to a random enemy"
    { card: 'e6-drawn', on: 'ALL', counter: 'Dirge Bullets drawn', perStack: true, egoLevel: 6 },
  ],
  // Card text: the in-game wording (owner's screenshots, 2026-10-30), with tokens for the build's numbers (engine/cardText.ts)
  cards: {
    // Ego skill: E3 adds +200%
    'card-1': { text: 'Move all Dirge Bullet from Draw Pile and Graveyard to hand\n{E3:500%|{300%}} Damage' },
    'card-2': { text: '{100%} Damage' },
    'card-3': { text: '{100%} Shield' },

    // Echo of Sorrow, I–V
    'card-4': { creates, text: '{140%} Damage\nCreate 1 Dirge Bullet Card(s)' },
    'card-5': { creates, text: '{140%} Damage\nCreate 2 Dirge Bullet Card(s)' },
    'card-6': { creates, text: '{140%} Damage\nCreate 1 Dirge Bullet, and create 2 in Discard Pile' },
    'card-7': { creates, text: '{140%} Damage\nCreate 1 Dirge Bullet, then Discard 2 Dirge Bullet from Draw Pile' },
    'card-8': { creates, text: 'Create 3 Dirge Bullet Card(s)' },
    'card-9': { creates, text: '[Initiation]\nCreate 1 Dirge Bullet Card(s)\nAt the start of the turn, create 1 Dirge Bullet Card(s)' },

    // Instant Judgment, I–V
    'card-10': {
      text: '{220%} Damage\nIf Dirge Bullet is in hand, discard 1 and +100% Damage Amount',
      effects: perDiscard('+100%', 'Instant Judgment'),
    },
    'card-11': {
      text: '{330%} Damage\nIf Dirge Bullet is in hand, discard 1 card and +150% Damage Amount',
      effects: perDiscard('+150%', 'Instant Judgment I'),
    },
    'card-12': {
      text: '{270%} Damage\nIf Dirge Bullet is in Draw Pile, Discard 1, then +120% Damage Amount',
      effects: perDiscard('+120%', 'Instant Judgment II'),
    },
    'card-13': { text: '{270%} Damage\nIf Dirge Bullet is in Graveyard, Exhaust 1 and add 1 Hit(s)', notes: 'Add 1 hit on the play when it Exhausts a Dirge Bullet' },
    'card-14': { creates: ['ij4-discard'], text: '{180%} Damage\nWhen moved to Discard Pile, {250%@ij4-discard} Extra Attack to a random enemy' },
    // 200% in game at Unique 8: the upgrade doesn't raise this one
    'card-15': { creates: ['ij5-end'], text: 'At the end of the turn, 200% Extra Attack to the enemy with lowest HP' },

    // Ballad of Pitch Black, I–V (Prydwen: "+20% Damage Amount"; in game "base")
    'card-16': { text: '{60%} Damage × 3\n+20% base Damage Amount for each Dirge Bullet in hand', effects: inHand('+20%', 'Ballad of Pitch Black') },
    'card-17': { text: '{90%} Damage × 3\n+30% base Damage Amount for each Dirge Bullet in hand', effects: inHand('+30%', 'Ballad of Pitch Black I') },
    'card-18': { text: 'Move up to 3 Dirge Bullet from Draw Pile and Graveyard to hand' },
    'card-19': {
      text: '{60%} Damage × 3\n1 Mark to the target for each Dirge Bullet in hand',
      triggers: [{ card: 'mark', on: 'Attack', counter: 'Mark (Renoa)' }],
    },
    'card-20': {
      text: "{60%} Damage × 3\nIncrease Damage Amount of Dirge Bullet's Extra Attack by 100% for 1 turn",
      effects: [cardBuff('bullet-extra', "Damage Amount of Dirge Bullet's Extra Attack for 1 turn", '100%',
        'Dirge Bullet (Discard)/Dirge Bullet: Finale (Discard)', { counter: 'Ballad of Pitch Black IV', maxStacks: 1 })],
    },
    'card-21': {
      text: '{60%} Damage × 3\nExhaust all Dirge Bullet in the Graveyard, increase Damage Amount by 50% for each',
      effects: [cardBuff('exhausted', 'Increase Damage Amount for each Dirge Bullet exhausted', '50%', 'Ballad of Pitch Black V',
        { counter: 'Dirge Bullets exhausted' })],
    },

    // Flower of Devoured Fate, I–V (III, Prydwen: "For each Discarded Card with Cost 1, +40% ... of next card")
    'card-22': { creates, text: 'Discard up to 2 Card(s) from hand\nCreate Dirge Bullet for each' },
    'card-23': { creates, text: 'Discard up to 3 Card(s) from hand\nCreate Dirge Bullet for each' },
    'card-24': { creates, text: '[Exhaust]\nDiscard all other Combatant cards from hand\nCreate 2 Dirge Bullet for each' },
    'card-25': {
      text: 'Discard up to 2 card(s) in hand\nFor each Cost of the cards Discarded, +40% Damage Amount to the next card activated',
      // Card types, not ALL: the Extra Attacks on that play (Mark, discarded Dirge Bullets) aren't the card activated
      effects: [cardBuff('next-card', 'Damage Amount to the next card activated for each Cost discarded', '+40%', 'Attack/Skill/Upgrade',
        { counter: 'Flower of Devoured Fate III (Cost discarded)' })],
    },
    'card-26': { text: 'Draw 2\nIf Dirge Bullet is in hand, Draw 1 additional card(s)' },
    'card-27': { text: 'Grant Retrieve to all Dirge Bullet in hand' },

    // E1 Sleeping Memory (in game): "+20% Damage Amount to the Last-Ditch Assault card's Damage Amount added for each Dirge Bullet Discarded effect"
    'card-28': {
      text: '[Retain]\n{300%} Damage (+0%)\nDiscard all Dirge Bullet, +{E1:70|50}% Damage Amount for each',
      effects: [...perDiscard('+50%', 'Last-Ditch Assault'), ...perDiscard('+20%', 'Last-Ditch Assault', { egoLevel: 1, idSuffix: '-e1' })],
    },

    'card-29': { text: '[Bullet / Exhaust]\n{160%} Damage\nWhen moved to Discard Pile, {120%@dirge-discard} Extra Attack to a random enemy' },
    // E2 Awakening Memory: for every 4 Dirge Bullet created
    'card-666': {
      egoLevel: 2,
      text: '[Bullet / Exhaust]\n{200%} Damage\nWhen moved to Discard Pile, {160%@finale-discard} Extra Attack × 2 to random enemies',
    },
  },
  extraCards: [
    extraAttack('dirge-discard', 'Dirge Bullet (Discard)', 1.2, 'When moved to Discard Pile, {120%} Extra Attack to a random enemy', { image: BULLET_ART }),
    extraAttack('finale-discard', 'Dirge Bullet: Finale (Discard)', 1.6, 'When moved to Discard Pile, {160%} Extra Attack × 2 to random enemies',
      { hits: 2, image: BULLET_ART }),
    extraAttack('e6-drawn', 'Dirge Bullet (Drawn)', 0.5, 'E6: Each time the Dirge Bullet card is Drawn, inflict 50% Extra Attack to a random enemy',
      { upgrade: null, image: BULLET_ART }),
    extraAttack('ij4-discard', 'Instant Judgment IV (Discard)', 2.5, 'When moved to Discard Pile, {250%} Extra Attack to a random enemy',
      { image: 'cards/renoa/unique_1041_05.webp', notes: 'One play per discard' }),
    extraAttack('ij5-end', 'Instant Judgment V (End of turn)', 2, 'At the end of the turn, 200% Extra Attack to the enemy with lowest HP',
      { upgrade: null, image: 'cards/renoa/unique_1041_05.webp', notes: 'One play per turn' }),
    // The Mark keyword (Selena's in game): "When an Attack Card is activated, inflict 100% Extra Attack ... and decrease Mark by 1"
    extraAttack('mark', 'Mark', 1, 'When an Attack Card is activated, inflict 100% Extra Attack, and decrease Mark by 1', { upgrade: null, tags: 'Mark' }),
  ],
} satisfies CharacterAdditions
