// Nine: our additions to the Prydwen import (src/data/prydwen/nine.json). Card keys are the import's ids.
// Damage % follows the "+" rule: 'by 20%' (no "+") = multiplicative, '+20%' = additive (owner, 2026-10-25).
// Honed Edge, Experienced Strike's and node 3-1's Exhaust card buffs reach only Nine's cards (owner, 2026-11-01; Unconfirmed in game).
// Honed Edge+ reaches allies' Attack Cards (owner's wording, 2026-11-01).
// E3's "+150 Damage Amount" (no % in game) raises the base: 250% -> 400%, under the multipliers (owner, 2026-11-01).
// Hew (Massacre)'s "by 10% for each target" is -10% with one target (owner, 2026-11-01).
import type { CharacterAdditions } from '../../engine/types'
import { cardBuff, EGO_POTENTIALS_PLUS_3 } from '../helpers'

const honedEdge = cardBuff('honed-edge', 'Honed Edge: Defense-Based Damage Amount of Attack Cards', '20%', 'Defense-Based & Attack',
  { maxStacks: 3, counter: 'Honed Edge' })
const exhaustCards = (value: string) => cardBuff('exhaust', 'Damage Amount of Exhaust cards', value, 'Exhaust',
  { counter: 'Experienced Strike (Exhaust cards)' })

// Each Hew brings its levels into the deck
const hewText = (keywords: string, pct: number, effect: string, incinerate: string) =>
  `[${keywords}]\n{${pct}%} Defense-Based Damage${effect}\nIncinerate: ${incinerate}`
const next = (card: string) => `Create 1 ${card}`
const again = (card: string) => `At the start of the turn, create 1 ${card} in hand`

const SHIELD = '\n{200%} Shield'
const MASSACRE = ' to all enemies\nDecrease Damage Amount by 10% for each target'
const AMBUSH = '\nOn ally Counterattack, proc this card'

export default {
  verified: { date: '2026-11-01', gameVersion: '841' },
  notes: 'Card upgrades are set on the Setup tab. Per play (Cards tab): Honed Edge, Honed Edge+ and Improvisation (E4) stacks; Experienced Strike '
    + '(Exhaust cards) and Slash (Exhaust cards, node 3-1) stacks on Exhaust cards; the combined Cost on the Ego skill; the Cost on Fatal Strike and I, II; '
    + 'Exhaust cards in hand on Experienced Strike IV; a card Exhausted this turn on II; Fatal Strike IV\'s cards Exhausted on the next Attack Card; '
    + 'allies owning Counterattack on Fatal Strike V. Each proc (Fighting Spirit, Hew (Ambush), Counterblade V) is another play of that card. '
    + 'Not counted: E6 Fixed damage when a Hew card is activated, Counterattacks, Shields',
  // Potential nodes in the game's wording (owner's screenshots, 2026-11-01)
  potentials: {
    '3-1': { text: '+30% Damage Amount to Slash cards, and adds the following effect: increase Damage Amount of Exhaust cards by 15% for 1 turn (max 2 stacks)' },
    '5-1': { text: "+5% Damage Amount to Nine's Slash, and if Nine's Defense is 250 or higher, add an additional +5% to the modifier" },
    '7': { text: "If Nine's Defense is 300 or higher, +5% Order Attribute Damage Amount, and for every 10 Defense exceeding 300, add an additional +2% to the modifier (additional +10% max)" },
  },
  // Manifest Ego in the game's wording (owner's screenshots, 2026-11-01)
  ego: {
    1: { text: 'Targets may be selected for attack with the Fighting Spirit card.' },
    2: { text: 'At the start of battle, create 1 Exploit Opening card.\nExploit Opening: 1 Vulnerable, 1 Tenacity Damage' },
    3: { text: '+150 Damage Amount to Reflection: Zero, and +50% Damage Amount to the modifier for the combined Cost of the 2 highest-Cost cards effect.' },
    4: { text: "When Nine's cards are Exhausted, gain 1 Improvisation for each Cost of that card.\nImprovisation: +50% Defense-Based Damage Amount to Nine's Attack Cards (max 3 stacks)" },
    5: { text: EGO_POTENTIALS_PLUS_3 },
    6: { text: 'When Hew cards are activated, inflict Fixed Damage equal to 25% of the Damage dealt to the target (this Damage cannot inflict a Critical Hit).' },
  },
  effects: [
    // 3-1 and 5-1 are part of the in-game Slash % (Card +, unconfirmed for Nine: in-game test nine-readings)
    { kind: 'Buff', id: 'p3-1-slash', node: '3-1', name: 'Basic Card Proficiency', category: 'Potential', type: 'Card +', value: '+30%',
      appliesTo: 'Slash', hitScope: 'All hits', condition: 'Always' },
    { kind: 'Buff', id: 'p3-1-exhaust', node: '3-1', name: 'Slash: Damage Amount of Exhaust cards', category: 'Potential', value: '15%',
      appliesTo: 'Exhaust', hitScope: 'All hits', condition: 'Always', maxStacks: 2, counter: 'Slash (Exhaust cards)' },
    { kind: 'Buff', id: 'p5-1-slash', node: '5-1', name: 'Basic Card Proficiency', category: 'Potential', type: 'Card +', value: '+5%',
      appliesTo: 'Slash', hitScope: 'All hits', condition: 'Always', thresholdStat: 'Defense', thresholdBonus: { above: 250, value: '+5%', orEqual: true } },
    { kind: 'Buff', id: 'p7-order', node: '7', name: 'Unique Stat Upgrade', category: 'Potential', value: '+5%', appliesTo: 'Order',
      hitScope: 'All hits', condition: 'Always', thresholdStat: 'Defense', thresholdMin: 300, thresholdBonus: { above: 300, value: '+2%', every: 10, max: '+10%' } },
    // E3: Base %, as Card + only reaches cards with an upgrade and the Ego skill has none
    { kind: 'Buff', id: 'e3-ego', name: 'E3 Vivid Memory', category: 'Ego Manifestation', type: 'Base %', value: '+150%',
      appliesTo: 'Reflection: Zero', hitScope: 'All hits', condition: 'Always', egoLevel: 3 },
    { kind: 'Buff', id: 'e3-cost', name: 'E3 Vivid Memory: combined Cost', category: 'Ego Manifestation', value: '+50%',
      appliesTo: 'Reflection: Zero', hitScope: 'All hits', condition: 'Always', counter: 'Combined Cost (2 highest)', egoLevel: 3 },
    { kind: 'Buff', id: 'e4-improvisation', name: 'E4 Improvisation', category: 'Ego Manifestation', value: '+50%',
      appliesTo: 'Defense-Based & Attack', hitScope: 'All hits', condition: 'Always', maxStacks: 3, counter: 'Improvisation', egoLevel: 4 },
  ],
  // Card text: the in-game wording (owner's screenshots, 2026-11-01), with tokens for the build's numbers (engine/cardText.ts)
  cards: {
    'card-884': {
      text: '{E3:{400%}|{250%}} Defense-Based Damage to all enemies\n+{E3:100|50}% Damage Amount for each point of the combined Cost of the 2 highest-Cost cards, then Exhaust those cards',
      effects: [cardBuff('cost', 'Damage Amount for each point of the combined Cost', '+50%', 'Reflection: Zero', { counter: 'Combined Cost (2 highest)' })],
    },
    'card-885': { text: '{100%} Defense-Based Damage\n{P3-1:Increase Damage Amount of Exhaust cards by 15% for 1 turn (max 2 stacks)}' },
    'card-886': { text: '{100%} Shield', notes: 'Shield only, no damage' },

    // Hew and its levels, then the epiphanies'
    'card-887': { creates: ['card-912', 'card-913', 'card-914'], text: hewText('Unique / Initiation / Exhaust / Ephemeral', 350, '', next('Hew Lv. 1')) },
    'card-888': { creates: ['card-915', 'card-916', 'card-917'], text: hewText('Unique / Initiation / Exhaust / Ephemeral', 400, SHIELD, next('Hew (Ironclad) Lv. 1')) },
    'card-889': {
      creates: ['card-918', 'card-919', 'card-920', 'card-921', 'card-922'],
      text: hewText('Unique / Initiation / Exhaust / Ephemeral', 300, '', next('Hew (Extreme) Lv. 1')),
    },
    'card-890': { creates: ['card-923', 'card-924', 'card-925'], text: hewText('Unique / Initiation / Ignition / Exhaust / Retain', 400, '', next('Hew (Flash) Lv. 1')) },
    'card-891': {
      creates: ['card-926', 'card-927', 'card-928'],
      text: hewText('Unique / Initiation / Exhaust / Ephemeral', 400, MASSACRE, next('Hew (Massacre) Lv. 1')),
      effects: [cardBuff('targets', 'Decrease Damage Amount for each target', '-10%', 'Hew (Massacre)/Hew (Massacre) Lv. 1/Hew (Massacre) Lv. 2/Hew (Massacre) Lv. 3')],
    },
    'card-892': {
      creates: ['card-929', 'card-930', 'card-931'], notes: 'Add one play per proc',
      text: hewText('Unique / Initiation / Exhaust / Retain', 400, AMBUSH, next('Hew (Ambush) Lv. 1')),
    },
    'card-912': { text: hewText('Unique / Exhaust / Ephemeral', 420, '', next('Hew Lv. 2')) },
    'card-913': { text: hewText('Unique / Exhaust / Ephemeral', 500, '', next('Hew Lv. 3')) },
    'card-914': { text: hewText('Unique / Exhaust / Retain', 600, '', again('Hew')) },
    'card-915': { text: hewText('Unique / Exhaust / Ephemeral', 480, SHIELD, next('Hew (Ironclad) Lv. 2')) },
    'card-916': { text: hewText('Unique / Exhaust / Ephemeral', 580, SHIELD, next('Hew (Ironclad) Lv. 3')) },
    'card-917': { text: hewText('Unique / Exhaust / Retain', 700, SHIELD, again('Hew (Ironclad)')) },
    'card-918': { text: hewText('Unique / Exhaust / Ephemeral', 360, '', next('Hew (Extreme) Lv. 2')) },
    'card-919': { text: hewText('Unique / Exhaust / Ephemeral', 420, '', next('Hew (Extreme) Lv. 3')) },
    'card-920': { text: hewText('Unique / Exhaust / Ephemeral', 550, '', next('Hew (Extreme) Lv. 4')) },
    'card-921': { text: hewText('Unique / Exhaust / Ephemeral', 680, '', next('Hew (Extreme) Lv. 5')) },
    'card-922': { text: hewText('Unique / Exhaust / Retain', 1000, '', again('Hew (Extreme)')) },
    'card-923': { text: hewText('Unique / Ignition / Exhaust / Retain', 480, '', next('Hew (Flash) Lv. 2')) },
    'card-924': { text: hewText('Unique / Ignition / Exhaust / Retain', 580, '', next('Hew (Flash) Lv. 3')) },
    'card-925': { text: hewText('Unique / Ignition / Exhaust / Retain', 700, '', again('Hew (Flash)')) },
    'card-926': { text: hewText('Unique / Exhaust / Ephemeral', 480, MASSACRE, next('Hew (Massacre) Lv. 2')) },
    'card-927': { text: hewText('Unique / Exhaust / Ephemeral', 580, MASSACRE, next('Hew (Massacre) Lv. 3')) },
    'card-928': { text: hewText('Unique / Exhaust / Retain', 700, MASSACRE, again('Hew (Massacre)')) },
    'card-929': { text: hewText('Unique / Exhaust / Retain', 480, AMBUSH, next('Hew (Ambush) Lv. 2')), notes: 'Add one play per proc' },
    'card-930': { text: hewText('Unique / Exhaust / Retain', 580, AMBUSH, next('Hew (Ambush) Lv. 3')), notes: 'Add one play per proc' },
    'card-931': { text: hewText('Unique / Exhaust / Retain', 700, AMBUSH, again('Hew (Ambush)')), notes: 'Add one play per proc' },

    // Experienced Strike, I–V. Prydwen's base says "Exhaust Pile cards"; in game "Exhaust cards"
    'card-893': {
      text: '{140%} Defense-Based Damage\n20% DMG-Based Shield\nIncrease Damage Amount of Exhaust cards by 20% for 1 turn',
      effects: [exhaustCards('20%')],
    },
    'card-894': {
      text: '{210%} Defense-Based Damage\n20% DMG-Based Shield\nIncrease Damage Amount of Exhaust cards by 30% for 1 turn',
      effects: [exhaustCards('30%')],
    },
    'card-895': {
      text: '{210%} Defense-Based Damage\n20% DMG-Based Shield\nIf a card was Exhausted this turn, increase Damage Amount of this card by 30% for 1 turn until activated',
      effects: [cardBuff('exhausted', 'Damage Amount of this card if a card was Exhausted this turn', '30%', 'Experienced Strike II', { maxStacks: 1, counter: 'A card was Exhausted this turn' })],
    },
    'card-896': { text: '{210%} Defense-Based Damage\n20% DMG-Based Shield\nIncrease Shield Gain Amount of Skill Cards by 30% for 1 turn' },
    'card-897': {
      text: '{140%} Defense-Based Damage\n20% DMG-Based Shield\n+60% Damage Amount for each Exhaust card in hand',
      effects: [cardBuff('in-hand', 'Damage Amount for each Exhaust card in hand', '+60%', 'Experienced Strike IV', { counter: 'Exhaust cards in hand' })],
    },
    'card-898': { text: '{210%} Defense-Based Damage\n20% DMG-Based Shield\nFor 1 turn, when an Exhaust card is activated, 1 Counterattack' },

    // Fatal Strike, I–V
    'card-899': {
      text: '{140%} Defense-Based Damage\nIncrease Damage Amount by 20% for each Cost of the highest-Cost Exhaust card in hand, then Exhaust that card',
      effects: [cardBuff('cost', 'Damage Amount for each Cost of the highest-Cost Exhaust card in hand', '20%', 'Fatal Strike', { counter: 'Cost of highest-Cost Exhaust card in hand' })],
    },
    'card-900': {
      text: '{210%} Defense-Based Damage\nIncrease Damage Amount by 30% for each Cost of the highest-Cost Exhaust card in hand, then Exhaust that card',
      effects: [cardBuff('cost', 'Damage Amount for each Cost of the highest-Cost Exhaust card in hand', '30%', 'Fatal Strike I', { counter: 'Cost of highest-Cost Exhaust card in hand' })],
    },
    'card-901': {
      text: '{260%} Defense-Based Damage\nIncrease Damage Amount by 20% for each Cost of the highest-Cost card in hand',
      effects: [cardBuff('cost', 'Damage Amount for each Cost of the highest-Cost card in hand', '20%', 'Fatal Strike II', { counter: 'Cost of highest-Cost card in hand' })],
    },
    'card-902': { text: '[Unique / Ignition / Retain]\nChange Hew in hand to its final level' },
    'card-903': {
      text: 'Exhaust 2 random Exhaust cards of other Combatants in hand\nFor each card Exhausted through this ability, increase Damage Amount of the next activated Attack Card of this unit by 30% until activated',
      effects: [cardBuff('next-attack', 'Damage Amount of the next activated Attack Card', '30%', 'Attack', { maxStacks: 2, counter: 'Fatal Strike IV (cards Exhausted)' })],
    },
    'card-904': {
      text: '[Retain]\n{210%} Defense-Based Damage\nIncrease Damage Amount by 80% for each ally owning Counterattack',
      effects: [cardBuff('counterattack', 'Damage Amount for each ally owning Counterattack', '80%', 'Fatal Strike V', { counter: 'Allies owning Counterattack' })],
    },

    // Counterblade, I–V
    'card-905': { text: '[Unique]\nWhen Shield is gained through an ability, 1 Honed Edge', effects: [honedEdge] },
    'card-906': { text: '[Unique]\nWhen a card is Exhausted, 1 Honed Edge', effects: [honedEdge] },
    'card-907': { text: '[Unique]\nIncrease Shield Gain Amount by 15%, and when Shield is gained through an ability, 1 Honed Edge', effects: [honedEdge] },
    'card-908': { text: '[Initiation / Unique]\nWhen Shield is gained through an ability, 1 Honed Edge', effects: [honedEdge] },
    // Honed Edge+ (owner's wording, 2026-11-01): "Increase Defense-Based Damage Amount of Attack Cards of allies by 20% for 1 turn (max 3 stacks)"
    'card-909': {
      text: '[Unique]\nWhen Counterattack is gained, 1 Honed Edge+',
      effects: [cardBuff('honed-edge-plus', 'Honed Edge+: Defense-Based Damage Amount of Attack Cards of allies', '20%', 'Defense-Based & Attack',
        { target: 'allies', maxStacks: 3, counter: 'Honed Edge+' })],
    },
    'card-910': { text: '[Unique]\nAt the start of the turn, proc the Hew card in hand 1 times', notes: 'Add one play of Hew per proc' },

    'card-911': { text: 'Proc 1 highest-Cost Attack Card(s) of this unit in hand, then Exhaust those cards', notes: 'Add the procced card as a play' },

    // E2. No screenshot of the card: its text is E2's, its keywords Prydwen's
    'card-932': { egoLevel: 2, text: '[Exhaust 2 / Retrieve / Retain]\n1 Vulnerable\n1 Tenacity Damage', notes: 'Switch Vulnerable on for the plays it reaches' },
  },
} satisfies CharacterAdditions
