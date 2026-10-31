# In-game tests

Written from `tests/ingame/checks.ts` by the tests; change it there, not here.

29 to run, 4 measured. Send the numbers under **Send** with the game version; they then become tests here and close the question.
Use non-crit hits unless the test is about crits, and note anything else that was on.

## To run

### plus-rule

**Question:** Is "+X%" additive and "X%" without a "+" multiplicative?

**Setup:** A card at a known %, one "+X%" buff and one "by X%" buff you can turn on separately (for example Morale for "+", a card that says "by X%").

**Steps:**
1. Read the card % with neither buff.
2. Read it with only the "+" buff.
3. Read it with only the "by X%" buff.
4. Read it with both.

**Send:** The four card %s; The buffs' wording.

Closes: docs/FORMULA.md, Buff types

### multiplicative-summed-or-chained

**Question:** Do two multiplicative buffs add up (1 + a + b) or multiply ((1 + a) x (1 + b))?

**Setup:** A card at a known %, two different "by X%" buffs, as large as you can find (the gap is small with small buffs).

**Steps:**
1. Read the card % with neither.
2. Read it with each one alone.
3. Read it with both.
4. Compare: a 100% card with buffs of 50% and 30% is 180% if they add up, 195% if they multiply.
5. If the shown % doesn't change with these buffs, compare the damage of a non-critical hit on the same enemy instead.

**Send:** The four card %s (or damage numbers); The buffs' wording.

Closes: Settings: Multiplicative buffs combine

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

**Setup:** Rossweisse node 7 ("for every 20 Attack exceeding 600") or Mei Lin node 7, with Attack just below and just on a step.

**Steps:**
1. Read the card % or Weakness Damage with Attack one point under a step, on the step, and one over.

**Send:** Attack (with decimals if shown); The node's value at each point.

Closes: src/engine/buffs.ts: presetBuffValue (a float such as 0.69 can come out one step short); backlog item 15

### card-other-element

**Question:** Does a card of another element than its character use that element's Elemental DMG on the stats screen, and do battle boosts to Elemental DMG% reach it? The calculator says yes to the first, no to the second.

**Setup:** Only if the game lets a character hold a card of another element (neutral or seasonal cards, say), and a battle boost to Elemental DMG%. The same enemy, not weak to either element.

**Steps:**
1. Hit with that card and with one of the character's own element, non-crit, without the boost.
2. Repeat with the boost.

**Send:** The four damage numbers; Both cards' %; Elemental DMG of both elements on Detailed Stats; The boost.

Closes: docs/FORMULA.md, Final stats; src/engine/calc.ts: cardElement

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

Closes: docs/FORMULA.md, Target debuffs

### weakness-debuff-per-hit

**Question:** Same for the Weakness debuff on you: per hit, or per card?

**Setup:** A multi-hit card while you have 1 stack of the Weakness debuff.

**Steps:**
1. Play the card; compare its hits and the stacks left.

**Send:** The numbers of each hit; Stacks before and after.

Closes: docs/FORMULA.md, Target debuffs

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

**Question:** Is the enemy DEF multiplier 100 / enemy DEF? One data point so far: Lv50 Kentris (255 DEF) = 0.392; Mei Lin's tests back-solve to 0.387 and 0.3733.

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

### haru-decrease-in-sum

**Question:** Is the decrease from Haru's E2 / E6 in the same multiplicative sum as "by X%" buffs?

**Setup:** Haru with E2, with AP short of Cost, and a "by X%" buff.

**Steps:**
1. Read the card % with the decrease alone, with the buff alone, with both.

**Send:** The three card %s, and the one with neither.

Closes: docs/characters/haru.md

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

## Measured

Each row is checked against the calculator on every test run.

| Test | Value | In game | Calculator | When | Result |
| --- | --- | --- | --- | --- | --- |
| final-attack | Attack in battle | 1272 | 1272.28 | 2026-10-20 (Owner) | Yes: Final ATK = screen x (1 + %) + flat. |
| crit-total-multiplier | Crit hit for a 572 non-crit hit | 1078 | 1078.79 | 2026-10-20 (Reddit post) | Yes: crit = non-crit x Crit DMG. |
| weakness-no-extra-factor | Strike on target, % | 290 | 290.02 | 2026-10-20 (Owner) | No: 204.24% x 1.42 = 290%. |
| strike-in-hand-and-on-target | In hand, % | 251 | 250.64 | 2026-10-25 (Owner) | In hand yes; on target about 0.3% low: see strike-rounding-gap. |
| strike-in-hand-and-on-target | On target, % | 357 | 355.91 | 2026-10-25 (Owner) | In hand yes; on target about 0.3% low: see strike-rounding-gap. |
