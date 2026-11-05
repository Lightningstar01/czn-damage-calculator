import type { FragmentSetPreset } from '../engine/types'

// Memory fragment sets (effect names from Prydwen's memory fragments page, 2026-10-27): pieces 2 or 4 (a set is one size only). Stat bonuses are already on the stats
// screen, so mark them onStatsScreen: true (listed for reference, not added again). Triggered buffs default
// to on at max stacks (owner, 2026-10-25). Crit bonuses for some cards only use type 'Crit Chance' / 'Crit DMG'.
// Card tags they rely on: Exhaust, Basic Attack, Counterattack. Element, card type, '1-cost', '2+ cost', '2+ hits',
// DoT and Extra Attack match the card's own fields.
export const FRAGMENT_SETS: FragmentSetPreset[] = [
  {
    // 1 stack each (max once) on Extra Attack, an Attack card created in the Draw Pile, and a draw through an Attack card
    name: 'Battlefield Evolution', pieces: 4, effects: [
      {
        kind: 'Buff', id: 'evolving', name: 'Evolving Battlefield', category: 'Memory Fragment', type: 'Crit DMG', value: '+10%',
        appliesTo: 'ALL', hitScope: 'All hits', condition: 'Always', maxStacks: 3, defaultStacks: 3,
      },
      {
        kind: 'Buff', id: 'evolving-full', name: 'Evolving Battlefield: additional Critical Damage', category: 'Memory Fragment', type: 'Crit DMG',
        value: '+5%', appliesTo: 'ALL', hitScope: 'All hits', condition: 'Always',
      },
    ],
  },
  {
    name: "Beast's Yearning", pieces: 4, effects: [
      {
        kind: 'Buff', id: 'exhaust', name: 'Damage Amount of Justice and Order Exhaust Attack Cards', category: 'Memory Fragment', value: '30%',
        appliesTo: 'Justice/Order & Exhaust & Attack', hitScope: 'All hits', condition: 'Always',
        hint: '5 times per turn',
      },
    ],
  },
  {
    name: 'Black Wing', pieces: 2, effects: [
      { kind: 'Stat', id: 'atk', name: 'Attack', category: 'Memory Fragment', stat: 'ATK%', value: '12%', onStatsScreen: true },
    ],
  },
  {
    // A stack for 1 turn each time an Attack card is used (max 2)
    name: 'Bullet of Order', pieces: 4, effects: [
      {
        kind: 'Buff', id: 'order', name: 'Damage Amount of Order Cards', category: 'Memory Fragment', value: '10%',
        appliesTo: 'Order', hitScope: 'All hits', condition: 'Always', maxStacks: 2, defaultStacks: 2,
      },
    ],
  },
  {
    name: "Conquerer's Aspect", pieces: 4, effects: [
      {
        kind: 'Buff', id: 'crit', name: 'Critical Damage of 1-cost cards', category: 'Memory Fragment', type: 'Crit DMG', value: '+35%',
        appliesTo: '1-cost', hitScope: 'All hits', condition: 'Always',
      },
    ],
  },
  {
    name: 'Cursed Corpse', pieces: 2, effects: [
      {
        kind: 'Buff', id: 'agony', name: 'Damage dealt to target inflicted with Agony', category: 'Memory Fragment', value: '10%',
        appliesTo: 'ALL', hitScope: 'All hits', condition: 'Always', hint: 'target in Agony',
      },
    ],
  },
  {
    name: "Executioner's Tool", pieces: 2, effects: [
      { kind: 'Stat', id: 'critdmg', name: 'Critical Damage', category: 'Memory Fragment', stat: 'Crit DMG', value: '25%', onStatsScreen: true },
    ],
  },
  {
    // A stack when generating or using Exhaust Skill cards (max 15%)
    name: "Glory's Reign", pieces: 4, effects: [
      {
        kind: 'Buff', id: 'allies', name: 'Damage Amount of all allies', category: 'Memory Fragment', target: 'allies', value: '5%',
        appliesTo: 'ALL', hitScope: 'All hits', condition: 'Always', maxStacks: 3, defaultStacks: 3,
      },
    ],
  },
  {
    name: "Healer's Journey", pieces: 2, notes: '+12% Max HP (on the stats screen; HP is not used in damage)', effects: [],
  },
  {
    name: 'Instinctual Growth', pieces: 4, effects: [
      {
        kind: 'Buff', id: 'instinct', name: 'Damage Amount of Instinct Cards', category: 'Memory Fragment', value: '20%',
        appliesTo: 'Instinct', hitScope: 'All hits', condition: 'Always', hint: '3+ cards in hand',
      },
    ],
  },
  {
    name: "Judgment's Flames", pieces: 4, effects: [
      {
        kind: 'Buff', id: 'ravaged', name: 'Damage Amount to Instinct Cards used against Ravaged targets', category: 'Memory Fragment', value: '+50%',
        appliesTo: 'Instinct', hitScope: 'All hits', condition: 'Ravaged only',
      },
    ],
  },
  {
    name: 'Line of Justice', pieces: 4, effects: [
      {
        kind: 'Buff', id: 'crit', name: 'Critical Chance of cards that cost 2 or more', category: 'Memory Fragment', type: 'Crit Chance', value: '+20%',
        appliesTo: '2+ cost', hitScope: 'All hits', condition: 'Always',
      },
    ],
  },
  {
    name: 'Offering of the Void', pieces: 4, effects: [
      {
        kind: 'Buff', id: 'void', name: 'Damage Amount of Void Cards', category: 'Memory Fragment', value: '20%',
        appliesTo: 'Void', hitScope: 'All hits', condition: 'Always', hint: '1 turn after an Exhaust',
      },
    ],
  },
  {
    name: 'Orb of Inhibition', pieces: 4, effects: [
      {
        kind: 'Buff', id: 'multihit', name: 'Damage Amount to Void cards that hit 2 or more times', category: 'Memory Fragment', value: '+30%',
        appliesTo: 'Void & 2+ hits', hitScope: 'All hits', condition: 'Always',
      },
    ],
  },
  {
    // Max 15% total; the 2 stacks are only turns of duration (owner)
    name: 'Prelude to a Hero', pieces: 4, effects: [
      {
        kind: 'Buff', id: 'crit', name: 'Critical Chance', category: 'Memory Fragment', type: 'Crit Chance', value: '+15%',
        appliesTo: 'ALL', hitScope: 'All hits', condition: 'Always', maxStacks: 1, defaultStacks: 1,
        hint: '1 turn after a Passion/Void Attack Discard',
      },
    ],
  },
  {
    // Max 25% total; the 2 stacks are only turns of duration (owner)
    name: 'Sanguine Thorn', pieces: 4, effects: [
      {
        kind: 'Buff', id: 'fracture', name: 'Critical Damage', category: 'Memory Fragment', type: 'Crit DMG', value: '+25%',
        appliesTo: 'ALL', hitScope: 'All hits', condition: 'Always', maxStacks: 1, defaultStacks: 1,
        hint: '1 turn after a Fracture',
      },
      {
        kind: 'Buff', id: 'dot', name: 'Critical Damage to DoTs', category: 'Memory Fragment', type: 'Crit DMG', value: '+15%',
        appliesTo: 'DoT', hitScope: 'All hits', condition: 'Always', hint: 'after 10+ Fractures',
      },
    ],
  },
  {
    name: "Seth's Scarab", pieces: 2, effects: [
      {
        kind: 'Buff', id: 'basic', name: 'Damage of Basic Cards', category: 'Memory Fragment', value: '20%',
        appliesTo: 'Basic Attack', hitScope: 'All hits', condition: 'Always',
      },
    ],
  },
  {
    // A Powder Snow stack when a Bind card is stacked (1 per combatant)
    name: 'Snowflake of Our First Meeting', pieces: 4, effects: [
      {
        kind: 'Buff', id: 'powder', name: 'Powder Snow: Damage Amount to ally Attack Cards', category: 'Memory Fragment', value: '10%',
        appliesTo: 'Attack', hitScope: 'All hits', condition: 'Always', maxStacks: 2, defaultStacks: 2,
      },
      {
        kind: 'Buff', id: 'powder-justice', name: 'Powder Snow: additional for Justice', category: 'Memory Fragment', value: '5%',
        appliesTo: 'Justice & Attack', hitScope: 'All hits', condition: 'Always', maxStacks: 2, defaultStacks: 2,
        hint: 'same stacks as Powder Snow',
      },
      {
        kind: 'Buff', id: 'powder-crit', name: 'Critical Damage to ally Justice Attack Cards', category: 'Memory Fragment', type: 'Crit DMG',
        value: '+15%', appliesTo: 'Justice & Attack', hitScope: 'All hits', condition: 'Always',
        hint: 'at 2 Powder Snow',
      },
    ],
  },
  {
    name: 'Spark of Passion', pieces: 4, effects: [
      {
        kind: 'Buff', id: 'passion', name: 'Damage Amount of Passion Cards', category: 'Memory Fragment', value: '20%',
        appliesTo: 'Passion', hitScope: 'All hits', condition: 'Always', maxStacks: 1, defaultStacks: 1,
        hint: 'after an Upgrade card',
      },
    ],
  },
  {
    // A stack when Shield is gained through an ability (max 25%)
    name: 'Starlight and Dreams', pieces: 4, effects: [
      {
        kind: 'Buff', id: 'shield', name: 'Damage Amount of Counterattacks and Extra Attacks', category: 'Memory Fragment', value: '5%',
        appliesTo: 'Counterattack/Extra Attack', hitScope: 'All hits', condition: 'Always', maxStacks: 5, defaultStacks: 5,
      },
    ],
  },
  {
    name: "Tetra's Authority", pieces: 2, effects: [
      { kind: 'Stat', id: 'def', name: 'Defense', category: 'Memory Fragment', stat: 'DEF%', value: '12%', onStatsScreen: true },
    ],
  },
  {
    // A stack when a Justice card is stacked
    name: 'Veiled Radiance', pieces: 4, effects: [
      {
        kind: 'Buff', id: 'crit', name: 'Critical Chance to Attack Cards', category: 'Memory Fragment', type: 'Crit Chance', value: '+8%',
        appliesTo: 'Attack', hitScope: 'All hits', condition: 'Always', maxStacks: 2, defaultStacks: 2,
      },
    ],
  },
]
