// Mei Lin: our additions to the Prydwen import (src/data/prydwen/mei-lin.json). Card keys are the import's ids.
// Damage % follows the "+" rule: 'by 20%' (no "+") = multiplicative, '+20%' = additive (owner, 2026-10-25).
// Extra hits (Combo, Spire V, the Ego skill) are set per play in the rotation.
import type { CharacterAdditions } from '../../engine/types'
import { cardBuff } from '../helpers'

const passionWeakness = cardBuff('weak', 'Passion Weakness on the target', 'Weakness Attack', 'ALL', {
  notes: 'Applied when an Attack card is used. Unconfirmed whether the first Attack card already gets it',
})
const aromataNote = 'One stack per card used after it this turn: set the stacks (one number for the whole rotation)'

export default {
  notes: 'Character buffs still to be entered (many are conditional)',
  cards: {
    // Flame Dragon Guardian, Heavenly Flame Dragon (Ego skill)
    'card-339': { notes: 'Shield only, no damage' },
    'card-337': { notes: 'Ego skill (6 EP). Add the extra hit on each of the next 4 Strike plays' },

    // Flame Dragon's Jewel, I–V
    'card-340': { effects: [cardBuff('atk', 'Attack card damage', '20%', 'Attack'), passionWeakness] },
    'card-341': { effects: [cardBuff('atk', 'Attack card damage', '30%', 'Attack'), passionWeakness] },
    'card-342': { notes: 'Tenacity Damage is not counted', effects: [cardBuff('atk', 'Attack card damage', '20%', 'Attack')] },
    'card-343': { notes: 'Embers are not counted', effects: [cardBuff('atk', 'Attack card damage', '20%', 'Attack'), passionWeakness] },
    'card-344': {
      notes: 'Tenacity Damage and Embers are not counted',
      effects: [{ kind: 'Stat', id: 'crit', name: 'Crit Chance', category: 'Card Epiphany', stat: 'Crit Rate', value: '30%' }],
    },
    'card-345': { targetRavaged: true, notes: 'The upgrade itself deals no damage: each play in the rotation stands for one Ravage (300%)' },

    // Rising Dragon Spire, I–V
    'card-346': { notes: 'Combo: set 2 hits on the play' },
    'card-347': { notes: 'Combo: set 3 hits on the play' },
    'card-348': { notes: 'Combo: set 2 hits on the play' },
    'card-349': { notes: 'Add the extra hit on the next Passion card play' },
    'card-350': { notes: 'Add the 2 extra hits on the next Strike play' },
    'card-351': { notes: 'Add the extra hits on the play' },

    // Unity of Attack and Defense I, III, IV, V
    'card-353': {
      effects: [cardBuff('basic', 'Drawn Basic card damage', '50%', 'Basic', { notes: 'Only the 2 cards it draws, for 1 turn: switch off if not' })],
    },
    'card-355': { notes: 'Add the Morale on the Buffs tab (2 per card exhausted)' },
    'card-356': { notes: 'Add the 2 Strikes as plays' },
    'card-357': { effects: [cardBuff('basic', 'Basic card damage', '100%', 'Basic')] },

    // Spirit of the Aromata, I–V
    'card-358': { effects: [cardBuff('dmg', 'Damage per own card used', '+20%', 'ALL', { maxStacks: 20, notes: aromataNote })] },
    'card-359': {
      effects: [cardBuff('dmg', 'Damage per Passion card used', '+20%', 'ALL', {
        maxStacks: 20,
        notes: 'One stack per Passion card used after it this turn, allies included: set the stacks (one number for the whole rotation)',
      })],
    },
    'card-360': { effects: [cardBuff('dmg', 'Damage per own card used', '+30%', 'ALL', { maxStacks: 20, notes: aromataNote })] },
    'card-361': { effects: [cardBuff('dmg', 'Damage per own card used', '+20%', 'ALL', { maxStacks: 20, notes: aromataNote })] },
    'card-362': { notes: 'Embers are not counted' },
    'card-363': { effects: [cardBuff('dmg', 'Basic card damage per own card used', '+50%', 'Basic', { maxStacks: 20, notes: aromataNote })] },
  },
} satisfies CharacterAdditions
