// Orlea: our additions to the Prydwen import (src/data/prydwen/orlea.json). Card keys are the import's ids.
// Damage % follows the "+" rule: 'by 20%' (no "+") = multiplicative, '+20%' = additive (owner, 2026-10-25).
// Softie's buffs (this turn, and Retain: next Attack card) raise any ally's damage (owner, 2026-10-28).
// Swiftie's Retain "+40% Damage Amount" adds up every turn it is retained (owner, 2026-10-28).
// Annoying "40% Fixed Damage for each card in hand": a Cards in hand setting per play (owner, 2026-10-28).
// Potential 7 "Critical Chance of Combatant" reaches all allies (owner, 2026-10-28).
import type { BuffEffect, CharacterAdditions } from '../../engine/types'
import { cardBuff } from '../helpers'

// Creation cards evolve (★ -> ★★ -> ★★★), so every card that creates one brings all nine into the deck
const creations = ['card-149', 'card-150', 'card-151', 'card-152', 'card-153', 'card-154', 'card-155', 'card-156', 'card-157']
const swifties = 'Swiftie ★/Swiftie ★★/Swiftie ★★★'

/** Softie: "Increase Damage Amount by X% for 1 turn"; "Retain: ... of the next Attack Card activated by X% (max 350%)". */
const softie = (stars: string, value: number): { text: string, effects: BuffEffect[] } => ({
  text: `[Exhaust / Retain / Creation]\nIncrease Damage Amount by ${value}% for 1 turn\n`
    + `Retain: Increase Damage Amount of the next Attack Card activated by ${value}% (max 350%)`,
  effects: [
    cardBuff('turn', 'Increase Damage Amount for 1 turn', `${value}%`, 'ALL', { target: 'allies', counter: `Softie ${stars} used` }),
    cardBuff('retain', 'Retain: Damage Amount of the next Attack Card', `${value}%`, 'Attack',
      { target: 'allies', counter: `Softie ${stars} retains`, maxStacks: Math.floor(350 / value) }),
  ],
})

/** Swiftie: "{X%} Damage", "Retain: +Y% Damage Amount" per turn retained. */
const swiftie = (stars: string, pct: string, retain: number) => ({
  text: `[Exhaust / Retain / Creation]\n{${pct}} Damage\nRetain: +${retain}% Damage Amount`,
  effects: [cardBuff('retain', 'Retain: Damage Amount', `+${retain}%`, `Swiftie ${stars}`, { counter: 'Swiftie retains' })],
})

const sturdie = (shield: string, heal: string) => ({ text: `[Exhaust / Retain / Creation]\n{${shield}} Shield\nRetain: Heal {${heal}}` })

export default {
  notes: 'Stat potentials are in the stats screen; card upgrades are set on the Setup tab. Per play (Cards tab): Softie used this '
    + 'turn / turns retained (any ally\'s damage), Swiftie turns retained, Sacred Censer IV on the next Swiftie, Annoying\'s Cards '
    + 'in hand (I and base) or Creations (II, V), E4 Creation in hand. Not counted: E6 Fixed damage when a Creation is used',
  effects: [
    // 7: "If Orlea's Attack is greater than 700 or Defense is greater than 300, at the start of battle, +6% Critical Chance of Combatant"
    { kind: 'Stat', id: 'p7-crit', name: 'Unique Stat Upgrade', category: 'Potential', target: 'allies', stat: 'Crit Rate', value: '6%',
      hint: 'ATK > 700 or DEF > 300' },
    // E4 Inner Memory: "If holding Creation Card in hand, increase Damage Amount of allies by 10%"
    { kind: 'Buff', id: 'e4-damage', name: 'E4 Inner Memory', category: 'Ego Manifestation', target: 'allies', value: '10%',
      appliesTo: 'ALL', hitScope: 'All hits', condition: 'Always', egoLevel: 4, hint: 'Creation in hand' },
  ],
  // Card text: the in-game wording (owner's screenshots, 2026-10-28), with tokens for the build's numbers (engine/cardText.ts)
  cards: {
    'card-121': { creates: creations, text: 'Create 1 of each Creation★★' },
    'card-122': { text: '{100%} Damage' },
    // In-game name Healing of Light; Potential 3-1's 50% chance is on this card (Prydwen: on Attack, My Minions).
    // 5-1 "Healing of Light's Healing +10%" read as +10% base (Unconfirmed; off in the owner's screenshots)
    'card-123': {
      name: 'Healing of Light', creates: creations,
      text: 'Heal {P5-1:{110%}|{100%}}\n{P3-1:Has a 50% chance to create 1 Creation★}', notes: 'Heal only, no damage',
    },

    // Sacred Censer, I–V
    'card-124': { creates: creations, text: '[Initiation]\nCreate 2 Creation★' },
    'card-125': { creates: creations, text: '[Initiation]\nCreate 3 Creation★' },
    'card-126': { creates: creations, text: '[Initiation / Lead]\nCreate 2 Creation★\nAt the start of the turn, create 1 Creation★' },
    'card-127': { creates: creations, text: '[Initiation]\nCreate 1 Softie★ and Creation★ each\nWhen the next Softie is activated, create Softie★' },
    'card-128': {
      creates: creations,
      text: '[Initiation]\nCreate 1 Swiftie★ and Creation★ each\nIncrease Damage Amount of the next Swiftie activated by 40%',
      effects: [cardBuff('next-swiftie', 'Damage Amount of the next Swiftie', '40%', swifties, { counter: 'Sacred Censer IV', maxStacks: 1 })],
    },
    'card-129': { creates: creations, text: '[Initiation]\nCreate 1 Sturdie★ and Creation★ each\nWhen the next Sturdie is activated, 150% Shield' },

    // Growth Acceleration, I–V
    'card-130': { text: 'Heal {100%}\nSelect 1 card of this unit in hand, then activate the Retain effect 2 time(s)' },
    'card-131': { text: 'Heal {100%}\nSelect 1 card in hand, then activate the Retain effect 2 time(s)' },
    'card-132': { text: '[Exhaust]\nHeal {200%}\nSelect 1 Creation of this unit in hand and duplicate it into hand' },
    'card-133': {
      text: 'Heal {150%}\nSelect 1 card of this unit in hand, then activate the Retain effect 2 time(s)\n'
        + 'When that card is a Softie, 2 Vulnerable to all enemies',
    },
    'card-134': {
      text: 'Heal {150%}\nSelect 1 card of this unit in hand, then activate the Retain effect 2 time(s)\n'
        + 'When that card is a Swiftie, activate the Retain effect 3 times',
    },
    'card-135': {
      text: 'Heal {150%}\nSelect 1 card of this unit in hand, then activate the Retain effect 2 time(s)\n'
        + 'When that card is a Sturdie decrease Stress of allies by 5',
    },

    // Annoying, I–V. Fixed % isn't raised by the upgrade (40% in-game); the base card's Heal 20% isn't either.
    'card-136': {
      perCount: 'Cards in hand', text: 'For each card in hand, {F40%} Fixed Damage and Heal 20%', notes: 'Set the Cards in hand on each play',
    },
    'card-137': {
      perCount: 'Cards in hand', text: '{F40%} Fixed Damage for each card in hand\nWhen there are 6 or more cards, Heal {200%}',
      notes: 'Set the Cards in hand on each play',
    },
    'card-138': {
      text: '{100%} Defense-Based Damage\nFor each Creation in hand, +100% Damage Amount and Heal {60%}', notes: 'Set the Creations in hand on each play',
      effects: [cardBuff('creations', 'For each Creation in hand, Damage Amount', '+100%', 'Annoying II', { counter: 'Creations in hand' })],
    },
    'card-139': { text: '[Retain]\n{450%} Defense-Based Damage\nHeal {200%}\nRetain: Decrease Cost by 1' },
    'card-140': { creates: creations, text: '{60%} Defense-Based Damage × 3 to random enemies\nCreate 1 Creation★ for each target Hit' },
    'card-141': {
      text: '[Retain]\n{120%} Defense-Based Damage\nWhile this card is in hand, for each Creation created, +120% Damage Amount to this card until activated',
      notes: 'Set the Creations created on each play',
      effects: [cardBuff('created', 'For each Creation created, Damage Amount', '+120%', 'Annoying V', { counter: 'Creations created (Annoying V)' })],
    },

    // Growing Creature, I–V
    'card-142': { creates: creations, text: '[Retain]\nCreate 1 Creation★\nRetain: Change this card to Creation★★★' },
    'card-143': { creates: creations, text: '[Retain]\nCreate 1 Creation★\nRetain: Create 1 Creation★' },
    'card-144': { creates: creations, text: '[Retain]\nCreate 1 Creation★\nRetain: Change this card to Creation★★ and create 1 of each Creation★' },
    'card-145': { creates: creations, text: '[Retain]\nCreate 1 Creation★\nRetain: Change this card to Softie★★★, then 2 Vulnerable to all enemies' },
    'card-146': { creates: creations, text: '[Retain]\nCreate 1 Creation★\nRetain: Change this card to Swiftie★★★ and activate Retain effect 2 time(s)' },
    'card-147': { creates: creations, text: '[Retain]\nCreate 1 Creation★\nRetain: Change this card to Sturdie★★★, then 3 Weaken to all enemies' },

    // E1 Sleeping Memory adds Retain
    'card-148': { text: '{E1:[Retain]|}\nHeal {200%}\nActivate the Retain effect of all cards in hand' },

    // Creations: Softie, Swiftie, Sturdie (★ / ★★ / ★★★). Buff %s aren't raised by the upgrade (in-game 10% / 40%)
    'card-149': softie('★', 10),
    'card-150': swiftie('★', '100%', 40),
    'card-151': sturdie('100%', '60%'),
    'card-152': softie('★★', 20),
    'card-153': swiftie('★★', '200%', 80),
    'card-154': sturdie('200%', '120%'),
    'card-155': softie('★★★', 35),
    'card-156': swiftie('★★★', '350%', 150),
    'card-157': sturdie('350%', '200%'),
  },
} satisfies CharacterAdditions
