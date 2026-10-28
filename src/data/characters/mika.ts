// Mika: our additions to the Prydwen import (src/data/prydwen/mika.json). Card keys are the import's ids.
// Mika is a healer: no damage buffs. Card text from the owner's screenshots (2026-10-28).
// Whirlpool V "114%(228%) Damage ... Increase Damage Amount equal to Heal Amount of this card" counts the bracket
// value, 228% (100% + its 100% Heal, raised by the upgrade); heal buffs aren't added (owner, 2026-10-28).
// Blessing of Waves IV "Inflict Damage equal to Heal Amount" isn't counted (owner, 2026-10-28).
import type { CharacterAdditions } from '../../engine/types'

export default {
  notes: 'Healer: Water Arrow and Whirlpool deal damage. Not counted: Blessing of Waves IV damage equal to its Heal Amount',
  // Card text: the in-game wording (owner's screenshots, 2026-10-28), with tokens for the build's numbers (engine/cardText.ts)
  cards: {
    // E4 Inner Memory adds Retain to the created Source of Water
    'card-543': { creates: ['card-571'], text: 'Create 2 Source of Water Card(s), grant Exhaust{E4: and Retain|} to it' },
    'card-544': { text: '{100%} Damage' },
    // 3-1 "+30% Healing of Water Barrier" = +30% base (172% in game = 130% x 1.32). 5-1 "+5% Heal" read as +5% base
    // (Unconfirmed; not unlocked by the owner)
    'card-545': { text: 'Heal {P5-1:{P3-1:{135%}|{105%}}|{P3-1:{130%}|{100%}}}' },

    // Source of Water, I–V
    'card-546': { text: 'Heal {100%}\nGain 1 AP' },
    'card-547': { text: 'Heal {150%}\nGain 1 AP\n1 Wave' },
    'card-548': { text: 'Heal {150%}\nGain 2 AP\nOn Recover, decrease Cost by 1 for 1 turn until activated' },
    'card-549': { text: '[Retain]\nHeal {150%}\nGain 1 AP\nIncrease Heal Amount of the next card activated by 50%' },
    'card-550': { text: 'Heal {150%}\nGain 1 AP\nDecrease Stress of allies by 2' },
    'card-551': { text: '[Exhaust]\nHeal {100%}\nGain 3 AP' },

    // Blessing of Waves, I–V
    'card-552': { text: '[Retain]\nHeal {100%}\nIncrease Heal Amount by 30% for each AP' },
    'card-553': { text: '[Retain]\nHeal {150%}\nIncrease Heal Amount by 30% for each AP\nGain Shield equal to Heal Amount overflow' },
    'card-554': { text: '[Retain]\nHeal {150%}\nIncrease Heal Amount by 30% for each AP\n1 Wave' },
    'card-555': { text: '[Retain]\nHeal {150%}\nIncrease Heal Amount of the next card activated by 20% for each AP' },
    'card-556': { text: '[Retain]\nHeal {150%}\nInflict Damage equal to Heal Amount to a random enemy', notes: 'Damage not counted' },
    'card-557': { text: '[Finale]\nHeal {50%}\nHeal Amount +50% for each AP used this turn' },

    // Tactical Analysis, I–V
    'card-558': { text: '1 Wave\n+50% Heal Amount for 1 turn' },
    'card-559': { text: 'Heal {50%}\n1 Wave\n+50% Heal Amount for 2 turns' },
    'card-560': { text: '2 Wave\n+50% Heal Amount for 1 turn' },
    'card-561': { text: '2 Wave\n+100% Heal Amount of this unit for 1 turn' },
    'card-562': { text: 'For 1 turn, when a card of this unit is activated, 1 Wave' },
    'card-563': { text: '2 Wave\n+50% Heal Amount' },

    // Whirlpool, I–V. "Heal X% for each target hit" isn't raised by the upgrade in game
    'card-564': { text: '{200%} Damage to all enemies\nHeal 50% for each target hit' },
    'card-565': { text: '{200%} Damage to all enemies\nHeal 100% for each target hit' },
    'card-566': { text: '{200%} Damage to all enemies\n1 Wave for each target hit' },
    'card-567': { text: '{200%} Damage to all enemies\nIncrease Heal Amount of the next card activated by 20% for each target hit' },
    'card-568': { text: '{300%} Damage to all enemies\nOn Recover, decrease Cost by 1 until activated' },
    'card-569': {
      pct: 2, replaceNotes: true, notes: 'Counts the bracket value: 100% + this card\'s 100% Heal (heal buffs not added)',
      text: 'Heal {100%}\n{100%}({200%}) Damage to all enemies\nIncrease Damage Amount equal to Heal Amount of this card',
    },

    // E1 Sleeping Memory adds Initiation
    'card-570': { text: '[Unique{E1: / Initiation|}]\n1 Wave\nAt the start of the turn, 1 Wave' },
    'card-571': { text: 'Heal {100%}\nGain 1 AP' },
  },
} satisfies CharacterAdditions
