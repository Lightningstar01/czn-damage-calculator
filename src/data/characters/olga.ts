// Olga: our additions to the Prydwen import (src/data/prydwen/olga.json). Card keys are the import's ids.
// Damage % follows the "+" rule: 'by 20%' (no "+") = multiplicative, '+20%' = additive (owner, 2026-10-25).
// Reviewed from the in-game preview (owner, 2026-11-09): the owner doesn't have Olga yet, so every node is 0 / locked and she's E0;
// no stats screen. Prydwen's card numbers all match at level 0.
// Fracture (keyword): one hit of 40% x the stacks, normal ATK damage, as Arabella's; Agony: a Fixed DoT, one hit per stack, as Tressa's
// (docs/FORMULA.md, Crit and Fixed). Each activation is a tick play with the stacks typed in; the owner adds and halves the count (owner, 2026-11-09).
// Rapacity ("Also treat Damage dealt by this card as DoT"): End of the Line and Reckoning are Attack cards and DoT, so the DoT stat and DoT buffs
// raise them too (owner, 2026-11-09). Maelstrom of Oblivion's per-activation bonuses: three counters, capped together at 300% (450% from E3;
// sharedCap). E4/E6 Shard Erosion "by 6%" is multiplicative on her DoT, Agony ticks included (fixedDot; Unconfirmed); Insatiable Cravings V
// "by 1%" is multiplicative on all her damage but not Agony, as other damage buffs (owner, 2026-11-09).
import type { CharacterAdditions } from '../../engine/types'
import { cardBuff, effectHits, EGO_POTENTIALS_PLUS_3 } from '../helpers'

const FRACTURE = 'fracture'
const AGONY = 'agony'
const RECKONING = 'card-1351'
const FRACTURE_COUNT = 'Fracture on target'
const AGONY_COUNT = 'Agony on target'
const RAPACITY = 'Rapacity'
const SHARD = 'Shard Erosion'
const SHARD_5 = 'Shard Erosion at 5 stacks'
const HARMFUL = 'Harmful effects applied this turn'
const MAELSTROM = 'Maelstrom of Oblivion'

const FRACTURE_TEXT = 'At the end of the turn, {40%} DoT for each Fracture\nOn effect activation, decrease Fracture stacks by half (max 30 stacks)'
const AGONY_TEXT = 'At the end of the turn, {F50%} Fixed DoT × Agony count\nOn effect activation, decrease Agony stacks by half (max 20 stacks)'

/** Maelstrom of Oblivion: "+X% base Damage Amount" for each one activated this turn; the three share a cap (300%, 450% from E3). */
const activated = (what: string, value: string, maxStacks: number) => [
  cardBuff(`per-${what.toLowerCase()}`, `base Damage Amount for each ${what} activated this turn`, value, MAELSTROM,
    { type: 'Base %', counter: `${what} activated this turn`, maxStacks, sharedCap: { group: MAELSTROM, max: 3 }, egoBelow: 3 }),
  cardBuff(`per-${what.toLowerCase()}-e3`, `base Damage Amount for each ${what} activated this turn`, value, MAELSTROM,
    { type: 'Base %', counter: `${what} activated this turn`, maxStacks, sharedCap: { group: MAELSTROM, max: 4.5 }, egoLevel: 3 }),
]

export default {
  verified: { date: '2026-11-09', gameVersion: '841' },
  notes: 'Card upgrades are set on the Setup tab. Fracture and Agony are always in the deck: add one play per activation (end of turn, and each card that '
    + 'activates them; "2 times" = 2 plays) and set its Fracture / Agony on target, the count before it halves. Add and halve the counts yourself. '
    + 'Per play (Cards tab): Fracture / Agony / Scorched activated this turn (Maelstrom of Oblivion), Rapacity (Reckoning), Shard Erosion and Shard Erosion '
    + 'at 5 stacks (E4 / E6), Harmful effects applied this turn (Insatiable Cravings V). Not counted: Fracture and Agony a card inflicts (add them to the count), '
    + 'Shattering\'s Fixed damage (30% / 40% of damage taken), Scorched, Brands, Heals, End of the Line\'s E1 cost, other enemies (all-enemy damage counts one target)',
  // Counters only one effect reads
  playStacks: { [SHARD_5]: 0, [HARMFUL]: 0 },
  // Potential nodes in the game's wording (owner's screenshots, 2026-11-09)
  potentials: {
    '3-1': { text: 'Adds the following to the Reaping Slash card: 1 Fracture, 1 Agony' },
    '5-1': { text: "+5% Damage Amount to Olga's Reaping Slash card\nIf Olga's Damage over Time (stat) is 6% or higher, add an additional +5% to the modifier" },
    '7': { text: "+7% Instinct Attribute Damage Amount\nIf Olga's Damage over Time (stat) is 6% or higher, add an additional +8% to the modifier" },
  },
  // Manifest Ego in the game's wording (owner's screenshots, 2026-11-09)
  ego: {
    1: { text: 'For End of the Line, decrease Cost by 1\nFor Reckoning, +200% Damage Amount and increase the base Damage Amount for each Rapacity effect from +20% to +30%.' },
    2: { text: "When Shattering's DoT effect is activated, increase the Fixed Damage effect from 30% of Damage taken to 40%.\nWhen Fracture or Agony is activated, Recover 4% of max Health (5 times per turn)." },
    3: { text: '+200% Damage Amount to Maelstrom of Oblivion and change the max Damage Amount threshold for each Fracture, Agony, and Scorched activated this turn from 300% to 450%.' },
    4: { text: "When Olga's Fracture or Agony is activated, gain 1 Shard Erosion.\nShard Erosion: Increase Damage Amount of Olga's DoT effects by 6% (max 5 stacks)" },
    5: { text: EGO_POTENTIALS_PLUS_3 },
    6: { text: "At the start of the turn, move the End of the Line or Reckoning card to hand.\nChange the Damage Amount increase of Shard Erosion from 6% to 10%, and when Shard Erosion reaches 5 stacks, +50% to Olga's Critical Damage." },
  },
  effects: [
    // 5-1 (in game): "+5% Damage Amount to Olga's Reaping Slash card. If Olga's Damage over Time (stat) is 6% or higher, add an additional +5%":
    // part of the card's %, like Tressa's 5-1 (locked for the owner)
    { kind: 'Buff', id: 'p5-1-slash', node: '5-1', name: 'Basic Card Proficiency', category: 'Potential', type: 'Card +', value: '+5%',
      appliesTo: 'Reaping Slash', hitScope: 'All hits', condition: 'Always', thresholdStat: 'Damage over Time',
      thresholdBonus: { above: 0.06, value: '+5%', orEqual: true } },
    // 7 (in game): "+7% Instinct Attribute Damage Amount ...": on the stats screen (Instinct Damage), as every character's node 7, so nothing is added
    // E1 Sleeping Memory: "For Reckoning, +200% Damage Amount": part of the card's %, by the owner's rule for Ego "+X%" (Chizuru's E1; Unconfirmed here)
    { kind: 'Buff', id: 'e1-reckoning', name: 'E1 Sleeping Memory', category: 'Ego Manifestation', type: 'Card +', value: '+200%', appliesTo: 'Reckoning',
      hitScope: 'All hits', condition: 'Always', egoLevel: 1 },
    // E3 Vivid Memory: "+200% Damage Amount to Maelstrom of Oblivion": added to the Ego skill's 400% (Base %), as Chizuru's E3
    { kind: 'Buff', id: 'e3-ego-skill', name: 'E3 Vivid Memory', category: 'Ego Manifestation', type: 'Base %', value: '+200%', appliesTo: MAELSTROM,
      hitScope: 'All hits', condition: 'Always', egoLevel: 3 },
    // E4 / E6 Shard Erosion: "Increase Damage Amount of Olga's DoT effects by 6% (max 5 stacks)", 10% from E6: multiplicative per stack, on her
    // Fracture and Agony ticks and the Rapacity cards (owner, 2026-11-09; the Agony part Unconfirmed, in-game test olga-readings)
    { kind: 'Buff', id: 'e4-shard', name: 'Shard Erosion', category: 'Ego Manifestation', value: '6%', appliesTo: 'DoT', hitScope: 'All hits',
      condition: 'Always', counter: SHARD, maxStacks: 5, fixedDot: true, egoLevel: 4, egoBelow: 6 },
    { kind: 'Buff', id: 'e6-shard', name: 'Shard Erosion', category: 'Ego Manifestation', value: '10%', appliesTo: 'DoT', hitScope: 'All hits',
      condition: 'Always', counter: SHARD, maxStacks: 5, fixedDot: true, egoLevel: 6 },
    // E6: "when Shard Erosion reaches 5 stacks, +50% to Olga's Critical Damage": on all her hits while set on the play
    { kind: 'Buff', id: 'e6-crit', name: 'E6 Liberated Memory: Shard Erosion at 5 stacks', category: 'Ego Manifestation', type: 'Crit DMG', value: '+50%',
      appliesTo: 'ALL', hitScope: 'All hits', condition: 'Always', counter: SHARD_5, maxStacks: 1, egoLevel: 6 },
  ],
  // Card text: the in-game wording (owner's screenshots, 2026-11-09), with tokens for the build's numbers (engine/cardText.ts)
  cards: {
    // Ego skill: Fracture and Agony come with it, so their tick plays are always in the deck
    'card-1323': {
      creates: [FRACTURE, AGONY],
      text: '{E3:600%|400%} Damage to all enemies\nFor each Fracture, Agony, and Scorched activated this turn, +50%, +20%, and +30% base Damage Amount, respectively (max {E3:450|300}%)',
      effects: [...activated('Fracture', '+50%', 9), ...activated('Agony', '+20%', 22), ...activated('Scorched', '+30%', 15)],
      notes: 'Set the Fracture, Agony and Scorched activated this turn; together they stop at +300% (+450% from E3)',
    },
    'card-1324': { text: '{100%} Damage{P3-1:\n1 Fracture, 1 Agony|}' },
    'card-1325': { text: 'Heal {100%}' },

    // Rift of Severance, I–V
    'card-1326': { text: '{80%} Damage and 2 Fracture, then activate Fracture inflicted by this unit' },
    'card-1327': { text: '{140%} Damage and 3 Fracture, then activate Fracture inflicted by this unit' },
    'card-1328': { text: '{80%} Damage and 2 Fracture, then activate Fracture inflicted by allies' },
    'card-1329': { text: '{80%} Damage and 2 Fracture, then activate Fracture inflicted by this unit 2 times' },
    'card-1330': { text: '{100%} Damage and 1 Fracture\n1 Fracture for each type of harmful effect the target has (max 3)\nActivate Fracture inflicted by this unit' },
    'card-1331': { text: '{100%} Damage and 2 Fracture, then activate Fracture inflicted by this unit\nAt the end of the turn, 1 additional Fracture (max 3)' },

    // Dispersed Desire, I–V
    'card-1332': { text: '{80%} Damage and 4 Agony, then activate Agony inflicted by this unit' },
    'card-1333': { text: '{140%} Damage and 6 Agony, then activate Agony inflicted by this unit' },
    'card-1334': { text: '{80%} Damage and 5 Agony, then activate Agony inflicted by allies' },
    'card-1335': { text: '{80%} Damage and 5 Agony, then activate Agony inflicted by this unit 2 times' },
    'card-1336': { text: '{80%} Damage, 4 Agony, and 3 Scorched, then activate Agony inflicted by this unit and activate Scorched inflicted by allies' },
    'card-1337': { text: '{100%} Damage and 4 Agony, then activate Agony inflicted by this unit\nAt the end of the turn, 1 additional Agony (max 4)' },

    // Break Apart & Renew, I–V
    'card-1338': { text: '1 Brand of Agony\n4 Agony to the enemy with the highest HP' },
    'card-1339': { text: '1 Brand of Agony\n4 Agony to the enemy with the highest HP' },
    'card-1340': { text: '1 Brand of Fracture\n2 Fracture to the enemy with the highest HP' },
    'card-1341': { text: '[Exhaust]\n2 Brand of Fracture\n2 Brand of Agony\n3 Fracture and 6 Agony to the enemy with the highest HP' },
    'card-1342': { text: '[Unique]\nMove 1 Rift of Severance to hand and apply Retrieve' },
    'card-1343': { text: '[Unique / Initiation / Lead]\n2 Brand of Fracture\n2 Brand of Agony\nAt the start of the turn, 1 Brand of Fracture or 1 Brand of Agony' },

    // Insatiable Cravings, I–V
    'card-1344': { text: '[Unique]\nWhen Fracture or Agony is activated through a Targeting Card, 2 Fracture and 3 Agony to the target (3 time(s) per turn)' },
    'card-1345': { text: '[Unique / Initiation]\nWhen Fracture or Agony is activated through a Targeting Card, 2 Fracture and 3 Agony to the target (3 time(s) per turn)' },
    'card-1346': { text: '[Unique]\nWhen Fracture or Agony is activated through a Targeting Card, 2 Fracture and 3 Agony to the target (4 time(s) per turn)' },
    'card-1347': { text: '[Unique]\nWhen Fracture or Agony is applied through a Targeting Card, 1 Fracture and 2 Agony to the target (7 time(s) per turn)' },
    'card-1348': { text: '[Unique]\nAt the start of the turn, 3 Scorched to all enemies\nAt the end of the turn, remove Scorched from all enemies, then apply Fracture for each Scorched removed to the enemy with the highest HP (max 7)' },
    // "increase Damage Amount by 1% for 1 turn (max 30%)": multiplicative, all her damage but Agony (owner, 2026-11-09)
    'card-1349': {
      text: '[Unique]\nWhen a harmful effect is applied through an ability, increase Damage Amount by 1% for 1 turn (max 30%)',
      effects: [cardBuff('harmful', 'Damage Amount for each harmful effect applied this turn', '1%', 'ALL', { counter: HARMFUL, maxStacks: 30 })],
    },

    // Rapacity cards: Attack and DoT (owner, 2026-11-09). End of the Line changes into Reckoning and back
    'card-1350': {
      kind: 'DoT', creates: [RECKONING],
      text: '[Unique / Rapacity]\n2 Shattering, {200%} Damage, 2 Fracture, and 4 Agony\nWhen this card is activated, change into Reckoning',
    },
    'card-1351': {
      kind: 'DoT',
      text: '[Unique / Rapacity]\n{400%} Damage\n+{E1:30|20}% base Damage Amount for each Rapacity\nActivate Agony and Fracture inflicted by this unit\nWhen this card is activated, change into End of the Line',
      effects: [
        cardBuff('per-rapacity', 'base Damage Amount for each Rapacity', '+20%', 'Reckoning', { type: 'Base %', counter: RAPACITY, maxStacks: 30, egoBelow: 1 }),
        cardBuff('per-rapacity-e1', 'base Damage Amount for each Rapacity', '+30%', 'Reckoning', { type: 'Base %', counter: RAPACITY, maxStacks: 30, egoLevel: 1 }),
      ],
      notes: 'Set the Rapacity: Fracture or Agony applied through an ability since the last Reckoning (max 30)',
    },
  },
  extraCards: [
    // The Fracture keyword (in game): one hit of 40% x the stacks per activation, normal ATK damage, unraised by card upgrades
    effectHits({ element: 'Instinct', kind: 'DoT' })(FRACTURE, 'Fracture', 0.4, FRACTURE_TEXT, {
      tags: 'Fracture', perCount: FRACTURE_COUNT, maxCount: 30, image: 'cards/olga/unique_30117_01.webp',
      notes: 'One play per activation: set the Fracture on target, the count before it halves',
    }),
    // The Agony keyword (in game): a Fixed DoT, one hit per stack, as Tressa's (measured on hers)
    effectHits({ element: 'Instinct', scaling: 'Fixed', kind: 'DoT', tags: 'Agony' })(AGONY, 'Agony', 0.5, AGONY_TEXT, {
      perCount: AGONY_COUNT, maxCount: 20, countsHits: true, image: 'cards/olga/unique_30117_02.webp',
      notes: 'One play per activation: set the Agony on target, the count before it halves',
    }),
  ],
} satisfies CharacterAdditions
