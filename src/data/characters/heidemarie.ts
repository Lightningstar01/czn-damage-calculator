// Heidemarie: our additions to the Prydwen import (src/data/prydwen/heidemarie.json). Card keys are the import's ids.
// Damage % follows the "+" rule: 'by 20%' (no "+") = multiplicative, '+20%' = additive (owner, 2026-10-25).
// Buffs "to Effulgent Blade" (3-1, Effulgent Expansion) raise all of its damage: played, its discard Extra Attack and Sword Rain III's
// procs (owner, 2026-11-09). Thread of Light II's "3x the Damage" triples the whole hit, a Final multiplier (owner, 2026-11-09).
// E2's Crimson Blade is a per-play number of Heidemarie's 120% Extra Attacks, unraised by card upgrades (owner, 2026-11-09).
// E1's +200% shows in Effulgent Release's card %: 812% = (500% + 200%) x 1.16 (Card +).
import type { CharacterAdditions } from '../../engine/types'
import { cardBuff, effectHits, EGO_POTENTIALS_PLUS_3 } from '../helpers'

const BLADE = 'card-1092'
const BLADE_ART = 'cards/heidemarie/unique_30093_07.webp'
const BLADES_DISCARDED = 'Effulgent Blades discarded'
const LINKED_IN_HAND = 'Linked cards in hand'
const DISCARDED_THIS_BATTLE = 'Cards discarded this battle'

/** A hit from an effect, not a card being played: Heidemarie's. Raised by Signature Card Upgrade like Effulgent Blade unless upgrade: null. */
const effectHit = effectHits({ element: 'Passion', kind: 'Extra Attack', upgrade: undefined })

export default {
  verified: { date: '2026-11-09', gameVersion: '841' },
  notes: 'Card upgrades are set on the Setup tab. Per play (Cards tab): Effulgent Blades discarded on any play by anyone (each adds the '
    + 'Blade\'s 139% Extra Attack), Crimson Blade activations (E2: each adds a 120% Extra Attack; one per Linked card used or Discarded '
    + 'while Crimson Blade lasts), Linked cards in hand (Thread of Light / I), Thread of Light II with 3+ Linked cards in hand, Thread of '
    + 'Light III in hand or Graveyard, Sword Flash (3-1) and Effulgent Expansion / I this turn, Effulgent Expansion II on the next 2 '
    + 'Blades, Effulgent Blades in Graveyard (Sword Rain V), Effulgent Blades exhausted (Effulgent Release), cards Discarded this battle '
    + '(Ego skill), Effulgent Chain (E4). Sword Rain II: add 1 hit on the play per Effulgent Blade in hand. Thread of Light V\'s discard '
    + 'hit is a play of its own. Thread of Light IV\'s procs: add the procced cards as plays. Not counted: Shields, draws, E6\'s All '
    + 'Attribute Blades',
  // Potential nodes in the game's wording (owner's screenshots, 2026-11-09)
  potentials: {
    '3-1': { text: 'Add the following effect to the Sword Flash card: +30% Damage Amount to Effulgent Blade for 1 turn.' },
    '5-1': { text: "+5% Damage Amount to Heidemarie's Sword Flash, and if Heidemarie's Attack is 500 or higher, add an additional +5% to the modifier." },
    '7': { text: "If Heidemarie's Attack is 600 or higher, +5% Passion Attribute Damage Amount, and for every 20 Attack exceeding 600, add an additional +2%\n(additional +10% max)" },
  },
  // Manifest Ego in the game's wording (owner's screenshots, 2026-11-09)
  ego: {
    1: { text: '+200% Damage Amount to the Effulgent Release card, and the added Damage Amount for each Effulgent Blade in Graveyard becomes +120%.' },
    2: { text: 'At the start of battle, move the Effulgent Compression card to hand.\nAt the start of the turn, gain 5 Crimson Blade.\nCrimson Blade: When a Linked card is used or Discarded, 120% Extra Attack to the enemy with the highest HP, and when used or Discarded, decrease Crimson Blade by 1 (max 8 stacks).' },
    3: { text: '+200% Damage Amount to Elysium of Blades, and change the +80% Damage Amount (max 20 cards) effect to +100% (max 30 cards) Damage Amount for each card Discarded this battle.' },
    4: { text: "When Heidemarie's Linked cards are used or Discarded, gain 1 Effulgent Chain.\nEffulgent Chain: +5% Damage Amount to Heidemarie (max 10 stacks)" },
    5: { text: EGO_POTENTIALS_PLUS_3 },
    6: { text: 'Change created Effulgent Blade cards to All Attribute Cards.\nEach time Crimson Blade is activated, +40% Damage Amount to Crimson Blade (max +480%).' },
  },
  effects: [
    // 5-1 Basic Card Proficiency (in game): "+5% Damage Amount to Heidemarie's Sword Flash, and if Heidemarie's Attack is 500 or higher, add an
    // additional +5%": raises the card %, like the other characters' 5-1 (locked for the owner: Sword Flash 102% = 100% x 1.02)
    { kind: 'Buff', id: 'p5-1-flash', node: '5-1', name: 'Basic Card Proficiency', category: 'Potential', type: 'Card +', value: '+5%',
      appliesTo: 'Sword Flash', hitScope: 'All hits', condition: 'Always', thresholdBonus: { above: 500, value: '+5%', orEqual: true } },
    // 7 (in game): "If Heidemarie's Attack is 600 or higher, +5% Passion Attribute Damage Amount, and for every 20 Attack exceeding 600, add an
    // additional +2% (additional +10% max)": on the stats screen (Passion Damage 15.0% = 5% + 10% at Attack 960), so nothing is added on top
    // E1 Sleeping Memory: part of Effulgent Release's card % (812% = (500% + 200%) x 1.16)
    { kind: 'Buff', id: 'e1-release', name: 'E1 Sleeping Memory', category: 'Ego Manifestation', type: 'Card +', value: '+200%',
      appliesTo: 'Effulgent Release', hitScope: 'All hits', condition: 'Always', egoLevel: 1 },
    // E3 Vivid Memory: the Ego skill's bonus is part of its card % (docs/FORMULA.md, Ego skill bonuses)
    { kind: 'Buff', id: 'e3-elysium', name: 'E3 Vivid Memory', category: 'Ego Manifestation', type: 'Base %', value: '+200%',
      appliesTo: 'Elysium of Blades', hitScope: 'All hits', condition: 'Always', egoLevel: 3 },
    // E4 Inner Memory: "Effulgent Chain: +5% Damage Amount to Heidemarie (max 10 stacks)"
    { kind: 'Buff', id: 'e4-chain', name: 'Effulgent Chain', category: 'Ego Manifestation', value: '+5%', appliesTo: 'ALL',
      hitScope: 'All hits', condition: 'Always', counter: 'Effulgent Chain', maxStacks: 10, egoLevel: 4 },
    // E6 Liberated Memory: "Each time Crimson Blade is activated, +40% Damage Amount to Crimson Blade (max +480%)": activations before this play
    { kind: 'Buff', id: 'e6-crimson', name: 'E6 Liberated Memory', category: 'Ego Manifestation', value: '+40%', appliesTo: 'Crimson Blade',
      hitScope: 'All hits', condition: 'Always', counter: 'Crimson Blade activations so far', maxStacks: 12, egoLevel: 6 },
  ],
  triggers: [
    // Effulgent Blade (in game): "When this card is Discarded, 139% Extra Attack to a random enemy": one per Blade discarded on the play
    { card: 'blade-discard', on: 'ALL', counter: BLADES_DISCARDED, perStack: true },
    // E2 Crimson Blade: "When a Linked card is used or Discarded, 120% Extra Attack to the enemy with the highest HP"
    { card: 'crimson-blade', on: 'ALL', counter: 'Crimson Blade activations', perStack: true, egoLevel: 2 },
  ],
  // Card text: the in-game wording (owner's screenshots, 2026-11-09), with tokens for the build's numbers (engine/cardText.ts)
  cards: {
    // Ego skill: "+80% Damage Amount for each card Discarded this battle (max 20 cards)"; E3: +200%, and +100% (max 30 cards)
    'card-1064': {
      text: '{E3:600%|{400%}} Damage\n+{E3:100|80}% Damage Amount for each card Discarded this battle (max {E3:30|20} cards)',
      effects: [
        cardBuff('discarded', 'Damage Amount for each card Discarded this battle', '+80%', 'Elysium of Blades',
          { counter: DISCARDED_THIS_BATTLE, maxStacks: 20, egoBelow: 3 }),
        cardBuff('discarded-e3', 'Damage Amount for each card Discarded this battle', '+100%', 'Elysium of Blades',
          { counter: DISCARDED_THIS_BATTLE, maxStacks: 30, egoLevel: 3 }),
      ],
    },
    // 3-1 Basic Card Proficiency: "+30% Damage Amount to Effulgent Blade for 1 turn" (unlocked by the owner)
    'card-1065': {
      text: '{100%} Damage{P3-1:\n+30% Damage Amount to Effulgent Blade for 1 turn}',
      effects: [cardBuff('p3-1-blade', 'Damage Amount to Effulgent Blade for 1 turn', '+30%', 'Effulgent Blade',
        { category: 'Potential', node: '3-1', counter: 'Sword Flash this turn', maxStacks: 1 })],
    },
    'card-1066': { text: '{100%} Shield' },

    // Sword Rain, I–V
    'card-1067': { creates: [BLADE], text: '[Linked]\n{80%} Damage × 2\nAttunement: Create 1 Effulgent Blade' },
    'card-1068': { creates: [BLADE], text: '[Linked / Quietus]\n{80%} Damage × 2\nAttunement: Create 2 Effulgent Blade' },
    'card-1069': {
      creates: [BLADE],
      text: '[Haste]\n{180%} Damage\nAdd 1 Hit for each Effulgent Blade in hand before activation\nAttunement: Create 1 Effulgent Blade',
      notes: 'Add 1 hit on the play for each Effulgent Blade in hand',
    },
    // "Proc 5 Effulgent Blade in Graveyard against the target as an Extra Attack": 5 x the Blade's 139%, with its buffs (owner, 2026-11-09)
    'card-1070': {
      text: 'Proc 5 Effulgent Blade in Graveyard against the target as an Extra Attack',
      triggers: [{ card: 'blade-proc', on: 'Sword Rain III', own: true }],
    },
    'card-1071': { creates: [BLADE], text: 'Create 2 Effulgent Blade, then apply Retrieve to those cards' },
    'card-1072': {
      text: '[Exhaust / Finale / Retain / Unique]\n{500%} Damage to all enemies\nIf Effulgent Release is in hand, Exhaust it, and +100% Damage '
        + 'Amount to this card for each Effulgent Blade in Graveyard',
      effects: [cardBuff('graveyard', 'Damage Amount for each Effulgent Blade in Graveyard', '+100%', 'Sword Rain V',
        { counter: 'Effulgent Blades in Graveyard' })],
    },

    // Hero to All, I–V
    'card-1073': { text: '[Quietus]\nDraw 3\nApply Linked to those cards for this turn' },
    'card-1074': { text: '[Linked / Quietus]\nDraw 3\nApply Linked to those cards for this turn' },
    'card-1075': { text: '[Quietus]\nDraw 3\nApply Linked to 1-Cost or lower cards in hand for this turn' },
    'card-1076': { text: '[Haste]\nDraw 1\nApply Linked to Quietus cards in hand for this turn' },
    'card-1077': { text: '[Exhaust 2]\nSelect 1 card from either Draw Pile or Discard Pile, then apply Linked to that card and move to hand' },
    'card-1078': { text: '[Haste]\nDraw 2 Attack Cards of this unit\nApply Linked to all Attack Cards in hand for this turn' },

    // Thread of Light, I–V
    'card-1079': {
      text: '[Linked]\n{120%} Damage\n+120% Damage Amount for each Linked card in hand before activation',
      effects: [cardBuff('linked', 'Damage Amount for each Linked card in hand', '+120%', 'Thread of Light', { counter: LINKED_IN_HAND })],
    },
    'card-1080': {
      text: '[Linked]\n{180%} Damage\n+180% Damage Amount for each Linked card in hand before activation',
      effects: [cardBuff('linked', 'Damage Amount for each Linked card in hand', '+180%', 'Thread of Light I', { counter: LINKED_IN_HAND })],
    },
    // "3x the Damage": the whole hit x3 (owner, 2026-11-09)
    'card-1081': {
      text: '[Linked / Haste]\n{300%} Damage\nIf 3 or more Linked cards are in hand before activation, 3x the Damage',
      effects: [cardBuff('triple', 'If 3 or more Linked cards are in hand, 3x the Damage', '+200%', 'Thread of Light II',
        { type: 'Final', counter: 'Thread of Light II: 3+ Linked cards in hand', maxStacks: 1 })],
    },
    'card-1082': {
      text: '[Linked / Quietus]\n{100%} Damage\nIf this card is in hand or Graveyard, +80% Damage Amount to Linked cards',
      effects: [cardBuff('linked-cards', 'Damage Amount to Linked cards', '+80%', 'Linked',
        { counter: 'Thread of Light III in hand or Graveyard', maxStacks: 1 })],
    },
    'card-1083': { text: '[Linked / Exhaust]\nProc all Linked cards in hand without Discarding them', notes: 'Add the procced cards as plays' },
    'card-1084': {
      creates: ['tl5-discard'],
      text: '[Linked / Unique]\nWhen used, {350%} Damage × 2\nWhen this card is Discarded, {300%@tl5-discard} Damage to all enemies',
    },

    // Effulgent Expansion, I–V (Prydwen lacks I's and II's keywords)
    'card-1085': {
      creates: [BLADE],
      text: '[Quietus]\nCreate 2 Effulgent Blade\n+50% Damage Amount to Effulgent Blade for 1 turn',
      effects: [cardBuff('blade', 'Damage Amount to Effulgent Blade for 1 turn', '+50%', 'Effulgent Blade',
        { counter: 'Effulgent Expansion this turn', maxStacks: 1 })],
    },
    'card-1086': {
      creates: [BLADE], tags: 'Linked, Quietus',
      text: '[Linked / Quietus]\nCreate 2 Effulgent Blade\n+70% Damage Amount to Effulgent Blade for 1 turn',
      effects: [cardBuff('blade', 'Damage Amount to Effulgent Blade for 1 turn', '+70%', 'Effulgent Blade',
        { counter: 'Effulgent Expansion I this turn', maxStacks: 1 })],
    },
    'card-1087': {
      creates: [BLADE], tags: 'Quietus',
      text: '[Quietus]\nCreate 2 Effulgent Blade\n+200% Damage Amount to the next 2 Effulgent Blade',
      effects: [cardBuff('next-blades', 'Damage Amount to the next 2 Effulgent Blade', '+200%', 'Effulgent Blade',
        { counter: 'Effulgent Expansion II (next 2 Blades)', maxStacks: 1 })],
    },
    'card-1088': { creates: [BLADE], text: '[Linked]\nCreate Effulgent Blade for each Linked card in hand' },
    'card-1089': { creates: [BLADE], text: '[Linked / Quietus]\nCreate 6 Effulgent Blade in Discard Pile' },
    'card-1090': {
      creates: [BLADE],
      text: '[Quietus / Unique]\nAt the start of the turn, create 2 Effulgent Blade\n+50% Damage Amount to Effulgent Blade',
      effects: [cardBuff('blade', 'Damage Amount to Effulgent Blade', '+50%', 'Effulgent Blade')],
    },

    // Effulgent Compression (Mythic): unplayable in game (Prydwen: 0 Cost); 3 Effulgent Light change it into Effulgent Release
    'card-1091': { cost: null, creates: ['card-1093'], text: '[Unique / Linked / Retrieve 3]\nWhen moved to Graveyard, 1 Effulgent Light' },
    // Prydwen: "120% Extra Damage" on discard; in game an Extra Attack
    'card-1092': {
      text: '[Linked]\n{120%} Damage\nWhen this card is Discarded, {120%@blade-discard} Extra Attack to a random enemy\nThis card does not move to Draw Pile on Shuffle',
    },
    // E1: +200% (812% = 700% x 1.16) and +120% "base" per Blade (Prydwen: "+100% Damage Amount")
    'card-1093': {
      text: '[Unique]\n{500%} Damage\nExhaust all Effulgent Blade in Graveyard, then +{E1:120|100}% base Damage Amount for each Exhausted\n'
        + 'At the end of the turn, change this card into Effulgent Compression',
      effects: [
        cardBuff('exhausted', 'base Damage Amount for each Effulgent Blade Exhausted', '+100%', 'Effulgent Release',
          { type: 'Base %', counter: 'Effulgent Blades exhausted', egoBelow: 1 }),
        cardBuff('exhausted-e1', 'base Damage Amount for each Effulgent Blade Exhausted', '+120%', 'Effulgent Release',
          { type: 'Base %', counter: 'Effulgent Blades exhausted', egoLevel: 1 }),
      ],
    },
  },
  extraCards: [
    // The Blade's own damage from effects: "Effulgent Blade" tag, so buffs to Effulgent Blade reach them (owner, 2026-11-09)
    effectHit('blade-discard', 'Effulgent Blade (Discard)', 1.2, 'When this card is Discarded, {120%} Extra Attack to a random enemy',
      { tags: 'Linked, Effulgent Blade', image: BLADE_ART }),
    effectHit('blade-proc', 'Effulgent Blade (Proc)', 1.2, 'Sword Rain III: Proc 5 Effulgent Blade in Graveyard against the target as an Extra Attack ({120%} each)',
      { hits: 5, tags: 'Linked, Effulgent Blade', image: BLADE_ART }),
    effectHit('crimson-blade', 'Crimson Blade', 1.2, 'E2: When a Linked card is used or Discarded, 120% Extra Attack to the enemy with the highest HP',
      { upgrade: null, tags: 'Crimson Blade', image: 'cards/heidemarie/unique_30093_01.webp' }),
    // Thread of Light V: the discard damage, a play of its own
    effectHit('tl5-discard', 'Thread of Light V (Discard)', 3, 'When this card is Discarded, {300%} Damage to all enemies',
      { kind: 'Normal', tags: 'Linked', image: 'cards/heidemarie/unique_30093_03.webp', notes: 'One play per discard' }),
  ],
} satisfies CharacterAdditions
