// Beryl: our additions to the Prydwen import (src/data/prydwen/beryl.json). Card keys are the import's ids.
// Damage % follows the "+" rule: 'by 20%' (no "+") = multiplicative, '+20%' = additive (owner, 2026-10-25).
// Potential 3-1 adds to the base % before the upgrade, measured on the cards (Card +): Launcher 137% = (100% + 20%) x 1.14, Charge Launcher 274% = (220% + 20%) x 1.14.
// "Retain: +X% Damage Amount" adds up each time the card is Retained and lasts until it's played; Charged Shot IV caps it at 1 time (owner, 2026-11-01).
// Heavy Weapons Specialist's created cards have the normal cards' numbers (in game 179% = 160% x 1.12), not Prydwen's 120% / 200% (owner, 2026-11-01).
// Unlimited Firepower IV's "next Attack Card activated" is Beryl's own card only, though it lacks "of this unit" (owner, 2026-11-01).
import type { BuffEffect, CharacterAdditions } from '../../engine/types'
import { cardBuff, effectHits, EGO_POTENTIALS_PLUS_3 } from '../helpers'

const RETAINED = 'Times Retained'
const OPENING_FOUND = 'Opening Found (created)'
const CHARGED_SHOT = 'Charged Shot (created)'
const CREATED = ['card-541', 'card-542']

/** Node 7's cards: exact names, so Opening Found V (an Upgrade with its own Extra Attack) stays out. */
const openingFounds = `Opening Found/Opening Found I/Opening Found II/Opening Found III/Opening Found IV/${OPENING_FOUND}`
const chargedShots = `Charged Shot/Charged Shot I/Charged Shot II/Charged Shot III/Charged Shot IV/Charged Shot V/${CHARGED_SHOT}`

/** "Retain: +X% Damage Amount": on the play, the times this card was Retained. */
const retainBonus = (value: string, card: string, extra: Partial<BuffEffect> = {}) =>
  [cardBuff('retain', 'Retain: Damage Amount', value, card, { counter: RETAINED, ...extra })]

/** "+X% Damage Amount to the next Attack Card": on the play, the versions played since Beryl's last Attack Card. */
const nextAttack = (value: string, version: string) =>
  [cardBuff('next-attack', 'Damage Amount to the next Attack Card', value, 'Attack', { counter: `${version} played` })]

const ONE_HIT = "Retained: raise the play's hits by 1 for each Retain this turn"
const TWO_HITS = "Retained: raise the play's hits by 2 for each Retain this turn"

export default {
  verified: { date: '2026-11-01', gameVersion: '841' },
  notes: 'Card upgrades are set on the Setup tab. Per play (Cards tab): Times Retained (Charged Shot, Opening Found IV), Streak (Charged Shot II), '
    + "Unlimited Firepower played since Beryl's last Attack Card, Unlimited Firepower II for that turn's plays, Condense on Attack Cards (E6: Beryl's cards Retained since the last one, max 3). "
    + "Opening Found's and III's added hits: raise the play's hits. Opening Found V: one play per card Retained. Guilty Pleasure I's Morale: add it on the Buffs tab. "
    + 'Not counted: Shields, draws, cost changes, other enemies (all-enemy damage counts one target)',
  // Potential nodes in the game's wording (owner's screenshots, 2026-11-01)
  potentials: {
    '3-1': { text: '+20% damage of Launcher and Charge Launcher Cards.' },
    '5-1': { text: "+5% Damage Amount to Beryl's Launcher and Charge Launcher\nIf Beryl's Critical Damage is 160% or higher, add an additional 5% to the modifier." },
    '7': { text: "+10% Damage Amount to Beryl's Opening Found\nIf Beryl's Critical Damage is 230% or higher, +10% Damage Amount to Charged Shot" },
  },
  // Manifest Ego in the game's wording (owner's screenshots, 2026-11-01)
  ego: {
    1: { text: 'Reduces the cost of Heavy Weapons Specialist cards by 1.' },
    2: { text: "Beryl's Retain card damage is increased by +20%." },
    3: { text: EGO_POTENTIALS_PLUS_3 },
    4: { text: 'The damage of the Max Output Charged Shot card is increased by +50%.' },
    5: { text: EGO_POTENTIALS_PLUS_3 },
    6: { text: "Each time Beryl's cards are Retained, she gains 1 Condense.\nCondense: When Beryl's Attack Cards are activated, 50% Extra Attack × Condense count, and when activated, remove Condense (max 3 stacks)." },
  },
  effects: [
    // 3-1: part of the shown %
    { kind: 'Buff', id: 'p3-1-launchers', node: '3-1', name: 'Basic Card Proficiency', category: 'Potential', type: 'Card +', value: '+20%',
      appliesTo: 'Launcher/Charge Launcher', hitScope: 'All hits', condition: 'Always' },
    // 5-1 and 7 are locked for the owner: Card + like 3-1 (Unconfirmed)
    { kind: 'Buff', id: 'p5-1-launchers', node: '5-1', name: 'Basic Card Proficiency', category: 'Potential', type: 'Card +', value: '+5%',
      appliesTo: 'Launcher/Charge Launcher', hitScope: 'All hits', condition: 'Always', thresholdStat: 'Critical Damage', thresholdBonus: { above: 1.6, value: '+5%', orEqual: true } },
    { kind: 'Buff', id: 'p7-opening-found', node: '7', name: 'Unique Stat Upgrade', category: 'Potential', type: 'Card +', value: '+10%',
      appliesTo: openingFounds, hitScope: 'All hits', condition: 'Always' },
    { kind: 'Buff', id: 'p7-charged-shot', node: '7', name: 'Unique Stat Upgrade: Charged Shot', category: 'Potential', type: 'Card +', value: '+10%',
      appliesTo: chargedShots, hitScope: 'All hits', condition: 'Always', thresholdStat: 'Critical Damage', thresholdMin: 2.3 },
    // E2 Awakening Memory: cards with the Retain keyword
    { kind: 'Buff', id: 'e2-retain', name: 'Retain card damage', category: 'Ego Manifestation', value: '+20%', appliesTo: 'Retain', hitScope: 'All hits', condition: 'Always', egoLevel: 2 },
    // E4 Inner Memory: 400% on the card (350% + 50%, level 6 doesn't raise an Ego skill)
    { kind: 'Buff', id: 'e4-ego-skill', name: 'Damage of Max Output Charged Shot', category: 'Ego Manifestation', type: 'Base %', value: '+50%',
      appliesTo: 'Max Output Charged Shot', hitScope: 'All hits', condition: 'Always', egoLevel: 4 },
  ],
  // E6 Liberated Memory: the 50% stays 50% at the owner's levels; Attack Cards only, so Opening Found V and this hit don't set it off
  triggers: [{ card: 'condense', on: 'Attack', own: true, counter: 'Condense', maxStacks: 3, perStack: true, egoLevel: 6 }],
  // Card text: the in-game wording (owner's screenshots, 2026-11-01), with tokens for the build's numbers (engine/cardText.ts)
  cards: {
    'card-512': { name: 'Max Output Charged Shot', text: '{E4:400%|{350%}} Damage to all enemies' },
    'card-513': { text: '{100%} Damage' },
    'card-514': { text: '{220%} Damage' },
    'card-515': { text: '{100%} Shield' },

    // Opening Found, I-V
    'card-516': { text: '[Retain]\n{160%} Damage\nRetain: Add 1 Hit(s) for 1 turn', notes: ONE_HIT },
    'card-517': { text: '[Retain]\n{210%} Damage\nRetain: Add 1 Hit(s) for 1 turn', notes: ONE_HIT },
    'card-518': { text: '[Retain]\n{260%} Damage\nRetain: Change Cost to 0' },
    'card-519': { text: '[Retain]\n{110%} Damage\nRetain: Add 2 Hit(s) for 1 turn', notes: TWO_HITS },
    'card-520': { text: '[Retain]\n{180%} Damage\nRetain: +80% Damage Amount', effects: retainBonus('+80%', 'Opening Found IV') },
    // In game 150% at Signature level 6, where the others are raised: no upgrade, like Mei Lin's Jewel V
    'card-521': { text: 'When a card of this unit is Retained, {150%} Extra Attack to random enemies', pct: 1.5, hits: 1, kind: 'Extra Attack', upgrade: null, notes: 'One play per card Retained' },

    // Charged Shot, I-V
    'card-522': { text: '[Retain]\n{270%} Damage\nRetain: +135% Damage Amount', effects: retainBonus('+135%', 'Charged Shot') },
    'card-523': { text: '[Retain]\n{360%} Damage\nRetain: +180% Damage Amount', effects: retainBonus('+180%', 'Charged Shot I') },
    'card-524': {
      text: '[Retain]\n{270%} Damage\nStreak: +135% Damage Amount',
      effects: [cardBuff('streak', 'Streak: Damage Amount', '+135%', 'Charged Shot II', { counter: 'Streak', maxStacks: 1 })],
    },
    'card-525': { text: '[Retain]\n{500%} Damage\nRetain: Decrease Cost by 1 until activated' },
    'card-526': { text: '[Retain]\n{360%} Damage\nRetain: +240% Damage Amount (max 1 time)', effects: retainBonus('+240%', 'Charged Shot IV', { maxStacks: 1 }) },
    'card-527': { text: '[Retain]\n{140%} Damage × 2\nRetain: +80% Damage Amount', effects: retainBonus('+80%', 'Charged Shot V') },

    // Guilty Pleasure, I-V
    'card-528': { text: '[Exhaust]\nDraw 3' },
    'card-529': { text: '[Exhaust]\nDraw 3\n1 Morale', notes: 'Add the Morale on the Buffs tab' },
    'card-530': { text: '[Exhaust]\nDraw 3\nDecrease Cost of 1 random card of this unit in hand by 1' },
    'card-531': { text: '[Exhaust]\nDraw 3\nAt the start of the next turn, Draw 2' },
    'card-532': { text: 'Draw 1\nActivate all Retain effects of cards of this unit in hand', notes: "Count it in the cards' Times Retained" },
    'card-533': { text: '[Unique / Exhaust 2]\nDraw 3' },

    // Unlimited Firepower, I-V
    'card-534': { text: '{100%} Shield\n+80% Damage Amount to the next Attack Card of this unit activated', effects: nextAttack('+80%', 'Unlimited Firepower') },
    'card-535': { text: '{150%} Shield\n+120% Damage Amount to the next Attack Card of this unit activated', effects: nextAttack('+120%', 'Unlimited Firepower I') },
    'card-536': {
      text: '+80% Damage Amount to Attack Cards of this unit for 1 turn',
      effects: [cardBuff('turn', 'Damage Amount to Attack Cards for 1 turn', '+80%', 'Attack', { counter: 'Unlimited Firepower II played this turn' })],
    },
    'card-537': { text: '+160% Damage Amount to the next Attack Card of this unit activated', effects: nextAttack('+160%', 'Unlimited Firepower III') },
    'card-538': { text: '{150%} Shield\n+80% Damage Amount to the next Attack Card activated', effects: nextAttack('+80%', 'Unlimited Firepower IV') },
    'card-539': { text: 'Increases Damage Amount of Attacks Cards of this unit by 30%', effects: [cardBuff('attack-cards', 'Damage Amount of Attack Cards', '30%', 'Attack')] },

    // The cost stays the import's 1: in game it's 0 from E1 (no damage depends on it)
    'card-540': { text: 'Create 1 Opening Found or Charged Shot, then apply Exhaust to that card and decrease Cost by 1 until activated', creates: CREATED },

    // The created cards: the normal cards' numbers (see above), renamed so they aren't taken for the picked ones
    'card-541': { name: OPENING_FOUND, pct: 1.6, text: '[Retain]\n{160%} Damage\nRetain: Add 1 Hit(s) for 1 turn', notes: ONE_HIT },
    'card-542': { name: CHARGED_SHOT, pct: 2.7, text: '[Retain]\n{270%} Damage\nRetain: +135% Damage Amount', effects: retainBonus('+135%', CHARGED_SHOT) },
  },
  extraCards: [
    effectHits({ element: 'Justice', kind: 'Extra Attack' })('condense', 'Condense', 0.5,
      "When Beryl's Attack Cards are activated, 50% Extra Attack × Condense count, and when activated, remove Condense (max 3 stacks)", { tags: 'Condense' }),
  ],
} satisfies CharacterAdditions
