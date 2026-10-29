// Cassius: our additions to the Prydwen import (src/data/prydwen/cassius.json). Card keys are the import's ids.
// Damage % follows the "+" rule: 'by 20%' (no "+") = multiplicative, '+20%' = additive (owner, 2026-10-25).
// Quests (Pop Eyed Popper) create Quest cards on completion (Triple 0, Triple 1, Straight, Full House); Dice Trick V and Pop Eyed
// Popper III create the stronger ones, kept as Prydwen's 'Empowered ...' names (in game: the same names) (owner, 2026-10-28).
// Devil Dice V's damage is x the drawn card's Cost, set per play (owner, 2026-10-28).
// Dice Trick IV's Fixed damage is its own play, one per Quest card activated (owner, 2026-10-28).
// 5-1 works like Mei Lin's: it raises the card % (owner, 2026-10-28).
// Decrease Morale (enemies' Morale: -20% Damage amount per Morale) lowers their damage, not ours: text only.
import type { CharacterAdditions } from '../../engine/types'
import { cardBuff } from '../helpers'

const quests = ['card-601', 'card-602', 'card-603', 'card-604']
const questCards = ['card-605', 'card-606', 'card-607', 'card-608']
const empoweredCards = ['card-880', 'card-881', 'card-882', 'card-883']

export default {
  notes: 'Card upgrades are set on the Setup tab. Per play (Cards tab): Completed Quests (Dice Trick III), Attack Cards activated '
    + 'this turn (Triple 0), the drawn card\'s Cost (Devil Dice V). Dice Trick IV: add one play per Quest card activated. '
    + 'Morale from Straight and Potential 7 (1 per Quest completed, for 1 turn): add it on the Buffs tab. '
    + 'Potential 5-1: switch it off on the Buffs tab while it is locked',
  effects: [
    // 5-1 (in game): "+5% Damage Amount to Cassius's Cards and Wild Card. If Cassius's Health is 600 or higher, add an additional
    // +5% to the modifier". Like Mei Lin's 5-1: it raises the card % (owner, 2026-10-28)
    { kind: 'Buff', id: 'p5-1-cards', name: 'Basic Card Proficiency', category: 'Potential', type: 'Card %', value: '+5%',
      appliesTo: 'Cards/Wild Card', hitScope: 'All hits', condition: 'Always', thresholdStat: 'Health',
      attackBonus: { above: 600, value: '+5%', orEqual: true } },
  ],
  // Card text: the in-game wording (owner's screenshots, 2026-10-28), with tokens for the build's numbers (engine/cardText.ts)
  cards: {
    // Ego skill. E4 Inner Memory: +2 Morale decrease
    'card-572': { creates: questCards, text: 'Create 2 Quest card(s)\nDecrease Morale of all enemies by {E4:5|3} for 1 turn' },
    // Prydwen: "Card"; 3-1 adds the draw chance
    'card-573': { name: 'Cards', text: '{100%} Damage\n{P3-1:30% chance to Draw 1}' },
    'card-574': { text: '{220%} Damage\n{P3-1:30% chance to Draw 1}' },
    'card-575': { text: 'Heal {100%}' },

    // Pop Eyed Popper, I–V
    'card-576': { creates: quests, text: 'Start a random 1 out of 4 Quests' },
    'card-577': { creates: quests, text: '[Initiation]\nStart a random 1 out of 4 Quests' },
    'card-578': { creates: quests, text: 'Start a random 1 out of 4 Quests\nCreate a Quest card, remove Ephemeral, and apply Retain' },
    'card-579': {
      creates: [...quests, ...empoweredCards],
      text: 'Start a random 1 out of 4 Quests\nWhen the Quest is completed, create a stronger Quest card',
    },
    'card-580': { creates: quests, text: 'Choose 1 out of 4 Quests to start' },
    'card-581': { creates: quests, text: 'Start a random 1 out of 4 Quests\nWhen the Quest is completed, replace it with another random Quest' },

    // Quests
    'card-601': { creates: ['card-605'], text: 'When 3 0-Cost cards are activated, create Triple 0' },
    'card-602': { creates: ['card-606'], text: 'When 3 1-Cost cards are activated, create Triple 1' },
    'card-603': { creates: ['card-607'], text: 'When 1 of each 0-Cost, 1-Cost, and 2-Cost cards are activated, create Straight' },
    'card-604': { creates: ['card-608'], text: 'When a card of each Combatant has been activated, create Full House' },

    // Devil Dice, I–V
    'card-582': { text: '{160%} Damage\nDraw 1' },
    'card-583': { creates: questCards, text: '{200%} Damage\nCreate 1 Quest card(s)' },
    'card-584': { text: '[Retrieve 3]\n{160%} Damage\nDraw 1' },
    'card-585': { text: '{160%} Damage to all enemies\nDraw for each target hit' },
    'card-586': { text: '{240%} Damage\nDraw 2\nDiscard 2' },
    'card-587': {
      perCount: "Drawn card's Cost", text: "Draw 1\n{80%} Damage to all enemies equal to that card's Cost",
      notes: "Set the drawn card's Cost on each play",
    },

    // Shuffle, I–V
    'card-588': { text: '[Exhaust]\nDiscard all cards in hand\nDraw for each Discarded' },
    'card-589': { text: '[Exhaust 2]\nDiscard all cards in hand\nDraw for each Discarded' },
    'card-590': { text: '[Exhaust]\nDiscard any number of cards in hand\nDraw for each Discarded' },
    'card-591': { text: '[Exhaust]\nMove all cards in hand and Discard Pile to Draw Pile\nDraw 5' },
    'card-592': { text: '[Exhaust]\nSelect up to 5 cards in Discard Pile and move to top of Draw Pile' },
    'card-593': { text: 'Draw 3\nIf the total Cost of those cards is 4 or less, Discard all' },

    // Dice Trick, I–V
    'card-594': { text: '{240%} Damage\nDecrease Morale by 1 for 1 turn\nDecrease Cost by the number of completed Quests' },
    'card-595': { text: '{360%} Damage\nDecrease Morale by 1 for 1 turn\nDecrease Cost by the number of completed Quests' },
    'card-596': { text: '{300%} Damage to all enemies\nDecrease Morale by 1 for 1 turn\nDecrease Cost by the number of completed Quests' },
    // Prydwen: "+80% Damage Amount"; in game "+80% base Damage Amount"
    'card-597': {
      text: '{80%} Damage\n+80% base Damage Amount for each Quest completed (max 5 times)',
      effects: [cardBuff('quests', 'base Damage Amount for each Quest completed', '+80%', 'Dice Trick III',
        { type: 'Base %', counter: 'Completed Quests', maxStacks: 5 })],
    },
    // A 100% Fixed damage play (Prydwen: "100 Fixed Damage"); the Heal and Fixed % aren't raised by the upgrade in game
    'card-598': {
      scaling: 'Fixed', pct: 1, hits: 1,
      text: '[Unique]\nWhen a Quest card is activated, Heal 100%, then {F100%} Fixed Damage to a random enemy',
      notes: 'One play per Quest card activated',
    },
    'card-599': { creates: empoweredCards, text: '[Unique]\nAt the start of the turn, create 1 empowered Quest card(s)' },

    // E1 Sleeping Memory: adds the Discard Pile
    'card-600': { text: 'Select 1 card(s) from Draw Pile{E1: or Discard Pile}, then move those cards to hand' },

    // Quest cards
    'card-605': {
      text: '[Exhaust / Ephemeral]\n{200%} Damage\n+40% base Damage Amount for each Attack Card activated this turn (max 4 times)',
      effects: [cardBuff('attacks', 'base Damage Amount for each Attack Card activated this turn', '+40%', 'Triple 0',
        { type: 'Base %', counter: 'Attack Cards activated this turn', maxStacks: 4 })],
    },
    'card-606': { text: '[Exhaust / Ephemeral]\nDraw 1\n{150%} Damage\nHeal {150%}' },
    'card-607': { text: '[Exhaust / Ephemeral]\nDraw 1\n2 Morale, Resolve, and Fortitude for 1 turn' },
    'card-608': { text: '[Exhaust / Ephemeral]\nDraw 1\nDecrease Stress of a random ally by 2' },
    // Empowered (Dice Trick V, Pop Eyed Popper III). Prydwen's Empowered Triple 0: "+40%"; in game "+50% base"
    'card-880': {
      text: '[Exhaust / Ephemeral]\n{250%} Damage\n+50% base Damage Amount for each Attack Card activated this turn (max 4 times)',
      effects: [cardBuff('attacks', 'base Damage Amount for each Attack Card activated this turn', '+50%', 'Empowered Triple 0',
        { type: 'Base %', counter: 'Attack Cards activated this turn', maxStacks: 4 })],
    },
    'card-881': { text: '[Exhaust / Ephemeral]\nDraw 1\n{200%} Damage\nHeal {200%}' },
    'card-882': { text: '[Exhaust / Ephemeral]\nDraw 1\n3 Morale, Resolve, and Fortitude for 1 turn' },
    'card-883': { text: '[Exhaust / Retain]\nDraw 1\nDecrease Stress of a random ally by 3' },
  },
} satisfies CharacterAdditions
