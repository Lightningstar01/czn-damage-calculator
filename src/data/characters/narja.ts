// Narja: our additions to the Prydwen import (src/data/prydwen/narja.json). Card keys are the import's ids.
// Damage % follows the "+" rule: 'by 20%' (no "+") = multiplicative, '+20%' = additive (owner, 2026-10-25).
// Voracity and Predation are set per play (owner, 2026-10-28): each hit uses up a stack, so a play may have them or not.
// Bottomless Hunger IV's "+100% Defense-Based Damage" and Domain of Voracity II's "+100% Defense-Based Damage taken by the target"
// are additive on Defense-Based cards; Domain II's debuff counts for the plays after it, not its own hit (owner, 2026-10-28).
// E6's end-of-turn damage is its own card that joins the deck at E6 (owner, 2026-10-28).
import type { CharacterAdditions } from '../../engine/types'
import { cardBuff } from '../helpers'

export default {
  notes: 'Card upgrades are set on the Setup tab. Per play (Cards tab): Voracity and Predation (1 while Narja has a stack; Voracity '
    + 'needs Health 50% or higher, Predation needs Voracity), Bottomless Hunger IV (played this turn), Domain of Voracity II (on '
    + 'target), Voracity decreased by Shackles of Hunger IV (up to 5), Voracity activations this turn (Bottomless Hunger V, for the '
    + 'next Mealtime). Shackles of Hunger III: set the hits (3, +1 per 4 Voracity, max 6). Domain of Voracity IV with both '
    + 'Voracity and Predation: add it twice. Voluntary Control II\'s Morale: add it on the Buffs tab',
  // Potential nodes in the game's wording (owner's screenshots, 2026-10-30)
  potentials: {
    '3-1': { text: 'Adds 2 Voracity to NA: Defense Response.' },
    '5-1': { text: "+5% Heal Amount to Narja's NA: Defense Response\nIf Narja's Defense is 250 or higher, add an additional +5% to the modifier" },
    '7': { text: "+10% Damage Amount to Voracity\nIf Narja's Defense is 300 or higher, +20% Damage Amount to Predation" },
  },
  effects: [
    // Keywords (in game): "Voracity: When Hitting with an Attack Card, 40% Fixed Heal. If Health is 50% or higher, +30% Damage
    // Amount dealt by Attack Cards. When the effect is activated, decrease by 1 (max 30 stacks)". "Predation: If in a Voracity
    // state, +80% Damage Amount dealt by Attack Cards. When the effect is activated, decrease by 1"
    { kind: 'Buff', id: 'voracity', name: 'Voracity', category: 'Character', value: '+30%', appliesTo: 'Attack',
      hitScope: 'All hits', condition: 'Always', counter: 'Voracity', maxStacks: 1, hint: 'Health ≥ 50%' },
    { kind: 'Buff', id: 'predation', name: 'Predation', category: 'Character', value: '+80%', appliesTo: 'Attack',
      hitScope: 'All hits', condition: 'Always', counter: 'Predation', maxStacks: 1, hint: 'with Voracity' },
    // 7 (in game): "+10% Damage Amount to Voracity. If Narja's Defense is 300 or higher, +20% Damage Amount to Predation"
    // (Prydwen: "greater than 300"): Voracity's +30% becomes +40%, Predation's +80% +100% (owner, 2026-10-28)
    { kind: 'Buff', id: 'p7-voracity', name: 'Unique Stat Upgrade: Voracity', category: 'Potential', value: '+10%',
      appliesTo: 'Attack', hitScope: 'All hits', condition: 'Always', counter: 'Voracity', maxStacks: 1 },
    { kind: 'Buff', id: 'p7-predation', name: 'Unique Stat Upgrade: Predation', category: 'Potential', value: '+20%',
      appliesTo: 'Attack', hitScope: 'All hits', condition: 'Always', counter: 'Predation', maxStacks: 1,
      thresholdStat: 'Defense', minAttack: 300 },
    // E4 Inner Memory (in game): "+40% Damage Amount to Predation" (Prydwen: +30%)
    { kind: 'Buff', id: 'e4-predation', name: 'E4 Inner Memory', category: 'Ego Manifestation', value: '+40%', appliesTo: 'Attack',
      hitScope: 'All hits', condition: 'Always', counter: 'Predation', maxStacks: 1, egoLevel: 4 },
  ],
  // Card text: the in-game wording (owner's screenshots, 2026-10-28), with tokens for the build's numbers (engine/cardText.ts)
  cards: {
    // Ego skill. E3 Vivid Memory: +3 Predation if Mealtime is in Graveyard
    'card-852': { text: '10 Voracity\n{250%} Defense-Based Damage\nIf Mealtime is in Graveyard, {E3:8|5} Predation' },
    'card-853': { text: '{100%} Defense-Based Damage' },
    // 3-1: "Adds 2 Voracity to NA: Defense Response"
    'card-854': { text: 'Heal {100%}\n{P3-1:2 Voracity}' },

    // Shackles of Hunger, I–V
    'card-855': { text: '{30%} Defense-Based Damage × 3\nAttunement: 4 Voracity' },
    'card-856': { text: '{30%} Defense-Based Damage × 4\nAttunement: 6 Voracity' },
    'card-857': {
      text: '{30%} Defense-Based Damage × 2\nAt the start of the turn, if Voracity was activated 3 or more times in the previous turn, '
        + 'move to hand\nAttunement: 1 Voracity',
    },
    'card-858': { text: '{50%} Defense-Based Damage × 3\nAdd 1 Hit for each 4 Voracity owned (max 3 times)' },
    'card-859': {
      text: '[Retain]\nDecrease Voracity by up to 5\n+40% Damage Amount to the next Attack Card activated for each amount decreased\n'
        + 'If 5 is decreased, 3 Predation',
      effects: [cardBuff('next', 'Damage Amount to the next Attack Card for each Voracity decreased', '+40%', 'Attack',
        { counter: 'Shackles of Hunger IV (Voracity decreased)', maxStacks: 5 })],
    },
    'card-860': { text: '{60%} Shield\nDecrease Voracity by max 3\nRepeat for each amount decreased' },

    // Bottomless Hunger, I–V
    'card-861': { text: 'The next 2 times Voracity is activated, decrease Cost of 1 random card in hand by 1 for 1 turn' },
    'card-862': { text: '3 Voracity\nThe next 2 times Voracity is activated, decrease Cost of 1 random card in hand by 1 for 1 turn' },
    'card-863': { text: 'Decrease Cost of 2 random cards in hand by 1 for 1 turn(s)' },
    'card-864': {
      text: '[Unique]\nWhen Voracity is activated 3 times in 1 turn, decrease Cost of 1 random card in hand by 1 until activated '
        + '(1 time per turn)',
    },
    'card-865': {
      text: '[Retain]\nFor 1 turn, +100% Defense-Based Damage',
      effects: [cardBuff('def', 'Defense-Based Damage for 1 turn', '+100%', 'Defense-Based',
        { counter: 'Bottomless Hunger IV', maxStacks: 1 })],
    },
    'card-866': {
      text: '[Lead]\n7 Voracity\nFor 1 turn, each time Voracity is activated, +40% Damage Amount to the next Mealtime',
      effects: [cardBuff('mealtime', 'Damage Amount to the next Mealtime for each Voracity activated', '+40%', 'Mealtime',
        { counter: 'Voracity activations (Bottomless Hunger V)' })],
    },

    // Voluntary Control, I–V
    'card-867': { text: 'If Voracity is fewer than 6 stacks, gain 6 Voracity\nIf 6 or more stacks, gain 2 Predation' },
    'card-868': { text: 'If Voracity is fewer than 6 stacks, gain 9 Voracity\nIf 6 or more stacks, gain 3 Predation' },
    'card-869': { text: 'If Mealtime is in Draw Pile, move to hand\nIf in Graveyard, 3 Morale for 1 turn' },
    'card-870': { text: 'For 2 turn(s), each time Action Count of the target is decreased, 1 Voracity' },
    'card-871': { text: '[Unique]\n10 Voracity\nSelect 1 Attack Card(s)\n1 Predation each time that card is moved to hand' },
    'card-872': {
      text: '[Unique]\nEach time a Basic Attack Card inflicts a Hit, 1 Voracity\n+50% Damage Amount to Basic Attack Cards',
      effects: [cardBuff('basic', 'Damage Amount to Basic Attack Cards', '+50%', 'Basic Attack')],
    },

    // Domain of Voracity, I–V
    'card-873': { text: '{100%} Defense-Based Damage to all enemies\nIncrease Tenacity Damage taken of the target by 100% until their next Ravage' },
    'card-874': {
      text: '{100%} Defense-Based Damage to all enemies\nIncrease Tenacity Damage taken of the target by 100% until their next Ravage, '
        + 'and on Ravage, 3 Voracity',
    },
    'card-875': {
      text: '{100%} Defense-Based Damage to all enemies\nFor 2 turn(s), +100% Defense-Based Damage taken by the target',
      effects: [cardBuff('taken', 'Defense-Based Damage taken by the target', '+100%', 'Defense-Based',
        { target: 'enemy', counter: 'Domain of Voracity II (on target)', maxStacks: 1 })],
    },
    'card-876': { text: '{150%} Defense-Based Damage to all enemies\nFor the next 5 Hits against a target, Heal 40%' },
    'card-877': { text: '[Retain]\n{320%} Defense-Based Damage to all enemies\nIf granted both Voracity and Predation, proc 1 more time' },
    'card-878': { text: '[Unique]\nEach time Mealtime is activated, Heal 200%' },

    // E1 Sleeping Memory: "Increase Mealtime's Predation by 2"
    'card-879': {
      text: '[Retain / Unique]\nIf Voracity is decreased, decrease Cost by 1 and +30% Heal Amount (max 10) until activated\n'
        + '{160%} Defense-Based Damage to all enemies\nHeal {100%}\n{E1:6|4} Predation',
    },
  },
  extraCards: [
    // E6 Liberated Memory (in game): "At the start of the turn, gain 4 Voracity and 2 Predation. At the end of the turn, 50%
    // Defense-Based Damage to random enemies and Heal 1% Health × Predation count decreased this turn" (Prydwen: no start-of-turn
    // gain; "for each Predation decreased" read as damage too). Damage from an effect, not a card: no Attack Card buffs and no
    // card upgrade (owner, 2026-10-28).
    {
      id: 'liberated-memory', base: 'Liberated Memory', name: 'Liberated Memory', category: 'Generated Card', cardType: 'Skill',
      cost: null, element: 'Instinct', tags: 'Ego effect', scaling: 'DEF', pct: 0.5, hits: 1, weaknessApplies: false, upgrade: null,
      egoLevel: 6,
      text: 'E6: At the start of the turn, gain 4 Voracity and 2 Predation\nAt the end of the turn, {50%} Defense-Based Damage to '
        + 'random enemies and Heal 1% Health × Predation count decreased this turn',
      notes: 'One play per turn',
    },
  ],
} satisfies CharacterAdditions
