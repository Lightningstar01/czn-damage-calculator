// Tressa: our additions to the Prydwen import (src/data/prydwen/tressa.json). Card keys are the import's ids.
// Damage % follows the "+" rule: 'by 20%' (no "+") = multiplicative, '+20%' = additive (owner, 2026-10-25).
// Agony (measured in game, owner 2026-11-01): each stack is its own hit, each can crit, and Enemy DEF and the DoT stat raise it; Vulnerable doesn't.
// One hit = 50% x Final ATK x 0.35 x (1 + Void) x (1 + DoT) x Enemy DEF (docs/characters/tressa.md).
// Ticks are plays with the count typed in, and the owner adds and halves the count by hand (it rounds down), so nothing tracks stacks across plays.
import type { CharacterAdditions } from '../../engine/types'
import { cardBuff, EGO_POTENTIALS_PLUS_3, effectHits } from '../helpers'

const AGONY = 'Agony on target'
const AGONY_3 = 'Target has 3+ Agony'
const MAX_AGONY = 20
const DAGGER = 'card-273'
const ADVANCED = 'card-274'
const TICK = 'agony'

/** "If the target is in an Agony state": on from 1 Agony. */
const inAgony = (value: string, appliesTo: string) => cardBuff('agony', 'Damage Amount if the target is in an Agony state', value, appliesTo, { counter: AGONY, maxStacks: 1, onTarget: true })
/** "for each Agony on the target". */
const perAgony = (value: string, appliesTo: string) => cardBuff('per-agony', 'Damage Amount for each Agony on the target', value, appliesTo, { counter: AGONY, maxStacks: MAX_AGONY, onTarget: true })

const AGONY_TEXT = 'At the end of the turn, {F50%} Fixed DoT × Agony count\nOn effect activation, decrease Agony stacks by half (max 20 stacks)'

export default {
  verified: { date: '2026-11-01', gameVersion: '841' },
  notes: 'Card upgrades are set on the Setup tab. Agony: add an Agony play at each end of turn and set its Agony on target (one hit per stack); Cursed Gouge is a tick too. '
    + 'Add and halve the count yourself, rounding down. Per play (Cards tab): Agony on target (the Vital Attack bonuses, Advanced Shadow Dagger, E2), Target has 3+ Agony '
    + '(Vital Attack IV). Shadow Reload I: set Hits to 1 + the Shadow Daggers it exhausts. Not counted: Agony a card applies (add it to the count yourself), Heals, '
    + 'cost changes (E1), E6\'s created Shadow Dagger',
  // 'Target has 3+ Agony' is read only by Vital Attack IV's added hit
  playStacks: { [AGONY_3]: 0 },
  // Potential nodes in the game's wording (owner's screenshots, 2026-11-01)
  potentials: {
    '3-1': { text: 'The Dagger Throw card gains the effect 2 Agony.' },
    '5-1': { text: "+5% Damage Amount to Tressa's Dagger Throw\nIf Tressa's Damage over Time is 15% or higher, add an additional +5% to the modifier" },
    '7': { text: "+4% Void Attribute Damage Amount\nIf Tressa's Damage over Time is 30% or higher, add an additional +4% to the modifier" },
  },
  // Manifest Ego in the game's wording (owner's screenshots, 2026-11-01)
  ego: {
    1: { text: 'Decrease the cost of Cursed Gouge cards by 1.' },
    2: { text: '+20% Damage Amount to the Shadow Dagger card when activated against targets in a Agony state.' },
    3: { text: EGO_POTENTIALS_PLUS_3 },
    4: { text: 'The Wave of Darkness card increases Agony by 2.' },
    5: { text: EGO_POTENTIALS_PLUS_3 },
    6: { text: 'When defeating an enemy with Agony, create Shadow Dagger card × 1.' },
  },
  effects: [
    // 5-1 (in game): "+5% Damage Amount to Tressa's Dagger Throw. If Tressa's Damage over Time is 15% or higher, add an additional +5% to the
    // modifier": raises the card %, like Selena's 5-1 (locked for the owner: Dagger Throw 122% = 100% x 1.22)
    { kind: 'Buff', id: 'p5-1-throw', node: '5-1', name: 'Basic Card Proficiency', category: 'Potential', type: 'Card +', value: '+5%',
      appliesTo: 'Dagger Throw', hitScope: 'All hits', condition: 'Always', thresholdStat: 'Damage over Time',
      thresholdBonus: { above: 0.15, value: '+5%', orEqual: true } },
    // 7 (in game): "+4% Void Attribute Damage Amount. If Tressa's Damage over Time is 30% or higher, add an additional +4%": as Selena's 7, so a
    // Fixed tick doesn't get it (locked for the owner; in-game test tressa-readings)
    { kind: 'Buff', id: 'p7-void', node: '7', name: 'Unique Stat Upgrade', category: 'Potential', value: '+4%', appliesTo: 'Void',
      hitScope: 'All hits', condition: 'Always', thresholdStat: 'Damage over Time', thresholdBonus: { above: 0.3, value: '+4%', orEqual: true } },
    // E2 Awakening Memory (in game): "+20% Damage Amount to the Shadow Dagger card when activated against targets in a Agony state".
    // The card's name only: Advanced Shadow Dagger is an in-game test (tressa-readings)
    { kind: 'Buff', id: 'e2-dagger', name: 'E2 Awakening Memory', category: 'Ego Manifestation', value: '+20%', appliesTo: 'Shadow Dagger',
      hitScope: 'All hits', condition: 'Always', counter: AGONY, maxStacks: 1, onTarget: true, egoLevel: 2 },
  ],
  // Card text: the in-game wording (owner's screenshots, 2026-11-01), with tokens for the build's numbers (engine/cardText.ts)
  cards: {
    // Ego skill: E4 "increases Agony by 2" (in game 4 × 2 at E6; Prydwen lacks the line)
    'card-245': { creates: [DAGGER, TICK], text: 'Create 2 Shadow Dagger\n{E4:4|2} Agony × 2' },
    'card-246': { text: '{100%} Damage{P3-1:\n2 Agony|}' },
    'card-247': { text: 'Heal {100%}' },

    // Unsheathe Dagger, I–V
    'card-248': { creates: [DAGGER], text: 'Create 2 Shadow Dagger' },
    'card-249': { creates: [DAGGER], text: 'Create 2 Shadow Dagger' },
    'card-250': { creates: [DAGGER], text: 'Create 3 Shadow Dagger' },
    'card-251': { creates: [DAGGER], text: 'Create 1 Shadow Dagger\nAt the start of the turn, create 1 Shadow Dagger' },
    'card-252': { creates: [DAGGER], text: 'Create 2 Shadow Dagger\nIncrease the Agony effect of the created Shadow Dagger by 2' },
    'card-253': { creates: [DAGGER], text: '[Exhaust]\nCreate 4 Shadow Dagger' },

    // Curse, I–V
    'card-254': { text: 'For 1 turn, when an Attack Card is activated, 1 Agony to the target' },
    'card-255': { text: 'For 1 turn, when a card is activated, 1 Agony to a random enemy' },
    'card-256': { text: 'For 2 turns, when an Attack Card is activated, 1 Agony to the target' },
    'card-257': { text: '[Lead]\n4 Agony × 2 on random enemies' },
    'card-258': { text: '[Initiation]\n2 Agony on all enemies\nAt the start of turn, 2 Agony on all enemies' },
    'card-259': { text: 'When Agony is applied through a card, add 1 Agony on the target' },

    // Shadow Reload, I–V (II: Prydwen says Heal 10%; in game 168% = 150% x 1.12)
    'card-260': { creates: [ADVANCED], text: 'Heal {100%}\nCreate 1 Advanced Shadow Dagger' },
    'card-261': {
      text: '[Retain]\n{80%} Damage to all enemies\n2 Agony\nExhaust all Shadow Dagger in hand, then repeat for each Exhausted',
      notes: 'Set Hits to 1 + the Shadow Daggers it exhausts',
    },
    'card-262': { creates: [ADVANCED], text: 'Heal {150%}\nCreate 1 Advanced Shadow Dagger' },
    'card-263': { creates: [DAGGER, ADVANCED], text: '{100%} Heal × X\nCreate X cards, each randomly created to be either Shadow Dagger or Advanced Shadow Dagger' },
    'card-264': { creates: [ADVANCED], text: 'Exhaust all Shadow Dagger, then create Advanced Shadow Dagger for each Exhausted' },
    'card-265': { creates: [DAGGER], text: '[Exhaust 2]\nDiscard all cards\nCreate Shadow Dagger for each Discarded' },

    // Vital Attack, I–V
    'card-266': { text: '{80%} Damage × 3\nIf the target is in an Agony state, +50% Damage Amount', effects: [inAgony('+50%', 'Vital Attack')] },
    'card-267': { text: '[Lead]\n{150%} Damage × 3' },
    'card-268': { text: '{120%} Damage × 3\nIf the target is in an Agony state, +70% Damage Amount', effects: [inAgony('+70%', 'Vital Attack II')] },
    'card-269': { text: '{80%} Damage × 3\n2~6 Agony' },
    'card-270': {
      text: '{200%} Damage × 2\nWhen the target has 3 or more Agony, proc 1 more time',
      counterHits: { counter: AGONY_3, hits: 1 },
    },
    'card-271': { text: '{150%} Damage × 3\n+10% Damage Amount for each Agony on the target', effects: [perAgony('+10%', 'Vital Attack V')] },

    // Cursed Gouge: one Agony tick (measured: 53 x 8, the same as the end of turn). The upgrade doesn't raise Agony's 50%, shown orange and whole at Unique 6
    'card-272': {
      scaling: 'Fixed', kind: 'DoT', pct: 0.5, hits: 1, upgrade: null, perCount: AGONY, maxCount: MAX_AGONY, countsHits: true,
      text: 'Activate Agony inflicted by this unit on the target', notes: 'Set the Agony on target: the count before it halves',
    },

    'card-273': { text: '[Exhaust]\n{80%} Damage\n2 Agony' },
    'card-274': {
      text: '[Retain / Exhaust]\n4 Agony\n{50%} Damage\n+10% Damage Amount for each Agony on the target',
      effects: [perAgony('+10%', 'Advanced Shadow Dagger')],
      notes: 'Set the Agony on target with its own 4 added (1 before it = 5; Unconfirmed, in-game test tressa-readings)',
    },
  },
  extraCards: [
    // The Agony keyword (in game): comes with the Ego skill, so it's always in the deck
    effectHits({ element: 'Void', scaling: 'Fixed', kind: 'DoT', tags: 'Agony' })(TICK, 'Agony', 0.5, AGONY_TEXT, {
      perCount: AGONY, maxCount: MAX_AGONY, countsHits: true, image: 'cards/tressa/unique_1009_02.webp', notes: 'One play per tick: set the Agony on target, the count before it halves',
    }),
  ],
} satisfies CharacterAdditions
