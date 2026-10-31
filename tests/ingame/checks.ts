// What the game itself says: open questions as in-game tests to run, and the results measured so far.
// ingame.test.ts turns measured results into tests, and writes this list to docs/in-game-tests.md (never edit that file by hand).
//
// New open question: add a 'todo' entry here, in the words of someone holding the game. When the owner reports the numbers, fill in
// `measured` with the values and what the calculator gives for them. If the calculator disagrees: fix the rule or its Setting, then
// update docs/FORMULA.md or docs/characters/<slug>.md (the "Unconfirmed" there goes).
import { computeBuild } from '../../src/engine/calc'
import { PRESETS } from '../../src/data/presets'
import { migrate } from '../../src/store/migrate'
import { newBoost, newCharacterSave } from '../../src/store/save'
import fixture from '../fixtures/save-v1.json'
import { addCards, card, cardFromPreset, plays, setPlays, settings } from '../helpers'

export interface MeasuredValue {
  label: string
  /** The number the game showed. */
  inGame: number
  /** The same number from the calculator. */
  calculator: () => number
  /** How far apart they may be. */
  tolerance: number
}

export interface InGameCheck {
  id: string
  /** The open question, or what the measurement settles. */
  question: string
  /** Where the assumption lives, so it can be closed after testing. */
  closes?: string
  setup: string
  steps: string[]
  /** What to write down and send. */
  record: string[]
  measured?: { date: string; gameVersion?: string; source: string; values: MeasuredValue[]; answer: string }
}

/** The owner's Mei Lin (an old save) with Flame Dragon's Jewel, 1 Morale, Strike at Basic Card Upgrade 10. */
function meiStrikeHit() {
  const save = migrate(structuredClone(fixture))
  const cs = save.characters['Mei Lin']
  const b = cs.builds[0]
  b.morale = 1
  b.basicLevel = 10
  const mei = PRESETS.characters.find((c) => c.name === 'Mei Lin')!
  Object.assign(b.deck[0].custom!, { pct: 1, upgrade: 'Basic' })
  addCards(cs, cardFromPreset(mei.cards!.find((p) => p.id === 'card-340')!, 'Passion'))
  return computeBuild(PRESETS, 'Mei Lin', cs, b, settings).plays[0].hits[0]
}

function meiBuild(attack: number) {
  const cs = newCharacterSave()
  const c = card('Test', '', 1)
  addCards(cs, c)
  setPlays(cs, plays(c.id))
  const b = cs.builds[0]
  b.stats.attack = attack
  return { cs, b, c }
}

export const CHECKS: InGameCheck[] = [
  // ------------------------------------------------------------------ measured
  {
    id: 'final-attack',
    question: 'Does partner/equipment ATK% multiply the stats-screen Attack, with flat equipment added after?',
    setup: 'Mei Lin with Marianne, 1033 Attack on the stats screen, equipment +74 Attack.',
    steps: ['Compare the Attack in battle with 1033 x 1.16 + 74.'],
    record: ['Attack in battle'],
    measured: {
      date: '2026-10-20', source: 'Owner', answer: 'Yes: Final ATK = screen x (1 + %) + flat.',
      values: [{
        label: 'Attack in battle', inGame: 1272, tolerance: 0.5,
        calculator: () => {
          const { cs, b } = meiBuild(1033)
          b.partner = 'Marianne'
          cs.boosts.push({ ...newBoost(b.id), stat: 'Flat ATK', value: '74' })
          return computeBuild(PRESETS, 'Mei Lin', cs, b, settings).stats.atk.value
        },
      }],
    },
  },
  {
    id: 'crit-total-multiplier',
    question: 'Is the stats-screen Crit DMG the total multiplier (not 1 + Crit DMG)?',
    setup: 'A Mei Lin with 188.6% Crit DMG (a Reddit post, with the community sheet agreeing).',
    steps: ['Compare a crit hit with its non-crit hit.'],
    record: ['Non-crit hit', 'Crit hit'],
    measured: {
      date: '2026-10-20', source: 'Reddit post', answer: 'Yes: crit = non-crit x Crit DMG.',
      values: [{
        label: 'Crit hit for a 572 non-crit hit', inGame: 1078, tolerance: 1.5,
        calculator: () => {
          const { cs, b } = meiBuild(572 / 0.35)
          b.stats.critDmg = 1.886
          return computeBuild(PRESETS, 'Mei Lin', cs, b, settings).plays[0].crit
        },
      }],
    },
  },
  {
    id: 'weakness-no-extra-factor',
    question: 'Is there another x1.25 on top of the Weakness Damage stat?',
    setup: 'Mei Lin targeting a Passion-weak enemy, 137% Weakness DMG on screen + 5% Marianne.',
    steps: ["Compare Strike's % in hand with its % on the target."],
    record: ['Card % in hand', 'Card % on target'],
    measured: {
      date: '2026-10-20', source: 'Owner', answer: 'No: 204.24% x 1.42 = 290%.',
      values: [{
        label: 'Strike on target, %', inGame: 290, tolerance: 0.5,
        calculator: () => {
          const { cs, b, c } = meiBuild(1000)
          const own = b.deck.find((d) => d.id === c.id)!.custom!
          Object.assign(own, { pct: 2.0424, weaknessApplies: true })
          b.stats.weaknessDmg = 1.42
          b.presetSwitches['Mei Lin|p5-1-strike'] = false
          return computeBuild(PRESETS, 'Mei Lin', cs, b, settings).plays[0].hits[0].cardMult * 100
        },
      }],
    },
  },
  {
    id: 'strike-in-hand-and-on-target',
    question: "Do the calculator's card %s match Mei Lin's Strike with every buff up?",
    setup: 'Mei Lin: Basic Card Upgrade 10, node 5-1, Jewel, 1 Morale, Scarab, Obsidian Sword, Emblem.',
    steps: ['Read Strike in hand, then on the target.'],
    record: ['Card % in hand', 'Card % on target'],
    measured: {
      date: '2026-10-25', source: 'Owner', answer: 'In hand yes; on target about 0.3% low: see strike-rounding-gap.',
      values: [
        { label: 'In hand, %', inGame: 251, tolerance: 0.5, calculator: () => meiStrikeHit().inHand * 100 },
        { label: 'On target, %', inGame: 357, tolerance: 1.2, calculator: () => meiStrikeHit().cardMult * 100 },
      ],
    },
  },

  // ------------------------------------------------------------------ the formula
  {
    id: 'plus-rule',
    question: 'Is "+X%" additive and "X%" without a "+" multiplicative?',
    closes: 'docs/FORMULA.md, Buff types',
    setup: 'A card at a known %, one "+X%" buff and one "by X%" buff you can turn on separately (for example Morale for "+", a card that says "by X%").',
    steps: ['Read the card % with neither buff.', 'Read it with only the "+" buff.', 'Read it with only the "by X%" buff.', 'Read it with both.'],
    record: ['The four card %s', 'The buffs\' wording'],
  },
  {
    id: 'multiplicative-summed-or-chained',
    question: 'Do two multiplicative buffs add up (1 + a + b) or multiply ((1 + a) x (1 + b))?',
    closes: 'Settings: Multiplicative buffs combine',
    setup: 'A card at a known %, two different "by X%" buffs, as large as you can find (the gap is small with small buffs).',
    steps: [
      'Read the card % with neither.',
      'Read it with each one alone.',
      'Read it with both.',
      'Compare: a 100% card with buffs of 50% and 30% is 180% if they add up, 195% if they multiply.',
      "If the shown % doesn't change with these buffs, compare the damage of a non-critical hit on the same enemy instead.",
    ],
    record: ['The four card %s (or damage numbers)', "The buffs' wording"],
  },
  {
    id: 'multiplicative-stacks-chained',
    question: 'If multiplicative buffs turn out to chain: does a buff with stacks chain per stack, or count once?',
    closes: 'src/engine/calc.ts: Chained mode treats 3 stacks of 10% as one 30% source',
    setup: 'Only needed if the previous test says they chain. A "by X%" buff with stacks.',
    steps: ['Read the card % at 0, 1, 2 and 3 stacks.'],
    record: ['The four card %s'],
  },
  {
    id: 'strike-rounding-gap',
    question: "Mei Lin's Strike is 357% on target in game and 355.9% here. Is that rounding, or a hidden decimal?",
    closes: 'The check above (strike-in-hand-and-on-target)',
    setup: 'The Strike setup above, or any card with Weakness DMG showing decimals on the stats screen.',
    steps: ['Read Weakness Damage on Detailed Stats, with all its decimals.', 'Read the card in hand and on a target weak to its element.'],
    record: ['Weakness Damage', 'Card % in hand', 'Card % on target'],
  },
  {
    id: 'order-weakness-morale',
    question: 'Are Morale and "+X% Damage Amount" inside the Weakness DMG factor?',
    closes: 'docs/FORMULA.md, The formula',
    setup: 'A card, 2 or more Morale, a target weak to the card\'s element.',
    steps: ['Read the % on a non-weak and on a weak target with no Morale.', 'Repeat with Morale.'],
    record: ['The four card %s', 'Weakness Damage on Detailed Stats'],
  },
  {
    id: 'base-pct-and-mult',
    question: 'Do multiplicative buffs raise a "+X% base Damage Amount"?',
    closes: 'docs/FORMULA.md, Buff types (Base %)',
    setup: 'A card with a "+X% base Damage Amount" effect and a "by X%" buff.',
    steps: ['Read the card % with neither.', 'Read it with each alone.', 'Read it with both.'],
    record: ['The four card %s'],
  },
  {
    id: 'crit-cap',
    question: 'Is Crit Chance capped at 100%?',
    closes: 'Settings: Crit cap',
    setup: 'Hard to reach: only if a build shows over 100% Crit Chance.',
    steps: ['Read Critical Chance on Detailed Stats.'],
    record: ['Critical Chance as shown'],
  },
  {
    id: 'crit-threshold-battle',
    question: 'Do "If Critical Chance is X% or higher" nodes read the stats screen, or battle Crit Chance too?',
    closes: 'docs/characters/renoa.md (Potential 7)',
    setup: "Renoa with node 7, Critical Chance just under 60% on the stats screen, and a battle buff that lifts it over.",
    steps: ['Read a card affected by the node before and after the buff.'],
    record: ['Critical Chance on the screen', 'The buff', 'Card % before and after'],
  },
  {
    id: 'threshold-every-rounding',
    question: 'How does the game round "for every X above Y" thresholds, on stats with decimals (Attack, and % stats such as Critical Chance)?',
    closes: 'src/engine/buffs.ts: presetBuffValue (a float such as 0.69 can come out one step short); backlog item 15',
    setup: 'Rossweisse node 7 ("for every 20 Attack exceeding 600") or Mei Lin node 7, with Attack just below and just on a step.',
    steps: ['Read the card % or Weakness Damage with Attack one point under a step, on the step, and one over.'],
    record: ['Attack (with decimals if shown)', 'The node\'s value at each point'],
  },
  {
    id: 'card-other-element',
    question: "Does a card of another element than its character use that element's Elemental DMG on the stats screen, and do battle boosts to Elemental DMG% reach it? The calculator says yes to the first, no to the second.",
    closes: 'docs/FORMULA.md, Final stats; src/engine/calc.ts: cardElement',
    setup: "Only if the game lets a character hold a card of another element (neutral or seasonal cards, say), and a battle boost to Elemental DMG%. The same enemy, not weak to either element.",
    steps: ['Hit with that card and with one of the character\'s own element, non-crit, without the boost.', 'Repeat with the boost.'],
    record: ['The four damage numbers', 'Both cards\' %', 'Elemental DMG of both elements on Detailed Stats', 'The boost'],
  },

  // ------------------------------------------------------------------ fixed damage
  {
    id: 'fixed-formula',
    question: 'Is Fixed damage = Fixed % x Final ATK x 0.35?',
    closes: 'Settings: Fixed damage: ATK coefficient',
    setup: 'A card with Fixed damage, against an enemy with no shield. Note Attack in battle.',
    steps: ['Play it, at two different Attack values if possible.'],
    record: ['Fixed %', 'Attack in battle', 'Damage number each time'],
  },
  {
    id: 'fixed-crit',
    question: 'Can Fixed damage crit?',
    closes: 'src/engine/calc.ts: Fixed',
    setup: 'A Fixed damage card, high Crit Chance.',
    steps: ['Play it several times; watch for a larger or differently coloured number.'],
    record: ['Whether any crit showed', 'The numbers'],
  },
  {
    id: 'fixed-potential',
    question: 'Do Card Upgrade potentials raise Fixed damage?',
    closes: 'Settings: Upgrades raise Fixed damage',
    setup: "Orlea's Annoying I: in hand, its Fixed 40% looked unraised while its Heal was raised. Damage is what matters.",
    steps: ['Play it at a known Signature level and Attack.'],
    record: ['Signature level', 'Attack in battle', 'Damage number'],
  },

  // ------------------------------------------------------------------ debuffs
  {
    id: 'vulnerable-per-hit',
    question: 'Is one stack of Vulnerable used per hit, or per card? The calculator switches it per play, on all its hits.',
    closes: 'docs/FORMULA.md, Target debuffs',
    setup: 'A multi-hit card, a target with 1 stack of Vulnerable.',
    steps: ['Play the card; compare the numbers of its first and later hits, and the stacks left.'],
    record: ['The numbers of each hit', 'Stacks before and after'],
  },
  {
    id: 'weakness-debuff-per-hit',
    question: 'Same for the Weakness debuff on you: per hit, or per card?',
    closes: 'docs/FORMULA.md, Target debuffs',
    setup: 'A multi-hit card while you have 1 stack of the Weakness debuff.',
    steps: ['Play the card; compare its hits and the stacks left.'],
    record: ['The numbers of each hit', 'Stacks before and after'],
  },
  {
    id: 'ravaged-extra-damage',
    question: 'How much more damage does a Ravaged enemy take by itself?',
    closes: 'Settings: Ravaged: extra damage taken',
    setup: 'A character with no "vs Ravaged" effects (no Marianne, no Ember), one card, the same enemy.',
    steps: ['Hit it before it is Ravaged.', 'Hit it again while Ravaged.'],
    record: ['Both non-crit numbers', 'Card % on target both times'],
  },
  {
    id: 'ravaged-triggered-hits',
    question: 'When a play hits a Ravaged enemy, do the hits it sets off (Mark, Coordinated Attacks) count as on a Ravaged target too, with "vs Ravaged" buffs? The calculator says yes.',
    closes: 'docs/FORMULA.md, Weakness, Vulnerable, Ravaged; src/engine/calc.ts: computeBuild',
    setup: 'A triggered hit such as Selena\'s Mark, a "vs Ravaged" buff such as Marianne\'s on the character who owns the hit, the same enemy.',
    steps: ['Read the triggered hit\'s number before the enemy is Ravaged.', 'Read it again while the enemy is Ravaged.'],
    record: ['Both non-crit numbers', 'The buff', 'Attack in battle'],
  },
  {
    id: 'marianne-ravaged',
    question: "Is Marianne's \"15% increased damage to Ravaged enemies\" multiplicative (no \"+\") or additive?",
    closes: 'src/data/partners/marianne.ts',
    setup: 'A Striker with Marianne, and a card at a % far from 100%, on a Ravaged target. Then the same without her effect if possible (another partner).',
    steps: ['Read the card % on the Ravaged target with and without Marianne.'],
    record: ['Both card %s', 'Base card % in hand'],
  },
  {
    id: 'weakness-non-active',
    question: 'Do Weakness DMG and Weakness Attack reach non-active hits (Extra Attacks, triggered hits)? Prydwen says non-active damage gets no elemental bonus; the owner ruled Selena\'s Passion Weakness makes Coordinated Attacks Weakness Attacks.',
    closes: 'docs/FORMULA.md, Weakness; src/data/characters/selena.ts',
    setup: 'A triggered Extra Attack (Selena\'s Mark) with a known %, on an enemy weak and then not weak to the element.',
    steps: ['Read the Extra Attack number on each enemy, with the same stats.'],
    record: ['Both non-crit numbers', 'Weakness Damage', 'Attack in battle'],
  },

  // ------------------------------------------------------------------ the enemy
  {
    id: 'enemy-def-formula',
    question: 'Is the enemy DEF multiplier 100 / enemy DEF? One data point so far: Lv50 Kentris (255 DEF) = 0.392; Mei Lin\'s tests back-solve to 0.387 and 0.3733.',
    closes: 'Setup: Fight, DEF multiplier',
    setup: 'A known card, Attack and Weakness, and enemies whose DEF you can read on their info page.',
    steps: ['Hit each enemy, non-crit, with no debuffs.'],
    record: ['Enemy, level, DEF', 'Card % on target', 'Attack in battle', 'Elemental DMG', 'Damage number'],
  },

  // ------------------------------------------------------------------ one character's readings
  {
    id: 'mei-lin-first-attack-weakness',
    question: "Does Mei Lin's first Attack card already get Jewel's Passion Weakness?",
    closes: 'docs/characters/mei-lin.md',
    setup: "Flame Dragon's Jewel, a target not otherwise weak to Passion.",
    steps: ["Read the first Attack card's % on the target, then the second's."],
    record: ['Both card %s on target'],
  },
  {
    id: 'chizuru-readings',
    question: "Chizuru: is Oni Hunt IV's created Moonslash a normal Moonslash with Exhaust and Cost 0 (Basic upgrade, 3-1, 5-1)? Is the Ego skill 700% at E3, like Selena's E4?",
    closes: 'docs/characters/chizuru.md',
    setup: 'Chizuru with Oni Hunt IV; E3 once reached.',
    steps: ['Screenshot the created Moonslash and a normal one.', 'Screenshot the Ego skill at E3.'],
    record: ['The pictures'],
  },
  {
    id: 'haru-decrease-in-sum',
    question: "Is the decrease from Haru's E2 / E6 in the same multiplicative sum as \"by X%\" buffs?",
    closes: 'docs/characters/haru.md',
    setup: 'Haru with E2, with AP short of Cost, and a "by X%" buff.',
    steps: ['Read the card % with the decrease alone, with the buff alone, with both.'],
    record: ['The three card %s, and the one with neither'],
  },
  {
    id: 'mika-orlea-node-5-1',
    question: 'Are Mika\'s and Orlea\'s 5-1 Healing bonuses +X% of the base (like the other nodes)? Both are locked for the owner.',
    closes: 'docs/characters/mika.md, docs/characters/orlea.md',
    setup: 'Once 5-1 is unlocked.',
    steps: ['Screenshot the card before and after unlocking it.'],
    record: ['Both pictures, with the Card Upgrade level'],
  },
  {
    id: 'renoa-readings',
    question: "Renoa: is Dirge Bullet: Finale's base 200% / 160% (or 160% / 140%, with 3-1 included)? Do Ballad IV's and Last-Ditch / Instant Judgment's bonuses reach Finale? Is E6's 50% Extra Attack per draw unraised?",
    closes: 'docs/characters/renoa.md',
    setup: 'Renoa with 3-1 locked (the numbers only differ then), Finale with those bonuses, E6 if reached.',
    steps: ['Screenshot Finale with 3-1 off.', 'Read Finale with and without each bonus.', 'Note the E6 hit number at a known Attack and Signature level.'],
    record: ['The pictures and %s', 'E6 damage, Attack in battle, Signature level'],
  },
  {
    id: 'renoa-next-card-buffs',
    question: "Do \"next card\" and Attack Card buffs (Flower III's +40%) skip the Extra Attacks on that play (Mark, discarded Dirge Bullets)?",
    closes: 'docs/characters/renoa.md',
    setup: 'A Mark or a discard hit on a play with the buff, then without it.',
    steps: ['Read the Extra Attack number both ways.'],
    record: ['Both numbers'],
  },
  {
    id: 'rossweisse-e2',
    question: "Is Rossweisse's E2 Blade Afterimage an Extra Attack (does Extra Damage raise it), and does it get the Signature upgrade or Attack Card buffs?",
    closes: 'docs/characters/rossweisse.md',
    setup: 'Rossweisse E2 (the owner has it). Extra Damage and Signature level known; ideally two Extra Damage values, and with and without an Attack Card buff.',
    steps: ['Read the Afterimage number each way.'],
    record: ['Numbers', 'Extra Damage', 'Signature level', 'Attack in battle'],
  },
  {
    id: 'rei-cassius-card-plus',
    question: "Do Rei's node 7 on Predator's Blade (250%) and Cassius's node 5-1 on Wild Card (220%) add before the upgrade, like Chizuru's? Both are locked for the owner.",
    closes: 'docs/FORMULA.md, Buff types (Card +)',
    setup: 'Once the nodes are unlocked.',
    steps: ['Screenshot the card after unlocking the node.'],
    record: ['The picture', 'The Card Upgrade level'],
  },
  {
    id: 'yuki-readings',
    question: "Yuki: is Flash Slash IV's base 400% with node 7's +10%, or 410% with none? Does Swiftblade Flurry have a stack limit?",
    closes: 'docs/characters/yuki.md',
    setup: 'Flash Slash IV with node 7 off or on a lower Attack; Swiftblade Flurry stacked high.',
    steps: ['Read Flash Slash IV below and above the threshold.', 'Keep stacking Swiftblade Flurry until it stops rising.'],
    record: ['Both card %s', 'The highest stacks'],
  },
]
