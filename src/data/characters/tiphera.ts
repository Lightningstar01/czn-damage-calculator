// Tiphera: our additions to the Prydwen import (src/data/prydwen/tiphera.json). Card keys are the import's ids.
// Damage % follows the "+" rule: 'by 20%' (no "+") = multiplicative, '+20%' = additive (owner, 2026-10-25).
// Archetype: △ and Event Horizon raise the first hit of the next Attack card of any ally (owner, 2026-10-28).
// Harmonization "Double all effects" doubles the card % (134% -> 268%), like Creation and Destruction III's Retain +100% (owner, 2026-10-28).
import type { CharacterAdditions } from '../../engine/types'
import { cardBuff } from '../helpers'

// The cards that create Archetype cards bring all three into the deck
const archetypes = ['card-985', 'card-986', 'card-987']

/** Card % raised per play: Harmonization (on/off), Retain stacks. */
const cardPct = (id: string, name: string, card: string, counter: string, maxStacks: number) =>
  cardBuff(id, name, '+100%', card, { type: 'Card %', maxStacks, counter })
const harmonization = (card: string) => cardPct('harmonization', 'Harmonization: Double all effects', card, 'Harmonization', 1)

// Archetype heal / shield: 50% + Potential 5-1's +5% (+5% more at Defense 250 or higher); 67% in-game = 60% x 1.12 Signature upgrade
const archetypeText = (effect: string) => `[Exhaust]\n${effect}`
const archetypePct = '{P5-1:{60%}|{50%}}'

export default {
  notes: 'Stat potentials are in the stats screen; card upgrades are set on the Setup tab. Per play (Cards tab): Archetype △ '
    + 'stacks (30% each, max 10) and Event Horizon on the first hit of the next Attack card, any ally\'s; Harmonization on '
    + 'Creation and Destruction / I; Retain stacks on III; the Cost of V; Power of Archetype stacks (E4). '
    + 'Not counted: Event Horizon\'s Form Upgrade and Form Convergence doubling a random effect',
  // Potential nodes in the game's wording (owner's screenshots, 2026-10-30)
  potentials: {
    '3-1': { text: 'Decrease Heal Amount of the Barrier Deployment card to 70%, and add a 70% Shield effect.' },
    '5-1': { name: 'Signature Card Proficiency', text: "+5% Heal and Shield Gain Amounts to Archetype cards, and if Tiphera's Defense is 250 or higher, add an additional +5% to the modifier" },
    '7': { text: "If Tiphera's Defense is 300 or higher, at the start of battle, +10% to Critical Damage of allies" },
  },
  effects: [
    // 7 (in game): "If Tiphera's Defense is 300 or higher, at the start of battle, +10% to Critical Damage of allies"
    { kind: 'Stat', id: 'p7-crit', name: 'Unique Stat Upgrade', category: 'Potential', target: 'allies', stat: 'Crit DMG', value: '10%',
      hint: 'DEF 300+' },
    // E4 Power of Archetype: "When Tiphera's Archetype card is used ... At the end of the turn, remove (max 2 stacks)"
    { kind: 'Buff', id: 'e4-attack', name: 'E4 Power of Archetype: Attack Cards', category: 'Ego Manifestation', target: 'allies',
      value: '5%', appliesTo: 'Attack', hitScope: 'All hits', condition: 'Always', maxStacks: 2, counter: 'Power of Archetype', egoLevel: 4 },
    { kind: 'Buff', id: 'e4-order', name: 'E4 Power of Archetype: Order Attribute', category: 'Ego Manifestation', target: 'allies',
      value: '5%', appliesTo: 'Order', hitScope: 'All hits', condition: 'Always', maxStacks: 2, counter: 'Power of Archetype', egoLevel: 4 },
    { kind: 'Buff', id: 'e4-def', name: 'E4 Power of Archetype: Defense-Based Damage', category: 'Ego Manifestation', target: 'allies',
      value: '5%', appliesTo: 'Defense-Based', hitScope: 'All hits', condition: 'Always', maxStacks: 2, counter: 'Power of Archetype', egoLevel: 4 },
  ],
  // Card text: the in-game wording (owner's screenshots, 2026-10-28), with tokens for the build's numbers (engine/cardText.ts)
  cards: {
    // Ego skill: Prydwen has the E3 numbers (3 times); in-game base is 2
    'card-957': {
      creates: archetypes,
      text: 'Select and create 1 Archetype card\nThe next {E3:3|2} times an Ego Skill is used, create an additional card\n'
        + 'Decrease Cost of the next Ego Skill used by {E3:3|2}',
    },
    'card-958': { text: '{100%} Defense-Based Damage' },
    'card-959': { text: 'Heal {P3-1:{70%}|{100%}}\n{P3-1:{70%} Shield}', notes: 'Heal and Shield only, no damage' },

    // Quantum Seed, I–V
    'card-960': { creates: archetypes, text: 'Heal {100%}\nCreate 2 Archetype card(s) in Draw Pile\nDraw 1 of them' },
    'card-961': { creates: archetypes, text: 'Heal {150%}\nCreate 3 Archetype card(s) in Draw Pile\nDraw 1 of them' },
    'card-962': { creates: archetypes, text: 'Heal {100%}\nSelect 1 Archetype card\nCreate 1 in hand and Draw Pile each' },
    'card-963': {
      creates: archetypes,
      text: 'Draw 1\nPredict which Archetype card will be created\nCreate 1 Archetype card\nIf predicted correctly, create the rest in Draw Pile',
    },
    'card-964': {
      creates: archetypes,
      text: 'Create 3 Archetype card(s) in Draw Pile\nDraw 1 of them\nActivate the Retain effect 2 times on 1 random card(s) of this unit',
    },
    'card-965': {
      creates: archetypes,
      text: '[Unique]\nCreate 1 Archetype card(s)\nWhen AP is 0, create 1 Archetype card(s) in hand and Draw Pile each (1 time per turn)',
    },

    // Form Convergence, I–V
    'card-966': { text: '[Retain]\nDraw 2 Archetype card(s)\nDouble a random effect of those cards for 1 turn' },
    'card-967': { text: '[Retain]\nDraw 3 Archetype card(s)\nDouble a random effect of those cards for 1 turn' },
    'card-968': { text: '[Retain]\nDraw 4 Archetype card(s)\nSelect and Exhaust 1 Exhaust card in hand' },
    'card-969': { text: '[Retain]\nChange all Archetype cards in hand into a different Archetype card\nRetain: Draw 1 Archetype card(s)' },
    'card-970': { text: '[Retain]\nSelect and Exhaust up to 3 Exhaust cards from All Piles\nDraw an Exhaust card for each Exhausted' },
    'card-971': { text: '[Retain]\nDraw 1 Archetype card\nRepeat until the same card is Drawn consecutively (max 6 time(s))' },

    // Creation and Destruction, I–V
    'card-972': {
      text: '{120%} Defense-Based Damage\n{80%} Shield\nHeal {80%}\nHarmonization: Double all effects',
      notes: 'Harmonization (Cost = AP): switch it on per play', effects: [harmonization('Creation and Destruction')],
    },
    'card-973': {
      text: '{180%} Defense-Based Damage\n{100%} Shield\nHeal {100%}\nHarmonization: Double all effects',
      notes: 'Harmonization (Cost = AP): switch it on per play', effects: [harmonization('Creation and Destruction I')],
    },
    'card-974': { text: '{550%} Defense-Based Damage\nWhen a card is Exhausted, decrease Cost of this card by 1 for 1 turn until activated' },
    'card-975': {
      text: '[Retain]\n{160%} Defense-Based Damage\n{40%} Shield\nHeal {40%}\nRetain: Increase all effects by 100% until activated (max 4 times)',
      notes: 'Set the turns Retained on each play',
      effects: [cardPct('retain', 'Retain: Increase all effects', 'Creation and Destruction III', 'Retained (C&D III)', 4)],
    },
    'card-976': {
      creates: ['card-972'],
      text: '[Unique]\nWhen AP is 0, create 1 Creation and Destruction\nDecrease Cost of those cards by 1 and apply Exhaust (1 time per turn)',
    },
    // "for each Cost": 150% (168% in-game) x the play's Cost (owner, 2026-10-28)
    'card-977': {
      perCost: true,
      text: '{150%} Defense-Based Damage for each Cost of this card\nWhen a card is Exhausted, randomly change Cost of this card from 1 - 9',
      notes: 'Set the Cost (1-9) on each play',
    },

    // Dual Creation, I–V
    'card-978': { text: '[Unique]\nWhen 2 Archetype cards are created, create 1 identical card in Discard Pile' },
    'card-979': { text: '[Unique / Initiation]\nWhen 2 Archetype cards are created, create 1 identical card in Discard Pile' },
    'card-980': { text: '[Unique / Initiation]\nWhen 3 Archetype cards are created, create 1 identical card in hand\nApply Retain to that card' },
    'card-981': { text: '[Unique / Initiation]\nWhen Archetype: □ is activated, create 1 different Archetype card in Discard Pile' },
    'card-982': { creates: archetypes, text: '[Unique]\nCreate 1 of each Archetype card\nCreate 1 of the next Archetype card Exhausted' },
    'card-983': {
      text: '[Unique / Initiation]\nWhen an Archetype card is moved to hand, duplicate that card and remove a random effect (5 time(s) per turn)',
    },

    // Event Horizon: Form Upgrade max 3 stacks, 4 from E1
    'card-984': {
      text: '[Unique / Form Upgrade (0/{E1:4|3})]\n1 AP\nDraw 1\nIncrease Damage Amount of the first Hit of next Attack Card by 40%',
      notes: 'Form Upgrade (a random effect +100% per Archetype card activated while in hand) is not counted',
      effects: [cardBuff('first-hit', 'Damage Amount of the first Hit of next Attack Card', '40%', 'Attack',
        { target: 'allies', hitScope: 'First hit only', maxStacks: 1, counter: 'Event Horizon' })],
    },

    // Archetype cards. △: 30% per card on the next Attack card's first hit, max 300% (E6: 35%, max 350%; E2's △ shape card
    // adds one more). Counted per play as stacks.
    'card-985': { text: archetypeText(`Heal ${archetypePct}\n1 AP`) },
    'card-986': {
      text: archetypeText(`${archetypePct} Shield\nIncrease Damage Amount of the first Hit of next Attack Card by {E6:35|30}%\n(max {E6:350|300}%)`),
      effects: [
        cardBuff('triangle', 'Damage Amount of the first Hit of next Attack Card', '30%', 'Attack',
          { target: 'allies', hitScope: 'First hit only', maxStacks: 10, counter: 'Archetype △', egoBelow: 6 }),
        cardBuff('triangle-e6', 'Damage Amount of the first Hit of next Attack Card', '35%', 'Attack',
          { target: 'allies', hitScope: 'First hit only', maxStacks: 10, counter: 'Archetype △', egoLevel: 6 }),
      ],
    },
    'card-987': { text: archetypeText(`Heal ${archetypePct}\nDraw 1 Archetype card(s)`) },
  },
} satisfies CharacterAdditions
