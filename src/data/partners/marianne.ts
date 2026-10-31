import type { PartnerPreset } from '../../engine/types'

export default {
  name: 'Marianne', class: 'Striker', baseHp: 144, baseDef: 5, baseAtk: 155,
  notes: 'Base stats are already included in the stats-screen numbers (not added again)',
  effects: [
    // In-game (owner, 2026-10-27): "Increase the assigned Combatant's Attack by 16%."
    { kind: 'Stat', id: 'atk', name: 'Attack', category: 'Partner', stat: 'ATK%', value: '16%', classLimited: true },
    // "...and +5% Weakness Damage Amount."
    { kind: 'Stat', id: 'weak', name: 'Weakness Damage Amount', category: 'Partner', stat: 'Weakness DMG', value: '5%', classLimited: true },
    // "Increase Damage Amount dealt by the assigned Combatant to targets in a Ravage state by 15%.": no '+', so
    // multiplicative (owner's rule)
    {
      kind: 'Buff', id: 'ravaged', name: 'Damage Amount to targets in a Ravage state', category: 'Partner', value: '15%',
      appliesTo: 'ALL', hitScope: 'All hits', condition: 'Ravaged only', classLimited: true,
    },
    // "Always apply the assigned Combatant's Basic Cards as Weakness Damage": Weakness DMG applies to Basic
    // Attack cards even when the target isn't weak
    {
      kind: 'Buff', id: 'basic-weak', name: 'Basic Cards always apply as Weakness Damage', category: 'Partner',
      value: 'Weakness Attack', appliesTo: 'Basic Attack', hitScope: 'All hits', condition: 'Always', classLimited: true,
    },
  ],
} satisfies PartnerPreset
