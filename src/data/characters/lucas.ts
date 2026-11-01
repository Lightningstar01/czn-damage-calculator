// Lucas: our additions to the Prydwen import (src/data/prydwen/lucas.json). Card keys are the import's ids.
// Damage % follows the "+" rule: 'by 20%' (no "+") = multiplicative, '+20%' = additive (owner, 2026-10-25).
// R.P.G-7 "When Bullet cards are Exhausted": a hit per Bullet card with Exhaust played, by anyone (S.S.S V likewise on any Bullet card), per Bullet Flame Thrower IV
// exhausts and per Bullet Ephemeral exhausts at the end of the turn (a count per play). Machine Gun with 3-1 has Bullet but not Exhaust, so it doesn't count (owner, 2026-11-01).
// Flame Thrower III "On Critical Hit": the hit counts x the card's crit chance; it's a normal hit that can crit too (owner, 2026-11-01).
// Flame Thrower IV "Increase base Damage Amount by 50% for each Exhausted card" raises the card %: 302% x (1 + 50% x 2) = 604% (owner, 2026-11-01).
// Flashbang II / V reach only Lucas's hits (owner, 2026-11-01).
// Flashbang IV's Mark is Lucas's own 100% Extra Attack, on a counter apart from Selena's Mark (owner, 2026-11-01).
// Agony, Impair and Weaken are text only; Agony waits for the DoT work (owner, 2026-11-01).
import type { CardPreset, CharacterAdditions } from '../../engine/types'
import { cardBuff, effectHits, EGO_POTENTIALS_PLUS_3 } from '../helpers'

const launcherBullets = ['card-303', 'card-304', 'card-305', 'card-306', 'card-307']
// Not the Bullet tag: Machine Gun gets that from 3-1, and it isn't a Launcher Bullet
const launcherBullet = ['Armor-Piercing Rounds', 'Explosive Shot', 'Dispersing Shot', 'Cold Shot', 'Flame Shot'].join('/')

const effectHit = effectHits({ element: 'Passion', scaling: 'Fixed', upgrade: undefined })

/** A hit a card sets off, with that card's art: a card upgrade counts as on the card (Fixed: only with the potentialFixed setting). */
const hit = (id: string, name: string, pct: number, art: string, text: string, extra: Partial<CardPreset> = {}) =>
  effectHit(id, name, pct, text, { image: `cards/lucas/${art}.webp`, ...extra })

const targetShield = (id: string, name: string, value: string, appliesTo: string) =>
  cardBuff(id, name, value, appliesTo, { counter: 'Target has Shield', maxStacks: 1 })
const bulletDamage = (counter: string) => cardBuff('bullet-dmg', 'Bullet card Damage', '+40%', 'Bullet', { counter })
// Same keyword as on Selena: a debuff on the target for every ally's Passion cards, switched on per play
const passionWeakness = cardBuff('passion-weakness', 'Passion Weakness', 'Weakness Attack', 'Passion',
  { target: 'enemy', counter: 'Passion Weakness', maxStacks: 1 })

const bullet = (keywords: string, effect: string) => `[${keywords}]\n{140%} Damage\n{70%} Damage to another enemy\n${effect}`

export default {
  verified: { date: '2026-11-01', gameVersion: '841' },
  notes: 'Stat potentials are in the stats screen; card upgrades are set on the Setup tab. Per play (Cards tab): S.S.S / I / II and their Bullet '
    + 'buff (on for that turn\'s plays, stacks if played twice), S.S.S III\'s Bullet cards in hand, S.S.S IV on the next Bullet card, S.S.S V on that turn\'s plays, '
    + 'Bullets Exhausted on Flame Thrower IV, Bullets exhausted by Ephemeral (on any play, with R.P.G-7), Target has Shield, Flashbang II on a Shield target, '
    + 'Passion Weakness, Mark (Lucas). R.P.G-7 and Flame Thrower III\'s Critical Hit add their hits by themselves. '
    + 'Not counted: the Launcher Bullets\' 70% to another enemy (one target), Agony, Impair, Weaken, Shields, cost changes',
  // Potential nodes in the game's wording (owner's screenshots, 2026-11-01)
  potentials: {
    '3-1': { text: 'Add Bullet to the Machine Gun card.' },
    '5-1': { text: "+5% Damage Amount to Lucas's Machine Gun\nIf Lucas's Critical Damage is 160% or higher, add an additional +5% to the modifier" },
    '7': { text: "+5% Damage Amount to Launcher Bullet\nIf Lucas's Critical Damage is 240% or higher, add an additional +5% to the modifier" },
  },
  // Manifest Ego in the game's wording (owner's screenshots, 2026-11-01)
  ego: {
    1: { text: '+10% Fixed Damage for R.P.G-7.' },
    2: { text: "Lucas's Bullet card damage is increased by +20%." },
    3: { text: EGO_POTENTIALS_PLUS_3 },
    4: { text: '+50% Damage Amount to Full Burst, and increase Draw by 1.' },
    5: { text: EGO_POTENTIALS_PLUS_3 },
    6: { text: 'Decrease Cost of the first Launcher Bullet card activated each turn by 1.' },
  },
  effects: [
    // 5-1 and 7 raise the card %, by the owner's rule for Potential nodes (both locked for the owner, so not seen on a card; in-game test lucas-readings)
    { kind: 'Buff', id: 'p5-1-gun', node: '5-1', name: 'Basic Card Proficiency', category: 'Potential', type: 'Card +', value: '+5%', appliesTo: 'Machine Gun',
      hitScope: 'All hits', condition: 'Always', thresholdStat: 'Critical Damage', thresholdBonus: { above: 1.6, value: '+5%', orEqual: true } },
    { kind: 'Buff', id: 'p7-bullet', node: '7', name: 'Unique Stat Upgrade', category: 'Potential', type: 'Card +', value: '+5%', appliesTo: launcherBullet,
      hitScope: 'All hits', condition: 'Always', thresholdStat: 'Critical Damage', thresholdBonus: { above: 2.4, value: '+5%', orEqual: true } },
    // E1: 50% on the card at x1.12, so 40% + 10%, unraised
    { kind: 'Buff', id: 'e1-rpg', name: 'E1 Sleeping Memory', category: 'Ego Manifestation', type: 'Base %', value: '+10%',
      appliesTo: 'R.P.G-7 Fixed Damage', hitScope: 'All hits', condition: 'Always', egoLevel: 1 },
    // E2 isn't in the shown %: the Launcher Bullets show 157% = 140% x 1.12 at E6
    { kind: 'Buff', id: 'e2-bullet', name: 'E2 Awakening Memory', category: 'Ego Manifestation', value: '+20%',
      appliesTo: 'Bullet', hitScope: 'All hits', condition: 'Always', egoLevel: 2 },
    // E4: Full Burst 300% = 250% + 50% (an Ego skill has no upgrade)
    { kind: 'Buff', id: 'e4-burst', name: 'E4 Inner Memory', category: 'Ego Manifestation', value: '+50%',
      appliesTo: 'Full Burst', hitScope: 'All hits', condition: 'Always', egoLevel: 4 },
  ],
  // Card text: the in-game wording (owner's screenshots, 2026-11-01), with tokens for the build's numbers (engine/cardText.ts)
  cards: {
    'card-275': { text: 'Draw {E4:3|2}\n{E4:300%|{250%}} Damage to all enemies' },
    'card-276': { nodeTags: { '3-1': 'Bullet' }, text: '{P3-1:[Bullet]}\n{100%} Damage' },
    'card-277': { text: '{100%} Shield' },

    // Extended Magazine, I–V
    'card-278': { creates: launcherBullets, text: '[Lead]\nAt the start of the turn, create 1 Launcher Bullet' },
    'card-279': { creates: launcherBullets, text: '[Initiation]\nAt the start of the turn, create 1 Launcher Bullet' },
    'card-280': { creates: launcherBullets, text: '[Lead]\nAt the start of the turn, create 2 Launcher Bullet' },
    'card-281': { creates: launcherBullets, text: '[Lead]\nAt the start of the turn, create 1 Launcher Bullet, and with a 50% chance, decrease Cost of those cards by 1 for 1 turn until activated' },
    'card-282': { creates: launcherBullets, text: '[Lead]\nAt the start of the turn, create 1 Launcher Bullet\n50% chance to Draw 1' },
    'card-283': { creates: launcherBullets, text: '[Exhaust]\nCreate 5 Launcher Bullet' },

    // S.S.S, I–V
    'card-284': { text: '{100%} Damage\nFor 1 turn, +40% Bullet card Damage', effects: [bulletDamage('S.S.S')] },
    'card-285': { text: '{200%} Damage\nFor 1 turn, +40% Bullet card Damage', effects: [bulletDamage('S.S.S I')] },
    'card-286': { text: 'For 2 turns, +40% Bullet card Damage', effects: [bulletDamage('S.S.S II')] },
    'card-287': {
      text: '{150%} Damage\n+60% Damage per Bullet card in hand',
      effects: [cardBuff('per-bullet', 'Damage per Bullet card in hand', '+60%', 'S.S.S III', { counter: 'Bullet cards in hand' })],
    },
    'card-288': {
      text: '{150%} Damage\n+120% Damage Amount to the next Bullet card activated',
      effects: [cardBuff('next-bullet', 'Damage Amount to the next Bullet card', '+120%', 'Bullet', { counter: 'S.S.S IV', maxStacks: 1 })],
    },
    'card-289': {
      text: '{100%} Damage\nFor 1 turn(s), when a Bullet card is activated, {F50%} Fixed Damage to a random enemy',
      triggers: [{ card: 'sss-v-hit', on: 'Bullet', counter: 'S.S.S V', maxStacks: 1 }],
    },

    // Flame Thrower, I–V
    'card-290': { text: '{180%} Damage to all enemies\nDraw 1\nDiscard 1' },
    'card-291': { creates: launcherBullets, text: '{180%} Damage to all enemies\nDraw 1\nDiscard 2\nCreate Launcher Bullet for each Discarded' },
    'card-292': { text: '{315%} Damage to all enemies\nDraw 1\nDiscard 1' },
    'card-293': {
      text: '{270%} Damage to all enemies\nOn Critical Hit, {150%} Damage to all enemies',
      triggers: [{ card: 'flame-crit-hit', on: 'Flame Thrower III', own: true, onCrit: true }],
    },
    // Prydwen: "Increase Damage Amount by 50%"
    'card-294': {
      text: 'Exhaust up to 2 Bullet(s) in hand\n{270%} Damage to all enemies\nIncrease base Damage Amount by 50% for each Exhausted card',
      effects: [cardBuff('exhausted', 'base Damage Amount for each Exhausted card', '50%', 'Flame Thrower IV', { type: 'Card %', counter: 'Bullets Exhausted', maxStacks: 2 })],
    },
    'card-295': { creates: launcherBullets, text: '{270%} Damage to all enemies\nCreate Launcher Bullet equal to number of targets hit' },

    // Flashbang, I–V
    'card-296': { text: '{120%} Damage to all enemies\n2 Weaken\nIf the target has Shield, +50% Damage', effects: [targetShield('shield', 'If the target has Shield', '+50%', 'Flashbang')] },
    'card-297': { text: '{180%} Damage to all enemies\n2 Weaken\nIf the target has Shield, +75% Damage', effects: [targetShield('shield', 'If the target has Shield', '+75%', 'Flashbang I')] },
    'card-298': {
      text: 'For 1 turn, when hitting a target with Shield, +50% Damage',
      effects: [cardBuff('shield-turn', 'When hitting a target with Shield', '+50%', 'ALL', { counter: 'Flashbang II on a Shield target', maxStacks: 1 })],
    },
    'card-299': { text: '[Retain]\n{180%} Damage to all enemies\n2 Passion Weakness', effects: [passionWeakness] },
    'card-300': {
      text: '{180%} Damage to all enemies\n2 Mark\nIf the target has Shield, +50% Damage',
      effects: [targetShield('shield', 'If the target has Shield', '+50%', 'Flashbang IV')],
      triggers: [{ card: 'mark-hit', on: 'Attack', counter: 'Mark (Lucas)' }],
    },
    'card-301': {
      text: 'When hitting a target that has Shield, increase Damage Amount by 30%',
      effects: [targetShield('shield-all', 'When hitting a target that has Shield', '30%', 'ALL')],
    },

    // Prydwen: "40 Fixed Damage"; 50% in game at E1. With the potentialFixed setting the text raises the whole 50%, the hit only the 40%.
    'card-302': {
      text: 'When Bullet cards are Exhausted, {E1:{F50%}|{F40%}} Fixed Damage',
      triggers: [
        { card: 'rpg-hit', on: 'Bullet & Exhaust' },
        { card: 'rpg-hit', on: 'Flame Thrower IV', counter: 'Bullets Exhausted', maxStacks: 2, perStack: true },
        { card: 'rpg-hit', on: 'ALL', counter: 'Bullets exhausted by Ephemeral', perStack: true },
      ],
    },

    // Launcher Bullets
    'card-303': {
      text: bullet('Exhaust / Ephemeral / Bullet', 'If the target has Shield, +30% Damage Amount'),
      effects: [targetShield('shield', 'If the target has Shield', '+30%', 'Armor-Piercing Rounds')],
    },
    'card-304': { text: bullet('Exhaust / Ephemeral / Bullet', '1 Weaken to all enemies') },
    'card-305': { text: bullet('Exhaust / Ephemeral / Bullet', '1 Impair to all enemies') },
    'card-306': { text: bullet('Exhaust / Ephemeral / Bullet / Haste', 'Increases Action Count of all enemies by 1') },
    'card-307': { text: bullet('Exhaust / Ephemeral / Bullet', '1 Agony to all enemies') },
  },
  extraCards: [
    hit('rpg-hit', 'R.P.G-7 Fixed Damage', 0.4, 'unique_1021_02', 'When Bullet cards are Exhausted, {F40%} Fixed Damage'),
    hit('sss-v-hit', 'S.S.S V Fixed Damage', 0.5, 'unique_1021_01', 'When a Bullet card is activated, {F50%} Fixed Damage to a random enemy'),
    // Raised like the card's own line: 168% = 150% x 1.12
    hit('flame-crit-hit', 'Flame Thrower III (On Critical Hit)', 1.5, 'unique_1021_05', 'On Critical Hit, {150%} Damage to all enemies', { scaling: 'ATK', kind: 'Normal', notACard: false }),
    hit('mark-hit', 'Mark (Lucas)', 1, 'unique_1021_04', 'When an Attack Card is activated, inflict 100% Extra Attack and decrease Mark by 1',
      { scaling: 'ATK', kind: 'Extra Attack', upgrade: null }),
  ],
} satisfies CharacterAdditions
