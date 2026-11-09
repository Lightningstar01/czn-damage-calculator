// Hugo: our additions to the Prydwen import (src/data/prydwen/hugo.json). Card keys are the import's ids.
// Damage % follows the "+" rule: 'by 20%' (no "+") = multiplicative, '+20%' = additive (owner, 2026-10-25).
// Commence the Hunt (in game): "When a Targeting Attack Card is activated, 50% Extra Attack on the target, then decrease Commence the
// Hunt by 1. +30% base Damage Amount to Extra Attacks for each Commence the Hunt (max 5 stacks)": a trigger on any combatant's
// single-target Attack Card (Card.targets, read from the card text: owner, 2026-11-08), Hugo's own Extra Attack. The +30% counts the
// stacks before the decrease and raises all of Hugo's Extra Attacks, E2's too (owner, 2026-11-08).
// Fan of Daggers V's 60% isn't raised by the Signature level: 60% at Signature 5, as the game shows (owner, 2026-11-08).
// Potential 7 is on the stats screen (Extra Damage 7.5% at Attack 877 = 4% + 177/50), so nothing is added (owner, 2026-11-08).
import type { CharacterAdditions } from '../../engine/types'
import { cardBuff, effectHits, EGO_POTENTIALS_PLUS_3 } from '../helpers'

/** A hit from an effect, not a card: Hugo's Extra Attack, unraised by card upgrades. */
const effectHit = effectHits({ element: 'Order', kind: 'Extra Attack' })

const CTH = 'Commence the Hunt'
const inHunt = { counter: CTH, maxStacks: 1 }

const instincts = 'When an Upgrade or Skill Card of a different Combatant is activated, 1 Commence the Hunt'
const fixersApproach = "Increase Damage Amount of Commence the Hunt's Extra Attacks"

export default {
  verified: { date: '2026-11-08', gameVersion: '841' },
  notes: 'Card upgrades are set on the Setup tab. Per play (Cards tab): Commence the Hunt stacks before the play (any combatant\'s '
    + 'single-target Attack Card with Commence the Hunt above 0 adds Hugo\'s 50% Extra Attack, +30% for each stack; also Fan of Daggers IV\'s '
    + 'and Quick Fix II\'s "in a Commence the Hunt state"), Last Resort used (its 30%), Fixer\'s Wrath (E4). Quick Fix V: set the play\'s hits '
    + '(1 + Commence the Hunt). E2\'s Extra Attacks: one play per 2 Commence the Hunt activations (once per turn). Fan of Daggers V: one play per '
    + 'turn. E6\'s Morale (2 for 1 turn): add it on the Buffs tab. Not counted: Hunting Instincts III\'s and Fan of Daggers III\'s Coordinated '
    + 'Attacks (a random ally\'s), Shields, draws, Action Count',
  // Potential nodes in the game's wording (owner's screenshots, 2026-11-08)
  potentials: {
    '3-1': { text: 'Add the following effect to the Knife Toss card: 50% chance for 1 Commence the Hunt' },
    '5-1': { text: "+5% Damage Amount to Hugo's Knife Toss\nIf Hugo's Attack is 500 or higher, add an additional +5% to the modifier" },
    '7': { text: "If Hugo's Attack is 700 or higher, +4% Extra Damage Amount\nFor every 50 Attack exceeding 700, add an additional +1% to the modifier\n(additional +8% max)" },
  },
  // Manifest Ego in the game's wording (owner's screenshots, 2026-11-08)
  ego: {
    1: { text: "+10% to the Damage Amount Increase effect of Commence the Hunt for the Fixer's Approach Card." },
    2: { text: 'Every 2 times Commence the Hunt is activated, inflict 40% Extra Attack × 2 on random enemies, and if the same target is attacked, gain 1 Commence the Hunt. This effect activates once per turn.' },
    3: { text: 'When Last Resort is used, increase max stack of Commence the Hunt by 1.' },
    4: { text: "Each time Commence the Hunt is activated, gain 1 Fixer's Wrath.\nFixer's Wrath: +10% Damage Amount to Hugo (max 4 stacks)" },
    5: { text: EGO_POTENTIALS_PLUS_3 },
    6: { text: 'At the start of the turn, apply 1 Hunting Mark to a random enemy.\nHunting Mark: On Hit through the effect of Commence the Hunt, 2 Morale for 1 turn (cannot stack)\nOn effect activation or if Hunting Mark is applied to a different target, remove effect' },
  },
  effects: [
    // Commence the Hunt: "+30% base Damage Amount to Extra Attacks for each Commence the Hunt (max 5 stacks)"
    { kind: 'Buff', id: 'cth-stacks', name: 'base Damage Amount to Extra Attacks for each Commence the Hunt', category: 'Character', type: 'Base %',
      value: '+30%', appliesTo: 'Extra Attack', hitScope: 'All hits', condition: 'Always', counter: CTH, maxStacks: 5, egoBelow: 3 },
    // E3 Vivid Memory (in game): "When Last Resort is used, increase max stack of Commence the Hunt by 1": 6 stacks can be set from E3
    { kind: 'Buff', id: 'cth-stacks-e3', name: 'base Damage Amount to Extra Attacks for each Commence the Hunt', category: 'Ego Manifestation',
      type: 'Base %', value: '+30%', appliesTo: 'Extra Attack', hitScope: 'All hits', condition: 'Always', counter: CTH, maxStacks: 6, egoLevel: 3 },
    // 5-1 (in game): "+5% Damage Amount to Hugo's Knife Toss. If Hugo's Attack is 500 or higher, add an additional +5% to the modifier":
    // raises the card %, like Yuki's 5-1 (not unlocked by the owner: Knife Toss 110% = 100% x 1.10)
    { kind: 'Buff', id: 'p5-1-knife', node: '5-1', name: 'Basic Card Proficiency', category: 'Potential', type: 'Card +', value: '+5%',
      appliesTo: 'Knife Toss', hitScope: 'All hits', condition: 'Always', thresholdBonus: { above: 500, value: '+5%', orEqual: true } },
    // 7 (in game): "If Hugo's Attack is 700 or higher, +4% Extra Damage Amount. For every 50 Attack exceeding 700, add an additional +1%
    // (additional +8% max)": on the stats screen's Extra Damage, so nothing is added (owner, 2026-11-08)
    // E4 Inner Memory (in game): "Each time Commence the Hunt is activated, gain 1 Fixer's Wrath. Fixer's Wrath: +10% Damage Amount to Hugo (max 4 stacks)"
    { kind: 'Buff', id: 'e4-fixers-wrath', name: "Fixer's Wrath", category: 'Ego Manifestation', value: '+10%', appliesTo: 'ALL',
      hitScope: 'All hits', condition: 'Always', egoLevel: 4, counter: "Fixer's Wrath", maxStacks: 4 },
  ],
  // Commence the Hunt: Hugo's 50% Extra Attack on any combatant's single-target Attack Card while the play has Commence the Hunt
  triggers: [{ card: 'cth', on: 'Attack & Single-target', counter: CTH }],
  // Card text: the in-game wording (owner's screenshots, 2026-11-08), with tokens for the build's numbers (engine/cardText.ts)
  cards: {
    // Ego skill
    'card-484': {
      text: '{250%} Damage to all enemies\nIncrease Damage of Commence the Hunt by 30%',
      effects: [cardBuff('cth-30', 'Increase Damage of Commence the Hunt', '30%', 'Commence the Hunt', { counter: 'Last Resort used', maxStacks: 1 })],
    },
    // Prydwen: Throw Dagger. 3-1 adds the Commence the Hunt chance
    'card-485': { name: 'Knife Toss', text: '{100%} Damage{P3-1:\n50% Chance for 1 Commence the Hunt}' },
    'card-486': { text: '{100%} Shield' },

    // Hunting Instincts, I–V
    'card-487': { text: `[Initiation]\n${instincts}` },
    'card-488': { text: `[Initiation]\n${instincts}` },
    'card-489': { text: `[Initiation]\n${instincts}\n50% chance of an additional 1 Commence the Hunt` },
    'card-490': { text: `[Initiation]\n${instincts}\nIf Commence the Hunt is activated, 50% Coordinated Attack to the target` },
    'card-491': { text: 'Commence the Hunt for each Skill Card in hand' },
    'card-492': { text: '[Initiation]\nWhen an Upgrade or Skill Card is activated, 1 Commence the Hunt' },

    // Fan of Daggers, I–V
    'card-493': { text: '[Haste]\n{60%} × 3 Damage to random enemies\nCommence the Hunt for each target hit' },
    'card-494': { text: '[Haste]\n{90%} × 3 Damage to random enemies\nCommence the Hunt for each target hit' },
    'card-495': { text: '[Haste]\n{90%} × 3 Damage\n2 Commence the Hunt' },
    'card-496': { text: '[Haste]\n{250%} Damage\nWhen Damage is dealt, 100% chance of a random ally performing a Coordinated Attack on the target' },
    'card-497': {
      text: '[Haste]\n{90%} Damage × 3 to random enemies\nIf in a Commence the Hunt state, increase Damage Amount by 100%',
      effects: [cardBuff('cth-state', 'If in a Commence the Hunt state, increase Damage Amount', '100%', 'Fan of Daggers IV', inHunt)],
    },
    // 60% at Signature 5, as the game shows: not raised (owner, 2026-11-08)
    'card-498': {
      upgrade: null, notes: 'One play per turn',
      text: '[Unique]\nAt the start of the turn, {60%} Damage × 2 to random enemies\nCommence the Hunt equal to the number of targets hit',
    },

    // Quick Fix, I–V
    'card-499': { text: '[Haste]\n{80%} Damage × 2\nIf in a Commence the Hunt state, Draw 1 Attack Card(s)' },
    'card-500': { text: '[Haste]\n{120%} Damage × 2\nIf in a Commence the Hunt state, Draw 1 Attack Card(s)' },
    'card-501': {
      text: '[Haste]\n{80%} Damage × 2\nIf in a Commence the Hunt state, add 1 Hit(s)',
      counterHits: { counter: CTH, hits: 1 },
    },
    'card-502': { text: '[Haste]\n{100%} Damage × 2\nIf in a Commence the Hunt state, Draw 2' },
    'card-503': { text: '[Haste]\n{100%} Damage × 3\nIf in a Commence the Hunt state, increase Action Count of all enemies by 2' },
    'card-504': { text: '[Haste]\n{120%} Damage\nAdd 1 Hit(s) for each Commence the Hunt', notes: "Set the play's hits: 1 + Commence the Hunt" },

    // Dingo Howling, I–V
    'card-505': { text: '{100%} Shield\n2 Commence the Hunt' },
    'card-506': { text: '{150%} Shield\n3 Commence the Hunt' },
    'card-507': { text: '{150%} Shield\nIf under Commence the Hunt +50% Shield\n2 Commence the Hunt' },
    'card-508': { text: 'Upon gaining Commence the Hunt, Draw 1 Attack card(s) (1 per turn)' },
    'card-509': { text: '2 Commence the Hunt\nStreak: Add 2 Commence the Hunt' },
    'card-510': { text: '2 Commence the Hunt\nDraw 2 attack card(s)' },

    // E1 Sleeping Memory: +10% to the 40%
    'card-511': {
      text: `[Unique]\n${fixersApproach} by {E1:50|40}%`,
      effects: [
        cardBuff('cth-40', fixersApproach, '40%', 'Commence the Hunt', { egoBelow: 1 }),
        cardBuff('cth-50', fixersApproach, '50%', 'Commence the Hunt', { egoLevel: 1 }),
      ],
    },
  },
  extraCards: [
    effectHit('cth', 'Commence the Hunt', 0.5,
      'When a Targeting Attack Card is activated, 50% Extra Attack on the target, then decrease Commence the Hunt by 1\n'
      + '+30% base Damage Amount to Extra Attacks for each Commence the Hunt (max 5 stacks)', { tags: 'Commence the Hunt' }),
    // E2 Awakening Memory: one play per 2 activations, once per turn
    effectHit('e2-extra', 'Awakening Memory (E2)', 0.4,
      'Every 2 times Commence the Hunt is activated, inflict 40% Extra Attack × 2 on random enemies', {
        hits: 2, egoLevel: 2, targets: 'Random', notes: 'One play per 2 Commence the Hunt activations (once per turn)',
      }),
  ],
} satisfies CharacterAdditions
