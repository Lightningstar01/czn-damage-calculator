// Hilde: our additions to the Prydwen import (src/data/prydwen/hilde.json). Card keys are the import's ids.
// Damage % follows the "+" rule: 'by 20%' (no "+") = multiplicative, '+20%' = additive (owner, 2026-10-25).
// Owner's levels (screenshots, 2026-11-08): Basic 1, Unique 7 (x1.14), 3-1 and 7 unlocked, 5-1 locked, Ego level 0.
// Homing Arrows are Extra Attacks raised by the Signature upgrade (137% = 120% x 1.14; Grand 570%, Fracture 57%).
// Zero In (keyword): "At the end of the turn, 35% Extra Attack to the enemy with the highest HP for each Zero In": one hit of
// 35% x stacks, not raised by upgrades (owner, 2026-11-08). Vortex Arrow's per-card bonus is a fixed +60% (Prydwen +50%; owner, 2026-11-08).
// E2 Double Tap goes off on every Homing Arrow version (owner, 2026-11-08). Matrix Overlay's "+15% Weakness Damage Amount taken" is set
// per play and adds to Weakness DMG on plays that hit a Weakness (owner, 2026-11-08: buff type 'Weakness DMG').
import type { CharacterAdditions } from '../../engine/types'
import { cardBuff, effectHits, EGO_POTENTIALS_PLUS_3 } from '../helpers'

const HOMING = 'card-1258'
const HOMING_FRACTURE = 'card-1259'
const HOMING_GRAND = 'card-1260'
const HOMING_ARROWS = 'Homing Arrow/Homing Arrow (Fracture)/Homing Arrow (Grand)'
const ZERO_IN = 'Zero In'

const effectHit = effectHits({ element: 'Instinct', kind: 'Extra Attack' })

/** Draw & Release / I: "+X% Damage Amount to those cards for 1 turn until activated", on Hilde's Attack Cards it drew. */
const drawRelease = (value: string, counter: string) =>
  [cardBuff('drawn', 'Damage Amount to those cards for 1 turn until activated', value, 'Attack', { counter, maxStacks: 1 })]

export default {
  verified: { date: '2026-11-08', gameVersion: '841' },
  notes: 'Card upgrades are set on the Setup tab; Potential 7 is on the stats screen. Per play (Cards tab): Ionization on the target '
    + '(max 12; every ally\'s hits, Hilde\'s +4% more), Matrix Overlay this turn (+15% Weakness DMG) and Matrix Overlay drew this card '
    + '(Weakness Attack), Draw & Release (I) drew this card, cards / Attack Cards drawn by abilities this turn (Draw & Release V, Vortex Arrow), '
    + 'Double Tap (E2), Find the Gap (E4). Zero In: a play at the end of the turn with the stacks. Each Homing Arrow proc is a play. '
    + 'Not counted: Fracture (DoT), Shields, draws, Zero In and Ionization gains',
  // Potential nodes in the game's wording (owner's screenshots, 2026-11-08)
  potentials: {
    '3-1': { text: '+20% Damage Amount to the Multishot card.' },
    '5-1': { text: "+5% Damage Amount to Hilde's Multishot\nIf Hilde's Extra Damage (stat) is 6% or higher, add an additional +5% to the modifier" },
    '7': { text: "+7% Instinct Attribute Damage Amount\nIf Hilde's Extra Damage (stat) is 6% or higher, add an additional +8% to the modifier" },
  },
  // Manifest Ego in the game's wording (owner's screenshots, 2026-11-08)
  ego: {
    1: { text: 'Change the following effects for Vortex Arrow: increase Draw by 1, +60% Damage Amount, and change the Damage Amount increase for each Attack Card Drawn through an ability this turn to +90%.' },
    2: { text: "At the start of battle, +10% to Hilde's Critical Chance.\nAt the start of the turn or when an enemy is defeated, gain 1 Double Tap.\nDouble Tap: When Homing Arrow is activated, 300% Extra Attack to the enemy with the lowest Health, and decrease Double Tap by 1 (max 5 stacks)" },
    3: { text: 'Change the Weakness Damage Amount taken effect of Matrix Overlay from +15% to +25%.' },
    4: { text: "For each Hit an ally performs, gain 1 Find the Gap\nFind the Gap: Increase Damage Amount of Hilde's Extra Attacks by 5% (max 8 stacks)" },
    5: { text: EGO_POTENTIALS_PLUS_3 },
    6: { text: 'When Find the Gap reaches 8 stacks, +15% additional Critical Chance to Instinct-Attribute allies.\nIncrease the max stack of Zero In to 100, and at the start of the turn, gain 15 Zero In.\nFor each stack of Zero In, +1% Critical Damage to Zero In (max +45%).' },
  },
  effects: [
    // Ionization (keyword): "+8% Damage Amount taken for each Ionization, and +4% additional Damage Amount taken from Hilde for each
    // Ionization (max 12 stack(s))": a debuff on the target for every ally, Hilde's hits 4% more
    { kind: 'Buff', id: 'ionization', name: 'Ionization: Damage Amount taken', category: 'Character', target: 'enemy', value: '+8%',
      appliesTo: 'ALL', hitScope: 'All hits', condition: 'Always', counter: 'Ionization', maxStacks: 12 },
    { kind: 'Buff', id: 'ionization-hilde', name: 'Ionization: additional Damage Amount taken from Hilde', category: 'Character', value: '+4%',
      appliesTo: 'ALL', hitScope: 'All hits', condition: 'Always', counter: 'Ionization', maxStacks: 12 },
    // 3-1 Basic Card Proficiency: part of the in-game card % (Multishot 82% = (60% + 20%) x 1.02)
    { kind: 'Buff', id: 'p3-1-multishot', node: '3-1', name: 'Basic Card Proficiency', category: 'Potential', type: 'Card +', value: '+20%',
      appliesTo: 'Multishot', hitScope: 'All hits', condition: 'Always' },
    // 5-1 Basic Card Proficiency (locked for the owner), like Selena's 5-1
    { kind: 'Buff', id: 'p5-1-multishot', node: '5-1', name: 'Basic Card Proficiency', category: 'Potential', type: 'Card +', value: '+5%',
      appliesTo: 'Multishot', hitScope: 'All hits', condition: 'Always', thresholdStat: 'Extra Damage',
      thresholdBonus: { above: 0.06, value: '+5%', orEqual: true } },
    // 7 Unique Stat Upgrade: on the stats screen (Instinct Damage 15.0% = 7% + 8% at Extra Damage 18.7%), so nothing is added on top
    // E1 Sleeping Memory: "+60% Damage Amount" to Vortex Arrow, part of its card % like a Potential node (Unconfirmed: hilde-e1-vortex)
    { kind: 'Buff', id: 'e1-vortex', name: 'E1 Sleeping Memory', category: 'Ego Manifestation', type: 'Card +', value: '+60%',
      appliesTo: 'Vortex Arrow', hitScope: 'All hits', condition: 'Always', egoLevel: 1 },
    // E2 Awakening Memory: "At the start of battle, +10% to Hilde's Critical Chance" (not on the stats screen)
    { kind: 'Stat', id: 'e2-crit', name: "E2 Awakening Memory: Hilde's Critical Chance", category: 'Ego Manifestation', stat: 'Crit Rate',
      value: '10%', egoLevel: 2 },
    // E4 Find the Gap: "Increase Damage Amount of Hilde's Extra Attacks by 5% (max 8 stacks)"
    { kind: 'Buff', id: 'e4-find-the-gap', name: 'E4 Find the Gap', category: 'Ego Manifestation', value: '5%', appliesTo: 'Extra Attack',
      hitScope: 'All hits', condition: 'Always', counter: 'Find the Gap', maxStacks: 8, egoLevel: 4 },
    // E6: "When Find the Gap reaches 8 stacks, +15% additional Critical Chance to Instinct-Attribute allies" (their Instinct cards)
    { kind: 'Buff', id: 'e6-crit', name: 'E6 Liberated Memory: Critical Chance', category: 'Ego Manifestation', target: 'allies', type: 'Crit Chance',
      value: '+15%', appliesTo: 'Instinct', hitScope: 'All hits', condition: 'Always', egoLevel: 6, hint: 'Find the Gap at 8' },
    // E6: "For each stack of Zero In, +1% Critical Damage to Zero In (max +45%)": reads the Zero In play's stacks
    { kind: 'Buff', id: 'e6-zero-in-crit', name: 'E6 Liberated Memory: Critical Damage to Zero In', category: 'Ego Manifestation', type: 'Crit DMG',
      value: '+1%', appliesTo: ZERO_IN, hitScope: 'All hits', condition: 'Always', counter: ZERO_IN, maxStacks: 45, egoLevel: 6 },
  ],
  // E2 Double Tap: "When Homing Arrow is activated, 300% Extra Attack to the enemy with the lowest Health" (every version)
  triggers: [{ card: 'double-tap', on: HOMING_ARROWS, counter: 'Double Tap', maxStacks: 5, egoLevel: 2 }],
  // Card text: the in-game wording (owner's screenshots, 2026-11-08), with tokens for the build's numbers (engine/cardText.ts)
  cards: {
    // Ego skill: +15% Weakness Damage Amount taken (E3 +25%) for the turn, Weakness Attack on the 3 Attack Cards drawn
    'card-1230': {
      text: '+{E3:25|15}% Weakness Damage Amount taken to all enemies for 1 turn(s)\nDraw 3 Attack Card(s) of this unit\nApply Weakness Attack to those cards for 1 turn',
      effects: [
        cardBuff('weakness-taken', 'Matrix Overlay: Weakness Damage Amount taken', '+15%', 'ALL',
          { type: 'Weakness DMG', target: 'enemy', counter: 'Matrix Overlay this turn', maxStacks: 1, egoBelow: 3 }),
        cardBuff('weakness-taken-e3', 'Matrix Overlay: Weakness Damage Amount taken (E3)', '+25%', 'ALL',
          { type: 'Weakness DMG', target: 'enemy', counter: 'Matrix Overlay this turn', maxStacks: 1, egoLevel: 3 }),
        cardBuff('weakness-attack', 'Matrix Overlay: Weakness Attack', 'Weakness Attack', 'Attack',
          { counter: 'Matrix Overlay drew this card', maxStacks: 1 }),
      ],
    },
    'card-1231': { text: '{60%} Damage to all enemies' },
    'card-1232': { text: '{100%} Shield' },

    // Quiver Reload, I–V: each brings its Homing Arrow into the deck
    'card-1233': { creates: [HOMING], text: '[Lead]\nCreate 3 Homing Arrow in Draw Pile' },
    'card-1234': { creates: [HOMING], text: '[Lead]\nCreate 4 Homing Arrow in Draw Pile, then Draw 1 of those cards' },
    'card-1235': { creates: [HOMING_FRACTURE], text: '[Lead]\nCreate 3 Homing Arrow (Fracture) in Draw Pile' },
    'card-1236': { creates: [HOMING_GRAND], text: '[Lead]\nCreate 1 Homing Arrow (Grand) in Draw Pile' },
    'card-1237': {
      creates: [HOMING],
      text: '[Unique / Lead]\nCreate 2 Homing Arrow in Draw Pile\nWhen an enemy is defeated, create 2 Homing Arrow in Draw Pile (5 time(s) per turn)',
    },
    'card-1238': { creates: [HOMING], text: '[Unique / Opener]\nAt the start of the turn, create 3 Homing Arrow in Draw Pile\nHoming Arrow cannot be a target of Turn Draw' },

    // Plasma Rain, I–V (Ionization is set per play)
    'card-1239': { text: '{60%} Damage and 2 Ionization to all enemies' },
    'card-1240': { text: '[Lead]\n{100%} Damage and 2 Ionization to all enemies\nAttunement: 2 Ionization to a random enemy' },
    'card-1241': { text: '[Lead]\n3 Ionization to all enemies\nDraw 1' },
    'card-1242': { text: '{100%} Damage and 3 Ionization to all enemies\nDefeat: 3 Fracture to all enemies (max 1 time)' },
    'card-1243': { text: '[Ignition]\n{180%} Piercing Damage and 3 Ionization to all enemies' },
    'card-1244': { text: '{120%} Damage to all enemies\nDraw 1 Attack Card(s) of this unit\nStreak: Decrease Cost by 1' },

    // Draw & Release, I–V
    'card-1245': {
      text: 'Draw 2 Attack Card(s) of this unit\n+50% Damage Amount to those cards for 1 turn until activated',
      effects: drawRelease('+50%', 'Draw & Release drew this card'),
    },
    'card-1246': {
      text: '[Lead]\nDraw 2 Attack Card(s) of this unit\n+80% Damage Amount to those cards for 1 turn until activated',
      effects: drawRelease('+80%', 'Draw & Release I drew this card'),
    },
    'card-1247': { text: '[Lead]\nDraw 2\nFor the next 3 Extra Attack(s) of this unit, 1 Fracture to all enemies' },
    'card-1248': { text: 'Move all cards in hand to Draw Pile, then Draw for each moved' },
    'card-1249': { text: 'Draw 2 Lead card(s)\nDecrease Cost of those cards by 1 for 1 turn until activated' },
    'card-1250': {
      text: 'Increase Damage Amount of the next Attack Card of this unit by 30% for each card Drawn through an ability this turn (max 300%)',
      effects: [cardBuff('drawn', 'Damage Amount of the next Attack Card for each card Drawn through an ability this turn', '30%', 'Attack',
        { counter: 'Cards drawn by abilities this turn (Draw & Release V)', maxStacks: 10 })],
    },

    // Big Game Ranger, I–V: Zero In joins the deck (a play at the end of the turn)
    'card-1251': { creates: ['zero-in'], text: '[Unique / Lead]\nOn Hit, 2 Zero In' },
    'card-1252': { creates: ['zero-in'], text: '[Unique / Lead]\nOn Hit, 3 Zero In' },
    'card-1253': { creates: ['zero-in'], text: '[Unique / Initiation]\nDraw 2\nOn Hit, 2 Zero In' },
    'card-1254': { creates: ['zero-in'], text: '[Unique / Lead]\nOn Hit, 2 Zero In\nWhen the Attunement effect is activated, 2 Zero In' },
    'card-1255': { creates: ['zero-in'], text: '[Unique / Lead]\nWhen a harmful effect is applied through an ability, 5 Zero In' },
    'card-1256': { creates: ['zero-in'], text: '[Unique / Lead]\nAt the start of the turn, 30 Zero In\nUnable to use Attack Cards of this unit' },

    // Vortex Arrow: +60% per Attack Card drawn through an ability (Prydwen +50%); E1 draws 1 more, +60%, and +90% per card
    'card-1257': {
      text: '[Unique]\nDraw {E1:4|3}\n{120%} Damage to all enemies\n+{E1:90|60}% Damage Amount for each Attack Card Drawn through an ability this turn (max 8 cards)',
      effects: [
        cardBuff('drawn', 'Damage Amount for each Attack Card Drawn through an ability this turn', '+60%', 'Vortex Arrow',
          { counter: 'Attack Cards drawn by abilities this turn', maxStacks: 8, egoBelow: 1 }),
        cardBuff('drawn-e1', 'Damage Amount for each Attack Card Drawn through an ability this turn (E1)', '+90%', 'Vortex Arrow',
          { counter: 'Attack Cards drawn by abilities this turn', maxStacks: 8, egoLevel: 1 }),
      ],
    },

    // Homing Arrows: Extra Attacks (Prydwen reads 0%), raised by the Signature upgrade. Unactivatable: each Attunement proc is a play.
    [HOMING]: { pct: 1.2, hits: 1, kind: 'Extra Attack', text: '[Exhaust]\n{120%} Extra Attack to the enemy with the lowest HP\nDraw 1\nAttunement: Proc this card' },
    [HOMING_FRACTURE]: { pct: 0.5, hits: 1, kind: 'Extra Attack', text: '[Exhaust]\n{50%} Extra Attack to all enemies\n1 Fracture\nDraw 1\nAttunement: Proc this card' },
    [HOMING_GRAND]: { pct: 5, hits: 1, kind: 'Extra Attack', text: '[Exhaust]\n{500%} Extra Attack to the enemy with the highest HP\nDraw 1\nAttunement: Proc this card' },
  },
  extraCards: [
    // Zero In (keyword): one hit of 35% x the stacks at the end of the turn (max 60, 100 from E6)
    effectHit('zero-in', ZERO_IN, 0.35,
      'At the end of the turn, 35% Extra Attack to the enemy with the highest HP for each Zero In, and on effect activation, remove Zero In (max {E6:100|60} stack(s))',
      { tags: ZERO_IN, perCount: ZERO_IN, maxCount: 100, image: 'cards/hilde/unique_30113_04.webp',
        notes: 'One play at the end of the turn: set the Zero In stacks (max 60 below E6)' }),
    // E2 Double Tap: set off by Homing Arrow plays with Double Tap stacks (triggers)
    effectHit('double-tap', 'Double Tap', 3, 'When Homing Arrow is activated, 300% Extra Attack to the enemy with the lowest Health, and decrease Double Tap by 1',
      { tags: 'Double Tap' }),
  ],
} satisfies CharacterAdditions
