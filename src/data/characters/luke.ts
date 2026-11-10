// Luke: our additions to the Prydwen import (src/data/prydwen/luke.json). Card keys are the import's ids.
// Damage % follows the "+" rule: 'by 20%' (no "+") = multiplicative, '+20%' = additive (owner, 2026-10-25).
// The owner doesn't have Luke yet: the screenshots (2026-11-09) are the Combatant Archive preview (Lv 1, no Potential, no Ego level).
// "Weakness Attack: ..." lines (Silver Shot, Dance of the Demon III) count on plays that hit a Weakness: the fight's enemy element, or the
// play's own switch (owner, 2026-11-09). Tracer Shot's Mark is the Mark keyword, Luke's own 100% Extra Attack (owner, 2026-11-09: Mark
// is the same for every character). Stealth Reload I's +30% Critical Chance and E2's -50% are switches on each Handgun Bullet play (owner, 2026-11-09).
import type { CharacterAdditions } from '../../engine/types'
import { cardBuff, EGO_POTENTIALS_PLUS_3, markKeyword } from '../helpers'

const MAGNUM = 'card-58', SILVER = 'card-59', URANIUM = 'card-60', TRACER = 'card-61'
const HANDGUN_BULLETS = [MAGNUM, SILVER, URANIUM, TRACER]
/** "Handgun Bullet" (in game): "Magnum Shot, Silver Shot, Uranium Shot, Tracer Shot. These are standardized bullets." */
const HANDGUN = 'Magnum Shot/Silver Shot/Uranium Shot/Tracer Shot'
const BULLETS_THIS_TURN = 'Bullet cards activated this turn', ATTACKS_THIS_TURN = 'Attack Cards activated this turn'

/** The Mark keyword (helpers.ts): Luke's own Extra Attack. */
const mark = markKeyword('Order', 'Mark (Luke)')

const crit = (value: string, card: string) => [cardBuff('crit', 'Critical Chance', value, card, { type: 'Crit Chance' })]
const ephemeral = (line: string) => `[Ephemeral / Exhaust / Bullet]\n${line}`

/** Chain Fire, I–V (Prydwen: "Rapid Fire (Luke)"). */
const chainFire = (n: string, text: string, critValue: string, creates = true) => ({
  name: `Chain Fire${n ? ` ${n}` : ''}`, text, effects: crit(critValue, `Chain Fire${n ? ` ${n}` : ''}`),
  ...(creates ? { creates: HANDGUN_BULLETS } : {}),
})
const onCrit = 'For each Critical Hit create a Handgun Bullet'

/** Seize the Opportunity's "+X% Damage Amount to the next ... activated": a switch on that play. */
const seize = (n: string, value: string, appliesTo: string, line: string) => ({
  effects: [cardBuff('next-bullet', line, value, appliesTo, { counter: `Seize the Opportunity${n ? ` ${n}` : ''}`, maxStacks: 1 })],
})

/** Dance of the Demon: "Add 1 Hit for each Bullet card activated this turn". */
const perBullet = (counter = BULLETS_THIS_TURN) => ({ counterHits: { counter, hits: 1, per: 1 } })

export default {
  verified: { date: '2026-11-09', gameVersion: '841' },
  // Dance of the Demon's counts (counterHits) start at 0 on a new play
  playStacks: { [BULLETS_THIS_TURN]: 0, [ATTACKS_THIS_TURN]: 0 },
  notes: 'Card upgrades are set on the Setup tab. Add a play for each Handgun Bullet created. Per play (Cards tab): Bullet cards (or Attack '
    + 'Cards for II) activated this turn on Dance of the Demon, Seize the Opportunity on the next Bullet card (or Attack Card for IV; III for '
    + 'that turn), Cards in hand on Lethal Design, Target has Shield on Uranium Shot, Mark (Luke) on the target, From Stealth Reload I and '
    + 'Created by E2 on Handgun Bullets, Target Analysis stacks (E4). Hits a Weakness follows the fight\'s enemy (Silver Shot, Dance of the '
    + 'Demon III). Chain Fire\'s crits don\'t add Handgun Bullet plays by themselves. Not counted: Lead, Shields, draws, cost changes',
  // Potential nodes in the game's wording (owner's screenshots, 2026-11-09)
  potentials: {
    '3-1': { text: 'Adds Bullet to Single Shot.' },
    '5-1': { text: "+5% Damage Amount to Luke's Single Shot\nIf Luke's Critical Chance is 20% or higher, add an additional +5% to the modifier" },
    '7': { text: "If Luke's Critical Chance is 40% or higher, +3% Damage Amount to Handgun Bullet\nFor every 5% Critical Chance exceeding 40%, add an additional +2% to the modifier\n(additional +12% max)" },
  },
  // Manifest Ego in the game's wording (owner's screenshots, 2026-11-09)
  ego: {
    1: { text: '+50% Damage Amount to Finisher Round, and the activation condition of 5 Handgun Bullet cards changes to 4.' },
    2: { text: 'If Luke activates 3 Bullet cards, create 2 Handgun Bullet cards in hand.\nDecreases Damage Amount of cards created through this effect by 50%.\nThis effect activates once per turn.' },
    3: { text: '+100% Damage Amount to Lethal Design, and the Damage Amount for each card in hand is changed from +25% to +35%' },
    4: { text: "Whenever Luke activates a Bullet Card, gain Target Analysis.\nTarget Analysis: For 1 turn, +10% Damage Amount to Luke's Bullet cards (max 4 stacks)" },
    5: { text: EGO_POTENTIALS_PLUS_3 },
    6: { text: 'The Damage Amount increase effect of Target Analysis changes to +15%, and each time 12 Bullet cards are activated, create 1 High-Velocity Armor Piercing (HVAP) Round in hand' },
  },
  effects: [
    // 5-1 (in game): "+5% Damage Amount to Luke's Single Shot. If Luke's Critical Chance is 20% or higher, add an additional +5%": raises
    // the card %, like Renoa's 5-1
    { kind: 'Buff', id: 'p5-1-shot', node: '5-1', name: 'Basic Card Proficiency', category: 'Potential', type: 'Card +', value: '+5%',
      appliesTo: 'Single Shot', hitScope: 'All hits', condition: 'Always', thresholdStat: 'Critical Chance',
      thresholdBonus: { above: 0.2, value: '+5%', orEqual: true } },
    // 7 (in game): "If Luke's Critical Chance is 40% or higher, +3% Damage Amount to Handgun Bullet. For every 5% Critical Chance exceeding
    // 40%, add an additional +2% (additional +12% max)": raises the card %, like Renoa's 7 (Unconfirmed: in-game test luke-readings)
    { kind: 'Buff', id: 'p7-handgun', node: '7', name: 'Unique Stat Upgrade', category: 'Potential', type: 'Card +', value: '+3%',
      appliesTo: HANDGUN, hitScope: 'All hits', condition: 'Always', thresholdStat: 'Critical Chance', thresholdMin: 0.4,
      thresholdBonus: { above: 0.4, value: '+2%', every: 0.05, max: '+12%' } },
    // E1 Sleeping Memory (in game): "+50% Damage Amount to Finisher Round"
    { kind: 'Buff', id: 'e1-finisher', name: 'Damage Amount to Finisher Round', category: 'Ego Manifestation', value: '+50%',
      appliesTo: 'Finisher Round', hitScope: 'All hits', condition: 'Always', egoLevel: 1 },
    // E2 Awakening Memory (in game): "Decreases Damage Amount of cards created through this effect by 50%": on those plays
    { kind: 'Buff', id: 'e2-created', name: 'Created by E2', category: 'Ego Manifestation', value: '-50%', appliesTo: HANDGUN,
      hitScope: 'All hits', condition: 'Always', counter: 'Created by E2', maxStacks: 1, egoLevel: 2 },
    // E3 Vivid Memory (in game): "+100% Damage Amount to Lethal Design, and ... for each card in hand ... from +25% to +35%": part of the
    // Ego skill's %, as other Ego skill bonuses (docs/FORMULA.md, Ego skill bonuses)
    { kind: 'Buff', id: 'e3-lethal', name: 'Damage Amount to Lethal Design', category: 'Ego Manifestation', type: 'Base %', value: '+100%',
      appliesTo: 'Lethal Design', hitScope: 'All hits', condition: 'Always', egoLevel: 3 },
    // E4 Inner Memory (in game): "Target Analysis: For 1 turn, +10% Damage Amount to Luke's Bullet cards (max 4 stacks)"; E6 makes it +15%
    { kind: 'Buff', id: 'e4-target-analysis', name: 'Target Analysis', category: 'Ego Manifestation', value: '+10%', appliesTo: 'Bullet',
      hitScope: 'All hits', condition: 'Always', counter: 'Target Analysis', maxStacks: 4, egoLevel: 4, egoBelow: 6 },
    { kind: 'Buff', id: 'e6-target-analysis', name: 'Target Analysis (E6)', category: 'Ego Manifestation', value: '+15%', appliesTo: 'Bullet',
      hitScope: 'All hits', condition: 'Always', counter: 'Target Analysis', maxStacks: 4, egoLevel: 6 },
  ],
  // Card text: the in-game wording (owner's screenshots, 2026-11-09), with tokens for the build's numbers (engine/cardText.ts)
  cards: {
    // Ego skill: Prydwen reads 0% (450% in game) and E3 as +50% / +15% -> +25% (in game +100% / +25% -> +35%)
    'card-30': {
      pct: 4.5, hits: 1,
      text: '{E3:550%|{450%}} Damage\n+{E3:35|25}% base Damage Amount for each card in hand',
      effects: [
        cardBuff('per-card', 'base Damage Amount for each card in hand', '+25%', 'Lethal Design',
          { type: 'Base %', counter: 'Cards in hand', category: 'Ego Skill', egoBelow: 3 }),
        cardBuff('per-card-e3', 'base Damage Amount for each card in hand (E3)', '+35%', 'Lethal Design',
          { type: 'Base %', counter: 'Cards in hand', category: 'Ego Manifestation', egoLevel: 3 }),
      ],
    },
    // 3-1 Basic Card Proficiency (in game): "Adds Bullet to Single Shot."
    'card-31': { nodeTags: { '3-1': 'Bullet' }, text: '{P3-1:[Bullet]\n}{100%} Damage' },
    'card-32': { text: '{100%} Shield', notes: 'Shield only, no damage' },

    // Chain Fire, I–V (Prydwen: "Rapid Fire (Luke)")
    'card-33': chainFire('', `{50%} Damage × 2\n${onCrit}\n+50% Critical Chance`, '+50%'),
    'card-34': chainFire('I', `[Retrieve]\n{75%} Damage × 2\n${onCrit}\n+50% Critical Chance`, '+50%'),
    'card-35': chainFire('II', `{30%} Damage × 3\n${onCrit}\n+50% Critical Chance`, '+50%'),
    'card-36': chainFire('III', '{300%} Damage\nCreate Handgun Bullet for each Critical Hit\nGuaranteed Critical', '+100%'),
    'card-37': chainFire('IV', '[Bullet]\n{100%} Damage × 3\n+50% Critical Chance', '+50%', false),
    'card-38': chainFire('V', '{100%} Damage × 2\nFor each Critical Hit, Draw\n+70% Critical Chance', '+70%', false),

    // Stealth Reload, I–V
    'card-39': { creates: HANDGUN_BULLETS, text: 'Create 3 Handgun Bullets' },
    'card-40': {
      creates: HANDGUN_BULLETS, text: 'Create 3 Handgun Bullets\n+30% Critical Chance to those cards',
      effects: [cardBuff('crit', 'Critical Chance to those cards', '+30%', HANDGUN,
        { type: 'Crit Chance', counter: 'From Stealth Reload I', maxStacks: 1 })],
    },
    'card-41': { creates: HANDGUN_BULLETS, text: 'Create 3 Handgun Bullets' },
    'card-42': { creates: HANDGUN_BULLETS, text: 'Create 3 Handgun Bullet\nAt the start of the next turn, create 2 Handgun Bullet' },
    'card-43': { creates: HANDGUN_BULLETS, text: 'At the start of the turn, create 1 Handgun Bullet' },
    'card-44': { creates: HANDGUN_BULLETS, text: '[Exhaust]\nCreate 5 Handgun Bullet' },

    // Seize the Opportunity, I–V (Lead: "At the start of the turn, has a 50% chance to decrease Cost of the card with this effect by 1.
    // When a different card is used, the effect is removed")
    'card-45': { text: '[Lead]\n{100%} Shield\n+120% Damage Amount to the next Bullet card activated',
      ...seize('', '+120%', 'Bullet', 'Damage Amount to the next Bullet card activated') },
    'card-46': { text: '[Lead]\n{150%} Shield\n+170% Damage Amount to the next Bullet card activated',
      ...seize('I', '+170%', 'Bullet', 'Damage Amount to the next Bullet card activated') },
    'card-47': { text: '[Lead]\n{100%} Shield\n+120% Damage Amount to the next 2 Bullet cards activated',
      ...seize('II', '+120%', 'Bullet', 'Damage Amount to the next 2 Bullet cards activated') },
    'card-48': { text: '[Lead]\n{100%} Shield\n+70% Damage Amount to Bullet cards for 1 turn',
      ...seize('III', '+70%', 'Bullet', 'Damage Amount to Bullet cards for 1 turn') },
    'card-49': { text: '[Lead]\n{100%} Shield\n+100% Damage Amount to the next Attack Card activated',
      ...seize('IV', '+100%', 'Attack', 'Damage Amount to the next Attack Card activated') },
    // An Upgrade: on while it's in the deck
    'card-50': { text: '[Lead]\n+30% Damage Amount to Handgun Bullet cards',
      effects: [cardBuff('handgun', 'Damage Amount to Handgun Bullet cards', '+30%', HANDGUN)] },

    // Dance of the Demon, I–V: one hit more per Bullet card (Attack Card for II) activated this turn, set per play
    'card-51': { text: '{50%} Damage\nAdd 1 Hit for each Bullet card activated this turn', ...perBullet() },
    'card-52': { text: '{75%} Damage\nAdd 1 Hit for each Bullet card activated this turn', ...perBullet() },
    'card-53': { text: '{50%} Damage\nAdd 1 Hit for each Attack Card activated this turn', ...perBullet(ATTACKS_THIS_TURN) },
    'card-54': {
      text: '{50%} Damage\nAdd 1 Hit for each Bullet card activated this turn\nWeakness Attack: +50% Damage Amount', ...perBullet(),
      effects: [cardBuff('weakness', 'Weakness Attack', '+50%', 'Dance of the Demon III', { weakness: true })],
    },
    'card-55': { text: '{50%} Damage\n{50%} Shield\nAdd 1 Hit and +50% base Shield Gain Amount for each Bullet card activated this turn', ...perBullet() },
    // Prydwen: × 5 (× 6 in game)
    'card-56': { hits: 6, text: '{50%} Damage × 6\nWhen a Bullet card is activated, decrease Cost by 1 for 1 turn until activated' },

    // Finisher Round (Mythic, no epiphanies): Prydwen 300% (500% in game); E1 "the activation condition of 5 Handgun Bullet cards changes to 4"
    'card-57': { pct: 5, text: '[Unique / Bullet]\n{500%} Damage\nWhen {E1:4|5} Handgun Bullet cards are activated, remove Unactivatable' },

    // Handgun Bullets (Chain Fire's Related Cards)
    [MAGNUM]: { text: ephemeral('{85%} Damage') },
    [SILVER]: {
      text: ephemeral('{60%} Damage\nWeakness Attack: Increase Damage Amount by 100%'),
      effects: [cardBuff('weakness', 'Weakness Attack: Damage Amount', '100%', 'Silver Shot', { weakness: true })],
    },
    [URANIUM]: {
      text: ephemeral('{60%} Damage\nIf the target has Shield, increase Damage Amount by 100%'),
      effects: [cardBuff('shield', 'If the target has Shield', '100%', 'Uranium Shot', { counter: 'Target has Shield', maxStacks: 1 })],
    },
    // Prydwen: "Tracer"
    [TRACER]: { name: 'Tracer Shot', text: ephemeral('{30%} Damage\n1 Mark'), triggers: [mark.trigger] },
    // E6's card (not in the screenshots: Prydwen's wording), on from E6
    'card-62': {
      name: 'High-Velocity Armor Piercing (HVAP) Round', egoLevel: 6,
      text: '[Ephemeral / Exhaust / Bullet / Weakness Attack]\n{200%} Damage\nGuaranteed Critical',
      effects: crit('+100%', 'High-Velocity Armor Piercing (HVAP) Round'),
    },
  },
  extraCards: [mark.card],
} satisfies CharacterAdditions
