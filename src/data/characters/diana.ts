// Diana: our additions to the Prydwen import (src/data/prydwen/diana.json). Card keys are the import's ids.
// Damage % follows the "+" rule: 'by 20%' (no "+") = multiplicative, '+20%' = additive (owner, 2026-10-25).
// Owner's levels (screenshots, 2026-11-09): Basic 1, Unique 8 (x1.16), 3-1 and 7 unlocked, 5-1 locked, Ego level 0.
// Resonance (keyword): "On card Discard, 80% Extra Attack, then decrease Resonance by 1": each activation is one 80% Extra Attack by
// Diana, not raised by card upgrades (owner, 2026-11-09); set the activations per play (anyone's discards, Pistol of Purification's
// "activate ... more times"). Heart Breaker's discard Extra Attack and Cupid Shot's per-Bullet Extra Attack are raised by the Signature
// upgrade (139% = 120% x 1.16, 70% = 60% x 1.16). Liberated Feelings' "Increase base Damage Amount by 30% for each" raises the card %,
// like Lucas's Flame Thrower IV (Card %). E6's 200% Extra Attack is one hit by each ally (owner, 2026-11-09); only Diana's is counted.
import type { CharacterAdditions } from '../../engine/types'
import { cardBuff, effectHits, EGO_POTENTIALS_PLUS_3 } from '../helpers'

const HEART_SHAKER = 'card-1061'
const HEART_BREAKER = 'card-1062'
const CUPID_SHOT = 'card-1063'
const HEART_BULLETS = [HEART_BREAKER, HEART_SHAKER]
const RESONANCE = 'Resonance activations'
const FLUTTERS = 'Flutters'
const CMERE = "C'mere, Milk & Pong!"
const BULLET_ART = 'cards/diana/unique_1061_06.webp'

const extraAttack = effectHits({ element: 'Passion', kind: 'Extra Attack' })

export default {
  verified: { date: '2026-11-09', gameVersion: '841' },
  notes: 'Card upgrades are set on the Setup tab; Potential 7 is on the stats screen. Per play (Cards tab): Resonance activations '
    + '(any play that discards a card while the target has Resonance, or Pistol of Purification\'s "activate ... more times": one 80% '
    + 'Extra Attack each), Heart Breakers Discarded (139% Extra Attack each), Bullet cards in hand on a Cupid Shot, different Bullet cards '
    + 'in hand on Liberated Feelings, Bullet cards Discarded on Blooming Love IV, Bullets Discarded this turn on Pistol of Purification IV, '
    + 'Flutters (E2: on the Flutters play at the end of the turn; E4: on every Extra Attack). A Quietus card that is Discarded is proc\'d: '
    + 'add it as a play. Not counted: the teammates\' E6 Extra Attacks, heals, draws, discards and Resonance gains (set the numbers per play)',
  // Potential nodes in the game's wording (owner's screenshots, 2026-11-09)
  potentials: {
    '3-1': { text: 'Adds the following effect to the Disruption Fire card: Discard 1 random card of this unit.' },
    '5-1': { text: "+5% Damage Amount to Diana's Disruption Fire, and if Diana's Critical Chance is 20% or higher, add an additional +5% to the modifier." },
    '7': { text: "If Diana's Critical Chance is 10% or higher, +4% Extra Damage\nFor every 5% Critical Chance above 10%, add an additional +1% to the modifier\n(additional +8% max)" },
  },
  // Manifest Ego in the game's wording (owner's screenshots, 2026-11-09)
  ego: {
    1: { text: '+100% Damage Amount to the Liberated Feelings card, and changes the Draw count of Exhaust Bullet cards to 3.' },
    2: { text: 'Each time an ally Discards a card, gain 2 Flutters.\nFlutters: At the end of the turn, 200% Extra Attack to the target with the highest max HP, and increase Damage Amount of the Extra Attack by 10% for each Flutters, then decrease all Flutters at the start of the turn (max 20 stacks).' },
    3: { text: 'Change Cost of Radiant Smile to 4 and the creation count of Heart Bullets to 4 cards.' },
    4: { text: "+30% Damage Amount to Diana's Extra Attacks.\n+1% Damage Amount to Diana's Extra Attacks for each Flutters that Diana owns." },
    5: { text: EGO_POTENTIALS_PLUS_3 },
    6: { text: "Each time a card is Discarded by an ally, gain an additional 2 Flutters, and increase the max stack count of Flutters by 10.\nEach time Diana's Flutters stacks to 30, allies inflict 200% Extra Attack to a random enemy (1 time per turn)." },
  },
  effects: [
    // 3-1 Basic Card Proficiency: text only (Disruption Fire discards 1 random card of Diana's)
    // 5-1 Basic Card Proficiency (locked for the owner): part of the card %, like Renoa's 5-1
    { kind: 'Buff', id: 'p5-1-disruption', node: '5-1', name: 'Basic Card Proficiency', category: 'Potential', type: 'Card +', value: '+5%',
      appliesTo: 'Disruption Fire', hitScope: 'All hits', condition: 'Always', thresholdStat: 'Critical Chance',
      thresholdBonus: { above: 0.2, value: '+5%', orEqual: true } },
    // 7 Unique Stat Upgrade: on the stats screen (Extra Damage 11.5% = 4% + 37.6 / 5 at Critical Chance 47.6%), so nothing is added on top
    // E1 Sleeping Memory: "+100% Damage Amount to the Liberated Feelings card", part of its card % like Hilde's E1 (Unconfirmed: diana-readings)
    { kind: 'Buff', id: 'e1-liberated', name: 'E1 Sleeping Memory', category: 'Ego Manifestation', type: 'Card +', value: '+100%',
      appliesTo: 'Liberated Feelings', hitScope: 'All hits', condition: 'Always', egoLevel: 1 },
    // E4 Inner Memory: "+30% Damage Amount to Diana's Extra Attacks. +1% ... for each Flutters that Diana owns" (own buffs: Diana's cards only)
    { kind: 'Buff', id: 'e4-extra-attacks', name: 'E4 Inner Memory', category: 'Ego Manifestation', value: '+30%', appliesTo: 'Extra Attack',
      hitScope: 'All hits', condition: 'Always', egoLevel: 4 },
    { kind: 'Buff', id: 'e4-flutters', name: 'E4 Inner Memory: for each Flutters', category: 'Ego Manifestation', value: '+1%', appliesTo: 'Extra Attack',
      hitScope: 'All hits', condition: 'Always', counter: FLUTTERS, maxStacks: 30, egoLevel: 4 },
  ],
  // Resonance goes off on anyone's discard (and Pistol of Purification's extra activations): one 80% hit per activation set on the play
  triggers: [{ card: 'resonance', on: 'ALL', counter: RESONANCE, maxStacks: 20, perStack: true }],
  // Card text: the in-game wording (owner's screenshots, 2026-11-09), with tokens for the build's numbers (engine/cardText.ts)
  cards: {
    // Ego skill: creates 1 Cupid Shot and 2 Heart Bullets (4 and Cost 4 from E3)
    'card-1033': { creates: [CUPID_SHOT, ...HEART_BULLETS], text: 'Create 1 Cupid Shot\nCreate {E3:4|2} Heart Bullet' },
    'card-1034': { text: '{100%} Damage\n{P3-1:Discard 1 random card(s) of this unit}' },
    'card-1035': { text: 'Heal {100%}' },

    // With All My Heart!, I–V
    'card-1036': { creates: [HEART_BREAKER], text: '[Quietus]\n{100%} Damage\nCreate 2 Heart Breaker' },
    'card-1037': { creates: [HEART_BREAKER], text: '[Quietus]\n{150%} Damage\nCreate 3 Heart Breaker' },
    'card-1038': { creates: [HEART_BREAKER], text: '[Quietus]\n{150%} Damage\nCreate 1 Heart Breaker\nDraw 2 Exhaust Bullet card(s)' },
    'card-1039': { creates: [HEART_BREAKER], text: '[Quietus]\n{150%} Damage\nChange all 1-Cost or lower Exhaust cards in hand into Heart Breaker' },
    'card-1040': { creates: [HEART_BREAKER], text: '[Quietus]\nCreate 2 Heart Breaker\nApply Quietus to all Exhaust Bullet cards in hand' },
    'card-1041': { creates: [HEART_BREAKER], text: '[Quietus]\nAt the start of the turn, create 2 Heart Breaker\nIf 5 or less Heart Bullets are owned, create 1 more' },

    // C'mere, Milk & Pong!, I–V (Prydwen: "C'mere、Milk & Pong!"; its I creates Heart Breaker, Heart Shaker in game)
    'card-1042': { name: CMERE, creates: [HEART_SHAKER], text: 'Create 2 Heart Shaker' },
    'card-1043': { name: `${CMERE} I`, creates: [HEART_SHAKER], text: 'Create 2 Heart Shaker\nFor the next 3 Extra Attacks by a different Combatant, 1 Resonance to the target' },
    'card-1044': { name: `${CMERE} II`, creates: [HEART_SHAKER], text: 'Discard up to 2 cards in hand\nCreate Heart Shaker for each Discarded +1' },
    'card-1045': { name: `${CMERE} III`, creates: HEART_BULLETS, text: 'Change all 0-Cost Exhaust Cards in hand into random Heart Bullets' },
    'card-1046': { name: `${CMERE} IV`, creates: HEART_BULLETS, text: 'Create 1 of each Heart Bullet\n1 Resonance to a random enemy for each different Bullet card in hand' },
    'card-1047': { name: `${CMERE} V`, creates: HEART_BULLETS, text: '[Retain / Unique]\nChange Heart Shaker in hand into Heart Breaker\nRetain: Create 1 Heart Shaker' },

    // Pistol of Purification, I–V (Resonance activations are set on the play)
    'card-1048': { text: '[Bullet / Quietus]\n{120%} Damage\n2 Resonance\nIf this card is Discarded, activate Resonance inflicted on the target by this unit 3 more times' },
    'card-1049': { text: '[Bullet / Quietus]\n{180%} Damage\n3 Resonance\nIf this card is Discarded, activate Resonance inflicted on the target by this unit 5 more times' },
    'card-1050': { text: '[Bullet / Quietus]\n{180%} Damage\nFor the next 5 Haste Attack Card(s) activated, 1 Resonance to the target' },
    'card-1051': { text: '[Quietus]\n{180%} Damage\nActivate Resonance inflicted on the target by this unit 10 time(s)' },
    'card-1052': {
      text: '[Bullet / Quietus]\n{180%} Damage\n+100% base Damage Amount for each Bullet Discarded this turn',
      effects: [cardBuff('discarded', 'base Damage Amount for each Bullet Discarded this turn', '+100%', 'Pistol of Purification IV',
        { type: 'Base %', counter: 'Bullets Discarded this turn', maxStacks: 10 })],
    },
    'card-1053': { text: '[Bullet / Quietus]\n{180%} Damage to all enemies\nWhen this card is Discarded, activate Resonance inflicted on all enemies 2 time(s)' },

    // Blooming Love, I–V (Prydwen's I lacks "Discard 1")
    'card-1054': { text: 'Draw 1 Quietus card(s)\nDiscard 2' },
    'card-1055': { creates: HEART_BULLETS, text: 'Draw 1 Quietus card(s)\nDiscard 1\nIf the Discarded card was a card of a different Combatant, create 2 Heart Bullet' },
    'card-1056': { text: 'Draw 1 Quietus card(s)\nDiscard 2\n1 Resonance to all enemies for each combined Cost of the Discarded cards (max 6)' },
    'card-1057': { text: 'Discard up to 3 Bullet card(s) in hand\nDraw a Quietus card for each Discarded -1' },
    // IV: one 80% Extra Attack per Bullet card Discarded (Prydwen reads 0%), raised by the Signature upgrade (93%)
    'card-1058': {
      text: 'Discard all Bullet cards in hand\n{80%} Extra Attack × that amount to a random enemy',
      pct: 0.8, hits: 1, kind: 'Extra Attack', perCount: 'Bullet cards Discarded', countsHits: true, maxCount: 10,
    },
    'card-1059': { text: '[Quietus / Unique]\nIf no Quietus cards of this unit are in hand, Draw 1 Quietus card(s) of this unit (1 time per turn)' },

    // Liberated Feelings: "Increase base Damage Amount by 30% for each different Bullet card in hand" raises the card % (348% x (1 + 30% x N))
    'card-1060': {
      text: 'Draw {E1:3|2} Exhaust Bullet card(s)\n{300%} Damage\nIncrease base Damage Amount by 30% for each different Bullet card in hand',
      effects: [cardBuff('bullets', 'base Damage Amount for each different Bullet card in hand', '30%', 'Liberated Feelings',
        { type: 'Card %', counter: 'Different Bullet cards in hand', maxStacks: 10 })],
    },

    // Heart Bullets (generated)
    [HEART_SHAKER]: { text: '[Bullet / Haste / Exhaust]\n1 Resonance\nDiscard 1 random card(s) in Draw Pile\nWhen this card is Discarded, 2 Resonance to a random enemy' },
    [HEART_BREAKER]: {
      text: '[Bullet / Haste / Exhaust]\n{80%} Damage\nDiscard 1 random Bullet card(s)\nIf this card is Discarded, {120%@heart-breaker-discard} Extra Attack to a random enemy',
      // Its discard Extra Attack: one per Heart Breaker Discarded, set on the play that discards them
      triggers: [{ card: 'heart-breaker-discard', on: 'ALL', counter: 'Heart Breakers Discarded', maxStacks: 10, perStack: true }],
    },
    // Cupid Shot: 120% Damage, then one 60% Extra Attack (70% at Unique 8) per Bullet card in hand (Prydwen read only the first part)
    [CUPID_SHOT]: {
      text: '[Bullet / Quietus]\n{120%} Damage\n{60%@cupid-shot-extra} Extra Attack × Bullet card count in hand to a random enemy',
      triggers: [{ card: 'cupid-shot-extra', on: 'Cupid Shot', counter: 'Bullet cards in hand', maxStacks: 10, perStack: true }],
    },
  },
  extraCards: [
    // Resonance (keyword): set off by plays with Resonance activations (triggers); not raised by card upgrades (owner, 2026-11-09)
    extraAttack('resonance', 'Resonance', 0.8, 'On card Discard, 80% Extra Attack, then decrease Resonance by 1', { tags: 'Resonance' }),
    // Heart Breaker's and Cupid Shot's Extra Attacks: raised by the Signature upgrade like the cards
    extraAttack('heart-breaker-discard', 'Heart Breaker (Discarded)', 1.2, 'If this card is Discarded, {120%} Extra Attack to a random enemy',
      { upgrade: undefined, image: BULLET_ART }),
    extraAttack('cupid-shot-extra', 'Cupid Shot (Extra Attack)', 0.6, '{60%} Extra Attack to a random enemy for each Bullet card in hand',
      { upgrade: undefined, image: 'cards/diana/start_1061_02.webp' }),
    // E2 Flutters: one play at the end of the turn; "increase Damage Amount of the Extra Attack by 10% for each Flutters" (max 20, 30 from E6)
    extraAttack('flutters', 'Flutters', 2,
      'At the end of the turn, 200% Extra Attack to the target with the highest max HP, and increase Damage Amount of the Extra Attack by 10% for each Flutters (max {E6:30|20} stacks)',
      {
        tags: FLUTTERS, egoLevel: 2, notes: 'One play at the end of the turn: set the Flutters',
        effects: [
          cardBuff('flutters', 'Damage Amount of the Extra Attack for each Flutters', '10%', 'Flutters', { counter: FLUTTERS, maxStacks: 20, egoBelow: 6 }),
          cardBuff('flutters-e6', 'Damage Amount of the Extra Attack for each Flutters (E6)', '10%', 'Flutters', { counter: FLUTTERS, maxStacks: 30, egoLevel: 6 }),
        ],
      }),
    // E6: "allies inflict 200% Extra Attack to a random enemy" at 30 Flutters, once per turn: Diana's own hit (the teammates' aren't counted)
    extraAttack('e6-flutters-30', 'Flutters at 30 (E6)', 2, "Each time Diana's Flutters stacks to 30, allies inflict 200% Extra Attack to a random enemy (1 time per turn)",
      { tags: FLUTTERS, egoLevel: 6, notes: "Diana's hit only: each ally hits once with their own stats" }),
  ],
} satisfies CharacterAdditions
