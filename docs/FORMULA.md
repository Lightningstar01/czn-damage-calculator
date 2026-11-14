# CZN damage formula

The rules the calculator uses. Each is marked **Sourced** (a published guide, see Sources), **User** (the owner's own knowledge or
testing, which takes precedence) or **Unconfirmed** (an assumption, usually a toggle on the Settings tab).
Open questions are in-game tests in [in-game-tests.md](in-game-tests.md). One character's readings are in `docs/characters/<slug>.md`.

## The formula

```
Final ATK = Stats-screen Attack x (1 + partner/equipment ATK%) + flat equipment ATK       (DEF the same)

Card %    = (base % + Card +) x (1 + 2% x upgrade levels) x (1 + Card %) + Base %         (the % the game shows for the card itself)

Card mult = (Card % x Mult + Additive buffs incl. Morale)
            x Weakness DMG     if the card applies weakness, or a Weakness Attack buff matches it
            x (1 + 50%)        if Vulnerable is on for the play
            x (1 - Enemy damage reduction)
            x (1 - 25%)        if the Weakness debuff is on for the play
            x (1 + Ravaged)    if Target Ravaged is on for the play (size Unconfirmed, default 0)

Mult      = 1 + the sum of the multiplicative buffs (Summed, default), or the product of (1 + each) (Chained): Settings

Damage    = Card mult x Stat x 0.35 x (1 + card element's DMG%) x (1 + Extra or DoT DMG%, by card kind) x Enemy DEF mult x (1 + Final buffs)
Stat      = Final ATK; DEF cards: Final ATK x 0.3 + Final DEF x 2.1

Fixed     = Card % x Final ATK x 0.35, and no other factor (Unconfirmed); "of Shield owned" cards: Card % x the play's Shield owned
Fixed DoT = one hit per stack: Card % x Final ATK x 0.35 x (1 + card element's DMG%) x (1 + DoT DMG%) x Enemy DEF mult, can crit (measured on Agony)

Crit hit  = Damage x Crit DMG                                 (Crit DMG is the total multiplier; Crit Chance capped at 100%)
Expected  = Damage x (1 + Crit Chance x (Crit DMG - 1))       per hit; each hit crits separately
```

All constants are on the Settings tab, none is written into the engine. Base stats of a new build are the game's: 3% Crit Chance,
125% Crit DMG, 125% Weakness DMG (User, 2026-10-31).

## Stats

**Sourced (Prydwen)**, the game's own calculation:

```
Final ATK = ((Base ATK + Partner ATK) x (1 + Memory ATK% + Potential ATK%) + Fragment flat + Affection flat)
            x (1 + Partner ATK% + Equipment ATK%) + Equipment flat
```

DEF and HP have the same structure. Equipment % adds to Partner %.

**User:** we don't rebuild this from parts. The owner copies Attack, Defense and the rest from the in-game Detailed Stats screen for each
build. That screen includes the partner's base stats and the fragments, but not partner effects (+16% Attack, +5% Weakness DMG) or
equipment, which apply only in battle (slot 1 always gives flat ATK; any piece may give ATK%). Those are added on top, as above.

- **Stats screen only, never the battle numbers (User, 2026-11-11):** the Attack shown in battle already has the partner's ATK% and the
  equipment in it (1033 x 1.16 + 74 = 1272), so typing it would count them twice, and the "If Attack is 500 or higher" effects read the
  stats-screen number. The site has no "read in battle" switch.
- **Equipment flat stats (User, 2026-11-11):** a piece's rarity sets the flat stat of its slot, whatever the piece: weapon Attack Rare 74,
  Legendary 82, Mythic 90; armor Defense 28 / 31 / 34; trinket Health 75 / 83 / 91 (Setup > Equipment, `build.equipment`, values in
  `src/data/equipment.ts`). Picking a piece by name takes its rarity. Flat Defense is added like flat Attack (after DEF%); Health is shown on
  Results and read by no damage yet. "If Attack / Defense / Health is X or higher" thresholds still read the stats screen, without equipment
  (**Unconfirmed**, in-game test `threshold-with-equipment`; the owner expects the in-battle stats, so this changes once tested). The top
  rarity is Mythic in-game (Prydwen: Unique). Source: Prydwen's equipment page, where every weapon of a rarity has the
  same five values (Rare 25/41/56/67/74, Legendary 28/45/62/74/82, Mythic 31/50/68/81/90); the owner chose the top one for each. What the
  five steps are is **Unconfirmed** (in-game test weapon-flat-attack). Armor (Rare 9/15/21/24/28, Legendary 10/17/23/27/31, Mythic 11/19/25/30/34) and
  trinkets (20/37/54/66/75, 22/41/60/73/83, 24/45/66/80/91) work the same way. Prydwen gives 3 weapons out of 82 the Mythic values at a lower rarity
  (Mountain of Corpses, Legendary; Torch of Wrath and Overcurrent Shock Unit, Rare; all from the Shop): read as its mistakes, **Unconfirmed**
  (`scripts/import_equipment.py` prints them as CHECK).
- **Equipment effects (User, 2026-11-13; read batch by batch into `src/data/equipmentEffects.ts`):**
  - Prydwen's "+" is not reliable on equipment: Lepidola's Whip reads "+25% Damage" there and is multiplicative in-game, like Violet Butterfly's
    Whip (User). So each piece's type is confirmed with the owner. Confirmed: both Whips, Formica's spears and Twin Swords multiplicative; Mutated Claws
    and Ritual Dagger additive. Kept as Prydwen words them, **Unconfirmed** (in-game test `equipment-plus-wording`): Executioner's Edge, Mutated Order,
    Dark Grip's Claws (all multiplicative), Command: #108 (additive). Confirmed in batch 2 (User): Dream of the Devoured, Void of the Devourer
    and Foggy Crystal Ball ("40% Damage", no verb) multiplicative.
  - A bonus for one card is a per-play counter, 0 or 1, set on that play on the Cards tab (User): "next card used" after an Exhaust (Dream of
    the Devoured, Void of the Devourer: counter "Follows an Exhaust") and "(1 per battle)" (Command: #108: one Attack Card, once per battle).
  - "Extra Attack damage +35%" (Second Method) is an additive buff on Extra Attack hits, not the Extra Damage stat (User).
  - "+X% Critical Chance of Attack Cards with cost 0" (RFS-17) adds to the Critical Chance of those cards only.
  - No damage for us (User): Weaken on the enemy (Flashbang: it lowers the damage the enemy deals), Tenacity Damage (Big Game Hunter), Stress.
    Vulnerable a piece applies (Sneering Dagger) isn't added: Vulnerable is the play's own switch.
  - From the third batch on (User, 2026-11-13: "maybe we can just assume everything else is correct"), Prydwen's "+" wording is taken as it
    stands, the Whip being its one known mistake; the owner looked over batch 3's types ("I think these are correct"). **Unconfirmed** piece by
    piece.
  - "(1 per turn)" on a damage bonus (Sun-Setting Bow, Mountain of Corpses) is one card per turn (User): a per-play counter, 0 or 1, like the
    "next Attack Card" of Cavalry of Lightning.
  - "+8% ally Attack" (Tentacles of Chaos) reaches all three combatants, the wearer included (User); a teammate's copy needs their linked build.
  - "If you have 6 or more cards in hand" (Sword Reflected in the Lake) and "If at max HP" (the Flowers of Life) are switches (User).
  - "(2 per turn)" / "(Max 2 times per turn)" on a "for 1 turn" bonus (Trumpet of Revelation, W-52 Dopamine Injector) is up to 2 stacks,
    starting at 0 (User): a per-play counter named after the piece, like Ritual Dagger's (a switch's stacks start at 1).
  - "That card +50% Damage Amount" (Replica Core) is for the one Attack Card drawn by an ability: a per-play counter, 0 or 1.
  - Veiled Thorn's 50% is the wearer's damage only (User); Harp of Conflict's 15% says "of allies", so it reaches the team.
  - Punishment, formerly Retribution (User): "When Shield is gained, take Fixed Damage equal to 200% of Attack and reduce by 1 stack". Fixed
    damage, so not counted (Flame of Purification, Singing Sword's second half). Mark a piece applies (Torch of Wrath) isn't added: Mark is the
    play's own number. A card a piece creates (Arm of Lost Valor's Rocket Punch) isn't counted: neutral cards aren't in yet.
  - "Exhaust cards" (Brilliant Eternal Flame?) are cards with the Exhaust keyword, of any type. An "Exhaust 2" card Exhausts on its second
    play only (User), so it gets the bonus on the play whose "Second play (it Exhausts)" counter is set, not on its first.
  - Corrupted Gauntlet's Critical Chance is the combatant's, for everything (User): 2% per stack, a per-play counter from 0 to 5. Order's Baton
    follows the Trumpet rule (0 to 2).
  - Key of Sleep: Prydwen has only its second half. In-game (User, 2026-11-13) it starts "+40% Damage Amount to Attack Cards" and ends "When the
    target count of the Attack Card is 2 or more, -10% Damage Amount for each target (max -30%)". The owner's reading, **Unconfirmed** (in-game
    test `key-of-sleep-targets`): +40% on one target, +20% on 2, +10% on 3 or more. The play's counter holds the targets hit when there are 2 or
    more (0 for a single target; 1 would wrongly take 10% off).
  - "(cannot stack)" (Runic Hammer: "+20% Critical Damage to ally Unique Attack Cards"): the wearer and the allies get it, and it is +20% at
    most however many combatants wear one (User, 2026-11-13). The engine counts an effect with `noStack` once per team: the first copy that is
    switched on (the build's own, then the teammates' in slot order); the others show "Cannot stack" on the Buffs tab.
  - "Bind Attack Cards" (Fragment of Condensed Radiance) are Attack Cards with the Bind keyword; only Chizuru has one (User). "On Weakness Attack
    through an Attack Card" (Needle of the Severed Overseer) counts on Attack Card plays that hit a Weakness. Scorched a piece applies (The
    Exsanguine) is not counted, like Agony.
  - Trinkets (User, 2026-11-13): healing, Shield, Evade and Max HP % are not counted (no damage reads Health yet). "+X% Defense" is counted
    (DEF%, which Defense-based cards read), as a switch with its battle as the hint (Proof of Initiation, Order's Emblem: Chaos Order battles).
  - A bonus given at the start of a battle, or once something has happened, with no duration lasts the whole battle (User): a switch (Madman's
    Masterpiece in an Elite Battle; The Famished One's Belly once a card is Exhausted, "(1 per battle)").
  - Flower of Dead Souls: in-game "Increase Damage Amount of the second Attack Card onward each turn by 20%" (User; Prydwen's text is garbled).
    Automatic (`afterFirst`): the wearer's first Attack Card play of the attack list gets nothing, every later one the 20%. The attack list has no
    turn breaks, so it counts as one turn (User, 2026-11-13); a list spanning several turns over-counts it by one play per extra turn.
  - Amorphous Cube ("At the start of battle, +25% Damage") is on for the whole battle (User: strong for a Rare, used over Legendaries).
    Quantum Collector's 20% is the wearer's damage, set off by any ally's Upgrade card (User). Not counted (User): Time Regulator (nothing in
    battle), Water Drops of the Goddess (Storage), and Heart of the Jewel ("X is applied as X+1": cards with an X Cost, such as Rossweisse's
    Unbound Flicker Blade; the play's Cost is typed, so add the 1 there).
  - "On odd turns" / "On even turns" (Verdant Day, Verdant Night) are switches turned on and off by hand (User): the attack list has no turn
    numbers. Impair limits the Shield the enemy gains, so it is no damage for us (User); Damage Reduction a piece gives its wearer isn't either.
  - Rage Potion ("When 4 Attack Cards are activated, increase Damage Amount of the next Attack Card activated by 40%") is automatic
    (`everyNth: 5`): the wearer's 5th, 10th... Attack Card play of the attack list gets the 40%. That the count restarts after each bonus is the
    owner's guess ("I think it's every 5th card"), and whether it carries over between turns is unknown: **Unconfirmed**, in-game test
    `rage-potion-count`.
  - Combat Drum's "next ally card activated" is the next card any of the three combatants plays (User): a per-play counter, 0 or 1, that a
    linked teammate's copy brings too. Summoned Lump of Light's "third Attack Card created" is the third Attack Card created each turn, that
    card alone (User): turned on by hand on its play, since the calculator can't know which card was created third. Luminescent Shroom (Spore
    Propagation, a buff from one seasonal card) isn't modeled (User). Cost changes, AP and cards a piece creates aren't counted.
  - A stat that depends on the play is a buff, not a Stat effect (User, 2026-11-13: "the engine needs to be able to support buffs like this
    that add stats conditionally"): buff types `Crit Chance`, `Crit DMG`, `Weakness DMG` and `ATK %` add to that stat on the plays they match,
    with stacks set per play if they have a `counter`. `ATK %` joins the Attack % of Final ATK: screen x (1 + other % + its %) + flat (that it
    adds with the other Attack % rather than multiplying is **Unconfirmed**, in-game test `final-command-attack`). The Final Command: +3%
    Attack per stack to allies, 0 to 6, set per play (User).
  - Raider's Scanning Gear ("+30% Critical Damage to the first Attack Card activated") is automatic (`firstOnly`): only the wearer's first
    Attack Card play of the attack list, which is one turn (User). An Eye Plucked from a Mural: 20% per ally Persona Card in hand, one per
    combatant, so 0 to 3, set per play (User). Invader Observation Logs' Critical Chance is the wearer's for everything, Extra Attacks
    included, per enemy present, 1 to 5 (User). Overloaded Power Engine: "Bind card stacked" is two of the same Bind card in hand combining
    (User); the number is set per play, 0 to 10, until the engine knows it. Split Design Core's 8% lasts the whole battle each time, so 1 to
    3 stacks by the turn simulated (User). Final Entry's damage is Fixed Damage in the game's text (User; Prydwen says "150% Damage"): not
    counted. Hymn-Singing Lips' Resonance ("On card Discard, 80% Extra Attack, then decrease Resonance by 1", User) is damage of its own
    and isn't counted until extra damage sources have a model.
  - Armor (User, 2026-11-13): Shield, healing, Max HP, Immunity, Damage Reduction and damage taken (Star-Lit Cloak: "Decrease Damage Taken by
    10%" in the game's text) aren't counted; Defense % and Critical Chance are. Counterattack (damage when the wearer is hit; Wild Fur Cloak,
    Assault Gauntlets, Immortal Scale) isn't counted: for the engine later. Resolute Gauntlets' +20% lasts the whole battle: a switch per
    battle. Mask of Flames ("Increase damage dealt to Vulnerable targets by 35%") is automatic (`vsVulnerable`): it counts on the plays
    with Vulnerable switched on, and has no stacks of its own to keep in step.
  - Armor, the rest (User, 2026-11-13): Essence-Fueled Gauntlets' +30% Critical Chance "until activated" is the next Attack Card alone, set
    on its play. Bangle of Valor's Arena cards are seasonal cards the site doesn't have: not counted for now. **Unconfirmed** (the owner
    couldn't check; in-game test `armor-stack-readings`): Wings of Freedom's stacks ("When hit ... Max 3 stacks") are taken to last the whole
    battle, as a stack count on the Buffs tab (1 to 3, off for 0); Phytotype Synthetic's "next 1 Attack Card ... (2 times per turn)" is taken
    as two separate Attack Cards with 20% each (0 or 1 on a play), not 40% on one.
  - "If use more than 5 AP" (Rune Lance) is a switch; the owner thinks it then lasts the rest of the battle (**Unconfirmed**, in-game test
    `equipment-batch-1-readings`).
  - Conditional and "for 1 turn" buffs ("Against enemies with HP below 50%", "When drawing a Status Ailment or Curse card ... for 1 turn") are one
    switch with a hint, on while the piece is picked and counted on every hit (snapshot; User). Mutated Claws counts once however many such cards
    are drawn (User: "I believe"; **Unconfirmed**, in-game test `equipment-batch-1-readings`).
  - Plain "Damage" / "Damage Amount" on a piece applies to ALL: Skill cards that deal damage, Extra Attacks and triggered hits too; Fixed damage
    and Agony get nothing, as with other damage buffs (User).
  - "Attack on all enemies" / "All-Attack Damage" (Dark Grip's Claws, Formica's Perfect Spear) is any card that targets all enemies, of any card
    type (`AoE`; User).
  - "Per enemy" (Formica's spears) counts the enemies alive in the fight: stacks on the switch, 1 to start, 5 at most (User).
  - "When an enemy is defeated ... (Max 2 times)" (Ritual Dagger) starts at 0 (User): a per-play counter, "Enemies defeated", as the enemies
    fall during the attack list.
  - "5% chance to +1 hit" (The Destruction of Erysichthon) is an expected value (User): 5% of one more hit of each Attack Card its wearer plays,
    shown under the play. That the hit is one more of the card's own hits, once per card whatever its hits, is **Unconfirmed** (in-game test
    `equipment-batch-1-readings`). A piece's added hits have no switch: they count while it's picked.
  - A stat a piece lowers (Dull Bone Blade: -5% Critical Chance) is subtracted; a hit's Critical Chance stops at 0.
  - Not counted for now (User): Fixed Damage a piece deals (Nature's Hostility; they wait for the extra-damage model) and Agony a piece applies
    (Bug Killer, Abyssal Bug Tooth; until the DoT engine is redone). Their text shows the reason.
- **Own stat boosts and buffs are per build (User, 2026-11-11):** each build has its own lists (`build.boosts`, `build.buffs`); Duplicate
  copies them, and a change in one build never reaches another.

- Stat nodes of the Potential tree are on the stats screen, so they're reference text (User).
- Node 7's elemental damage ("+5% Void Damage when Defense is 300 or higher"...) is on the stats screen too, in that element's Damage, so it is
  never added again (User, 2026-11-08). Seen at 15.0% (5% + the full 10% more) on Adelheid (Defense 417), Rossweisse (Attack 925), Tenebria (1092)
  and Sereniel; characters with 7 locked show none of it.
- Partner base stats are on the stats screen and never added again.
- Memory fragment set stats are on the stats screen (`onStatsScreen`): listed for reference, never added. Set buffs are added like partner buffs.
- Elemental DMG% is the stat of the card's element. Boosts (Elemental DMG%) count for the character's own element (**Unconfirmed**, in-game
  test `card-other-element`; no card has an element other than its character's yet).
- Mechanic DMG% (**Sourced**; fragment substats): Extra DMG on hits of kind Extra Attack, triggered ones included (Selena's Mark, Renoa's
  discard hits, Nia's; User), DoT DMG on DoT hits.

## Buff types

How a buff's text decides where it goes:

| Text | Type | Effect |
| --- | --- | --- |
| "+X% Damage Amount" | Additive | added to the card mult, after Mult |
| "by X%", no "+" | Multiplicative | in Mult |
| "+X%" from a Potential node or Ego, part of the card's shown % | Card + | added to the base %, before the upgrade (cards with an upgrade; on others, such as Ego skills, it is Base %) |
| "Double all effects", "for each X" of the card's own % | Card % | x (1 + the sum), with the upgrade |
| "+X% base Damage Amount" | Base % | added to the shown % after the upgrade; Mult raises it too (**Unconfirmed**) |
| "Damage Amount equal to X% of Shield owned" | Flat | X% x the play's number, as damage: Mult and the other multipliers raise it, the stat and constant don't (**Unconfirmed**) |
| "final Damage Amount" | Final | its own multiplier, x (1 + the sum), after everything else |
| Crit Chance / Crit DMG on some cards | Crit Chance / Crit DMG | added to those cards' crit stats, before the cap |
| Weakness Attack | Weakness Attack | Weakness DMG applies to matching cards, on all hits |
| "+X% Weakness Damage Amount taken" (Hilde's Matrix Overlay) | Weakness DMG | added to the Weakness DMG stat on matching plays that hit a Weakness (**Unconfirmed**: in-game test hilde-readings) |

- **Ego skill bonuses (owner's screenshots, 2026-11-04):** a Manifest Ego level's "+X% Damage Amount to <Ego skill>" shows in the Ego skill's
  own number (Beryl E4 400%, Haru E3 800%, Lucas E4 300%, Owen E4 300%, Rei E4 400%, Selena E4 350%), so it is part of the card %: Base %
  (Card + counts only on cards with an upgrade, and an Ego skill has none), which "by X%" buffs raise. How the game combines it is **Unconfirmed**
  (in-game test `ego-skill-bonus`). Anika, Chizuru, Khalipe, Nine, Renoa, Rin, Rossweisse and Yuki follow by the same wording (the owner's
  screenshots are below those levels).
- **The "+" rule (User):** after a localization update, "+" means additive and no "+" means multiplicative. No public source; **Unconfirmed**
  in a test, and also that it covers partner passives. Prydwen says English can't tell them apart without testing.
- **Summed vs Chained (measured by the owner, 2026-11-01; in-game test `multiplicative-summed-or-chained`):** multiplicative buffs add up. Tressa's Shadow Dagger with four "by X%" buffs shows 164%; chained it would show 173%. UltimateGacha citing Reddit tests agrees.
  Settings toggle, Summed by default. Chained treats a buff with stacks as one source (3 stacks of 10% = x1.3, not x1.331): **Unconfirmed**.
- **Morale (Sourced, Game8 + User):** +20% per stack in the additive group, max 20 stacks. UltimateGacha calls it a late multiplier; that
  conflicts with Game8 and the owner and was rejected.
- **Card + (User, 2026-10-30):** measured on Chizuru's Shadow of the Moon, whose base isn't 100%: 110% = (80% + 15%) x 1.16. Multiplying
  (80% x 1.16 x 1.15 = 107%) doesn't fit. Only cards with an upgrade (entered at base %). **Unconfirmed** on Rei's 7 on Predator's Blade and
  Cassius's 5-1 on Wild Card, both locked for the owner.
- **Thresholds:** in game every threshold is "X or higher" (Prydwen often "greater than"), so buffs count exactly at X
  (`thresholdMin`, `thresholdBonus` with `orEqual`). `thresholdStat` picks the stats-screen stat read (Attack by default; Defense, Health,
  Critical Chance, Critical Damage, Extra Damage, Damage over Time). A threshold reads the effect owner's stats ("If Mei Lin's Attack is 500 or higher"), not the receiver's
  (User, 2026-10-31); a teammate without a linked build has no stats, so their thresholds aren't met. Battle-only Crit Chance isn't read
  (**Unconfirmed**, Renoa). How the game rounds "for every X above Y" is an in-game test.

**"Applies to"** (case-insensitive): `ALL`, an exact card name, a tag, the card's type (Attack, Skill, Upgrade), element, cost (`1-cost`,
`2+ cost`; Ego skills have no AP cost), kind (`DoT`, `Extra Attack`), `Defense-Based`, `N+ hits` (the play's hit count), joined by `A & B` (all)
or `A/B` (any). Who a card hits: `Single-target`, `AoE` (all enemies), `Random-target` (random enemies), read from the card text's first line
with "Damage" in it ("to all enemies", "random enemy/enemies"; anything else is single-target; a card's `targets` overrides it). User, 2026-11-08
(Hugo's Commence the Hunt is set off by single-target Attack Cards, "reviewed from card text"); whether a card without either phrase always
hits one target is **Unconfirmed** (in-game test hugo-single-target). Hits from effects rather than cards (`notACard`) don't match card-type words, so what names Attack, Skill or Upgrade skips them; `ALL`, their name or their tags still match.

## Weakness, Vulnerable, Ravaged

- **Weakness DMG (User):** the stats-screen stat is the elemental advantage, a total multiplier, base 125%. There's no other x1.25 on top.
- **Hitting a Weakness (User, 2026-11-09):** a play hits a Weakness when its card applies Weakness (the Weakness Attack tag), a Weakness Attack buff
  matches it, or the fight's enemy is weak to the card's element (Setup > Fight, "Weak to": one element or all five). The play's "Hits a Weakness"
  switch (Cards tab) starts at that and can be changed for special cases. A card's "Weakness Attack: ..." line (Luke's Silver Shot "Weakness Attack:
  Increase Damage Amount by 100%") is a buff that counts only on plays that hit a Weakness.
- **Weakness Attack on non-active hits:** Prydwen says non-active damage (extra-attack bolts) gets no elemental bonus. The owner ruled that
  Selena's Passion Weakness makes her Coordinated Attacks Weakness Attacks (2026-10-28), which is what's modeled there. As a general rule, **Unconfirmed**.
- **Vulnerable x1.5, Weakness debuff x0.75 (Sourced).** In the game a stack is used per hit (Vulnerable: Prydwen and owner; Weakness: **Unconfirmed**).
  The calculator has switches per play, counting on all its hits, instead of tracking stacks. A hit the play sets off skips the Weakness debuff, unless it's one more hit of
  the played card (Owen's Wind Charge III, Amir's Full Metal Hurricane II) (**Unconfirmed**, in-game test `weakness-debuff-triggered-hits`).
- **Decreased Fortitude (User, 2026-11-01):** +20% Damage taken per Fortitude decreased on the target (Owen's Break Armor I: 4 = +80%). Added like a "+" buff, on the plays after it (**Unconfirmed**; in-game test owen-readings).
- **Ravaged (User):** Ravaged enemies take more damage; the size is **Unconfirmed** (Settings, default 0). Target Ravaged is switched per play on the
  Cards tab; On Ravage cards (`targetRavaged` on the card) start on, and the play can override either way (User, 2026-10-31). "Ravaged only" buffs count
  only with it on, and a hit the play sets off is on the same Ravaged target, or not when the play's switch is off (**Unconfirmed**, in-game test
  `ravaged-triggered-hits`). Ember stacks with it off do nothing, and the Results tab says so.
- **Card % in hand / on target (User):** Results shows both per hit. In hand: Card % x Mult + Add, without the buffs that need a Ravaged target
  (Ember, Marianne's and E4's vs Ravaged) or are marked `onTarget` (Tressa's E2, measured: 164% in hand, 184% on a target in Agony; her other Agony bonuses, **Unconfirmed**). Other characters' target buffs still count in hand until they're read (in-game test `target-buffs-in-hand`). On target: the full card mult.

## Crit and Fixed

- **Crit DMG is the total multiplier (User + in-game data):** crit = non-crit x Crit DMG; Prydwen's "(1 + Crit DMG)" is wrong. No toggle.
- Crit cap 100%: **Unconfirmed** (Settings).
- **Fixed damage ignores every multiplier (Sourced)**, with rare exceptions stated on the card. Fixed % x Final ATK x 0.35: the owner thinks it's ATK-based (2026-10-28), **Unconfirmed**.
  Whether it crits: **Unconfirmed**, assumed not. Upgrades raising it: **Unconfirmed**, Settings toggle, default off (Orlea's Annoying I in hand shows Fixed 40% unraised
  and its Heal raised; text token `{F40%}`; Maribell's Shelter Strike 150% and Oh... I see. IV 50% are unraised at level 6 too). With the toggle on, an Ego's added Fixed % stays unraised: (100% x upgrade) + 50% for Shelter Strike, in the damage and the card text alike (**Unconfirmed**).
- **Fixed DoT (measured by the owner, 2026-11-01, Tressa's Agony; in-game test `agony-tick`):** "50% Fixed DoT x Agony count" is one hit per stack, each 50% x Final ATK x 0.35 x (1 + element's DMG%) x (1 + DoT DMG%) x Enemy DEF mult.
  Each hit can crit, so Crit DMG buffs on DoT count (Sanguine Thorn). Attack, the DoT stat and Enemy DEF were measured; Vulnerable doesn't raise it, and card upgrades don't either (the keyword shows 50% at Unique 6). The stacks halve, rounding down (the guide found, LDShop, says one stack: the game disagrees).
  The hits fit at Enemy DEF about 0.374, on the enemy of Mei Lin's tests, which back-solved to 0.3733 (2026-10-25, see the log). **Unconfirmed**, in-game test `agony-limits`: the element factor (it fits only with it, at that DEF), "damage dealt" buffs (not applied) and Enemy DR (not applied). A tick is a play with the count typed in; the owner adds and halves the count.
  A buff that names DoT effects directly can reach it: Olga's Shard Erosion ("Increase Damage Amount of Olga's DoT effects by 6%") multiplies her Agony hits (User, 2026-11-09;
  **Unconfirmed**, in-game test `olga-readings`; the buff's `fixedDot` flag). Other multiplicative buffs still don't.
- **Fixed damage "of Shield owned" (User, 2026-11-01; Maribell):** % x the Shield owned set on the play, with no ATK and no 0.35. Shield isn't computed: read it in game.
- **"Damage Amount equal to X% of Shield owned" without the word Fixed (User, 2026-11-01; **Unconfirmed**, in-game test `maribell-readings`):** added under the multipliers (buff type `Flat`), so Vulnerable, element and crit raise it, whatever the stat is. On plain Fixed damage, nothing raises it; on a Fixed DoT, it goes under the DoT's factors like the rest of the hit (**Unconfirmed**, no such buff yet).

## Card upgrades

**Sourced + User (2026-10-25):** Card % = base % x (1 + 2% x level) (Settings). Levels 0-10 per build.

**Rounded to a whole % before buffs (User, 2026-11-01; **Unconfirmed**, in-game test `card-pct-rounding`; Settings, on by default):** the owner chose to apply this to every character from one card's readings: Tressa's Shadow Dagger, 80% x 1.12 = 89.6%, shown as 90%, reads 135%, 164% and 184% with buffs, which fit 90% and not 89.6%. It applies only to cards with an upgrade, and `Base %` buffs are added after it.
Three parts of it follow from "as the game shows it" and aren't read yet (**Unconfirmed**, same test): an exact .5 rounds up; a per-Cost or per-count card rounds its % for one unit, then multiplies (Arpeggio's 15% x 1.04 shows 16%, so 6 Rhythms are 96%, not 94%); a Fixed % raised by the `potentialFixed` setting rounds the same way, as its card text does.

- **Basic Card Upgrade** raises Basic cards. **Signature Card Upgrade** (Prydwen: "Unique Card Upgrade") raises the character's other cards: the non-basic
  starting card, the 4 others, their epiphanies and what they generate, whatever the Unique tag says. Not Ego skills. Common/Neutral Card Upgrade isn't modeled.
- Manifest Ego levels saying "+3 levels" each add 3, read from the import (E5 for most, E3 too for some; max 16 = +32%; Mika's Water Arrow 132% at Basic 10, E6).
- Exception (User, 2026-10-27): Mei Lin's Jewel V shows 300% while Spire and Sovereignty show their upgrade. The owner thinks damage from a condition instead of an Attack card
  isn't raised. It's marked `upgrade: null`, as are hits from effects rather than cards that a review found unraised (most Extra Attacks, `effectHits` in
  src/data/helpers.ts). Other characters' non-basic starting cards stay Signature until checked.
- A Potential node's effect is off while the node is off on Setup > Potentials (`node` on the effect; missing switch = on). A node can also change card text, tags and numbers
  (`{P3-1:...}`, `nodeTags`, `nodeCard`). Stat nodes stay on the stats screen.

## Manifest Ego

Can't be switched off in game, so each build has a level, E0-E6 (User, 2026-10-25). Effects with `egoLevel` count from that level (`egoBelow`: until that level). A character's
`ego` additions replace Prydwen's wording with the game's (Prydwen's can be outdated); this changes the text only, never the +3 levels.

## Cards

Every character's cards (base + every epiphany) are imported from Prydwen, which the owner confirmed has the right "+" wording (2026-10-25); OffBanner is outdated and Game8 adds
"+" everywhere. `scripts/import_prydwen.py` writes `src/data/prydwen/<slug>.json`; corrections and buffs go in `src/data/characters/<slug>.ts`. A character with such a file has been
compared with the game (`verified`: date, game version); the rest show "Not reviewed".

Reading of the card text (corrections go in the additions file):

- Damage % and hits from the first "N% Damage", "N% x H Damage" or "N% Damage x H"; for "100% (200%) Damage" the first %.
- "Defense-based" = DEF scaling, "Fixed" = Fixed; Piercing only ignores enemy shields (User; shields aren't modeled, so normal damage).
- Basic = a starting card with no epiphanies (User; tags Basic and Basic Attack or Basic Skill). One Basic Skill per character, Maribell two (User).
- The Weakness Attack tag means Weakness DMG applies (User).
- **Mark** is the same keyword for every character (User, 2026-11-09): "When an Attack Card is activated, inflict 100% Extra Attack, and decrease
  Mark by 1". It's a trigger on every Attack Card play (anyone's) while the play's Mark counter is above 0: the inflicter's own 100% Extra Attack,
  computed with their build, not raised by card upgrades. Each inflicter has their own counter (Mark (Luke), Mark (Renoa)...), as each one's Mark
  is their own. `markKeyword()` in src/data/helpers.ts builds it, so a new character with Mark needs no question.
- Ego skills are type Skill with tag "Ego Skill" and no AP cost, so damaging ones aren't Attack cards (User). X-cost and unplayable cards have no cost and a tag. Status cards are type Skill with tag "Status".

A card's buffs count while it's in the deck, on by default, with a switch per build. Extra hits are set per play; the hit count also drives `N+ hits`.

## Partners and memory fragment sets

- **Class-limited effects (User):** any partner goes with any character, but class-limited effects only work when the classes match. Base stats and the Ego skill always apply.
- **Marianne (User):** Striker; 144 HP, 5 DEF, 155 ATK. Class-limited: +16% Attack, +5% Weakness DMG, "15% increased damage to Ravaged enemies" (multiplicative under the "+" rule: **Unconfirmed**),
  and Basic Attack cards always count as Weakness Attacks.
- **Sets (User):** 6 slots; a set is either 2-piece or 4-piece, never both bonuses, so three 2-piece sets or one 4-piece and one 2-piece. A set picked twice counts once. Texts from Prydwen.
- Triggered set buffs default to on at max stacks; conditional ones the calculator can't check stay on. Switch them per build (User).
- Prelude to a Hero ("+15% ... max 15%, max 2 stacks") and Sanguine Thorn ("+25% ... max 25%, max 2 stacks") give 15% / 25% in total: the "stacks" are turns of duration (User).

## Teams

- **Snapshot (User, 2026-10-26):** every switched-on buff counts on every hit of every play, including the card that applies it. Debuffs on the enemy ("damage taken") are additive.
- A build has up to 2 teammates. Effects have a target: `self` (default), `allies` or `enemy`. The main character gets all of theirs; a teammate gives only allies and enemy effects (character and
  Ego, partner incl. its Ego skill, sets, picked cards). Their equipment goes in My stat boosts / My buffs with a From label.
- **Attack list (per build):** per play, hits, Vulnerable, Weakness debuff, Target Ravaged and the stacks of per-play buffs (`counter`, capped at max stacks), off / 0 by default.
- **Team damage (User, 2026-10-28):** a slot links a saved build of that character (missing = their active build; None = buffs only), taking its Ego, partner and sets. Their plays are computed as their
  own build would, with this character and the other slot as their team; switches for others' effects come from this build. An unlinked teammate's play deals no damage but still sets off triggers.
- Triggers belong to whoever owns the effect and use that owner's build. Results shows each character's expected damage and share.

## Fights

The enemy lives in shared fights, not in builds (User, 2026-10-31), so builds compare against the same enemy and teammates' hits land on it too. Single target for now (`enemies[0]`); several targets later.

**Enemy DEF multiplier:** no known formula; an input to back-solve from a real hit. Idea: 100 / enemy DEF (**Unconfirmed**; see the log). Damage reduction: boss and elite types (Sourced); entered by hand.

## Not modeled yet

- DoT damage other than Tressa's Agony: only when a character uses it (owner, 2026-10-31). Other characters' Agony (Lucas) has no tick of its own yet.
- Partner Ego skill damage: out of scope, nobody uses it for damage (owner, 2026-10-27).
- Shields, stress, draw and AP effects: text only.
- Ego effects that deal damage with no card yet: Mei Lin E6, Orlea E6, Tenebria E2, Nine E6 (they wait for the extra-damage model).
- See CLAUDE.md's backlog for the planned extra-damage model, in-game rounding and what unreviewed characters' imports miss.

## Evidence log

Dated measurements behind the rules. In-game numbers are also tests in [in-game-tests.md](in-game-tests.md).

- **2026-10-20, Final ATK (User):** Mei Lin 1033 x 1.16 + 74 = 1272, her in-battle Attack.
- **2026-10-20, no extra x1.25 (User):** Strike 204% in hand, 290% on a Passion-weak target: 204.24% x 1.42 (137% screen + 5% Marianne) = 290.0%. A Reddit post's 270%, which seemed to need one, is unexplained; its inputs may have been incomplete. The "Extra weakness factor" setting stays at 0% as a test hook.
- **2026-10-20, Crit DMG (Reddit post, community sheet):** Mei Lin 188.6%: 572 non-crit, 1078 crit; 572 x 1.886 = 1079.
- **2026-10-20, community sheet (CZNRedditSheet.xlsx):** its Final ATK leaves Partner ATK out of the % layer (an older formula; ours matches the in-game 1121). Its card mult and damage lines match ours.
- **2026-10-20, enemy DEF (User):** a non-crit 500 with Final ATK 1272.28 back-solves to 0.387 (first enemy targeted).
- **2026-10-25, enemy DEF (User, DEF guessed):** Strike 592 and Rising Dragon Spire V 641 (crit 1070) fit 0.3733 (0.3735 if the game rounds down).
- **2026-11-01, enemy DEF (User):** Tressa's hits on the enemy of Mei Lin's tests back-solve to about 0.374 (Agony 53 at 731 Attack; Shadow Dagger 139 and 189, docs/characters/tressa.md), and her Agony hits to about 0.429 on a weaker enemy (61, 47, 69).
- **Enemy DEF idea (that sheet's note):** Lv50 Stage 3 Kentris, Nebula event, 255 DEF -> 0.392.
- **2026-10-25, stats screen (User):** Mei Lin's 637 base = 622 (character + partner) + 15 affinity; fragment Attack % multiply only the 622 (622 x 56.7% + 43 flat = +396; removing the 25% piece drops 156). In battle 1198 + 74 equipment = 1272.
- **2026-10-25, card % (User):** Strike with Basic Card Upgrade 10, 5-1, Jewel, 1 Morale, Scarab, Obsidian Sword, Emblem shows 251% in hand, 357% on target; the calculator 250.6% and 355.9% (x 142% Weakness DMG). The ~0.3% on target is unexplained (rounding or hidden decimals?). Strike's 132% = (100% + 10%) x 1.2.
- **2026-10-28, Manifest Ego wording (User's screenshots):** Mei Lin E1 / E4, Rossweisse E2 / E4 / E6, Tiphera E4 (max 2 stacks, removed at end of turn) and Orlea E4 match what's modeled.
- **2026-10-30, Potential wording (User's screenshots):** nodes 3-1, 5-1 and 7 of the 16 reviewed characters use the in-game text. Prydwen differs on Tenebria 7 +1% per 20 Attack (+2%), Chizuru 7 every 10 Attack (40), Yuki 7 every 20 Attack (80), Haru 7 Attack 600 (1000), Chizuru 3-1 70% (60%). Renoa 3-1 and Tiphera 5-1 are "Signature Card Proficiency".
- **2026-10-31, Prydwen's formula page (updated 2026-04-11) re-read:** still the formula above, except its "(1 + Crit DMG)" (see Crit and Fixed).

**Save format history** is in the comments of `src/store/migrate.ts`.

## Sources

- Prydwen damage formula (updated 2026-04-11): https://www.prydwen.gg/chaos-zero-nightmare/guides/damage-formula
- Game8 Morale: https://game8.co/games/Chaos-Zero-Nightmare/archives/561290
- UltimateGacha formula breakdown: https://ultimategacha.com/chaos-zero-nightmare-skill-damage-formula-breakdown-how-modifiers-combos-stack/
- UltimateGacha crit overview: https://ultimategacha.com/chaos-zero-nightmare-critical-rate-break-mechanics-overview/
- STOVE forum test thread (confirms Prydwen matched testing): https://page.onstove.com/chaoszeronightmare/en/view/11367707
- CZN Save Data Calculator (community tool): https://czn-save-cal.web.app/
