// Amir: our additions to the Prydwen import (src/data/prydwen/amir.json). Card keys are the import's ids.
// Damage % follows the "+" rule: 'by 20%' (no "+") = multiplicative, '+20%' = additive (owner, 2026-10-25).
// Metallization (in game): "When Shield is gained through an ability, 80% Defense-Based Damage to a random enemy, 80% Shield, and decrease
// Metallization by 1": a play of its own, one per strike, normal Order damage that isn't a card, unraised by card upgrades (owner, 2026-11-01).
// Full Metal Hurricane's bonuses reach Metallization strikes only, not its own hit (owner, 2026-11-01).
// Full Metal Hurricane III: 224% once when played; the end-of-turn 120% is its own unraised play (owner, 2026-11-01).
import type { CharacterAdditions } from '../../engine/types'
import { cardBuff, effectHits, EGO_POTENTIALS_PLUS_3 } from '../helpers'

const METALLIZATION = 'metallization'
const HURRICANE_III_END = 'hurricane-iii-end'
const IN_METALLIZATION = 'In Metallization state'

/** A hit from an effect, not a card: Defense-Based, unraised by card upgrades. */
const effectHit = effectHits({ element: 'Order', scaling: 'DEF' })

/** A 'for 1 turn' bonus on Metallization strikes: a switch on each strike's play. */
const strikeBuff = (name: string, value: string, card: string) =>
  [cardBuff('metallization-dmg', name, value, 'Metallization', { counter: card, maxStacks: 1 })]

const allEnemiesText = (value: string) => `For 1 turn, Metallization targets all enemies and ${value} Damage Amount`

export default {
  verified: { date: '2026-11-01', gameVersion: '841' },
  // Metal Pierce I usually has Metallization to use: the switch is on each play (Cards tab)
  playStacks: { [IN_METALLIZATION]: 1 },
  notes: 'Card upgrades are set on the Setup tab. Metallization is always in the deck: add one play per strike. Per play (Cards tab): Metal Extraction V and '
    + 'Full Metal Hurricane / I / II / IV on the strikes of that turn (II also hits twice), In Metallization state (Metal Pierce I; starts on), Metallization decreased '
    + '(Metal Pierce II, up to 2), Hits on Full Metal Hurricane V (3 + Metallization decreased, up to 2), Hits on Full Metal Hurricane III (end of turn) (Metallization '
    + 'decreased, up to 2; one play per turn), Vulnerable where a card inflicts it. Not counted: Counterattack (Hovering Metal II), other enemies (all-enemy damage counts one target), Shields, Damage Reduction, Weaken and Damage Taken',
  // Potential nodes in the game's wording (owner's screenshots, 2026-11-01)
  potentials: {
    '3-1': { text: 'Add the following effect to the Steel Barrier card: 1 Metallization' },
    '5-1': { text: "+5% Damage Amount to Amir's Rapier\nIf Amir's Defense is 250 or higher, add an additional +5% to the modifier" },
    '7': { text: "+10% Damage Amount to Metallization\nIf Amir's Defense is 300 or higher, add an additional +10% to the modifier" },
  },
  // Manifest Ego in the game's wording (owner's screenshots, 2026-11-01)
  ego: {
    1: { text: 'The Iron Skin card has Finale removed, its damage reduction increased by 20%, and it now consumes up to a maximum of 3 Metallization.' },
    2: { text: 'At the start of battle, gain 2 Metallization.' },
    3: { text: EGO_POTENTIALS_PLUS_3 },
    4: { text: "Changes Steel Resolve's Shield gain effect to 150% per 1 Metallization removed, and increases the Metallization gain effect at the start of the next turn by 2." },
    5: { text: EGO_POTENTIALS_PLUS_3 },
    6: { text: 'At the start of the turn, gain 1 Metallization.' },
  },
  effects: [
    // 5-1 (in game): "+5% Damage Amount to Amir's Rapier. If Amir's Defense is 250 or higher, add an additional +5% to the modifier":
    // raises the card %, like Selena's 5-1 (not unlocked by the owner: Rapier 112% = 100% x 1.12)
    { kind: 'Buff', id: 'p5-1-rapier', node: '5-1', name: 'Basic Card Proficiency', category: 'Potential', type: 'Card +', value: '+5%',
      appliesTo: 'Rapier', hitScope: 'All hits', condition: 'Always', thresholdStat: 'Defense',
      thresholdBonus: { above: 250, value: '+5%', orEqual: true } },
    // 7 (in game): "+10% Damage Amount to Metallization. If Amir's Defense is 300 or higher, add an additional +10% to the modifier".
    // Additive: Metallization has no upgrade for a Card + to go into (Unconfirmed: in-game test amir-unconfirmed)
    { kind: 'Buff', id: 'p7-metallization', node: '7', name: 'Unique Stat Upgrade', category: 'Potential', value: '+10%', appliesTo: 'Metallization',
      hitScope: 'All hits', condition: 'Always', thresholdStat: 'Defense', thresholdBonus: { above: 300, value: '+10%', orEqual: true } },
  ],
  // Card text: the in-game wording (owner's screenshots, 2026-11-01), with tokens for the build's numbers (engine/cardText.ts)
  cards: {
    // Ego skill: it comes with every deck, and so does the Metallization it gives. Its Shield % isn't raised by card upgrades
    'card-456': {
      creates: [METALLIZATION],
      text: '{E4:150|120}% Shield for each Metallization\nRemove Metallization\nAt the start of the next turn, {E4:5|3} Metallization',
    },
    'card-457': { text: '{100%} Defense-Based Damage' },
    'card-458': { text: '{100%} Shield\n{P3-1:1 Metallization}' },

    // Hovering Metal, I–V
    'card-459': { text: '3 Damage Reduction\n2 Metallization' },
    'card-460': { text: '3 Damage Reduction\n4 Metallization' },
    'card-461': { text: '2 Damage Reduction\n2 Metallization\n2 Counterattack' },
    'card-462': { text: '[Celestial]\n3 Damage Reduction\n3 Metallization' },
    'card-463': { text: '[Exhaust]\n3 Damage Reduction\n5 Metallization' },
    'card-464': { text: '2 Metallization\nAt the start of the turn, 1 Metallization' },

    // Metal Pierce, I–V
    'card-465': { text: '{90%} Defense-Based Damage × 2\nIf in Metallization state, decrease Metallization by 1 and inflict 2 Vulnerable' },
    'card-466': {
      counterHits: { counter: IN_METALLIZATION, hits: 1 },
      text: '{110%} Defense-Based Damage × 2\nIf in a Metallization state, decrease Metallization by 1, add 1 Hit, inflict 2 Vulnerable',
    },
    'card-467': {
      text: '{200%} Defense-Based Damage\nDecrease Metallization by up to 2\n+150% Damage Amount for each',
      notes: 'Set the Metallization decreased on each play',
      effects: [cardBuff('per-metallization', 'Damage Amount for each Metallization decreased', '+150%', 'Metal Pierce II',
        { counter: 'Metallization decreased', maxStacks: 2 })],
    },
    'card-468': { text: '{90%} Defense-Based Damage × 2\n1 Vulnerable\n2 Metallization' },
    'card-469': { text: '{110%} Defense-Based Damage × 2\n1 Vulnerable\nOn Recover, decrease Cost by 1 for 1 turn until activated' },
    'card-470': { text: '{110%} Defense-Based Damage × 2\nIf in a Metallization state, decrease Metallization by 1, and inflict 2 Vulnerable, 2 Weaken' },

    // Metal Extraction, I–V
    'card-471': { text: '2 Metallization\nFor 1 turn, 2 Resolve' },
    'card-472': { text: '2 Metallization\nIncrease Shield Gain Amount of Skill Cards by 30% for 1 turn' },
    'card-473': { text: '3 Metallization\nFor 1 turn, 3 Resolve' },
    'card-474': { text: '2 Metallization\nFor 1 turn, when a Skill Card is activated, 1 Metallization (max 2 times)' },
    'card-475': { text: '[Celestial]\n2 Metallization\nFor 1 turn, 3 Resolve' },
    'card-476': {
      text: '3 Metallization\nFor 1 turn, +30% Metallization Damage Amount',
      notes: 'Switch it on on the Metallization plays of that turn',
      effects: strikeBuff('Metallization Damage Amount for 1 turn', '+30%', 'Metal Extraction V'),
    },

    // Full Metal Hurricane, I–V
    'card-477': {
      text: `{200%} Defense-Based Damage to all enemies\n${allEnemiesText('+20%')}`,
      notes: 'Switch it on on the Metallization plays of that turn',
      effects: strikeBuff('Metallization Damage Amount for 1 turn', '+20%', 'Full Metal Hurricane'),
    },
    'card-478': {
      text: `{200%} Defense-Based Damage to all enemies\n${allEnemiesText('+60%')}`,
      notes: 'Switch it on on the Metallization plays of that turn',
      effects: strikeBuff('Metallization Damage Amount for 1 turn', '+60%', 'Full Metal Hurricane I'),
    },
    // The added hit is one more hit of the strike, with the strike's buffs (Owen's Wind Charge III)
    'card-479': {
      text: '{200%} Defense-Based Damage to all enemies\nFor 1 turn, add 1 Hit and +50% Damage Amount to Metallization',
      notes: 'Switch it on on the Metallization plays of that turn',
      effects: strikeBuff('Damage Amount to Metallization for 1 turn', '+50%', 'Full Metal Hurricane II'),
      triggers: [{ card: 'card-479', on: 'Metallization', repeat: true, counter: 'Full Metal Hurricane II', maxStacks: 1 }],
    },
    'card-480': {
      creates: [HURRICANE_III_END],
      text: '{200%} Defense-Based Damage to all enemies\nAt the end of the turn, decrease Metallization by up to 2\n120% Defense-Based Damage to all enemies for each',
      notes: 'The end-of-turn damage is its own play',
    },
    'card-481': {
      text: `{80%} Defense-Based Damage × 4 to all enemies\n${allEnemiesText('+20%')}`,
      notes: 'Switch it on on the Metallization plays of that turn',
      effects: strikeBuff('Metallization Damage Amount for 1 turn', '+20%', 'Full Metal Hurricane IV'),
    },
    // Prydwen's hits: 1; in game 3, plus the ones it adds
    'card-482': {
      hits: 3,
      text: '{100%} Defense-Based Damage × 3 to all enemies\nDecrease Metallization by up to 2\nAdd 1 Hit for each',
      notes: 'Set the Hits on each play: 3 + Metallization decreased (up to 2)',
    },

    // Mythic. E1 Sleeping Memory: no Finale, 40%, up to 3
    'card-483': {
      text: '[{E1:Exhaust|Exhaust / Finale}]\nDecrease Damage Taken by {E1:40|20}% for 1 turn\nDecrease up to {E1:3|4} Metallization\nAdditionally decrease Damage Taken by 20% for each',
    },
  },
  extraCards: [
    effectHit(METALLIZATION, 'Metallization', 0.8,
      'When Shield is gained through an ability, 80% Defense-Based Damage to a random enemy, 80% Shield, and decrease Metallization by 1',
      { tags: 'Metallization', image: 'cards/amir/unique_1017_05.webp', notes: 'One play per strike' }),
    // Hits: the Metallization decreased at the end of that turn
    effectHit(HURRICANE_III_END, 'Full Metal Hurricane III (end of turn)', 1.2,
      'At the end of the turn, decrease Metallization by up to 2\n120% Defense-Based Damage to all enemies for each',
      { image: 'cards/amir/unique_1017_02.webp', notes: 'One play per turn; set its Hits to the Metallization decreased (up to 2)' }),
  ],
} satisfies CharacterAdditions
