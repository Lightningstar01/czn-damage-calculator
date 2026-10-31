// Rossweisse: our additions to the Prydwen import (src/data/prydwen/rossweisse.json). Card keys are the import's ids.
// Damage % follows the "+" rule: 'by 20%' (no "+") = multiplicative, '+20%' = additive (owner, 2026-10-25);
// "+X% base Damage Amount" = Base % (added to the shown card %), "final Damage Amount" = Final (own multiplier) (owner, 2026-10-27).
// Shard activations ("activate effect", Sword Resonance I/V, Radiant Sword Flow II) are extra plays of the shard (owner, 2026-10-27).
import type { CardPreset, CharacterAdditions } from '../../engine/types'
import { cardBuff, EGO_POTENTIALS_PLUS_3 } from '../helpers'

// Flicker Blade's epiphanies have in-game names, which their shards share (owner, 2026-10-27)
const flickerText = (pct: number, suffix: string, extra = '', keywords = 'Equilux / Unique') =>
  `[${keywords}]\n{${pct}%} Damage\n${extra}On polarization, split into Shard:Light${suffix} and Shard:Dark${suffix}`
const shardText = (kind: 'Light' | 'Dark', pct: number, trigger: string) =>
  `[${kind} / Unique / Retain]\n{${pct}%} Damage to a random enemy\nCreate 1 Sword Tassel\n${trigger}`

// Cards that create Sword Tassel bring it into the deck (CardPreset.creates); each Flicker Blade brings its own two shards
const tassel = ['card-1408']

// The un-epiphanied Flicker Blade's shards aren't on Prydwen (owner's screenshots, 2026-10-27: 96% = 80% at Signature 10)
const baseShard = (kind: 'Light' | 'Dark', trigger: string): CardPreset => ({
  id: `shard-${kind.toLowerCase()}`, base: `Shard:${kind}`, name: `Shard:${kind}`, category: 'Generated Card', rarity: 'Blue',
  cardType: 'Attack', cost: 2, element: 'Justice', tags: `${kind}, Unique, Retain`, scaling: 'ATK', pct: 0.8, hits: 1,
  weaknessApplies: false, text: shardText(kind, 80, trigger), creates: tassel,
  image: `cards/rossweisse/unique_30134_0${kind === 'Light' ? 6 : 7}.webp`,
})

export default {
  verified: { date: '2026-10-30', gameVersion: '841' },
  notes: 'Stat potentials are in the stats screen; card upgrades are set on the Setup tab. Per play (Cards tab): Sword Tassel '
    + 'stacks on Flicker Blade plays, Brand of the Cycle (on target) 1 while the target has Brand, Precious Name (E4) and Blade '
    + 'Poised (E6) stacks, X on Flicker Blade (Unbound). Each shard activation is another play of that shard. '
    + "The Ego skill's Fixed damage is added to the next Flicker Blade play by itself. "
    + 'Not counted: Radiant Sword Flow / I discard damage',
  // Potential nodes in the game's wording (owner's screenshots, 2026-10-30)
  potentials: {
    '3-1': { text: 'Decrease Cost of the Sword Slash card by 1.' },
    '5-1': { text: "+5% Damage Amount to Rossweisse's Sword Slash, and if Rossweisse's Attack is 500 or higher, add an additional +5% to the modifier" },
    '7': { text: "If Rossweisse's Attack is 600 or higher, +5% Justice Attribute Damage Amount, and for every 20 Attack exceeding 600, add an additional +2% to the modifier (additional +10% max)" },
  },
  // Manifest Ego in the game's wording (owner's screenshots, 2026-10-31)
  ego: {
    1: { text: "Adds the following effect to the Kyrken's Apostle card: Gain 1 AP.\nChanges the following effects for the Kyrken's Aegis effect: Increase Damage Amount of Attack Cards of this unit by 30%, and increase final Damage Amount of Flicker Blade by 20%" },
    2: { text: "At the start of battle, increase Rossweisse's final Damage Amount by 20%.\nAt the start of the turn, gain 4 Blade Afterimage.\nBlade Afterimage: When Rossweisse's Light or Dark cards are activated, 120% Damage to a random enemy, create 1 Sword Tassel, then decrease Blade Afterimage by 1 (max 8 stacks)" },
    3: { text: '+400% Damage Amount to Flickering White Night, and changes the Fixed Damage inflicted to the target when the next Equilux card is activated from being equal to 30% Damage taken into being equal to 60% Damage taken.' },
    4: { text: "At the start of battle, gain 1 Precious Name.\nEach time the effect of Rossweisse's Light or Dark cards activate, gain 1 Precious Name.\nPrecious Name: Increase Rossweisse's Damage Amount by 8% (max 5 stacks)\n\n「Sig, Siegrune, Gerhilde, Fricka... and you.」" },
    5: { text: EGO_POTENTIALS_PLUS_3 },
    6: { text: "When Rossweisse's Flicker Blade moves to hand, gain 1 Blade Poised Against the Cycle, and the Equilux, Light, and Dark cards are no longer included in the hand's maximum capacity count.\nBlade Poised Against the Cycle: Increase final Damage Amount of Rossweisse's Attack Cards by 15%, and if that card is Flicker Blade, increase by 25% (max 2 stacks)" },
  },
  effects: [
    // Sword Tassel (Bind 1/20): "When coalesced into the Equilux card, for each stack, +80% base Damage Amount to the Equilux
    // card for 1 turn". Added to the shown card % (owner, 2026-10-27); stacks set per play.
    { kind: 'Buff', id: 'tassel', name: 'Sword Tassel', category: 'Character', type: 'Base %', value: '+80%',
      appliesTo: 'Equilux', hitScope: 'All hits', condition: 'Always', maxStacks: 20, counter: 'Sword Tassel' },
    // Brand of the Cycle (Blade of the Cycle): "Increase Damage Amount taken from Rossweisse by 20%, and when activated, decrease
    // Brand of the Cycle by 1". The same 20% at any number of Brands, so the play's stacks are 1 (on) or 0.
    { kind: 'Buff', id: 'brand', name: 'Brand of the Cycle', category: 'Character', value: '20%', appliesTo: 'ALL',
      hitScope: 'All hits', condition: 'Always', maxStacks: 1, counter: 'Brand of the Cycle (on target)' },
    // Potentials not on the stats screen. 5-1 is part of the in-game card % (like Mei Lin's 5-1).
    { kind: 'Buff', id: 'p5-1-slash', node: '5-1', name: 'Basic Card Proficiency', category: 'Potential', type: 'Card +', value: '+5%',
      appliesTo: 'Sword Slash', hitScope: 'All hits', condition: 'Always', thresholdBonus: { above: 500, value: '+5%', orEqual: true } },
    // 7: "If Rossweisse's Attack is 600 or higher, +5% Justice Attribute Damage Amount, and for every 20 Attack exceeding 600,
    // add an additional +2% to the modifier (additional +10% max)"
    { kind: 'Buff', id: 'p7-justice', node: '7', name: 'Unique Stat Upgrade', category: 'Potential', value: '+5%', appliesTo: 'Justice',
      hitScope: 'All hits', condition: 'Always', thresholdMin: 600, thresholdBonus: { above: 600, value: '+2%', every: 20, max: '+10%' } },
    // Manifest Ego (dupes): on from the build's level. E1 (Kyrken's Aegis) is on Kyrken's Apostle; E5 is the +3 upgrade levels.
    { kind: 'Buff', id: 'e2-final', name: 'E2 Awakening Memory', category: 'Ego Manifestation', type: 'Final', value: '20%',
      appliesTo: 'ALL', hitScope: 'All hits', condition: 'Always', egoLevel: 2 },
    { kind: 'Buff', id: 'e3-ego', name: 'E3 Vivid Memory', category: 'Ego Manifestation', value: '+400%',
      appliesTo: 'Flickering White Night', hitScope: 'All hits', condition: 'Always', egoLevel: 3 },
    // E4 "Each time the effect of Rossweisse's Light or Dark cards activate, gain 1 Precious Name" (1 at the start of battle)
    { kind: 'Buff', id: 'e4-name', name: 'E4 Precious Name', category: 'Ego Manifestation', value: '8%', appliesTo: 'ALL',
      hitScope: 'All hits', condition: 'Always', maxStacks: 5, counter: 'Precious Name', egoLevel: 4 },
    // E6 Blade Poised Against the Cycle: final +15% on Attack cards, +25% on Flicker Blade (= 15% + 10%; final buffs add up)
    { kind: 'Buff', id: 'e6-poised', name: 'E6 Blade Poised Against the Cycle', category: 'Ego Manifestation', type: 'Final',
      value: '15%', appliesTo: 'Attack', hitScope: 'All hits', condition: 'Always', maxStacks: 2, counter: 'Blade Poised', egoLevel: 6 },
    { kind: 'Buff', id: 'e6-poised-flicker', name: 'E6 Blade Poised Against the Cycle (Flicker Blade 25%)', category: 'Ego Manifestation',
      type: 'Final', value: '10%', appliesTo: 'Equilux', hitScope: 'All hits', condition: 'Always', maxStacks: 2, counter: 'Blade Poised',
      egoLevel: 6 },
  ],
  // Card text: the in-game wording (owner's screenshots, 2026-10-27), with tokens for the build's numbers (engine/cardText.ts)
  cards: {
    // Ego skill: Prydwen has 200%; the card says 1,200%. The Fixed damage goes on the next Equilux play (followUp).
    'card-1380': {
      pct: 12,
      text: '{1200%} Damage\nWhen the next Equilux card is activated, inflict Fixed Damage equal to {E3:60|30}% of Damage dealt to the target',
      followUp: { appliesTo: 'Equilux', share: 0.3, ego: { level: 3, share: 0.6 } },
    },
    'card-1381': { text: '{100%} Damage', notes: 'Potential 3-1: costs 0' },
    'card-1382': { text: '{100%} Shield', notes: 'Shield only, no damage' },

    // Flicker Blade (Equilux: hit count fixed to 1)
    'card-1383': { text: flickerText(400, ''), creates: ['shard-light', 'shard-dark'] },
    'card-1384': { creates: ['card-1409', 'card-1414'], name: 'Flicker Blade (Amped)', text: flickerText(600, ' (Amped)') },
    'card-1385': { creates: ['card-1410', 'card-1415'], name: 'Flicker Blade (Cycle)', text: flickerText(600, ' (Cycle)') },
    'card-1386': { creates: ['card-1411', 'card-1416'], name: 'Flicker Blade (Aegis)', text: flickerText(400, ' (Aegis)', '20% DMG-Based Shield\n') },
    'card-1387': { creates: ['card-1412', 'card-1417'], name: 'Flicker Blade (Blink)', text: flickerText(600, ' (Blink)') },
    'card-1388': {
      name: 'Flicker Blade (Unbound)', creates: ['card-1413', 'card-1418'], text: flickerText(400, ' (Unbound)', '+120% base Damage Amount for each X\n', 'Equilux / Unique / Finale'),
      replaceNotes: true, notes: 'X-cost: set X (AP spent) on each play; the hit count stays 1 (Equilux)',
      effects: [cardBuff('x', 'Base Damage Amount for each X', '+120%', 'Flicker Blade (Unbound)', { type: 'Base %', counter: 'X (Unbound)' })],
    },

    // Sword Resonance, I–V
    'card-1389': { creates: tassel, text: 'Create 3 Sword Tassel' },
    'card-1390': { creates: tassel, text: 'Create 3 Sword Tassel\nActivate effect for 1 random Light or Dark card', notes: 'Add the activated shard as a play' },
    'card-1391': { creates: tassel, text: 'Create 3 Sword Tassel\nDraw 1 card(s) of this unit' },
    'card-1392': { text: '[Unique]\nApply Retrieve to all Light and Dark cards in hand' },
    'card-1393': { creates: tassel, text: 'Create 3 Sword Tassel\nWhen the next Equilux card is coalesced, apply Pulverize to that card' },
    'card-1394': { text: '[Unique]\nActivate effect for all Light and Dark cards in hand', notes: 'Add each activated shard as a play' },

    // Radiant Sword Flow, I–V
    'card-1395': { text: '{200%} Damage\nDiscard up to 1 card(s) in hand, and if Discarded, {150%} Damage', notes: 'The discard damage is not counted' },
    'card-1396': {
      text: '{300%} Damage\nDiscard up to 2 card(s) in hand, then that amount Discarded × {200%} Damage', notes: 'The discard damage is not counted',
    },
    'card-1397': { text: '{200%} Damage\nDiscard 1, and if that card is a Light or Dark card, proc then move to hand', notes: 'Add the procced shard as a play' },
    'card-1398': { text: '{300%} Damage\nDiscard up to 1 card(s) in hand\nDecrease Cost of the next 2 Light or Dark cards by 2 until activated' },
    'card-1399': {
      text: '[Unique]\n{300%} Damage\nWhen a Bind card is stacked this turn, +50% base Damage Amount (max 500%)',
      effects: [cardBuff('bind', 'Base Damage Amount per Bind card stacked', '+50%', 'Radiant Sword Flow IV',
        { type: 'Base %', maxStacks: 10, counter: 'Bind cards stacked' })],
    },
    'card-1400': {
      text: '[Unique]\nIncrease Damage Amount of this unit by 15% for each Justice Card in hand for 1 turn (max 75%)',
      effects: [cardBuff('justice', 'Damage Amount for each Justice Card in hand', '15%', 'ALL', { maxStacks: 5, counter: 'Justice Cards in hand' })],
    },

    // Blade of the Cycle, I–V (Brand of the Cycle is a character effect, set per play)
    'card-1401': { text: '{200%} Damage\n4 Brand of the Cycle' },
    'card-1402': { text: '{300%} Damage\n6 Brand of the Cycle' },
    'card-1403': { creates: tassel, text: '{300%} Damage\n2 Brand of the Cycle\nPurity: Create 2 Sword Tassel' },
    'card-1404': { text: '{200%} Damage\n4 Brand of the Cycle\nDraw 1 card(s) of this unit, then decrease Cost of those cards by 1 for 1 turn' },
    'card-1405': { text: '{300%} Damage\n1 Brand of the Cycle for each Justice Card in hand\nPurity: Decrease Cost by 1' },
    'card-1406': {
      text: '[Pulverize]\n{500%} Damage\n4 Brand of the Cycle\nOn Shield Break through this card, activate effect 1 more time (1 time per turn)',
      notes: 'On Shield Break, add it again as a play',
    },

    // Kyrken's Apostle: Kyrken's Aegis below E1 is the owner's text (2026-10-27); E1 raises it and adds Gain 1 AP
    'card-1407': {
      text: "[Unique / Initiation]\nDraw 2\n{E1:Gain 1 AP}\n1 Kyrken's Aegis",
      effects: [
        cardBuff('aegis-atk', "Kyrken's Aegis: Damage Amount of Attack Cards", '20%', 'Attack', { egoBelow: 1 }),
        cardBuff('aegis-final', "Kyrken's Aegis: final Damage Amount of Flicker Blade", '15%', 'Equilux', { type: 'Final', egoBelow: 1 }),
        cardBuff('aegis-atk-e1', "Kyrken's Aegis: Damage Amount of Attack Cards", '30%', 'Attack', { egoLevel: 1 }),
        cardBuff('aegis-final-e1', "Kyrken's Aegis: final Damage Amount of Flicker Blade", '20%', 'Equilux', { type: 'Final', egoLevel: 1 }),
      ],
    },
    // A Bind card: no cost, can't be played
    'card-1408': {
      cost: null,
      text: '[Bind (1/20) / Retain]\nWhen coalesced into the Equilux card, for each stack, +80% base Damage Amount to the Equilux card for 1 turn',
      notes: 'Count Sword Tassels in the Sword Tassel stacks of each Flicker Blade play',
    },

    // Shards
    'card-1409': { creates: tassel, text: shardText('Light', 120, 'When 1 card of this unit is activated, activate effect (2 times per turn)') },
    'card-1410': { creates: tassel, text: shardText('Light', 120, 'When a card is Discarded through an ability, activate effect (2 times per turn)') },
    'card-1411': { creates: tassel, text: shardText('Light', 240, 'When attacked, activate effect (1 time per turn)') },
    'card-1412': { creates: tassel, text: '[Light / Unique / Retain / Retrieve]\n{240%} Damage\nCreate 1 Sword Tassel\nDiscard 1 random Status Ailment or Curse Card(s) in hand' },
    'card-1413': { creates: tassel, text: shardText('Light', 120, 'When AP is gained through an ability, activate effect (2 times per turn)') },
    'card-1414': { creates: tassel, text: shardText('Dark', 120, 'When 2 cards of other Combatants are activated, activate effect (2 times per turn)') },
    'card-1415': { creates: tassel, text: shardText('Dark', 120, 'On Draw through an ability, activate effect (2 times per turn)') },
    'card-1416': { creates: tassel, text: shardText('Dark', 240, 'When Shield is gained through an ability, activate effect (1 time per turn)') },
    'card-1417': { creates: tassel, text: '[Dark / Unique / Retain / Retrieve]\n{240%} Damage\nCreate 1 Sword Tassel\nDiscard 1 card(s) of a random different Combatant in hand' },
    'card-1418': { creates: tassel, text: shardText('Dark', 120, 'When a 1-Cost or higher card is activated, activate effect (2 times per turn)') },
  },
  extraCards: [
    baseShard('Light', 'When 1 card of this unit is activated, activate effect (2 times per turn)'),
    baseShard('Dark', 'When 2 cards of other Combatants are activated, activate effect (2 times per turn)'),
    // E2 Blade Afterimage: damage from an effect, not a card (owner, 2026-10-27). Unconfirmed whether it's an Extra Attack or gets
    // the Signature upgrade or "Attack Card" buffs; as a Skill with no upgrade it gets only the "this unit" buffs. Owner has E2 to test.
    {
      id: 'blade-afterimage', base: 'Blade Afterimage', name: 'Blade Afterimage', category: 'Generated Card', cardType: 'Skill',
      cost: null, element: 'Justice', tags: 'Ego effect', scaling: 'ATK', pct: 1.2, hits: 1, weaknessApplies: false, upgrade: null, egoLevel: 2,
      text: 'E2: When a Light or Dark card of this unit is activated, {120%} Damage to a random enemy, create 1 Sword Tassel, '
        + 'then decrease Blade Afterimage by 1 (4 at the start of the turn, max 8 stacks)',
      notes: 'Add one play per Light or Dark card activated (up to 4 per turn). Unconfirmed: whether it counts as an Extra Attack',
    },
  ],
} satisfies CharacterAdditions
