// Tenebria: our additions to the Prydwen import (src/data/prydwen/tenebria.json). Card keys are the import's ids.
// Damage % follows the "+" rule: 'by 20%' (no "+") = multiplicative, '+20%' = additive (owner, 2026-10-25).
// Rhythm cards are Basic Attacks (Fermata: Basic Skill): raised by the Basic level, and other characters' Basic / Basic Attack
// buffs reach them (owner, 2026-10-28). Call & Response base / I / V ("If in hand, treat as a Rhythm card") get every Rhythm
// buff (owner, 2026-10-28). Both carry the tag 'Rhythm Card' (the base card is named Rhythm, so a 'Rhythm' tag would match it by name).
// "+X% base Damage Amount for each Rhythm" (Rhythm, Staccato) and Arpeggio's "X% Damage for each Rhythm" read one per-play number,
// Rhythms; the +X% is added to the shown % and isn't raised by the upgrade (owner, 2026-10-28).
// Photo Time deals its Performance Buzz damage: 100% (E1 150%) x Buzz, not raised by the Signature level (owner, 2026-10-28).
// Allies' own Rhythm cards (Music, Start! gives each ally 2) aren't in the calculator: 5-1's ally part isn't modeled.
import type { CharacterAdditions } from '../../engine/types'
import { cardBuff } from '../helpers'

const rhythm = 'Basic, Basic Attack, Rhythm Card'
const crescendo = 'card-1188', staccato = 'card-1189', fortissimo = 'card-1190', fermata = 'card-1191'
const arpeggios = ['card-1192', 'card-1193', 'card-1194', 'card-1195', 'card-1196', 'card-1197']

/** "+X% base Damage Amount for each <counter>" on one Rhythm card. */
const perRhythm = (value: string, card: string, counter: string) =>
  [cardBuff('per-rhythm', `base Damage Amount for each ${counter.replace(/s\b/, '')}`, value, card, { type: 'Base %', counter })]

/** Rhythm: Arpeggio(N), "X% Damage for each Rhythm" (Prydwen names all six "Rhythm: Arpeggio"). */
const arpeggio = (n: number, line: string) => ({
  name: `Rhythm: Arpeggio(${n})`, tags: rhythm + (n >= 3 ? ', Haste' : ''), perCount: 'Rhythms',
  text: `${n >= 3 ? '[Haste]\n' : ''}{${[15, 20, 40, 50, 80, 90][n]}%} Damage for each Rhythm\n${line}`,
})

export default {
  notes: 'Card upgrades are set on the Setup tab (Rhythm cards use the Basic level). Per play (Cards tab): Rhythms (Rhythm, '
    + 'Staccato, Arpeggio), Rhythms in Graveyard (Crescendo), Linked Rhythms (Fortissimo), Everyone\'s Idol on the next 7 Rhythm '
    + 'cards, Encore V on a drawn Rhythm card, E4 Everyone\'s Cheer stacks / at max; Performance Buzz on Photo Time; the hits '
    + 'added by Everyone\'s Idol (7 times), Encore III, Call & Response IV and Fortissimo. Procs (Encore, Spotlight III, Arpeggio, '
    + 'Call & Response II): add them as plays. Not counted: E2 Ego Skill damage, 5-1 on allies\' Rhythm cards',
  // Potential nodes in the game's wording (owner's screenshots, 2026-10-30)
  potentials: {
    '3-1': { text: 'Add the following effect to Sound Check: Incinerate: Heal 50%.' },
    '5-1': { text: "At the start of battle, increase Damage Amount of Tenebria's Rhythm cards by 10%, and if Tenebria's Attack is 500 or higher, increase Damage Amount of other Combatants' Rhythm cards by 10% as well" },
    '7': { text: "If Tenebria's Attack is 600 or higher, +5% Passion Attribute Damage Amount, and for every 20 Attack exceeding 600, add an additional +1% (additional +10% max)" },
  },
  effects: [
    // 5-1 (in game): "At the start of battle, increase Damage Amount of Tenebria's Rhythm cards by 10%, and if Tenebria's Attack is
    // 500 or higher, increase Damage Amount of other Combatants' Rhythm cards by 10% as well". Allies' Rhythm cards aren't modeled
    { kind: 'Buff', id: 'p5-1-rhythm', name: 'Basic Card Proficiency', category: 'Potential', value: '10%', appliesTo: 'Rhythm Card',
      hitScope: 'All hits', condition: 'Always' },
    // 7 (in game): "If Tenebria's Attack is 600 or higher, +5% Passion Attribute Damage Amount, and for every 20 Attack exceeding 600,
    // add an additional +1% (additional +10% max)" (Prydwen: +2%): as Rossweisse's 7
    { kind: 'Buff', id: 'p7-passion', name: 'Unique Stat Upgrade', category: 'Potential', value: '+5%', appliesTo: 'Passion',
      hitScope: 'All hits', condition: 'Always', minAttack: 600, attackBonus: { above: 600, value: '+1%', every: 20, max: '+10%' } },
    // E1 Sleeping Memory: "Increases Damage Amount of Performance Buzz for the Photo Time card from 100% to 150%" (x1.5)
    { kind: 'Buff', id: 'e1-buzz', name: 'E1 Sleeping Memory', category: 'Ego Manifestation', type: 'Final', value: '50%',
      appliesTo: 'Photo Time', hitScope: 'All hits', condition: 'Always', egoLevel: 1 },
    // E4 Inner Memory: "When a Rhythm card is moved to hand or activated, gain Everyone's Cheer. Everyone's Cheer: Increase
    // Tenebria's Damage Amount by 1% (max 20 stacks). When stacked to max, increase Damage Amount of Rhythm cards by an additional 10%"
    { kind: 'Buff', id: 'e4-cheer', name: "E4 Everyone's Cheer", category: 'Ego Manifestation', value: '1%', appliesTo: 'ALL',
      hitScope: 'All hits', condition: 'Always', egoLevel: 4, counter: "Everyone's Cheer", maxStacks: 20 },
    { kind: 'Buff', id: 'e4-cheer-max', name: "E4 Everyone's Cheer at max: Damage Amount of Rhythm cards", category: 'Ego Manifestation',
      value: '10%', appliesTo: 'Rhythm Card', hitScope: 'All hits', condition: 'Always', egoLevel: 4,
      counter: "Everyone's Cheer at max", maxStacks: 1 },
    // E6 Liberated Memory: "When a Rhythm card is activated, inflicts 1 All Eyes On You on the target. All Eyes On You: Increase
    // Damage Amount taken from Rhythm cards by 40%"
    { kind: 'Buff', id: 'e6-eyes', name: 'E6 All Eyes On You: Damage Amount taken from Rhythm cards', category: 'Ego Manifestation',
      target: 'enemy', value: '40%', appliesTo: 'Rhythm Card', hitScope: 'All hits', condition: 'Always', egoLevel: 6 },
  ],
  // Card text: the in-game wording (owner's screenshots, 2026-10-28), with tokens for the build's numbers (engine/cardText.ts)
  cards: {
    // Ego skill: the 7 times' extra Hit is set per play
    'card-1159': {
      text: "For the next 7 Rhythm cards activated, increase Damage Amount of Rhythm cards by {E3:11%|7%}\n"
        + 'If activated 7 times, add 1 Hit(s) to the next 7 Rhythm card(s) activated',
      effects: [
        cardBuff('idol', "Everyone's Idol: Damage Amount of Rhythm cards", '7%', 'Rhythm Card', { counter: "Everyone's Idol", maxStacks: 1, egoBelow: 3 }),
        cardBuff('idol-e3', "Everyone's Idol: Damage Amount of Rhythm cards", '11%', 'Rhythm Card', { counter: "Everyone's Idol", maxStacks: 1, egoLevel: 3 }),
      ],
    },
    // 3-1 adds Incinerate
    'card-1160': { text: '{100%} Damage\n{P3-1:Incinerate: Heal {50%}}' },
    'card-1161': { text: 'Heal {100%}' },

    // Music, Start!, I–V
    'card-1162': {
      creates: ['card-1187'],
      text: '[Unique / Opener]\nExhaust all Basic Attack Cards\nCreate and give each ally 2 of their own Rhythm in Draw Pile\nApply Haste to Rhythm cards of this unit',
    },
    'card-1163': {
      creates: [crescendo],
      text: '[Unique / Opener]\nExhaust all Basic Attack Cards\nCreate and give each ally 2 of their own Rhythm: Crescendo in Draw Pile\nApply Haste to Rhythm cards of this unit',
    },
    'card-1164': {
      creates: [staccato],
      text: '[Unique / Opener]\nExhaust all Basic Attack Cards\nCreate and give each ally 2 of their own Rhythm: Staccato in Draw Pile\nApply Haste to Rhythm cards of this unit',
    },
    'card-1165': {
      creates: [fortissimo],
      text: '[Unique / Opener]\nExhaust all Basic Attack Cards\nCreate and give each ally 2 of their own Rhythm: Fortissimo in Draw Pile\nApply Haste to Rhythm cards of this unit',
    },
    'card-1166': {
      creates: [fermata],
      text: '[Unique / Opener]\nExhaust all Basic Attack Cards\nCreate and give each ally 2 of their own Rhythm: Fermata in Draw Pile',
    },
    'card-1167': { creates: arpeggios, text: '[Unique / Opener]\nExhaust all Basic Attack Cards\nCreate 1 of each Rhythm: Arpeggio in Draw Pile' },

    // Spotlight, I–V. II creates Spotlight
    'card-1168': { text: '{140%} Damage\nMove 1 Rhythm card(s) to hand\nDecrease Cost of those cards by 2 until activated' },
    'card-1169': { text: '{210%} Damage\nMove 2 Rhythm card(s) to hand\nDecrease Cost of 1 of those cards by 2 until activated' },
    'card-1170': {
      creates: ['card-1168'],
      text: 'When 3 Rhythm cards are activated in a turn, create 1 Spotlight with Exhaust in hand and decrease Cost of those cards by 1 (1 time per turn)',
    },
    'card-1171': { text: '{350%} Damage\nSelect and move up to 2 Rhythm cards to hand, then proc those cards' },
    'card-1172': { text: 'Select up to 3 Rhythm cards from among Draw Pile and Graveyard and move those cards to the top of Draw Pile\nDraw 1 of those cards' },
    'card-1173': { text: '{140%} Damage\nDraw 2\nOf those cards, Discard all non-Rhythm cards' },

    // Call & Response, I–V. Base, I and V count as Rhythm cards
    'card-1174': {
      tags: 'Haste, Rhythm Card',
      text: '[Haste]\n{200%} Damage\nIf in hand, treat as a Rhythm card\nAttunement: Draw 1 Rhythm card(s)',
    },
    'card-1175': {
      tags: 'Haste, Rhythm Card',
      text: '[Haste]\n{250%} Damage\nIf in hand, treat as a Rhythm card\nAttunement: Draw 2 Rhythm card(s)',
    },
    'card-1176': { text: '[Haste]\n{240%} Damage × 2\nIf in Draw Pile or in hand, proc this card when a Rhythm card is activated' },
    'card-1177': { text: 'Draw 2 Rhythm card(s)\nIf in Draw Pile, proc this card when a Rhythm card is activated' },
    'card-1178': {
      text: '[Haste]\n{120%} Damage\nWhen a Rhythm card is activated, add 1 Hit to this card (max 5 times)',
      notes: 'Set the hits on each play (1 + Rhythm cards activated, max 6)',
    },
    'card-1179': {
      tags: 'Retain, Haste, Rhythm Card',
      text: '[Retain / Haste]\n{700%} Damage\nIf in hand, also treat as a Rhythm card\n'
        + 'When a Rhythm card is activated, decrease Cost of this card by 1 until this card is activated',
    },

    // Encore, I–V. II's 100% isn't raised by the upgrade in game
    'card-1180': { text: '{120%} Damage\nIf the last card activated was a Rhythm card, proc that card' },
    'card-1181': { text: '{120%} Damage\nIf the last card activated was a Rhythm card, proc that card 2 times' },
    'card-1182': {
      upgrade: null, notes: 'Add one play per 2 Rhythm cards activated',
      text: '[Unique]\nFor every 2 Rhythm cards activated, 100% Damage to the enemy with the lowest HP (15 times per turn)',
    },
    'card-1183': { text: 'For the next 3 Rhythm card(s) activated, decrease Cost by 1 and add 1 Hit', notes: 'Set the hits on those plays' },
    'card-1184': { text: '[Unique]\nProc all Rhythm cards in Graveyard' },
    'card-1185': {
      text: 'Draw 1\nIf that card was a Rhythm card, increase Damage Amount by 100% until activated for 1 turn and repeat 1 more time (max 2 times)',
      effects: [cardBuff('drawn', 'Drawn Rhythm card: Damage Amount', '100%', 'Rhythm Card', { counter: 'Encore V', maxStacks: 1 })],
    },

    // Photo Time: its Performance Buzz damage, "At the end of the turn, 100% (E1 150%) Damage x Performance Buzz count to random
    // enemies (max 10 stacks)"
    'card-1186': {
      pct: 1, hits: 1, upgrade: null, perCount: 'Performance Buzz', replaceNotes: true,
      notes: 'Damage: its Performance Buzz at the end of the turn, 100% (E1 150%) x Buzz (set per play, max 10)',
      text: '[Unique / Retain]\n+1 Performance Buzz\nIf a Rhythm card is activated or moved to hand, increase Performance Buzz by 1 '
        + 'until this card is activated (max 9 times)',
    },

    // Rhythm cards
    'card-1187': {
      tags: rhythm, text: '{60%} Damage\n+30% base Damage Amount for each Rhythm\nProc 1 Rhythm in hand',
      effects: perRhythm('+30%', 'Rhythm', 'Rhythms'),
    },
    [crescendo]: {
      tags: rhythm,
      text: '{180%} Damage\n+40% base Damage Amount for each Rhythm in Graveyard\nFor 1 turn, decrease Cost of the next Rhythm card activated by 1',
      effects: perRhythm('+40%', 'Rhythm: Crescendo', 'Rhythms in Graveyard'),
    },
    [staccato]: {
      tags: rhythm, text: '{80%} Damage\n+50% base Damage Amount for each Rhythm\nIf the last card activated was a Rhythm card, increase Cost by 1',
      effects: perRhythm('+50%', 'Rhythm: Staccato', 'Rhythms'),
    },
    [fortissimo]: {
      tags: `${rhythm}, Linked, Retain`, notes: 'Set the hits on each play (2 when 3 or more cards are Linked)',
      text: '[Linked / Retain]\n{90%} Damage\n+55% base Damage Amount for each Linked Rhythm before activation\nWhen 3 or more cards are Linked, add 1 Hit',
      effects: perRhythm('+55%', 'Rhythm: Fortissimo', 'Linked Rhythms'),
    },
    // Fermata's 4 Rhythm cards (its Related Cards screen): Rhythm, Crescendo, Staccato, Fortissimo
    [fermata]: {
      creates: ['card-1187', crescendo, staccato, fortissimo], tags: 'Basic, Basic Skill, Rhythm Card, Haste',
      text: '[Haste]\nSelect 1 of 4 Rhythm cards\nChange all Rhythm cards into the selected card for 1 turn and Draw 2 of them',
    },
    [arpeggios[0]]: arpeggio(0, 'Draw 1 of the lowest-Cost Rhythm cards and decrease Cost by 1 until activated'),
    [arpeggios[1]]: arpeggio(1, 'Draw 2 of the lowest-Cost Rhythm cards and decrease Cost by 1 until activated'),
    [arpeggios[2]]: arpeggio(2, 'Proc 1 of the highest-Cost Rhythm cards in hand'),
    [arpeggios[3]]: arpeggio(3, 'Proc 1 of the highest-Cost Rhythm card(s) from among Draw Pile and Discard Pile'),
    [arpeggios[4]]: arpeggio(4, 'Decrease Cost of this card by 1 for each Rhythm card in Graveyard'),
    [arpeggios[5]]: arpeggio(5, 'Decrease Cost of this card by 1 for each Rhythm card activated this turn'),
  },
} satisfies CharacterAdditions
