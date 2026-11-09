// Sereniel: our additions to the Prydwen import (src/data/prydwen/sereniel.json). Card keys are the import's ids.
// Damage % follows the "+" rule: 'by 20%' (no "+") = multiplicative, '+20%' = additive (owner, 2026-10-25).
// Owner's answers (2026-11-08):
// - Afterglow is Sereniel's: +100% additive on her next Attack Card against a Ravaged target, one card per Afterglow, so a per-play switch.
// - "Proc 1 more time" (Plasma Missile, Cobalt Light V) and Pale Shooting Star's Homing Laser procs are plays added by hand.
// - "Homing Laser" includes Homing Laser L (Plasma Missile III, Cobalt Light IV, E4).
// - Plasma Missile V's +30% per Homing Laser moved to hand raises its own end-of-turn hit.
// - Destroy (Homing Laser I) happens on Ravage or on a Ravaged target: +1 hit while Target Ravaged is on.
// - E6's +20% Weakness Damage Amount adds to the Weakness DMG stat.
// - Node 7's Instinct Damage is on the stats screen (Instinct Damage 15.0% = 10% + 5% at 59.1% crit), so nothing is added on top.
import type { CharacterAdditions } from '../../engine/types'
import { cardBuff, effectHits, EGO_POTENTIALS_PLUS_3 } from '../helpers'

const LASER_L = 'card-851'
const HOMING_LASERS = ['card-826', 'card-827', 'card-828', 'card-829', 'card-830', 'card-831']
/** Every Homing Laser card, Homing Laser L included (owner, 2026-11-08). */
const HOMING_LASER = ['Homing Laser', 'Homing Laser I', 'Homing Laser II', 'Homing Laser III', 'Homing Laser IV', 'Homing Laser V',
  'Homing Laser L'].join('/')

// Instinct Weakness: Weakness Attack on Instinct cards while the target has it, switched on per play (as Selena's Passion Weakness)
const instinctWeakness = (extra = {}) => cardBuff('instinct-weakness', 'Instinct Weakness', 'Weakness Attack', 'Instinct',
  { target: 'enemy', counter: 'Instinct Weakness', maxStacks: 1, ...extra })

const effectHit = effectHits({ element: 'Instinct' })

export default {
  verified: { date: '2026-11-08', gameVersion: '841' },
  notes: 'Card upgrades are set on the Setup tab. Per play (Cards tab): Target Ravaged (Afterglow, Destroy), Afterglow (on her next '
    + 'Attack Card against a Ravaged target or one without Tenacity), Instinct Weakness on the target (Plasma Missile III, E6), '
    + 'decreased Tenacity of the target (Plasma Missile II), Homing Lasers moved to hand (Plasma Missile V), Plasma Missile III\'s '
    + '+60% on Homing Lasers that turn, Firepower Amp (E4). Hits: set them on the play for Cobalt Light II (Retain) and IV (Homing '
    + 'Lasers in hand) and E2\'s Homing Laser L. Procs (Plasma Missile on a target not Ravaged, Cobalt Light V on Ravage, Pale '
    + 'Shooting Star\'s Homing Lasers) are plays of their own: add them to the attack list. Not counted: Tenacity damage',
  // Potential nodes in the game's wording (owner's screenshots, 2026-11-08)
  potentials: {
    '3-1': { text: 'Add a 50% chance to create 1 Homing Laser L to Pulse Fire.' },
    '5-1': { text: "+5% Damage Amount to Sereniel's Pulse Fire\nIf Sereniel's Critical Chance is 20% or higher, add an additional +5% to the modifier" },
    '7': { text: "If Sereniel's Critical Chance is 20% or higher, +10% Instinct Attribute Damage Amount\nIf Critical Chance is 40% or higher, add an additional +5% to the modifier" },
  },
  // Manifest Ego in the game's wording (owner's screenshots, 2026-11-08)
  ego: {
    1: { text: '+100% Damage Amount to Pale Shooting Star, and change the number of procable Homing Laser cards to 5.' },
    2: { text: 'At the start of battle, create 2 Homing Laser L, each with 1 increased Hit Count and applied with Haste.\nAt the start of the turn, if Homing Laser is one of the cards drawn, Draw 1 card.' },
    3: { text: '+150% Damage Amount to Death Halo, and apply Haste to each Homing Laser L that is moved by Death Halo.' },
    4: { text: "For each Homing Laser that is moved to hand on Ravage, Sereniel gains a Firepower Amp effect.\nFirepower Amp: +25% Damage Amount to Sereniel's Attack Cards (max 2 stacks)" },
    5: { text: EGO_POTENTIALS_PLUS_3 },
    6: { text: 'At the start of battle, +20% Weakness Damage Amount to Sereniel.\nAt the start of the turn, inflict 1 Instinct Weakness on the enemy with the highest HP.\nOn Ravage by allies, Sereniel inflicts 80% Damage × max Tenacity count of the target to that enemy.' },
  },
  effects: [
    // Afterglow (in game): "+1 to Tenacity Damage of Attack Cards, and +100% Damage Amount against enemies in a Ravage state and enemies
    // without Tenacity. On effect activation, decrease Afterglow by 1": one of her Attack Cards per Afterglow (owner, 2026-11-08)
    { kind: 'Buff', id: 'afterglow', name: 'Afterglow', category: 'Character', value: '+100%', appliesTo: 'Attack', hitScope: 'All hits',
      condition: 'Ravaged only', counter: 'Afterglow', maxStacks: 1 },
    // 5-1 (in game): "+5% Damage Amount to Sereniel's Pulse Fire. If Sereniel's Critical Chance is 20% or higher, add an additional +5%":
    // part of the card %, like Selena's 5-1 (locked for the owner: Pulse Fire 102% = 100% x 1.02)
    { kind: 'Buff', id: 'p5-1-pulse', node: '5-1', name: 'Basic Card Proficiency', category: 'Potential', type: 'Card +', value: '+5%',
      appliesTo: 'Pulse Fire', hitScope: 'All hits', condition: 'Always', thresholdStat: 'Critical Chance',
      thresholdBonus: { above: 0.2, value: '+5%', orEqual: true } },
    // 7: on the stats screen (Instinct Damage), so nothing here
    // E1 Sleeping Memory (in game): "+100% Damage Amount to Pale Shooting Star": additive, as Khalipe's E6 on Silver Veil
    { kind: 'Buff', id: 'e1-star', name: 'Damage Amount to Pale Shooting Star', category: 'Ego Manifestation', value: '+100%',
      appliesTo: 'Pale Shooting Star', hitScope: 'All hits', condition: 'Always', egoLevel: 1 },
    // E3 Vivid Memory (in game): "+150% Damage Amount to Death Halo": part of the Ego skill's %, Base % (docs/FORMULA.md, Ego skill bonuses)
    { kind: 'Buff', id: 'e3-death-halo', name: 'Damage Amount to Death Halo', category: 'Ego Manifestation', type: 'Base %', value: '+150%',
      appliesTo: 'Death Halo', hitScope: 'All hits', condition: 'Always', egoLevel: 3 },
    // E4 Inner Memory (in game): "Firepower Amp: +25% Damage Amount to Sereniel's Attack Cards (max 2 stacks)"
    { kind: 'Buff', id: 'e4-firepower-amp', name: 'Firepower Amp', category: 'Ego Manifestation', value: '+25%', appliesTo: 'Attack',
      hitScope: 'All hits', condition: 'Always', counter: 'Firepower Amp', maxStacks: 2, egoLevel: 4 },
    // E6 Liberated Memory (in game): "At the start of battle, +20% Weakness Damage Amount to Sereniel": the Weakness DMG stat (owner, 2026-11-08)
    { kind: 'Stat', id: 'e6-weakness', name: 'Weakness Damage Amount', category: 'Ego Manifestation', stat: 'Weakness DMG', value: '20%', egoLevel: 6 },
    // E6: "At the start of the turn, inflict 1 Instinct Weakness on the enemy with the highest HP"
    instinctWeakness({ id: 'e6-instinct-weakness', name: 'E6 Instinct Weakness', category: 'Ego Manifestation', egoLevel: 6 }),
  ],
  // Card text: the in-game wording (owner's screenshots, 2026-11-08), with tokens for the build's numbers (engine/cardText.ts)
  cards: {
    // Ego skill: 500% in game (Prydwen 400%), at E0
    'card-823': { pct: 5, text: '{E3:650%|{500%}} Damage to all enemies\nMove all Homing Laser L in Exhaust Pile to hand' },
    // 3-1 (in game): "Add a 50% chance to create 1 Homing Laser L to Pulse Fire"
    'card-824': { creates: [LASER_L], text: '{100%} Damage\n{P3-1:50% chance to create 1 Homing Laser L}' },
    'card-825': { text: '{100%} Shield' },

    // Homing Laser, I–V: 120% / 180% / 225% base in game (Prydwen 100% / 150%)
    'card-826': { pct: 1.2, text: '{120%} Damage\n2 Afterglow\nOn Ravage, move from Graveyard to hand' },
    'card-827': { pct: 1.8, ravagedHits: 1, text: '{180%} Damage\nOn Ravage, move to hand\nDestroy: Add 1 Hit(s)' },
    'card-828': { pct: 1.8, text: '{180%} Damage\n3 Afterglow\nOn Ravage, move to hand' },
    'card-829': { pct: 2.25, creates: [LASER_L], text: '{225%} Damage\n2 Afterglow\nCreate 2 Homing Laser L in Discard Pile' },
    'card-830': { pct: 1.2, text: '{120%} Damage\n1 Afterglow\nOn Ravage or at the start of the turn, move to hand' },
    'card-831': { pct: 1.8, text: '{180%} Damage\n2 Afterglow\nMove all Homing Laser L in Graveyard to hand' },

    // Plasma Missile, I–V
    'card-832': { text: '{120%} Damage\n0.5 Tenacity Damage\nIf the target is not Ravaged, proc 1 more time.' },
    'card-833': { text: '{180%} Damage\n1 Tenacity Damage\nIf the target is not Ravaged, proc 1 more time' },
    'card-834': {
      text: '{180%} Damage\n+60% base Damage Amount for each decreased Tenacity of the target\n(max 10)',
      effects: [cardBuff('tenacity', 'base Damage Amount for each decreased Tenacity of the target', '+60%', 'Plasma Missile II',
        { type: 'Base %', counter: 'Decreased Tenacity', maxStacks: 10 })],
    },
    'card-835': {
      text: '{120%} Damage\n2 Instinct Weakness\n+60% Damage Amount to Homing Laser for 1 turn(s)',
      effects: [
        instinctWeakness(),
        cardBuff('homing-laser', 'Damage Amount to Homing Laser for 1 turn(s)', '+60%', HOMING_LASER, { counter: 'Plasma Missile III', maxStacks: 1 }),
      ],
    },
    'card-836': { creates: [LASER_L], text: '{120%} Damage\nCreate 3 Homing Laser L in Draw Pile' },
    // Its 50% shows unraised at Signature level 10 (owner's screenshots): no upgrade. One play per end of turn.
    'card-837': {
      upgrade: null,
      text: '[Unique]\nAt the end of the turn, {50%} Damage to a random enemy\n+30% Damage Amount for each Homing Laser Moved to hand for 1 turn(s)',
      notes: 'One play per end of turn',
      effects: [cardBuff('moved', 'Damage Amount for each Homing Laser Moved to hand', '+30%', 'Plasma Missile V',
        { counter: 'Homing Lasers moved to hand' })],
    },

    // Shining Core, I–V: no damage
    'card-838': { creates: [LASER_L], text: 'Create 2 Homing Laser L' },
    'card-839': { creates: [LASER_L], text: 'Create 3 Homing Laser L' },
    'card-840': { creates: [LASER_L], text: 'Create 2 Homing Laser L, increase Exhaust of those cards by 2' },
    'card-841': { creates: [LASER_L], text: '[Unique / Initiation]\nCreate 2 Homing Laser L\nOn Ravage, create 2 Homing Laser L' },
    'card-842': { creates: [LASER_L], text: 'Create X+1 Homing Laser L\nApply Haste to those cards' },
    'card-843': { creates: HOMING_LASERS, text: 'Select and create 1 Homing Laser with their own Signature Epiphanies' },

    // Cobalt Light, I–V: 140% / 210% base in game (Prydwen 120% / 180%)
    'card-844': { pct: 1.4, text: '{140%} Damage × 4 to random enemies\n1 Tenacity Damage for each Hit' },
    'card-845': { pct: 2.1, text: '{210%} Damage × 4 to random enemies\n1 Tenacity Damage for each Hit\nOn Ravage with this card, decrease Cost by 1' },
    'card-846': {
      pct: 1.4, text: '[Retain]\n{140%} Damage × 4 to random enemies\n1 Tenacity Damage for each Hit\nRetain: Add 1 Hit until activated (max 5 times)',
      notes: 'Set the hits on each play (4 + turns Retained, max 9)',
    },
    'card-847': { pct: 1.4, creates: [LASER_L], text: '{140%} Damage × 4 to random enemies\nCreate 1 Homing Laser L for each target Hit' },
    'card-848': {
      pct: 1.4, text: '{140%} Damage to random enemies\nAdd 1 Hit for each Homing Laser in hand',
      notes: 'Set the hits on each play (1 + Homing Lasers in hand, Homing Laser L included)',
    },
    'card-849': { pct: 1.4, text: '[Weakness Attack]\n{140%} Damage × 4\nRavage: Proc 1 more time', notes: 'On Ravage, add another play of it' },

    // Pale Shooting Star (Mythic): E1 procs 5 Homing Lasers
    'card-850': { text: '{150%} Damage\nProc {E1:5|3} Homing Laser in Draw Pile and Graveyard', notes: 'Add the procced Homing Lasers as plays' },

    // Homing Laser L: 72% in game = 60% x 1.2 (raised by the Signature upgrade)
    'card-851': { text: '[Exhaust 2]\n{60%} Damage\n1 Afterglow\nOn Ravage, move from Graveyard to hand' },
  },
  extraCards: [
    // E6 (in game): "On Ravage by allies, Sereniel inflicts 80% Damage × max Tenacity count of the target to that enemy": one play per Ravage
    effectHit('e6-ravage', 'Liberated Memory (On Ravage)', 0.8,
      "On Ravage by allies, Sereniel inflicts 80% Damage × max Tenacity count of the target to that enemy",
      { perCount: 'Max Tenacity of the target', egoLevel: 6, targetRavaged: true, image: 'cards/sereniel/unique_30075_05.webp',
        notes: 'One play per Ravage: set the target\'s max Tenacity' }),
  ],
} satisfies CharacterAdditions
