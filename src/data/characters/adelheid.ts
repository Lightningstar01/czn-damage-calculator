// Adelheid: our additions to the Prydwen import (src/data/prydwen/adelheid.json). Card keys are the import's ids.
// Damage % follows the "+" rule: 'by 20%' (no "+") = multiplicative, '+20%' = additive (owner, 2026-10-25).
// Truth Behind A Story / I "+100% Damage Amount taken by the target for 1 turn": a debuff for the cards played after it, not its
// own hit (owner, 2026-10-28). Truth Behind A Story III's "Doggie and Teddy" reaches every Doggie card: Doggie, Doggie (Pack),
// Doggie (Morphed) (owner, 2026-10-28). The Doggie and Teddy cards are raised by the Signature level (in game: Doggie 68% at 7).
// Fairy's Protection's 121% Shield in the owner's screenshot is a partner's effect (owner, 2026-10-28): not in the text.
// Potential 3-1 adds the Blessing tag to Gather Around and Fairy's Protection (nodeTags: only while 3-1 is on).
import type { CharacterAdditions } from '../../engine/types'
import { cardBuff, EGO_POTENTIALS_PLUS_3 } from '../helpers'

const doggie = 'card-1154', teddy = 'card-1155', pack = 'card-1156', doggieMorphed = 'card-1157', teddyMorphed = 'card-1158'

/** Truth Behind A Story / I: "+100% Damage Amount taken by the target for 1 turn", on the plays after it. */
const truthDebuff = () => [cardBuff('taken', 'Damage Amount taken by the target', '+100%', 'ALL',
  { target: 'enemy', counter: 'Truth Behind A Story (on target)', maxStacks: 1 })]

export default {
  verified: { date: '2026-10-30', gameVersion: '841' },
  notes: 'Card upgrades are set on the Setup tab (Doggie and Teddy cards use the Signature level). Per play (Cards tab): Bliss of '
    + 'Dreams stacks (E2), Truth Behind A Story (on target) after Truth / I was played this turn, Truth Behind A Story III and '
    + 'Protect Us V used this turn, Blessing cards in hand (Truth IV), Doggies in hand (Doggie (Pack)), Blessing cards in All '
    + 'Piles (Friends from Fairy Tales I\'s Doggie). Each Doggie (Pack) proc (Quietus) is another play',
  // Potential nodes in the game's wording (owner's screenshots, 2026-10-30)
  potentials: {
    '3-1': { text: "Add Blessing to Gather Around and Fairy's Protection cards." },
    '5-1': { text: "+5% Shield Gain Amount to Adelheid's Fairy's Protection\nIf Adelheid's Defense is 250 or higher, add an additional +5% to the modifier" },
    '7': { text: "If Adelheid's Defense is 300 or higher, +5% Void-Attribute Damage Amount, and for every 10 Defense exceeding 300, add an additional 2% to the modifier (additional +10% max)" },
  },
  // Manifest Ego in the game's wording (owner's screenshots, 2026-10-31)
  ego: {
    1: { text: 'For the Garden of Secrets card, decrease Cost by 1 and add +100% Shield Gain Amount.' },
    2: { text: 'Gains the Bliss of Dreams effect for each Blessing Adelheid applies or creates.\nAt the start of the battle, gain the Bliss of Dreams effect for each Blessing card in Deck.\nBliss of Dreams: Increase Damage Amount of allies by 3% (max 10 stacks).' },
    3: { text: '+200% Shield Gain Amount to Happy Ending.\nChanges the restrictions of the Fixed Heal equal to Shield in possession effect to (cannot exceed 50% of max HP).' },
    4: { text: 'At the start of battle, apply Blessing to any number of cards in hand.\nWhen a Blessing Upgrade Card is activated, apply Blessing to 1 random card in Draw Pile.' },
    5: { text: EGO_POTENTIALS_PLUS_3 },
    6: { text: 'For Bliss of Dreams, decrease max stacks by 5 and change the increased Damage Amount effect to 8%.\nAt the start of the turn, if Bliss of Dreams is 5, Draw 1 Blessing card.' },
  },
  effects: [
    // 7 (in game): "If Adelheid's Defense is 300 or higher, +5% Void-Attribute Damage Amount, and for every 10 Defense exceeding 300,
    // add an additional 2% to the modifier (additional +10% max)": on the stats screen (Void Damage 15.0% at Defense 417), so nothing is
    // added on top (owner, 2026-11-08)
    // E2 Awakening Memory (in game): "Gains the Bliss of Dreams effect for each Blessing Adelheid applies or creates. At the start
    // of battle, gain the Bliss of Dreams effect for each Blessing card in Deck. Bliss of Dreams: Increase Damage Amount of allies
    // by 3% (max 10 stacks)". Prydwen: "start of the turn ... in possession"
    { kind: 'Buff', id: 'e2-bliss', name: 'E2 Bliss of Dreams', category: 'Ego Manifestation', target: 'allies', value: '3%',
      appliesTo: 'ALL', hitScope: 'All hits', condition: 'Always', egoLevel: 2, egoBelow: 6, counter: 'Bliss of Dreams', maxStacks: 10 },
    // E6 Liberated Memory: "For Bliss of Dreams, decrease max stacks by 5 and change the increased Damage Amount effect to 8%"
    { kind: 'Buff', id: 'e6-bliss', name: 'E6 Bliss of Dreams', category: 'Ego Manifestation', target: 'allies', value: '8%',
      appliesTo: 'ALL', hitScope: 'All hits', condition: 'Always', egoLevel: 6, counter: 'Bliss of Dreams', maxStacks: 5 },
  ],
  // Card text: the in-game wording (owner's screenshots, 2026-10-28), with tokens for the build's numbers (engine/cardText.ts)
  cards: {
    // Ego skill: Shield and Heal only. E3 "+200% Shield Gain Amount": 500% in game (owner, 2026-10-28)
    'card-1126': { text: '{E3:500%|300%} Shield\nFixed Heal equal to Shield in possession\n(cannot exceed {E3:50%|30%} of max HP)' },
    'card-1127': { nodeTags: { '3-1': 'Blessing' }, text: '{P3-1:[Blessing]}\n{100%} Defense-Based Damage' },
    'card-1128': { nodeTags: { '3-1': 'Blessing' }, text: '{P3-1:[Blessing]}\n{100%} Shield' },

    // Once Upon A Time, I–V
    'card-1129': { text: '[Exhaust 2]\nApply Blessing to 2 random card(s) in Draw Pile, then Draw 1 of those cards' },
    'card-1130': { text: '[Exhaust 2]\nApply Blessing to 3 random card(s) in Draw Pile, then Draw 1 of those cards' },
    'card-1131': { text: '[Initiation / Exhaust 2]\nSelect and Draw 1 from Draw Pile, then apply Blessing to those cards' },
    'card-1132': { text: '[Exhaust 2]\nDiscard 1\nApply Blessing to 3 random card(s) of the Combatant who owns the Discarded card' },
    'card-1133': { text: '[Retain / Exhaust 2]\nDraw equal to X, then apply Blessing to those cards' },
    'card-1134': { text: '[Unique]\nWhen a card is created, apply Blessing (5 times per turn)' },

    // Protect Us, I–V
    'card-1135': { text: '[Blessing]\nFor the next 2 Blessing cards activated, Draw 1 Blessing card' },
    'card-1136': { text: '[Blessing]\nFor the next 3 Blessing cards activated, Draw 1 Blessing card' },
    'card-1137': { text: '[Blessing]\nThe next 2 times 0 cards are in hand, Draw 1 Blessing card' },
    'card-1138': { text: '[Blessing]\nDraw 3\nChange Cost of those cards to 0-2 for 1 turn' },
    'card-1139': { text: '[Blessing]\nDraw 1\nIf that card is a Blessing card, add 1 Draw' },
    'card-1140': {
      text: 'Draw 2 Blessing card(s) of this unit\nIncrease Damage and Shield Gain Amount of those cards by 60% for 1 turn',
      effects: [cardBuff('drawn', 'Drawn Blessing cards: Damage Amount', '60%', 'Blessing', { counter: 'Protect Us V', maxStacks: 1 })],
    },

    // Friends from Fairy Tales, I–V
    'card-1141': { creates: [doggie, teddy], text: '[Unique]\nSelect and create 1 of either Doggie or Teddy' },
    'card-1142': {
      creates: [doggie], text: '[Unique]\nCreate 1 Doggie\n+20% Damage Amount to Doggie for each Blessing card in All Piles (max 15 cards)',
      effects: [cardBuff('doggie', 'Damage Amount to Doggie for each Blessing card in All Piles', '+20%', 'Doggie',
        { counter: 'Blessing cards in All Piles', maxStacks: 15 })],
    },
    'card-1143': { creates: [teddy], text: '[Unique]\nCreate 1 Teddy\nWhen Damage is taken, move Teddy to hand (1 time per turn)' },
    'card-1144': { creates: [pack], text: '[Unique]\nCreate 4 Doggie (Pack) in Draw Pile' },
    'card-1145': {
      creates: [teddy], text: '[Unique]\nCreate 1 Teddy\nWhen Teddy is activated, 1 Counterattack, and for 1 turn, Retain Counterattack',
    },
    'card-1146': { creates: [doggieMorphed, teddyMorphed], text: '[Unique]\nCreate 1 Doggie (Morphed)' },

    // Truth Behind A Story, I–V
    'card-1147': { text: '[Haste]\n{200%} Defense-Based Damage\n+100% Damage Amount taken by the target for 1 turn', effects: truthDebuff() },
    'card-1148': {
      text: '[Haste]\n{300%} Defense-Based Damage\n2 Weaken\n+100% Damage Amount taken by the target for 1 turn', effects: truthDebuff(),
    },
    'card-1149': { text: '[Haste]\n{200%} Defense-Based Damage\nMove 2 Blessing card(s) from Discard Pile to hand' },
    'card-1150': {
      text: '[Haste]\n{200%} Defense-Based Damage\nIncrease Damage and Shield Gain Amounts of Doggie and Teddy by 100% for 1 turn',
      effects: [cardBuff('doggie', 'Damage Amount of Doggie for 1 turn', '100%', 'Doggie/Doggie (Pack)/Doggie (Morphed)',
        { counter: 'Truth Behind A Story III', maxStacks: 1 })],
    },
    'card-1151': {
      text: '[Quietus]\n{400%} Defense-Based Damage\nIncrease Damage Amount by 30% for each Blessing card in hand',
      effects: [cardBuff('blessing', 'Damage Amount for each Blessing card in hand', '30%', 'Truth Behind A Story IV',
        { counter: 'Blessing cards in hand' })],
    },
    'card-1152': { text: '[Haste]\n{300%} Defense-Based Damage\nIncrease Action Count by 4' },

    'card-1153': { text: '[Unique]\n{200%} Shield\n25% Shield Retention' },

    // Doggie and Teddy cards
    [doggie]: { text: '[Haste / Blessing]\n{60%} Defense-Based Damage × 4' },
    [teddy]: { text: '[Haste / Blessing]\n{200%} Shield\n2 Damage Reduction' },
    // Prydwen: "for each Doggie Linked before activation"
    [pack]: {
      text: '[Blessing / Linked / Quietus]\n{200%} Defense-Based Damage\nIncrease Damage Amount by 50% for each Doggie in hand before activation',
      effects: [cardBuff('doggies', 'Damage Amount for each Doggie in hand', '50%', 'Doggie (Pack)', { counter: 'Doggies in hand' })],
    },
    [doggieMorphed]: {
      creates: [teddyMorphed],
      text: '[Haste / Blessing]\n{90%} Defense-Based Damage × 4\nWhen an Attack Card is used, change this card into Teddy (Morphed)',
    },
    [teddyMorphed]: {
      creates: [doggieMorphed],
      text: '[Haste / Blessing]\n{300%} Shield\n3 Damage Reduction\nWhen a Skill Card is used, change this card into Doggie (Morphed)',
    },
  },
} satisfies CharacterAdditions
