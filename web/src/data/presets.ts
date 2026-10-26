// Characters, partners and their effects. Add new ones here (keep effect ids unique per owner).
// Effect value: as shown in-game. Stats: '16%' or '74'. Buffs: '+30%' = additive, '30%' = multiplicative,
// 'Weakness Attack' = Weakness DMG applies to matching cards. See docs/FORMULA.md for the rules.
import type { BuffEffect, CardPreset, Presets } from '../engine/types'

/** A card's buff on all hits, always on; category Card Epiphany. */
const cardBuff = (id: string, name: string, value: string, appliesTo: string, extra: Partial<BuffEffect> = {}): BuffEffect => ({
  kind: 'Buff', id, name, category: 'Card Epiphany', value, appliesTo, hitScope: 'All hits', condition: 'Always', ...extra,
})
const passionWeakness = cardBuff('weak', 'Passion Weakness on the target', 'Weakness Attack', 'ALL', {
  notes: 'Applied when an Attack card is used. Unconfirmed whether the first Attack card already gets it',
})
const aromataNote = 'One stack per card used after it this turn: set the stacks (one number for the whole rotation)'

// Card presets: base values from Prydwen (owner, 2026-10-25); the in-game % with potentials is edited on the copy.
// Damage % follows the "+" rule: 'by 20%' (no "+") = multiplicative, '+20%' = additive. Extra hits (Combo, Spire V,
// the Ego skill) are set per play in the rotation. Tags: element and cost are added on copy; Basic = Strike/Guardian.
const MEI_LIN_CARDS: CardPreset[] = [
  { id: 'strike', base: 'Strike', name: 'Strike', cardType: 'Attack', cost: 1, tags: 'Basic, Basic Attack', pct: 1, hits: 1,
    text: '100% Damage.' },
  { id: 'guardian', base: 'Flame Dragon Guardian', name: 'Flame Dragon Guardian', cardType: 'Skill', cost: 1, tags: 'Basic',
    pct: 0, hits: 0, text: '100% Shield.', notes: 'Shield only, no damage' },
  { id: 'ego', base: 'Heavenly Flame Dragon', name: 'Heavenly Flame Dragon', cardType: 'Skill', tags: 'Ego Skill', pct: 0, hits: 0,
    text: 'Next 4 own Basic Attack Card(s), 1 extra Hit(s).', notes: 'Ego skill (6 EP). Add the extra hit on each of the next 4 Strike plays' },

  { id: 'jewel', base: "Flame Dragon's Jewel", name: "Flame Dragon's Jewel", cardType: 'Upgrade', cost: 1, tags: 'Unique, Initiation',
    pct: 0, hits: 0, text: 'Increases Damage Amount of Attack Cards of this unit by 20%. When an Attack Card is used, 1 Passion Weakness to the target.',
    effects: [cardBuff('atk', 'Attack card damage', '20%', 'Attack'), passionWeakness] },
  { id: 'jewel-1', base: "Flame Dragon's Jewel", name: "Flame Dragon's Jewel I", cardType: 'Upgrade', cost: 1, tags: 'Unique, Initiation',
    pct: 0, hits: 0, text: 'Increases Damage Amount of Attack Cards of this unit by 30%. When an Attack Card is used, 1 Passion Weakness to the target.',
    effects: [cardBuff('atk', 'Attack card damage', '30%', 'Attack'), passionWeakness] },
  { id: 'jewel-2', base: "Flame Dragon's Jewel", name: "Flame Dragon's Jewel II", cardType: 'Upgrade', cost: 1, tags: 'Unique, Initiation',
    pct: 0, hits: 0, text: 'Increase Damage Amount of Attack Cards of this unit by 20%. When using an Attack Card, 1 Tenacity Damage to the target.',
    notes: 'Tenacity Damage is not counted', effects: [cardBuff('atk', 'Attack card damage', '20%', 'Attack')] },
  { id: 'jewel-3', base: "Flame Dragon's Jewel", name: "Flame Dragon's Jewel III", cardType: 'Upgrade', cost: 1, tags: 'Unique, Initiation',
    pct: 0, hits: 0, text: 'Increase Damage Amount of Attack Cards of this unit by 20%. When using an Attack Card, 1 Ember and 1 Passion Weakness to the target.',
    notes: 'Embers are not counted', effects: [cardBuff('atk', 'Attack card damage', '20%', 'Attack'), passionWeakness] },
  { id: 'jewel-4', base: "Flame Dragon's Jewel", name: "Flame Dragon's Jewel IV", cardType: 'Upgrade', cost: 1, tags: 'Unique, Initiation',
    pct: 0, hits: 0, text: 'Increase Critical Chance of this unit by 30%. On Critical Hit, 1 Tenacity Damage, 1 Ember.',
    notes: 'Tenacity Damage and Embers are not counted',
    effects: [{ kind: 'Stat', id: 'crit', name: 'Crit Chance', category: 'Card Epiphany', stat: 'Crit Rate', value: '30%' }] },
  { id: 'jewel-5', base: "Flame Dragon's Jewel", name: "Flame Dragon's Jewel V", cardType: 'Upgrade', cost: 2, tags: 'Initiation',
    pct: 3, hits: 1, targetRavaged: true, text: 'Upon Ravage, 300% Damage to the target.',
    notes: 'The upgrade itself deals no damage: each play in the rotation stands for one Ravage (300%)' },

  { id: 'spire', base: 'Rising Dragon Spire', name: 'Rising Dragon Spire', cardType: 'Attack', cost: 1, pct: 1, hits: 1,
    text: '100% Damage. 2 Ember. Combo: Add 1 hit(s).', notes: 'Combo: set 2 hits on the play' },
  { id: 'spire-1', base: 'Rising Dragon Spire', name: 'Rising Dragon Spire I', cardType: 'Attack', cost: 1, pct: 1, hits: 1,
    text: '100% Damage. 2 Ember. Combo: Add 2 hit(s).', notes: 'Combo: set 3 hits on the play' },
  { id: 'spire-2', base: 'Rising Dragon Spire', name: 'Rising Dragon Spire II', cardType: 'Attack', cost: 1, pct: 1.5, hits: 1,
    text: '150% Damage. 3 Ember. Combo: Add 1 hit(s).', notes: 'Combo: set 2 hits on the play' },
  { id: 'spire-3', base: 'Rising Dragon Spire', name: 'Rising Dragon Spire III', cardType: 'Attack', cost: 2, pct: 2, hits: 1,
    text: '200% Damage. Next Passion Card used, 1 extra Hit.', notes: 'Add the extra hit on the next Passion card play' },
  { id: 'spire-4', base: 'Rising Dragon Spire', name: 'Rising Dragon Spire IV', cardType: 'Attack', cost: 1, pct: 1, hits: 1,
    text: '100% Damage. Next own Basic Attack Card used, 2 extra Hits.', notes: 'Add the 2 extra hits on the next Strike play' },
  { id: 'spire-5', base: 'Rising Dragon Spire', name: 'Rising Dragon Spire V', cardType: 'Attack', cost: 2, pct: 1.5, hits: 1,
    text: '150% Damage. For 1 turn, each Passion Card used, 1 extra Hit.', notes: 'Add the extra hits on the play' },

  { id: 'unity', base: 'Unity of Attack and Defense', name: 'Unity of Attack and Defense', cardType: 'Skill', cost: 0, pct: 0, hits: 0,
    text: 'Draw 2 Basic Card(s) of this unit. Decrease Cost of those cards by 1 for 1 turn.' },
  { id: 'unity-1', base: 'Unity of Attack and Defense', name: 'Unity of Attack and Defense I', cardType: 'Skill', cost: 0, pct: 0, hits: 0,
    text: 'Draw 2 Basic Card(s) of this unit, decrease Cost by 1, increase Damage and Shield Gain Amounts of those cards by 50% for 1 turn.',
    effects: [cardBuff('basic', 'Drawn Basic card damage', '50%', 'Basic', { notes: 'Only the 2 cards it draws, for 1 turn: switch off if not' })] },
  { id: 'unity-2', base: 'Unity of Attack and Defense', name: 'Unity of Attack and Defense II', cardType: 'Skill', cost: 0, pct: 0, hits: 0,
    text: 'Move 2 Basic Card(s) of this unit to hand. Decrease Cost of those cards by 1 for 1 turn.' },
  { id: 'unity-3', base: 'Unity of Attack and Defense', name: 'Unity of Attack and Defense III', cardType: 'Skill', cost: 2, pct: 0, hits: 0,
    text: 'Draw 2 own Basic Card(s). Choose up to 2 card(s) in hand to Exhaust. For each card, 2 Morale, 2 Resolve for 1 turn.',
    notes: 'Add the Morale on the Buffs tab (2 per card exhausted)' },
  { id: 'unity-4', base: 'Unity of Attack and Defense', name: 'Unity of Attack and Defense IV', cardType: 'Upgrade', cost: 0, pct: 0, hits: 0,
    text: 'Create 2 Strike card(s). Decrease Cost of those cards by 1.', notes: 'Add the 2 Strikes as plays' },
  { id: 'unity-5', base: 'Unity of Attack and Defense', name: 'Unity of Attack and Defense V', cardType: 'Upgrade', cost: 2, tags: 'Unique',
    pct: 0, hits: 0, text: 'Increase Damage Amount of Basic Cards of this unit by 100%.',
    effects: [cardBuff('basic', 'Basic card damage', '100%', 'Basic')] },

  { id: 'aromata', base: 'Spirit of the Aromata', name: 'Spirit of the Aromata', cardType: 'Skill', cost: 1, tags: 'Retain', pct: 0, hits: 0,
    text: 'For 1 turn, when using an own card +20% own Damage Amount.',
    effects: [cardBuff('dmg', 'Damage per own card used', '+20%', 'ALL', { maxStacks: 20, notes: aromataNote })] },
  { id: 'aromata-1', base: 'Spirit of the Aromata', name: 'Spirit of the Aromata I', cardType: 'Skill', cost: 1, tags: 'Retain', pct: 0, hits: 0,
    text: 'For 1 turn, when using a Passion Card +20% own Damage Amount.',
    effects: [cardBuff('dmg', 'Damage per Passion card used', '+20%', 'ALL', { maxStacks: 20,
      notes: 'One stack per Passion card used after it this turn, allies included: set the stacks (one number for the whole rotation)' })] },
  { id: 'aromata-2', base: 'Spirit of the Aromata', name: 'Spirit of the Aromata II', cardType: 'Skill', cost: 1, tags: 'Retain', pct: 0, hits: 0,
    text: 'For 1 turn, when using an own card +30% own Damage Amount.',
    effects: [cardBuff('dmg', 'Damage per own card used', '+30%', 'ALL', { maxStacks: 20, notes: aromataNote })] },
  { id: 'aromata-3', base: 'Spirit of the Aromata', name: 'Spirit of the Aromata III', cardType: 'Skill', cost: 0, tags: 'Initiation', pct: 0, hits: 0,
    text: 'For 1 turn, when using an own card +20% own Damage Amount.',
    effects: [cardBuff('dmg', 'Damage per own card used', '+20%', 'ALL', { maxStacks: 20, notes: aromataNote })] },
  { id: 'aromata-4', base: 'Spirit of the Aromata', name: 'Spirit of the Aromata IV', cardType: 'Skill', cost: 1, tags: 'Retain', pct: 0, hits: 0,
    text: 'For 1 turn, when using an own card, 1 Ember on a random enemy.', notes: 'Embers are not counted' },
  { id: 'aromata-5', base: 'Spirit of the Aromata', name: 'Spirit of the Aromata V', cardType: 'Skill', cost: 1, tags: 'Retain', pct: 0, hits: 0,
    text: 'For 1 turn, when using an own card, +50% own Basic Card Damage Amount.',
    effects: [cardBuff('dmg', 'Basic card damage per own card used', '+50%', 'Basic', { maxStacks: 20, notes: aromataNote })] },

  { id: 'sovereignty', base: "Flame Dragon's Sovereignty", name: "Flame Dragon's Sovereignty", cardType: 'Attack', cost: 2,
    tags: 'Weakness Attack', pct: 3, hits: 1, weaknessApplies: true, text: '[Weakness Attack] 300% Damage. Destroy: Retain Embers.',
    notes: 'Epiphanies not entered yet' },
]

export const PRESETS: Presets = {
  characters: [
    {
      name: 'Mei Lin', element: 'Passion', class: 'Striker',
      notes: 'Character buffs still to be entered (many are conditional)',
      effects: [],
      cards: MEI_LIN_CARDS,
    },
  ],
  partners: [
    {
      name: 'Marianne', class: 'Striker', baseHp: 144, baseDef: 5, baseAtk: 155,
      notes: 'Base stats are already included in the stats-screen numbers (not added again)',
      effects: [
        { kind: 'Stat', id: 'atk', name: 'Attack', category: 'Partner', stat: 'ATK%', value: '16%', classLimited: true },
        { kind: 'Stat', id: 'weak', name: 'Weakness DMG', category: 'Partner', stat: 'Weakness DMG', value: '5%', classLimited: true },
        {
          kind: 'Buff', id: 'ravaged', name: 'Damage vs Ravaged', category: 'Partner', value: '15%',
          appliesTo: 'ALL', hitScope: 'All hits', condition: 'Ravaged only', classLimited: true,
          notes: "'15% increased damage to Ravaged enemies' — no '+', so multiplicative (owner's rule)",
        },
        {
          kind: 'Buff', id: 'basic-weak', name: 'Basic cards are Weakness Attacks', category: 'Partner',
          value: 'Weakness Attack', appliesTo: 'Basic Attack', hitScope: 'All hits', condition: 'Always', classLimited: true,
          notes: "Weakness DMG applies to Basic Attack cards even when the target isn't weak",
        },
      ],
    },
  ],
  // Memory fragment sets: pieces 2 or 4 (a set is one size only). Stat bonuses are already on the stats
  // screen, so mark them onStatsScreen: true (listed for reference, not added again). Triggered buffs default
  // to on at max stacks (owner, 2026-10-25). Crit bonuses for some cards only use type 'Crit Chance' / 'Crit DMG'.
  // Card tags they rely on: element (Passion, Justice, Order, Instinct, Void), Attack, Exhaust, Basic Attack,
  // Counterattack, and cost tags like 1-cost; '2+ hits' / '2+ cost' / DoT / Extra Attack match automatically.
  fragmentSets: [
    {
      name: 'Battlefield Evolution', pieces: 4, effects: [
        {
          kind: 'Buff', id: 'evolving', name: 'Evolving Battlefield', category: 'Memory Fragment', type: 'Crit DMG', value: '+10%',
          appliesTo: 'ALL', hitScope: 'All hits', condition: 'Always', maxStacks: 3, defaultStacks: 3,
          notes: '1 stack each (max once) on Extra Attack, an Attack card created in the Draw Pile, and a draw through an Attack card',
        },
        {
          kind: 'Buff', id: 'evolving-full', name: 'Evolving Battlefield at 3 stacks', category: 'Memory Fragment', type: 'Crit DMG',
          value: '+5%', appliesTo: 'ALL', hitScope: 'All hits', condition: 'Always',
          notes: 'Only when all 3 stacks are reached: switch off if not',
        },
      ],
    },
    {
      name: "Beast's Yearning", pieces: 4, effects: [
        {
          kind: 'Buff', id: 'exhaust', name: 'Justice/Order Exhaust Attack damage', category: 'Memory Fragment', value: '30%',
          appliesTo: 'Justice/Order & Exhaust & Attack', hitScope: 'All hits', condition: 'Always',
          notes: '5 times per turn (not tracked)',
        },
      ],
    },
    {
      name: 'Black Wing', pieces: 2, effects: [
        { kind: 'Stat', id: 'atk', name: 'Attack', category: 'Memory Fragment', stat: 'ATK%', value: '12%', onStatsScreen: true },
      ],
    },
    {
      name: 'Bullet of Order', pieces: 4, effects: [
        {
          kind: 'Buff', id: 'order', name: 'Order card damage', category: 'Memory Fragment', value: '10%',
          appliesTo: 'Order', hitScope: 'All hits', condition: 'Always', maxStacks: 2, defaultStacks: 2,
          notes: 'A stack for 1 turn each time an Attack card is used (max 2)',
        },
      ],
    },
    {
      name: "Conquerer's Aspect", pieces: 4, effects: [
        {
          kind: 'Buff', id: 'crit', name: '1-cost Crit DMG', category: 'Memory Fragment', type: 'Crit DMG', value: '+35%',
          appliesTo: '1-cost', hitScope: 'All hits', condition: 'Always', notes: 'Tag 1-cost cards "1-cost"',
        },
      ],
    },
    {
      name: 'Cursed Corpse', pieces: 2, effects: [
        {
          kind: 'Buff', id: 'agony', name: 'Damage vs Agony', category: 'Memory Fragment', value: '10%',
          appliesTo: 'ALL', hitScope: 'All hits', condition: 'Always', notes: 'Only vs targets with Agony: switch off if not',
        },
      ],
    },
    {
      name: "Executioner's Tool", pieces: 2, effects: [
        { kind: 'Stat', id: 'critdmg', name: 'Crit DMG', category: 'Memory Fragment', stat: 'Crit DMG', value: '25%', onStatsScreen: true },
      ],
    },
    {
      name: "Glory's Reign", pieces: 4, effects: [
        {
          kind: 'Buff', id: 'allies', name: 'Damage (all allies)', category: 'Memory Fragment', value: '5%',
          appliesTo: 'ALL', hitScope: 'All hits', condition: 'Always', maxStacks: 3, defaultStacks: 3,
          notes: 'A stack when generating or using Exhaust Skill cards (max 15%)',
        },
      ],
    },
    {
      name: "Healer's Journey", pieces: 2, notes: '+12% Max HP (on the stats screen; HP is not used in damage)', effects: [],
    },
    {
      name: 'Instinctual Growth', pieces: 4, effects: [
        {
          kind: 'Buff', id: 'instinct', name: 'Instinct card damage', category: 'Memory Fragment', value: '20%',
          appliesTo: 'Instinct', hitScope: 'All hits', condition: 'Always', notes: 'Only with 3 or more cards in hand',
        },
      ],
    },
    {
      name: "Judgment's Flames", pieces: 4, effects: [
        {
          kind: 'Buff', id: 'ravaged', name: 'Instinct damage vs Ravaged', category: 'Memory Fragment', value: '+50%',
          appliesTo: 'Instinct', hitScope: 'All hits', condition: 'Ravaged only',
        },
      ],
    },
    {
      name: 'Line of Justice', pieces: 4, effects: [
        {
          kind: 'Buff', id: 'crit', name: 'Crit Chance of 2+ cost cards', category: 'Memory Fragment', type: 'Crit Chance', value: '+20%',
          appliesTo: '2+ cost', hitScope: 'All hits', condition: 'Always', notes: 'Tag cards with their cost, e.g. "2-cost"',
        },
      ],
    },
    {
      name: 'Offering of the Void', pieces: 4, effects: [
        {
          kind: 'Buff', id: 'void', name: 'Void card damage', category: 'Memory Fragment', value: '20%',
          appliesTo: 'Void', hitScope: 'All hits', condition: 'Always', notes: 'For 1 turn after a card is Exhausted',
        },
      ],
    },
    {
      name: 'Orb of Inhibition', pieces: 4, effects: [
        {
          kind: 'Buff', id: 'multihit', name: 'Void multi-hit damage', category: 'Memory Fragment', value: '+30%',
          appliesTo: 'Void & 2+ hits', hitScope: 'All hits', condition: 'Always',
        },
      ],
    },
    {
      name: 'Prelude to a Hero', pieces: 4, effects: [
        {
          kind: 'Buff', id: 'crit', name: 'Crit Chance', category: 'Memory Fragment', type: 'Crit Chance', value: '+15%',
          appliesTo: 'ALL', hitScope: 'All hits', condition: 'Always', maxStacks: 1, defaultStacks: 1,
          notes: "For 1 turn after this unit's Passion or Void Attack card is Discarded. Max 15% total; the 2 stacks are only turns of duration (owner)",
        },
      ],
    },
    {
      name: 'Sanguine Thorn', pieces: 4, effects: [
        {
          kind: 'Buff', id: 'fracture', name: 'Crit DMG after Fracture', category: 'Memory Fragment', type: 'Crit DMG', value: '+25%',
          appliesTo: 'ALL', hitScope: 'All hits', condition: 'Always', maxStacks: 1, defaultStacks: 1,
          notes: 'For 1 turn after a card applies Fracture. Max 25% total; the 2 stacks are only turns of duration (owner)',
        },
        {
          kind: 'Buff', id: 'dot', name: 'DoT Crit DMG', category: 'Memory Fragment', type: 'Crit DMG', value: '+15%',
          appliesTo: 'DoT', hitScope: 'All hits', condition: 'Always', notes: 'After 10 or more Fractures applied through cards',
        },
      ],
    },
    {
      name: "Seth's Scarab", pieces: 2, effects: [
        {
          kind: 'Buff', id: 'basic', name: 'Basic card damage', category: 'Memory Fragment', value: '20%',
          appliesTo: 'Basic Attack', hitScope: 'All hits', condition: 'Always',
        },
      ],
    },
    {
      name: 'Snowflake of Our First Meeting', pieces: 4, effects: [
        {
          kind: 'Buff', id: 'powder', name: 'Powder Snow: Attack card damage', category: 'Memory Fragment', value: '10%',
          appliesTo: 'Attack', hitScope: 'All hits', condition: 'Always', maxStacks: 2, defaultStacks: 2,
          notes: 'A stack when a Bind card is stacked (1 per combatant)',
        },
        {
          kind: 'Buff', id: 'powder-justice', name: 'Powder Snow: extra for Justice', category: 'Memory Fragment', value: '5%',
          appliesTo: 'Justice & Attack', hitScope: 'All hits', condition: 'Always', maxStacks: 2, defaultStacks: 2,
          notes: 'Keep the stacks the same as Powder Snow',
        },
        {
          kind: 'Buff', id: 'powder-crit', name: 'Powder Snow x2: Justice Crit DMG', category: 'Memory Fragment', type: 'Crit DMG',
          value: '+15%', appliesTo: 'Justice & Attack', hitScope: 'All hits', condition: 'Always',
          notes: 'Only at 2 Powder Snow stacks: switch off if not',
        },
      ],
    },
    {
      name: 'Spark of Passion', pieces: 4, effects: [
        {
          kind: 'Buff', id: 'passion', name: 'Passion card damage', category: 'Memory Fragment', value: '20%',
          appliesTo: 'Passion', hitScope: 'All hits', condition: 'Always', maxStacks: 1, defaultStacks: 1,
          notes: 'After an Upgrade card is used',
        },
      ],
    },
    {
      name: 'Starlight and Dreams', pieces: 4, effects: [
        {
          kind: 'Buff', id: 'shield', name: 'Counterattack / Extra Attack damage', category: 'Memory Fragment', value: '5%',
          appliesTo: 'Counterattack/Extra Attack', hitScope: 'All hits', condition: 'Always', maxStacks: 5, defaultStacks: 5,
          notes: 'A stack when Shield is gained through an ability (max 25%)',
        },
      ],
    },
    {
      name: "Tetra's Authority", pieces: 2, effects: [
        { kind: 'Stat', id: 'def', name: 'Defense', category: 'Memory Fragment', stat: 'DEF%', value: '12%', onStatsScreen: true },
      ],
    },
    {
      name: 'Veiled Radiance', pieces: 4, effects: [
        {
          kind: 'Buff', id: 'crit', name: 'Attack card Crit Chance', category: 'Memory Fragment', type: 'Crit Chance', value: '+8%',
          appliesTo: 'Attack', hitScope: 'All hits', condition: 'Always', maxStacks: 2, defaultStacks: 2,
          notes: 'A stack when a Justice card is stacked',
        },
      ],
    },
  ],
}
