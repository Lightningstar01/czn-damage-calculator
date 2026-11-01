// Yuki: our additions to the Prydwen import (src/data/prydwen/yuki.json). Card keys are the import's ids.
// Damage % follows the "+" rule: 'by 20%' (no "+") = multiplicative, '+20%' = additive (owner, 2026-10-25).
// Inspiration is switched on per play: it adds the card's hit (counterHits), Rapid Slash's 30% and Freezing Blade's hit. Freezing Blade's
// and Trickery Strike III's hits are effect hits of normal damage, unraised by the Signature level and skipped by Attack Card buffs (owner, 2026-10-30).
// Potential 7 adds to the base % before the upgrade (Card +), measured at Attack 830: Flash Slash 258% = (220% + 10%) x 1.12,
// Iceberg Cleave 213% = (180% + 10%) x 1.12.
import type { CharacterAdditions } from '../../engine/types'
import { cardBuff, effectHits, EGO_POTENTIALS_PLUS_3 } from '../helpers'

/** A hit from an effect, not a card: unraised by card upgrades. */
const effectHit = effectHits({ element: 'Order' })

const inspiration = { counter: 'Inspiration', maxStacks: 1 }
const addHit = { counterHits: { counter: 'Inspiration', hits: 1 } }

// "Flash Slash" reaches every epiphany; IV is the only one that doesn't target all enemies
const flash = ['Flash Slash', 'Flash Slash I', 'Flash Slash II', 'Flash Slash III', 'Flash Slash IV', 'Flash Slash V']
const flashAndIceberg = [...flash, 'Iceberg Cleave'].join('/')
const allTargetAttacks = [...flash.filter((n) => n !== 'Flash Slash IV'), 'Iceberg Cleave'].join('/')

const singleTarget = 'If there is only a single target, increase Damage Amount by 50%'
const flashSingle = (card: string) => [cardBuff('single-target', singleTarget, '50%', card, { hint: 'Single target' })]

/** Prepare to Subdue: "Increase Damage Amount of those cards ... for 1 turn", switched on per play on the drawn card. */
const drawnBuff = (value: string, counter: string) =>
  [cardBuff('drawn', 'Damage Amount of those cards for 1 turn', value, 'Attack', { counter, maxStacks: 1 })]

/** Freezing Blade: its hit on every Inspiration-enabled card activated. */
const onInspiration = (card: string) => [{ card, on: 'ALL', ...inspiration }]

export default {
  verified: { date: '2026-10-30', gameVersion: '841' },
  notes: 'Card upgrades are set on the Setup tab. Per play (Cards tab), on Yuki\'s own cards: Inspiration (adds the "Add 1 Hit", Rapid Slash\'s '
    + '30% and Freezing Blade\'s hit), Trickery Strike III (on the Inspiration plays of that turn), Prepare to Subdue / I-IV on the cards they '
    + 'buff, Cards Drawn this turn (Flash Slash IV), Cards moved to Draw Pile (Ego skill), Sword Dance (E4), Swiftblade Flurry (E6). Not '
    + 'counted: Cost changes, draws, Shields',
  // Potential nodes in the game's wording (owner's screenshots, 2026-10-30)
  potentials: {
    '3-1': { text: 'Adds the following effects:\nInspiration: Decrease Cost by 1, to Longsword Slash\nInspiration: Increase Damage Amount by 30%, to Rapid Slash' },
    '5-1': { text: "+5% Damage Amount to Yuki's Longsword Slash and Rapid Slash\nIf Yuki's Attack is 500 or higher, add an additional +5% to the modifier" },
    '7': { text: "If Yuki's Attack is 600 or higher, +5% Damage Amount to Flash Slash and Iceberg Cleave.\nFor every 20 Attack above 600, add an additional +1% to the modifier (additional +5% max)" },
  },
  // Manifest Ego in the game's wording (owner's screenshots, 2026-10-31)
  ego: {
    1: { text: 'Add the following to Iceberg Cleave: If there is only a single target, increase Damage Amount by 50%.' },
    2: { text: 'At the start of battle, for 3 turns, enable Inspiration for cards of this unit drawn at the start of the turn.' },
    3: { text: '+150% Damage Amount to Skyscraper Cleave and change the +100% Damage Amount for each card moved to top of Draw Pile to +150%' },
    4: { text: 'Each time a card of this unit is Drawn through an ability, gain 1 Sword Dance.\nSword Dance: Increases Damage Amount of Attack Cards of this unit by 10% (max 3 stacks)' },
    5: { text: EGO_POTENTIALS_PLUS_3 },
    6: { text: 'Increase max stacks of Sword Dance by 1 and change the Damage Amount increase effect to 15%.\nIf Sword Dance is stacked to 4, gain 1 Swiftblade Flurry.\nSwiftblade Flurry: Increase Damage Amount of Flash Slash and Iceberg Cleave by 20%' },
  },
  effects: [
    // 3-1 (in game): "Inspiration: Decrease Cost by 1, to Longsword Slash. Inspiration: Increase Damage Amount by 30%, to Rapid Slash"
    { kind: 'Buff', id: 'p3-1-rapid', node: '3-1', name: 'Inspiration: Increase Damage Amount', category: 'Potential', value: '30%', appliesTo: 'Rapid Slash',
      hitScope: 'All hits', condition: 'Always', ...inspiration },
    // 5-1 (in game): "+5% Damage Amount to Yuki's Longsword Slash and Rapid Slash. If Yuki's Attack is 500 or higher, add an additional +5%
    // to the modifier". Not unlocked by the owner (Rapid Slash 224% = 220% x 1.02)
    { kind: 'Buff', id: 'p5-1-basic', node: '5-1', name: 'Basic Card Proficiency', category: 'Potential', type: 'Card +', value: '+5%',
      appliesTo: 'Longsword Slash/Rapid Slash', hitScope: 'All hits', condition: 'Always', thresholdBonus: { above: 500, value: '+5%', orEqual: true } },
    // 7 (in game): "If Yuki's Attack is 600 or higher, +5% Damage Amount to Flash Slash and Iceberg Cleave. For every 20 Attack above 600,
    // add an additional +1% to the modifier (additional +5% max)" (Prydwen: every 80)
    { kind: 'Buff', id: 'p7-flash-iceberg', node: '7', name: 'Unique Stat Upgrade', category: 'Potential', type: 'Card +', value: '+5%',
      appliesTo: flashAndIceberg, hitScope: 'All hits', condition: 'Always', thresholdMin: 600,
      thresholdBonus: { above: 600, value: '+1%', every: 20, max: '+5%' } },
    // E1 Sleeping Memory (in game): "Add the following to Iceberg Cleave: If there is only a single target, increase Damage Amount by 50%"
    // (Prydwen: removes a 20% decrease that the card doesn't have in game)
    { kind: 'Buff', id: 'e1-iceberg', name: singleTarget, category: 'Ego Manifestation', value: '50%', appliesTo: 'Iceberg Cleave',
      hitScope: 'All hits', condition: 'Always', egoLevel: 1, hint: 'Single target' },
    // E3 Vivid Memory (in game): "+150% Damage Amount to Skyscraper Cleave and change the +100% Damage Amount for each card moved to top
    // of Draw Pile to +150%" (Prydwen: +50% to +80% only)
    { kind: 'Buff', id: 'e3-cleave', name: 'E3 Vivid Memory', category: 'Ego Manifestation', value: '+150%', appliesTo: 'Skyscraper Cleave',
      hitScope: 'All hits', condition: 'Always', egoLevel: 3 },
    // E4 Inner Memory (in game): "Each time a card of this unit is Drawn through an ability, gain 1 Sword Dance. Sword Dance: Increases
    // Damage Amount of Attack Cards of this unit by 10% (max 3 stacks)" (Prydwen: max 2, for 1 turn)
    { kind: 'Buff', id: 'e4-sword-dance', name: 'Sword Dance', category: 'Ego Manifestation', value: '10%', appliesTo: 'Attack',
      hitScope: 'All hits', condition: 'Always', egoLevel: 4, egoBelow: 6, counter: 'Sword Dance', maxStacks: 3 },
    // E6 Liberated Memory (in game): "Increase max stacks of Sword Dance by 1 and change the Damage Amount increase effect to 15%. If Sword
    // Dance is stacked to 4, gain 1 Swiftblade Flurry. Swiftblade Flurry: Increase Damage Amount of Flash Slash and Iceberg Cleave by 20%"
    { kind: 'Buff', id: 'e6-sword-dance', name: 'Sword Dance', category: 'Ego Manifestation', value: '15%', appliesTo: 'Attack',
      hitScope: 'All hits', condition: 'Always', egoLevel: 6, counter: 'Sword Dance', maxStacks: 4 },
    { kind: 'Buff', id: 'e6-swiftblade', name: 'Swiftblade Flurry', category: 'Ego Manifestation', value: '20%', appliesTo: flashAndIceberg,
      hitScope: 'All hits', condition: 'Always', egoLevel: 6, counter: 'Swiftblade Flurry' },
  ],
  // Card text: the in-game wording (owner's screenshots, 2026-10-30), with tokens for the build's numbers (engine/cardText.ts)
  cards: {
    // Ego skill: Prydwen has 300%, +50% for each card moved. The last line runs off the owner's screenshot: its end is E3's wording
    'card-745': {
      pct: 4.5,
      text: '{E3:600%|{450%}} Damage to all enemies\nMove all Attack Cards of this unit in hand to the top of Draw Pile\n'
        + '+{E3:150|100}% base Damage Amount for each card moved to top of Draw Pile',
      effects: [
        cardBuff('per-card', 'base Damage Amount for each card moved to top of Draw Pile', '+100%', 'Skyscraper Cleave',
          { type: 'Base %', counter: 'Cards moved to Draw Pile', egoBelow: 3 }),
        cardBuff('per-card-e3', 'base Damage Amount for each card moved to top of Draw Pile', '+150%', 'Skyscraper Cleave',
          { type: 'Base %', counter: 'Cards moved to Draw Pile', egoLevel: 3 }),
      ],
    },
    'card-746': { text: '{100%} Damage\n{P3-1:Inspiration: Decrease Cost by 1}' },
    'card-747': { text: '{220%} Damage\n{P3-1:Inspiration: Increase Damage Amount by 30%}' },
    'card-748': { text: '{100%} Shield' },

    // Prepare to Subdue, I–V
    'card-750': {
      text: 'Draw 1 Attack Card(s) of this unit\nIncrease Damage Amount of those cards by 40% for 1 turn',
      effects: drawnBuff('40%', 'Prepare to Subdue'),
    },
    'card-751': {
      text: '[Retain]\nDraw 1 Attack Card(s) of this unit\nIncrease Damage Amount of those cards by 80% for 1 turn',
      effects: drawnBuff('80%', 'Prepare to Subdue I'),
    },
    'card-752': {
      text: 'Draw 1 Attack Card(s) of this unit\nIncrease Damage Amount of Attack Cards of this unit by 30% for 1 turn',
      effects: [cardBuff('attack-cards', 'Damage Amount of Attack Cards of this unit for 1 turn', '30%', 'Attack', { counter: 'Prepare to Subdue II' })],
    },
    'card-753': {
      text: 'Draw 2 Attack Card(s) of this unit\nDecrease Damage Amount of those cards by 10% for 1 turn',
      effects: drawnBuff('-10%', 'Prepare to Subdue III'),
    },
    'card-754': {
      text: 'Draw 1 Attack Card(s) of this unit\nIncrease Damage Amount of those cards by 40% for 1 turn\nInspiration: Draw 1 Attack Card(s) of this unit',
      effects: drawnBuff('40%', 'Prepare to Subdue IV'),
    },
    'card-755': { text: 'Draw 1 Attack Card(s) of this unit\nAt the start of the next turn, Draw 2 Attack Card(s) of this unit' },

    // Flash Slash, I–V. Prydwen lacks the single-target line, IV is 400% (350%) and +150% for each card (+100%)
    'card-756': { text: `{220%} Damage to all enemies\n${singleTarget}\nInspiration: Decrease Cost by 1`, effects: flashSingle('Flash Slash') },
    'card-757': { text: `{330%} Damage to all enemies\n${singleTarget}\nInspiration: Decrease Cost by 1`, effects: flashSingle('Flash Slash I') },
    'card-758': { text: `{220%} Damage to all enemies\n${singleTarget}\nInspiration: Decrease Cost by 2`, effects: flashSingle('Flash Slash II') },
    'card-759': {
      ...addHit, text: `{220%} Damage to all enemies\n${singleTarget}\nInspiration: Add 1 Hit`, effects: flashSingle('Flash Slash III'),
    },
    'card-760': {
      pct: 4,
      text: '[Retain]\n{400%} Damage\n+150% Damage Amount for each card of this unit Drawn that turn (max 5)',
      effects: [cardBuff('per-drawn', 'Damage Amount for each card of this unit Drawn that turn', '+150%', 'Flash Slash IV',
        { counter: 'Cards Drawn this turn', maxStacks: 5 })],
    },
    'card-761': { text: `{360%} Damage to all enemies\nWhen activated, decrease Cost by 1\n${singleTarget}`, effects: flashSingle('Flash Slash V') },

    // Trickery Strike, I–V
    'card-762': { text: '[Retain]\n{180%} Damage\nEnable the Inspiration effect for 1 random card(s) of this unit in hand' },
    'card-763': { text: '[Retain]\n{240%} Damage\nSelect 1 cards of this unit in hand and enable the Inspiration effect' },
    'card-764': { text: '[Retain / Retrieve]\n{240%} Damage\nEnable the Inspiration effect for 1 random card(s) of this unit in hand' },
    'card-765': {
      pct: 0, hits: 0,
      text: 'Enable the Inspiration effect for all cards of this unit in hand\nFor 1 turn, when an Inspiration-enabled card of this unit is activated, 100% Damage to a random enemy',
      triggers: [{ card: 'trickery-hit', on: 'ALL', counter: 'Trickery Strike III', maxStacks: 1 }],
    },
    'card-766': { text: '{180%} Damage\nDraw 1 card(s) that have the Inspiration effect' },
    'card-767': { ...addHit, text: '{200%} Damage\nInspiration: Add 1 Hit' },

    // Freezing Blade, I–V: the card itself deals no damage
    'card-768': {
      pct: 0, hits: 0, triggers: onInspiration('freezing-hit'),
      text: '[Unique]\nWhen an Inspiration-enabled card of this unit is activated, 120% Damage to all enemies',
    },
    'card-769': {
      pct: 0, hits: 0, triggers: onInspiration('freezing-hit-i'),
      text: '[Unique]\nWhen an Inspiration-enabled card of this unit is activated, 160% Damage to all enemies',
    },
    'card-770': {
      pct: 0, hits: 0, triggers: onInspiration('freezing-hit'),
      text: '[Unique / Initiation]\nWhen an Inspiration-enabled card of this unit is activated, 120% Damage to all enemies',
    },
    'card-771': {
      pct: 0, hits: 0, triggers: onInspiration('freezing-hit-iii'),
      text: '[Unique]\nWhen an Inspiration-enabled card of this unit is activated, 120% Damage × 2 to a random enemy',
    },
    'card-772': {
      text: '[Unique]\nIncrease Damage Amount of All-Target Attack Cards of this unit by 50%',
      effects: [cardBuff('all-target', 'Damage Amount of All-Target Attack Cards of this unit', '50%', allTargetAttacks)],
    },
    'card-773': { text: '[Unique]\nAt the start of the turn, enable the Inspiration effect for 2 random cards in hand' },

    // Iceberg Cleave: Prydwen has "decrease Damage Amount by 20%", not in game
    'card-774': { ...addHit, text: `{180%} Damage to all enemies\n{E1:${singleTarget}}\nInspiration: Add 1 Hit` },
  },
  extraCards: [
    effectHit('freezing-hit', 'Freezing Blade (hit)', 1.2, '120% Damage to all enemies'),
    effectHit('freezing-hit-i', 'Freezing Blade I (hit)', 1.6, '160% Damage to all enemies'),
    effectHit('freezing-hit-iii', 'Freezing Blade III (hit)', 1.2, '120% Damage × 2 to a random enemy', { hits: 2 }),
    effectHit('trickery-hit', 'Trickery Strike III (hit)', 1, '100% Damage to a random enemy'),
  ],
} satisfies CharacterAdditions
