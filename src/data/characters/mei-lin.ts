// Mei Lin: our additions to the Prydwen import (src/data/prydwen/mei-lin.json). Card keys are the import's ids.
// Damage % follows the "+" rule: 'by 20%' (no "+") = multiplicative, '+20%' = additive (owner, 2026-10-25).
// Extra hits (Combo, Spire V, the Ego skill) are set per play in the attack list.
import type { CharacterAdditions } from '../../engine/types'
import { cardBuff, EGO_POTENTIALS_PLUS_3 } from '../helpers'

// Applied when an Attack card is used. Unconfirmed whether the first Attack card already gets it.
const passionWeakness = cardBuff('weak', 'Passion Weakness', 'Weakness Attack', 'ALL')
/** Spirit of the Aromata: from its play on, each own card played (that one included) adds a stack (owner, 2026-10-25).
 * Each variant has its own counter, named after the card; the stacks are set on each play of the attack list. */
const aromata = (card: string, name: string, value: string, appliesTo: string, hint?: string) => [
  cardBuff('dmg', name, value, appliesTo, { maxStacks: 20, counter: card, hint }),
]
const aromataText = (when: string, effect: string, keyword = 'Retain') =>
  `[${keyword}]\nFor 1 turn, when ${when} is activated, ${effect}`
const ember = (amount: number) => `Applies ${amount} Ember (count it in the Ember stacks of the plays after it)`

// Flame Dragon Awakens: for 1 turn after one of her attacks Ravages an enemy.
const awakens = '1 turn after a Ravage'

export default {
  verified: { date: '2026-10-30', gameVersion: '841' },
  notes: 'Stat potentials are in the stats screen; card upgrades are set on the Setup tab. Ember and Spirit of the Aromata stacks are '
    + 'set on each play of the attack list (Cards tab). Ember sources: E2 1 per damaging card, Potential 3-1 +1 per Strike, '
    + 'Spire / I / II 2 / 2 / 3, Jewel III 1 per Attack card, Aromata IV 1 per card. '
    + 'Not modeled: E3 (set the hits per play), E6, Embers from Jewel IV crits, Sovereignty keeping Embers',
  // Potential nodes in the game's wording (owner's screenshots, 2026-10-30)
  potentials: {
    '3-1': { text: 'Strike cards gain an additional 1 stack of Ember' },
    '5-1': { text: "+5% Damage Amount to Mei Lin's Strike\nIf Mei Lin's Attack is 500 or higher, add an additional +5% to the modifier" },
    '7': { text: "If Mei Lin's Attack is 600 or higher, +4% Weakness Damage Amount\nFor every 50 Attack exceeding 600, add an additional +1% to the modifier\n(additional +8% max)" },
  },
  // Manifest Ego in the game's wording (owner's screenshots, 2026-10-31)
  ego: {
    1: { text: "Flame Dragon's Sovereignty Card now strikes Critical Hit to Ravaged targets." },
    2: { text: "If Mei Lin's cards deal Damage, apply 1 Ember to the target" },
    3: { text: 'Change the following effect for Heavenly Flame Dragon: Add 1 Hit to the next 6 Basic Attack Cards activated, instead of 4 Basic Attack Cards' },
    4: { text: "If Mei Lin's attack Ravages an enemy, gain 1 Flame Dragon Awakens.\nFlame Dragon Awakens: For 1 turn, +20% Damage Amount to Mei Lin's Attack Cards and +20% Damage Amount against targets in a Ravaged state." },
    5: { text: EGO_POTENTIALS_PLUS_3 },
    6: { text: 'Whenever Mei Lin gains Flame Dragon Awakens 2times, 100% Fixed Damage to all enemies and apply 3 Ember' },
  },
  effects: [
    // Ember (owner, 2026-10-25): "When hitting or putting a target in a Ravage state, deal +30% Damage for each stack of
    // Ember the target has (up to 5 stacks). Upon activation, an Ember is removed." Only on plays with Target Ravaged on (Cards tab), which On Ravage cards have by default.
    // The stacks on the target are set per play (snapshot, owner 2026-10-26).
    { kind: 'Buff', id: 'ember', name: 'Ember', category: 'Character', value: '+30%', appliesTo: 'ALL',
      hitScope: 'All hits', condition: 'Ravaged only', maxStacks: 5, counter: 'Ember' },
    // Potentials not on the stats screen (Potential 3-1, +1 Ember per Strike, goes in the Ember stacks per play)
    // Potential 5-1 (in game): "+5% Damage Amount to Mei Lin's Strike. If Mei Lin's Attack is 500 or higher, add an additional +5%". Part of the in-game
    // card % (owner's 132% check), so it only counts on cards entered at base %. The extra +5% follows the stats-screen Attack.
    { kind: 'Buff', id: 'p5-1-strike', node: '5-1', name: 'Basic Card Proficiency', category: 'Potential', type: 'Card +', value: '+5%',
      appliesTo: 'Strike', hitScope: 'All hits', condition: 'Always', thresholdBonus: { above: 500, value: '+5%', orEqual: true } },
    // Manifest Ego (dupes): on from the build's level
    { kind: 'Buff', id: 'e1-crit', name: 'E1 Sleeping Memory', category: 'Ego Manifestation', type: 'Crit Chance',
      value: '100%', appliesTo: "Flame Dragon's Sovereignty", hitScope: 'All hits', condition: 'Ravaged only', egoLevel: 1 },
    { kind: 'Buff', id: 'e4-atk', name: 'E4 Flame Dragon Awakens', category: 'Ego Manifestation',
      value: '+20%', appliesTo: 'Attack', hitScope: 'All hits', condition: 'Always', egoLevel: 4, hint: awakens },
    { kind: 'Buff', id: 'e4-ravaged', name: 'E4 Flame Dragon Awakens', category: 'Ego Manifestation',
      value: '+20%', appliesTo: 'ALL', hitScope: 'All hits', condition: 'Ravaged only', egoLevel: 4, hint: awakens },
  ],
  // Card text: the in-game wording (owner's screenshots, 2026-10-27), with tokens for the build's numbers (engine/cardText.ts)
  cards: {
    // Strike, Flame Dragon Guardian, Heavenly Flame Dragon (Ego skill)
    'card-338': { text: '{100%} Damage\n{P3-1:1 Ember}' },
    'card-339': { text: '{100%} Shield', notes: 'Shield only, no damage' },
    'card-337': {
      text: 'Add 1 Hit(s) to the next {E3:6|4} Basic Attack Card(s) of this unit activated',
      notes: 'Ego skill (6 EP). Add the extra hit on each of the next 4 Strike plays (6 from E3)',
    },

    // Flame Dragon's Jewel, I–V
    'card-340': {
      text: '[Unique / Initiation]\nIncrease Damage Amount of Attack Cards of this unit by 20%\nWhen an Attack Card is activated, 1 Passion Weakness to the target',
      effects: [cardBuff('atk', 'Attack Card Damage Amount', '20%', 'Attack'), passionWeakness] },
    'card-341': {
      text: '[Unique / Initiation]\nIncrease Damage Amount of Attack Cards of this unit by 30%\nWhen an Attack Card is activated, 1 Passion Weakness to the target',
      effects: [cardBuff('atk', 'Attack Card Damage Amount', '30%', 'Attack'), passionWeakness] },
    'card-342': {
      text: '[Unique / Initiation]\nIncrease Damage Amount of Attack Cards of this unit by 20%\nWhen an Attack Card is activated, 1 Tenacity Damage to the target',
      notes: 'Tenacity Damage is not counted', effects: [cardBuff('atk', 'Attack Card Damage Amount', '20%', 'Attack')] },
    'card-343': {
      text: '[Unique / Initiation]\nIncrease Damage Amount of Attack Cards of this unit by 20%\nWhen an Attack Card is activated, 1 Ember and 1 Passion Weakness to the target',
      notes: 'Attack cards apply 1 Ember (count it in the Ember stacks per play)',
      effects: [cardBuff('atk', 'Attack Card Damage Amount', '20%', 'Attack'), passionWeakness],
    },
    'card-344': {
      text: '[Unique / Initiation]\nIncrease Critical Chance of this unit by 30%\nOn Critical Hit, 1 Tenacity Damage, 1 Ember',
      notes: 'Tenacity Damage and Embers are not counted',
      effects: [{ kind: 'Stat', id: 'crit', name: 'Crit Chance', category: 'Card Epiphany', stat: 'Crit Rate', value: '30%' }],
    },
    // In-game 300% while Spire and Sovereignty show the Signature upgrade: damage from a condition, not an Attack card
    // (owner, 2026-10-27), so no potential upgrade
    'card-345': {
      text: '[Initiation]\nOn Ravage, {300%} Damage to the target', upgrade: null, targetRavaged: true, notes: 'The upgrade itself deals no damage: each play in the attack list stands for one Ravage (300%)' },

    // Rising Dragon Spire, I–V
    'card-346': { text: '{100%} Damage\n2 Ember\nStreak: Add 1 Hit(s)', notes: `Streak: set 2 hits on the play. ${ember(2)}` },
    'card-347': { text: '{100%} Damage\n2 Ember\nStreak: Add 2 Hit(s)', notes: `Streak: set 3 hits on the play. ${ember(2)}` },
    'card-348': { text: '{150%} Damage\n3 Ember\nStreak: Add 1 Hit(s)', notes: `Streak: set 2 hits on the play. ${ember(3)}` },
    'card-349': {
      text: '{200%} Damage\nAdd 1 Hit to the next Passion Card activated', notes: 'Add the extra hit on the next Passion card play',
    },
    'card-350': {
      text: '{100%} Damage\nAdd 2 Hits to the next Basic Attack Card of this unit activated', notes: 'Add the 2 extra hits on the next Strike play',
    },
    'card-351': { text: '{150%} Damage\nAdd 1 Hit for each Passion Card activated this turn', notes: 'Add the extra hits on the play' },

    // Unity of Attack and Defense, I–V
    'card-352': { text: 'Draw 2 Basic Card(s) of this unit, then decrease Cost of those cards by 1 for 1 turn until activated' },
    'card-353': {
      text: 'Draw 2 Basic Card(s) of this unit, then decrease Cost of those cards by 1 for 1 turn until activated and increase '
        + 'Damage and Shield Gain Amounts by 50%',
      effects: [cardBuff('basic', 'Damage Amount of the drawn cards', '50%', 'Basic', { hint: 'the 2 drawn cards, 1 turn' })],
    },
    'card-354': { text: 'Move 2 Basic Card(s) of this unit to hand, then decrease Cost of those cards by 1 for 1 turn until activated' },
    'card-355': {
      text: 'Draw 2 Basic Card(s) of this unit\nSelect and Exhaust up to 2 card(s) in hand\nFor each Exhausted, 2 Morale and 2 Resolve for 1 turn',
      notes: 'Add the Morale on the Buffs tab (2 per card exhausted)' },
    'card-356': { text: 'Create 2 Strike card(s)\nDecrease Cost of those cards by 1', notes: 'Add the 2 Strikes as plays' },
    'card-357': { text: '[Unique]\nIncrease Damage Amount of Basic Cards of this unit by 100%', effects: [cardBuff('basic', 'Basic Card Damage Amount', '100%', 'Basic')] },

    // Spirit of the Aromata, I–V
    'card-358': { text: aromataText('a card of this unit', '+20% Damage Amount to this unit'), effects: aromata('Spirit of the Aromata', 'Own Damage Amount', '+20%', 'ALL') },
    'card-359': {
      text: aromataText('a Passion Card', '+20% Damage Amount to this unit'),
      effects: aromata('Spirit of the Aromata I', 'Own Damage Amount', '+20%', 'ALL', "stacks: Passion cards, allies' too"),
    },
    'card-360': { text: aromataText('a card of this unit', '+30% Damage Amount to this unit'), effects: aromata('Spirit of the Aromata II', 'Own Damage Amount', '+30%', 'ALL') },
    'card-361': { text: aromataText('a card of this unit', '+20% Damage Amount to this unit', 'Initiation'), effects: aromata('Spirit of the Aromata III', 'Own Damage Amount', '+20%', 'ALL') },
    'card-362': {
      text: aromataText('a card of this unit', '1 Ember to a random enemy'),
      notes: 'Each own card used after it applies 1 Ember (on a random enemy; count it in the Ember stacks per play)',
    },
    'card-363': {
      text: aromataText('a card of this unit', '+50% Damage Amount to Basic Cards of this unit'),
      effects: aromata('Spirit of the Aromata V', 'Own Basic Card Damage Amount', '+50%', 'Basic'),
    },

    // Flame Dragon's Sovereignty: the guaranteed Critical line is E1 (Sleeping Memory)
    'card-364': {
      text: '[Weakness Attack]\n{300%} Damage\n{E1:If the target is in a Ravage state, guaranteed Critical}\nDestroy: Retain Ember',
    },
  },
} satisfies CharacterAdditions
