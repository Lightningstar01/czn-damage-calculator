// Anika: our additions to the Prydwen import (src/data/prydwen/anika.json). Card keys are the import's ids.
// Damage % follows the "+" rule: 'by 20%' (no "+") = multiplicative, '+20%' = additive (owner, 2026-10-25).
// Shockwave's number is turns, not stacks: a flat +50% Damage Amount taken on a Ravaged target, on every ally's hits, the applying hit included (owner, 2026-11-01).
// Stampede gives Anika +10% per stack and allies +5%: 2x replaces the amount for her (owner, 2026-11-01).
// Ignition Slash V's Coordinated Attack goes off on anyone's Basic Attack (owner, 2026-11-01). It's Anika's Extra Attack, like Selena's (owner, 2026-10-28).
import type { CharacterAdditions } from '../../engine/types'
import { cardBuff, effectHits, EGO_POTENTIALS_PLUS_3 } from '../helpers'

const effectHit = effectHits({ element: 'Order', kind: 'Extra Attack' })

export default {
  verified: { date: '2026-11-01', gameVersion: '841' },
  notes: 'Card upgrades are set on the Setup tab. Per play (Cards tab): Target Ravaged (Destroy, Shockwave), Shockwave on the target, Stampede (E2: 0 to 5, on anyone\'s Attack Cards), '
    + 'Lead cards in All Piles (Ignition Slash III), Warming Up II on the next base 2-Cost or higher Attack Card (2 with Efficiency), Attack Cards in hand for Warming Up IV. '
    + 'Not counted: Tenacity Damage and Shockwave\'s 2x Tenacity Damage, AP, draws, cost changes, Lead\'s 50% cost chance, Efficiency\'s conditions, other enemies (all-enemy damage counts one target)',
  // Potential nodes in the game's wording (owner's screenshots, 2026-11-01)
  potentials: {
    '3-1': { text: 'Adds Lead to the Blaster Swing card and the Position Hold card.' },
    '5-1': { text: "+5% Damage Amount to Anika's Blaster Swing\nIf Anika's Attack is 250 or higher, add an additional +10% to the modifier" },
    '7': { text: "If Anika's Attack is 500 or higher, +10% Attack" },
  },
  // Manifest Ego in the game's wording (owner's screenshots, 2026-11-01)
  ego: {
    1: { text: 'The following effect is added to Rampage Trigger: On Ravage, move from Draw Pile to hand.' },
    2: { text: 'When allies activate a Lead card, gain 1 Next Turn Stampede, and when allies activate a Finale card, gain 2 Next Turn Stampede.\nStampede: +5% Damage Amount to ally Attack Cards and apply 2x that amount for Anika. At the end of the turn, remove effect (max 5 stacks).' },
    3: { text: EGO_POTENTIALS_PLUS_3 },
    4: { text: 'For Buffalo Dive, +50% Damage Amount and increase Tenacity Damage by 1.' },
    5: { text: EGO_POTENTIALS_PLUS_3 },
    6: { text: 'On Ravage by allies, gain 2 Stampede and 1 AP (1 time per turn).' },
  },
  effects: [
    // Shockwave (in game): "For 1 turn(s), increase Tenacity Damage taken of the target by 2x, and if in a Ravage state, +50% Damage Amount taken"
    { kind: 'Buff', id: 'shockwave', name: 'Shockwave: Damage Amount taken', category: 'Character', target: 'enemy', value: '+50%', appliesTo: 'ALL', hitScope: 'All hits',
      condition: 'Ravaged only', counter: 'Shockwave', maxStacks: 1 },
    // 5-1 is locked for the owner: Card + like the other characters' 5-1 (Unconfirmed). 7's +10% Attack is on the stats screen, like Owen's 7 (User, 2026-11-01)
    { kind: 'Buff', id: 'p5-1-blaster-swing', node: '5-1', name: 'Basic Card Proficiency', category: 'Potential', type: 'Card +', value: '+5%',
      appliesTo: 'Blaster Swing', hitScope: 'All hits', condition: 'Always', thresholdBonus: { above: 250, value: '+10%', orEqual: true } },
    // E2 Awakening Memory: an ally effect also reaches its owner, so Anika's own part adds the other +5%
    { kind: 'Buff', id: 'e2-stampede', name: 'Stampede: ally Attack Cards', category: 'Ego Manifestation', target: 'allies', value: '+5%', appliesTo: 'Attack', hitScope: 'All hits',
      condition: 'Always', counter: 'Stampede', maxStacks: 5, egoLevel: 2 },
    { kind: 'Buff', id: 'e2-stampede-anika', name: 'Stampede: 2x for Anika', category: 'Ego Manifestation', value: '+5%', appliesTo: 'Attack', hitScope: 'All hits',
      condition: 'Always', counter: 'Stampede', maxStacks: 5, egoLevel: 2 },
    // E4 Inner Memory: the same wording as Selena's E4, additive under the "+" rule (Unconfirmed: locked for the owner)
    { kind: 'Buff', id: 'e4-ego-skill', name: 'Damage Amount of Buffalo Dive', category: 'Ego Manifestation', type: 'Base %', value: '+50%', appliesTo: 'Buffalo Dive', hitScope: 'All hits',
      condition: 'Always', egoLevel: 4 },
  ],
  // Card text: the in-game wording (owner's screenshots, 2026-11-01), with tokens for the build's numbers (engine/cardText.ts)
  cards: {
    'card-1352': { text: '{E4:300%|{250%}} Damage to all enemies\n{E4:3|2} Tenacity Damage' },
    'card-1353': { nodeTags: { '3-1': 'Lead' }, text: '{P3-1:[Lead]}\n{100%} Damage' },
    'card-1354': { nodeTags: { '3-1': 'Lead' }, text: '{P3-1:[Lead]}\n{100%} Shield' },

    // Ignition Slash, I-V
    'card-1355': { text: '[Lead]\n{400%} Damage\n2 Tenacity Damage\nEfficiency: Gain 1 AP' },
    'card-1356': { text: '[Lead / Weakness Attack]\n{550%} Damage\n2 Tenacity Damage\nEfficiency: Gain 1 AP' },
    'card-1357': { text: '[Lead]\n{450%} Damage\n2 Tenacity Damage\nRavage: Gain 2 AP' },
    'card-1358': {
      text: '[Lead]\n{500%} Damage\n2 Tenacity Damage\n+80% Damage Amount for each Lead card in All Piles',
      effects: [cardBuff('lead-cards', 'Damage Amount for each Lead card in All Piles', '+80%', 'Ignition Slash III', { counter: 'Lead cards in All Piles' })],
    },
    'card-1359': { text: '[Lead / Retain]\n{400%} Damage\nGain 1 AP\nEfficiency: Draw 1 2-Cost or higher card(s), then Retain that card for 1 turn' },
    // In game 100% at Signature level 7, where the others are raised: the hit is an effect's, not the card's
    'card-1360': {
      text: '[Unique / Initiation]\nWhen a Basic Attack Card is activated, 100% Coordinated Attack and 1 Tenacity Damage to the target',
      triggers: [{ card: 'coordinated', on: 'Basic Attack' }],
    },

    // Shock Gun, I-V
    'card-1361': { text: '[Bullet / Lead]\n{150%} Damage\n1 Shockwave\nEfficiency: 1 Tenacity Damage' },
    'card-1362': { text: '[Bullet / Lead]\n{220%} Damage\n1 Shockwave\nEfficiency: 2 Tenacity Damage' },
    'card-1363': { text: '[Bullet / Lead]\n{200%} Damage to all enemies\n1 Shockwave\nEfficiency: 1 Tenacity Damage' },
    'card-1364': { text: '[Bullet / Combo]\n{150%} Damage\n2 Tenacity Damage' },
    // A Skill in game (Prydwen Attack)
    'card-1365': { cardType: 'Skill', text: '[Lead / Exhaust]\n3 Shockwave' },
    'card-1366': { text: '[Bullet / Lead]\n{200%} Damage\nEach Bullet card in hand has a 50% chance to have its Cost decreased by 1 for 1 turn or until activated' },

    // Reloading, I-V
    'card-1367': { text: '[Finale]\nAt the start of the next turn, Draw 2 Lead card(s) of this unit' },
    'card-1368': { text: '[Finale]\nAt the start of the next turn, Draw 2 Lead card(s)' },
    'card-1369': { text: '[Finale]\nAt the start of the next turn, Draw 2 Lead card(s) of this unit, then decrease Cost of those cards by 1 for 1 turn or until activated' },
    'card-1370': { text: '[Finale]\nFor each Lead card in hand at the end of the turn, Draw a Lead card next turn' },
    'card-1371': { text: '[Finale]\nAt the start of the next turn, Draw 1 Lead card(s)\nOn Ravage, move to hand' },
    'card-1372': { text: '[Finale]\nAt the start of the next turn, Draw 5 card(s) of this unit, then Hand Lock for 1 turn' },

    // Warming Up, I-V
    'card-1373': { text: '[Lead / Retain]\nFor 1 turn, decrease Cost of the next card of this unit activated by 1\nEfficiency: Draw 1 Lead Attack Card(s) of this unit' },
    'card-1374': { text: '[Lead / Retain]\nFor 1 turn, decrease Cost of the next card of this unit activated by 2\nEfficiency: Draw 1 Lead Attack Card(s) of this unit' },
    'card-1375': {
      text: '[Lead / Retain]\nFor 1 turn, increase Damage Amount of the next base 2-Cost or higher Attack Card of this unit activated by 50%\nEfficiency: Apply 2x the effect',
      effects: [cardBuff('next-attack', 'Damage Amount of the next base 2-Cost or higher Attack Card', '50%', 'Attack & 2+ cost', { counter: 'Warming Up II (2 with Efficiency)', maxStacks: 2 })],
    },
    'card-1376': { text: '[Lead / Retain]\nFor 1 turn, decrease Cost of the next card of this unit activated by 1\nRetain: Draw 1 Lead card(s) of this unit' },
    'card-1377': {
      text: '[Lead / Retain]\nFor 1 turn, increase Damage Amount of Attack Cards of this unit by 25% for each Attack Card of this unit in hand\nEfficiency: Decrease Cost of Attack Cards of this unit in hand by 1 for 1 turn',
      effects: [cardBuff('attack-cards', 'Damage Amount for each Attack Card in hand', '25%', 'Attack', { counter: 'Warming Up IV: Attack Cards in hand' })],
    },
    'card-1378': { text: '[Unique / Lead]\nFor 1 turn, for each ally, decrease Cost of the next Lead card activated by that ally by 1' },

    // Prydwen's "* 4" was read as 1 hit
    'card-1379': {
      hits: 4,
      text: '[Weakness Attack]\n{100%} Damage × 4\n{E1:On Ravage, move from Draw Pile to hand}\nDestroy: +100% Damage Amount',
      effects: [cardBuff('destroy', 'Destroy: Damage Amount', '+100%', 'Rampage Trigger', { condition: 'Ravaged only' })],
    },
  },
  extraCards: [
    effectHit('coordinated', 'Coordinated Attack', 1, '100% Coordinated Attack and 1 Tenacity Damage to the target', { tags: 'Coordinated Attack' }),
  ],
} satisfies CharacterAdditions
