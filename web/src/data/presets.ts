// Characters, partners and their effects. Add new ones here (keep effect ids unique per owner).
// Effect value: as shown in-game. Stats: '16%' or '74'. Buffs: '+30%' = additive, '30%' = multiplicative,
// 'Weakness Attack' = Weakness DMG applies to matching cards. See docs/FORMULA.md for the rules.
import type { Presets } from '../engine/types'

export const PRESETS: Presets = {
  characters: [
    {
      name: 'Mei Lin', element: 'Passion', class: 'Striker',
      notes: 'Character buffs still to be entered (many are conditional)',
      effects: [],
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
