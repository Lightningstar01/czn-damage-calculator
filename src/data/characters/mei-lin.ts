// Mei Lin: our additions to the Prydwen import (src/data/prydwen/mei-lin.json). Card keys are the import's ids.
// Damage % follows the "+" rule: 'by 20%' (no "+") = multiplicative, '+20%' = additive (owner, 2026-10-25).
// Extra hits (Combo, Spire V, the Ego skill) are set per play in the attack list.
import type { CharacterAdditions } from '../../engine/types'
import { cardBuff } from '../helpers'

// Applied when an Attack card is used. Unconfirmed whether the first Attack card already gets it.
const passionWeakness = cardBuff('weak', 'Passion Weakness', 'Weakness Attack', 'ALL')
/** Spirit of the Aromata: from its play on, each own card played (that one included) adds a stack (owner, 2026-10-25).
 * Each variant has its own counter, named after the card; the stacks are set on each play of the attack list. */
const aromata = (card: string, name: string, value: string, appliesTo: string, hint?: string) => [
  cardBuff('dmg', name, value, appliesTo, { maxStacks: 20, counter: card, hint }),
]
const ember = (amount: number) => `Applies ${amount} Ember (count it in the Ember stacks of the plays after it)`

// Flame Dragon Awakens: for 1 turn after one of her attacks Ravages an enemy.
const awakens = '1 turn after a Ravage'

export default {
  notes: 'Stat potentials are in the stats screen; card upgrades are set on the Setup tab. Ember and Spirit of the Aromata stacks are '
    + 'set on each play of the attack list (Cards tab). Ember sources: E2 1 per damaging card, Potential 3-1 +1 per Strike, '
    + 'Spire / I / II 2 / 2 / 3, Jewel III 1 per Attack card, Aromata IV 1 per card. '
    + 'Not modeled: E3 (set the hits per play), E6, Embers from Jewel IV crits, Sovereignty keeping Embers',
  effects: [
    // Ember (owner, 2026-10-25): "When hitting or putting a target in a Ravage state, deal +30% Damage for each stack of
    // Ember the target has (up to 5 stacks). Upon activation, an Ember is removed." Only on cards marked Target Ravaged.
    // The stacks on the target are set per play (snapshot, owner 2026-10-26).
    { kind: 'Buff', id: 'ember', name: 'Ember', category: 'Character', value: '+30%', appliesTo: 'ALL',
      hitScope: 'All hits', condition: 'Ravaged only', maxStacks: 5, counter: 'Ember' },
    // Potentials not on the stats screen (Potential 3-1, +1 Ember per Strike, goes in the Ember stacks per play)
    // Potential 5-1 "+5% Mei Lin's Strike Damage. If Mei Lin's Attack is above 500, an additional +5%." Part of the in-game
    // card % (owner's 132% check), so it only counts on cards entered at base %. The extra +5% follows the stats-screen Attack.
    { kind: 'Buff', id: 'p5-1-strike', name: 'Basic Card Proficiency', category: 'Potential', type: 'Card %', value: '+5%',
      appliesTo: 'Strike', hitScope: 'All hits', condition: 'Always', attackBonus: { above: 500, value: '+5%' } },
    // Manifest Ego (dupes): on from the build's level
    { kind: 'Buff', id: 'e1-crit', name: 'E1 Sleeping Memory', category: 'Ego Manifestation', type: 'Crit Chance',
      value: '100%', appliesTo: "Flame Dragon's Sovereignty", hitScope: 'All hits', condition: 'Ravaged only', egoLevel: 1 },
    { kind: 'Buff', id: 'e4-atk', name: 'E4 Flame Dragon Awakens', category: 'Ego Manifestation',
      value: '+20%', appliesTo: 'Attack', hitScope: 'All hits', condition: 'Always', egoLevel: 4, hint: awakens },
    { kind: 'Buff', id: 'e4-ravaged', name: 'E4 Flame Dragon Awakens', category: 'Ego Manifestation',
      value: '+20%', appliesTo: 'ALL', hitScope: 'All hits', condition: 'Ravaged only', egoLevel: 4, hint: awakens },
  ],
  cards: {
    // Flame Dragon Guardian, Heavenly Flame Dragon (Ego skill)
    'card-339': { notes: 'Shield only, no damage' },
    'card-337': { notes: 'Ego skill (6 EP). Add the extra hit on each of the next 4 Strike plays' },

    // Flame Dragon's Jewel, I–V
    'card-340': { effects: [cardBuff('atk', 'Attack Card Damage Amount', '20%', 'Attack'), passionWeakness] },
    'card-341': { effects: [cardBuff('atk', 'Attack Card Damage Amount', '30%', 'Attack'), passionWeakness] },
    'card-342': { notes: 'Tenacity Damage is not counted', effects: [cardBuff('atk', 'Attack Card Damage Amount', '20%', 'Attack')] },
    'card-343': {
      notes: 'Attack cards apply 1 Ember (count it in the Ember stacks per play)',
      effects: [cardBuff('atk', 'Attack Card Damage Amount', '20%', 'Attack'), passionWeakness],
    },
    'card-344': {
      notes: 'Tenacity Damage and Embers are not counted',
      effects: [{ kind: 'Stat', id: 'crit', name: 'Crit Chance', category: 'Card Epiphany', stat: 'Crit Rate', value: '30%' }],
    },
    'card-345': { targetRavaged: true, notes: 'The upgrade itself deals no damage: each play in the attack list stands for one Ravage (300%)' },

    // Rising Dragon Spire, I–V
    'card-346': { notes: `Combo: set 2 hits on the play. ${ember(2)}` },
    'card-347': { notes: `Combo: set 3 hits on the play. ${ember(2)}` },
    'card-348': { notes: `Combo: set 2 hits on the play. ${ember(3)}` },
    'card-349': { notes: 'Add the extra hit on the next Passion card play' },
    'card-350': { notes: 'Add the 2 extra hits on the next Strike play' },
    'card-351': { notes: 'Add the extra hits on the play' },

    // Unity of Attack and Defense I, III, IV, V
    'card-353': {
      effects: [cardBuff('basic', 'Damage Amount of the drawn cards', '50%', 'Basic', { hint: 'the 2 drawn cards, 1 turn' })],
    },
    'card-355': { notes: 'Add the Morale on the Buffs tab (2 per card exhausted)' },
    'card-356': { notes: 'Add the 2 Strikes as plays' },
    'card-357': { effects: [cardBuff('basic', 'Basic Card Damage Amount', '100%', 'Basic')] },

    // Spirit of the Aromata, I–V
    'card-358': { effects: aromata('Spirit of the Aromata', 'Own Damage Amount', '+20%', 'ALL') },
    'card-359': {
      effects: aromata('Spirit of the Aromata I', 'Own Damage Amount', '+20%', 'ALL', "stacks: Passion cards, allies' too"),
    },
    'card-360': { effects: aromata('Spirit of the Aromata II', 'Own Damage Amount', '+30%', 'ALL') },
    'card-361': { effects: aromata('Spirit of the Aromata III', 'Own Damage Amount', '+20%', 'ALL') },
    'card-362': {
      notes: 'Each own card used after it applies 1 Ember (on a random enemy; count it in the Ember stacks per play)',
    },
    'card-363': { effects: aromata('Spirit of the Aromata V', 'Own Basic Card Damage Amount', '+50%', 'Basic') },
  },
} satisfies CharacterAdditions
