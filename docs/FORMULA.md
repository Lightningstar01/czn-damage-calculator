# CZN damage formula — research notes

Last reviewed: 2026-10-20. Status of each piece: **Sourced** (published guide), **User** (the
owner's own knowledge/testing), **Unconfirmed** (assumption, exposed as a toggle or input).

## 1. Final stats — Sourced (Prydwen)

```
Final ATK = ((Base ATK + Partner ATK) x (1 + Memory ATK% + Potential ATK%) + Fragment flat + Affection flat)
            x (1 + Partner ATK% + Equipment ATK%) + Equipment flat
```
DEF and HP use the same structure. Equipment % stacks additively with Partner %.

**Workbook entry — User (2026-10-20):** the workbook no longer rebuilds Final ATK from parts.
The owner copies Attack, Defense, etc. from the in-game detailed stats screen for each build.
That Attack includes the partner's base ATK and memory fragments, but NOT partner effects
(e.g. +16% Attack, +5% Weakness DMG) or equipment, which is save-data specific and applies only
in battle (slot 1 always gives flat ATK; any piece may give ATK%). Those go in the Partner
Effects & Equipment table: Final ATK = screen ATK x (1 + ATK%) + flat ATK. **Confirmed (User):**
Mei Lin 1033 x 1.16 + 74 = 1272, matching her in-battle Attack. Elemental DMG% uses the stat
row for the character's element (dropdown).

## 2. Card multiplier — Sourced (Prydwen), with User rules

```
Final Card Mult = ((Base + Potential additive base) x (1 + Potential mult) x Generic multiplicative
                   + Generic additive)
                  x (1 + Elemental advantage) x (1 + Vulnerable) x (1 - Enemy DR) x (1 - Weakness)
```
- Potential multiplicative: x1.2 on Basic, Neutral and Unique cards (Prydwen).
- Elemental advantage = the **Weakness Damage** stat on the stats screen, a total multiplier
  with base 125% (User; Mei Lin's potential adds up to 12%). Does not apply to non-active
  damage such as extra-attack bolts (Prydwen).
- **No extra x1.25 on top of Weakness DMG — User test (2026-10-20):** Mei Lin Strike showed
  204% and 290% when targeting a Passion-weak enemy; 204.24% x 1.42 (137% screen + 5% Marianne)
  = 290.0%. The Reddit post's 270% (which seemed to need an extra x1.25) is unexplained, but
  its inputs may have been incomplete. The "Extra weakness factor" setting (workbook Settings!B8) stays at 0% as a test hook.
- Cards: enter the damage % the card shows in-game; it already includes potentials and
  epiphany (User), so the workbook has no potential columns.
- Vulnerable / Weakness debuff: one stack is used up per hit, in card-table order across
  every play of every card (User: "one sequence"). Every hit counts, including Fixed damage
  (**Unconfirmed**).
- Same in-game test: non-crit hit 500 with Final ATK 1272.28 back-solves to an enemy DEF
  multiplier of about 0.387 (1st enemy targeted; more data needed).
- Vulnerable x1.5, used up per hit (Prydwen; per-hit use from the owner).
- Weakness x0.75 (Prydwen). Per-hit use is **Unconfirmed** (assumed same as Vulnerable).
- Fixed damage ignores all multipliers (Prydwen). Whether it can crit: **Unconfirmed**, assumed not.

**Additive vs multiplicative wording — User:** after a localization update, a buff written
with a leading "+" (e.g. "+30% Damage Amount") is additive; one without "+" is multiplicative.
No public source found for this. The workbook auto-classifies by "+" and allows an override.

**Multiplicative buffs combine by summing — User belief**, supported by UltimateGacha, which
cites Reddit testing. Prydwen's formula is ambiguous. Toggle: the "Multiplicative buffs combine" rule on the website Settings tab (workbook Settings!B15), Summed/Chained.

**Morale — Sourced (Game8) + User:** +20% flat per stack in the additive bucket (Game8: 2 stacks
turn a 100% card into 140%). Max 20 stacks (owner). UltimateGacha claims Morale is a late
multiplier; this conflicts with Game8 and the owner, and was rejected.

## 2a. Partners, presets, Ravaged, Weakness Attack — User (2026-10-20)

- **Class-limited partner effects — User:** any partner can go with any character, but the
  partner's class-limited effects only work when the partner's class matches the character's.
  Base stats and the ego skill always apply. Presets mark each effect "Class-limited? Yes/No";
  the Template switches a class-limited effect off on a mismatch.
- **Partner base stats** are already in the stats-screen numbers, so the Presets tab records
  them for reference only (not added again).
- **Marianne (Striker) — User:** 144 HP, 5 DEF, 155 ATK; class-limited: +16% Attack (as ATK%),
  +5% Weakness DMG, "15% increased damage to Ravaged enemies", and Basic Attack cards always
  count as Weakness Attacks.
  - The Ravaged 15% has no "+", so it's multiplicative under the owner's "+" rule.
    **Unconfirmed** that the "+" rule covers partner passives.
- **Ravaged — User:** Ravaged enemies take more damage. The size is **Unconfirmed**:
  the "Ravaged: extra damage taken" setting (workbook Settings!B12, default 0%) multiplies the card mult by (1 + it) when the card's
  "Target Ravaged?" is Yes. Buffs with Condition "Ravaged only" apply only to those cards.
- **Weakness Attack — User:** a buff of type "Weakness Attack" makes Weakness DMG apply to
  matching cards, as if the card's "Weakness DMG applies?" were Yes. It ignores hit scope
  (all hits). **Unconfirmed:** whether it also applies to non-active damage.

## 2b. Memory fragment sets — User (2026-10-25), website only

- 6 fragment slots per character. A set is **either** a 2-piece set **or** a 4-piece set (one
  bonus, never both), so a build has three 2-piece sets, or one 4-piece and one 2-piece set.
- Set **stat** bonuses are already on the stats screen, so presets mark them `onStatsScreen`
  and they are listed for reference only (not added again). Set **buffs** (damage, conditional)
  are added like partner buffs, with a switch per build.
- The website has three set dropdowns per build; it warns past 6 pieces, and a set picked twice
  counts once (owner: two copies of a set never stack).
- Set texts are from Prydwen, supplied by the owner. "Damage Amount by X%" follows the "+" rule
  literally (owner): no "+" = multiplicative, "+X%" = additive.
- **Per-card crit (website):** buffs of type "Crit Chance" / "Crit DMG" add to the final crit stats
  of matching cards only (Crit DMG stays a total multiplier: +35% makes 188.6% into 223.6%). The crit
  cap applies after them.
- **Matching (website):** "Applies to" accepts `A & B` (all must match) and `A/B` (any one), plus
  `N+ hits` (from the card's hit count), and the card kind (`DoT`, `Extra Attack`). The card's
  own fields match too (owner): card type (`Attack`, `Skill`, `Upgrade`), element (`Passion`...),
  and cost (`1-cost`, `2+ cost`; Ego skills have no AP cost). Other keywords (Exhaust, Basic
  Attack...) are tags.
- Triggered set buffs default to on at max stacks (owner); switch off or lower them per build.
- Prelude to a Hero ("+15% ... max 15%, max 2 stacks") and Sanguine Thorn ("+25% ... max 25%,
  max 2 stacks") give 15% / 25% total; the "stacks" are only turns of duration (owner).
- Conditional set buffs the calculator can't check (vs Agony, 3+ cards in hand, at 3 stacks...)
  stay on by default (owner); switch them off per build when they don't apply.

## 3. Damage — Sourced (Prydwen)

```
ATK card: Damage = Card Mult x Final ATK x 0.35 x (1 + Elemental DMG%) x (1 + Mechanic DMG%)
                   x Enemy DEF multiplier x (1 + Crit DMG)
DEF card: same, with (Final ATK x 0.3 + Final DEF x 2.1) in place of Final ATK
```
- Mechanic DMG% = Extra DMG% or DoT DMG% (fragment substats), applied only to that damage kind.
- Enemy DEF: no known formula; it's an input to back-solve from a real hit.
- Crit DMG — **Confirmed (User + in-game data)**: the stat-screen Crit DMG is the total
  multiplier, so crit hit = non-crit x Crit DMG (Prydwen's "(1 + Crit DMG)" is wrong).
  Evidence: Reddit post (Mei Lin, 188.6% Crit DMG) shows 572 non-crit and 1078 crit;
  572 x 1.886 = 1079. The community calculator sheet uses the same rule. No toggle.
- Expected per hit = Non-crit x (1 + CritRate x (CritMult - 1)); each hit crits separately.

## 2c. Card presets — User (2026-10-25), website only

- Every character's cards (base + every epiphany; mythic cards like Flame Dragon's Sovereignty
  have none) are imported from Prydwen, which the owner confirmed has the right "+" wording
  (2026-10-25); other sites (OffBanner outdated, Game8 adds "+" everywhere) are not used.
  `scripts/import_prydwen.py` writes `web/src/data/prydwen/<slug>.json`; our buffs and notes go in
  `web/src/data/characters/<slug>.ts`. Picking a card copies it into the card library with the
  **base** values; the owner edits the % to the in-game number (which includes potentials).
- Importer reading of the card text (check against the game; corrections go in the additions file):
  damage % and hits from the first "N% Damage" / "N% x H Damage" / "N% Damage x H" phrase;
  "Defense-based" = DEF scaling, "Fixed" = Fixed; Piercing only ignores enemy shields (User,
  2026-10-25; shields aren't modeled, so it counts as normal damage); for "100% (200%) Damage" the
  first % is used. Basic = a starting card with no epiphanies (User; tags Basic, plus Basic Attack
  or Basic Skill). Each character has one Basic Skill (User; Prydwen lists two for Maribell). The Weakness Attack tag means Weakness DMG applies (User). Ego skills are type
  Skill with tag "Ego Skill" and no AP cost: damaging ego skills are not Attack cards (User,
  2026-10-25). X-cost/unplayable cards have no cost and a tag. Status cards are type Skill with tag "Status".
- Buffs are added character by character with the owner (only Mei Lin's so far).
- **Potentials** are imported as reference text only: their stats are on the stats screen and
  their card upgrades in the in-game card % (User, 2026-10-25), including the Attack-threshold
  nodes. Not added again.
- **Manifest Ego (dupes)** can't be switched off in-game, so each build has a level E0-E6 (User,
  2026-10-25). Ego buffs carry `egoLevel` and only count from that level; set another build to a
  different level to see what a dupe adds. Known gap: an E level that raises potential levels
  (Mei Lin's E5) changes the in-game card %, which the calculator doesn't recompute.
- A card's buffs (e.g. Flame Dragon's Jewel's Attack damage, Spirit of the Aromata's per-card
  stacks) show as preset buffs while the card is in the library, on by default, switch per build.
  The "+" rule applies: "by 20%" = multiplicative, "+20%" = additive.
- Extra hits (Combo, Rising Dragon Spire V, Ego skill) are set per play in the rotation; a play's
  hit count also drives `N+ hits` matching.
- Jewel's "1 Passion Weakness to the target" is a Weakness Attack buff on all cards.
  **Unconfirmed** whether the first Attack card already gets it.
- Aromata stacks are one number for the whole rotation, so early plays are over-counted.
- Not modeled: Embers, Tenacity Damage, shields, draw/cost effects. Jewel V's Ravage hit is a
  300% card with Target Ravaged on; each play is one Ravage.

## 4. Open questions / to verify

- [x] Compared with the community calculator sheet (CZNRedditSheet.xlsx) and its Reddit
      post, 2026-10-20. Its Final ATK leaves Partner ATK out of the % layer (pre-partner-change
      formula; ours matches the in-game 1121). Card mult and damage line match ours.
- [ ] Idea for later: enemy DEF multiplier may be 100 / enemy DEF. One data point, from that
      sheet's note: Lv50 (Stage 3) Kentris, Nebula event, 255 DEF -> 0.392. **Unconfirmed**.
- [ ] Confirm the "+" rule with an in-game test (one buff of each kind on the same card).
- [ ] Summed vs Chained multiplicative buffs.
- [x] Crit DMG: total multiplier (confirmed 2026-10-20).
- [ ] Does Weakness use up a stack per hit or per card?
- [ ] Can fixed damage crit?
- [ ] Where Weakness DMG and partner "+X% damage" buffs sit relative to Morale.
- [x] Extra x1.25 on top of Weakness DMG: none (Mei Lin test, 2026-10-20).
- [x] Partner/equipment ATK% multiplies the stats-screen Attack (Mei Lin 1272 matches).
- [ ] How much extra damage Ravaged enemies take ("Ravaged: extra damage taken" setting, workbook Settings!B12; 0% for now).
- [ ] Is Marianne's Ravaged 15% multiplicative (no "+") or additive?
- [ ] Gather more hits to pin down the enemy DEF multiplier (later).

## Sources

- Prydwen damage formula (updated 2026-04-11): https://www.prydwen.gg/chaos-zero-nightmare/guides/damage-formula
- Game8 Morale: https://game8.co/games/Chaos-Zero-Nightmare/archives/561290
- UltimateGacha formula breakdown: https://ultimategacha.com/chaos-zero-nightmare-skill-damage-formula-breakdown-how-modifiers-combos-stack/
- UltimateGacha crit overview: https://ultimategacha.com/chaos-zero-nightmare-critical-rate-break-mechanics-overview/
- STOVE forum test thread (confirms Prydwen matched testing): https://page.onstove.com/chaoszeronightmare/en/view/11367707
- CZN Save Data Calculator (community tool): https://czn-save-cal.web.app/
