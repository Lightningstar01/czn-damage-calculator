// Selena: our additions to the Prydwen import (src/data/prydwen/selena.json). Card keys are the import's ids.
// Damage % follows the "+" rule: 'by 20%' (no "+") = multiplicative, '+20%' = additive (owner, 2026-10-25).
// Mark (in game): "When an Attack Card is activated, inflict 100% Extra Attack, inflict Tenacity Damage equal to 0 Cost, and decrease
// Mark by 1": a trigger on every Attack Card play by anyone while the play's Mark is above 0, Selena's own Extra Attack (owner,
// 2026-10-28). Coordinated Attacks are Selena's Extra Attacks too (owner, 2026-10-28). Mark Damage buffs (Sniper's Domain, E2,
// High-Power Scope III) boost only Mark hits, not E6's chance Extra Attack, which counts at 30% (expected value; owner, 2026-10-28).
// Target Spotted I's Attunement 300% (Prydwen 200%) is its own unraised play (owner, 2026-10-28).
// Effect hits (Mark, Coordinated, Attunement) get no Attack / Skill card buffs; Passion Weakness makes Coordinated Attacks Weakness
// Attacks too; Target Spotted V hits a Ravaged target (owner, 2026-10-28).
import type { CardPreset, CharacterAdditions } from '../../engine/types'
import { cardBuff } from '../helpers'

/** A hit from an effect, not a card: Selena's Extra Attack, unraised by card upgrades. */
const effectHit = (id: string, name: string, pct: number, tags: string, text: string, extra: Partial<CardPreset> = {}): CardPreset => ({
  id, base: name, name, category: 'Generated Card', cardType: 'Attack', cost: null, element: 'Passion', tags, scaling: 'ATK',
  kind: 'Extra Attack', pct, hits: 1, weaknessApplies: false, upgrade: null, notACard: true, text, ...extra,
})

// Passion Weakness keyword (in game): "Apply Weakness Attack to Passion Cards. When another Attribute Weakness is applied, remove
// Passion Weakness": a debuff on the target for every ally's Passion cards, switched on per play
const passionWeakness = cardBuff('passion-weakness', 'Passion Weakness', 'Weakness Attack', 'Passion',
  { target: 'enemy', counter: 'Passion Weakness', maxStacks: 1 })

export default {
  notes: 'Card upgrades are set on the Setup tab. Per play (Cards tab): Mark on the target (each Attack Card play, anyone\'s, with '
    + 'Mark above 0 adds Selena\'s 100% Mark Extra Attack; E6 adds 30% of a 100% Extra Attack), High-Power Scope III / IV and '
    + 'Drone Bombing IV (on for that turn\'s plays), Passion Weakness on the target, Passion Attack Cards this turn (Drone Bombing '
    + 'III). Not counted: Tenacity damage, Engagement Fire\'s Piercing (3-1)',
  effects: [
    // 5-1 (Prydwen): "+5% Damage for Selena's Engagement Fire. If Selena's Additional Damage is greater than 15%, an additional +5% to
    // that value": raises the card %, like Rei's 5-1 (not unlocked by the owner: Engagement Fire 112% = 100% x 1.12). The extra +5%
    // needs a stat the engine doesn't read: not counted
    { kind: 'Buff', id: 'p5-1-fire', name: 'Basic Card Proficiency', category: 'Potential', type: 'Card +', value: '+5%',
      appliesTo: 'Engagement Fire', hitScope: 'All hits', condition: 'Always' },
    // 7 (Prydwen): "+4% Passion Attribute Damage. If Selena's Bonus Damage exceeds 30%, an additional +4%": as Tenebria's 7
    { kind: 'Buff', id: 'p7-passion', name: 'Unique Stat Upgrade', category: 'Potential', value: '+4%', appliesTo: 'Passion',
      hitScope: 'All hits', condition: 'Always' },
    { kind: 'Buff', id: 'p7-passion-bonus', name: 'Unique Stat Upgrade (Bonus Damage)', category: 'Potential', value: '+4%',
      appliesTo: 'Passion', hitScope: 'All hits', condition: 'Always', hint: 'Bonus Damage > 30%' },
    // E2 Awakening Memory (in game): "Selena's Mark damage is increased by +20%"
    { kind: 'Buff', id: 'e2-mark', name: "Selena's Mark damage", category: 'Ego Manifestation', value: '+20%', appliesTo: 'Mark',
      hitScope: 'All hits', condition: 'Always', egoLevel: 2 },
    // E4 Inner Memory (in game): "+50% Damage Amount to Final Shot, and increase Mark by 1" (350% on the card)
    { kind: 'Buff', id: 'e4-final-shot', name: 'Damage Amount to Final Shot', category: 'Ego Manifestation', value: '+50%',
      appliesTo: 'Final Shot', hitScope: 'All hits', condition: 'Always', egoLevel: 4 },
  ],
  // Mark on the target: Selena's 100% Extra Attack on every Attack Card play. E6 Liberated Memory (in game): "When Selena's Mark is
  // activated, she has a 30% chance to inflict 100% Extra Attack on the target"
  triggers: [
    { card: 'mark', on: 'Attack', counter: 'Mark' },
    { card: 'mark-e6', on: 'Attack', counter: 'Mark', chance: 0.3, egoLevel: 6 },
  ],
  // Card text: the in-game wording (owner's screenshots, 2026-10-28), with tokens for the build's numbers (engine/cardText.ts)
  cards: {
    // Ego skill: 350% at E4 (300% + E4's +50%), Mark 3 -> 4
    'card-394': { text: '{E4:350%|{300%}} Damage\n{E4:4|3} Mark' },
    // 3-1 (Prydwen): "Engagement Fire card is changed to deal Piercing Damage" (not unlocked by the owner)
    'card-395': { text: '{100%} Damage' },
    'card-396': { text: '{100%} Shield' },

    // High-Power Scope, I–V
    'card-397': { text: '2 Mark' },
    'card-398': { text: '2 Mark\nIf the Anticipated Action of the target is in an Attack state, add 2 Mark' },
    'card-399': { text: 'When an Attack Card of this unit is activated, 1 Mark to the target' },
    'card-400': {
      text: '2 Mark\n+50% Mark Damage for 1 turn',
      effects: [cardBuff('mark-dmg', 'Mark Damage for 1 turn', '+50%', 'Mark', { counter: 'High-Power Scope III', maxStacks: 1 })],
    },
    'card-401': {
      text: 'For 1 turn, when an Attack Card of another Combatant is activated, 100% Coordinated Attack to the target',
      triggers: [{ card: 'coordinated', on: 'Attack', others: true, counter: 'High-Power Scope IV', maxStacks: 1 }],
    },
    'card-402': { text: 'At the start of the turn, 1 Mark to all enemies' },

    // Target Spotted, I–V
    'card-403': { text: '{150%} Damage\nAttunement: 1 Mark to a random enemy' },
    'card-404': { text: '{100%} Damage\nAttunement: 300% Damage to a random enemy', creates: ['ts-attunement'] },
    'card-405': { text: '{150%} Damage\n2 Mark\nIf the target is in a Mark state, add 2 Mark' },
    'card-406': { text: '{150%} Shield\n2 Mark to all enemies' },
    'card-407': { text: '{150%} Shield\nAttunement: Draw 1' },
    'card-408': { text: 'On Ravage, 200% Coordinated Attack to the target', creates: ['ts-ravage'] },

    // Drone Bombing, I–V
    'card-409': { text: '{120%} Damage to all enemies, 1 Passion Weakness', effects: [passionWeakness] },
    'card-410': { text: '{120%} Damage to all enemies, 2 Passion Weakness', effects: [passionWeakness] },
    'card-411': { text: '{120%} Damage to all enemies\nStreak: 2 Mark to all enemies' },
    'card-412': {
      text: '{120%} Damage to all enemies\n+40% base Damage Amount for each Passion Attack Card activated this turn',
      effects: [cardBuff('passion-cards', 'base Damage Amount for each Passion Attack Card activated this turn', '+40%', 'Drone Bombing III',
        { type: 'Base %', counter: 'Passion Attack Cards this turn' })],
    },
    'card-413': {
      text: 'For 1 turn, when performing a Attack Weakness, 100% chance to trigger Coordinated Attack on the target',
      triggers: [{ card: 'coordinated', on: 'ALL', weakness: true, counter: 'Drone Bombing IV', maxStacks: 1 }],
    },
    'card-414': {
      text: 'When a Passion Attack Card is activated, 50% Coordinated Attack to the target',
      triggers: [{ card: 'coordinated-50', on: 'Passion & Attack' }],
    },

    // Tactical Maneuver, I–V
    'card-415': { text: '{150%} Shield\n2 Tenacity Damage' },
    'card-416': { text: '{225%} Shield\n3 Tenacity Damage' },
    'card-417': { text: '{150%} Damage\nIncrease Tenacity Damage of this card by 150%' },
    'card-418': { text: '{225%} Shield\n2 Tenacity Damage\n2 Mark to enemies in a Ravage state' },
    'card-419': { text: '[Retain]\nIf the target is in a Ravage state, recharge Tenacity' },
    'card-420': { text: '1 Tenacity Damage to all enemies and 1 Mark' },

    // E1 Sleeping Memory: Initiation
    'card-421': {
      text: '[Unique{E1: / Initiation}]\n+80% Mark Damage',
      effects: [cardBuff('mark-dmg', 'Mark Damage', '+80%', 'Mark')],
    },
  },
  extraCards: [
    effectHit('mark', 'Mark', 1, 'Mark',
      'When an Attack Card is activated, inflict 100% Extra Attack, inflict Tenacity Damage equal to 0 Cost, and decrease Mark by 1'),
    effectHit('mark-e6', 'Mark (E6 Extra Attack)', 1, '',
      "When Selena's Mark is activated, she has a 30% chance to inflict 100% Extra Attack on the target"),
    effectHit('coordinated', 'Coordinated Attack', 1, 'Coordinated Attack', '100% Coordinated Attack to the target'),
    effectHit('coordinated-50', 'Coordinated Attack (Drone Bombing V)', 0.5, 'Coordinated Attack', '50% Coordinated Attack to the target'),
    // Target Spotted V: one play per Ravage
    effectHit('ts-ravage', 'Coordinated Attack (On Ravage)', 2, 'Coordinated Attack', 'On Ravage, 200% Coordinated Attack to the target',
      { targetRavaged: true, image: 'cards/selena/unique_1005_02.webp', notes: 'One play per Ravage' }),
    // Target Spotted I: the Attunement damage when the card is drawn, a play of its own
    effectHit('ts-attunement', 'Target Spotted I (Attunement)', 3, '', 'Attunement: 300% Damage to a random enemy',
      { kind: 'Normal', image: 'cards/selena/unique_1005_02.webp', notes: 'One play per draw' }),
  ],
} satisfies CharacterAdditions
