// Veronica: our additions to the Prydwen import (src/data/prydwen/veronica.json). Card keys are the import's ids.
// Damage % follows the "+" rule: 'by 20%' (no "+") = multiplicative, '+20%' = additive (owner, 2026-10-25).
// Ballistas are generated Attack cards that proc at the end of the turn; their in-game % is (base + Potential 7) x the Signature upgrade
// (owner's screenshots, 2026-11-08, Attack 906, Unique 8: Ballista 186% = (150% + 10%) x 1.16, Micro Ballista 58% = (40% + 10%) x 1.16).
// Reload: "Increase Damage Amount of Ballista cards by 50%" per stack, multiplicative (owner, 2026-11-08).
// Piercing Ballista's "Piercing Damage" is normal damage, not an Extra Attack (owner, 2026-11-08; Unconfirmed, in-game test veronica-piercing-ballista).
import type { CharacterAdditions } from '../../engine/types'
import { cardBuff, effectHits } from '../helpers'

/** Every Ballista card (in game, "Ballista Card": Ballista, Piercing, Enhanced, Giant, Shelling and Micro Ballista). */
const BALLISTAS = 'Ballista/Piercing Ballista/Enhanced Ballista/Giant Ballista/Shelling Ballista/Micro Ballista'
const BALLISTA = 'card-450'
const PIERCING = 'card-451'
const ENHANCED = 'card-452'
const GIANT = 'card-453'
const SHELLING = 'card-454'
const MICRO = 'card-455'

/** Firing Preparation's text: create one kind of Ballista now and each turn. */
const firing = (ballista: string, extra = '') =>
  `[Unique / Initiation]\nCreate 1 ${ballista} card(s)\nAt the start of the turn, create 1 ${ballista} card(s)${extra}`

const extraAttack = effectHits({ element: 'Passion', kind: 'Extra Attack' })

export default {
  verified: { date: '2026-11-08', gameVersion: '841' },
  notes: 'Card upgrades are set on the Setup tab; Potential 7 follows the stats-screen Attack. Each Ballista proc is a play of that Ballista. '
    + 'Per Ballista play (Cards tab): Reload stacks (max 3, +1 with Bombardment Prep, +1 at E4; Hunting Time gives the maximum), '
    + 'Sir Kowalski on that Ballista (each version its own number), Target has Shield (Piercing Ballista), Floral Scent (E2), Mark (E6). '
    + 'Not counted: Shields, draws, Reload gains, card creation',
  // Potential nodes in the game's wording (owner's screenshots, 2026-11-08)
  potentials: {
    '3-1': { text: 'Add to Rapid Fire card effect: 20% chance to create 1 random Ballista card in hand.' },
    '5-1': { text: "+5% Damage Amount to Veronica's Rapid Fire\nIf Veronica's Attack is 500 or higher, add an additional +5% to the modifier" },
    '7': { text: "If Veronica's Attack is 700 or higher, +5% Damage Amount to all Ballista rounds\nFor every 40 Attack exceeding 700, add an additional +1% to the modifier\n(additional +10% max)" },
  },
  // Manifest Ego in the game's wording (owner's screenshots, 2026-11-08)
  ego: {
    1: { text: "Bombardment Prep card's Reload is increased by 2." },
    2: { text: 'Each time a Targeting Attack Card is activated by an ally, apply 1 Floral Scent to the target.\nFloral Scent: +20% Damage Amount taken from Ballista (cannot stack)\nThis monster becomes the proc target for Ballista\nWhen applied to a different target, remove Floral Scent' },
    3: { text: 'Add the following effect to Hunting Time: Create 1 random Ballista card in hand.' },
    4: { text: 'Increase max stack of Reload by 1.' },
    5: { text: 'Increase the level of [Basic Card Upgrade], [Signature Card Upgrade], and [Common Card Upgrade] in Potentials by 3.' },
    6: { text: 'At the start of the turn, inflicts 1 Mark on all enemies inflicted with Floral Scent.' },
  },
  effects: [
    // Reload (keyword): "Increase Damage Amount of Ballista cards by 50%. At the end of the turn, remove Reload (max 3 stacks)"
    { kind: 'Buff', id: 'reload', name: 'Reload', category: 'Character', value: '50%', appliesTo: BALLISTAS, hitScope: 'All hits',
      condition: 'Always', counter: 'Reload', maxStacks: 5 },
    // 5-1 Basic Card Proficiency: part of the in-game card % (locked for the owner: Rapid Fire 104% = 100% x 1.04)
    { kind: 'Buff', id: 'p5-1-rapid', node: '5-1', name: 'Basic Card Proficiency', category: 'Potential', type: 'Card +', value: '+5%',
      appliesTo: 'Rapid Fire', hitScope: 'All hits', condition: 'Always', thresholdBonus: { above: 500, value: '+5%', orEqual: true } },
    // 7 Unique Stat Upgrade: shows in every Ballista's % (+10% at the owner's 906 Attack)
    { kind: 'Buff', id: 'p7-ballista', node: '7', name: 'Unique Stat Upgrade', category: 'Potential', type: 'Card +', value: '+5%',
      appliesTo: BALLISTAS, hitScope: 'All hits', condition: 'Always', thresholdMin: 700,
      thresholdBonus: { above: 700, value: '+1%', every: 40, max: '+10%' } },
    // E2 Floral Scent: "+20% Damage Amount taken from Ballista (cannot stack)"
    { kind: 'Buff', id: 'e2-floral', name: 'E2 Floral Scent', category: 'Ego Manifestation', value: '+20%', appliesTo: BALLISTAS,
      hitScope: 'All hits', condition: 'Always', counter: 'Floral Scent', maxStacks: 1, egoLevel: 2 },
  ],
  // E6: 1 Mark at the start of the turn on enemies with Floral Scent; the Mark keyword's Extra Attack on an Attack Card
  triggers: [{ card: 'mark', on: 'Attack', counter: 'Mark (Veronica)', egoLevel: 6 }],
  // Card text: the in-game wording (owner's screenshots, 2026-11-08), with tokens for the build's numbers (engine/cardText.ts)
  cards: {
    // Ego skill: E3 adds a random Ballista
    'card-422': { text: '{250%} Piercing Damage to all enemies\nGain Maximum Reload\n{E3:Create 1 random Ballista card in hand}' },
    // 3-1 adds the random Ballista; every Ballista joins the deck with Rapid Fire
    'card-423': { creates: [BALLISTA, PIERCING, ENHANCED, GIANT, SHELLING, MICRO], text: '{100%} Damage\n{P3-1:20% chance to create 1 Ballista card}' },
    'card-424': { text: '{100%} Shield' },

    // Firing Preparation, I–V: each makes its own Ballista
    'card-425': { creates: [BALLISTA], text: firing('Ballista') },
    'card-426': { creates: [BALLISTA], text: firing('Ballista', ', with a 50% chance to additionally create 1 more') },
    'card-427': { creates: [PIERCING], text: firing('Piercing Ballista') },
    'card-428': { creates: [ENHANCED], text: firing('Enhanced Ballista') },
    'card-429': { creates: [GIANT], text: firing('Giant Ballista') },
    'card-430': { creates: [SHELLING], text: firing('Shelling Ballista') },

    // Repose, I–V (Shield and draws only)
    'card-431': { text: '{100%} Shield\nDraw 2 card(s) from other combatant' },
    'card-432': { text: "Draw 2 other Combatant's card(s)" },
    'card-433': { text: '{150%} Shield\nDraw 2 other combatant card(s)\nIf that card is a Skill Card, 1 Reload' },
    'card-434': { text: '{150%} Shield\nDraw 2 card(s) of other Combatants\nDecrease Cost of 1 of those cards by 1 for 1 turn until activated' },
    'card-435': { text: '{150%} Shield\n1 Reload equal to number of other combatant Skill Cards in hand' },
    'card-436': { text: '{150%} Shield\nDiscard all other combatant cards in hand\n1 Reload equal to that number' },

    // Pendant of Resolution, I–V (Reload is set on each Ballista play)
    'card-437': { text: 'When a Skill Card of a different Combatant is activated, 1 Reload' },
    'card-438': { text: 'When a Skill Card is activated, 1 Reload' },
    'card-439': {
      creates: [MICRO],
      text: '[Unique]\nWhen a Skill Card of a different Combatant is activated, 1 Reload\nWhen 3 Skill Cards have been activated, at the start of the next turn, create 1 Micro Ballista',
    },
    'card-440': { text: '[Exhaust 2]\nFor 1 turn(s), when a card is activated, 1 Reload' },
    // In game "50%% chance" (a typo there)
    'card-441': { text: 'When a Skill Card of a different Combatant is activated, 1 Reload\n50% chance to add 1 Reload' },
    'card-442': { text: '[Retain / Retrieve 4]\nReload 2' },

    // Sir Kowalski, I–V: buffs on the chosen Ballista, set per Ballista play
    'card-443': {
      text: 'Select 1 Ballista card in hand and +100% Damage Amount until activated\nDraw 1',
      effects: [cardBuff('chosen', 'Damage Amount until activated', '+100%', BALLISTAS, { counter: 'Sir Kowalski' })],
    },
    'card-444': {
      text: 'Select 1 Ballista card in hand and +150% Damage Amount until activated\nDraw 2',
      effects: [cardBuff('chosen', 'Damage Amount until activated', '+150%', BALLISTAS, { counter: 'Sir Kowalski I' })],
    },
    'card-445': {
      text: 'Draw 1\nIncrease Damage Amount of Ballista cards by 30% for 1 turn',
      effects: [cardBuff('ballistas', 'Damage Amount of Ballista cards for 1 turn', '30%', BALLISTAS, { counter: 'Sir Kowalski II' })],
    },
    'card-446': { creates: [BALLISTA], text: 'Draw 2\nWhen a Skill card is Drawn, create 1 Ballista card(s)' },
    'card-447': {
      text: '+250% Damage Amount to 1 random Ballista card in hand, and after proccing, Exhaust that card',
      effects: [cardBuff('random', 'Damage Amount to 1 random Ballista card', '+250%', BALLISTAS, { counter: 'Sir Kowalski IV' })],
    },
    'card-448': {
      creates: [BALLISTA],
      text: 'Select and Exhaust 1 Ballista card in hand, then create 2 Ballista card and decrease Damage Amount of those cards by 25% until activated',
      effects: [cardBuff('created', 'Decrease Damage Amount until activated', '-25%', 'Ballista', { counter: 'Sir Kowalski V', maxStacks: 1 })],
    },

    'card-449': { text: '[Unique]\nIncrease max stack of Reload by 1\n{E1:4|2} Reload' },

    // Ballistas (Unusable: they proc at the end of the turn). Prydwen reads 0% on all but Piercing.
    'card-450': { pct: 1.5, hits: 1, kind: 'Extra Attack', text: '[Ephemeral]\n{150%} Extra Attack to a random enemy\nAt the end of the turn, proc' },
    'card-451': {
      text: '[Ephemeral]\n{200%} Piercing Damage to a random enemy\nIf the target possesses Shield, +50% Damage Amount\nAt the end of the turn, proc',
      effects: [cardBuff('shield', 'Damage Amount if the target possesses Shield', '+50%', 'Piercing Ballista', { counter: 'Target has Shield', maxStacks: 1 })],
    },
    'card-452': {
      pct: 2, hits: 1, kind: 'Extra Attack',
      text: '[Ephemeral]\n{200%} Extra Attack to a random enemy\n+30% Critical Chance\nAt the end of the turn, proc',
      effects: [cardBuff('crit', 'Critical Chance', '+30%', 'Enhanced Ballista', { type: 'Crit Chance' })],
    },
    'card-453': { pct: 1.5, hits: 1, kind: 'Extra Attack', text: '[Ephemeral]\n{150%} Extra Attack to all enemies\nAt the end of the turn, proc' },
    'card-454': { pct: 1, hits: 2, kind: 'Extra Attack', text: '[Ephemeral]\n{100%} Extra Attack × 2 to random enemies\nAt the end of the turn, proc' },
    'card-455': { pct: 0.4, hits: 1, kind: 'Extra Attack', text: '[Ephemeral]\n{40%} Extra Attack to a random enemy\nAt the end of the turn, proc' },
  },
  extraCards: [
    // The Mark keyword (Selena's in game): "When an Attack Card is activated, inflict 100% Extra Attack, and decrease Mark by 1"
    extraAttack('mark', 'Mark', 1, 'When an Attack Card is activated, inflict 100% Extra Attack, and decrease Mark by 1', { upgrade: null, tags: 'Mark' }),
  ],
} satisfies CharacterAdditions
