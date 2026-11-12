# In-game tests

Made from `tests/ingame/checks.ts`; change it there, not here, then run `npx vitest run -u tests/ingame`.

67 to run, 7 measured. Send the numbers under **Send** with the game version; they then become tests here and close the question.
Use non-crit hits unless the test is about crits, and note anything else that was on.

## To run

### card-pct-rounding

**Question:** Does the game round an upgraded card % to a whole number before buffs? The calculator assumes so for every character (owner, 2026-11-01; Settings): Shadow Dagger is 80% x 1.12 = 89.6%, shown as 90%, and 90% fits all its readings (135%, 164%, 184%), where 89.6% is about 1 low on each. It also assumes that an exact .5 rounds up, that a Fixed % raised by the potentialFixed setting rounds the same way, and that a per-Cost or per-count card rounds its % for one unit, then multiplies.

**Setup:** A card whose exact % rounds down: Tressa's Vital Attack II is 120% x 1.12 = 134.4%, shown as 134%. The same buffs as the Shadow Dagger test: by 12%, +25%, by 10% on Attack Cards.

**Steps:**
1. Read the card in hand before anything Exhausts: 188% means it is rounded first (134%), 189% means it is not (134.4%).
2. Exhaust a card so the by 12% and by 20% buffs start, and read it again: 231% means rounded first, 232% means not.
3. Find a card whose exact % ends in .5 with an even number before it, such as a 75% card at Card Upgrade level 5 (82.5%): 83% means .5 rounds up, 82% means it rounds to the even number.
4. Compare a per-count card's damage with its shown % x the count: Tenebria's Arpeggio (15% for each Rhythm) at a level that shows 16%, with 6 Rhythms and no other buffs, deals 96% if the shown % is multiplied, 94% if the total is rounded.

**Send:** Each % shown; The .5 card, its level and its %; The Arpeggio's damage, with Attack in battle.

Closes: Settings: Round an upgraded card %; docs/FORMULA.md, Card upgrades; possibly strike-rounding-gap

### target-buffs-in-hand

**Question:** Do buffs that depend on the target show on the card in hand? Tressa's E2 doesn't (164% in hand, 184% on a target in Agony). The calculator leaves her other Agony bonuses out of the in-hand % the same way (Unconfirmed), and still counts other characters' target buffs in hand, such as Owen's Break Armor III and Lucas's Flashbang, until they're read.

**Setup:** Tressa with Vital Attack and a target in Agony; Owen with Break Armor III and a Vulnerable target, or Lucas with Flashbang and a target with Shield.

**Steps:**
1. Read the card in hand while a matching target is on the field.
2. Read it again while aiming at that target.

**Send:** The card, and both %s.

Closes: docs/FORMULA.md, Card % in hand / on target; docs/characters/tressa.md

### multiplicative-stacks-chained

**Question:** If multiplicative buffs turn out to chain: does a buff with stacks chain per stack, or count once?

**Setup:** Only needed if the previous test says they chain. A "by X%" buff with stacks.

**Steps:**
1. Read the card % at 0, 1, 2 and 3 stacks.

**Send:** The four card %s.

Closes: src/engine/calc.ts: Chained mode treats 3 stacks of 10% as one 30% source

### strike-rounding-gap

**Question:** Mei Lin's Strike is 357% on target in game and 355.9% here. Is that rounding, or a hidden decimal?

**Setup:** The Strike setup above, or any card with Weakness DMG showing decimals on the stats screen.

**Steps:**
1. Read Weakness Damage on Detailed Stats, with all its decimals.
2. Read the card in hand and on a target weak to its element.

**Send:** Weakness Damage; Card % in hand; Card % on target.

Closes: The check above (strike-in-hand-and-on-target)

### order-weakness-morale

**Question:** Are Morale and "+X% Damage Amount" inside the Weakness DMG factor?

**Setup:** A card, 2 or more Morale, a target weak to the card's element.

**Steps:**
1. Read the % on a non-weak and on a weak target with no Morale.
2. Repeat with Morale.

**Send:** The four card %s; Weakness Damage on Detailed Stats.

Closes: docs/FORMULA.md, The formula

### base-pct-and-mult

**Question:** Do multiplicative buffs raise a "+X% base Damage Amount"?

**Setup:** A card with a "+X% base Damage Amount" effect and a "by X%" buff.

**Steps:**
1. Read the card % with neither.
2. Read it with each alone.
3. Read it with both.

**Send:** The four card %s.

Closes: docs/FORMULA.md, Buff types (Base %)

### ego-skill-bonus

**Question:** Does a "by X%" buff raise the part of an Ego skill's % that a Manifest Ego level adds (Rei E4: 300% -> 400%)? The calculator says yes: the whole 400% is raised.

**Setup:** A character at or above the Ego level that raises their Ego skill (Beryl, Lucas, Owen, Rei or Selena at E4), a "by X%" buff on them, the same enemy each time.

**Steps:**
1. Use the Ego skill without the buff, non-crit.
2. Repeat with the buff.
3. Read the Manifest Ego level's text: does it say "base" (Beryl's E4)?

**Send:** Both damage numbers; The Ego skill's % on the card; The buff; The Ego level's wording.

Closes: docs/FORMULA.md, Buff types (Ego skill bonuses)

### crit-cap

**Question:** Is Crit Chance capped at 100%?

**Setup:** Hard to reach: only if a build shows over 100% Crit Chance.

**Steps:**
1. Read Critical Chance on Detailed Stats.

**Send:** Critical Chance as shown.

Closes: Settings: Crit cap

### crit-threshold-battle

**Question:** Do "If Critical Chance is X% or higher" nodes read the stats screen, or battle Crit Chance too?

**Setup:** Renoa with node 7, Critical Chance just under 60% on the stats screen, and a battle buff that lifts it over.

**Steps:**
1. Read a card affected by the node before and after the buff.

**Send:** Critical Chance on the screen; The buff; Card % before and after.

Closes: docs/characters/renoa.md (Potential 7)

### threshold-every-rounding

**Question:** How does the game round "for every X above Y" thresholds, on stats with decimals (Attack, and % stats such as Critical Chance)?

**Setup:** Rossweisse node 7 ("for every 20 Attack exceeding 600") or Mei Lin node 7, with Attack just below and just on a step. A hint: Hugo's node 7 (+4% Extra Damage at 700 Attack, +1% for every 50 above) shows Extra Damage 7.5% at Attack 877, which is 4% + 177/50 = 7.54%, not rounded down to 7% (owner's screenshot, 2026-11-08). Diana's node 7 the same: Extra Damage 11.5% at Critical Chance 47.6% = 4% + 37.6/5 = 11.52% (2026-11-09).

**Steps:**
1. Read the card % or Weakness Damage with Attack one point under a step, on the step, and one over.

**Send:** Attack (with decimals if shown); The node's value at each point.

Closes: src/engine/buffs.ts: presetBuffValue (a float such as 0.69 can come out one step short); CLAUDE.md, Status / backlog: "for every X above Y"

### card-other-element

**Question:** Does a card of another element than its character use that element's Elemental DMG on the stats screen, and do battle boosts to Elemental DMG% reach it? The calculator says yes to the first, no to the second.

**Setup:** Only if the game lets a character hold a card of another element (neutral or seasonal cards, say), and a battle boost to Elemental DMG%. The same enemy, not weak to either element.

**Steps:**
1. Hit with that card and with one of the character's own element, non-crit, without the boost.
2. Repeat with the boost.

**Send:** The four damage numbers; Both cards' %; Elemental DMG of both elements on Detailed Stats; The boost.

Closes: docs/FORMULA.md, Stats (Elemental DMG%); src/engine/calc.ts: cardElement

### extra-damage-attack-cards

**Question:** Does Extra Damage on the stats screen raise plain Attack Card hits too? The calculator gives it to Extra Attacks only (and Damage over Time to DoT hits only); the other player's sheet gives it to every hit.

**Setup:** Two fragment setups that differ in Extra Damage (swap one piece with an Extra Damage substat), the same enemy each time.

**Steps:**
1. Hit with a plain Attack Card, non-crit, with each setup.

**Send:** Both damage numbers; Extra Damage and Attack in battle with each setup.

Closes: docs/FORMULA.md, Stats (Mechanic DMG%)

### seth-scarab-wording

**Question:** Does Seth's Scarab's 2-piece bonus say Basic Attack Cards, or all Basic Cards? The calculator gives the 20% to Basic Attack Cards only.

**Setup:** The Memory Fragment screen, on a Seth's Scarab piece.

**Steps:**
1. Read the 2-piece set bonus.

**Send:** Its wording.

Closes: src/data/fragmentSets.ts (Seth's Scarab)

### weapon-flat-attack

**Question:** Does a weapon at its top level give 74 (Rare), 82 (Legendary) or 90 (Mythic) Attack, whatever the weapon? The numbers are Prydwen's (each rarity has five steps: Rare 25/41/56/67/74, Legendary 28/45/62/74/82, Mythic 31/50/68/81/90); the calculator always uses the top one. What are the five steps in-game, and are your weapons at the top one?

**Setup:** One weapon of each rarity.

**Steps:**
1. Read the Attack on each weapon's own info.
2. Note whether the weapon shows a level, tier or stars.

**Send:** Rarity; Attack on the weapon; Its level, tier or stars.

Closes: Setup: Equipment, Weapon (src/data/equipment.ts)

### equipment-odd-weapons

**Question:** Prydwen lists three Shop weapons with a Mythic weapon's Attack (31/50/68/81/90) at a lower rarity: Mountain of Corpses (Legendary), Torch of Wrath (Rare) and Overcurrent Shock Unit (Rare). The calculator reads that as Prydwen's mistake and gives them their rarity's Attack (82, 74, 74). What do they show in-game?

**Setup:** Any of the three weapons, in the Shop or owned.

**Steps:**
1. Read the weapon's rarity and its Attack at the top level.

**Send:** Weapon; Rarity; Attack.

Closes: src/data/equipment.ts (EQUIP_FLAT); scripts/import_equipment.py prints them as CHECK

### threshold-with-equipment

**Question:** Do "If Attack / Defense / Health is X or higher" effects (Potential nodes, Manifest Ego) count the equipment's flat Attack, Defense and Health, which only show in battle? The calculator reads the stats screen alone for now; the owner expects the in-battle stats (2026-11-11, not tested).

**Setup:** A character whose stats-screen stat is just under a threshold, and over it with the equipment (e.g. Health 590 with a +75 trinket, for an "If Health is 600 or higher" node).

**Steps:**
1. Play a card the effect raises and note its damage.
2. Take the piece off (or swap it for one that keeps the stat under) and repeat.

**Send:** The effect and its threshold; Stats-screen stat; Damage with and without the piece.

Closes: docs/FORMULA.md (Equipment flat stats); presetBuffValue in src/engine/buffs.ts

### fixed-formula

**Question:** Is Fixed damage = Fixed % x Final ATK x 0.35?

**Setup:** A card with Fixed damage, against an enemy with no shield. Note Attack in battle.

**Steps:**
1. Play it, at two different Attack values if possible.

**Send:** Fixed %; Attack in battle; Damage number each time.

Closes: Settings: Fixed damage: ATK coefficient

### fixed-crit

**Question:** Can Fixed damage crit?

**Setup:** A Fixed damage card, high Crit Chance.

**Steps:**
1. Play it several times; watch for a larger or differently coloured number.

**Send:** Whether any crit showed; The numbers.

Closes: src/engine/calc.ts: Fixed

### fixed-potential

**Question:** Do Card Upgrade potentials raise Fixed damage?

**Setup:** Orlea's Annoying I: in hand, its Fixed 40% looked unraised while its Heal was raised. Damage is what matters.

**Steps:**
1. Play it at a known Signature level and Attack.

**Send:** Signature level; Attack in battle; Damage number.

Closes: Settings: Upgrades raise Fixed damage

### vulnerable-per-hit

**Question:** Is one stack of Vulnerable used per hit, or per card? The calculator switches it per play, on all its hits.

**Setup:** A multi-hit card, a target with 1 stack of Vulnerable.

**Steps:**
1. Play the card; compare the numbers of its first and later hits, and the stacks left.

**Send:** The numbers of each hit; Stacks before and after.

Closes: docs/FORMULA.md, Weakness, Vulnerable, Ravaged

### weakness-debuff-per-hit

**Question:** Same for the Weakness debuff on you: per hit, or per card?

**Setup:** A multi-hit card while you have 1 stack of the Weakness debuff.

**Steps:**
1. Play the card; compare its hits and the stacks left.

**Send:** The numbers of each hit; Stacks before and after.

Closes: docs/FORMULA.md, Weakness, Vulnerable, Ravaged

### weakness-debuff-triggered-hits

**Question:** With the Weakness debuff on you, is a hit your play sets off reduced too, and does it use a stack? The calculator says no for a hit of its own (Flame Thrower III's On Critical Hit, Mark), and yes for one more hit of the played card (Wind Charge III's added hit).

**Setup:** Lucas with Flame Thrower III, the same enemy, no other buffs. A way to get 2 or more stacks of the Weakness debuff on him. Then, if you can, Owen with Wind Charge III.

**Steps:**
1. Without the debuff, play Flame Thrower III until it crits and read both numbers.
2. With the debuff, do the same, and note the stacks before and after: if the second number is 25% lower too, the debuff reaches it; if the stacks drop by 2, it used a stack.
3. Same with Owen: an Attack Card with and without the debuff, until Wind Charge III adds its hit.

**Send:** The damage numbers, each time; Weakness debuff stacks before and after; Attack in battle.

Closes: docs/FORMULA.md, Weakness, Vulnerable, Ravaged; src/engine/calc.ts: computeBuild

### ravaged-extra-damage

**Question:** How much more damage does a Ravaged enemy take by itself?

**Setup:** A character with no "vs Ravaged" effects (no Marianne, no Ember), one card, the same enemy.

**Steps:**
1. Hit it before it is Ravaged.
2. Hit it again while Ravaged.

**Send:** Both non-crit numbers; Card % on target both times.

Closes: Settings: Ravaged: extra damage taken

### ravaged-triggered-hits

**Question:** When a play hits a Ravaged enemy, do the hits it sets off (Mark, Coordinated Attacks) count as on a Ravaged target too, with "vs Ravaged" buffs? The calculator says yes.

**Setup:** A triggered hit such as Selena's Mark, a "vs Ravaged" buff such as Marianne's on the character who owns the hit, the same enemy.

**Steps:**
1. Read the triggered hit's number before the enemy is Ravaged.
2. Read it again while the enemy is Ravaged.

**Send:** Both non-crit numbers; The buff; Attack in battle.

Closes: docs/FORMULA.md, Weakness, Vulnerable, Ravaged; src/engine/calc.ts: computeBuild

### marianne-ravaged

**Question:** Is Marianne's "15% increased damage to Ravaged enemies" multiplicative (no "+") or additive?

**Setup:** A Striker with Marianne, and a card at a % far from 100%, on a Ravaged target. Then the same without her effect if possible (another partner).

**Steps:**
1. Read the card % on the Ravaged target with and without Marianne.

**Send:** Both card %s; Base card % in hand.

Closes: src/data/partners/marianne.ts

### weakness-non-active

**Question:** Do Weakness DMG and Weakness Attack reach non-active hits (Extra Attacks, triggered hits)? Prydwen says non-active damage gets no elemental bonus; the owner ruled Selena's Passion Weakness makes Coordinated Attacks Weakness Attacks.

**Setup:** A triggered Extra Attack (Selena's Mark) with a known %, on an enemy weak and then not weak to the element.

**Steps:**
1. Read the Extra Attack number on each enemy, with the same stats.

**Send:** Both non-crit numbers; Weakness Damage; Attack in battle.

Closes: docs/FORMULA.md, Weakness; src/data/characters/selena.ts

### enemy-def-formula

**Question:** Is the enemy DEF multiplier 100 / enemy DEF? One data point so far: Lv50 Kentris (255 DEF) = 0.392; Mei Lin's tests back-solve to 0.387 and 0.3733. The formula puts the enemy of Mei Lin's tests at about 268 DEF and the weaker enemy of the Tressa tests (0.429) at about 233: what do their info pages show?

**Setup:** A known card, Attack and Weakness, and enemies whose DEF you can read on their info page.

**Steps:**
1. Hit each enemy, non-crit, with no debuffs.

**Send:** Enemy, level, DEF; Card % on target; Attack in battle; Elemental DMG; Damage number.

Closes: Setup: Fight, DEF multiplier

### mei-lin-first-attack-weakness

**Question:** Does Mei Lin's first Attack card already get Jewel's Passion Weakness?

**Setup:** Flame Dragon's Jewel, a target not otherwise weak to Passion.

**Steps:**
1. Read the first Attack card's % on the target, then the second's.

**Send:** Both card %s on target.

Closes: docs/characters/mei-lin.md

### chizuru-readings

**Question:** Chizuru: is Oni Hunt IV's created Moonslash a normal Moonslash with Exhaust and Cost 0 (Basic upgrade, 3-1, 5-1)? Is the Ego skill 700% at E3, like Selena's E4?

**Setup:** Chizuru with Oni Hunt IV; E3 once reached.

**Steps:**
1. Screenshot the created Moonslash and a normal one.
2. Screenshot the Ego skill at E3.

**Send:** The pictures.

Closes: docs/characters/chizuru.md

### adelheid-truth-stacking

**Question:** Can Truth Behind A Story and Truth Behind A Story I both be in one deck, and does playing both in a turn make "+100% Damage Amount taken by the target" +200%? The calculator counts it once (on or off).

**Setup:** Adelheid, if the game lets the deck hold both.

**Steps:**
1. Play one, then an Attack Card, and read its % on the target.
2. Play both in one turn, then the same Attack Card.

**Send:** Whether both fit in the deck; The Attack Card's % on the target each time.

Closes: src/data/characters/adelheid.ts (truthDebuff)

### haru-decrease-in-sum

**Question:** Is the decrease from Haru's E2 / E6 in the same multiplicative sum as "by X%" buffs?

**Setup:** Haru with E2, with AP short of Cost, and a "by X%" buff.

**Steps:**
1. Read the card % with the decrease alone, with the buff alone, with both.

**Send:** The three card %s, and the one with neither.

Closes: docs/characters/haru.md

### heidemarie-readings

**Question:** Heidemarie: (1) Do two Sword Flash (3-1) or Effulgent Expansion plays in one turn stack their +30% / +50% to Effulgent Blade? The calculator counts one. (2) Does Thread of Light III's +80% to Linked cards reach a discarded Blade's Extra Attack and Sword Rain III's procs? The calculator says yes. (3) Effulgent Release below E1: is it '+100% base Damage Amount' (added after the upgrade, as at E1) or plain '+100% Damage Amount'?

**Setup:** Heidemarie with Effulgent Blades, Sword Flash or Effulgent Expansion, and Thread of Light III; non-crit numbers at a known Attack.

**Steps:**
1. Play one Sword Flash, then a Blade; then two Sword Flash, then a Blade. Read the Blade both times.
2. Discard a Blade with Thread of Light III in hand, then without it. Read the Extra Attack both times.
3. Read Effulgent Release at E0 if a save below E1 shows it.

**Send:** Each number; Attack in battle; Signature level.

Closes: docs/characters/heidemarie.md

### mika-orlea-node-5-1

**Question:** Are Mika's and Orlea's 5-1 Healing bonuses +X% of the base (like the other nodes)? Both are locked for the owner.

**Setup:** Once 5-1 is unlocked.

**Steps:**
1. Screenshot the card before and after unlocking it.

**Send:** Both pictures, with the Card Upgrade level.

Closes: docs/characters/mika.md, docs/characters/orlea.md

### renoa-readings

**Question:** Renoa: is Dirge Bullet: Finale's base 200% / 160% (or 160% / 140%, with 3-1 included)? Do Ballad IV's and Last-Ditch / Instant Judgment's bonuses reach Finale? Is E6's 50% Extra Attack per draw unraised?

**Setup:** Renoa with 3-1 locked (the numbers only differ then), Finale with those bonuses, E6 if reached.

**Steps:**
1. Screenshot Finale with 3-1 off.
2. Read Finale with and without each bonus.
3. Note the E6 hit number at a known Attack and Signature level.

**Send:** The pictures and %s; E6 damage, Attack in battle, Signature level.

Closes: docs/characters/renoa.md

### renoa-next-card-buffs

**Question:** Do "next card" and Attack Card buffs (Flower III's +40%) skip the Extra Attacks on that play (Mark, discarded Dirge Bullets)?

**Setup:** A Mark or a discard hit on a play with the buff, then without it.

**Steps:**
1. Read the Extra Attack number both ways.

**Send:** Both numbers.

Closes: docs/characters/renoa.md

### rossweisse-e2

**Question:** Is Rossweisse's E2 Blade Afterimage an Extra Attack (does Extra Damage raise it), and does it get the Signature upgrade or Attack Card buffs?

**Setup:** Rossweisse E2 (the owner has it). Extra Damage and Signature level known; ideally two Extra Damage values, and with and without an Attack Card buff.

**Steps:**
1. Read the Afterimage number each way.

**Send:** Numbers; Extra Damage; Signature level; Attack in battle.

Closes: docs/characters/rossweisse.md

### rossweisse-brand-and-justice

**Question:** Rossweisse: (1) Brand of the Cycle says "Increase Damage Amount taken from Rossweisse by 20%", with no "+": does it multiply like "by X%" buffs, or add like other damage-taken debuffs? The calculator multiplies. (Node 7's Justice Damage is on the stats screen: User, 2026-11-08.)

**Setup:** Rossweisse with a card of 200% or more, a target with Brand of the Cycle and one without.

**Steps:**
1. Read the card % on each target: 200% becoming 240% means it multiplies; 220% means it adds.

**Send:** The card %s on both targets.

Closes: docs/characters/rossweisse.md; docs/FORMULA.md, Teams (debuffs on the enemy are additive)

### orlea-softie-cap

**Question:** Softie★★'s Retain bonus is 20% per Retain, "max 350%". Does it stop at 340% (17 Retains), or add the last 10%? The calculator stops at 340%.

**Setup:** Orlea with Softie★★, Retained 18 times or more.

**Steps:**
1. Read the next Attack Card's % after 17 and after 18 Retains.

**Send:** Both %s.

Closes: src/data/characters/orlea.ts (softie)

### rei-cassius-card-plus

**Question:** Do Rei's node 7 on Predator's Blade (250%) and Cassius's node 5-1 on Wild Card (220%) add before the upgrade, like Chizuru's? Both are locked for the owner.

**Setup:** Once the nodes are unlocked.

**Steps:**
1. Screenshot the card after unlocking the node.

**Send:** The picture; The Card Upgrade level.

Closes: docs/FORMULA.md, Buff types (Card +)

### yuki-readings

**Question:** Yuki: is Flash Slash IV's base 400% with node 7's +10%, or 410% with none? Does Swiftblade Flurry have a stack limit?

**Setup:** Flash Slash IV with node 7 off or on a lower Attack; Swiftblade Flurry stacked high.

**Steps:**
1. Read Flash Slash IV below and above the threshold.
2. Keep stacking Swiftblade Flurry until it stops rising.

**Send:** Both card %s; The highest stacks.

Closes: docs/characters/yuki.md

### nine-readings

**Question:** Nine: do Honed Edge and Experienced Strike's and node 3-1's Exhaust card buffs raise allies' cards too? Do several Experienced Strikes stack? Do nodes 3-1 and 5-1 raise Slash before the upgrade?

**Setup:** Nine with a teammate who has an Exhaust Attack card and a Defense-Based Attack card, Counterblade in the deck. For Slash: once 3-1 and 5-1 are unlocked, with a known Basic level.

**Steps:**
1. Read the teammate's damage on the same enemy with and without Honed Edge, then with and without Experienced Strike.
2. Play Experienced Strike twice in a turn and read an Exhaust card each time.
3. Screenshot Slash after unlocking each node.

**Send:** The damage numbers; The Slash %; The Basic level.

Closes: docs/characters/nine.md

### nine-e3

**Question:** Nine's E3 "+150 Damage Amount to Reflection: Zero" has no % sign: is the card 400%, with multipliers raising the extra too?

**Setup:** Once Nine has E3: the Ego skill with known Attack, Defense and combined Cost, and a multiplicative buff that reaches it.

**Steps:**
1. Read the card text.
2. Read its damage with and without the buff.

**Send:** The picture; Both numbers; Attack and Defense in battle; The combined Cost.

Closes: docs/characters/nine.md

### owen-readings

**Question:** Owen: do two Wind Charge II / V before the same Attack Card stack their decrease? Is Break Armor I's Fortitude +80% added like "+" buffs, and does its own hit get it? Do Attack Card buffs reach his E2 hit, Wind Slash IV's end of turn hit and Wind Riding II's hit, and do card upgrades raise E2's 80%? Do 3-1 and 5-1 raise Downward Cut before the upgrade? Does E6's +20% stack per Wind Charge?

**Setup:** Owen with a known Attack. For 3-1, 5-1 and E6: once they are unlocked.

**Steps:**
1. Read a Downward Cut with one Wind Charge II before it, then with two.
2. Read a Downward Cut with and without Break Armor I played first, with a multiplicative buff on and off, and read Break Armor I's own hit.
3. Read the E2 hit, Wind Slash IV's hit and Wind Riding II's hit with and without a buff to Attack Cards.
4. Screenshot Downward Cut after unlocking each node.
5. With E6, play Wind Charge twice in a turn and read a card after each.

**Send:** The damage numbers; The Downward Cut %; The Basic level; Attack in battle.

Closes: docs/characters/owen.md

### lucas-readings

**Question:** Lucas: does R.P.G-7 fire when Ephemeral exhausts a Bullet at the end of the turn? Can Flame Thrower III's On Critical Hit damage crit too? If an effect adds hits to Flame Thrower III, does each crit add the 150%? (The calculator counts one roll per play.) Whose hit is Flashbang IV's Mark, and how big? Do two S.S.S in a turn stack? Does Machine Gun with 3-1 get E2's and S.S.S's Bullet damage? Do 5-1 and 7 raise the card % before the upgrade?

**Setup:** Lucas with a known Attack. For 3-1, 5-1 and 7: once they are unlocked.

**Steps:**
1. With R.P.G-7 upgraded, end a turn with a Launcher Bullet in hand and read the damage numbers.
2. Play Flame Thrower III until it crits and read both numbers.
3. If an effect can add hits to Flame Thrower III, play it so and count the 150% numbers against the crits.
4. Play Flashbang IV, tap the Mark keyword for its text, then play an Attack Card and read the extra number.
5. Play a Launcher Bullet after one S.S.S, then another after two.
6. With 3-1, read a Machine Gun with and without S.S.S played first.
7. Screenshot Machine Gun and a Launcher Bullet after unlocking 5-1 and 7.

**Send:** The damage numbers; The Mark keyword text; The card %s; Attack and Critical Damage in battle.

Closes: docs/characters/lucas.md

### rin-drawing-slash-own-stance

**Question:** Rin: when she isn't in Dark Mist Stance, does Drawing Slash's own "Gain Dark Mist Stance" already give that same play its +100%? The calculator says yes for now.

**Setup:** A battle with Rin and Drawing Slash, E3 or lower (E4 gives the stance on any card). No other buffs; same target and no Vulnerable for all plays.

**Steps:**
1. Start a turn outside the stance and play Drawing Slash first.
2. In another turn, get the stance first (Dark Mist Secret Art: Destruction), then play Drawing Slash.
3. Compare the two non-crit damage numbers: the same means the card's own gain counts; about double in the second means it needs the stance from before.

**Send:** Both damage numbers; Attack in battle.

Closes: docs/characters/rin.md

### rin-unconfirmed

**Question:** Rin's other readings, none readable at the owner's level 0 and E0: (1) Do Black Dance (Mythic) and Sheathe Sword get the Signature upgrade? (2) Is node 7's Critical Chance on the stats screen? (3) Is E1's +30% part of Black Dance's shown %? (4) What Cost does Drawing Slash III play at in the stance?

**Setup:** Once Signature levels, node 7 and E1 are unlocked; for (4), Drawing Slash III and the stance in battle.

**Steps:**
1. Read Black Dance and Sheathe Sword with a Signature level above 0.
2. Read Critical Chance on the stats screen with node 7 on, at Attack 600 or higher.
3. Read Black Dance after E1.
4. Read Drawing Slash III's Cost in the stance.

**Send:** The card %s; The Signature level; Critical Chance and Attack; The Cost.

Closes: docs/characters/rin.md

### amir-unconfirmed

**Question:** Amir's readings the screenshots can't settle: (1) Does Steel Resolve's Shield set off a Metallization strike before it removes Metallization? (2) Does a strike's own 80% Shield set off another one? (3) Can a strike crit? (4) Is node 7's +10% additive? (5) Is node 5-1's +5% part of Rapier's shown %?

**Setup:** A battle with Amir. (1) to (3) need some Metallization and a Steel Barrier; (4) and (5) need those nodes unlocked (Promotion required for now).

**Steps:**
1. With 3 Metallization, play Steel Barrier and count the strikes and how far Metallization drops: 1 strike and 2 left means a strike's Shield sets off nothing.
2. With some Metallization, use Steel Resolve and count the strikes.
3. Watch several strikes for a crit, with some Critical Chance.
4. With node 7 on and a "by X%" buff that reaches strikes, compare a strike with and without the buff: an additive +10% isn't raised by it.
5. Read Rapier with node 5-1 on: 118% at level 6 means the +5% is in the card's % ((100% + 5%) x 1.12).

**Send:** Strikes and Metallization left, each time; Strike damage, crit and non-crit, with Defense and Attack in battle; Rapier's %.

Closes: docs/characters/amir.md

### maribell-readings

**Question:** Maribell's readings the screenshots can't settle: (1) Does Resolute Blitz IV's and E6's Shield damage go under the multipliers, or on top of them? (2) Does Pulverize raise Shelter Strike's Fixed Damage? (3) Can a Counterattack crit? (4) Is node 7's +5% additive, and is node 5-1's +5% part of the shown Shield %?

**Setup:** A battle with Maribell holding a Shield you can read. (2) needs an enemy holding Shield; (3) some Critical Chance; (4) those nodes unlocked.

**Steps:**
1. Play Resolute Blitz IV on a Vulnerable target with a known Shield, then with no Shield: under the multipliers, the difference is 30% of Shield x Vulnerable; on top of them, exactly 30% of Shield.
2. Play Shelter Strike on an enemy holding Shield and on one without: 150% of Shield on both means Pulverize does nothing; 180% on the first means it counts.
3. Watch several Counterattacks for a crit.
4. With node 7 on and a "by X%" buff, compare a Basic Attack with and without the buff; read Shelter Defense with node 5-1 on: 118% at level 6 means the +5% is in the card's % ((100% + 5%) x 1.12).

**Send:** The damage of each play, with Shield, Defense and Attack in battle; Counterattack damage, crit and non-crit; Shelter Defense's %.

Closes: docs/characters/maribell.md

### magna-readings

**Question:** Magna's readings the screenshots can't settle: (1) Is Ice Wall IV's Fixed Damage exactly the Shield held, whatever else is on (Vulnerable, Justice Damage)? (2) Is Absolute Zero x(1 + 20% x Counterattacks), as the calculator counts it, or 20% compounded per Counterattack? (3) Do Ice Fragment III's 30%, Ice Fragment V's 100% and E6's 30% each multiply a Counterattack on their own?

**Setup:** A battle with Magna holding a Shield you can read. (2) needs several Counterattacks on Magna; (3) Ice Fragment III or V in the deck.

**Steps:**
1. Play Ice Wall IV with a known Shield, on a Vulnerable target and on one without: the same number, equal to the Shield, means nothing raises it.
2. Play Absolute Zero with 5 Counterattacks and with none: x2.0 (20% x 5 added) or x2.49 (1.2 x 1.2 x ...) between them.
3. Read a Counterattack with Ice Fragment III played and without (x1.3 means it multiplies); the one right after Ice Fragment V (x2).

**Send:** The damage of each play, with Shield, Defense and Attack in battle; The Counterattacks on Magna when Absolute Zero was played; Counterattack damage, non-crit.

Closes: docs/characters/magna.md

### beryl-readings

**Question:** Beryl's readings the screenshots can't settle: (1) Does the created Charged Shot have the normal 270% and +135%? (2) Do Opening Found's added hits add up when it's Retained and Guilty Pleasure IV activates it in the same turn? (3) Does Guilty Pleasure IV's activation give Condense? (4) Does Condense's Extra Attack roll one crit or one per stack? (5) Are nodes 5-1's and 7's bonuses part of the shown card %?

**Setup:** A battle with Beryl with Heavy Weapons Specialist, Opening Found and Guilty Pleasure IV. (4) needs E6 and some Critical Chance; (5) those nodes unlocked.

**Steps:**
1. Create a Charged Shot with Heavy Weapons Specialist and read it: 302% and +135% at Signature level 6 means it's the normal card; 224% and +80% means Prydwen's.
2. Retain Opening Found, then play Guilty Pleasure IV next turn and count the hits Opening Found makes: 2 means no adding up, 3 means they add up.
3. At E6 with no Condense, play Guilty Pleasure IV, then an Attack Card: an Extra Attack means the activation gives Condense.
4. Retain 3 cards, then play an Attack Card and watch the numbers: one 150% number means one crit roll, three 50% numbers mean one per stack.
5. With node 5-1 on, read Launcher: 143% at Basic 7 with Critical Damage below 160% means it's in the card's % ((100% + 20% + 5%) x 1.14). With node 7 on, read Opening Found: 190% at Signature 6 means the same ((160% + 10%) x 1.12).

**Send:** The created Charged Shot's %s; Opening Found's hit count; Extra Attack damage with and without Condense; Launcher's and Opening Found's %s.

Closes: docs/characters/beryl.md

### agony-limits

**Question:** What else touches an Agony hit? Its measured hits leave room for neither Offering of the Void nor Cursed Corpse, and they fit with Void Damage counted, on the enemy of Mei Lin's tests (DEF about 0.374). (1) Does Void Damage raise it, measured directly? (2) Do those sets raise it? (3) Does Enemy damage reduction lower it?

**Setup:** A battle with Tressa on the test enemy, with a known Attack and Agony at 8 before the end of the turn.

**Steps:**
1. Change Void Damage with a fragment, keeping Damage over Time, and read one Agony hit. Without a Void factor the hit moves only with Attack.
2. Exhaust a card so Offering of the Void is active at the end of the turn: 53 at 731 Attack means it doesn't raise the hit, 64 means it does.
3. Equip Cursed Corpse and read one Agony hit: 53 at 731 Attack means it does not raise it, 58 means it does.
4. On a boss or elite with damage reduction, compare an Agony hit with a normal hit.

**Send:** Attack, Void Damage and Damage over Time; Fragment sets on; Each Agony hit.

Closes: docs/characters/tressa.md

### tressa-readings

**Question:** Tressa's readings the screenshots can't settle: (1) Does E2's +20% reach Advanced Shadow Dagger? One reading (196 at 747 Attack, Agony 1 to 5) can't tell without that build's buffs. (2) Do Advanced Shadow Dagger's own 4 Agony count toward its +10% per Agony? That reading leans yes. (3) Is Wave of Darkness 2 Agony × 2 below E4? (4) Is node 5-1's bonus part of Dagger Throw's shown %?

**Setup:** A battle with Tressa with Shadow Reload and a target with no Agony. (1) needs E2 or higher; (3) a character below E4, or text from someone who has one; (4) node 5-1 unlocked.

**Steps:**
1. With Agony on the target, read the numbers of an Advanced Shadow Dagger with a known count: compare with (56% + 10% x count) and (56% + 10% x count + 20%), x Attack x 0.35 x (1 + Void).
2. Play an Advanced Shadow Dagger on a target with 0 Agony: damage matching 96% means its own 4 count, 56% means they do not.
3. Read Wave of Darkness below E4.
4. With node 5-1 on, read Dagger Throw: 128% at Basic level 5 with E6 means it's in the card's % ((100% + 5%) x 1.22).

**Send:** Damage of each play, with Attack in battle, Void Damage and the Agony count; Wave of Darkness's text; Dagger Throw's %; The ticks.

Closes: docs/characters/tressa.md

### anika-readings

**Question:** Anika's readings the screenshots can't settle: (1) Does Rampage Trigger's Destroy add +100% to each of its 4 hits? (2) Does Warming Up IV count the hand when it's activated, or as the hand changes? (3) Is node 5-1's bonus part of Blaster Swing's shown %? (4) Does E4 show 300% on Buffalo Dive, and is its +50% additive?

**Setup:** A battle with Anika with Rampage Trigger and Warming Up IV. (1) needs a Ravaged target; (3) node 5-1 unlocked; (4) E4.

**Steps:**
1. Play Rampage Trigger on a target that is not Ravaged and on a Ravaged one, with no Ravaged damage factor to explain the difference: each hit going from 114% to 214% means +100% per hit.
2. Play Warming Up IV with 3 Attack Cards in hand, then two Attack Cards in a row: the same increase on both means the hand was counted when it was activated; a smaller one on the second means it follows the hand.
3. With node 5-1 on and Attack 250 or higher, read Blaster Swing: 117% at Basic level 1 means it's in the card's % ((100% + 15%) x 1.02).
4. At E4, read Buffalo Dive, then use it with and without a "by X%" buff: additive means the buff raises only the 250%, not the +50%.

**Send:** Rampage Trigger's hit damage on each target; Damage of the two Attack Cards, with the hand size; Blaster Swing's %; Buffalo Dive's % and its damage with and without the buff.

Closes: docs/characters/anika.md

### khalipe-readings

**Question:** Khalipe's readings the screenshots can't settle: (1) What does Greatsword Aquila II's "When activated, +40% Damage Amount" do? (2) Can Silver Veil crit, and does Extra Damage raise it? (3) Do several Greatsword Aquila IV Retains add up? (4) Which Vulture Ejection does the Ego skill create? (5) Are node 5-1's bonus and node 7's Attack bonus part of the shown card %?

**Setup:** A battle with Khalipe with Greatsword Aquila II or IV and an epiphany of Vulture Ejection. (2) needs some Critical Chance and Extra Damage; (5) node 5-1 unlocked and Attack 700 or higher.

**Steps:**
1. Play Greatsword Aquila II twice in a fight with the same Defense, Attack and target: the card showing more than its % before the first play, and both plays equal, means +40% on every play. A second play higher than the first means it grows with each use. Also watch whether the next card played deals more.
2. Set off Silver Veil several times: watch for a crit, and compare its damage with 500% x (Attack x 0.3 + Defense x 2.1) x 0.35 x your Extra Damage: a match with that factor means Extra Damage raises it.
3. Retain Greatsword Aquila IV for two turns, then play Vulture Ejection and compare with one Retain: twice the increase means they add up.
4. Use the Ego skill with an epiphany of Vulture Ejection in the deck and read the created card: the plain text means it creates the base card.
5. With node 5-1 on, read Lashing: 107% at Basic level 1 means it's in the card's % ((100% + 5%) x 1.02). With node 7 on and Attack 700 or higher, read Vulture Ejection: 165% at Signature level 5 means the same ((120% + 30%) x 1.10).

**Send:** Both Greatsword Aquila II plays, and the next card played; Silver Veil damage, crit and non-crit, with Attack, Defense and Extra Damage in battle; Vulture Ejection damage with one and two Retains; The created card's text; Lashing's and Vulture Ejection's %s.

Closes: docs/characters/khalipe.md

### veronica-readings

**Question:** Veronica's readings the screenshots can't settle: (1) Is Piercing Ballista's "Piercing Damage" raised by Extra Damage like the other Ballistas' Extra Attacks? The calculator says no. (2) Do Ballistas proccing at the end of the turn still get that turn's Reload (removed at the end of the turn)? The calculator says yes. (3) Is node 5-1's bonus part of Rapid Fire's shown %?

**Setup:** A battle with Veronica with Firing Preparation II (Piercing Ballista) and plain Ballistas, no Reload at first. (3) needs node 5-1 unlocked.

**Steps:**
1. End a turn with a Piercing Ballista and a Ballista, no Reload, and read both damage numbers. Compare each with its % x Attack x 0.35 x (1 + Passion Damage): a Ballista about (1 + Extra Damage) higher than that and Piercing Ballista not means Piercing isn't an Extra Attack.
2. In another turn, gain 1 Reload, then end the turn and read the Ballista: about 1.5x the first means the Reload counts.
3. With node 5-1 on, read Rapid Fire: 114% at Basic level 2 means the +10% is in the card's % ((100% + 10%) x 1.04).

**Send:** Both Ballista damage numbers, with and without Reload; Attack, Passion Damage and Extra Damage in battle; Rapid Fire's %.

Closes: docs/characters/veronica.md

### rita-readings

**Question:** Rita's readings the screenshots can't settle: (1) Is Chrono Archon II's "100% Damage to a random enemy for each Chronal Ascension" one 100% hit per Chronal Ascension (the calculator), or one bigger hit? (2) Does Fate Distortion's "additional 10% for each Cost of that card" read the Cost the card is played at (a Fate Imprint raised to 4 gets 40%; the calculator), or its base Cost?

**Setup:** A battle with Rita with Chrono Archon II. (2) needs E2 (Fate Distortion) and a Fate Imprint whose Cost went up.

**Steps:**
1. End a turn holding several Chronal Ascension and count the damage numbers from Chrono Archon II: one number per Chronal Ascension means separate hits.
2. With a Fate Distortion, play a Fate Imprint at Cost 4 and read its damage; compare with the same Fate Imprint at Cost 4 without Fate Distortion: 1.7x means the play's Cost counts (30% + 4 x 10%), 1.5x the base Cost of 2.

**Send:** Chrono Archon II damage numbers and the Chronal Ascension held; Both Fate Imprint damage numbers, with Attack in battle.

Closes: docs/characters/rita.md

### sereniel-readings

**Question:** Sereniel's readings the screenshots can't settle: (1) Does Instinct Weakness make her Instinct hits Weakness Attacks (x Weakness DMG), as Passion Weakness does for Selena? (2) Does Afterglow's +100% also count on an enemy without Tenacity that isn't Ravaged? (3) Is E1's +100% on Pale Shooting Star additive, outside its shown %? (4) Does E3 show Death Halo at 650%? (5) Is E6's On Ravage hit (80% x max Tenacity) left unraised by her upgrades, and not raised by Extra Damage?

**Setup:** A battle with Sereniel with Plasma Missile III and Homing Laser. (3) needs E1, (4) E3 (or its preview), (5) E6.

**Steps:**
1. Play Plasma Missile III, then a Homing Laser on that target, and the same Homing Laser on a target without Instinct Weakness: 1.25x (your Weakness DMG) more means it is a Weakness Attack.
2. Play a Homing Laser (Afterglow), then another Attack Card on an enemy without Tenacity that is not Ravaged: about +100% of its card % more than without Afterglow means it counts.
3. At E1, read Pale Shooting Star's % on the card: 180% at Unique 10 means the +100% isn't in it; then play it with a "by X%" buff: additive means the buff raises only the 180%.
4. Read Death Halo's % at E3: 650% means the +150% is part of it.
5. At E6, Ravage a target with a known max Tenacity and read the hit: 80% x Tenacity x Attack x 0.35 x (1 + Instinct Damage) means no upgrade and no Extra Damage.

**Send:** Homing Laser damage with and without Instinct Weakness; Damage with and without Afterglow on the enemy without Tenacity; Pale Shooting Star's % and damage; Death Halo's %; The E6 hit with the max Tenacity, and Attack, Instinct Damage and Extra Damage in battle.

Closes: docs/characters/sereniel.md

### hilde-readings

**Question:** Hilde's readings the screenshots can't settle: (1) Does Matrix Overlay's "+15% Weakness Damage Amount taken" add to the Weakness DMG stat (125% -> 140%; the calculator), or multiply the hit by 1.15? (2) Is E1's "+60% Damage Amount" to Vortex Arrow part of its shown % ((120% + 60%) x the upgrade; the calculator)?

**Setup:** A battle with Hilde against an enemy weak to Instinct, with Homing Arrows in the deck. (2) needs E1 (or its preview).

**Steps:**
1. Proc a Homing Arrow drawn by Matrix Overlay and read its damage; compare with a Homing Arrow with Weakness Attack but without Matrix Overlay that turn: 140% / 125% = 1.12x means it adds to Weakness DMG, 1.15x a multiplier of its own.
2. At E1, read Vortex Arrow's %: 205% at Unique 7 means the +60% is part of it.

**Send:** Both Homing Arrow damage numbers, and Weakness Damage on the stats screen; Vortex Arrow's % at E1.

Closes: docs/characters/hilde.md

### hugo-single-target

**Question:** Is every Attack Card whose text doesn't say "all enemies" or "random enemies" a Targeting card for Hugo's Commence the Hunt? Fan of Daggers II ("99% x 3 Damage", no "random enemies") is taken as one.

**Setup:** A battle with Hugo holding Commence the Hunt, with Fan of Daggers II (or another Attack Card that names no target), and two enemies.

**Steps:**
1. Play Fan of Daggers II with Commence the Hunt: an Extra Attack and one less Commence the Hunt means it is a Targeting card; also see whether its 3 hits all land on one enemy.

**Send:** Whether the Extra Attack came and Commence the Hunt went down; Which enemies the hits landed on.

Closes: docs/FORMULA.md, "Applies to" (Single-target); src/engine/deck.ts: cardTargets

### hugo-readings

**Question:** Hugo's readings the screenshots can't settle: (1) How long does Last Resort's "Increase Damage of Commence the Hunt by 30%" last (the calculator switches it on per play)? (2) Does it add to Fixer's Approach's 40% (x1.7 together, the calculator's reading) or multiply with it (x1.82)? (3) Does Commence the Hunt's Extra Attack use the stacks before it goes down (3 stacks: 50% + 90%), as the calculator does?

**Setup:** A battle with Hugo, Fixer's Approach played, Commence the Hunt at 3, then Last Resort.

**Steps:**
1. Play Knife Toss with 3 Commence the Hunt before Last Resort: the Extra Attack should be (50% + 90%) x 1.4 x Attack x 0.35 x (1 + Order Damage) x (1 + Extra Damage) (non-crit).
2. Use Last Resort, then the same play: x1.7 / 1.4 means the 30% adds to the 40%, x1.3 means it multiplies. Repeat next turn and the turn after to see whether it lasts.

**Send:** The Extra Attack damage numbers (non-crit) with their Commence the Hunt stacks; Attack, Order Damage and Extra Damage in battle.

Closes: docs/characters/hugo.md

### diana-readings

**Question:** Diana's readings the screenshots can't settle: (1) Does Liberated Feelings' "Increase base Damage Amount by 30% for each different Bullet card in hand" raise the card's % (348% x 1.6 = 557% with 2 different Bullets; the calculator, as Lucas's Flame Thrower IV)? (2) Is E1's "+100% Damage Amount" to Liberated Feelings part of its shown % ((300% + 100%) x the upgrade; the calculator)?

**Setup:** A battle with Diana holding Liberated Feelings and two different Bullet cards (Heart Breaker and Heart Shaker, say). (2) needs E1 (or its preview).

**Steps:**
1. Read Liberated Feelings' % in hand with 0, 1 and 2 different Bullet cards in hand: 348%, 452%, 557% at Unique 8 means it raises the card %; if it stays 348%, play it and compare the damage (x1.3 / x1.6).
2. At E1, read Liberated Feelings' %: 464% at Unique 8 means the +100% is part of it.

**Send:** Liberated Feelings' % (or damage, non-crit) with each count of different Bullet cards; Its % at E1.

Closes: docs/characters/diana.md

### fracture-tick

**Question:** Arabella's Fracture ("At the end of the turn, 40% DoT for each Fracture"): is a tick one hit of 40% x the stacks, normal damage that card buffs and Vulnerable raise (the calculator), or one hit per stack, or Fixed like Agony? Do Fracture Amplification's "by 20%" and the DoT stat raise it?

**Setup:** A battle with Arabella and an enemy you can watch for a few turns. Write down Attack, Instinct Damage and Damage over Time in battle.

**Steps:**
1. Put 10 Fracture on an enemy with no Fracture Amplification and end the turn: one number of about 40% x 10 x Attack x 0.35 x (1 + Instinct) x (1 + Damage over Time) x Enemy DEF means one hit for all the stacks; 10 small numbers mean one per stack.
2. Do the same with Fracture Amplification on that enemy: x1.2 means its 20% counts.
3. Do the same on an enemy with Vulnerable: x1.5 means Vulnerable raises it (normal damage); no change means it acts like a Fixed DoT.

**Send:** Each Fracture tick number, with the stacks before it; Attack, Instinct Damage and Damage over Time in battle; Whether Fracture Amplification and Vulnerable were on.

Closes: docs/characters/arabella.md

### arabella-readings

**Question:** Arabella's readings the screenshots can't settle: (1) Does Observer's Pleasure's "+X% Damage Amount to this unit" raise her Fracture ticks (the calculator: yes)? (2) Is E1's "+50% Damage Amount" part of The Art of Unmaking's shown % ((200% + 50%) x the upgrade)? (3) Is node 5-1's bonus part of Diagonal Slash's shown %?

**Setup:** A battle with Arabella holding Observer's Pleasure IV (or the base card) and The Art of Unmaking. (2) needs E1; (3) node 5-1 unlocked.

**Steps:**
1. End a turn with Fracture on an enemy after playing Observer's Pleasure IV, and another turn without it, with the same stacks: (40% x stacks + 80%) / (40% x stacks) more means it reaches Fracture.
2. At E1, read The Art of Unmaking's %: 295% at Unique 9 means the +50% is part of it ((200% + 50%) x 1.18).
3. With node 5-1 on and Attack 500 or higher, read Diagonal Slash: 71% at Basic 1 means it's in the card's % ((60% + 10%) x 1.02).

**Send:** The Fracture ticks with and without Observer's Pleasure, and their stacks; The Art of Unmaking's % at E1; Diagonal Slash's %.

Closes: docs/characters/arabella.md

### olga-readings

**Question:** Olga's readings from the preview (the owner doesn't have her yet): (1) Does E4's Shard Erosion raise her Agony ticks, which other damage buffs don't (the calculator: yes)? (2) Does Insatiable Cravings V's "by 1%" leave Agony alone (the calculator: yes) and raise Fracture? (3) Do End of the Line and Reckoning take the Damage over Time stat (Rapacity: "treat as DoT")? (4) Is E1's "+200% Damage Amount" part of Reckoning's shown % ((400% + 200%) x the upgrade)? (5) Does Maelstrom of Oblivion's cap hold the three bonuses together at 300%? (6) Is node 5-1's bonus part of Reaping Slash's shown %?

**Setup:** A battle with Olga, once the owner has her. (1) needs E4, (4) E1, (6) node 5-1 unlocked.

**Steps:**
1. At E4, read one Agony hit with 0 and with 3 Shard Erosion, at the same Attack: 18% more means Shard Erosion reaches Agony.
2. With Insatiable Cravings V up and some harmful effects applied this turn, read an Agony hit and a Fracture tick, and again on a turn without: Agony unchanged, Fracture up by the stacks in %.
3. Change Damage over Time with a fragment and read Reckoning's damage at the same Rapacity: it moves with the stat if Rapacity counts as DoT.
4. At E1, read Reckoning's %: 600% at Unique 0 means the +200% is part of it.
5. Activate more than 300% worth of Fracture, Agony and Scorched in one turn (e.g. 4 Fracture, 5 Agony, 2 Scorched = 360%), then use the Ego skill: 700% means the cap is shared.
6. With node 5-1 on, read Reaping Slash: 105% at Basic 0 (110% with Damage over Time 6% or higher) means it's in the card's %.

**Send:** Attack, Instinct Damage and Damage over Time; Each Agony and Fracture hit, with the Shard Erosion and harmful effects; Reckoning's damage and Rapacity; Maelstrom of Oblivion's damage and the activations that turn; Reaping Slash's %.

Closes: docs/characters/olga.md

### fei-readings

**Question:** Fei's readings the preview screenshots can't settle (once the owner has Fei): (1) Does E1's "Increase Damage Amount of Inferno Rhapsody moved to hand by 100%" reach Inferno Rhapsody: Heaven too (the calculator: yes)? (2) Is node 5-1's "+5% Damage Amount to Fei's Azure Flame" part of Azure Flame's shown % ((100% + 5%) x the upgrade; the calculator)?

**Setup:** A battle with Fei: (1) needs E1 and Exorcist's Formation V (Inferno Rhapsody: Heaven) with Blazing War Dance; (2) node 5-1 unlocked.

**Steps:**
1. Play Blazing War Dance after gaining Descent, then play an Inferno Rhapsody: Heaven it moved to hand, and one drawn normally: x2 means E1 reaches it.
2. With node 5-1 on, read Azure Flame's % in hand: 105% at Basic 0 (110% at Attack 500 or higher) means it's in the card's %.

**Send:** Both Inferno Rhapsody: Heaven numbers (non-crit); Azure Flame's % with 5-1, and Fei's Attack.

Closes: docs/characters/fei.md

### luke-readings

**Question:** Luke's readings the preview screenshots can't settle (once the owner has Luke): (1) Do the Handgun Bullets (Magnum, Silver, Uranium, Tracer Shot) take the Signature Card Upgrade like other created cards (the calculator: yes)? (2) Is node 7's "+3% Damage Amount to Handgun Bullet" (+2% per 5% Critical Chance over 40%) part of the bullet's shown % ((85% + 3%) x the upgrade; the calculator), and node 5-1's on Single Shot too? (3) Which game version were the 2026-11-09 screenshots (the calculator: 841)?

**Setup:** A battle with Luke at Unique (Signature) level 1 or higher; nodes 5-1 and 7 unlocked, and Critical Chance 40% or higher for 7.

**Steps:**
1. Create a Magnum Shot and read its % in hand: 85% x the Signature upgrade (e.g. 87% at level 1) means bullets take it; 85% means they don't.
2. With node 7 on and Critical Chance at 40-44%, read Magnum Shot: (85% + 3%) x the upgrade means 7 is in the card's %. Repeat at 50% Critical Chance: + 7%.
3. With node 5-1 on, read Single Shot: (100% + 5%) x the Basic upgrade (+10% at Critical Chance 20% or higher) means it's in the card's %.
4. Read the game version on the title screen.

**Send:** Magnum Shot's % and Luke's Unique level; Magnum Shot's % with 7 and Luke's Critical Chance; Single Shot's % with 5-1; Game version.

Closes: docs/characters/luke.md

### kayron-readings

**Question:** Kayron's readings the screenshots of the locked character can't settle: (1) Is the Futility Oath of Vanity makes (100% / 150% / 200%) raised by the Signature upgrade (the calculator)? (2) Does Echoes of True Abyss' "+40 base Damage Amount for each created" count 3 Futility, and 5 from E1 (the calculator: 360%, 440%)? (3) Is Echo of Futility IV's "+150% Damage Amount for each X" part of the card's % like his "base" bonuses (the calculator)? (4) Does Potential 7's +5% Critical Damage (Attack 600 or higher) show on the stats screen (the calculator adds it in battle, like Rin's 7)? (5) Does E4's Echo of Paradox last the battle (the game names no duration; Prydwen "for 1 turn")?

**Setup:** Once you have Kayron: a battle with Oath of Vanity in the deck, Echoes of True Abyss and Echo of Futility IV. (1) needs a Unique level above 0; (2) needs E1 for its second half; (4) needs Attack 600 and node 7; (5) needs E4.

**Steps:**
1. Read a Futility's % in hand with Oath of Vanity: above 100% at a Unique level above 0 means it's raised.
2. Read Echoes of True Abyss' % in hand (or compare its damage with 240%): 360% means +40% x 3; at E1, 440% means E1's 2 count.
3. Play Echo of Futility IV with X = 2 and compare the damage with 150% + 2 x 150% = 450% of a 100% hit.
4. With node 7 on and Attack 600 or higher, read Critical Damage on the stats screen.
5. At E4, Exhaust a Futility, end the turn and read whether Echo of Paradox is still on Kayron.

**Send:** Futility's % and Kayron's Unique level; Echoes of True Abyss' % at E0 and E1; Echo of Futility IV's damage with X = 2 (non-crit); Critical Damage with and without node 7; Echo of Paradox after the turn ends.

Closes: docs/characters/kayron.md

## Measured

Each row is checked against the calculator on every test run.

| Test | Value | In game | Calculator | When | Result |
| --- | --- | --- | --- | --- | --- |
| final-attack | Attack in battle | 1272 | 1272.28 | 2026-10-20 (Owner) | Yes: Final ATK = screen x (1 + %) + flat. |
| crit-total-multiplier | Crit hit for a 572 non-crit hit | 1078 | 1078.79 | 2026-10-20 (Reddit post) | Yes: crit = non-crit x Crit DMG. |
| weakness-no-extra-factor | Strike on target, % | 290 | 290.02 | 2026-10-20 (Owner) | No: 204.24% x 1.42 = 290%. |
| strike-in-hand-and-on-target | In hand, % | 251 | 250.64 | 2026-10-25 (Owner) | In hand yes; on target about 0.3% low: see strike-rounding-gap. |
| strike-in-hand-and-on-target | On target, % | 357 | 355.91 | 2026-10-25 (Owner) | In hand yes; on target about 0.3% low: see strike-rounding-gap. |
| plus-rule | Dark Blade in hand, E6 only, % | 134 | 134 | 2026-11-12, game 853 (Owner) | Yes. Rei's Dark Blade (114% in the deck, 134% in hand with E6's "+20% Damage Amount to allies' Attack Cards", which reaches Rei herself): 4 Morale (+80%) shows 214%, a "100% Damage" to Basic Attack Cards 248% (it doubles the 114%, not the +20%), both that and a "+40% Damage" 288%. The damage follows the shown % (97, 154, 179 on one enemy at 507 Attack). |
| plus-rule | With 4 Morale, % | 214 | 214 | 2026-11-12, game 853 (Owner) | Yes. Rei's Dark Blade (114% in the deck, 134% in hand with E6's "+20% Damage Amount to allies' Attack Cards", which reaches Rei herself): 4 Morale (+80%) shows 214%, a "100% Damage" to Basic Attack Cards 248% (it doubles the 114%, not the +20%), both that and a "+40% Damage" 288%. The damage follows the shown % (97, 154, 179 on one enemy at 507 Attack). |
| plus-rule | With the "100%" buff, % | 248 | 248 | 2026-11-12, game 853 (Owner) | Yes. Rei's Dark Blade (114% in the deck, 134% in hand with E6's "+20% Damage Amount to allies' Attack Cards", which reaches Rei herself): 4 Morale (+80%) shows 214%, a "100% Damage" to Basic Attack Cards 248% (it doubles the 114%, not the +20%), both that and a "+40% Damage" 288%. The damage follows the shown % (97, 154, 179 on one enemy at 507 Attack). |
| plus-rule | With the "100%" and "+40%" buffs, % | 288 | 288 | 2026-11-12, game 853 (Owner) | Yes. Rei's Dark Blade (114% in the deck, 134% in hand with E6's "+20% Damage Amount to allies' Attack Cards", which reaches Rei herself): 4 Morale (+80%) shows 214%, a "100% Damage" to Basic Attack Cards 248% (it doubles the 114%, not the +20%), both that and a "+40% Damage" 288%. The damage follows the shown % (97, 154, 179 on one enemy at 507 Attack). |
| plus-rule | Hit with 4 Morale / hit with E6 only (154 / 97) | 1.5876288659793814 | 1.6 | 2026-11-12, game 853 (Owner) | Yes. Rei's Dark Blade (114% in the deck, 134% in hand with E6's "+20% Damage Amount to allies' Attack Cards", which reaches Rei herself): 4 Morale (+80%) shows 214%, a "100% Damage" to Basic Attack Cards 248% (it doubles the 114%, not the +20%), both that and a "+40% Damage" 288%. The damage follows the shown % (97, 154, 179 on one enemy at 507 Attack). |
| plus-rule | Hit with the "100%" buff / hit with E6 only (179 / 97) | 1.8453608247422681 | 1.85 | 2026-11-12, game 853 (Owner) | Yes. Rei's Dark Blade (114% in the deck, 134% in hand with E6's "+20% Damage Amount to allies' Attack Cards", which reaches Rei herself): 4 Morale (+80%) shows 214%, a "100% Damage" to Basic Attack Cards 248% (it doubles the 114%, not the +20%), both that and a "+40% Damage" 288%. The damage follows the shown % (97, 154, 179 on one enemy at 507 Attack). |
| multiplicative-summed-or-chained | Shadow Dagger in hand, % | 135 | 134.8 | 2026-11-01, game 841 (Owner) | They add up: four "by X%" buffs on Tressa's Shadow Dagger show 164%; multiplied they would show 173%. These numbers use the rounded card %: see card-pct-rounding. |
| multiplicative-summed-or-chained | Its hit | 139 | 138.66 | 2026-11-01, game 841 (Owner) | They add up: four "by X%" buffs on Tressa's Shadow Dagger show 164%; multiplied they would show 173%. These numbers use the rounded card %: see card-pct-rounding. |
| multiplicative-summed-or-chained | After an Exhaust, in hand, % | 164 | 163.6 | 2026-11-01, game 841 (Owner) | They add up: four "by X%" buffs on Tressa's Shadow Dagger show 164%; multiplied they would show 173%. These numbers use the rounded card %: see card-pct-rounding. |
| multiplicative-summed-or-chained | The same card with 4 Agony on the target: E2 only shows on target, so still 164% in hand | 164 | 163.6 | 2026-11-01, game 841 (Owner) | They add up: four "by X%" buffs on Tressa's Shadow Dagger show 164%; multiplied they would show 173%. These numbers use the rounded card %: see card-pct-rounding. |
| multiplicative-summed-or-chained | On a target with 4 Agony, % | 184 | 183.6 | 2026-11-01, game 841 (Owner) | They add up: four "by X%" buffs on Tressa's Shadow Dagger show 164%; multiplied they would show 173%. These numbers use the rounded card %: see card-pct-rounding. |
| multiplicative-summed-or-chained | Its hit | 189 | 188.86 | 2026-11-01, game 841 (Owner) | They add up: four "by X%" buffs on Tressa's Shadow Dagger show 164%; multiplied they would show 173%. These numbers use the rounded card %: see card-pct-rounding. |
| agony-tick | Hits of a tick at 8 Agony | 8 | 8 | 2026-11-01 (Owner) | One hit per stack, each can crit; Attack, Damage over Time and Enemy DEF raise it, Vulnerable does not. Halving rounds down (9 to 4, 1 to 0). Cursed Gouge is the same tick. |
| agony-tick | Agony hit, test enemy, 731 Attack | 53 | 53.08 | 2026-11-01 (Owner) | One hit per stack, each can crit; Attack, Damage over Time and Enemy DEF raise it, Vulnerable does not. Halving rounds down (9 to 4, 1 to 0). Cursed Gouge is the same tick. |
| agony-tick | Its crit, Critical Damage 125% | 66 | 66.35 | 2026-11-01 (Owner) | One hit per stack, each can crit; Attack, Damage over Time and Enemy DEF raise it, Vulnerable does not. Halving rounds down (9 to 4, 1 to 0). Cursed Gouge is the same tick. |
| agony-tick | Agony hit, test enemy, 747 Attack, Vulnerable target | 54 | 54.24 | 2026-11-01 (Owner) | One hit per stack, each can crit; Attack, Damage over Time and Enemy DEF raise it, Vulnerable does not. Halving rounds down (9 to 4, 1 to 0). Cursed Gouge is the same tick. |
| agony-tick | Agony hit, weak enemy, 731 Attack | 61 | 60.88 | 2026-11-01 (Owner) | One hit per stack, each can crit; Attack, Damage over Time and Enemy DEF raise it, Vulnerable does not. Halving rounds down (9 to 4, 1 to 0). Cursed Gouge is the same tick. |
| agony-tick | Agony hit, weak enemy, 559 Attack (Damage over Time taken as 3.2%) | 47 | 46.56 | 2026-11-01 (Owner) | One hit per stack, each can crit; Attack, Damage over Time and Enemy DEF raise it, Vulnerable does not. Halving rounds down (9 to 4, 1 to 0). Cursed Gouge is the same tick. |
| agony-tick | Agony hit, weak enemy, 727 Attack, Damage over Time 18.3% | 69 | 69.41 | 2026-11-01 (Owner) | One hit per stack, each can crit; Attack, Damage over Time and Enemy DEF raise it, Vulnerable does not. Halving rounds down (9 to 4, 1 to 0). Cursed Gouge is the same tick. |
