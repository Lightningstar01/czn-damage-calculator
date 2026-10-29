// Nia: our additions to the Prydwen import (src/data/prydwen/nia.json). Card keys are the import's ids.
// Damage % follows the "+" rule: 'by 20%' (no "+") = multiplicative, '+20%' = additive (owner, 2026-10-25).
// Extra Attacks "by the Combatant who owns that card" (Mute Accent, G Chord III, Soul Riff III) count as Nia's own Extra Attacks,
// added when the card is Nia's; their in-game %s aren't raised by Unique Card Upgrade (owner, 2026-10-28).
// Decibel: on Shuffle each ally (Nia too) performs a 50% Extra Attack; the +50% x Decibel count only boosts that shuffle Extra
// Attack, then Decibel is removed (owner, 2026-10-28). E2 Rhythm Boost raises only Nia's damage (owner, 2026-10-28).
import type { CharacterAdditions } from '../../engine/types'
import { cardBuff } from '../helpers'

const ownerEA = 'Extra Attack to a random enemy by the Combatant who owns that card'

export default {
  notes: 'Card upgrades are set on the Setup tab. Per play (Cards tab): Rhythm Boost (E2, 0-4: 4 on Shuffle, E6 4 at battle '
    + 'start, -1 each turn), Decibel count on the Decibel (Shuffle) play (max 5). Extra Attacks by the owner of a card (Mute '
    + 'Accent, G Chord III, Soul Riff III): add a play only when that card is Nia\'s; teammates\' Extra Attacks and their shuffle '
    + 'Extra Attacks are not counted. Soul Riff IV (next Decibel effect 1 more time): add the Decibel play twice',
  effects: [
    // E2 Awakening Memory (in game): "Each time a Shuffle is performed, gain 4 Rhythm Boost. At the start of the turn, decrease
    // Rhythm Boost by 1. Rhythm Boost: +5% Damage Amount (max 4 stacks)". E6 Liberated Memory: "At the start of battle, gain 4
    // Rhythm Boost, and whenever a shuffle occurs, Heal 40% for each Decibel"
    { kind: 'Buff', id: 'e2-rhythm-boost', name: 'Rhythm Boost', category: 'Ego Manifestation', value: '+5%', appliesTo: 'ALL',
      hitScope: 'All hits', condition: 'Always', counter: 'Rhythm Boost', maxStacks: 4, egoLevel: 2 },
  ],
  // Card text: the in-game wording (owner's screenshots, 2026-10-28), with tokens for the build's numbers (engine/cardText.ts)
  cards: {
    // Ego skill. E4 Inner Memory: +2 Decibel. Its Decibel brings the shuffle Extra Attack.
    'card-609': { text: '{200%} Damage to all enemies\n{E4:5|3} Decibel\nDiscard all cards in Draw Pile', creates: ['decibel'] },
    'card-610': { text: '{100%} Damage' },
    // 3-1: "When using an Amp Therapy card, +2 Elasticity"
    'card-611': { text: 'Heal {100%}\n{P3-1:2 Elasticity}' },

    // G Chord, I–V
    'card-612': { text: '2 Decibel\nProc the top 1 card(s) in Draw Pile' },
    'card-613': { text: '2 Decibel\nCheck the top 3 cards in Draw Pile\nSelect one to proc' },
    'card-614': { text: '2 Decibel\nProc the top 1 card(s) in Draw Pile\nGain Decibel for each Cost of those cards' },
    'card-615': {
      text: '2 Decibel\n{120%} Extra Attack to a random enemy by the Combatant who possesses the topmost card of Draw Pile\n'
        + 'Proc that card',
      pct: 1.2, hits: 1, kind: 'Extra Attack', upgrade: null, notes: 'Damage only when the top card is Nia\'s',
    },
    'card-616': { text: '3 Decibel\nDiscard the top 3 card(s) from Draw Pile' },
    'card-617': {
      text: 'Proc the top 1 card(s) from Draw Pile\nIf in a Decibel state, decrease Decibel by 1, then proc 1 additional card(s)',
    },

    // Mute Accent, I–V
    'card-618': {
      text: `Discard 1 card(s) with the highest Cost\n{150%} ${ownerEA}`,
      pct: 1.5, hits: 1, kind: 'Extra Attack', upgrade: null, notes: 'Damage only when the discarded card is Nia\'s',
    },
    'card-619': {
      text: `Discard 1 random card(s)\n{250%} ${ownerEA}`,
      pct: 2.5, hits: 1, kind: 'Extra Attack', upgrade: null, notes: 'Damage only when the discarded card is Nia\'s',
    },
    'card-620': {
      text: `Discard 1\n{200%} ${ownerEA}`,
      pct: 2, hits: 1, kind: 'Extra Attack', upgrade: null, notes: 'Damage only when the discarded card is Nia\'s',
    },
    'card-621': { text: 'Heal {150%}\nProc 1 of the lowest-Cost card(s)' },
    'card-622': {
      text: `At the start of the turn, Discard 1\n{150%} ${ownerEA}`,
      pct: 1.5, hits: 1, kind: 'Extra Attack', upgrade: null,
      notes: 'One play per turn, when the discarded card is Nia\'s',
    },
    'card-623': {
      text: 'Discard all cards with the highest Cost\n{100%} Extra Attack to a random enemy by the Combatants who own those cards',
      pct: 1, hits: 1, kind: 'Extra Attack', upgrade: null, notes: 'Set the hits to the number of Nia\'s cards discarded',
    },

    // Soul Riff (Prydwen: Soul Rip), I–V. Base heal 150% in game (Prydwen 120%), no heal on discard.
    'card-624': { name: 'Soul Riff', text: '[Retain]\nHeal {150%}\nFor 1 turn, when a card is Discarded, 1 Decibel and 2 Elasticity' },
    'card-625': { name: 'Soul Riff I', text: 'Heal {200%}\n2 Decibel\n4 Elasticity\nProc even when Discarded' },
    'card-626': {
      name: 'Soul Riff II', text: '[Retain]\nHeal {150%}\nFor 1 turn, when a card in hand is Discarded, Heal 100% and 1 Decibel',
    },
    'card-627': {
      name: 'Soul Riff III', text: `[Retain]\nFor 1 turn, when a card in hand is Discarded, {100%} ${ownerEA}`,
      pct: 1, hits: 1, kind: 'Extra Attack', upgrade: null,
      replaceNotes: true, notes: 'One play per Nia card discarded from hand that turn',
    },
    'card-628': { name: 'Soul Riff IV', text: 'Heal {200%}\n2 Decibel\nActivate the next Decibel effect 1 more time(s)' },
    'card-629': { name: 'Soul Riff V', text: 'When a card is Discarded, 1 Decibel and 2 Elasticity' },

    // Adagio, I–V
    'card-630': { text: 'Draw 1\nDiscard 1\nMove the card Discarded through this effect to the top of Draw Pile' },
    'card-631': { text: 'Draw 2\nDiscard 2\nMove the card Discarded through this effect to the top of Draw Pile' },
    'card-632': { text: 'Draw 1\nDiscard up to 1 card(s)\nIf a card was Discarded, create 1 Adagio with Exhaust' },
    'card-633': { text: 'Draw 1\n1 Decibel for each Cost of those cards\nDiscard 1\nHeal 100% for each Cost of those cards' },
    'card-634': { text: 'Discard the top 2 card(s) from Draw Pile\nDraw 2\nDecrease Cost by 1 for each Decibel in possession' },
    'card-635': { text: 'Discard 1\nDraw 2 card(s) of the Combatant who owns the card Discarded' },

    // E1 Sleeping Memory: Cost 1 -> 0
    'card-636': { text: 'Check 3 random cards in Draw Pile\nSelect and Draw one\nDiscard the rest' },
  },
  extraCards: [
    // Decibel keyword (in game): "On Shuffle, 50% Extra Attack by allies to a random enemy, and on activation, remove Decibel. Heal
    // 50% x Decibel count, and +50% Damage Amount x Decibel count to Extra Attacks (max 5 stacks)". Damage from an effect, not a
    // card: no card upgrade. Comes with the Ego skill (Rock and Roll gives Decibel).
    {
      id: 'decibel', base: 'Decibel', name: 'Decibel (Shuffle)', category: 'Generated Card', cardType: 'Skill', cost: null,
      element: 'Instinct', tags: 'Decibel', scaling: 'ATK', kind: 'Extra Attack', pct: 0.5, hits: 1, weaknessApplies: false,
      upgrade: null,
      text: 'On Shuffle, {50%} Extra Attack by allies to a random enemy, and on activation, remove Decibel\n'
        + 'Heal 50% × Decibel count, and +50% Damage Amount × Decibel count to Extra Attacks (max 5 stacks)',
      notes: 'One play per Shuffle while Nia has Decibel; set the Decibel count per play',
      effects: [cardBuff('decibel', 'Damage Amount × Decibel count to Extra Attacks', '+50%', 'Decibel (Shuffle)',
        { counter: 'Decibel', maxStacks: 5 })],
    },
  ],
} satisfies CharacterAdditions
