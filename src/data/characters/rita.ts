// Rita: our additions to the Prydwen import (src/data/prydwen/rita.json). Card keys are the import's ids.
// Damage % follows the "+" rule: 'by 20%' (no "+") = multiplicative, '+20%' = additive (owner, 2026-10-25).
// Potential 7's +10% Attack is already in the stats-screen Attack, so it adds nothing here (owner, 2026-11-08).
// Fate Distortion (E2): 30%, plus 10% for each Cost of the Attack Card it raises, read from that card (owner, 2026-11-08).
// Hour of Glory at E3: still per Cost of cards activated, 20% each, max 300% (owner, 2026-11-08).
// Chrono Archon II: one 100% hit per Chronal Ascension (Unconfirmed; in-game test rita-archon-hits).
import type { CharacterAdditions } from '../../engine/types'
import { cardBuff, EGO_POTENTIALS_PLUS_3 } from '../helpers'

const FATE_IMPRINT = 'card-1018'

/** Time Axis Collapse / I: "Increase Damage Amount by 20% for each Cost of cards in hand (max 200%)". */
const costInHand = (card: string) =>
  [cardBuff('cost-in-hand', 'Damage Amount for each Cost of cards in hand', '20%', card, { counter: 'Cost of cards in hand', maxStacks: 10 })]

export default {
  verified: { date: '2026-11-08', gameVersion: '841' },
  notes: 'Card upgrades are set on the Setup tab. Per play (Cards tab): the Cost of cards in hand on Time Axis Collapse / I, the 1-Cost or '
    + 'lower cards in hand on II; Time Axis Collapse III on the next 3 Attack Cards; Hour of Glory (Cost of cards activated this battle) '
    + 'and Fate Distortion (E2) on the next Attack Card; the Cost of each Fate Imprint; Trace of Memory stacks (E4); Vulnerable where a '
    + 'card inflicts it. Chrono Archon II: one play per end of turn, with the Chronal Ascension count; Future Decreed V: one play per '
    + 'card whose Cost was increased, used. Not counted: E6\'s 80% Fixed Damage for each Chronal Ascension used',
  // Potential nodes in the game's wording (owner's screenshots, 2026-11-08)
  potentials: {
    '3-1': { text: '+50% Damage Amount to the Time Acceleration card.' },
    '5-1': { text: "+5% Damage Amount to Rita's Time Acceleration\nIf Rita's Attack is 500 or higher, add an additional +5% to the modifier" },
    '7': { text: "If Rita's Attack is 800 or higher, +10% Attack to herself." },
  },
  // Manifest Ego in the game's wording (owner's screenshots, 2026-11-08)
  ego: {
    1: { text: 'The following effect regarding Chronicle is added to the Time Paradox card: If 6 was decreased, gain 8 Chronal Ascension instead' },
    2: { text: 'When Chronal Ascension is gained, create 1 Fate Distortion.\nFate Distortion: Increase Damage Amount of the next Attack Card of this unit activated by 30%\nIncrease Damage Amount by an additional 10% for each Cost of that card' },
    3: { text: "Changes Hour of Glory's values to the following: increase Damage Amount of the next Attack Card of this unit activated by 20% (max 300%)" },
    4: { text: "When a 2-Cost or higher card is activated, gain 1 Trace of Memory.\nTrace of Memory: Increase Rita's Damage Amount by 5% for 1 turn (max 6 stacks)" },
    5: { text: EGO_POTENTIALS_PLUS_3 },
    6: { text: 'Changes so that Chronicle can be gained even when in possession of Chronal Ascension.\nWhen Chronal Ascension is gained, gain 6 additional Chronal Ascension (1 time per battle).\nWhen Chronal Ascension is removed, inflict 80% Fixed Damage for each Chronal Ascension used over 1 turn.' },
  },
  effects: [
    // 3-1 (in game): "+50% Damage Amount to the Time Acceleration card"; 5-1: "+5% ... If Rita's Attack is 500 or higher, an additional +5%".
    // Both raise the card %: Time Acceleration 492% = (350% + 50% + 5% + 5%) x 1.2 (Basic 10, Attack 881)
    { kind: 'Buff', id: 'p3-1-time-acceleration', node: '3-1', name: 'Basic Card Proficiency', category: 'Potential', type: 'Card +', value: '+50%',
      appliesTo: 'Time Acceleration', hitScope: 'All hits', condition: 'Always' },
    { kind: 'Buff', id: 'p5-1-time-acceleration', node: '5-1', name: 'Basic Card Proficiency', category: 'Potential', type: 'Card +', value: '+5%',
      appliesTo: 'Time Acceleration', hitScope: 'All hits', condition: 'Always', thresholdBonus: { above: 500, value: '+5%', orEqual: true } },
    // E4 Trace of Memory: "Increase Rita's Damage Amount by 5% for 1 turn (max 6 stacks)"
    { kind: 'Buff', id: 'e4-trace-of-memory', name: 'E4 Trace of Memory', category: 'Ego Manifestation', value: '5%', appliesTo: 'ALL',
      hitScope: 'All hits', condition: 'Always', maxStacks: 6, counter: 'Trace of Memory', egoLevel: 4 },
  ],
  // Card text: the in-game wording (owner's screenshots, 2026-11-08), with tokens for the build's numbers (engine/cardText.ts)
  cards: {
    // Ego skill: 10% per Cost activated this battle, max 200% (E3: 20%, max 300%), on the next Attack Card
    'card-990': {
      text: '6 Chronal Ascension\nIncrease Damage Amount of the next Attack Card of this unit activated by {E3:20|10}% for each Cost of cards '
        + 'activated this battle (max {E3:300|200}%)',
      effects: [
        cardBuff('next-attack', 'Damage Amount of the next Attack Card for each Cost of cards activated this battle', '10%', 'Attack',
          { counter: 'Hour of Glory (Cost activated this battle)', maxStacks: 20, egoBelow: 3 }),
        cardBuff('next-attack-e3', 'Damage Amount of the next Attack Card for each Cost of cards activated this battle', '20%', 'Attack',
          { counter: 'Hour of Glory (Cost activated this battle)', maxStacks: 15, egoLevel: 3 }),
      ],
    },
    'card-991': { text: '{350%} Damage' },
    'card-992': { text: 'Heal {100%}' },

    // Chrono Archon, I–V
    'card-993': { text: '[Unique / Initiation]\nWhen a card is activated, 1 Chronicle for each Cost of that card' },
    'card-994': { text: '[Unique / Initiation]\nWhen a card is activated, 1 Chronicle for each Cost of that card\nWhen Chronal Ascension is removed, 3 Chronicle' },
    // 100% in game at Unique 8: not raised
    'card-995': {
      text: '[Unique / Initiation]\nWhen a card is activated, 1 Chronicle for each Cost of that card\nAt the end of the turn, {100%} Damage to a random enemy for each Chronal Ascension',
      upgrade: null, perCount: 'Chronal Ascension', countsHits: true,
      notes: 'The upgrade itself deals no damage: each play stands for one end of turn; set the Chronal Ascension on it (one hit each)',
    },
    'card-996': { text: '[Unique / Initiation]\nWhen a card is Exhausted, 1 Chronicle' },
    'card-997': { text: '[Unique / Initiation]\nWhen a card is activated, 1 Chronicle for each Cost of that card\nWhen a card is Discarded, 1 Chronicle' },
    'card-998': { text: '[Unique / Initiation]\nWhen a card is activated, 1 Chronicle for each Cost of that card\nWhen a Retain effect is activated, 1 Chronicle' },

    // Time Axis Collapse, I–V
    'card-999': { text: '{300%} Damage\nIncrease Damage Amount by 20% for each Cost of cards in hand\n(max 200%)', effects: costInHand('Time Axis Collapse') },
    'card-1000': { text: '{450%} Damage\nIncrease Damage Amount by 20% for each Cost of cards in hand\n(max 200%)', effects: costInHand('Time Axis Collapse I') },
    'card-1001': {
      text: '{300%} Damage\nIncrease Damage Amount by 30% for each 1-Cost or lower card in hand',
      effects: [cardBuff('low-cost-in-hand', 'Damage Amount for each 1-Cost or lower card in hand', '30%', 'Time Axis Collapse II',
        { counter: '1-Cost or lower cards in hand' })],
    },
    'card-1002': {
      text: 'Increase Damage Amount to the next 3 Attack Card(s) of this unit activated by 100%',
      effects: [cardBuff('next-3-attacks', 'Damage Amount of the next 3 Attack Cards of this unit', '100%', 'Attack',
        { counter: 'Time Axis Collapse III', maxStacks: 1 })],
    },
    'card-1003': { text: '[Retain]\n{400%} Damage\n2 Vulnerable\nWhen Chronal Ascension is gained, proc this card if in hand' },
    'card-1004': { text: '{250%} Damage\nChange Cost of all Fate Imprint in hand to 4' },

    // Future Decreed, I–V
    'card-1005': { text: 'Increase Cost of 1 2-Cost or lower card(s) in hand by 1 until activated, then proc 1 random 3-Cost card(s)' },
    'card-1006': { text: 'Increase Cost of 1 2-Cost or lower card(s) in hand by 1 until activated, then proc 1 random 3-Cost card(s)' },
    'card-1007': { text: 'Proc 1 random 3-Cost Attack Card(s) in hand' },
    'card-1008': { text: 'Proc 1 random 3-Cost card(s) in Draw Pile' },
    'card-1009': { text: 'Proc 2 random 2-Cost card(s) in hand' },
    // 300% in game at Unique 8: not raised. Prydwen: "used manually"
    'card-1010': {
      text: '[Unique]\nWhen a card whose Cost is increased is used, {300%} Damage to a random enemy', upgrade: null,
      notes: 'The upgrade itself deals no damage: each play stands for one card whose Cost was increased, used',
    },

    // Chrono Circle, I–V
    'card-1011': { creates: [FATE_IMPRINT], text: 'Create 2 Fate Imprint' },
    'card-1012': { creates: [FATE_IMPRINT], text: 'Create 3 Fate Imprint' },
    'card-1013': { creates: [FATE_IMPRINT], text: '[Retain]\nCreate 2 Fate Imprint\nRetain: Create 1 Fate Imprint' },
    'card-1014': { text: '[Unique]\nWhen Chronal Ascension is gained, move all Basic Cards of this unit to hand' },
    'card-1015': { creates: [FATE_IMPRINT], text: 'Select and Exhaust 1 Exhaust card(s) from All Piles, then create Fate Imprint for each Cost of that card' },
    'card-1016': { text: '[Unique]\nWhen Chronal Ascension is gained, Draw 3 2-Cost Attack Card(s)' },

    // Time Paradox: E1 adds 8 Chronal Ascension when 6 Chronicle are decreased
    'card-1017': {
      text: '[Unique]\nDecrease all Chronicle\nChronal Ascension for each decreased{E1:. If decreased by 6, 8 Chronal Ascension}',
    },

    // Fate Imprint: 120% (139% in game at Unique 8) x the play's Cost
    [FATE_IMPRINT]: {
      perCost: true,
      text: '[Retain / Exhaust]\n{120%} Damage for each Cost of this card\nIncrease Cost of all Fate Imprint in hand by 1\nWhen this card leaves the hand, change Cost to 2',
      notes: 'Set the Cost on each play',
    },
    // Fate Distortion (E2): joins the deck from E2
    'card-1019': {
      egoLevel: 2,
      text: '[Exhaust / Ephemeral]\nIncrease Damage Amount of the next Attack Card of this unit activated by 30%\nIncrease Damage Amount by an additional 10% for each Cost of that card',
      effects: [
        cardBuff('next-attack', 'Damage Amount of the next Attack Card', '30%', 'Attack', { counter: 'Fate Distortion' }),
        cardBuff('next-attack-cost', 'Damage Amount of the next Attack Card for each Cost of that card', '10%', 'Attack',
          { counter: 'Fate Distortion', perCardCost: true }),
      ],
    },
  },
} satisfies CharacterAdditions
