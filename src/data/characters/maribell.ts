// Maribell: our additions to the Prydwen import (src/data/prydwen/maribell.json). Card keys are the import's ids.
// Damage % follows the "+" rule: 'by 20%' (no "+") = multiplicative, '+20%' = additive (owner, 2026-10-25).
// Shield isn't computed: each play sets the Shield owned, read in game (owner, 2026-11-01). Shelter Strike and Oh... I see. IV deal Fixed
// Damage = % x that number. Resolute Blitz IV and E6 add damage equal to a % of it under the multipliers, as they don't say Fixed (owner, 2026-11-01; Unconfirmed).
// A Counterattack is a play of its own, with a switch for the 300% when Shield blocks the whole attack (owner, 2026-11-01; can it crit: Unconfirmed).
// Pulverize raises Shelter Strike's Fixed Damage: it's the card's own keyword, not a persistent effect (owner, 2026-11-01; Unconfirmed).
import type { BuffEffect, CharacterAdditions } from '../../engine/types'
import { cardBuff, effectHits, EGO_POTENTIALS_PLUS_3 } from '../helpers'

const COUNTERATTACK = 'counterattack'
const counterHit = effectHits({ element: 'Passion', scaling: 'DEF' })

// Shelter Strike's Pulverize: Fixed Damage ignores multipliers, so its +20% is added to the Fixed %, 20% of 100% or (E1) of 150%
const strikePulverize = (id: string, value: string, ego: Partial<BuffEffect>): BuffEffect => ({ kind: 'Buff', id, name: 'Pulverize', category: 'Character',
  type: 'Base %', value, appliesTo: 'Shelter Strike', hitScope: 'All hits', condition: 'Always', counter: 'Target holding Shield', maxStacks: 1, ...ego })

export default {
  verified: { date: '2026-11-01', gameVersion: '841' },
  notes: 'Card upgrades are set on the Setup tab. Per play (Cards tab): Shield owned (read in game; Shelter Strike, Oh... I see. IV, Resolute Blitz IV), '
    + 'Target holding Shield (Pulverize), Counterattack owned (Maribell Shelter MK.II IV). Each Counterattack is a play: add the Counterattack card, switch on '
    + 'Completely blocked by Shield for the 300%, and set Shield owned (first Counterattack) on the first one each turn (E6). End-of-turn damage '
    + '(Resolute Blitz V, Oh... I see. IV) is one play per turn. Not counted: Shields and Shield gain (E2, node 5-1, Crystallization), Weaken, Resolve, other enemies (all-enemy damage counts one target)',
  // Potential nodes in the game's wording (owner's screenshots, 2026-11-01)
  potentials: {
    '3-1': { text: 'Add the following effect to the Shelter Defense and Shelter Hold cards: 1 Counterattack' },
    '5-1': { text: "+5% Shield Amount to Maribell's Shelter Defense and Shelter Hold\nIf Maribell's Health is 600 or higher, add an additional +5% to the modifier" },
    '7': { text: "+5% Damage Amount to Basic Cards and Signature Cards\nIf Maribell's Health is 800 or higher, add an additional +5% to the modifier" },
  },
  // Manifest Ego in the game's wording (owner's screenshots, 2026-11-01)
  ego: {
    1: { text: 'The fixed damage of the Shelter Strike card is increased by +50%.' },
    2: { text: "Maribell's Shield gain is increased by 10%." },
    3: { text: EGO_POTENTIALS_PLUS_3 },
    4: { text: 'The Shield gain of the Unbreakable card is increased by +100%' },
    5: { text: EGO_POTENTIALS_PLUS_3 },
    6: { text: 'The first Counterattack from Maribell each turn gains damage equal to 20% of her current Shield.' },
  },
  effects: [
    // Pulverize (in game): "When hitting a target holding Shield, increase Damage Amount by 20%"
    { kind: 'Buff', id: 'pulverize', name: 'Pulverize', category: 'Character', value: '20%', appliesTo: 'Pulverize', hitScope: 'All hits',
      condition: 'Always', counter: 'Target holding Shield', maxStacks: 1 },
    strikePulverize('pulverize-strike', '+20%', { egoBelow: 1 }),
    strikePulverize('pulverize-strike-e1', '+30%', { egoLevel: 1 }),
    // Counterattack (in game): 150% when taking Damage, 300% if Shield blocks the whole attack
    { kind: 'Buff', id: 'blocked', name: 'Counterattack: attack completely blocked by Shield (300%)', category: 'Character', type: 'Base %', value: '+150%',
      appliesTo: 'Counterattack', hitScope: 'All hits', condition: 'Always', counter: 'Completely blocked by Shield', maxStacks: 1 },
    // 5-1: part of the shown Shield %, like Chizuru's 5-1 on damage (Unconfirmed: locked on the owner's account); these cards deal no damage
    { kind: 'Buff', id: 'p5-1-shield', node: '5-1', name: 'Basic Card Proficiency', category: 'Potential', type: 'Card +', value: '+5%',
      appliesTo: 'Shelter Defense/Shelter Hold', hitScope: 'All hits', condition: 'Always', thresholdStat: 'Health', thresholdBonus: { above: 600, value: '+5%', orEqual: true } },
    // 7: Attack Cards, plus the one Upgrade that deals damage; Fixed Damage ignores it, and a Counterattack isn't a card
    { kind: 'Buff', id: 'p7-cards', node: '7', name: 'Unique Stat Upgrade', category: 'Potential', value: '+5%', appliesTo: 'Attack/Resolute Blitz V',
      hitScope: 'All hits', condition: 'Always', thresholdStat: 'Health', thresholdBonus: { above: 800, value: '+5%', orEqual: true } },
    // E1 Sleeping Memory: 150% on the card (level 6 doesn't raise it: Fixed)
    { kind: 'Buff', id: 'e1-strike', name: 'Fixed damage of Shelter Strike', category: 'Ego Manifestation', type: 'Base %', value: '+50%',
      appliesTo: 'Shelter Strike', hitScope: 'All hits', condition: 'Always', egoLevel: 1 },
    // E6 Liberated Memory: set on the first Counterattack of the turn only
    { kind: 'Buff', id: 'e6-counterattack', name: 'First Counterattack: damage equal to 20% of current Shield', category: 'Ego Manifestation', type: 'Flat', value: '20%',
      appliesTo: 'Counterattack', hitScope: 'All hits', condition: 'Always', counter: 'Shield owned (first Counterattack)', egoLevel: 6 },
  ],
  // Card text: the in-game wording (owner's screenshots, 2026-11-01), with tokens for the build's numbers (engine/cardText.ts)
  cards: {
    // Ego skill: 450% at E4 (350% + 100%)
    'card-308': { text: '{E4:450%|{350%}} Shield' },
    'card-309': { text: '{100%} Defense-Based Damage' },
    'card-310': { text: '{100%} Shield\n{P3-1:1 Counterattack}', creates: [COUNTERATTACK] },
    'card-311': { text: '{220%} Shield\n{P3-1:1 Counterattack}', creates: [COUNTERATTACK] },

    // Resolute Blitz, I-V
    'card-312': { text: '[Pulverize]\n{140%} Defense-Based Damage\n20% DMG-Based Shield\n1 Counterattack', creates: [COUNTERATTACK] },
    'card-313': { text: '[Pulverize]\n{210%} Defense-Based Damage\n20% DMG-Based Shield\n1 Counterattack\nWhen Damage is inflicted, add 1 Counterattack', creates: [COUNTERATTACK] },
    'card-314': { text: '[Pulverize]\n{140%} Defense-Based Damage\n20% DMG-Based Shield\n2 Counterattack', creates: [COUNTERATTACK] },
    'card-315': { text: '[Pulverize]\n{210%} Defense-Based Damage to all enemies\n20% DMG-Based Shield\nGain Counterattack for each target Damaged', creates: [COUNTERATTACK] },
    'card-316': {
      text: '[Pulverize]\n{210%} Defense-Based Damage\n20% DMG-Based Shield\nIncreases Damage Amount equal to 30% of Shield owned',
      effects: [cardBuff('shield', 'Damage Amount equal to 30% of Shield owned', '30%', 'Resolute Blitz IV', { type: 'Flat', counter: 'Shield owned' })],
    },
    // In game 210% at Signature level 6, where the others are raised: no upgrade, like Mei Lin's Jewel V
    'card-317': { text: 'At the end of the turn, 1 Counterattack\n{210%} Defense-Based Damage to random enemies', upgrade: null, notes: 'One play per turn', creates: [COUNTERATTACK] },

    // Maribell Shelter MK.II, I-V
    'card-318': { text: '[Pulverize]\n{120%} Defense-Based Damage\n100% DMG-Based Shield' },
    'card-319': { text: '[Pulverize]\n{120%} Defense-Based Damage to all enemies\n100% DMG-Based Shield' },
    'card-320': { text: '[Pulverize]\n{160%} Defense-Based Damage\n100% DMG-Based Shield' },
    'card-321': { text: '[Pulverize]\n{280%} Defense-Based Damage\n100% DMG-Based Shield' },
    'card-322': {
      text: '[Pulverize]\n{160%} Defense-Based Damage\n+50% Damage Amount for each Counterattack of this unit',
      effects: [cardBuff('counterattack', 'Damage Amount for each Counterattack of this unit', '+50%', 'Maribell Shelter MK.II IV', { counter: 'Counterattack owned', maxStacks: 10 })],
    },
    'card-323': { text: '[Pulverize]\n{120%} Defense-Based Damage\n100% DMG-Based Shield' },

    // Wolves' Dome, I-V
    'card-324': { text: '2 Counterattack\nAt the start of the turn,\n1 Counterattack\n2 Crystallization', creates: [COUNTERATTACK] },
    'card-325': { text: '[Initiation]\n2 Counterattack\nAt the start of the turn,\n1 Counterattack\n2 Crystallization', creates: [COUNTERATTACK] },
    'card-326': { text: '2 Counterattack\nAt the start of the turn,\n1 Counterattack and 80% Fixed Shield', creates: [COUNTERATTACK] },
    'card-327': { text: '2 Counterattack\nAt the start of the turn,\n2 Counterattack\n2 Crystallization', creates: [COUNTERATTACK] },
    'card-328': { text: '2 Counterattack\nFor 1 turn, 2 Resolve', creates: [COUNTERATTACK] },
    'card-329': {
      text: '[Lead]\nAt the start of the turn,\n2 Counterattack\n+20% Damage Amount to Counterattacks of this unit',
      creates: [COUNTERATTACK],
      effects: [cardBuff('counterattacks', 'Damage Amount to Counterattacks of this unit', '+20%', 'Counterattack')],
    },

    // Oh... I see., I-V
    'card-330': { text: '{100%} Shield\n1 Counterattack\n1 Weaken to all enemies', creates: [COUNTERATTACK] },
    'card-331': { text: '{150%} Shield\n1 Counterattack\n2 Weaken to all enemies', creates: [COUNTERATTACK] },
    'card-332': { text: '{150%} Shield\n2 Counterattack', creates: [COUNTERATTACK] },
    'card-333': { text: '2 Counterattack\n2 Weaken to all enemies', creates: [COUNTERATTACK] },
    'card-334': {
      text: 'At the end of the turn, Fixed Damage equal to {F50%} of Shield owned to the enemy with the lowest HP',
      scaling: 'Fixed', pct: 0.5, hits: 1, fixedOf: 'Shield owned', notes: 'One play per turn',
    },
    'card-335': { text: '[Unique]\nAt the start of the turn, 25% Fixed Shield equal to number of the own Counterattack' },

    'card-336': {
      text: '[Pulverize]\nFixed Damage equal to {E1:{F100%+50%}|{F100%}} of Shield owned',
      scaling: 'Fixed', pct: 1, hits: 1, fixedOf: 'Shield owned',
    },
  },
  extraCards: [
    counterHit(COUNTERATTACK, 'Counterattack', 1.5,
      'When taking Damage, 150% Defense-Based Damage to the attacker\nIf an attack is completely blocked by Shield, 300% Defense-Based Damage to the attacker\nWhen the effect is activated, decrease Counterattack by 1\n(Max 10)',
      { tags: 'Counterattack', notes: 'One play per Counterattack' }),
  ],
} satisfies CharacterAdditions
