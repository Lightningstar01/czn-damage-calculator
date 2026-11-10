// Kayron: our additions to the Prydwen import (src/data/prydwen/kayron.json). Card keys are the import's ids.
// Damage % follows the "+" rule: 'by 20%' (no "+") = multiplicative, '+20%' = additive (owner, 2026-10-25).
// The owner doesn't have Kayron (screenshots of the locked character, 2026-11-09): Lv. 1, every Potential at 0, Ego level 0, so every
// in-game % is the base %. Owner's answers (2026-11-09):
// - Oath of Vanity turns Futility into a 1-Cost Attack: one Futility card per Oath version (100% / 150% / 200%), raised by the Signature
//   upgrade like other characters' generated cards (Unconfirmed).
// - Echoes of True Abyss' "+40 base Damage Amount for each created" counts 3 Futility, 5 from E1 (Unconfirmed).
// - "Futility Exhausted" is one per-play count; Black Hole III / IV take their added hits from it (counterHits with per / max).
// - Black Hole V hits on every Futility play, and once per Futility the Ego skill or Oath of Vanity IV Exhausts (a count on that play);
//   E2 is a play of its own, added per 2 Futility used; E4's Echo of Paradox is a count (0-3) per play, additive.
import type { CharacterAdditions } from '../../engine/types'
import { cardBuff, EGO_POTENTIALS_PLUS_3, effectHits } from '../helpers'

const FUTILITY = 'card-215'
const FUTILITY_100 = 'card-216'
const FUTILITY_150 = 'futility-150'
const FUTILITY_200 = 'futility-200'
const FUTILITY_ART = 'cards/kayron/abnormal_curse_00067.webp'
const EXHAUSTED = 'Futility Exhausted'
const EXHAUSTED_NOW = 'Futility Exhausted by this card'
const createsFutility = { creates: [FUTILITY] }

/** "+X% base Damage Amount for each Futility Exhausted" (Black Hole, Black Hole II, Echo of Futility II). */
const perExhausted = (value: string, card: string) =>
  [cardBuff('exhausted', 'base Damage Amount for each Futility Exhausted', value, card, { type: 'Base %', counter: EXHAUSTED, maxStacks: 30 })]

/** The Futility Oath of Vanity makes: a 1-Cost Attack, raised by the Signature upgrade (owner, 2026-11-09; Unconfirmed). */
const futilityText = (pct: number, heal: boolean) => `[Exhaust]\n{${pct}%} Damage${heal ? `\nHeal {${pct}%}` : ''}`

const voidHit = effectHits({ element: 'Void' })

export default {
  verified: { date: '2026-11-09', gameVersion: '841' },
  notes: 'Card upgrades are set on the Setup tab. Per play (Cards tab): Futility Exhausted (this battle: Black Hole, Black Hole II, '
    + 'Echo of Futility II, and the hits of Black Hole III / IV), Futility Exhausted by this card (the Ego skill\'s +80% each, and '
    + 'Black Hole V\'s hits on the Ego skill / Oath of Vanity IV), X (Echo of Futility IV), Futility created this battle (Echo of '
    + 'Futility V), Cards Exhausted this turn (Brand of Annihilation IV), Echo of Paradox (E4, 0-3, on Attack cards). With Oath of '
    + 'Vanity in the deck, play its Futility (100% / 150% / 200%); E2: add a play per 2 Futility used. Black Hole I\'s "Proc 2 Futility": '
    + 'add the Futility plays. Not counted: Agony (Brand of Annihilation V, Oath of Vanity V), E6\'s Vulnerable / Weaken / Impair '
    + '(set Vulnerable per play), Ephemeral, heals, draws, cost changes, several targets (one target)',
  // Potential nodes in the game's wording (owner's screenshots, 2026-11-09)
  potentials: {
    '3-1': { text: "+50% Damage and Heal Amounts to Elimination and Sphere cards respectively, and add a 'Create 1 Futility card(s)' effect to both." },
    '5-1': { text: "+5% Damage Amount to Kayron's Elimination\nIf Kayron's Attack is 500 or higher, add an additional +5% to the modifier" },
    '7': { text: "If Kayron's Attack is 600 or higher, +5% Critical Damage\nFor every 40 Attack exceeding 600, add an additional +1% to the modifier\n(additional +10% max)" },
  },
  // Manifest Ego in the game's wording (owner's screenshots, 2026-11-09)
  ego: {
    1: { text: 'When the Echoes of True Abyss card is activated, additionally create 2 Futility cards.' },
    2: { text: 'For each 2 Futility Card used, deal 100% Damage to all enemies.' },
    3: { text: 'Add Graveyard to the target range of Futility Cards Exhausted by the Rift of Nothingness Card.' },
    4: { text: "Each time a Futility card is Exhausted, gain 1 Echo of Paradox.\nEcho of Paradox: +10% Damage Amount to Kayron's Attack Cards (max 3 stacks)" },
    5: { text: EGO_POTENTIALS_PLUS_3 },
    6: { text: 'Each time a Futility card is created, 50% chance to apply 1 random effect among Vulnerable, Weaken, or Impair to a random enemy' },
  },
  effects: [
    // 3-1 Basic Card Proficiency: "+50% Damage and Heal Amounts to Elimination and Sphere", part of the card % like other Potential "+X%" (Card +)
    { kind: 'Buff', id: 'p3-1-basic', node: '3-1', name: 'Basic Card Proficiency', category: 'Potential', type: 'Card +', value: '+50%',
      appliesTo: 'Elimination/Sphere', hitScope: 'All hits', condition: 'Always' },
    // 5-1 Basic Card Proficiency: as Chizuru's 5-1 (Prydwen: "Destruction Damage"; in game: Elimination)
    { kind: 'Buff', id: 'p5-1-elimination', node: '5-1', name: 'Basic Card Proficiency', category: 'Potential', type: 'Card +', value: '+5%',
      appliesTo: 'Elimination', hitScope: 'All hits', condition: 'Always', thresholdBonus: { above: 500, value: '+5%', orEqual: true } },
    // 7 Unique Stat Upgrade: Critical Damage from Attack 600, as Rin's Critical Chance node 7 (Unconfirmed: whether the stats screen shows it)
    { kind: 'Buff', id: 'p7-crit-dmg', node: '7', name: 'Unique Stat Upgrade', category: 'Potential', type: 'Crit DMG', value: '5%', appliesTo: 'ALL',
      hitScope: 'All hits', condition: 'Always', thresholdMin: 600, thresholdBonus: { above: 600, value: '1%', every: 40, max: '10%' } },
    // E4 Inner Memory: "+10% Damage Amount to Kayron's Attack Cards" per Echo of Paradox (one per Futility Exhausted, max 3; the game names no
    // duration, Prydwen "for 1 turn"): set on each play
    { kind: 'Buff', id: 'e4-paradox', name: 'E4 Echo of Paradox', category: 'Ego Manifestation', value: '+10%', appliesTo: 'Attack',
      hitScope: 'All hits', condition: 'Always', counter: 'Echo of Paradox', maxStacks: 3, egoLevel: 4 },
  ],
  // Card text: the in-game wording (owner's screenshots, 2026-11-09), with tokens for the build's numbers (engine/cardText.ts)
  cards: {
    // Ego skill: "+80% base Damage Amount for each Exhausted" Futility in hand (E3 adds the Graveyard's: same count)
    'card-187': {
      ...createsFutility,
      text: '{200%} Damage to all enemies\nExhaust all Futility in hand\n+80% base Damage Amount for each Exhausted',
      effects: [cardBuff('exhausted', 'base Damage Amount for each Exhausted', '+80%', 'Rift of Nothingness',
        { type: 'Base %', counter: EXHAUSTED_NOW, maxStacks: 20 })],
    },
    'card-188': { ...createsFutility, text: '{100%} Damage{P3-1:\nCreate 1 Futility}' },
    'card-189': { ...createsFutility, text: 'Heal {100%}{P3-1:\nCreate 1 Futility}' },

    // Echo of Futility, I–V
    'card-190': { ...createsFutility, text: '{320%} Damage\nCreate 2 Futility' },
    'card-191': { ...createsFutility, text: '{480%} Damage\nCreate 3 Futility' },
    'card-192': { ...createsFutility, text: '{240%} Damage\nCreate 2 Futility\n+20% base Damage Amount for each Futility Exhausted', effects: perExhausted('+20%', 'Echo of Futility II') },
    'card-193': { ...createsFutility, text: '{320%} Damage\nCreate 2 Futility\nApply Ephemeral to those cards' },
    // IV: "+150% Damage Amount for each X" (no "base" in game, unlike his other cards): taken as Base %, like Rossweisse's Unbound (Unconfirmed)
    'card-194': {
      ...createsFutility,
      text: '{150%} Damage\n+150% Damage Amount for each X\nCreate X+1 Futility',
      replaceNotes: true, notes: 'X-cost: set X (AP spent) on each play',
      effects: [cardBuff('x', 'Damage Amount for each X', '+150%', 'Echo of Futility IV', { type: 'Base %', counter: 'X', maxStacks: 10 })],
    },
    'card-195': {
      ...createsFutility,
      text: '{150%} Damage\nCreate 2 Futility\n+30% base Damage Amount for each Futility created this battle',
      effects: [cardBuff('created', 'base Damage Amount for each Futility created this battle', '+30%', 'Echo of Futility V',
        { type: 'Base %', counter: 'Futility created this battle', maxStacks: 30 })],
    },

    // Brand of Annihilation, I–V (cost changes and V's Agony: text only)
    'card-196': { text: '{400%} Damage to all enemies\nWhen a card is Exhausted, decrease Cost of this card by 1 for 1 turn until activated' },
    'card-197': { text: '{600%} Damage to all enemies\nWhen a card is Exhausted, decrease Cost of this card by 1 for 1 turn until activated' },
    'card-198': { text: '{400%} Damage × 2 to a random enemy\nWhen a card is Exhausted, decrease Cost of this card by 1 for 1 turn until activated' },
    'card-199': { text: '{600%} Damage to all enemies\nDecrease Cost for each Exhausted Futility' },
    'card-200': {
      text: '{300%} Damage to all enemies\n+40% base Damage Amount for each card Exhausted this turn',
      effects: [cardBuff('exhausted', 'base Damage Amount for each card Exhausted this turn', '+40%', 'Brand of Annihilation IV',
        { type: 'Base %', counter: 'Cards Exhausted this turn', maxStacks: 20 })],
    },
    'card-201': { text: '{400%} Damage to all enemies\nIf a card was Exhausted this turn, 3 Agony on all enemies' },

    // Black Hole, I–V
    'card-202': { text: '{240%} Damage\n+40% base Damage Amount for each Futility Exhausted', effects: perExhausted('+40%', 'Black Hole') },
    'card-203': { text: '{360%} Damage\nProc 2 Futility in hand' },
    'card-204': { text: '{360%} Damage\n+60% base Damage Amount for each Futility Exhausted', effects: perExhausted('+60%', 'Black Hole II') },
    // III / IV: hits from the Futility Exhausted count (owner, 2026-11-09)
    'card-205': {
      text: '{60%} Damage to a random enemy\nAdd 1 Hit for each Exhausted Futility (max 5 times)',
      counterHits: { counter: EXHAUSTED, hits: 1, per: 1, max: 5 },
    },
    'card-206': {
      text: '{300%} Damage\nAdd 1 Hit for each 5 Exhausted Futility (max 2 times)',
      counterHits: { counter: EXHAUSTED, hits: 1, per: 5, max: 2 },
    },
    // V: an Upgrade, no damage of its own; each Futility Exhausted is a 100% Fixed hit (owner, 2026-11-09)
    'card-207': {
      pct: 0, hits: 0, scaling: 'ATK',
      text: 'When Futility is Exhausted, {F100%} Fixed Damage to a random enemy',
      triggers: [
        { card: 'black-hole-v', on: 'Futility' },
        { card: 'black-hole-v', on: 'Rift of Nothingness/Oath of Vanity IV', counter: EXHAUSTED_NOW, maxStacks: 20, perStack: true },
      ],
    },

    // Oath of Vanity, I–V: base, I, II and III change Futility into an Attack (one Futility card each)
    'card-208': { creates: [FUTILITY_100], text: '[Unique]\nWhen Futility is created, change those cards into 1-Cost Attack Cards with {100%@card-216} Damage and Heal effects' },
    'card-209': { creates: [FUTILITY_150], text: '[Unique]\nWhen Futility is created, change those cards into 1-Cost Attack Cards with {150%@futility-150} Damage and Heal effects' },
    'card-210': { creates: [FUTILITY_100], text: '[Unique / Initiation]\nWhen Futility is created, change those cards into 1-Cost Attack Cards with {100%@card-216} Damage and Heal effects' },
    'card-211': { creates: [FUTILITY_200], text: '[Unique]\nWhen Futility is created, change those cards into 1-Cost Attack Cards with {200%@futility-200} Damage' },
    'card-212': { text: '[Exhaust / Retain]\nExhaust all Futility, Status Ailment, and Curse Cards in hand\nDraw for each' },
    'card-213': { text: 'When 2 Futility cards are Exhausted, 2 Agony on all enemies' },

    // Echoes of True Abyss: "+40 base Damage Amount for each created" (the game drops the %): 3 Futility, 5 from E1 (owner, 2026-11-09)
    'card-214': {
      ...createsFutility,
      text: '{240%} Damage\nCreate 3 Futility\n+40 base Damage Amount for each created',
      effects: [
        cardBuff('created', 'base Damage Amount for each created (3)', '+120%', 'Echoes of True Abyss', { type: 'Base %', egoBelow: 1 }),
        cardBuff('created-e1', 'base Damage Amount for each created (5, E1)', '+200%', 'Echoes of True Abyss', { type: 'Base %', egoLevel: 1 }),
      ],
    },

    // Futility (generated): the Status Ailment, and the Attack Oath of Vanity / II make (Prydwen: 80%)
    [FUTILITY]: { tags: 'Exhaust, Status, Futility', text: '[Exhaust]' },
    [FUTILITY_100]: { name: 'Futility (Oath of Vanity)', tags: 'Exhaust, Futility', pct: 1, text: futilityText(100, true) },
  },
  extraCards: [
    { id: FUTILITY_150, base: 'Futility', name: 'Futility (Oath of Vanity I)', category: 'Generated Card', cardType: 'Attack', cost: 1, element: 'Void',
      tags: 'Exhaust, Futility', scaling: 'ATK', pct: 1.5, hits: 1, weaknessApplies: false, image: FUTILITY_ART, text: futilityText(150, true) },
    { id: FUTILITY_200, base: 'Futility', name: 'Futility (Oath of Vanity III)', category: 'Generated Card', cardType: 'Attack', cost: 1, element: 'Void',
      tags: 'Exhaust, Futility', scaling: 'ATK', pct: 2, hits: 1, weaknessApplies: false, image: FUTILITY_ART, text: futilityText(200, false) },
    // Black Hole V's hit: Fixed (Fixed damage isn't raised by default: potentialFixed setting)
    voidHit('black-hole-v', 'Black Hole V (Futility Exhausted)', 1, 'When Futility is Exhausted, {F100%} Fixed Damage to a random enemy',
      { scaling: 'Fixed', upgrade: undefined, image: 'cards/kayron/unique_1064_02.webp' }),
    // E2 Awakening Memory: a play of its own per 2 Futility used (owner, 2026-11-09)
    voidHit('e2-futility', 'Futility used ×2 (E2)', 1, 'For each 2 Futility Card used, deal 100% Damage to all enemies',
      { egoLevel: 2, notes: 'Add one play per 2 Futility used', image: 'cards/kayron/collapse_1064_01.webp' }),
  ],
} satisfies CharacterAdditions
