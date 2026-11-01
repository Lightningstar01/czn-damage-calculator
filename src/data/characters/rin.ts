// Rin: our additions to the Prydwen import (src/data/prydwen/rin.json). Card keys are the import's ids.
// Damage % follows the "+" rule: 'by 20%' (no "+") = multiplicative, '+20%' = additive (owner, 2026-10-25).
// Dark Mist Stance is a per-play switch that new plays start with on (playStacks; owner, 2026-11-01).
// Drawing Slash's own "Gain Dark Mist Stance" counts for that play's bonus: always on for now (owner, 2026-11-01; in-game test rin-drawing-slash-own-stance).
import type { CharacterAdditions } from '../../engine/types'
import { cardBuff, EGO_POTENTIALS_PLUS_3 } from '../helpers'

const DARK_MIST_STANCE = 'Dark Mist Stance'
const stance = { counter: DARK_MIST_STANCE, maxStacks: 1 }
const addHits = (hits: number) => ({ counterHits: { counter: DARK_MIST_STANCE, hits } })

const gain = 'Gain Dark Mist Stance'
const retain = 'Retain Dark Mist Stance for 1 turn'
const increase100 = 'Dark Mist Stance: Increase Damage Amount by 100%'

/** Drawing Slash, I and V: the card gains the stance, so its +100% is always on (see the header). */
const drawingBonus = (card: string) => [cardBuff('stance', 'Dark Mist Stance: Increase Damage Amount', '100%', card)]

export default {
  verified: { date: '2026-11-01', gameVersion: '841' },
  // New plays start in the stance; the switch is on each play (Cards tab)
  playStacks: { [DARK_MIST_STANCE]: 1 },
  notes: 'Card upgrades are set on the Setup tab. Per play (Cards tab): Dark Mist Stance (starts on; turn it off for plays outside the stance), '
    + 'Hits on Black Dance (1 + Skill Cards in hand, in the stance), Cards in hand (Drawing Slash IV), Attack Cards activated this turn (Sheathe Sword), '
    + 'and Dark Mist Inner Art / I and Destruction III on the cards they buff. E6\'s Morale (2 for 1 turn): add it on the Buffs tab. '
    + 'Not counted: Cost changes, draws, Shields, and losing the stance when another combatant activates an Attack Card',
  // Potential nodes in the game's wording (owner's screenshots, 2026-11-01)
  potentials: {
    '3-1': { text: 'Adds the Gain Dark Mist Stance effect to Dark Mist Sword: First Form, Dark Mist Sword: Third Form card.' },
    '5-1': { text: "+5% Damage Amount to Rin's Dark Mist Sword: First Form and Dark Mist Sword: Third Form\nIf Rin's Attack is 500 or higher, add an additional +5% to the modifier" },
    '7': { text: "If Rin's Attack is 600 or higher, +5% Critical Chance\nFor every 40 Attack exceeding 600, add an additional +1% to the modifier\n(additional +10% max)" },
  },
  // Manifest Ego in the game's wording (owner's screenshots, 2026-11-01)
  ego: {
    1: { text: '+30% Damage Amount to Dark Mist Secret Art: Black Dance' },
    2: { text: 'At the start of the turn, if Rin is in her Dark Mist Stance, create 1 Sheathe Sword card.' },
    3: { text: '+100% Damage Amount to Dark Mist Secret Art: Slash, and increase Vulnerable by 3.' },
    4: { text: 'If Rin is not in Dark Mist Stance when using her card, gain Dark Mist Stance.' },
    5: { text: EGO_POTENTIALS_PLUS_3 },
    6: { text: 'At the start of battle, gain Dark Mist Stance.\nAt the start of the turn, if Rin is in her Dark Mist Stance, gain 2 Morale for 1 turn.' },
  },
  effects: [
    // 5-1 (in game): "+5% Damage Amount to Rin's First Form and Third Form. If Rin's Attack is 500 or higher, add an additional +5% to the modifier"
    { kind: 'Buff', id: 'p5-1-forms', node: '5-1', name: 'Basic Card Proficiency', category: 'Potential', type: 'Card +', value: '+5%',
      appliesTo: 'Dark Mist Sword: First Form/Dark Mist Sword: Third Form', hitScope: 'All hits', condition: 'Always',
      thresholdBonus: { above: 500, value: '+5%', orEqual: true } },
    // 7 (in game): "If Rin's Attack is 600 or higher, +5% Critical Chance. For every 40 Attack exceeding 600, add an additional +1% to the
    // modifier (additional +10% max)". Unconfirmed: not on the stats screen (in-game test rin-unconfirmed)
    { kind: 'Buff', id: 'p7-crit', node: '7', name: 'Unique Stat Upgrade', category: 'Potential', type: 'Crit Chance', value: '5%', appliesTo: 'ALL',
      hitScope: 'All hits', condition: 'Always', thresholdMin: 600, thresholdBonus: { above: 600, value: '1%', every: 40, max: '10%' } },
    // E1 Sleeping Memory: part of the shown card %, like Chizuru's E1 (Unconfirmed: in-game test rin-unconfirmed)
    { kind: 'Buff', id: 'e1-black-dance', name: 'E1 Sleeping Memory', category: 'Ego Manifestation', type: 'Card +', value: '+30%',
      appliesTo: 'Dark Mist Secret Art: Black Dance', hitScope: 'All hits', condition: 'Always', egoLevel: 1 },
    // E3 Vivid Memory (the +3 Vulnerable only changes the Ego skill's text: Vulnerable is set per play)
    { kind: 'Buff', id: 'e3-slash', name: 'E3 Vivid Memory', category: 'Ego Manifestation', value: '+100%',
      appliesTo: 'Dark Mist Secret Art: Slash', hitScope: 'All hits', condition: 'Always', egoLevel: 3 },
  ],
  // Card text: the in-game wording (owner's screenshots, 2026-11-01), with tokens for the build's numbers (engine/cardText.ts)
  cards: {
    // Ego skill. Prydwen's name has a typo ("Secret Ark")
    'card-158': { name: 'Dark Mist Secret Art: Slash', text: '{E3:500|400}% Damage\n{E3:9|6} Vulnerable' },
    // Prydwen's names end in "Attack"
    'card-159': { name: 'Dark Mist Sword: First Form', text: `{100%} Damage\n{P3-1:${gain}}` },
    'card-160': { name: 'Dark Mist Sword: Third Form', text: `{220%} Damage\n{P3-1:${gain}}` },
    'card-161': { text: '{100%} Shield' },

    // Drawing Slash, I–V
    'card-162': { text: `[Haste]\n{120%} Damage\n${gain}\n${increase100}`, effects: drawingBonus('Drawing Slash') },
    'card-163': { text: `[Haste]\n{180%} Damage\n${gain}\n${increase100}`, effects: drawingBonus('Drawing Slash I') },
    'card-164': { hits: 2, text: `[Haste]\n{180%} Damage\n${gain}\nDark Mist Stance: Add 1 Hit(s)` },
    // Unactivatable outside the stance (Prydwen: "This card can be used"); its Cost stays Prydwen's 0 (in-game test rin-unconfirmed)
    'card-165': { text: '[Haste]\n{450%} Damage\nDark Mist Stance: Temporarily remove Unactivatable from this card', notes: 'Can only be played in the stance' },
    'card-166': {
      text: `[Haste]\n{150%} Damage\n${gain}\nDark Mist Stance: Increase Damage Amount by 30% for each card in hand`,
      notes: 'Set the Cards in hand on each play',
      effects: [cardBuff('per-card', 'Dark Mist Stance: Increase Damage Amount for each card in hand', '30%', 'Drawing Slash IV', { counter: 'Cards in hand' })],
    },
    'card-167': { text: `[Haste]\n{360%} Damage\n${gain}\n${increase100}`, effects: drawingBonus('Drawing Slash V') },

    // Dark Mist Secret Art: Destruction, I–V
    'card-168': { text: `Draw 1 card(s) of this unit\n${gain}` },
    'card-169': { text: `{100%} Shield\nDraw 2 card(s) of this unit\n${gain}` },
    'card-170': { text: `Draw 1 card(s) of this unit, then decrease Cost of those cards by 1 for 1 turn until activated\n${gain}` },
    // Prydwen: "+50%"; in game "by 50%"
    'card-171': {
      text: `Draw 1 Attack Card(s) of this unit, then increase Damage Amount of those cards by 50% for 1 turn until activated\n${gain}`,
      notes: 'Switch it on on the card it draws',
      effects: [cardBuff('drawn', 'Damage Amount of those cards for 1 turn', '50%', 'Attack', { counter: 'Destruction III', maxStacks: 1 })],
    },
    'card-172': { text: 'Move Dark Mist Secret Art: Annihilation and Dark Mist Secret Art: Black Dance from Draw Pile or Graveyard to hand' },
    'card-173': { text: 'At the start of the turn, if in a Dark Mist Stance state, Draw 1 card(s) of this unit' },

    // Dark Mist Secret Art: Annihilation, I–V
    'card-174': { ...addHits(1), text: '[Haste]\n{200%} Damage\nDark Mist Stance: Add 1 Hit(s)' },
    'card-175': { ...addHits(1), text: '[Haste]\n{300%} Damage\nDark Mist Stance: Add 1 Hit(s)' },
    'card-176': { ...addHits(2), text: '[Haste]\n{100%} Damage × 2\nDark Mist Stance: Add 2 Hit(s)' },
    'card-177': {
      text: '[Haste]\n{150%} Damage × 2\nDark Mist Stance: +100% Critical Damage',
      effects: [cardBuff('stance', 'Dark Mist Stance: Critical Damage', '100%', 'Dark Mist Secret Art: Annihilation III', { type: 'Crit DMG', ...stance })],
    },
    'card-178': {
      text: `[Haste]\n{300%} Damage\n${increase100}`,
      effects: [cardBuff('stance', 'Dark Mist Stance: Increase Damage Amount', '100%', 'Dark Mist Secret Art: Annihilation IV', stance)],
    },
    'card-179': { text: '[Haste]\n{200%} Damage\nDark Mist Stance: Decrease Cost of all cards of this unit in hand by 1 for 1 turn until activated' },

    // Dark Mist Inner Art, I–V
    'card-180': {
      text: `[Lead]\n${retain}\nDark Mist Stance: +40% Damage Amount to Attack Cards of this unit for 1 turn`,
      notes: 'Switch it on on the plays of that turn',
      effects: [cardBuff('attack-cards', 'Damage Amount to Attack Cards of this unit for 1 turn', '+40%', 'Attack', { counter: 'Dark Mist Inner Art', maxStacks: 1 })],
    },
    'card-181': {
      text: `[Lead]\n${retain}\nDark Mist Stance: +80% Damage Amount to Attack Cards of this unit for 1 turn`,
      notes: 'Switch it on on the plays of that turn',
      effects: [cardBuff('attack-cards', 'Damage Amount to Attack Cards of this unit for 1 turn', '+80%', 'Attack', { counter: 'Dark Mist Inner Art I', maxStacks: 1 })],
    },
    'card-182': { text: `${retain}\nDark Mist Stance: Draw 2 card(s) of this unit` },
    'card-183': { creates: ['card-174'], text: `[Lead]\n${retain}\nCreate 1 Dark Mist Secret Art: Annihilation and apply Ephemeral to those cards` },
    'card-184': { text: '[Lead]\nAt the start of the turn, gain Dark Mist Stance' },
    'card-185': {
      text: '[Lead]\nIf in a Dark Mist Stance state, increase Damage Amount of Attack Cards of this unit by 50%',
      effects: [cardBuff('stance', 'In Dark Mist Stance: Damage Amount of Attack Cards', '50%', 'Attack', stance)],
    },

    // Mythic. The hits depend on both the stance and the hand: set them on the play
    'card-186': {
      text: '{120%} Damage\nDark Mist Stance: Add 1 Hit(s) for each Skill Card in hand',
      notes: 'Set the Hits on each play: 1 + Skill Cards in hand, in the stance',
    },
  },
  extraCards: [
    // E2's card. Prydwen doesn't have it; the art is Drawing Slash's, as in game
    {
      id: 'sheathe-sword', base: 'Sheathe Sword', name: 'Sheathe Sword', category: 'Generated Card', rarity: 'Purple', cardType: 'Attack', cost: 1,
      element: 'Void', tags: 'Haste, Exhaust, Ephemeral', scaling: 'ATK', kind: 'Normal', pct: 0.6, hits: 1, weaknessApplies: false, egoLevel: 2,
      image: 'cards/rin/unique_1018_01.webp',
      text: '[Haste / Exhaust / Ephemeral]\n{60%} Damage\n+20% base Damage Amount for each Attack Card of this unit activated this turn\n'
        + 'If there is no other Attack Card of this unit in hand, decrease Cost by 1',
      notes: 'Set the Attack Cards activated this turn on each play',
      effects: [cardBuff('per-attack', 'base Damage Amount for each Attack Card of this unit activated this turn', '+20%', 'Sheathe Sword',
        { type: 'Base %', counter: 'Attack Cards activated this turn' })],
    },
  ],
} satisfies CharacterAdditions
