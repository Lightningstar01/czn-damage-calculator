// Rei: our additions to the Prydwen import (src/data/prydwen/rei.json). Card keys are the import's ids.
// Damage % follows the "+" rule: 'by 20%' (no "+") = multiplicative, '+20%' = additive (owner, 2026-10-25).
// Buffs without "of this unit" (Strike of Darkness's Basic Attack Cards, Resonating Darkness's 1-Cost / Void cards,
// Dark Condensation's selected card) raise any ally's cards (owner, 2026-10-28).
// Strike of Darkness II "Decrease Damage Amount by 20% for 1 turn": Rei's later cards that turn, not the 399% hit (owner, 2026-10-28).
// Potential 7 raises Predator's Blade's card %, like 5-1 on Dark Blade (owner, 2026-10-28).
// E6 is "+20% Damage Amount to allies' Attack Cards" in game (Prydwen: "increased by 20%"): additive (owner, 2026-10-28).
import type { CharacterAdditions } from '../../engine/types'
import { cardBuff, EGO_POTENTIALS_PLUS_3 } from '../helpers'

/** "Increase Damage Amount of Basic Attack Cards by X%": any ally's Basic Attack cards. */
const basicAttacks = (value: string, counter?: string) =>
  cardBuff('basic-attack', 'Damage Amount of Basic Attack Cards', value, 'Basic Attack',
    { target: 'allies', ...(counter ? { counter, maxStacks: 1 } : {}) })

/** Resonating Darkness: "+X% Damage Amount to <cards>", always on while in the deck. */
const resonating = (value: string, appliesTo: string, name = `Damage Amount to ${appliesTo} cards`) =>
  [cardBuff('damage', name, value, appliesTo, { target: 'allies' })]

/** Dark Condensation: the selected card, switched on per play. */
const condensation = (card: string, value: string, appliesTo: string, name: string) =>
  [cardBuff('selected', name, value, appliesTo, { target: 'allies', counter: card, maxStacks: 1 })]

export default {
  verified: { date: '2026-10-30', gameVersion: '841' },
  notes: 'Stat potentials are in the stats screen; card upgrades are set on the Setup tab. Per play (Cards tab): Strike of Darkness '
    + '/ I used this turn (any ally\'s Basic Attack cards), Strike of Darkness II used earlier this turn (Rei\'s cards x0.8), '
    + 'Resonating Darkness V used this turn, Dark Condensation\'s selected card; the hits of Strike of Darkness III (1 + Basic '
    + 'Cards discarded). Predator\'s Blade Morale (2, 4 from E1, for 1 turn): add it on the Buffs tab. '
    + 'Strike of Darkness V procs Basic Cards: add them as plays',
  // Potential nodes in the game's wording (owner's screenshots, 2026-10-30)
  potentials: {
    '3-1': { text: 'Add a 20% Damage-Based Recovery effect to the Dark Blade card.' },
    '5-1': { text: "+5% Damage Amount to Rei's Dark Blade\nIf Rei's Attack is 500 or higher, add an additional +5% to the modifier" },
    '7': { text: "If Rei's Attack is 550 or higher, +10% Damage Amount to Predator's Blade\nFor every 10 Attack exceeding 550, add an additional +1% to the modifier\n(additional +20% max)" },
  },
  // Manifest Ego in the game's wording (owner's screenshots, 2026-10-31)
  ego: {
    1: { text: "Increase the Morale gained from the Predator's Blade card by 2 for 1 turn." },
    2: { text: 'If Rei activates an Attack Card, Fixed Heal equal to 120%. This effect activates 1 time per turn.' },
    3: { text: EGO_POTENTIALS_PLUS_3 },
    4: { text: '+100% Damage Amount to Final Shadow' },
    5: { text: EGO_POTENTIALS_PLUS_3 },
    6: { text: "+20% Damage Amount to allies' Attack Cards." },
  },
  effects: [
    // 5-1 (in game): "+5% Damage Amount to Rei's Dark Blade. If Rei's Attack is 500 or higher, add an additional +5%". Part of the
    // in-game card %, like Mei Lin's 5-1 (not unlocked by the owner: Dark Blade 114% = 100% x 1.14)
    { kind: 'Buff', id: 'p5-1-blade', node: '5-1', name: 'Basic Card Proficiency', category: 'Potential', type: 'Card +', value: '+5%',
      appliesTo: 'Dark Blade', hitScope: 'All hits', condition: 'Always', thresholdBonus: { above: 500, value: '+5%', orEqual: true } },
    // 7 (in game): "If Rei's Attack is 550 or higher, +10% Damage Amount to Predator's Blade. For every 10 Attack exceeding 550, add an
    // additional +1% to the modifier (additional +20% max)". Raises the card % (owner, 2026-10-28); not unlocked by the owner
    { kind: 'Buff', id: 'p7-predator', node: '7', name: 'Unique Stat Upgrade', category: 'Potential', type: 'Card +', value: '+10%',
      appliesTo: "Predator's Blade", hitScope: 'All hits', condition: 'Always', thresholdMin: 550,
      thresholdBonus: { above: 550, value: '+1%', every: 10, max: '+20%' } },
    // E4 Inner Memory: "+100% Damage for Final Shadow" (300% -> 400% in game)
    { kind: 'Buff', id: 'e4-final-shadow', name: 'E4 Inner Memory', category: 'Ego Manifestation', type: 'Base %', value: '+100%',
      appliesTo: 'Final Shadow', hitScope: 'All hits', condition: 'Always', egoLevel: 4 },
    // E6 Liberated Memory: "+20% Damage Amount to allies' Attack Cards"
    { kind: 'Buff', id: 'e6-attack', name: 'E6 Liberated Memory', category: 'Ego Manifestation', target: 'allies', value: '+20%',
      appliesTo: 'Attack', hitScope: 'All hits', condition: 'Always', egoLevel: 6 },
  ],
  // Card text: the in-game wording (owner's screenshots, 2026-10-28), with tokens for the build's numbers (engine/cardText.ts)
  cards: {
    // Ego skill: Prydwen has 300% (the E4 +100% is a Base % buff); the recovery isn't raised
    'card-217': { text: '{E4:400%|300%} Damage\n15% DMG-Based Recovery\nGain 1 AP' },
    // 3-1 adds the recovery
    'card-218': { text: '{100%} Damage\n{P3-1:20% DMG-Based Recovery}' },
    'card-219': { text: 'Heal {100%}', notes: 'Heal only, no damage' },

    // Strike of Darkness, I–V. Buff %s aren't raised by the upgrade (100% in game)
    'card-220': {
      text: '[Lead]\n{100%} Damage\nIncrease Damage Amount of Basic Attack Cards by 100% for 1 turn',
      effects: [basicAttacks('100%', 'Strike of Darkness')],
    },
    'card-221': {
      text: '[Lead]\n{150%} Damage\nIncreases Damage Amount of Basic Attack Cards by 150% for 1 turn',
      effects: [basicAttacks('150%', 'Strike of Darkness I')],
    },
    'card-222': {
      text: '{350%} Damage\n20% DMG-Based Recovery\nDecrease Damage Amount by 20% for 1 turn',
      effects: [cardBuff('drawback', 'Decrease Damage Amount for 1 turn', '-20%', 'ALL', { counter: 'Strike of Darkness II', maxStacks: 1 })],
    },
    'card-223': { text: '[Lead]\n{150%} Damage\nDiscard all Basic Cards, add 1 Hit for each', notes: 'Set the hits on each play (1 + Basic Cards discarded)' },
    'card-224': {
      text: '[Unique]\nIncrease Damage Amount of Basic Attack Cards by 80%',
      effects: [basicAttacks('80%')],
    },
    // Prydwen: "Activate"
    'card-225': { text: '[Retain]\nProc all Basic Cards in hand' },

    // Resonating Darkness, I–V. The end-of-turn Heal isn't raised by the upgrade (60% in game); V's Heal is (114%)
    'card-226': { text: '[Unique]\n+40% Damage Amount to 1-Cost cards\nAt the end of the turn, Heal 60%', effects: resonating('+40%', '1-cost') },
    'card-227': { text: '[Unique]\n+60% Damage Amount to 1-Cost cards\nAt the end of the turn, Heal 90%', effects: resonating('+60%', '1-cost') },
    'card-228': { text: '[Unique]\n+40% Damage Amount to Void Cards\nAt the end of the turn, Heal 90%', effects: resonating('+40%', 'Void') },
    'card-229': {
      text: '[Unique]\n+40% Damage, Shield Gain, and Heal Amounts to 1-Cost cards\nAt the end of the turn, Heal 90%',
      effects: resonating('+40%', '1-cost'),
    },
    'card-230': {
      text: '[Unique]\n+40% Damage Amount to 1-Cost or lower cards\nAt the end of the turn, Heal 90%',
      effects: resonating('+40%', '0-cost/1-cost', 'Damage Amount to 1-Cost or lower cards'),
    },
    'card-231': {
      text: 'Heal {100%}\nFor 1 turn, +80% Damage Amount to 1-Cost cards',
      effects: [cardBuff('turn', 'For 1 turn, Damage Amount to 1-Cost cards', '+80%', '1-cost',
        { target: 'allies', counter: 'Resonating Darkness V', maxStacks: 1 })],
    },

    // Snack Time, I–V
    'card-232': { text: '[Exhaust]\nChoose 1 card(s) in hand to Exhaust\nHeal {200%}\nDraw 1' },
    'card-233': { text: '[Exhaust 2]\nChoose 1 card(s) in hand to Exhaust\nHeal {200%}\nDraw 1' },
    'card-234': { text: '[Retain / Exhaust]\nHeal {200%}\nDraw 2' },
    'card-235': { text: '[Exhaust]\nHeal {150%}\nSelect and Exhaust up to 2 card(s) in hand, then Draw for each Exhausted' },
    'card-236': { text: '[Exhaust]\nHeal {150%}\nSelect and Exhaust up to 1 card(s) in Draw Pile, then Draw for each Exhausted' },
    'card-237': { text: '[Exhaust]\nHeal {150%}\nSelect and Exhaust 2 card(s) in hand\nSelect and Draw 1 Void card(s)' },

    // Dark Condensation, I–V: the selected card's buff is switched on per play
    'card-238': {
      text: 'Select 1 Attack Card(s) in hand, then +100% Damage Amount for 1 turn until activated',
      effects: condensation('Dark Condensation', '+100%', 'Attack', 'Selected Attack Card: Damage Amount'),
    },
    'card-239': {
      text: 'Select 1 Attack Card(s) in hand, then +150% Damage Amount for 1 turn until activated',
      effects: condensation('Dark Condensation I', '+150%', 'Attack', 'Selected Attack Card: Damage Amount'),
    },
    'card-240': {
      text: 'Select 1 card(s) in hand, then +100% Damage, Shield Gain, and Heal Amounts for 1 turn until activated',
      effects: condensation('Dark Condensation II', '+100%', 'ALL', 'Selected card: Damage Amount'),
    },
    'card-241': {
      text: 'For 1 turn, +50% Damage Amount of Void Attack Cards',
      effects: condensation('Dark Condensation III', '+50%', 'Void & Attack', 'For 1 turn, Damage Amount of Void Attack Cards'),
    },
    'card-242': {
      text: 'Select 1 Attack Card(s), then +100% Damage Amount until activated',
      effects: condensation('Dark Condensation IV', '+100%', 'Attack', 'Selected Attack Card: Damage Amount'),
    },
    'card-243': {
      text: 'Choose 1 Attack Card(s) in hand, +50% Damage Amount',
      effects: condensation('Dark Condensation V', '+50%', 'Attack', 'Chosen Attack Card: Damage Amount'),
    },

    // E1 Sleeping Memory: +2 Morale
    'card-244': { text: "{250%} Damage\nFor 1 turn, {E1:4|2} Morale", notes: 'Morale: add it on the Buffs tab' },
  },
} satisfies CharacterAdditions
