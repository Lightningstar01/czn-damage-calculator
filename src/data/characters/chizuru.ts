// Chizuru: our additions to the Prydwen import (src/data/prydwen/chizuru.json). Card keys are the import's ids.
// Damage % follows the "+" rule: 'by 20%' (no "+") = multiplicative, '+20%' = additive (owner, 2026-10-25).
// "+80% Damage Amount for each Bind stack": every stack counts, the first too (Shadow 1/5 +80%, Shadow+ 3/5 +240%; owner, 2026-10-30).
// Oni Hunt's "next Bind card" has no "of this unit", so it reaches any ally's Bind card, like Rossweisse's (owner, 2026-10-30).
// Potential 5-1, 7 and E1 add to the card's base % before the upgrade, measured on the cards (Card +): Moonslash 96% = (70% + 10%) x 1.2,
// Shadow 110% = (80% + 15%) x 1.16, Shadow+ 249% = (180% + 20% + 15%) x 1.16. Added hits are set per play.
import type { CardPreset, CharacterAdditions } from '../../engine/types'
import { cardBuff, EGO_POTENTIALS_PLUS_3 } from '../helpers'

// Karmic Flames' Cursed Shackles and Will-O'-Wisp make Shadows; stacked to Bind 3 it becomes Shadow of the Moon+
const shadows = ['card-820', 'card-821']

/** Cursed Shackles' or a Skill's added hits are set on the play. */
const shackleHits = 'Cursed Shackles: add 1 hit on the play'
const addedHits = 'Inhibit (Bound At Dusk) and Tsukuyomi II / III: add their hits on the play'

/** Oni Hunt: "+X% Damage Amount to the next Bind card activated", switched on per play. */
const nextBind = (value: string, counter: string) =>
  [cardBuff('next-bind', 'Damage Amount to the next Bind card activated', value, 'Bind', { target: 'allies', counter })]

/** Shadow of the Moon: "+80% Damage Amount for each Bind stack". */
const perBind = (card: string) =>
  [cardBuff('per-bind', 'Damage Amount for each Bind stack', '+80%', card, { counter: 'Bind stacks', maxStacks: 5 })]

// Potential 3-1 (in game): "Change Moonslash's card effect to 70% Damage x 2" (Prydwen 60%)
const moonslash: Partial<CardPreset> = { nodeCard: { '3-1': { pct: 0.7, hits: 2 } } }
const moonslashText = '{P3-1:{70%} Damage × 2|{100%} Damage}'

export default {
  verified: { date: '2026-10-30', gameVersion: '841' },
  notes: 'Card upgrades are set on the Setup tab. Per play (Cards tab): Bind stacks on Shadow of the Moon / + (set at least 1: every stack '
    + 'counts), Shadows created on Moonlight of High Tide, Oni Hunt / I / II before the next Bind card, Cursed Shackles on Karmic Flames '
    + 'III (x2.5), Lunarshard stacks (E4). Set the added hits on each play: Inhibit +1 on Shadows, E6 +1 on Shadow+ at 3 Lunarshard, '
    + 'Cursed Shackles, Tsukuyomi II / III, Oni Hunt III. Procs (Bound At Dusk III / IV): add them as plays. Not counted: Will-O\'-Wisp '
    + 'and Shadow creation (set the counters), Cost changes, heals, shields',
  // Potential nodes in the game's wording (owner's screenshots, 2026-10-30)
  potentials: {
    '3-1': { text: "Change Moonslash's card effect to 70% Damage × 2." },
    '5-1': { text: "+5% Damage Amount to Chizuru's Moonslash\nIf Chizuru's Attack is 500 or higher, add an additional +5% to the modifier" },
    '7': { text: "If Chizuru's Attack is 600 or higher, +5% Damage Amount to Bind cards\nFor every 10 Attack above 600, add an additional +1% to the modifier (additional +10% max)" },
  },
  // Manifest Ego in the game's wording (owner's screenshots, 2026-10-31)
  ego: {
    1: { text: '+20% Damage Amount to Shadow of the Moon+, +3% to Recover Amount of Max HP.' },
    2: { text: 'When a Shadow of the Moon+ card is activated, create 1 Shadow of the Moon card.' },
    3: { text: '+200% Damage Amount to Moonlight of High Tide, and change the +100% Damage Amount for each Shadow of the Moon created to +150%.' },
    4: { text: "When Shadow of the Moon is created, gain 1 Lunarshard.\nLunarshard: +10% Damage Amount to Chizuru's Attack Cards (max 3 stacks)" },
    5: { text: EGO_POTENTIALS_PLUS_3 },
    6: { text: 'When Lunarshard stacks to 3, increases Hit Count of Shadow of the Moon+ by 1.' },
  },
  effects: [
    // 5-1 (in game): "+5% Damage Amount to Chizuru's Moonslash. If Chizuru's Attack is 500 or higher, add an additional +5% to the modifier"
    { kind: 'Buff', id: 'p5-1-moonslash', node: '5-1', name: 'Basic Card Proficiency', category: 'Potential', type: 'Card +', value: '+5%',
      appliesTo: 'Moonslash', hitScope: 'All hits', condition: 'Always', thresholdBonus: { above: 500, value: '+5%', orEqual: true } },
    // 7 (in game): "If Chizuru's Attack is 600 or higher, +5% Damage Amount to Bind cards. For every 10 Attack above 600, add an
    // additional +1% to the modifier (additional +10% max)" (Prydwen: every 40)
    { kind: 'Buff', id: 'p7-bind', node: '7', name: 'Unique Stat Upgrade', category: 'Potential', type: 'Card +', value: '+5%', appliesTo: 'Bind',
      hitScope: 'All hits', condition: 'Always', thresholdMin: 600, thresholdBonus: { above: 600, value: '+1%', every: 10, max: '+10%' } },
    // E1 Sleeping Memory (in game): "+20% Damage Amount to Shadow of the Moon+, +3% to Recover Amount of Max HP"
    { kind: 'Buff', id: 'e1-shadow', name: 'E1 Sleeping Memory', category: 'Ego Manifestation', type: 'Card +', value: '+20%',
      appliesTo: 'Shadow of the Moon+', hitScope: 'All hits', condition: 'Always', egoLevel: 1 },
    // E3 Vivid Memory (in game): "+200% Damage Amount to Moonlight of High Tide, and change the +100% Damage Amount for each Shadow of
    // the Moon created to +150%" (Prydwen: +150% only)
    { kind: 'Buff', id: 'e3-ego-skill', name: 'E3 Vivid Memory', category: 'Ego Manifestation', value: '+200%',
      appliesTo: 'Moonlight of High Tide', hitScope: 'All hits', condition: 'Always', egoLevel: 3 },
    // E4 Inner Memory (in game): "When Shadow of the Moon is created, gain 1 Lunarshard. Lunarshard: +10% Damage Amount to Chizuru's
    // Attack Cards (max 3 stacks)". E6 Liberated Memory: "When Lunarshard stacks to 3, increases Hit Count of Shadow of the Moon+ by 1"
    { kind: 'Buff', id: 'e4-lunarshard', name: 'Lunarshard', category: 'Ego Manifestation', value: '+10%', appliesTo: 'Attack',
      hitScope: 'All hits', condition: 'Always', counter: 'Lunarshard', maxStacks: 3, egoLevel: 4 },
  ],
  // Card text: the in-game wording (owner's screenshots, 2026-10-30), with tokens for the build's numbers (engine/cardText.ts)
  cards: {
    // Ego skill: Prydwen has 350%, +50% for each Shadow
    'card-793': {
      pct: 5,
      text: '{E3:700%|500%} Damage\n+{E3:150|100}% Damage Amount for each Shadow of the Moon created (max 10)',
      effects: [
        cardBuff('per-shadow', 'Damage Amount for each Shadow of the Moon created', '+100%', 'Moonlight of High Tide',
          { counter: 'Shadows created', maxStacks: 10, egoBelow: 3 }),
        cardBuff('per-shadow-e3', 'Damage Amount for each Shadow of the Moon created', '+150%', 'Moonlight of High Tide',
          { counter: 'Shadows created', maxStacks: 10, egoLevel: 3 }),
      ],
    },
    'card-794': { ...moonslash, text: moonslashText },
    'card-795': { text: '{100%} Shield', notes: 'Shield only, no damage' },

    // Karmic Flames, I–V. Prydwen: Karmic Flames and I have 1 hit and "Add 2 Hits", II and IV Cost 1, III 180%
    'card-796': {
      hits: 2, creates: shadows, notes: shackleHits,
      text: '[Initiation]\n{100%} Damage × 2\n1 Cursed Shackles\nCursed Shackles: Add 1 Hit',
    },
    'card-797': {
      hits: 2, creates: shadows, notes: shackleHits,
      text: '[Initiation]\n{150%} Damage × 2\n1 Cursed Shackles\nCursed Shackles: Add 1 Hit',
    },
    'card-798': {
      cost: 0, creates: shadows,
      text: '[Initiation]\n{150%} Damage\n1 Cursed Shackles\nCursed Shackles: Decrease Cost of the next card of this unit activated by 2',
    },
    'card-799': {
      pct: 2.5, creates: shadows,
      text: '[Initiation]\n{250%} Damage\n1 Cursed Shackles\nCursed Shackles: Increase Damage Amount by 150%',
      effects: [cardBuff('shackles', 'Cursed Shackles: Increase Damage Amount', '150%', 'Karmic Flames III', { counter: 'Cursed Shackles', maxStacks: 1 })],
    },
    'card-800': { cost: 0, creates: shadows, text: '[Initiation]\n1 Cursed Shackles\nCreate 1 Shadow of the Moon' },
    'card-801': {
      creates: shadows,
      text: '[Initiation / Exhaust]\n1 Cursed Shackles\nWhen a target inflicted with Cursed Shackles is defeated, create this card',
    },

    // Tsukuyomi, I–V
    'card-802': { creates: shadows, text: '3 Will-O\'-Wisp for each Hit of the next Attack Card of this unit activated' },
    'card-803': { creates: shadows, text: '4 Will-O\'-Wisp for each Hit of the next Attack Card of this unit activated' },
    'card-804': { creates: shadows, text: 'Add 1 Hit(s) to the next Attack Card of this unit activated, then 2 Will-O\'-Wisp for each Hit' },
    'card-805': { text: 'Add 2 Hit(s) to the next Shadow of the Moon, Shadow of the Moon+ activated' },
    'card-806': { creates: shadows, text: '3 Will-O\'-Wisp for each Attack Card of this unit in hand' },
    'card-807': { creates: shadows, text: '[Unique / Lead]\nWhen an Attack Card of this unit is activated, 2 Will-O\'-Wisp' },

    // Bound At Dusk, I–V. Inhibit (in game): "... add 1 Hit to Shadow of the Moon and Shadow of the Moon+"
    'card-808': { text: '[Initiation / Unique]\nAt the start of the turn, gain Inhibit\nDecrease Cost of 2 random card(s) of other Combatants by 1 until activated' },
    'card-809': { text: '[Initiation / Unique]\nAt the start of the turn, gain Inhibit\nDecrease Cost of 2 random card(s) by 1 until activated' },
    'card-810': { text: '[Initiation / Unique]\nAt the start of the turn, gain Inhibit\nWhen Shadow of the Moon+ is activated, decrease Cost of the next 1 card(s) activated by 1 until activated' },
    'card-811': { text: '[Initiation / Unique]\nAt the start of the turn, gain Inhibit\nProc 2 random card(s) of other Combatants' },
    'card-812': { text: '[Initiation / Unique]\nAt the start of the turn, gain Inhibit\nProc 2 random Lead card(s)' },
    'card-813': { text: '[Initiation / Unique]\nAt the start of the turn, gain Inhibit\nDecrease Cost of 1 card(s) with the highest Cost by 2 until activated' },

    // Oni Hunt, I–V. Prydwen: 60%, I 50%, II +100%, III 100%, V "+80%" and 3 Will-O'-Wisp
    'card-814': {
      pct: 0.7,
      text: '[Haste]\n{70%} Damage × 3\n+80% Damage Amount to the next Bind card activated',
      effects: nextBind('+80%', 'Oni Hunt'),
    },
    'card-815': {
      pct: 0.6,
      text: '[Haste]\n{60%} Damage × 4\n+100% Damage Amount to the next Bind card activated',
      effects: nextBind('+100%', 'Oni Hunt I'),
    },
    'card-816': {
      text: '[Haste]\n{150%} Damage × 2\n+120% Damage Amount to the next Bind card activated',
      effects: nextBind('+120%', 'Oni Hunt II'),
    },
    'card-817': {
      pct: 1.2, notes: 'No other Attack Cards in hand: add 2 hits on the play',
      text: '[Haste]\n{120%} Damage × 3\nOther than Shadow of the Moon, if there are no other Attack Cards in hand, add 2 Hit(s)',
    },
    'card-818': { creates: ['card-822'], text: '[Haste]\nCreate 2 Moonslash\nApply Exhaust to those cards and decrease Cost by 1 until activated' },
    'card-819': {
      creates: shadows,
      text: '[Unique]\n80% Damage Amount to Shadow of the Moon+\nAt the start of the turn, 4 Will-O\'-Wisp',
      effects: [cardBuff('shadow-plus', 'Damage Amount to Shadow of the Moon+', '80%', 'Shadow of the Moon+')],
    },

    // Bind 1 / Bind 3 in the import are the card's stack count: the tag is Bind
    'card-820': {
      tags: 'Bind, Retain', creates: ['card-821'], notes: addedHits,
      text: '[Bind (1/5) / Retain]\n{80%} Damage\n+80% Damage Amount for each Bind stack',
      effects: perBind('Shadow of the Moon'),
    },
    'card-821': {
      tags: 'Unique, Bind, Retain', notes: `${addedHits}; E6: 1 more at 3 Lunarshard`,
      text: '[Unique / Bind (3/5) / Retain]\n{180%} Damage × 2\nRecover {E1:8|5}% of Max HP\n+80% Damage Amount for each Bind stack',
      effects: perBind('Shadow of the Moon+'),
    },

    // Oni Hunt IV's Moonslash: Exhaust, Cost 1 lower until activated
    'card-822': {
      ...moonslash, name: 'Moonslash', cost: 0, tags: 'Basic, Basic Attack, Exhaust', image: 'cards/chizuru/start_1060_01.webp',
      text: `[Exhaust]\n${moonslashText}`,
    },
  },
} satisfies CharacterAdditions
