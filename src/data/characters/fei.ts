// Fei: our additions to the Prydwen import (src/data/prydwen/fei.json). Card keys are the import's ids.
// Damage % follows the "+" rule: 'by 20%' (no "+") = multiplicative, '+20%' = additive (owner, 2026-10-25).
// The owner doesn't have Fei yet: the screenshots (2026-11-09) are the Combatant Archive preview (Lv 1, no Potential, no Ego level).
// Flame Arts (in game): "When Flame Arts reaches 3 stacks, 120% Extra Damage to the enemy that was attacked last. On effect activation,
// decrease Flame Arts by 3": a Flame Arts card in the deck, one play each time it fires; it's Fei's Extra Attack (owner, 2026-11-09).
// A proc of Inferno Rhapsody (Soulfire Dance II, Soliloquy III / IV) counts like a play of it: one play per proc (owner, 2026-11-09).
// Heavensfall's extra hits (Heavenscleaver E3 +2, E6 Judgment Upon the Wicked +3) are one switch each per play (owner, 2026-11-09).
import type { CharacterAdditions } from '../../engine/types'
import { cardBuff, effectHits, EGO_POTENTIALS_PLUS_3 } from '../helpers'

/** A hit from an effect, not a card: Fei's Extra Attack, unraised by card upgrades. */
const effectHit = effectHits({ element: 'Void', kind: 'Extra Attack' })

const HEAVENSFALL = 'card-1227'
const INFERNO = 'card-1228'
const INFERNO_HEAVEN = 'card-1229'
const FLAME_ARTS = 'flame-arts'
const E3_HITS = 'Heavenscleaver E3 (+2 Hits)'
const JUDGMENT = 'Judgment Upon the Wicked'
const SOULFIRE_V = 'Soulfire Dance V'

/** Exorcist's Formation, I–V: Descent on draw (Heavensfall at 8), the Inferno Rhapsody it creates, and their Flame Arts. */
const formation = (count: number, created = 'Inferno Rhapsody', extra = '') =>
  `[Initiation / Unique]\nOn Draw through an ability, 1 Descent\nCreate ${count} ${created} in Draw Pile${extra}`
const formationCreates = [INFERNO, HEAVENSFALL, FLAME_ARTS]

export default {
  verified: { date: '2026-11-09', gameVersion: '841' },
  notes: 'Card upgrades are set on the Setup tab. Add a Flame Arts play each time it fires (every 3 Flame Arts) and a Heavensfall play for '
    + 'each one created (every 8 Descent); an Inferno Rhapsody proc (Soulfire Dance II, Soliloquy III / IV) is a play of it. Per play '
    + '(Cards tab): Soulfire Dance hits (X+1); on Heavensfall, Heavenscleaver (next Heavensfall 100%), Soulfire Dance III hits (50% each, '
    + 'max 10), Heavenscleaver E3 (+2 Hits) and Judgment Upon the Wicked (E6, +3 Hits); on Inferno Rhapsody, moved by Blazing War Dance (E1); '
    + 'on Flame Arts, Soulfire Dance V (+1 Hit). Not counted: E2\'s Fixed Damage equal to 30% of an Inferno Rhapsody\'s damage',
  // Counters only a card's extra hits read: off until switched on per play
  playStacks: { [E3_HITS]: 0, [JUDGMENT]: 0, [SOULFIRE_V]: 0 },
  // Potential nodes in the game's wording (owner's screenshots, 2026-11-09)
  potentials: {
    '3-1': { text: 'Adds the following effect to the Azure Flame card: 1 Flame Arts' },
    '5-1': { text: "+5% Damage Amount to Fei's Azure Flame, and if Fei's Attack is 500 or higher, add an additional +5% to the modifier" },
    '7': { text: "If Fei's Attack is 600 or higher, +5% Void Attribute Damage Amount, and for every 20 Attack exceeding 600, add an additional +2% to the modifier\n(additional +10% max)" },
  },
  // Manifest Ego in the game's wording (owner's screenshots, 2026-11-09)
  ego: {
    1: { text: 'Adds the following effect to the Blazing War Dance card: Increase Damage Amount of Inferno Rhapsody moved to hand by 100% until activated.' },
    2: { text: 'At the start of battle, gain 6 Descent, and for each turn, when the first Heavensfall is created, gain 2 Descent.\nWhen the Inferno Rhapsody card is activated, inflict Fixed Damage equal to 30% of the Damage dealt to the target (this Damage cannot inflict a Critical Hit).' },
    3: { text: "Increase Heavenscleaver's Descent by 2 and add the following effect: Add 2 Hits to the next Heavensfall." },
    4: { text: 'At the start of battle, +80% Damage Amount to Heavensfall.' },
    5: { text: EGO_POTENTIALS_PLUS_3 },
    6: { text: 'At the start of battle, +120% Damage Amount to Flame Arts.\nAt the start of battle or each time 3 Heavensfall cards are activated, gain 1 Judgment Upon the Wicked.\nJudgment Upon the Wicked: Add 3 Hits to Heavensfall, and when the effect is activated, remove Judgment Upon the Wicked.' },
  },
  effects: [
    // 5-1 (in game): "+5% Damage Amount to Fei's Azure Flame, and if Fei's Attack is 500 or higher, add an additional +5%": raises the
    // card %, like Selena's 5-1
    { kind: 'Buff', id: 'p5-1-azure', node: '5-1', name: 'Basic Card Proficiency', category: 'Potential', type: 'Card +', value: '+5%',
      appliesTo: 'Azure Flame', hitScope: 'All hits', condition: 'Always', thresholdBonus: { above: 500, value: '+5%', orEqual: true } },
    // 7 (in game): "If Fei's Attack is 600 or higher, +5% Void Attribute Damage Amount...": on the stats screen (docs/FORMULA.md), not added
    // E4 Inner Memory (in game): "At the start of battle, +80% Damage Amount to Heavensfall"
    { kind: 'Buff', id: 'e4-heavensfall', name: 'Damage Amount to Heavensfall', category: 'Ego Manifestation', value: '+80%',
      appliesTo: 'Heavensfall', hitScope: 'All hits', condition: 'Always', egoLevel: 4 },
    // E6 Liberated Memory (in game): "At the start of battle, +120% Damage Amount to Flame Arts"
    { kind: 'Buff', id: 'e6-flame-arts', name: 'Damage Amount to Flame Arts', category: 'Ego Manifestation', value: '+120%',
      appliesTo: 'Flame Arts', hitScope: 'All hits', condition: 'Always', egoLevel: 6 },
  ],
  // Card text: the in-game wording (owner's screenshots, 2026-11-09), with tokens for the build's numbers (engine/cardText.ts)
  cards: {
    // Ego skill: E3 "Increase Heavenscleaver's Descent by 2 and add: Add 2 Hits to the next Heavensfall"
    'card-1199': {
      creates: [HEAVENSFALL],
      text: '8 Descent\nFor 2 turn(s), at the start of the turn, 8 Descent\nIncrease Damage Amount of the next Heavensfall by 100%'
        + '{E3:\nDescent +2, add 2 Hits to the next Heavensfall}',
      effects: [cardBuff('next-heavensfall', 'Damage Amount of the next Heavensfall', '100%', 'Heavensfall',
        { counter: 'Heavenscleaver', maxStacks: 1 })],
    },
    'card-1200': { text: '{100%} Damage{P3-1:\n1 Flame Arts}' },
    'card-1201': { text: '{100%} Shield', notes: 'Shield only, no damage' },

    // Exorcist's Formation, I–V (the base card is Initiation / Unique in game too)
    'card-1202': { tags: 'Initiation, Unique', creates: formationCreates, text: formation(8) },
    'card-1203': {
      creates: formationCreates, text: formation(8, 'Inferno Rhapsody', '\n+50% Damage Amount to those cards'),
      effects: [cardBuff('inferno-50', 'Damage Amount to those cards', '+50%', 'Inferno Rhapsody')],
    },
    'card-1204': { creates: formationCreates, text: formation(8, 'Inferno Rhapsody', '\nAt the start of the turn, Draw 1 Inferno Rhapsody') },
    'card-1205': { creates: formationCreates, text: formation(8, 'Inferno Rhapsody', '\nDraw 2') },
    'card-1206': {
      creates: [...formationCreates, 'exorcist-iv'],
      text: formation(7, 'Inferno Rhapsody', '\nWhen Flame Arts is activated, 100% Extra Attack on the target'),
      triggers: [{ card: 'exorcist-iv', on: 'Flame Arts' }],
    },
    'card-1207': { creates: [INFERNO_HEAVEN, HEAVENSFALL, FLAME_ARTS], text: formation(6, 'Inferno Rhapsody: Heaven') },

    // Soliloquy, I–V
    'card-1208': { text: 'Draw 2\nOf those Drawn cards, Discard all 1-Cost or higher cards' },
    'card-1209': { text: 'Draw 3\nOf those Drawn cards, Discard all 1-Cost or higher cards' },
    'card-1210': { text: 'Draw 2 0-Cost card(s) of this unit' },
    'card-1211': { text: 'Proc 3 Inferno Rhapsody in Draw Pile on the target\n2 Descent for each procced', notes: 'Add one Inferno Rhapsody play per proc' },
    'card-1212': { text: 'Draw 1\nWhen a 2-Cost or lower card of this unit is Drawn, proc that card and Draw 2', notes: 'Add one play per proc' },
    'card-1213': { text: 'Draw 1 X-Cost cards\nApply the X of that card as X+1 until activated' },

    // Night Rain, I–V
    'card-1214': { creates: [FLAME_ARTS], text: '1 Flame Arts\nStreak: Draw 1 Inferno Rhapsody' },
    'card-1215': { creates: [FLAME_ARTS], text: '1 Flame Arts\nStreak: Draw 2 Inferno Rhapsody' },
    'card-1216': { creates: [FLAME_ARTS], text: '2 Flame Arts\nStreak: The next 2 times Flame Arts is activated, 2 Flame Arts' },
    'card-1217': { creates: [FLAME_ARTS], text: '1 Flame Arts for each Inferno Rhapsody in Graveyard' },
    'card-1218': { creates: [FLAME_ARTS], text: '2 Flame Arts\nAt the start of the turn, move to hand' },
    'card-1219': { creates: [FLAME_ARTS], text: '1 Flame Arts\nStreak: Apply the next X as X+2' },

    // Soulfire Dance, I–V (X-cost: hits X+1, set on each play)
    'card-1220': { text: '{100%} Damage × X+1\nDraw X' },
    'card-1221': { text: '{150%} Damage × X+1\nDraw X' },
    'card-1222': {
      text: '[Unique]\n{100%} Damage × X+1\nProc Inferno Rhapsody in Graveyard on the target for each Hit Count',
      notes: 'Add one Inferno Rhapsody play per hit',
    },
    'card-1223': {
      text: '{150%} Damage × X+1\nIncrease Damage Amount of the next Heavensfall by 50% for each Hit Count (max 500%)',
      effects: [cardBuff('heavensfall-per-hit', 'Damage Amount of the next Heavensfall for each Hit Count', '50%', 'Heavensfall',
        { counter: 'Soulfire Dance III hits', maxStacks: 10 })],
    },
    'card-1224': { creates: [FLAME_ARTS], text: 'Draw X\nX Flame Arts × 2\nX Descent' },
    // Prydwen has no Cost: 2 in game
    'card-1225': { cost: 2, creates: [FLAME_ARTS], text: '[Unique]\nAdd 1 Hit(s) to Flame Arts' },

    // Blazing War Dance (Mythic, no epiphanies); E1 adds the 100% to the Inferno Rhapsody it moves
    'card-1226': {
      text: '[Exhaust / Unique]\nMove Inferno Rhapsody to hand for each Descent gained this turn'
        + '{E1:\nIncrease Damage Amount of Inferno Rhapsody moved to hand by 100% until activated}',
      effects: [cardBuff('e1-moved', 'Damage Amount of Inferno Rhapsody moved to hand', '100%', 'Inferno Rhapsody/Inferno Rhapsody: Heaven',
        { category: 'Ego Manifestation', counter: 'Moved by Blazing War Dance', maxStacks: 1, egoLevel: 1 })],
    },

    // Created cards
    [HEAVENSFALL]: {
      text: '[Ephemeral / Exhaust]\n{100%} Damage × 3',
      counterHits: [{ counter: E3_HITS, hits: 2 }, { counter: JUDGMENT, hits: 3 }],
    },
    [INFERNO]: { text: '{70%} Damage\n1 Flame Arts\nWhen Flame Arts is activated through this card, Draw 1' },
    [INFERNO_HEAVEN]: { text: '{110%} Damage\n1 Flame Arts\nWhen Flame Arts is activated through this card, 3 Descent' },
  },
  extraCards: [
    {
      ...effectHit(FLAME_ARTS, 'Flame Arts', 1.2,
        'When Flame Arts reaches 3 stacks, 120% Extra Damage to the enemy that was attacked last\nOn effect activation, decrease Flame Arts by 3',
        { tags: 'Flame Arts', notes: 'One play each time Flame Arts fires (every 3 stacks)' }),
      counterHits: { counter: SOULFIRE_V, hits: 1 },
    },
    effectHit('exorcist-iv', "Exorcist's Formation IV (Extra Attack)", 1, 'When Flame Arts is activated, 100% Extra Attack on the target'),
  ],
} satisfies CharacterAdditions
