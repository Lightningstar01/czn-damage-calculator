// Owen: our additions to the Prydwen import (src/data/prydwen/owen.json). Card keys are the import's ids.
// Damage % follows the "+" rule: 'by 20%' (no "+") = multiplicative, '+20%' = additive (owner, 2026-10-25).
// Wind Charge II / V "Decrease Damage Amount": only the next Attack Card, the one that gets the hits; II reaches any ally's next
// Attack Card ("the next Attack Card activated"), V Owen's own ("of this unit") (owner, 2026-11-01).
// Wind Charge III "30% chance to add 1 Hit(s)": 30% of one more hit on each of Owen's Attack plays, expected value (owner, 2026-11-01).
// Break Armor I "Decrease Fortitude by 4": +20% Damage taken per Fortitude decreased, so +80% (owner, 2026-11-01).
// Potential 7's +4% Attack and Defense is on the stats screen, so it has no effect here (owner, 2026-11-01).
// Effect hits (E2, Wind Riding II, Wind Slash IV's end of turn) are normal damage, unraised by card upgrades and skipped by Attack Card
// buffs, as on Selena and Yuki: the game shows 280% and 120% at Signature x1.06, where the other cards are raised (owner's screenshots, 2026-11-01).
import type { CharacterAdditions } from '../../engine/types'
import { cardBuff, effectHits, EGO_POTENTIALS_PLUS_3 } from '../helpers'

/** A hit from an effect, not a card: unraised by card upgrades. */
const effectHit = effectHits({ element: 'Passion', tags: 'Ego effect' })

const nextAttack = 'Add 1 Hit(s) to the next Attack Card of this unit activated'
// "Wind Charge" reaches every epiphany
const windCharge = ['Wind Charge', 'Wind Charge I', 'Wind Charge II', 'Wind Charge III', 'Wind Charge IV', 'Wind Charge V'].join('/')

export default {
  verified: { date: '2026-11-01', gameVersion: '841' },
  notes: 'Stat potentials are in the stats screen; card upgrades are set on the Setup tab. Per play (Cards tab): the hit count of the Attack '
    + 'Card after Wind Charge / II / V or Wind Riding III, Wind Charge II / V on that same card (its Damage Amount decrease), Vulnerable, '
    + 'Target in a Vulnerable state and Target has Shield (Break Armor III / IV), Fortitude decreased on the plays after Break Armor I, '
    + 'Wind Charges this turn (E6). One play of Wind Slash IV per turn; one play of the E2 hit per Wind Charge moved to hand; Wind Slash III '
    + 'again on a Defeat. Wind Riding II and Wind Charge III add their hits by themselves. Not counted: Tenacity damage, Shields, moved cards',
  // Potential nodes in the game's wording (owner's screenshots, 2026-11-01)
  potentials: {
    '3-1': { text: 'The damage of the Downward Cut card is increased by +30%' },
    '5-1': { text: "+5% Damage Amount to Owen's Downward Cut\nIf Owen's Health is 600 or higher, add an additional +5% to the modifier" },
    '7': { text: "+4% to Attack and Defense\nIf Owen's Health is 700 or higher, add an additional +4% to the modifier" },
  },
  // Manifest Ego in the game's wording (owner's screenshots, 2026-11-01)
  ego: {
    1: { text: '+50% Damage and Shield Gain Amounts to the Gale Strike card.' },
    2: { text: "Whenever Owen's Wind Charge Card is moved to hand, deal 80% Damage to all enemies." },
    3: { text: EGO_POTENTIALS_PLUS_3 },
    4: { text: '+50% Damage and Shield Gain Amounts to Raging Storm.' },
    5: { text: EGO_POTENTIALS_PLUS_3 },
    6: { text: 'Each time the Wind Charge card is activated, +20% Damage Amount to Owen for 1 turn.' },
  },
  effects: [
    // 3-1 and 5-1 raise the card %, like Rossweisse's 5-1 (not unlocked by the owner: Downward Cut 106% = 100% x 1.06)
    { kind: 'Buff', id: 'p3-1-cut', node: '3-1', name: 'Basic Card Proficiency', category: 'Potential', type: 'Card +', value: '+30%',
      appliesTo: 'Downward Cut', hitScope: 'All hits', condition: 'Always' },
    { kind: 'Buff', id: 'p5-1-cut', node: '5-1', name: 'Basic Card Proficiency', category: 'Potential', type: 'Card +', value: '+5%',
      appliesTo: 'Downward Cut', hitScope: 'All hits', condition: 'Always', thresholdStat: 'Health', thresholdBonus: { above: 600, value: '+5%', orEqual: true } },
    // E1: part of the card's shown %, Shield too: Gale Strike 371% = (300% + 50%) x 1.06, 191% = (130% + 50%) x 1.06
    { kind: 'Buff', id: 'e1-gale', name: 'E1 Sleeping Memory', category: 'Ego Manifestation', type: 'Card +', value: '+50%',
      appliesTo: 'Gale Strike', hitScope: 'All hits', condition: 'Always', egoLevel: 1 },
    // E4: Raging Storm 300% = 250% + 50% (an Ego skill has no upgrade)
    { kind: 'Buff', id: 'e4-storm', name: 'E4 Inner Memory', category: 'Ego Manifestation', type: 'Base %', value: '+50%',
      appliesTo: 'Raging Storm', hitScope: 'All hits', condition: 'Always', egoLevel: 4 },
    // E6: "Each time" = a stack per Wind Charge activated that turn (Unconfirmed; in-game test owen-readings)
    { kind: 'Buff', id: 'e6-charge', name: 'E6 Liberated Memory', category: 'Ego Manifestation', value: '+20%',
      appliesTo: 'ALL', hitScope: 'All hits', condition: 'Always', counter: 'Wind Charges this turn', egoLevel: 6 },
  ],
  // Card text: the in-game wording (owner's screenshots, 2026-11-01), with tokens for the build's numbers (engine/cardText.ts)
  cards: {
    // Ego skill: Prydwen has the base 250%
    'card-365': { text: '{E4:300%|{250%}} Damage\n{E4:300%|{250%}} Shield' },
    'card-366': { text: '{100%} Damage' },
    'card-367': { text: '{100%} Shield' },

    // Wind Charge, I–V. The added hits are set on the next Attack Card's play.
    'card-368': { text: nextAttack, notes: 'Set the next Attack Card\'s hit count on its play' },
    'card-369': { text: `[Retrieve]\n${nextAttack}`, notes: 'Set the next Attack Card\'s hit count on its play' },
    'card-370': {
      text: 'Add 1 Hit(s) to the next Attack Card activated\nDecrease Damage Amount by 25%',
      notes: 'Set the next Attack Card\'s hit count on its play, and switch on Wind Charge II there',
      effects: [cardBuff('decrease', 'Decrease Damage Amount', '-25%', 'Attack', { target: 'allies', counter: 'Wind Charge II', maxStacks: 1 })],
    },
    'card-371': {
      text: '[Unique]\nWhen an Attack Card of this unit is activated, 30% chance to add 1 Hit(s)',
      triggers: [{ card: 'card-371', on: 'Attack', own: true, repeat: true, chance: 0.3 }],
    },
    'card-372': { text: '[Unique / Exhaust]\nProc the next Skill Card activated 1 more time(s)' },
    'card-373': {
      text: 'Add 3 Hit(s) to the next Attack Card of this unit activated\nDecrease Damage Amount by 50%',
      notes: 'Set the next Attack Card\'s hit count on its play, and switch on Wind Charge V there',
      effects: [cardBuff('decrease', 'Decrease Damage Amount', '-50%', 'Attack', { counter: 'Wind Charge V', maxStacks: 1 })],
    },
    'card-393': { text: nextAttack },

    // Wind Slash, I–V
    'card-374': { text: '{280%} Damage to all enemies' },
    'card-375': { text: '{280%} Damage to all enemies' },
    'card-376': { text: '{150%} Damage × 3' },
    'card-377': { text: '{280%} Damage to all enemies\nDefeat: Activate effect 1 more time (max 1 time)', notes: 'On a Defeat, add it again as a play' },
    'card-378': {
      upgrade: null, notACard: true,
      text: 'At the start of the turn, decrease AP by 1\nAt the end of the turn, 280% Damage to all enemies',
      notes: 'One play per turn',
    },
    'card-379': { text: '{280%} Damage to all enemies\nIncrease Tenacity Damage by 100%' },

    // Break Armor, I–V
    'card-380': { text: '{140%} Damage\n2 Vulnerable' },
    'card-381': {
      text: '{210%} Damage\nDecrease Fortitude by 4 for 1 turn',
      notes: 'Switch on Fortitude decreased on the plays after it',
      effects: [cardBuff('fortitude', 'Decrease Fortitude by 4', '+80%', 'ALL', { target: 'enemy', counter: 'Fortitude decreased', maxStacks: 1 })],
    },
    'card-382': { text: '{140%} Damage\n2 Vulnerable' },
    'card-383': {
      text: '{210%} Damage\n2 Vulnerable\nWhen the target is in a Vulnerable state, increase Damage Amount by 30%',
      effects: [cardBuff('vulnerable', 'When the target is in a Vulnerable state, increase Damage Amount', '30%', 'Break Armor III',
        { counter: 'Target in a Vulnerable state', maxStacks: 1 })],
    },
    'card-384': {
      text: '{210%} Damage\n2 Vulnerable\nIf the target has Shield, increase Damage Amount by 30%',
      effects: [cardBuff('shield', 'If the target has Shield, increase Damage Amount', '30%', 'Break Armor IV',
        { counter: 'Target has Shield', maxStacks: 1 })],
    },
    'card-385': { text: '{140%} Damage\n3 Vulnerable\nWhen Wind Charge is activated, move this card from Discard Pile to hand' },

    // Wind Riding, I–V
    'card-386': { text: '{150%} Shield\nMove Wind Charge from Discard Pile to hand' },
    'card-387': { text: '{220%} Shield\nMove 2 card(s) of this unit from Discard Pile to hand' },
    // The import's 120% is the hit each Wind Charge sets off; the card itself deals none
    'card-388': {
      pct: 0, hits: 0,
      text: 'When Wind Charge is activated, 120% Shield\n120% Damage to all enemies',
      triggers: [{ card: 'wind-riding-hit', on: windCharge }],
    },
    'card-389': { text: `{150%} Shield\n${nextAttack}`, notes: 'Set the next Attack Card\'s hit count on its play' },
    'card-390': { text: '{220%} Shield\n3 Damage Reduction' },
    // Prydwen: "activate this card 1 more time"
    'card-391': { text: '{220%} Shield\nIf Wind Charge is activated this turn, gain additional {220%} Shield' },

    'card-392': { text: '{300%} Damage\n{130%} Shield' },
  },
  extraCards: [
    effectHit('wind-riding-hit', 'Wind Riding II (Wind Charge activated)', 1.2, 'When Wind Charge is activated, 120% Damage to all enemies',
      { tags: '', image: 'cards/owen/unique_1050_02.webp' }),
    // E2: a play of its own, since moving a card to hand isn't a play (Wind Riding, draws...)
    effectHit('e2-hit', 'E2 Awakening Memory', 0.8, "E2: Whenever Owen's Wind Charge Card is moved to hand, 80% Damage to all enemies",
      { egoLevel: 2, image: 'cards/owen/unique_1050_04.webp', notes: 'One play per Wind Charge moved to hand' }),
  ],
} satisfies CharacterAdditions
