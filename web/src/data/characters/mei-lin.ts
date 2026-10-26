// Mei Lin: our additions to the Prydwen import (src/data/prydwen/mei-lin.json). Card keys are the import's ids.
// Damage % follows the "+" rule: 'by 20%' (no "+") = multiplicative, '+20%' = additive (owner, 2026-10-25).
// Extra hits (Combo, Spire V, the Ego skill) are set per play in the rotation.
import type { CharacterAdditions } from '../../engine/types'
import { cardBuff, stacks } from '../helpers'

const passionWeakness = cardBuff('weak', 'Passion Weakness on the target', 'Weakness Attack', 'ALL', {
  notes: 'Applied when an Attack card is used. Unconfirmed whether the first Attack card already gets it',
})
/** Spirit of the Aromata: from its play on, each own card played (that one included) adds a stack (owner, 2026-10-25).
 * Each variant has its own counter, named after the card. */
const aromata = (card: string, name: string, value: string, appliesTo: string, on = 'ALL', notes?: string) => [
  stacks('stack', `${name}: stack per card`, card, 1, 'afterSelf', { on }),
  cardBuff('dmg', name, value, appliesTo, { maxStacks: 20, counter: card, notes }),
]
const ember = (amount: number) => ({ effects: [stacks('ember', `Applies ${amount} Ember`, 'Ember', amount, 'self')] })

const awakensNote = 'Flame Dragon Awakens: for 1 turn after one of her attacks Ravages an enemy. Switch off if it isn\'t up'

export default {
  notes: 'Stat potentials are in the stats screen; card upgrades are set on the Setup tab. Ember is counted along the rotation. '
    + 'Not modeled: E3 (set the hits per play), E6, Embers from Jewel IV crits, Sovereignty keeping Embers',
  effects: [
    // Ember (owner, 2026-10-25): +30% additive per stack (max 5) against a Ravaged target, one used per hit.
    // Stacks land before the damage of the card that applies them.
    { kind: 'Buff', id: 'ember', name: 'Ember on the target', category: 'Character', value: '+30%', appliesTo: 'ALL',
      hitScope: 'All hits', condition: 'Ravaged only', maxStacks: 5, counter: 'Ember', consumePerHit: true,
      notes: 'Only on cards marked Target Ravaged. Unconfirmed: the target holds at most 5 Embers' },
    // Potentials not on the stats screen
    { kind: 'Stacks', id: 'p3-1-ember', name: 'Potential 3-1: Strike applies 1 more Ember', category: 'Potential',
      counter: 'Ember', amount: 1, trigger: 'always', on: 'Strike' },
    { kind: 'Buff', id: 'p5-1-strike', name: 'Potential 5-1: Strike damage', category: 'Potential', type: 'Card %', value: '+5%',
      appliesTo: 'Strike', hitScope: 'All hits', condition: 'Always',
      notes: 'Part of the in-game card %, so it only counts on cards entered at base % (with a potential upgrade)' },
    { kind: 'Buff', id: 'p5-1-atk', name: 'Potential 5-1: Strike damage, Attack above 500', category: 'Potential', type: 'Card %',
      value: '+5%', appliesTo: 'Strike', hitScope: 'All hits', condition: 'Always', notes: 'Switch off if her Attack is 500 or less' },
    // Manifest Ego (dupes): on from the build's level
    { kind: 'Buff', id: 'e1-crit', name: "E1: Sovereignty crits Ravaged targets", category: 'Ego Manifestation', type: 'Crit Chance',
      value: '100%', appliesTo: "Flame Dragon's Sovereignty", hitScope: 'All hits', condition: 'Ravaged only', egoLevel: 1 },
    { kind: 'Stacks', id: 'e2-ember', name: 'E2: damaging cards apply 1 Ember', category: 'Ego Manifestation',
      counter: 'Ember', amount: 1, trigger: 'always', damagingOnly: true, egoLevel: 2 },
    { kind: 'Buff', id: 'e4-atk', name: 'E4: Flame Dragon Awakens, Attack card damage', category: 'Ego Manifestation',
      value: '+20%', appliesTo: 'Attack', hitScope: 'All hits', condition: 'Always', egoLevel: 4, notes: awakensNote },
    { kind: 'Buff', id: 'e4-ravaged', name: 'E4: Flame Dragon Awakens, damage vs Ravaged', category: 'Ego Manifestation',
      value: '+20%', appliesTo: 'ALL', hitScope: 'All hits', condition: 'Ravaged only', egoLevel: 4, notes: awakensNote },
  ],
  cards: {
    // Flame Dragon Guardian, Heavenly Flame Dragon (Ego skill)
    'card-339': { notes: 'Shield only, no damage' },
    'card-337': { notes: 'Ego skill (6 EP). Add the extra hit on each of the next 4 Strike plays' },

    // Flame Dragon's Jewel, I–V
    'card-340': { effects: [cardBuff('atk', 'Attack card damage', '20%', 'Attack'), passionWeakness] },
    'card-341': { effects: [cardBuff('atk', 'Attack card damage', '30%', 'Attack'), passionWeakness] },
    'card-342': { notes: 'Tenacity Damage is not counted', effects: [cardBuff('atk', 'Attack card damage', '20%', 'Attack')] },
    'card-343': {
      effects: [cardBuff('atk', 'Attack card damage', '20%', 'Attack'), passionWeakness,
        stacks('ember', 'Attack cards apply 1 Ember', 'Ember', 1, 'always', { on: 'Attack' })],
    },
    'card-344': {
      notes: 'Tenacity Damage and Embers are not counted',
      effects: [{ kind: 'Stat', id: 'crit', name: 'Crit Chance', category: 'Card Epiphany', stat: 'Crit Rate', value: '30%' }],
    },
    'card-345': { targetRavaged: true, notes: 'The upgrade itself deals no damage: each play in the rotation stands for one Ravage (300%)' },

    // Rising Dragon Spire, I–V
    'card-346': { notes: 'Combo: set 2 hits on the play', ...ember(2) },
    'card-347': { notes: 'Combo: set 3 hits on the play', ...ember(2) },
    'card-348': { notes: 'Combo: set 2 hits on the play', ...ember(3) },
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
    'card-358': { effects: aromata('Spirit of the Aromata', 'Damage per own card used', '+20%', 'ALL') },
    'card-359': {
      effects: aromata('Spirit of the Aromata I', 'Damage per Passion card used', '+20%', 'ALL', 'Passion',
        "Allies' Passion cards also add stacks: not counted"),
    },
    'card-360': { effects: aromata('Spirit of the Aromata II', 'Damage per own card used', '+30%', 'ALL') },
    'card-361': { effects: aromata('Spirit of the Aromata III', 'Damage per own card used', '+20%', 'ALL') },
    'card-362': {
      notes: 'Assumes a single enemy (the Ember goes on a random one)',
      effects: [stacks('ember', '1 Ember per own card used', 'Ember', 1, 'afterSelf')],
    },
    'card-363': { effects: aromata('Spirit of the Aromata V', 'Basic card damage per own card used', '+50%', 'Basic') },
  },
} satisfies CharacterAdditions
