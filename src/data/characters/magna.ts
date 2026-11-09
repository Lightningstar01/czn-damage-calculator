// Magna: our additions to the Prydwen import (src/data/prydwen/magna.json). Card keys are the import's ids.
// Damage % follows the "+" rule: 'by 20%' (no "+") = multiplicative, '+20%' = additive (owner, 2026-10-25).
// A Counterattack is a play of its own, with a switch for the 300% when Shield blocks the whole attack, as Maribell's (owner, 2026-11-01).
// Absolute Zero's "by 20% for each Counterattack" is one multiplier, x(1 + 20% x N) (owner, 2026-11-08).
// Glacial Iron Fist III's "When Shield is owned" is a switch per play (owner, 2026-11-08).
// Node 7's Justice-Attribute Damage is on the stats screen (Justice Damage 15.0% at Defense 384), so nothing is added on top (owner, 2026-11-08).
import type { CharacterAdditions } from '../../engine/types'
import { cardBuff, effectHits, EGO_POTENTIALS_PLUS_3 } from '../helpers'

const COUNTERATTACK = 'counterattack'
const counterHit = effectHits({ element: 'Justice', scaling: 'DEF' })
const ALL_ENEMIES = (turns: number) => `Set the target of Counterattack to all enemies for ${turns} turn(s)`

export default {
  verified: { date: '2026-11-08', gameVersion: '841' },
  notes: 'Card upgrades are set on the Setup tab. Each Counterattack is a play: add the Counterattack card, switch on Completely blocked by Shield '
    + 'for the 300%, and Enhanced Counterattack (E6) or Ice Fragment V (next Counterattack) where they apply. Per play (Cards tab): Counterattack owned '
    + '(Absolute Zero), Holding Shield (Glacial Iron Fist III), Shield owned (Ice Wall IV). Ice Fragment IV\'s end-of-turn damage is one play per turn. '
    + 'Not counted: Shields and Shield gain (Crystallization, node 5-1, DMG-Based Shield, Frost Charge I, Ice Wall II), E2 Freeze (adjacent monsters), '
    + 'other enemies (all-enemy damage counts one target)',
  // Ice Wall IV's Shield owned is read only by its fixedOf: listed here so the additions check knows it's meant (0 to start off)
  playStacks: { 'Shield owned': 0 },
  // Potential nodes in the game's wording (owner's screenshots, 2026-11-08)
  potentials: {
    '3-1': { text: 'Add 1 Counterattack to Frozen Fist and Frost Shield.' },
    '5-1': { text: "+5% Shield Gain Amount to Magna's Frost Shield\nIf Magna's Defense is 250 or higher, add an additional +5% to the modifier" },
    '7': { text: "If Magna's Defense is 300 or higher, +5% Justice-Attribute Damage Amount\nFor every 10 Defense exceeding 300, add an additional 2% to the modifier\n(additional +10% max)" },
  },
  // Manifest Ego in the game's wording (owner's screenshots, 2026-11-08)
  ego: {
    1: { text: 'Adds Initiation to the Storm of Bitter Cold card and increases Crystallization by 1.' },
    2: { text: "Magna's counters inflict 1 Freeze on the target.\nFreeze: When taking Damage from Magna's Attack Cards, adjacent monsters take 50% Defense-Based Damage. Freeze is removed upon the effect's activation." },
    3: { text: "Changes Absolute Zero's Damage Amount increased effect for each Counterattack to 30%." },
    4: { text: "Changes Magna's Counterattack so it no longer reduces Vulnerable." },
    5: { text: EGO_POTENTIALS_PLUS_3 },
    6: { text: "At the start of the turn, gain 1 Enhanced Counterattack.\nEnhanced Counterattack: Increase Damage Amount of Counterattack by 30%\nEnhanced Counterattack is removed upon the effect's activation\n(max 2 stacks)" },
  },
  effects: [
    // Counterattack (in game): 150% when taking Damage, 300% if Shield blocks the whole attack
    { kind: 'Buff', id: 'blocked', name: 'Counterattack: attack completely blocked by Shield (300%)', category: 'Character', type: 'Base %', value: '+150%',
      appliesTo: 'Counterattack', hitScope: 'All hits', condition: 'Always', counter: 'Completely blocked by Shield', maxStacks: 1 },
    // 7 is on the stats screen (see the header). 5-1 raises Frost Shield's Shield only: not counted.
    // E3 Vivid Memory: Absolute Zero's 20% per Counterattack becomes 30%
    { kind: 'Buff', id: 'e3-absolute-zero', name: 'E3 Absolute Zero: Damage Amount for each Counterattack', category: 'Ego Manifestation', value: '30%',
      appliesTo: 'Absolute Zero', hitScope: 'All hits', condition: 'Always', counter: 'Counterattack owned', maxStacks: 10, egoLevel: 3 },
    // E6 Liberated Memory: on the Counterattacks that use an Enhanced Counterattack (one per Counterattack)
    { kind: 'Buff', id: 'e6-enhanced', name: 'Enhanced Counterattack', category: 'Ego Manifestation', value: '30%', appliesTo: 'Counterattack',
      hitScope: 'All hits', condition: 'Always', counter: 'Enhanced Counterattack', maxStacks: 1, egoLevel: 6 },
  ],
  // Card text: the in-game wording (owner's screenshots, 2026-11-08), with tokens for the build's numbers (engine/cardText.ts)
  cards: {
    'card-93': {
      text: '{300%} Defense-Based Damage\nIncreases Damage Amount by {E3:30%|20%} for each Counterattack on this unit',
      effects: [cardBuff('counterattack', 'Damage Amount for each Counterattack on this unit', '20%', 'Absolute Zero',
        { counter: 'Counterattack owned', maxStacks: 10, egoBelow: 3 })],
    },
    'card-94': { text: '{100%} Defense-Based Damage\n{P3-1:1 Counterattack}', creates: [COUNTERATTACK] },
    'card-95': { text: '{100%} Shield\n{P3-1:1 Counterattack}', creates: [COUNTERATTACK] },

    // Ice Fragment, I-V: 3 Crystallization in game (Prydwen 4; I: 5, Prydwen 6)
    'card-96': { text: '[Lead]\n3 Crystallization\nAt the start of the turn,\n1 Counterattack', creates: [COUNTERATTACK] },
    'card-97': { text: '[Lead]\n5 Crystallization\nAt the start of the turn,\n1 Counterattack', creates: [COUNTERATTACK] },
    'card-98': { text: '[Lead]\n3 Crystallization\nAt the start of the turn,\n2 Counterattack', creates: [COUNTERATTACK] },
    'card-99': {
      text: '[Initiation]\n3 Crystallization\nAt the start of the turn, 1 Counterattack\nIncrease Damage Amount by 30% to Counterattacks of this unit',
      creates: [COUNTERATTACK],
      effects: [cardBuff('counterattacks', 'Damage Amount to Counterattacks of this unit', '30%', 'Counterattack')],
    },
    // In game 200% at Signature level 1, where the others are raised (and "at the end of the turn", Prydwen "start"): no upgrade
    'card-100': { text: '[Unique / Lead]\n3 Crystallization\nAt the end of the turn,\n{200%} Defense-Based Damage to all enemies', upgrade: null, notes: 'One play per turn' },
    // Prydwen: 30%
    'card-101': {
      text: '[Lead]\n4 Counterattack\nIncrease Damage Amount of the next Counterattack of this unit activated by 100%',
      creates: [COUNTERATTACK],
      effects: [cardBuff('next-counterattack', 'Damage Amount of the next Counterattack', '100%', 'Counterattack',
        { counter: 'Ice Fragment V (next Counterattack)', maxStacks: 1 })],
    },

    // Glacial Iron Fist, I-V
    'card-102': { text: '{300%} Defense-Based Damage\n50% DMG-Based Shield' },
    'card-103': { text: '{450%} Defense-Based Damage\n50% DMG-Based Shield' },
    'card-104': { text: '{300%} Defense-Based Damage\n3 Vulnerable' },
    'card-105': {
      text: '{450%} Defense-Based Damage\nWhen Shield is owned, increases Damage Amount by 50%',
      effects: [cardBuff('shield', 'Shield owned: Damage Amount', '50%', 'Glacial Iron Fist III', { counter: 'Holding Shield', maxStacks: 1 })],
    },
    'card-106': { text: '{300%} Defense-Based Damage to all enemies\n50% DMG-Based Shield' },
    'card-107': { text: '[Exhaust 2]\n{400%} Defense-Based Damage\n50% DMG-Based Shield\n100% Shield Retention for 1 turn' },

    // Ice Wall, I-V
    'card-108': { text: `{200%} Shield\n2 Counterattack\n${ALL_ENEMIES(2)}`, creates: [COUNTERATTACK] },
    'card-109': { text: `{300%} Shield\n3 Counterattack\n${ALL_ENEMIES(2)}`, creates: [COUNTERATTACK] },
    // Prydwen: 3 Counterattack, all enemies for 1 turn
    'card-110': { text: '{300%} Shield\n2 Counterattack\n+30% Shield Gain Amount for each Counterattack of this unit', creates: [COUNTERATTACK] },
    'card-111': { text: '[Lead]\n{200%} Shield\nSet the target of Counterattack to all enemies' },
    // Fixed Damage = Shield held (Maribell's Shelter Strike); the Shield % is raised by the upgrade, the Fixed Damage isn't (potentialFixed)
    'card-112': {
      text: '{200%} Shield\nInflict Fixed Damage to all enemies equal to Shield held',
      scaling: 'Fixed', pct: 1, hits: 1, fixedOf: 'Shield owned',
    },
    'card-113': { text: `{200%} Shield\n3 Counterattack\n${ALL_ENEMIES(3)}`, creates: [COUNTERATTACK] },

    // Frost Charge, I-V
    'card-114': { text: '{140%} Shield\n3 Vulnerable to all enemies' },
    'card-115': { text: '{210%} Shield\n3 Vulnerable to all enemies\n+60% base Shield Gain Amount for each enemy present' },
    'card-116': { text: '{210%} Shield\n4 Vulnerable to all enemies' },
    // Prydwen: no Crystallization, 2 Vulnerable
    'card-117': { text: '4 Crystallization\n3 Vulnerable to targets hit by Counterattack' },
    'card-118': { text: '{100%} Defense-Based Damage x 3 to random enemies\n1 Vulnerable to targets that were Hit' },
    'card-119': { text: '3 Vulnerable to all enemies\n3 Counterattack', creates: [COUNTERATTACK] },

    // E1: Initiation and +1 Crystallization (2 -> 3)
    'card-120': { text: '[Lead{E1: / Initiation}]\n{E1:3|2} Crystallization\nWhen Shield is gained, 1 Counterattack', creates: [COUNTERATTACK] },
  },
  extraCards: [
    counterHit(COUNTERATTACK, 'Counterattack', 1.5,
      'When taking Damage, 150% Defense-Based Damage to the attacker\nIf an attack is completely blocked by Shield, 300% Defense-Based Damage to the attacker\nWhen the effect is activated, decrease Counterattack by 1\n(Max 10)',
      { tags: 'Counterattack', notes: 'One play per Counterattack' }),
  ],
} satisfies CharacterAdditions
