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
}
