// Khalipe: our additions to the Prydwen import (src/data/prydwen/khalipe.json). Card keys are the import's ids.
// Damage % follows the "+" rule: 'by 20%' (no "+") = multiplicative, '+20%' = additive (owner, 2026-10-25).
// Each Celestial proc of Vulture Ejection is one more play of it on the attack list, and each Silver Veil activation is a play of its own (owner, 2026-11-01).
// Greatsword Aquila II's "When activated, +40%" is on every play of that card (owner, 2026-11-01; Unconfirmed). Deploy Veil reaches all Khalipe's damage, Silver Veil's too (owner, 2026-11-01).
import type { CardPreset, CharacterAdditions } from '../../engine/types'
import { cardBuff, effectHits, EGO_POTENTIALS_PLUS_3 } from '../helpers'

const SILVER_VEIL = 'silver-veil'
const VULTURE = 'Vulture Ejection'
const IN_HAND = 'Vulture Ejection in hand'
const veilHit = effectHits({ element: 'Instinct', scaling: 'DEF' })

// The base card and its epiphanies are told apart by name, so node 7 and Greatsword IV find them all by this tag
const vulture = (text: string): Partial<CardPreset> => ({ text: `[Celestial / Retain]\n${text}\n1 Silver Veil`, tags: `${VULTURE}, Celestial, Retain`, creates: [SILVER_VEIL] })

const greatswordInHand = (name: string, amount: string) => [cardBuff('vulture-in-hand', 'If Vulture Ejection is in hand: Damage Amount', amount, name, { counter: IN_HAND, maxStacks: 1 })]

export default {
  verified: { date: '2026-11-01', gameVersion: '841' },
  notes: 'Card upgrades are set on the Setup tab. Each Celestial proc of Vulture Ejection is one more play on the list. Each Silver Veil activation (3 stacks) is a play of the '
    + 'Silver Veil card, always in the deck (the Ego skill brings it). Per play (Cards tab): Vulture Ejection in hand (Greatsword Aquila, I, V), Greatsword Aquila IV Retained (on Vulture Ejection), Deploy Veil (E4). '
    + 'Not counted: Shields, Tenacity, Damage Reduction, Weaken, draws, other enemies (all-enemy damage counts one target), and Greatsword\'s +1 Cost for buffs that read Cost',
  // Potential nodes in the game's wording (owner's screenshots, 2026-11-01)
  potentials: {
    '3-1': { text: 'Upward Slash Cards deal -40% Damage but attack all enemies.' },
    '5-1': { text: "+5% Damage Amount to Khalipe's Lashing and Upward Slash\nIf Khalipe's Defense is 250 or higher, add an additional +5% to the modifier" },
    '7': { text: "+10% Damage and Shield Gain Amounts to Vulture Ejection\nIf Khalipe's Attack is 700 or higher, add an additional +20% Damage Amount to Vulture Ejection\nIf Khalipe's Defense is 300 or higher, add an additional +20% Shield Amount to Vulture Ejection" },
  },
  // Manifest Ego in the game's wording (owner's screenshots, 2026-11-01)
  ego: {
    1: { text: 'Add Retain to Absolute Protection cards, and +20% Shield' },
    2: { text: 'At the start of battle and on Shuffle, move 1 Vulture Ejection card in Draw Pile to the top of Draw Pile.' },
    3: { text: '+50% Charisma of Resolve Damage, and gain Silver Veil 1 on use' },
    4: { text: 'Each time the Silver Veil effect is activated, gain the Deploy Veil effect\nDeploy Veil: +30% Damage and Shield Gain Amounts\n(max 2 stacks)' },
    5: { text: EGO_POTENTIALS_PLUS_3 },
    6: { text: 'At the start of battle, gain 2 Silver Veil, and +150% Damage Amount to Silver Veil.' },
  },
  effects: [
    // 5-1: part of the shown card %, like node 7 here (Unconfirmed: locked on the owner's account)
    { kind: 'Buff', id: 'p5-1-basics', node: '5-1', name: 'Basic Card Proficiency', category: 'Potential', type: 'Card +', value: '+5%', appliesTo: 'Lashing/Upward Slash',
      hitScope: 'All hits', condition: 'Always', thresholdStat: 'Defense', thresholdBonus: { above: 250, value: '+5%', orEqual: true } },
    // 7: the +10% is in the shown card % (Vulture Ejection 143% = (120% + 10%) x 1.10). The Attack bonus should be too (Unconfirmed: the owner's Attack is below 700);
    // it also shows on the card's Shield line, and the Defense bonus (Shield only) doesn't show, as Shield isn't computed
    { kind: 'Buff', id: 'p7-vulture', node: '7', name: 'Unique Stat Upgrade', category: 'Potential', type: 'Card +', value: '+10%', appliesTo: VULTURE,
      hitScope: 'All hits', condition: 'Always', thresholdBonus: { above: 700, value: '+20%', orEqual: true } },
    // E3 Vivid Memory (350% on the card, as Selena's E4)
    { kind: 'Buff', id: 'e3-ego-skill', name: 'Charisma of Resolve Damage', category: 'Ego Manifestation', type: 'Base %', value: '+50%', appliesTo: 'Charisma of Resolve',
      hitScope: 'All hits', condition: 'Always', egoLevel: 3 },
    // E4 Inner Memory: stacks set per play, as they depend on how many Silver Veils have gone off
    { kind: 'Buff', id: 'e4-deploy-veil', name: 'Deploy Veil: Damage Amount', category: 'Ego Manifestation', value: '+30%', appliesTo: 'ALL',
      hitScope: 'All hits', condition: 'Always', counter: 'Deploy Veil', maxStacks: 2, egoLevel: 4 },
    // E6 Liberated Memory
    { kind: 'Buff', id: 'e6-silver-veil', name: 'Damage Amount to Silver Veil', category: 'Ego Manifestation', value: '+150%', appliesTo: 'Silver Veil',
      hitScope: 'All hits', condition: 'Always', egoLevel: 6 },
  ],
  // Card text: the in-game wording (owner's screenshots, 2026-11-01), with tokens for the build's numbers (engine/cardText.ts)
  cards: {
    // Ego skill: 350% at E3 (300% + 50%). It creates the plain card, whichever epiphany the deck holds (Unconfirmed)
    'card-63': { text: '{E3:350%|{300%}} Defense-Based Damage to all enemies\nCreate 1 Vulture Ejection\n{E3:1 Silver Veil}', creates: ['card-67', SILVER_VEIL] },
    'card-64': { text: '{100%} Defense-Based Damage' },
    // 3-1: 184% at Basic level 1 = (220% - 40%) x 1.02
    'card-65': { text: '{P3-1:{180%} Defense-Based Damage to all enemies|{220%} Defense-Based Damage}', nodeCard: { '3-1': { pct: 1.8 } } },
    'card-66': { text: '{100%} Shield' },

    // Vulture Ejection, I-V
    'card-67': vulture('{120%} Defense-Based Damage to all enemies\n{100%} Shield'),
    'card-68': vulture('{280%} Defense-Based Damage to all enemies'),
    'card-69': vulture('{280%} Shield'),
    'card-70': vulture('{180%} Defense-Based Damage to all enemies\n{150%} Shield'),
    'card-71': { ...vulture('{180%} Defense-Based Damage to all enemies'), text: '[Celestial / Retain]\n{180%} Defense-Based Damage to all enemies\n1 Silver Veil\nRetain: {100%} Shield' },
    'card-72': { ...vulture('{180%} Defense-Based Damage to all enemies'), text: '[Celestial / Retain]\n{180%} Defense-Based Damage to all enemies\n1 Silver Veil\n40% Shield for each card in hand' },

    // Greatsword Aquila, I-V
    'card-73': { text: '{150%} Defense-Based Damage to all enemies\nIf Vulture Ejection is in hand, increase Cost by 1, +120% Damage Amount', effects: greatswordInHand('Greatsword Aquila', '+120%') },
    'card-74': { text: '{210%} Defense-Based Damage to all enemies\nIf Vulture Ejection is in hand, increase Cost by 1, +170% Damage Amount', effects: greatswordInHand('Greatsword Aquila I', '+170%') },
    'card-75': {
      text: '{220%} Defense-Based Damage to all enemies\nWhen activated, +40% Damage Amount',
      effects: [cardBuff('when-activated', 'When activated: Damage Amount', '+40%', 'Greatsword Aquila II')],
    },
    'card-76': { text: '{220%} Defense-Based Damage to all enemies\nIf Vulture Ejection is in hand, 1 Silver Veil', creates: [SILVER_VEIL] },
    'card-77': {
      text: '[Retain]\n{220%} Defense-Based Damage to all enemies\nRetain: +60% Damage Amount to next activated Vulture Ejection',
      effects: [cardBuff('retained', 'Retain: Damage Amount to next activated Vulture Ejection', '+60%', VULTURE, { counter: 'Greatsword Aquila IV Retained' })],
    },
    'card-78': { text: '[Retrieve 3]\n{150%} Defense-Based Damage to all enemies\nIf Vulture Ejection is in hand, increase Cost by 1, +120% Damage Amount', effects: greatswordInHand('Greatsword Aquila V', '+120%') },

    // Overpower, I-V
    'card-79': { text: '{250%} Shield\n1 Tenacity Damage to all enemies' },
    'card-80': { text: '{300%} Shield\n1 Tenacity Damage to all enemies\n1 Damage Reduction for each enemy present' },
    'card-81': { text: '{300%} Shield\n1 Tenacity Damage to all enemies\n2 Vulnerable to enemies in a Ravage state\nIf not, 2 Weaken' },
    'card-82': { text: '{300%} Shield\n2 Tenacity Damage to all enemies' },
    'card-83': { text: '{250%} Shield\n1 Tenacity Damage to all enemies\n+40% base Shield Gain Amount for each card in hand' },
    'card-84': { text: '{300%} Shield\n1 Tenacity Damage to all enemies\nIncrease Action Count of all enemies by 5' },

    // Rally, I-V
    'card-85': { text: '{120%} Shield\nDraw 1 highest-cost card(s)' },
    'card-86': { text: '{150%} Shield\nDraw 1 highest-cost card(s)\n1 Silver Veil', creates: [SILVER_VEIL] },
    'card-87': { text: '{150%} Shield\nDraw 1 Celestial Card(s)\n1 Silver Veil', creates: [SILVER_VEIL] },
    'card-88': { text: '[Celestial]\n{150%} Shield\nDraw 1 highest-cost card(s)\n1 Silver Veil', creates: [SILVER_VEIL] },
    'card-89': { text: "{120%} Shield\nDraw 1,\ngain {60%} Shield equal to that card's Cost\n1 Silver Veil", creates: [SILVER_VEIL] },
    'card-90': { text: '{150%} Shield\nSelect and Draw 1 2-Cost or higher cards from Draw Pile' },

    // E1: Retain, and +20% Shield (locked on the owner's account; assumed in the shown %)
    'card-91': { text: '[Finale{E1: / Retain}]\n{E1:{120%}|{100%}} Shield for each X\nFor 1 turn, Retain all cards in hand (cannot stack)' },
  },
  extraCards: [
    veilHit(SILVER_VEIL, 'Silver Veil', 5, 'When Silver Veil reaches 3 stacks, 500% Defense-Based Damage to all enemies\nOn activation, remove Silver Veil',
      { tags: 'Silver Veil', image: 'cards/khalipe/unique_1008_05.webp', notes: 'One play per activation (3 stacks)' }),
  ],
} satisfies CharacterAdditions
