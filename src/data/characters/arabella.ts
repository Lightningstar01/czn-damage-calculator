// Arabella: our additions to the Prydwen import (src/data/prydwen/arabella.json). Card keys are the import's ids.
// Damage % follows the "+" rule: 'by 20%' (no "+") = multiplicative, '+20%' = additive (owner, 2026-10-25).
// Fracture (keyword, in game): "At the end of the turn, 40% DoT for each Fracture. On effect activation, decrease Fracture stacks by half
// (max 30 stacks)": one hit of 40% x the stacks, normal ATK damage (not Fixed), so card buffs, Vulnerable and the DoT stat raise it,
// unraised by card upgrades (owner, 2026-11-09; Unconfirmed, in-game test fracture-tick).
// Each activation is a Fracture play with the stacks typed in (end of turn, Hollow Verdict, Sadistic Restraint's "2 times" = 2 plays);
// the owner adds and halves the count, so nothing tracks stacks across plays (owner, 2026-11-09).
// "+X% Damage Amount to this unit" (Observer's Pleasure) reaches her Fracture too; "Attack Cards of this unit" doesn't (owner, 2026-11-09).
// The Art of Unmaking's "Fracture Amplification: 2x base Damage Amount" doubles the card's % (owner, 2026-11-09).
import type { CharacterAdditions } from '../../engine/types'
import { cardBuff, effectHits, EGO_POTENTIALS_PLUS_3 } from '../helpers'

const FRACTURE = 'fracture'
const FRACTURE_COUNT = 'Fracture on target'
const AMPLIFIED = 'Fracture Amplification on target'
const HARMFUL = 'Harmful effect types on target'
const ART = 'The Art of Unmaking'

/** A 'for 1 turn' bonus: a switch on each play of that turn, named after the card. */
const forOneTurn = (id: string, name: string, value: string, appliesTo: string, card: string) =>
  cardBuff(id, name, value, appliesTo, { counter: card, maxStacks: 1 })

/** "Increase Damage Amount of Attack Cards of this unit by 50% for 1 turn" (Scream For Me II, Observer's Pleasure III). */
const attackCards50 = (card: string) => [forOneTurn('attack-cards', 'Damage Amount of Attack Cards of this unit for 1 turn', '50%', 'Attack', card)]

const FRACTURE_TEXT = 'At the end of the turn, {40%} DoT for each Fracture\nOn effect activation, decrease Fracture stacks by half (max 30 stacks)'

export default {
  verified: { date: '2026-11-09', gameVersion: '841' },
  notes: 'Card upgrades are set on the Setup tab. Fracture is always in the deck: add one play per activation (end of turn, and each card that '
    + 'activates it; "2 times" = 2 plays) and set its Fracture on target, the count before it halves. Add and halve the count yourself. '
    + 'Per play (Cards tab): Fracture Amplification on target (Fracture +20%, The Art of Unmaking 2x), Harmful effect types on target (The Art of '
    + 'Unmaking), Observer\'s Pleasure / I (enemies present), II (harmful effect types), III and IV, Scream For Me II on the plays of that turn, '
    + 'Deconstruction Analysis (E4), Vulnerable where a card inflicts it. Set the Hits on Sadistic Restraint / I (1 + harmful effect types, '
    + 'up to 3 more), IV (5 with Efficiency) and V (1 + Fractures activated this turn, up to 5 more). Not counted: Fracture a card inflicts '
    + '(add it to the count), Fracture Amplification\'s added Fracture, Pathetic End\'s Fixed damage, Hollow Verdict V\'s moved Fracture, Shields, '
    + 'draws, Agony and Scorched, other enemies (all-enemy damage counts one target)',
  // Potential nodes in the game's wording (owner's screenshots, 2026-11-09)
  potentials: {
    '3-1': { text: 'Adds the following effect to the Diagonal Slash card: 1 Fracture' },
    '5-1': { text: "+5% Damage Amount to Arabella's Diagonal Slash card\nIf Arabella's Attack is 500 or higher, add an additional +5% to the modifier" },
    '7': { text: "If Arabella's Attack is 600 or higher, +5% Instinct Attribute Damage Amount, and for every 20 Attack exceeding 600, add an additional +2% to the modifier (additional +10% max)" },
  },
  // Manifest Ego in the game's wording (owner's screenshots, 2026-11-09)
  ego: {
    1: { text: '+50% Damage Amount to The Art of Unmaking and change the increase Damage Amount by 15% for each type of harmful effect the target has (max 120%) effect to increase Damage Amount by 20% (max 180%).' },
    2: { text: "At the start of battle, inflict 1 Fracture Amplification on the enemy with the highest Health.\nWhen Arabella's abilities activates the Fractures that she inflicted, she inflicts 3 Fracture on all enemies (4 times per turn)." },
    3: { text: "Change the following effects for Pathetic End: +200% Damage Amount, change the Fixed Damage equal to 30% Damage Amount taken by all enemies to 50%, and increase the per-turn limit from 1000% of Arabella's Attack to 1500%." },
    4: { text: "Each time Arabella inflicts or activates her Fracture through an ability, gain 1 Deconstruction Analysis.\nDeconstruction Analysis: Increase Damage Amount of Arabella's Fracture by 5% (max 6 stacks)" },
    5: { text: EGO_POTENTIALS_PLUS_3 },
    6: { text: "When Arabella's abilities activates Fractures that she inflicted, additionally inflict 1 Fracture on the target inflicted with Fracture Amplification.\nIncrease the max stack limit of Deconstruction Analysis by 4, and +50% Critical Damage to the Fractures that Arabella inflicts on the Fracture Amplification target." },
  },
  effects: [
    // Fracture Amplification (keyword, in game): "When Fracture inflicted by allies is activated, 1 Fracture to the target, and if there is only
    // one enemy, 2 Fracture. Increase Damage Amount of Fracture inflicted by Arabella by 20%. When applied to a different target, remove
    // Fracture Amplification (cannot stack)": "by 20%" = multiplicative, on the Fracture plays where it's set. The added Fracture isn't counted.
    { kind: 'Buff', id: 'amplification', name: 'Fracture Amplification', category: 'Character', value: '20%', appliesTo: 'Fracture',
      hitScope: 'All hits', condition: 'Always', counter: AMPLIFIED, maxStacks: 1, onTarget: true },
    // 5-1 (in game): "+5% Damage Amount to Arabella's Diagonal Slash card. If Arabella's Attack is 500 or higher, add an additional +5% to the
    // modifier": part of the card's % (Card +), as Chizuru's 5-1 (locked for the owner)
    { kind: 'Buff', id: 'p5-1-slash', node: '5-1', name: 'Basic Card Proficiency', category: 'Potential', type: 'Card +', value: '+5%',
      appliesTo: 'Diagonal Slash', hitScope: 'All hits', condition: 'Always', thresholdBonus: { above: 500, value: '+5%', orEqual: true } },
    // 7 (in game): "+5% Instinct Attribute Damage Amount, +2% per 20 Attack over 600 (+10% max)": on the stats screen (Instinct Damage
    // 15.0% (+16.0%) at 870 Attack), as every character's attribute node 7 is, so nothing is added on top (owner, 2026-11-08)
    // E1 Sleeping Memory (in game): "+50% Damage Amount to The Art of Unmaking": part of the card's % (Card +), by the owner's rule for Ego "+X%"
    // (Chizuru's E1, measured); the 20% per harmful effect type is on the card
    { kind: 'Buff', id: 'e1-art', name: 'E1 Sleeping Memory', category: 'Ego Manifestation', type: 'Card +', value: '+50%', appliesTo: ART,
      hitScope: 'All hits', condition: 'Always', egoLevel: 1 },
    // E3 Vivid Memory (in game): "+200% Damage Amount" to Pathetic End: added to the Ego skill's % (Base %), as Chizuru's E3. Its Fixed damage isn't counted
    { kind: 'Buff', id: 'e3-ego-skill', name: 'E3 Vivid Memory', category: 'Ego Manifestation', type: 'Base %', value: '+200%',
      appliesTo: 'Pathetic End', hitScope: 'All hits', condition: 'Always', egoLevel: 3 },
    // E4 Inner Memory (in game): "Deconstruction Analysis: Increase Damage Amount of Arabella's Fracture by 5% (max 6 stacks)"; E6 raises the max by 4
    { kind: 'Buff', id: 'e4-analysis', name: 'Deconstruction Analysis', category: 'Ego Manifestation', value: '5%', appliesTo: 'Fracture',
      hitScope: 'All hits', condition: 'Always', counter: 'Deconstruction Analysis', maxStacks: 6, egoLevel: 4, egoBelow: 6 },
    { kind: 'Buff', id: 'e6-analysis', name: 'Deconstruction Analysis', category: 'Ego Manifestation', value: '5%', appliesTo: 'Fracture',
      hitScope: 'All hits', condition: 'Always', counter: 'Deconstruction Analysis', maxStacks: 10, egoLevel: 6 },
    // E6 Liberated Memory (in game): "+50% Critical Damage to the Fractures that Arabella inflicts on the Fracture Amplification target"
    { kind: 'Buff', id: 'e6-crit', name: 'E6 Liberated Memory: Critical Damage to Fracture', category: 'Ego Manifestation', type: 'Crit DMG',
      value: '+50%', appliesTo: 'Fracture', hitScope: 'All hits', condition: 'Always', counter: AMPLIFIED, maxStacks: 1, onTarget: true, egoLevel: 6 },
  ],
  // Card text: the in-game wording (owner's screenshots, 2026-11-09), with tokens for the build's numbers (engine/cardText.ts)
  cards: {
    // Ego skill: Fracture comes with it, so the Fracture play is always in the deck. The Fixed damage (30% / 50% of damage taken) isn't counted
    'card-1295': {
      creates: [FRACTURE],
      text: "{E3:800%|600%} Damage\nFor 2 turn(s), inflict Fixed Damage to the target equal to {E3:50|30}% of Damage Amount taken by all enemies\n(cannot exceed {E3:1500|1000}% of Arabella's Attack per turn)",
    },
    'card-1296': { text: '{60%} Damage to all enemies{P3-1:\n1 Fracture|}' },
    'card-1297': { text: '{100%} Shield' },

    // Scream For Me, I–V
    'card-1298': { text: '[Lead]\n{40%} Damage and 2 Fracture to all enemies\n4 Fracture to the enemy with the highest HP' },
    'card-1299': { text: '[Lead]\n{60%} Damage and 3 Fracture to all enemies\n6 Fracture to the enemy with the highest HP' },
    'card-1300': {
      text: '[Lead]\n{60%} Damage and 3 Fracture to all enemies\nIncrease Damage Amount of Attack Cards of this unit by 50% for 1 turn',
      effects: attackCards50('Scream For Me II'),
    },
    'card-1301': { text: '[Lead]\n{60%} Damage and 2 Fracture to all enemies\n1 Fracture for each type of harmful effect the target has (max 5)' },
    'card-1302': { text: '[Lead]\n{60%} Damage and 3 Fracture to all enemies\nDraw 2 cards of this unit' },
    'card-1303': { text: '[Lead]\n{60%} Damage, 2 Fracture, 4 Agony, and 2 Scorched to all enemies' },

    // Observer's Pleasure, I–V: "+X% Damage Amount to this unit for 1 turn" reaches all her damage, Fracture included (owner, 2026-11-09)
    'card-1304': {
      text: "[Unique]\n1 Fracture Amplification\nFor each enemy present, +20% Damage Amount to this unit for 1 turn",
      // the most enemies in a fight isn't known: 5 is the stepper's cap
      effects: [cardBuff('per-enemy', 'Damage Amount to this unit for each enemy present', '+20%', 'ALL', { counter: "Observer's Pleasure: enemies present", maxStacks: 5 })],
    },
    'card-1305': {
      text: "[Unique]\n1 Fracture Amplification\nFor each enemy present, +30% Damage Amount to this unit for 1 turn",
      effects: [cardBuff('per-enemy', 'Damage Amount to this unit for each enemy present', '+30%', 'ALL', { counter: "Observer's Pleasure I: enemies present", maxStacks: 5 })],
    },
    'card-1306': {
      text: "[Unique]\n1 Fracture Amplification\nFor each type of harmful effect the target has, +20% Damage Amount to this unit for 1 turn (max 120%)",
      effects: [cardBuff('per-harmful', 'Damage Amount to this unit for each type of harmful effect', '+20%', 'ALL', { counter: "Observer's Pleasure II: harmful effect types", maxStacks: 6 })],
    },
    'card-1307': {
      text: '[Unique / Lead]\n1 Fracture Amplification\n2 Fracture and 2 Vulnerable to all enemies\nIncrease Damage Amount of Attack Cards of this unit by 50% for 1 turn',
      effects: attackCards50("Observer's Pleasure III"),
    },
    'card-1308': {
      text: '[Unique]\n1 Fracture Amplification\nFor 1 turn, +80% Damage Amount to this unit, and when allies defeat an enemy during that turn, transfer Fracture of that target to a random enemy',
      effects: [forOneTurn('this-unit', 'Damage Amount to this unit for 1 turn', '+80%', 'ALL', "Observer's Pleasure IV")],
    },
    'card-1309': { text: '[Unique / Opener]\nAt the start of the turn, 1 Fracture Amplification and 6 Fracture to the enemy with the highest HP' },

    // Hollow Verdict, I–V: each activation is a Fracture play of its own
    'card-1310': { text: '{40%} Damage and 2 Fracture to all enemies, and activate Fracture inflicted by this unit' },
    'card-1311': { text: '[Unique]\n{60%} Damage and 3 Fracture to all enemies\nFracture Amplification: Activate Fracture inflicted by allies' },
    'card-1312': { text: '{60%} Damage and 3 Fracture to all enemies, and activate Fracture inflicted by this unit\nFracture Amplification: Activate Fracture inflicted by this unit' },
    'card-1313': { text: '[Lead]\n{360%} Damage and 2 Fracture to all enemies\nDefeat: Activate Fracture inflicted by this unit on all enemies (1 time per turn)' },
    'card-1314': { text: '{60%} Damage, 2 Fracture, and 4 Agony to all enemies\nFracture Amplification: Activate Agony inflicted by allies' },
    'card-1315': { text: '{100%} Damage to all enemies, and remove all Fracture inflicted by allies\nApply the amount of Fracture removed ×2 to the target inflicted with Fracture Amplification' },

    // Sadistic Restraint, I–V: added hits are set on the play
    'card-1316': {
      text: '{60%} Damage, and activate Fracture inflicted by this unit 2 times\nAdd 1 Hit for each type of harmful effect the target has (max 3 times)',
      notes: 'Set Hits to 1 + the harmful effect types (up to 4)',
    },
    'card-1317': {
      text: '[Unique]\n{100%} Damage\nAdd 1 Hit for each type of harmful effect the target has (max 3 times)\nFracture Amplification: Activate Fracture inflicted by allies',
      notes: 'Set Hits to 1 + the harmful effect types (up to 4)',
    },
    'card-1318': { text: '{60%} Damage × 4, and activate Fracture inflicted by this unit 2 times\nFracture Amplification: Draw 1 card of this unit' },
    'card-1319': { text: '{240%} Damage, and activate Fracture inflicted by this unit\nDefeat: Move this card to hand (2 times per turn)' },
    // Prydwen: "If Cost of this card is decreased, add 1 Hit"; in game "Efficiency: Add 1 Hit"
    'card-1320': {
      text: '[Lead]\n{40%} Damage × 4 to random enemies\n2 Fracture on each Hit\nEfficiency: Add 1 Hit',
      notes: 'Set Hits to 5 when Efficiency adds one',
    },
    'card-1321': {
      text: '{60%} Damage, and activate Fracture inflicted by this unit 2 times\nAdd 1 Hit for each Fracture inflicted by this unit that was activated this turn (max 5 times)',
      notes: 'Set Hits to 1 + the Fractures activated this turn (up to 6)',
    },

    // The Art of Unmaking: "Increase Damage Amount by 15% for each type of harmful effect the target has (max 120%)" (multiplicative; E1: 20%,
    // max 180%) and "Fracture Amplification: 2x base Damage Amount" (the card's % doubled, owner 2026-11-09)
    'card-1322': {
      text: '[Unique]\n{200%} Damage to all enemies\nIncrease Damage Amount by {E1:20|15}% for each type of harmful effect the target has (max {E1:180|120}%)\nFracture Amplification: 2x base Damage Amount',
      effects: [
        cardBuff('per-harmful', 'Damage Amount for each type of harmful effect the target has', '15%', ART, { counter: HARMFUL, maxStacks: 8, onTarget: true, egoBelow: 1 }),
        cardBuff('per-harmful-e1', 'Damage Amount for each type of harmful effect the target has', '20%', ART, { counter: HARMFUL, maxStacks: 9, onTarget: true, egoLevel: 1 }),
        cardBuff('amplified', 'Fracture Amplification: 2x base Damage Amount', '+100%', ART, { type: 'Card %', counter: AMPLIFIED, maxStacks: 1, onTarget: true }),
      ],
    },
  },
  extraCards: [
    // The Fracture keyword (in game): one hit of 40% x the stacks per activation, normal ATK damage, unraised by card upgrades (40% at Signature 9)
    effectHits({ element: 'Instinct', kind: 'DoT' })(FRACTURE, 'Fracture', 0.4, FRACTURE_TEXT, {
      tags: 'Fracture', perCount: FRACTURE_COUNT, maxCount: 30, image: 'cards/arabella/unique_30115_03.webp',
      notes: 'One play per activation: set the Fracture on target, the count before it halves',
    }),
  ],
} satisfies CharacterAdditions
