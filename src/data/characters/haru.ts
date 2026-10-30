// Haru: our additions to the Prydwen import (src/data/prydwen/haru.json). Card keys are the import's ids.
// Damage % follows the "+" rule: 'by 20%' (no "+") = multiplicative, '+20%' = additive (owner, 2026-10-25).
// Potentials 3-1, 5-1 and 7 add to the base % before the upgrade (Card +), measured at Attack 775: Power Anchor 245% = (220% + 20%) x 1.02,
// Anchor Shot 365% = (300% + 10% + 10%) x 1.14. Prydwen's Attack thresholds are wrong: 7's is 600 in game (Prydwen 1000).
import type { CharacterAdditions } from '../../engine/types'
import { cardBuff } from '../helpers'

// "Anchor Shot" reaches every epiphany
const ANCHOR_SHOT = ['Anchor Shot', 'Anchor Shot I', 'Anchor Shot II', 'Anchor Shot III', 'Anchor Shot IV', 'Anchor Shot V'].join('/')

/** "+X% Damage Amount for each activation of this card (max 10)", the same count on every Anchor Shot. */
const perActivation = (value: string, card: string) =>
  [cardBuff('per-activation', 'Damage Amount for each activation of this card', value, card, { counter: 'Anchor Shot activations', maxStacks: 10 })]
const activations = (value: string) => `${value} Damage Amount for each activation of this card (max 10)`

const singleTarget = (value: string, card: string) =>
  [cardBuff('single-target', 'If there is only one target, Damage Amount', value, card, { hint: 'Single target' })]

const MOVE = 'Move Anchor Shot from Draw Pile or Graveyard to hand'
const ALL_ENEMIES = 'Damage to all enemies'

/** Charge Energy: "Attack Cards of this unit" for 1 turn, switched on per play. */
const chargeEnergy = (value: string, counter: string) =>
  cardBuff('attack-cards', 'Damage Amount of Attack Cards of this unit for 1 turn', value, 'Attack', { counter, maxStacks: 1 })

export default {
  notes: 'Card upgrades are set on the Setup tab. Per play (Cards tab): Anchor Shot activations (+100% each, +150% on I, max 10), Anchors '
    + 'played (+10% each, 3-1), Target holding Shield (Pulverize), Cards Discarded (Anchor Shot III), Lift Anchor, Anchor Pointer IV / V, '
    + 'Charge Energy / I-IV, Power Charge IV targets hit, Beneficial effects (Ego skill), AP short of Cost (E2), Power Supply (E4), '
    + 'Start-of-turn Anchor Shot (E6). Streak on Anchor Shot II: set 2 hits on the play. Power Charge III\'s Defeat: add a second play. '
    + 'Not counted: Tenacity damage, Cost changes, draws, Shields',
  effects: [
    // Pulverize (in game): "When hitting a target holding Shield, increase Damage Amount by 20%"
    { kind: 'Buff', id: 'pulverize', name: 'Pulverize', category: 'Character', value: '20%', appliesTo: 'Pulverize', hitScope: 'All hits',
      condition: 'Always', counter: 'Target holding Shield', maxStacks: 1 },
    // 3-1 (in game): "+20% Damage Amount to Anchor and Power Anchor. The following effect is added to Anchor Shot: Increase Damage Amount by
    // 10%". The cards show the second part as "+10% Damage Amount to Anchor Shot" on Anchor and Power Anchor: additive, a stack for each
    // one played (owner, 2026-10-30)
    { kind: 'Buff', id: 'p3-1-anchors', name: 'Basic Card Proficiency', category: 'Potential', type: 'Card +', value: '+20%',
      appliesTo: 'Anchor/Power Anchor', hitScope: 'All hits', condition: 'Always' },
    { kind: 'Buff', id: 'p3-1-shot', name: 'Damage Amount to Anchor Shot', category: 'Potential', value: '+10%', appliesTo: ANCHOR_SHOT,
      hitScope: 'All hits', condition: 'Always', counter: 'Anchors played' },
    // 5-1 (in game): "+5% Damage Amount to Haru's Anchor and Power Anchor. If Haru's Attack is 500 or higher, add an additional +5% to the
    // modifier". Not unlocked by the owner
    { kind: 'Buff', id: 'p5-1-anchors', name: 'Basic Card Proficiency', category: 'Potential', type: 'Card +', value: '+5%',
      appliesTo: 'Anchor/Power Anchor', hitScope: 'All hits', condition: 'Always', attackBonus: { above: 500, value: '+5%', orEqual: true } },
    // 7 (in game): "+10% Damage Amount to Haru's Anchor Shot. If Haru's Attack is 600 or higher, add an additional +10% to the modifier"
    { kind: 'Buff', id: 'p7-shot', name: 'Unique Stat Upgrade', category: 'Potential', type: 'Card +', value: '+10%', appliesTo: ANCHOR_SHOT,
      hitScope: 'All hits', condition: 'Always', attackBonus: { above: 600, value: '+10%', orEqual: true } },
    // E2 Awakening Memory (in game): "... for each 1 AP spent less than the original Cost, decrease Damage Amount by 30%" (Prydwen: 40%)
    { kind: 'Buff', id: 'e2-short', name: 'Anchor Shot with insufficient AP', category: 'Ego Manifestation', value: '-30%', appliesTo: ANCHOR_SHOT,
      hitScope: 'All hits', condition: 'Always', egoLevel: 2, egoBelow: 6, counter: 'AP short of Cost', maxStacks: 2 },
    // E3 Vivid Memory (in game): "+200% Damage Amount to Power Strike and +20% to the Damage Amount for each beneficial effect in possession"
    // (Prydwen: +100%); the max on the card goes up to +800%
    { kind: 'Buff', id: 'e3-strike', name: 'E3 Vivid Memory', category: 'Ego Manifestation', value: '+200%', appliesTo: 'Power Strike',
      hitScope: 'All hits', condition: 'Always', egoLevel: 3 },
    // E4 Inner Memory (in game): "Power Supply: +30% Damage Amount to Haru's Attack Cards (max 3 stacks)" (Prydwen: +20%)
    { kind: 'Buff', id: 'e4-power-supply', name: 'Power Supply', category: 'Ego Manifestation', value: '+30%', appliesTo: 'Attack',
      hitScope: 'All hits', condition: 'Always', egoLevel: 4, counter: 'Power Supply', maxStacks: 3 },
    // E6 Liberated Memory (in game): "Change the Damage Amount decreased effect ... to 15% ... At the start of the turn, move 1 Anchor Shot card
    // to hand, and increase Damage Amount of that card by 30% until activated" (Prydwen: 20%, and it lacks the second part)
    { kind: 'Buff', id: 'e6-short', name: 'Anchor Shot with insufficient AP', category: 'Ego Manifestation', value: '-15%', appliesTo: ANCHOR_SHOT,
      hitScope: 'All hits', condition: 'Always', egoLevel: 6, counter: 'AP short of Cost', maxStacks: 2 },
    { kind: 'Buff', id: 'e6-moved', name: 'Anchor Shot moved to hand at the start of the turn', category: 'Ego Manifestation', value: '30%',
      appliesTo: ANCHOR_SHOT, hitScope: 'All hits', condition: 'Always', egoLevel: 6, counter: 'Start-of-turn Anchor Shot', maxStacks: 1 },
  ],
  // Card text: the in-game wording (owner's screenshots, 2026-10-30), with tokens for the build's numbers (engine/cardText.ts)
  cards: {
    // Ego skill: Prydwen has 350%, +50%, no max
    'card-637': {
      pct: 6,
      text: '{E3:800%|{600%}} Damage\n+{E3:80|60}% Damage Amount for each beneficial effect in possession (max +{E3:800|600}%)',
      effects: [
        cardBuff('per-effect', 'Damage Amount for each beneficial effect in possession', '+60%', 'Power Strike',
          { counter: 'Beneficial effects', maxStacks: 10, egoBelow: 3 }),
        cardBuff('per-effect-e3', 'Damage Amount for each beneficial effect in possession', '+80%', 'Power Strike',
          { counter: 'Beneficial effects', maxStacks: 10, egoLevel: 3 }),
      ],
    },
    'card-638': { text: '{100%} Damage\n{P3-1:+10% Damage Amount to Anchor Shot}' },
    'card-639': { text: '{220%} Damage\n{P3-1:+10% Damage Amount to Anchor Shot}' },
    'card-640': { text: '{100%} Shield', notes: 'Shield only, no damage' },

    // Anchor Shot, I–V. Prydwen's 3800% on IV is a typo for 380% (456% in game = (380% + 20%) x 1.14)
    'card-641': { text: `[Pulverize]\n{300%} Damage\n${activations('+100%')}`, effects: perActivation('+100%', 'Anchor Shot') },
    'card-642': { text: `[Pulverize]\n{400%} Damage\n${activations('+150%')}`, effects: perActivation('+150%', 'Anchor Shot I') },
    'card-643': { text: '[Pulverize]\n{350%} Damage\nStreak: Add 1 Hit', notes: 'Streak: set 2 hits on the play' },
    'card-644': {
      text: '[Retain / Pulverize]\n{350%} Damage\nDiscard all cards of other Combatants, then +150% Damage Amount for each card Discarded',
      effects: [cardBuff('per-discard', 'Damage Amount for each card Discarded', '+150%', 'Anchor Shot III', { counter: 'Cards Discarded' })],
    },
    'card-645': {
      pct: 3.8,
      text: `[Pulverize]\n{380%} Damage\n${activations('+100%')}\nCreate this card in Draw Pile (2 time(s) per battle)`,
      effects: perActivation('+100%', 'Anchor Shot IV'),
    },
    'card-646': {
      text: `[Pulverize]\n{350%} Damage\n${activations('+100%')}\nOn Critical Hit, move to hand (1 time per turn)`,
      effects: perActivation('+100%', 'Anchor Shot V'),
    },

    // Anchor Pointer, I–V
    'card-647': { text: MOVE },
    'card-648': { text: 'Apply Retrieve to all Anchor Shots' },
    'card-649': { text: `${MOVE}, then apply Retain to that card` },
    'card-650': { text: `[Retrieve]\n${MOVE}` },
    'card-651': {
      text: `${MOVE}, then increase Damage Amount of that card by 20% for 1 turn until activated`,
      effects: [cardBuff('moved', 'Damage Amount of that card for 1 turn until activated', '20%', ANCHOR_SHOT, { counter: 'Anchor Pointer IV', maxStacks: 1 })],
    },
    'card-652': {
      text: `${MOVE}, then +25% Critical Chance to that card for 1 turn until activated`,
      effects: [cardBuff('moved-crit', 'Critical Chance to that card for 1 turn until activated', '25%', ANCHOR_SHOT,
        { type: 'Crit Chance', counter: 'Anchor Pointer V', maxStacks: 1 })],
    },

    // Power Charge, I–V. Prydwen's %s are older: 180 / 270 / 270 / 270 / 240 / 300, single target +80% / +120%, IV +30%
    'card-653': {
      pct: 2.4,
      text: `{240%} ${ALL_ENEMIES}\nIf there is only one target, +100% Damage Amount`,
      effects: singleTarget('+100%', 'Power Charge'),
    },
    'card-654': {
      pct: 3.2,
      text: `{320%} ${ALL_ENEMIES}\nIf there is only one target, +150% Damage Amount`,
      effects: singleTarget('+150%', 'Power Charge I'),
    },
    'card-655': { pct: 3.2, text: `[Weakness Attack]\n{320%} ${ALL_ENEMIES}` },
    'card-656': { text: `{270%} ${ALL_ENEMIES}\nDefeat: Activate effect 1 more time (max 1 time)`, notes: 'Defeat: add a second play' },
    'card-657': {
      pct: 2.7,
      text: `{270%} ${ALL_ENEMIES}\nFor each target hit, +50% Damage Amount to the next Attack Card of this unit activated`,
      effects: [cardBuff('next-attack', 'For each target hit, Damage Amount to the next Attack Card of this unit', '+50%', 'Attack',
        { counter: 'Power Charge IV targets hit' })],
    },
    'card-658': { pct: 3.2, text: `{320%} ${ALL_ENEMIES}\nStreak: Change Cost of this card to 1` },

    // Charge Energy, I–V. Prydwen's Costs (1) and buffs (30 / 40 / 50 / 30 / 20%) are older, except III
    'card-659': {
      cost: 0,
      text: '[Retain]\nIncrease Damage Amount of Attack Cards of this unit by 50% for 1 turn',
      effects: [chargeEnergy('50%', 'Charge Energy')],
    },
    'card-660': {
      cost: 0,
      text: '[Retain]\nFor 1 turn, increase Damage Amount of Attack Cards of this unit by 50% and +20% Critical Chance',
      effects: [
        chargeEnergy('50%', 'Charge Energy I'),
        cardBuff('attack-crit', 'Critical Chance of Attack Cards of this unit for 1 turn', '20%', 'Attack',
          { type: 'Crit Chance', counter: 'Charge Energy I', maxStacks: 1 }),
      ],
    },
    'card-661': {
      cost: 0,
      text: '[Retain]\nIncrease Damage Amount of the next Attack Card of this unit activated by 100%, and +2 to Tenacity Damage',
      effects: [cardBuff('next-attack', 'Damage Amount of the next Attack Card of this unit', '100%', 'Attack', { counter: 'Charge Energy II', maxStacks: 1 })],
    },
    'card-662': {
      text: '[Retain]\n+70% Damage Amount to Attack Cards of this unit for each card of this unit in hand for 1 turn',
      effects: [cardBuff('per-hand', 'Damage Amount to Attack Cards of this unit for each card of this unit in hand', '+70%', 'Attack',
        { counter: 'Cards of this unit in hand' })],
    },
    'card-663': {
      cost: 0,
      text: '[Retain]\nIncrease Damage Amount of Attack Cards of this unit by 50% for 1 turn\nDraw 1 card(s) of this unit',
      effects: [chargeEnergy('50%', 'Charge Energy IV')],
    },
    'card-664': {
      text: '[Unique]\nIncreases Damage Amount of Attacks Cards of this unit by 40%',
      effects: [cardBuff('attack-cards', 'Damage Amount of Attack Cards of this unit', '40%', 'Attack')],
    },

    // Lift Anchor: 120% from E1
    'card-665': {
      text: '[Retain]\nIncrease Damage Amount of Anchor Shot in hand by {E1:120|80}% for 1 turn until activated',
      effects: [
        cardBuff('in-hand', 'Damage Amount of Anchor Shot in hand', '80%', ANCHOR_SHOT, { counter: 'Lift Anchor', maxStacks: 1, egoBelow: 1 }),
        cardBuff('in-hand-e1', 'Damage Amount of Anchor Shot in hand', '120%', ANCHOR_SHOT, { counter: 'Lift Anchor', maxStacks: 1, egoLevel: 1 }),
      ],
    },
  },
} satisfies CharacterAdditions
