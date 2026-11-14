// Equipment: our additions to the Prydwen import (src/data/prydwen-equipment.json), keyed by the import's piece ids.
// A re-import never touches this file. A piece listed here with `effects` shows them as preset switches (Setup, Buffs) while it's
// picked; `notCounted` says why nothing, or not everything, in its text is counted. A piece not listed shows its text marked
// "not counted".
//
// Effects are read from the piece's text with the owner (never assumed): "+X%" = Additive, "X%" without "+" = Multiplicative
// (docs/FORMULA.md). category: 'Equipment'. Effect ids must be unique per piece: saved switches are keyed "<piece id>|effectId"
// ("equip-206|dmg"), so renaming an effect id resets that switch.
//
// Prydwen's "+" can't be trusted on equipment (owner, 2026-11-13: both Whips are multiplicative in-game, Prydwen has "+25%" on one),
// so the first batches' types were confirmed with the owner; "Unconfirmed" below = the owner couldn't check it, Prydwen's wording is
// kept (in-game test equipment-plus-wording). From equip-94 on (owner, 2026-11-13): Prydwen's wording is taken as correct, the Whip
// being its one known mistake; the table shown per batch still lists each type for the owner to look over. Rules read with the owner (docs/FORMULA.md, Equipment effects):
// - Conditional and "for 1 turn" buffs are one switch with a hint, on while the piece is picked, counted on every hit.
// - Plain "Damage" / "Damage Amount" is ALL: Skill cards that deal damage, Extra Attacks and triggered hits too.
// - "Attack on all enemies" / "All-Attack" is AoE: any card that targets all enemies, of any type.
// - A bonus for one card ("next card used", "1 per battle") is a per-play counter, 0 or 1, set on that play (Cards tab).
// - Not counted for now: Fixed Damage the piece deals, and Agony it applies (until the DoT engine is redone).
import type { BuffEffect, EquipmentAdditions, StatEffect } from '../engine/types'

/** A damage buff of a piece: value '+25%' = Additive, '25%' = Multiplicative. */
const buff = (id: string, name: string, value: string, appliesTo: string, more: Partial<BuffEffect> = {}): BuffEffect =>
  ({ kind: 'Buff', id, name, category: 'Equipment', value, appliesTo, hitScope: 'All hits', condition: 'Always', ...more })

const stat = (id: string, name: string, s: StatEffect['stat'], value: string): StatEffect =>
  ({ kind: 'Stat', id, name, category: 'Equipment', stat: s, value })

const FIXED = 'its Fixed Damage'
const AGONY = 'Agony from equipment deals no damage here yet'
const PUNISHMENT = 'Punishment (Fixed Damage when the target gains Shield)'
const HEALING = 'healing only'
const SHIELD = 'Shield only'
const IMPAIR = 'Impair limits the Shield the enemy gains'
const CHEAP_ATTACK = 'Attack & 0-cost/1-cost'
/** Per-play counter of the "next card used" bonuses: 1 on the play that follows an Exhaust. */
const COUNTERATTACK = 'Counterattack (damage when the wearer is hit)'
const AFTER_EXHAUST = 'Follows an Exhaust'

export const EQUIPMENT_EFFECTS: Record<string, EquipmentAdditions> = {
  // ---------------------------------------------------------------- weapons: The Blue Pot
  // Steeler's Dagger: "Upon Defeat, +5-10 Credits (1 per battle)."
  'equip-1': { notCounted: 'Credits only' },
  // Dull Bone Blade: "10% Attack, -5% Critical Chance."
  'equip-2': { effects: [stat('atk', '10% Attack', 'ATK%', '10%'), stat('crit', '-5% Critical Chance', 'Crit Rate', '-5%')] },
  // Nature's Hostility: "When an enemy is defeated, 200% Fixed Damage to all enemies."
  'equip-6': { notCounted: FIXED },
  // Mutated Claws: "When drawing a Status Ailment or Curse card, +15% Damage for 1 turn." Once, however many are drawn (owner)
  'equip-7': { effects: [buff('dmg', '+15% Damage for 1 turn', '+15%', 'ALL', { hint: 'Drew Status Ailment / Curse' })] },
  // Executioner's Edge: "Against enemies with HP below 50%, Increase damage by 35% Damage." Type Unconfirmed
  'equip-15': { effects: [buff('dmg', 'Increase damage by 35% against enemies with HP below 50%', '35%', 'ALL', { hint: 'Enemy HP < 50%', onTarget: true })] },
  // Ritual Dagger: "When an enemy is defeated, +25% Attack Card Damage (Max 2 times)." Starts at 0 (owner): a per-play counter,
  // as the enemies fall during the attack list
  'equip-16': { effects: [buff('dmg', '+25% Attack Card Damage per enemy defeated', '+25%', 'Attack', { counter: 'Enemies defeated', maxStacks: 2 })] },
  // Dark Grip's Claws: "Increase the damage of attack on all enemies by 25%." Type Unconfirmed (the owner is looking it up)
  'equip-19': { effects: [buff('dmg', 'Increase the damage of attack on all enemies by 25%', '25%', 'AoE')] },
  // Mutated Order: "Increase Damage Amount by 25% against targets that haven't acted." Type Unconfirmed
  'equip-24': { effects: [buff('dmg', "Increase Damage Amount by 25% against targets that haven't acted", '25%', 'ALL', { hint: "Target hasn't acted", onTarget: true })] },

  // ---------------------------------------------------------------- weapons: Twin Star's Shadow
  // Bug Killer: "When using an Attack Card, 1 Agony (1 per turn). If in Invader battle, +2 additional Agony."
  'equip-25': { notCounted: AGONY },
  // Violet Butterfly's Whip: "Increase damage by 20% Damage for Attack Cards costing 1 or less."
  'equip-28': { effects: [buff('dmg', 'Increase damage by 20% for Attack Cards costing 1 or less', '20%', CHEAP_ATTACK)] },
  // Formica's Broken Spear: "Increase damage by 6% Damage per enemy." Enemies alive in the fight, 1 to 5 (owner)
  'equip-29': { effects: [buff('dmg', 'Increase damage by 6% per enemy', '6%', 'ALL', { maxStacks: 5, defaultStacks: 1, hint: 'Enemies alive' })] },
  // Abyssal Bug Tooth: "On Critical Hit, 50% chance to 1 Agony."
  'equip-32': { notCounted: AGONY },
  // The Destruction of Erysichthon: "When using an Attack Card, 5% chance to +1 hit." Expected value (owner): 5% of one more hit
  'equip-33': { triggers: [{ card: 'equip-33', on: 'Attack', own: true, repeat: true, chance: 0.05 }] },
  // Formica's Perfect Spear: "Increase damage by 7% Damage per enemy. Increase All-Attack Damage by 10%."
  'equip-38': { effects: [
    buff('dmg', 'Increase damage by 7% per enemy', '7%', 'ALL', { maxStacks: 5, defaultStacks: 1, hint: 'Enemies alive' }),
    buff('aoe', 'Increase All-Attack Damage by 10%', '10%', 'AoE'),
  ] },
  // Lepidola's Whip: Prydwen has "+25% Damage for Attack Cards costing 1 or less."; multiplicative in-game (owner)
  'equip-39': { effects: [buff('dmg', 'Increase damage by 25% for Attack Cards costing 1 or less', '25%', CHEAP_ATTACK)] },
  // Twin Swords of Greater and Lesser Evil: "Increase damage by 30% Damage against Ravaged targets."
  'equip-40': { effects: [buff('dmg', 'Increase damage by 30% against Ravaged targets', '30%', 'ALL', { condition: 'Ravaged only' })] },
  // Shell Bug Horn: "+20% Critical Damage."
  'equip-41': { effects: [stat('crit-dmg', '+20% Critical Damage', 'Crit DMG', '20%')] },

  // ---------------------------------------------------------------- weapons: City of Mist
  // Dream of the Devoured: "When a card is Exhausted, next card used Increase damage by 25% Damage stacks up to 1 time."
  // Only the card that follows an Exhaust (owner): set on that play
  'equip-51': { effects: [buff('dmg', 'Increase damage of the next card used by 25%', '25%', 'ALL', { counter: AFTER_EXHAUST, maxStacks: 1 })] },
  // Unexploded Plasma Bomb: "When a card is Exhausted, 40% Fixed Damage on a random enemy."
  'equip-52': { notCounted: FIXED },
  // Blood Giant Claw: "On Ravage, 150% Fixed Damage to the target."
  'equip-53': { notCounted: FIXED },
  // Void of the Devourer: "When a card is Exhausted, next card used Increase damage by 35% Damage stacks up to 1 time."
  'equip-61': { effects: [buff('dmg', 'Increase damage of the next card used by 35%', '35%', 'ALL', { counter: AFTER_EXHAUST, maxStacks: 1 })] },
  // Foggy Crystal Ball: "40% Damage for Attack cards with Cost 0." Multiplicative (owner)
  'equip-62': { effects: [buff('dmg', '40% Damage for Attack cards with Cost 0', '40%', 'Attack & 0-cost')] },

  // ---------------------------------------------------------------- weapons: Shop, Cthulu Run Monster
  // Crimson Sword: "When dealing Damage with a targeting Attack Card, 3 Agony (1 per turn)."
  'equip-64': { notCounted: AGONY },
  // Sneering Dagger: "When an enemy is defeated, 2 Vulnerable to all enemies."
  'equip-67': { notCounted: 'switch Vulnerable on for the plays yourself' },
  // Flashbang: "At the start of battle, apply 3 Weaken to a random enemy." Weaken lowers the damage the enemy deals (owner)
  'equip-69': { notCounted: 'Weaken lowers the damage the enemy deals' },
  // Command: #108: "+40% Attack Card Damage (1 per battle)." One Attack Card, once per battle (owner): set on that play. Type Unconfirmed
  'equip-70': { effects: [buff('dmg', '+40% Attack Card Damage (1 per battle)', '+40%', 'Attack', { counter: 'Command: #108', maxStacks: 1 })] },
  // Gastronomicon: "When using an Attack Card with cost 2 or more, 3 Agony."
  'equip-71': { notCounted: AGONY },
  // Big Game Hunter: "The first Attack Card used per battle +100% Tenacity Damage."
  'equip-75': { notCounted: 'Tenacity Damage only' },
  // Second Method: "Extra Attack damage +35%." An additive buff on Extra Attacks, not the Extra Damage stat (owner)
  'equip-87': { effects: [buff('dmg', 'Extra Attack damage +35%', '+35%', 'Extra Attack')] },
  // Criticism of Discord: "+18% Attack. On Ravage, allies' Stress -1."
  'equip-90': { effects: [stat('atk', '+18% Attack', 'ATK%', '18%')], notCounted: 'the Stress' },
  // M85 Military Grenade: "When using a Buff card, deal 150% Fixed Damage to all enemies."
  'equip-91': { notCounted: FIXED },
  // RFS-17: "+10% Critical Chance of Attack Cards with cost 0."
  'equip-93': { effects: [buff('crit', '+10% Critical Chance of Attack Cards with cost 0', '10%', 'Attack & 0-cost', { type: 'Crit Chance' })] },
  // Tentacles of Chaos: "+8% ally Attack Upon enemy Defeat, -2 Stress to the Combatant with the highest Stress." All three
  // combatants, the wearer too (owner)
  'equip-94': { effects: [{ ...stat('atk', '+8% ally Attack', 'ATK%', '8%'), target: 'allies' }], notCounted: 'the Stress' },
  // Obsidian Sword: "Increase damage amount by 12%."
  'equip-98': { effects: [buff('dmg', 'Increase damage amount by 12%', '12%', 'ALL')] },
  // Esophagus of Madness (The Blue Pot, Twin Star's Shadow, Foretold Ruin, Theater of Illusions):
  // "Increase damage by 20% Damage against targets with Agony."
  'equip-99': { effects: [buff('dmg', 'Increase damage by 20% against targets with Agony', '20%', 'ALL', { hint: 'Target has Agony', onTarget: true })] },
  // Bone Cutter: "When hitting a target under Weakened status, +30% Damage."
  'equip-133': { effects: [buff('dmg', '+30% Damage when hitting a target under Weakened status', '+30%', 'ALL', { hint: 'Target Weakened', onTarget: true })] },
  // Mountain of Corpses: "Increase Attack Card Damage by 25% (1 per turn)." One card per turn (owner): set on that play
  'equip-136': { effects: [buff('dmg', 'Increase Attack Card Damage by 25% (1 per turn)', '25%', 'Attack', { counter: 'Mountain of Corpses (1 per turn)', maxStacks: 1 })] },

  // ---------------------------------------------------------------- weapons: Swamp of Judgment
  // The Fading Flower of Life: "If at max HP, +40% Damage."
  'equip-108': { effects: [buff('dmg', '+40% Damage if at max HP', '+40%', 'ALL', { hint: 'At max HP' })] },
  // Dagger That Tricked the Shadow: "+12% Critical Damage."
  'equip-109': { effects: [stat('crit-dmg', '+12% Critical Damage', 'Crit DMG', '12%')] },
  // Sword Reflected in the Lake: "If you have 6 or more cards in hand, Increase damage by 25% Damage." A switch (owner)
  'equip-110': { effects: [buff('dmg', 'Increase damage by 25% with 6 or more cards in hand', '25%', 'ALL', { hint: '6+ cards in hand' })] },
  // Sun-Setting Bow: "Attack Cards with cost 2 or higher, Increase damage by 30% Damage (1 per turn)." One card per turn (owner)
  'equip-111': { effects: [buff('dmg', 'Increase damage of Attack Cards with cost 2 or higher by 30% (1 per turn)', '30%', 'Attack & 2+ cost', { counter: 'Sun-Setting Bow (1 per turn)', maxStacks: 1 })] },
  // Branch of the Sacred Tree: "On Heal or Recover, Fixed Damage to all enemies equal to 35% of Heal amount."
  'equip-116': { notCounted: FIXED },
  // The Flower of Life: "If at max HP, +50% Damage."
  'equip-117': { effects: [buff('dmg', '+50% Damage if at max HP', '+50%', 'ALL', { hint: 'At max HP' })] },
  // Branch of the Evil Tree: "On Heal or Recover, Fixed Damage to a random enemy equal to 50% of Recover amount."
  'equip-118': { notCounted: FIXED },
  // Cavalry of Lightning (also Foretold Ruin, Theater of Illusions): "When dealing Damage to a target with Shield, +100% Damage to
  // the next Attack Card." The next card only: set on that play
  'equip-121': { effects: [buff('dmg', '+100% Damage to the next Attack Card', '+100%', 'Attack', { counter: 'Cavalry of Lightning', maxStacks: 1 })] },
  // Branch of Eternity: "On Heal or Recover, Fixed Damage to all enemies equal to 50% of Recover amount."
  'equip-130': { notCounted: FIXED },

  // ---------------------------------------------------------------- weapons: Foretold Ruin
  // Rune Lance: "If use more than 5 AP, +25% Damage, Shield Gain, and Healing." A switch; the owner thinks it lasts the rest of the battle
  'equip-143': { effects: [buff('dmg', '+25% Damage if more than 5 AP were used', '+25%', 'ALL', { hint: 'Used more than 5 AP' })], notCounted: 'the Shield Gain and Healing' },
  // Flame of Purification: "When a card is Exhausted, 1 Retribution on a random enemy (2 per turn)." Retribution was renamed
  // Punishment (owner): "When Shield is gained, take Fixed Damage equal to 200% of Attack and reduce by 1 stack"
  'equip-144': { notCounted: PUNISHMENT },
  // Trumpet of Revelation: "When Draw a card, +20% Damage for 1 turn (2 per turn)." Starts at 0, up to 2 stacks (owner): set per play
  'equip-145': { effects: [buff('dmg', '+20% Damage for 1 turn per card drawn (2 per turn)', '+20%', 'ALL', { counter: 'Trumpet of Revelation', maxStacks: 2 })] },
  // Singing Sword: "+15% Attack When dealing Damage to a target with Shield, 1 Punishment."
  'equip-148': { effects: [stat('atk', '+15% Attack', 'ATK%', '15%')], notCounted: PUNISHMENT },
  // Radiant Orb: "+25% Damage to targets with Shield."
  'equip-151': { effects: [buff('dmg', '+25% Damage to targets with Shield', '+25%', 'ALL', { hint: 'Target has Shield', onTarget: true })] },

  // ---------------------------------------------------------------- weapons: Shop, Laboratory 0
  // Torch of Wrath: "At the start of a turn, apply 2 Mark to a random enemy."
  'equip-152': { notCounted: 'add the Mark to the plays yourself' },
  // Chimeranite: "When you Draw by an ability, +35% Damage amount to your own Attack Card(s) for 1 turn (Max 1 time per turn)."
  'equip-154': { effects: [buff('dmg', '+35% Damage amount to your own Attack Cards for 1 turn', '+35%', 'Attack', { hint: 'Drew by an ability' })] },
  // Replica Core: "When drawing your own Attack Card by an ability, that card +50% Damage Amount for 1 turn." That card only: set on its play
  'equip-155': { effects: [buff('dmg', '+50% Damage Amount to an Attack Card drawn by an ability', '+50%', 'Attack', { counter: 'Replica Core (drawn by an ability)', maxStacks: 1 })] },
  // Mutagenic Wave Amplifier: "When Drawing a Status Ailment or Curse Card, +12% Damage Amount for 1 turn." Once, like Mutated Claws
  'equip-156': { effects: [buff('dmg', '+12% Damage Amount for 1 turn', '+12%', 'ALL', { hint: 'Drew Status Ailment / Curse' })] },
  // W-52 Dopamine Injector: "When you Draw by an ability, Increase damage by 20% Damage amount for 1 turn (Max 2 times per turn)."
  // Starts at 0, up to 2 stacks (owner): set per play
  'equip-157': { effects: [buff('dmg', 'Increase damage by 20% for 1 turn per Draw by an ability (max 2)', '20%', 'ALL', { counter: 'W-52 Dopamine Injector', maxStacks: 2 })] },
  // Mutant Predator Spike: "When there are 4 or more cards in hand, increase Damage Amount by 30%."
  'equip-158': { effects: [buff('dmg', 'Increase Damage Amount by 30% with 4 or more cards in hand', '30%', 'ALL', { hint: '4+ cards in hand' })] },
  // Overcurrent Shock Unit: "When you Draw by an ability, 50% Fixed Damage to a random enemy."
  'equip-165': { notCounted: FIXED },

  // ---------------------------------------------------------------- weapons: Burning Life
  // Veiled Thorn: "If allies do not inflict Damage for 1 turn, then at the start of the next turn, increase Damage Amount by 50% for
  // 1 turn." The wearer's damage only (owner)
  'equip-171': { effects: [buff('dmg', 'Increase Damage Amount by 50% for 1 turn', '50%', 'ALL', { hint: 'No ally damage last turn' })] },
  // Millenium Arbor: "When a 3-cost or higher card is activated, 1 Vulnerable to a random enemy."
  'equip-175': { notCounted: 'switch Vulnerable on for the plays yourself' },
  // Harp of Conflict: "For 1 turn, when each of Damage, Shield, and Heal has been activated through cards by allies, increase Damage
  // Amount of allies by 15% for 1 turn."
  'equip-179': { effects: [buff('dmg', 'Increase Damage Amount of allies by 15% for 1 turn', '15%', 'ALL', { target: 'allies', hint: 'Damage, Shield and Heal used' })] },
  // Arm of Lost Valor: "When an Attack Card was not activated for 1 turn and the turn ended, create 1 Rocket Punch."
  'equip-184': { notCounted: 'the Rocket Punch card it creates' },
  // Harpoon Case of Broken Resolve: "Create 1 Pierce each odd turn."
  'equip-185': { notCounted: 'the Pierce card it creates' },
  // Brilliant Eternal Flame?: "Increase Damage Amount of 2-cost or higher Exhaust cards by 40%." An "Exhaust 2" card Exhausts on its
  // second play only (owner), so it gets the bonus on the play that is set as that one
  'equip-189': { effects: [
    buff('dmg', 'Increase Damage Amount of 2-cost or higher Exhaust cards by 40%', '40%', 'Exhaust & 2+ cost'),
    buff('dmg-second', 'Increase Damage Amount of 2-cost or higher Exhaust cards by 40% (Exhaust 2: second play)', '40%', 'Exhaust 2 & 2+ cost',
      { counter: 'Second play (it Exhausts)', maxStacks: 1 }),
  ] },
  // Pale Eternal Flame: "When a card is Exhausted, increase Damage Amount of alles by 10% for 1 turn (1 time per turn)."
  'equip-191': { effects: [buff('dmg', 'Increase Damage Amount of allies by 10% for 1 turn', '10%', 'ALL', { target: 'allies', hint: 'A card was Exhausted' })] },
  // Sword of Judgment: "When a card is Exhausted, increase Damage Amount by 10% for 1 turn (1 time per turn)."
  'equip-195': { effects: [buff('dmg', 'Increase Damage Amount by 10% for 1 turn', '10%', 'ALL', { hint: 'A card was Exhausted' })] },

  // ---------------------------------------------------------------- weapons: Theater of Illusions, Kaleidoscope
  // Corrupted Gauntlet: "On Extra Attack, increase Critical Chance by 2% for 1 turn (5 times per turn)." The combatant's Critical
  // Chance, for everything (owner); starts at 0: set per play
  'equip-202': { effects: [buff('crit', 'Increase Critical Chance by 2% for 1 turn per Extra Attack (5 times per turn)', '2%', 'ALL', { type: 'Crit Chance', counter: 'Corrupted Gauntlet', maxStacks: 5 })] },
  // Broken Golden Quill Pen: "When a Linked card is Discarded through an ability, increase Damage Amount by 20% for 1 turn (1 time per turn)."
  'equip-205': { effects: [buff('dmg', 'Increase Damage Amount by 20% for 1 turn', '20%', 'ALL', { hint: 'Linked card Discarded' })] },
  // Order's Baton: "Each time a card is created, +20% Damage Amount for 1 turn (2 times per turn)." Starts at 0: set per play
  'equip-208': { effects: [buff('dmg', '+20% Damage Amount for 1 turn per card created (2 times per turn)', '+20%', 'ALL', { counter: "Order's Baton", maxStacks: 2 })] },
  // Key of Sleep. Prydwen has only the second half; in-game (owner, 2026-11-13): "+40% Damage Amount to Attack Cards ... When the
  // target count of the Attack Card is 2 or more, -10% Damage Amount for each target (max -30%)". Read by the owner (Unconfirmed,
  // in-game test key-of-sleep-targets): +40% on one target, +20% on 2, +10% on 3 or more. The counter is the targets hit when
  // there are 2 or more (0 for one target)
  'equip-211': { effects: [
    buff('dmg', '+40% Damage Amount to Attack Cards', '+40%', 'Attack'),
    buff('targets', '-10% Damage Amount for each target, with 2 or more (max -30%)', '-10%', 'Attack', { type: 'Additive', counter: 'Key of Sleep: targets hit, if 2 or more', maxStacks: 3 }),
  ] },
  // Yearning Left Hand: "Increase Damage Amount by 30% to targets in a Aftershock state."
  'equip-215': { effects: [buff('dmg', 'Increase Damage Amount by 30% to targets in an Aftershock state', '30%', 'ALL', { hint: 'Target in Aftershock', onTarget: true })] },
  // Gauntlets of Protection: "When a base 3-Cost or higher Attack Card is used manually, 250% Fixed Damage to all enemies (2 times per turn)."
  'equip-220': { notCounted: FIXED },
  // Eternal Wedge: "At the start of the turn, 100% Fixed Damage to a random enemy possessing DoT effects."
  'equip-225': { notCounted: FIXED },
  // Twisted Drill Bit: "When an ally Desire Card is activated, 100% Fixed Damage to all enemies (3 times per turn)."
  'equip-226': { notCounted: FIXED },
  // The Exsanguine: "When an Attack Card is activated, 2 Scorched to the target (1 time per turn)."
  'equip-231': { notCounted: 'Scorched from equipment deals no damage here yet' },
  // Raider's Harpoon Gun: "On Critical Hit, 150% Fixed Damage to all enemies (3 times per turn)."
  'equip-232': { notCounted: FIXED },

  // ---------------------------------------------------------------- weapons: Celestial Bulwark (seasonal)
  // Runic Hammer: "+20% Critical Damage to ally Unique Attack Cards (cannot stack)." The wearer too; +20% at most, however many
  // combatants wear one (owner)
  'equip-238': { effects: [buff('crit-dmg', '+20% Critical Damage to ally Unique Attack Cards (cannot stack)', '20%', 'Unique & Attack', { type: 'Crit DMG', target: 'allies', noStack: true })] },
  // Fragment of Condensed Radiance: "+50% Critical Damage to Bind Attack Cards of this unit."
  'equip-241': { effects: [buff('crit-dmg', '+50% Critical Damage to Bind Attack Cards of this unit', '50%', 'Bind & Attack', { type: 'Crit DMG' })] },
  // Needle of the Severed Overseer: "On Weakness Attack through an Attack Card of this unit, +40% Damage Amount."
  'equip-242': { effects: [buff('dmg', '+40% Damage Amount on Weakness Attack through an Attack Card of this unit', '+40%', 'Attack', { weakness: true })] },
  // Core Disassembler: "When an enemy with Shield is Hit by this unit, 2 Tenacity Damage (1 time per turn)."
  'equip-245': { notCounted: 'Tenacity Damage only' },
  // Phantom Dagger: "When an Attack Card of this unit is used, 60% Fixed Damage for each Cost of the card used to a random enemy (2 times per turn)."
  'equip-246': { notCounted: FIXED },
  // Triskelion of Judgment: "When attacked, increase Damage Amount of the next Attack Card of this unit used by 20% (1 time per turn)."
  // The next Attack Card only: set on that play
  'equip-250': { effects: [buff('dmg', 'Increase Damage Amount of the next Attack Card of this unit by 20%', '20%', 'Attack', { counter: 'Triskelion of Judgment', maxStacks: 1 })] },

  // ================================================================ trinkets
  // Not counted on trinkets (owner, 2026-11-13): healing, Shield, Evade, Max HP (no damage reads Health yet).
  // ---------------------------------------------------------------- trinkets: The Blue Pot
  // Bloodstone of the Void: "When using an Attack Card, Recover HP equal to 6% of Damage dealt (1 per turn)."
  'equip-3': { notCounted: HEALING },
  // Proof of Initiation: "In Chaos Order battles, +10% Defense." Counted (owner): Defense-based cards read it
  'equip-5': { effects: [{ ...stat('def', '+10% Defense in Chaos Order battles', 'DEF%', '10%'), hint: 'Chaos Order battle' }] },
  // Nature's Gift: "Heal 40% at the end of turn."
  'equip-10': { notCounted: HEALING },
  // Eternal Stone: "At the start of turn, +25% Fixed Shield equal to the number of enemies."
  'equip-11': { notCounted: SHIELD },
  // Madman's Masterpiece: "At the start of an Elite Battle, +50% Damage." The whole battle (owner)
  'equip-12': { effects: [buff('dmg', '+50% Damage in an Elite Battle', '+50%', 'ALL', { hint: 'Elite Battle' })] },
  // Chaos Bible: "At the start of your turn after 4 turns from battle start, 400% Fixed Damage to all enemies."
  'equip-13': { notCounted: FIXED },
  // Crimson Bloodstone: "On using an Attack card, Recover Health equal to 9% of the damage dealt (1 per turn)."
  'equip-14': { notCounted: HEALING },
  // Order's Emblem: "In Chaos Order battles, +15% Defense."
  'equip-17': { effects: [{ ...stat('def', '+15% Defense in Chaos Order battles', 'DEF%', '15%'), hint: 'Chaos Order battle' }] },
  // Gloomy Prime's Eye: "At the start of battle, +40% Shield."
  'equip-22': { notCounted: SHIELD },
  // Forbidden Bible: "At the start of your turn after 4 turns from battle start, 550% Fixed Damage to all enemies."
  'equip-23': { notCounted: FIXED },

  // ---------------------------------------------------------------- trinkets: Twin Star's Shadow
  // First Aid Kit: "At the end of battle, Recover 5%."
  'equip-27': { notCounted: HEALING },
  // Lepidola's Wing: "At the start of battle, 1 Evade."
  'equip-30': { notCounted: 'Evade only' },
  // Kirak's Core: "At the start of turn, if HP below 40% max HP, Recover 5%."
  'equip-31': { notCounted: HEALING },
  // Natural Predator: "On Ravage, +100% Damage to next 1 Attack Card used." The next Attack Card only: set on that play
  'equip-36': { effects: [buff('dmg', '+100% Damage to the next Attack Card used, on Ravage', '+100%', 'Attack', { counter: 'Natural Predator', maxStacks: 1 })] },
  // Voracious Swarm: "When taking Damage, 4 Agony on the attacker."
  'equip-37': { notCounted: AGONY },
  // Pulsating Egg: "+15% Attack, +10% Max HP."
  'equip-43': { effects: [stat('atk', '+15% Attack', 'ATK%', '15%')], notCounted: 'the Max HP' },

  // ---------------------------------------------------------------- trinkets: City of Mist
  // Flower of Dead Souls. Prydwen: "From the second Attack Card each turn onward, by 20% Damage."; in-game (owner): "Increase Damage
  // Amount of the second Attack Card onward each turn by 20%". Automatic (owner): not on the wearer's first Attack Card of the
  // attack list, which counts as one turn
  'equip-44': { effects: [buff('dmg', 'Increase Damage Amount of the second Attack Card onward each turn by 20%', '20%', 'Attack', { afterFirst: true, onTarget: true })] },
  // Soul Orb: "When a card is Exhausted, 1 Tenacity Damage to all enemies (1 time per battle)."
  'equip-45': { notCounted: 'Tenacity Damage only' },
  // The Famished One's Belly: "When a card is Exhausted, +25% Damage, Recover 5% (1 per battle)." Once on, the whole battle (owner)
  'equip-46': { effects: [buff('dmg', '+25% Damage once a card is Exhausted', '+25%', 'ALL', { hint: 'A card was Exhausted' })], notCounted: 'the Recover' },
  // M.S.S Data Pad: "At the start of Nihilum battle, 2 Vulnerable to all enemies."
  'equip-48': { notCounted: 'switch Vulnerable on for the plays yourself' },
  // M.S.S Data Pad SE: "At the start of Nihilum battle, 3 Vulnerable to all enemies."
  'equip-49': { notCounted: 'switch Vulnerable on for the plays yourself' },
  // Eye of the Eyeless: "Increase damage of Basic attack cards by 40%."
  'equip-56': { effects: [buff('dmg', 'Increase damage of Basic attack cards by 40%', '40%', 'Basic Attack')] },
  // Palasia's Orb: "When Vulnerable is applied by a card, also 1 Weaken to the target."
  'equip-57': { notCounted: 'Weaken lowers the damage the enemy deals' },
  // Torch That Should Not Be Extinguished: "If you have Shield at the start of turn, 80% Fixed Shield."
  'equip-58': { notCounted: SHIELD },
  // Revelation's of Futility: "When using Attack Cards, +20% Fixed Shield (10 per turn)."
  'equip-59': { notCounted: SHIELD },
  // Eye of Gluttony: "+40% Damage. At the end of the turn, 30% chance to Exhaust 1 card in hand."
  'equip-60': { effects: [buff('dmg', '+40% Damage', '+40%', 'ALL')], notCounted: 'the Exhaust at the end of the turn' },

  // ---------------------------------------------------------------- trinkets: Shop, Cthulu Run Monster, Event
  // Moon of Destruction: "At the start of battle, 200% Fixed Damage to all enemies."
  'equip-66': { notCounted: FIXED },
  // Time Regulator: "Activate Epiphany for the equipped combatant." Nothing in battle (owner)
  'equip-74': { notCounted: 'nothing in battle' },
  // Absolute Zero Tetrahedron: "At the start of battle, +20% Shield."
  'equip-76': { notCounted: SHIELD },
  // Sphere of Randomness: "+10% max HP. At the start of battle, +1 AP, Draw 1."
  'equip-79': { notCounted: 'Max HP, AP and Draw only' },
  // Amorphous Cube: "At the start of battle, +25% Damage." On for the whole battle (owner: strong for a Rare, and used over Legendaries)
  'equip-81': { effects: [buff('dmg', '+25% Damage', '+25%', 'ALL')] },
  // Heart of the Jewel: "X is applied as X+1." For cards with an X Cost, such as Rossweisse's Unbound Flicker Blade (owner)
  'equip-82': { notCounted: "add 1 to the Cost of X-Cost cards' plays yourself" },
  // Water Drops of the Goddess: "At the start of battle, 1 Storage." No battle damage (owner)
  'equip-84': { notCounted: 'Storage only' },
  // Dice of Derangement: "+8% max HP. At the end of battle, if HP below 50%, recover 8% max HP. If HP is 50% or higher, -5 for the
  // combatant with the highest Stress."
  'equip-85': { notCounted: 'Max HP, healing and Stress only' },
  // Multifaceted Parallel Universe Nexus: "At the start of turn, activate 1 random Initiative card in hand."
  'equip-86': { notCounted: 'it plays a card; no bonus of its own' },
  // Magic-Infused Sapphire: "At the start of battle, if the Outbreak of War card is in hand, 1 Tenacity Damage to all enemies."
  'equip-89': { notCounted: 'Tenacity Damage only' },
  // Quantum Collector: "When an ally uses a Upgrade card, Increase damage by 20% Damage, Shield, and Healing for 1 turn." The
  // wearer's damage (owner)
  'equip-96': { effects: [buff('dmg', 'Increase damage by 20% for 1 turn', '20%', 'ALL', { hint: 'An ally used an Upgrade card' })], notCounted: 'the Shield and Healing' },
  // Bloody Pendant: "When using Duplicated Cards, all enemies' Action Count increase by 3 (1 time per battle)."
  'equip-103': { notCounted: 'Action Count only' },
  // Dice of Discord: "At the end of turn, 40% x 2-6 Fixed Damage to a random enemies, and trigger 200% Fixed Damage on allies with
  // one random 1 effect."
  'equip-104': { notCounted: FIXED },

  // ---------------------------------------------------------------- trinkets: Swamp of Judgment
  // Clover of the Forest: "When Recover via card, +10% ally Attack for 1 turn (Max 1 stack)." Allies = all three combatants
  'equip-105': { effects: [{ ...stat('atk', '+10% ally Attack for 1 turn', 'ATK%', '10%'), target: 'allies', hint: 'Recovered via a card' }] },
  // Poacher's Pathfinder: "In Sekred battle, +25% Damage, 2 Vulnerable to all enemies."
  'equip-106': { effects: [buff('dmg', '+25% Damage in Sekred battle', '+25%', 'ALL', { hint: 'Sekred battle' })], notCounted: 'the Vulnerable: switch it on for the plays yourself' },
  // Bone Ring of Wildfire: "When using a Upgrade card, +30% Damage for 1 turn."
  'equip-114': { effects: [buff('dmg', '+30% Damage for 1 turn', '+30%', 'ALL', { hint: 'Used an Upgrade card' })] },
  // Call of the Ancient Spirit: "On Critical Hit, Heal 10%."
  'equip-115': { notCounted: HEALING },
  // Verdant Day: "On odd turns, +8% Attack, 12% Defense." Switched on and off by hand (owner): the attack list has no turn numbers
  'equip-119': { effects: [{ ...stat('atk', '+8% Attack on odd turns', 'ATK%', '8%'), hint: 'Odd turns' }, { ...stat('def', '12% Defense on odd turns', 'DEF%', '12%'), hint: 'Odd turns' }] },
  // Verdant Night: "On even turns, +12% Attack, 8% Defense."
  'equip-120': { effects: [{ ...stat('atk', '+12% Attack on even turns', 'ATK%', '12%'), hint: 'Even turns' }, { ...stat('def', '8% Defense on even turns', 'DEF%', '8%'), hint: 'Even turns' }] },
  // Lead-Colored Holy Water (also Foretold Ruin, Theater of Illusions): "On Ravage, 2 Impair to the target." Impair limits the
  // Shield the enemy gains (owner)
  'equip-124': { notCounted: IMPAIR },
  // Vladeus's Reactor (also Foretold Ruin, Theater of Illusions): "When using a Upgrade card, 1 Damage Reduction."
  'equip-125': { notCounted: 'Damage Reduction for the wearer only' },
  // The Golden Rule (also Foretold Ruin, Theater of Illusions): "+20% Damage, +20% Shield at the start of battle."
  'equip-126': { effects: [buff('dmg', '+20% Damage', '+20%', 'ALL')], notCounted: 'the Shield' },
  // Dormant Seeds: "On gaining Shield, +100% Fixed Shield (1 per turn)."
  'equip-129': { notCounted: SHIELD },
  // Verdant Shackles: "+12% Attack, +12% Defense."
  'equip-131': { effects: [stat('atk', '+12% Attack', 'ATK%', '12%'), stat('def', '+12% Defense', 'DEF%', '12%')] },

  // ---------------------------------------------------------------- trinkets: Shop, Foretold Ruin, Laboratory 0
  // Dimensional Cube: "When a card is Discarded, +15% Damage Amount for 1 turn (max 3 stacks)." Starts at 0: set per play
  'equip-137': { effects: [buff('dmg', '+15% Damage Amount for 1 turn per card Discarded (max 3 stacks)', '+15%', 'ALL', { counter: 'Dimensional Cube', maxStacks: 3 })] },
  // Heart of Gold: "At the end of battle, if HP is below 50%, Recover 8%."
  'equip-138': { notCounted: HEALING },
  // Eye of the Punisher (Fusion Mode, Foretold Ruin): "If the enemy is alone, increase damage by 30%."
  'equip-140': { effects: [buff('dmg', 'Increase damage by 30% if the enemy is alone', '30%', 'ALL', { hint: 'One enemy alive', onTarget: true })] },
  // Rune Chord: "If you have any Retained cards at the end of your turn, +60% Fixed Shield."
  'equip-141': { notCounted: SHIELD },
  // Guardian Core: "If an enemy with an intent to Attack is present, +60% Fixed Shield (1 per turn)."
  'equip-142': { notCounted: SHIELD },
  // Corroded Core: "If an attack is perfectly blocked with Shield, 1 Impair on all enemies (1 per turn)."
  'equip-147': { notCounted: IMPAIR },
  // Corrupted Core: "+15% Defense, Retain +20% Shield."
  'equip-150': { effects: [stat('def', '+15% Defense', 'DEF%', '15%')], notCounted: 'the Shield' },
  // Grey Orb: "At the start of battle, gain 3 Damage Reduction."
  'equip-153': { notCounted: 'Damage Reduction for the wearer only' },
  // Emblem of an Exceptional Entity: "+30% Damage Amount. Stress received becomes 0 (1 for each battle)."
  'equip-161': { effects: [buff('dmg', '+30% Damage Amount', '+30%', 'ALL')], notCounted: 'the Stress' },
  // Source of the Forbidden: "When hit, inflict 1 random effects among Vulnerable, Weaken, or Impair to the attacker (3 times per turn)."
  'equip-162': { notCounted: 'a random debuff: switch Vulnerable on for the plays yourself' },
  // Unconfirmed Recovery Ampule: "When an ally uses a Forbidden Card, Recover 3% of Max HP."
  'equip-163': { notCounted: HEALING },
  // Superconductive Protein: "At the start of the battle, change the cost of 1 card in your hand to 0 for 1 turn."
  'equip-164': { notCounted: 'a Cost change only' },
  // Hyperimmunity Hormone: "When you Draw by an ability, +25% Shield gain for 1 turn (Max 2 times per turn)."
  'equip-168': { notCounted: SHIELD },
  // Administrator ID Badge: "At the start of the battle, 1 Evade."
  'equip-169': { notCounted: 'Evade only' },
  // Nerve Hacking Module: "When an ally uses a Forbidden Card, +20% Damage amount and +20% Shield gain for 1 turn (Max 2 times per
  // turn)." Starts at 0: set per play
  'equip-170': { effects: [buff('dmg', '+20% Damage amount for 1 turn per Forbidden Card an ally uses (max 2)', '+20%', 'ALL', { counter: 'Nerve Hacking Module', maxStacks: 2 })], notCounted: 'the Shield gain' },

  // ---------------------------------------------------------------- trinkets: Burning Life
  // Leaf of the World Tree: "When 3 cards of 2-cost or higher are used, Stockpile. (Stockpile = Retain AP, ...)."
  'equip-173': { notCounted: 'AP only' },
  // Luminescent Shroom: "Double the effect of Spore Propagation on the 6th Attack Card created for 1 turn." Spore Propagation is a
  // buff from one seasonal card ("Increase Damage Amount taken by 5%..."): too specific to model (owner)
  'equip-174': { notCounted: 'Spore Propagation, from one seasonal card' },
  // Plant Doll: "When 4 Skill Cards are Exhausted, decrease Stress of a random ally by 1."
  'equip-177': { notCounted: 'Stress only' },
  // Combat Drum: "When 5 Skill Cards are created, increase Damage Amount of the next ally card activated by 20% (max 1 stack)."
  // The next card any of the three combatants plays (owner): set on that play
  'equip-181': { effects: [buff('dmg', 'Increase Damage Amount of the next ally card activated by 20%', '20%', 'ALL', { target: 'allies', counter: 'Combat Drum', maxStacks: 1 })] },
  // Gladiator's Medallion: "When Shield is gained 3 times through cards, 100% Fixed Damage to all enemies."
  'equip-182': { notCounted: FIXED },
  // Rage Potion: "When 4 Attack Cards are activated, increase Damage Amount of the next Attack Card activated by 40%." Automatic:
  // the wearer's every 5th Attack Card of the attack list (owner: "I think it's every 5th card"; Unconfirmed, in-game test rage-potion-count)
  'equip-183': { effects: [buff('dmg', 'Increase Damage Amount of every 5th Attack Card activated by 40%', '40%', 'Attack', { everyNth: 5, onTarget: true })] },
  // Launcher of Ruined Honor: "Create 1 Heavy Blow each even turn."
  'equip-187': { notCounted: 'the Heavy Blow card it creates' },
  // Charger of Weathered Glory: "If a turn is ended while 1 or more AP remaining, at the start of the next turn, create 1 Charged Strike."
  'equip-188': { notCounted: 'the Charged Strike card it creates' },
  // Liberated Essence: "At the start of the turn, decrease Cost of 1 random Exhaust card in hand by 1 for 1 turn."
  'equip-190': { notCounted: 'a Cost change only' },
  // Shining World Tree Stem: "Increase Heal Amount by 25%."
  'equip-194': { notCounted: HEALING },
  // Golden Bell: "At the start of the battle, decrease Stress of a random ally by 3."
  'equip-197': { notCounted: 'Stress only' },
  // Summoned Lump of Light: "Increase Damage Amount of the third Attack Card created by 30% for 1 turn." The third Attack Card
  // created each turn, that card alone; turned on by hand on its play (owner: hard to keep track of)
  'equip-198': { effects: [buff('dmg', 'Increase Damage Amount of the third Attack Card created by 30%', '30%', 'Attack', { counter: 'Third Attack Card created (Summoned Lump of Light)', maxStacks: 1 })] },
  // Lightless Stem: "Increase Heal Amount by 15%."
  'equip-199': { notCounted: HEALING },

  // ---------------------------------------------------------------- trinkets: Theater of Illusions
  // Gospel of Lament: "When the Action Count of enemies increases, +30% Damage Amount to ally Attack Cards for 1 turn (1 time per turn)."
  'equip-204': { effects: [buff('dmg', '+30% Damage Amount to ally Attack Cards for 1 turn', '+30%', 'Attack', { target: 'allies', hint: 'Enemy Action Count rose' })] },
  // A Lonesome Wedding Ring: "At the start of the turn, Discard 1 random ally Quietus card in hand."
  'equip-206': { notCounted: 'a Discard only' },
  // Someone's Letter: "At the end of the turn, if an ally Persona Card is in hand, 150% Fixed Damage to a random enemy."
  'equip-207': { notCounted: FIXED },
  // Stele of Heresy: "Each time 3 cards are Discarded through an ally ability, randomly inflict 1 of either Vulnerable or Mark on a
  // random enemy (5 times per turn)."
  'equip-210': { notCounted: 'a random Vulnerable or Mark: switch Vulnerable on for the plays, or add the Mark to them, yourself' },
  // Hymn-Singing Lips: "When a card is Discarded through an ability, 1 Resonance to all enemies (3 times per turn)." Resonance (owner):
  // "On card Discard, 80% Extra Attack, then decrease Resonance by 1". Damage of its own: waits for the extra damage sources model
  'equip-216': { notCounted: 'Resonance (an 80% Extra Attack when a card is Discarded)' },
  // An Eye Plucked from a Mural: "At the start of the turn, increase Damage Amount of this unit by 20% for each ally Persona Card in
  // hand." One Persona Card per combatant, so 3 at most; set per play (owner)
  'equip-218': { effects: [buff('dmg', 'Increase Damage Amount of this unit by 20% for each ally Persona Card in hand', '20%', 'ALL', { counter: 'Ally Persona Cards in hand', maxStacks: 3 })] },

  // ---------------------------------------------------------------- trinkets: Kaleidoscope
  // Essence-Fragmented Necklace: "When 3 enemies are defeated by allies in 1 turn, gain 1 AP (1 time per turn)."
  'equip-223': { notCounted: 'AP only' },
  // Kaleidoscope Fragment: "When Weaken is applied through an ability, 1 Weaken and 3 Scorched to the target (1 time per turn)."
  'equip-224': { notCounted: 'Weaken and Scorched from equipment' },
  // Closed-Circuit Terminal: "On an All-Target Attack through an ally ability, 1 Vulnerable to a random enemy (1 time per turn)."
  'equip-227': { notCounted: 'the Vulnerable: switch Vulnerable on for the plays yourself' },
  // Cycle of Circulation: "At the end of the turn, if HP is less than 50%, 70% Fixed Heal (3 times per battle)."
  'equip-229': { notCounted: HEALING },
  // Invader Observation Logs: "+20% Damage Amount to Attack Cards, and +2% Critical Chance for each enemy present." The Critical
  // Chance is the wearer's, for everything they do, Extra Attacks included; 1 to 5 enemies (owner)
  'equip-230': { effects: [
    buff('dmg', '+20% Damage Amount to Attack Cards', '+20%', 'Attack'),
    buff('crit', '+2% Critical Chance for each enemy present', '2%', 'ALL', { type: 'Crit Chance', maxStacks: 5, defaultStacks: 1, hint: 'Enemies present' }),
  ] },
  // Raider's Scanning Gear: "At the start of the turn, +30% Critical Damage to the first Attack Card activated." Automatic: the
  // wearer's first Attack Card of the attack list, which is one turn (owner)
  'equip-234': { effects: [buff('crit-dmg', '+30% Critical Damage to the first Attack Card activated each turn', '30%', 'Attack', { type: 'Crit DMG', firstOnly: true })] },
  // Final Entry: "At the start of the turn, increase Stress of a random ally by 2, then 150% Fixed Damage to all enemies." (in-game
  // text, owner; Prydwen has "150% Damage")
  'equip-236': { notCounted: FIXED },

  // ---------------------------------------------------------------- trinkets: Celestial Bulwark (seasonal)
  // The Final Command: "When AP is gained through a card or Ego Skill of this unit, +3% Attack to allies for 1 turn (max 6 stacks)."
  // Starts at 0: set per play (owner)
  'equip-237': { effects: [buff('atk', '+3% Attack to allies for 1 turn, per AP gain of this unit (max 6 stacks)', '3%', 'ALL', { type: 'ATK %', target: 'allies', counter: 'The Final Command', maxStacks: 6 })] },
  // Overloaded Power Engine: "+3% Critical Damage to Attack Cards of this unit for each Bind card of this unit stacked this turn
  // (max 30%)." Stacking: two of the same Bind card in hand combine and the Bind counter goes up (owner); set per play for now
  'equip-240': { effects: [buff('crit-dmg', '+3% Critical Damage to Attack Cards of this unit for each Bind card stacked this turn (max 30%)', '3%', 'Attack', { type: 'Crit DMG', counter: 'Bind cards stacked this turn', maxStacks: 10 })] },
  // Split Design Core: "At the start of the turn, increase Damage Amount of allies by 8% (3 times per battle)." Each time lasts the
  // whole battle: turn 1 is 8%, turn 3 on 24% (owner)
  'equip-244': { effects: [buff('dmg', 'Increase Damage Amount of allies by 8% at the start of the turn (3 times per battle)', '8%', 'ALL', { target: 'allies', maxStacks: 3, defaultStacks: 1, hint: 'Turns started' })] },
  // Enforcement Contract: "At the end of the turn, Fixed Heal 20% for each card in hand (max 100%)."
  'equip-249': { notCounted: HEALING },
  // Pendant of Balance: "When an Attack Card is used by allies, 20% Fixed Shield (5 times per turn)."
  'equip-252': { notCounted: SHIELD },

  // ================================================================ armor
  // Not counted on armor: Shield, healing, Max HP, Immunity, Damage Reduction, damage taken, and Counterattack (damage when the wearer
  // is hit: for the engine later, owner 2026-11-13)
  // ---------------------------------------------------------------- armor: The Blue Pot, Twin Star's Shadow, City of Mist
  // Resolute Gauntlets: "At the start of Chaos Order battle, +20% Damage, 1 Damage Reduction." Lasts the whole battle; a switch per
  // battle (owner)
  'equip-4': { effects: [buff('dmg', '+20% Damage in a Chaos Order battle', '+20%', 'ALL', { hint: 'Chaos Order battle' })], notCounted: 'the Damage Reduction' },
  // Wolves Bane's Spine: "On Critical Hit, +10% Fixed Shield."
  'equip-8': { notCounted: SHIELD },
  // Shield of the Watcher: "When taking Damage, 1 Mark on the attacker."
  'equip-9': { notCounted: 'the Mark: add the Mark to the plays yourself' },
  // The Chosen Vessel: "At the start of your turn after 3 turns from battle start, +250% Fixed Shield."
  'equip-18': { notCounted: SHIELD },
  // Wild Fur Cloak: "At turn start, Counter 1."
  'equip-20': { notCounted: COUNTERATTACK },
  // Kentris Chitin Armor: "Increase Ally Shield Gain by 15%."
  'equip-21': { notCounted: SHIELD },
  // Crustacean Fluider: "When taking damage, after 1 turn, +60% Fixed Shield at start of turn."
  'equip-26': { notCounted: SHIELD },
  // Growing Carapace: "At the start of the turn, gain 40% Fixed Shield."
  'equip-34': { notCounted: SHIELD },
  // Dance of the Night Butterflies: "On Ravage, +60% Fixed Shield."
  'equip-35': { notCounted: SHIELD },
  // Wings of the Swarm: "At the start of battle, gain 2 Immunity."
  'equip-42': { notCounted: 'Immunity only' },
  // Contaminated Helmet: "Max HP +6%, Defense +12%."
  'equip-47': { effects: [stat('def', 'Defense +12%', 'DEF%', '12%')], notCounted: 'the Max HP' },
  // M.S.S Scope: "If a harmful effect is inflicted for 1 turn, then +80% Fixed Shield at the end of turn."
  'equip-50': { notCounted: SHIELD },
  // Regenerative Ribcage: "Max HP +12%."
  'equip-54': { notCounted: 'Max HP only' },
  // Gluttonous Tailcoat: "When taking damage, after 1 turn, +80% Fixed Shield at start of turn."
  'equip-55': { notCounted: SHIELD },
  // Fragment of the Empty Void: "At the start of battle, Discard up to 3 cards, Draw equal to the number."
  'equip-63': { notCounted: 'Discard and Draw only' },

  // ---------------------------------------------------------------- armor: Shop, Cthulu Run Monster, several planets
  // Assault Boots: "At the start of your turn after 2 turns from battle start, +200% Fixed Shield."
  'equip-68': { notCounted: SHIELD },
  // Assault Gauntlets: "At the start of battle, gain 3 Counterattack."
  'equip-72': { notCounted: COUNTERATTACK },
  // Shell of Aberration: "+12% Defense. When Stress increases, 50% chance to increase Stress by 1 less."
  'equip-73': { effects: [stat('def', '+12% Defense', 'DEF%', '12%')], notCounted: 'the Stress' },
  // Survivor's Hood: "At the start of battle, gain 140% Fixed Shield."
  'equip-77': { notCounted: SHIELD },
  // Reinforced Combat Suit: "At the end of the turn, if there is no Shield, gain 60% Fixed Shield."
  'equip-78': { notCounted: SHIELD },
  // Cloud-Walking Shoes: "When an ally inflicts Ravage, +40% Fixed Shield."
  'equip-80': { notCounted: SHIELD },
  // Scout's Combat Boots: "On enemy defeat, +60% Fixed Shield."
  'equip-83': { notCounted: SHIELD },
  // Gladiator's Helmet: "At the start of battle, gain 2 Damage Reduction."
  'equip-92': { notCounted: 'Damage Reduction only' },
  // Standard Gas Mask: "At the start of battle, gain 1 Immunity."
  'equip-95': { notCounted: 'Immunity only' },
  // Cursed Doll: "At the start of turn, Heal 60% for each Status Ailment and Curse card in hand."
  'equip-100': { notCounted: HEALING },
  // Torture Toolbox: "At the start of turn, +1 Action Count to all enemies."
  'equip-101': { notCounted: "the enemies' Action Count only" },
  // Chains of Obsession: "When using Attack cards, 1% HP Reduction, 60% Fixed Shield."
  'equip-102': { notCounted: 'HP loss and Shield only' },

  // ---------------------------------------------------------------- armor: Swamp of Judgment, Shop
  // Mask of Evil Spirits: "When taking damage, after 1 turn, +60% Fixed Shield at start of turn."
  'equip-107': { notCounted: SHIELD },
  // Immortal Scale: "When gaining Counterattack via an ability, +1 additional Counterattack."
  'equip-112': { notCounted: COUNTERATTACK },
  // Fairy King's Crown: "+6% Critical Chance."
  'equip-113': { effects: [stat('crit', '+6% Critical Chance', 'Crit Rate', '6%')] },
  // Wings of Light: "When Ego Points are 3 or lower, 0.2 Ego Points on Critical Hit."
  'equip-122': { notCounted: 'Ego Points only' },
  // Ring of the Seraphim: "When using a Upgrade card, +30% Damage for 1 turn."
  'equip-123': { effects: [buff('dmg', '+30% Damage for 1 turn when using an Upgrade card', '+30%', 'ALL', { hint: 'Used an Upgrade card' })] },
  // Star-Lit Cloak: "Decrease Damage Taken by 10% (1 time per turn)" (in-game text, owner; Prydwen has "-10% Damage (1 per turn)")
  'equip-127': { notCounted: 'damage taken only' },
  // Mask of Flames: "Increase damage dealt to Vulnerable targets by 35%." Automatic: on the plays with Vulnerable switched on (owner)
  'equip-128': { effects: [buff('dmg', 'Increase damage dealt to Vulnerable targets by 35%', '35%', 'ALL', { vsVulnerable: true, hint: 'Plays with Vulnerable on' })] },
  // Lush Seaweed Armor: "When gaining Shield, gain 30% Fixed Shield."
  'equip-132': { notCounted: SHIELD },
  // Psionic Combat Suit: "When a card is Exhausted, 30% Fixed Shield (5 times per turn)."
  'equip-134': { notCounted: SHIELD },
  // Titan Combat Suit: "When taking Damage, Recover 2% HP (1 per turn)."
  'equip-135': { notCounted: HEALING },

  // ---------------------------------------------------------------- armor: Foretold Ruin, Laboratory 0, Shop
  // Consecrated Halo: "+25% Shield Gain"
  'equip-139': { notCounted: SHIELD },
  // Twisted Discipline: "When use 10 or more AP, 2 Immunity."
  'equip-146': { notCounted: 'Immunity only' },
  // Primordial Discipline: "At the start of battle, gain 2 Immunity."
  'equip-149': { notCounted: 'Immunity only' },
  // Rocket-Adorned Cape: "At the start of the battle, 1 Damage Reduction and Draw 1."
  'equip-159': { notCounted: 'Damage Reduction and a Draw only' },
  // Wings of Freedom: "When hit, Increase damage by 10% Damage Amount (Max 3 stacks)." That the stacks last the whole battle is
  // Unconfirmed (owner couldn't check; in-game test armor-stack-readings): a stack count on the Buffs tab, off for 0
  'equip-160': { effects: [buff('dmg', 'Increase damage by 10% each time the wearer is hit (max 3 stacks)', '10%', 'ALL', { maxStacks: 3, defaultStacks: 1, hint: 'Times hit' })] },
  // Brainwave-Blocking Helmet: "When you Draw by an ability, +40% Fixed Shield (5 times per turn)."
  'equip-166': { notCounted: SHIELD },
  // Incomplete Carapace: "At the end of the turn, if you have 5 or more Cards in hand, +140% Fixed Shield."
  'equip-167': { notCounted: SHIELD },

  // ---------------------------------------------------------------- armor: Burning Life, Cthulu Run Monster
  // Phytotype Synthetic: "When Shield is gained, increase Damage Amount of the next 1 Attack Card activated by 20% for 1 turn (2 times
  // per turn)." Read as two separate Attack Cards, 20% each: set on the play, 0 or 1 (Unconfirmed: both on one card for 40% is the
  // other reading; in-game test armor-stack-readings)
  'equip-172': { effects: [buff('dmg', 'Increase Damage Amount of the next Attack Card activated by 20% when Shield is gained', '20%', 'Attack', { counter: 'Phytotype Synthetic', maxStacks: 1 })] },
  // Vine Camouflage: "At the start of the turn, if Health is 30% or less, 1 Evade (2 times per battle)."
  'equip-176': { notCounted: 'Evade only' },
  // Moss Armor: "When an ally Attack Card was no activated for 1 turn and the turn ended, 100% Fixed Shield."
  'equip-178': { notCounted: SHIELD },
  // Victor's Laurel: "Increase Damage Amount of Counterattack by 40%."
  'equip-180': { notCounted: COUNTERATTACK },
  // Shield of Ashen Sacrifice: "If Damage is completely blocked, at the start of the next turn, create 1 Shield Blast."
  'equip-186': { notCounted: 'the Shield Blast card it creates' },
  // Robe of Oblivion: "When Shield is gained through an Exhaust card, increase Damage Amount by 20% for 1 turn (1 time per turn)."
  'equip-192': { effects: [buff('dmg', 'Increase Damage Amount by 20% for 1 turn when Shield is gained through an Exhaust card', '20%', 'ALL', { hint: 'Gained Shield from an Exhaust card' })] },
  // Vine Lord's Mask: "When Drawing an Exhaust card through an ally ability, 80% Fixed Shield (2 times per turn)."
  'equip-193': { notCounted: SHIELD },
  // Shining Lyre: "At the start of the turn, if an ally Exhaust card is in hand, 60% Fixed Shield."
  'equip-196': { notCounted: SHIELD },
  // Announcement of Catastrophe: "+12% Defense. Decrease the number of Break Recovery cards required by all Combatants by 1."
  'equip-200': { effects: [stat('def', '+12% Defense', 'DEF%', '12%')], notCounted: 'the Break Recovery cards' },
  // Bangle of Valor: "Increase Damage Amount of ally Arena cards by 20%. At the start of battle, create 1 Forgotten Sword". Arena
  // cards are seasonal cards the site doesn't have (owner: don't count for now)
  'equip-201': { notCounted: 'Arena cards are seasonal cards not on the site yet, and the Forgotten Sword card it creates' },

  // ---------------------------------------------------------------- armor: Theater of Illusions, Kaleidoscope
  // Cloak of the Heart: "When a card is Discarded through an ally ability, 1 Damage Reduction (1 time per turn)."
  'equip-203': { notCounted: 'Damage Reduction only' },
  // Mask of Emotions: "When attacked, 2 Resonance to the attacker (3 times per turn)."
  'equip-209': { notCounted: 'Resonance (an 80% Extra Attack when a card is Discarded)' },
  // Nightmare Hairpin: "When a single target Attack Card is used, increase Action Count of the targeted enemy by 1 (1 time per turn)."
  'equip-212': { notCounted: "the enemy's Action Count only" },
  // Incomprehensible Holy Object: "Each time a Quietus card is Discarded through an ability, 80% Fixed Shield (2 times per turn)."
  'equip-213': { notCounted: SHIELD },
  // Delicate Collarbone: "At the start of the turn, if an ally Persona Card is in hand, decrease Stress of allies by 2."
  'equip-214': { notCounted: 'Stress only' },
  // Crushed Angel Feather: "When ally Linked cards are used, increase Action Count of all enemies by 1 (1 time per turn)."
  'equip-217': { notCounted: "the enemies' Action Count only" },
  // Remnants of Succession: "When 2 Attack Cards are activated, 4 Scorched to all enemies (1 time per turn)."
  'equip-219': { notCounted: 'Scorched from equipment deals no damage here yet' },
  // Chitin Shield: "3 Counterattack. On Counterattack, Aftershock to the target (1 time per turn)."
  'equip-221': { notCounted: COUNTERATTACK },
  // Contaminated Cocoon Cape: "When attacked, apply 1 random effect(s) among Agony, Vulnerable, or Scorched to the attacker (3 times per turn)."
  'equip-222': { notCounted: 'a random debuff: switch Vulnerable on for the plays yourself' },
  // Contaminated Drone Lens: "At the start of the turn, if an ally Desire Card is in hand, decrease Stress of a random ally by 2."
  'equip-228': { notCounted: 'Stress only' },
  // Essence-Fueled Gauntlets: "When Shield is gained through an ability, +30% Critical Chance to Attack Cards for 1 turn until
  // activated (1 time per turn)." Until the next Attack Card is played: that card alone (owner), set on its play
  'equip-233': { effects: [buff('crit', '+30% Critical Chance to the next Attack Card when Shield is gained through an ability', '30%', 'Attack', { type: 'Crit Chance', counter: 'Essence-Fueled Gauntlets', maxStacks: 1 })] },
  // Pagna Mushroom: "When attacked, apply 1 random effect(s) among Vulnerable, Weaken, Agony, or Scorched to the attacker (2 times per turn)."
  'equip-235': { notCounted: 'a random debuff: switch Vulnerable on for the plays yourself' },

  // ---------------------------------------------------------------- armor: Celestial Bulwark (seasonal)
  // Crown of Corruption: "Decrease max HP by 10%. +10% Critical Chance to Justice Attack Cards of this unit."
  'equip-239': { effects: [buff('crit', '+10% Critical Chance to Justice Attack Cards of this unit', '10%', 'Justice & Attack', { type: 'Crit Chance' })], notCounted: 'the Max HP' },
  // Imitated Hand: "At the start of battle, gain 2 Damage Reduction. When attacked, Fixed Heal 80% (1 time per turn)."
  'equip-243': { notCounted: 'Damage Reduction and healing only' },
  // Shield of Repentance: "At the end of the turn, 2 Vulnerable to all enemies that have Shield (1 time per battle)."
  'equip-247': { notCounted: 'the Vulnerable: switch Vulnerable on for the plays yourself' },
  // White Coat: "At the start of the turn, if an ally is in a harmful effect state, 50% Fixed Shield."
  'equip-248': { notCounted: SHIELD },
  // Condensed Fuel: "At the end of the turn, Fixed Heal 100% (3 times per battle)."
  'equip-251': { notCounted: HEALING },
}
