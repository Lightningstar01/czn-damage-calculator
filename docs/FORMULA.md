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
Stats-screen check (User, 2026-10-25): Mei Lin's 637 base = 622 (character + partner) + 15
affinity; the fragments' Attack % multiply only the 622 (622 x 56.7% + 43 flat = +396; removing the
25% piece drops 156). Her in-battle Attack is 1198 + 74 equipment = 1272, as calculated.

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
  its inputs may have been incomplete. The "Extra weakness factor" setting stays at 0% as a test hook.
- Cards: enter the damage % the card shows in-game; it already includes potentials and
  epiphany (User). The website can instead take the base % plus upgrade levels (see 2c).
- Vulnerable / Weakness debuff: old workbook: one stack is used up per hit, in card-table order across
  every play of every card (User: "one sequence"). Every hit counts, including Fixed damage
  (**Unconfirmed**). Website (2026-10-26): switched on per play and counts on every hit of it
  (see Team snapshot).
- Same in-game test: non-crit hit 500 with Final ATK 1272.28 back-solves to an enemy DEF
  multiplier of about 0.387 (1st enemy targeted; more data needed).
- Second test enemy (User, 2026-10-25, DEF guessed): Strike 592 and Rising Dragon Spire V 641
  (crit 1070) non-crit both fit an enemy DEF multiplier of 0.3733 (0.3735 if the game rounds down).
- Vulnerable x1.5, used up per hit (Prydwen; per-hit use from the owner).
- Weakness x0.75 (Prydwen). Per-hit use is **Unconfirmed** (assumed same as Vulnerable).
- Fixed damage ignores all multipliers (Prydwen). Whether it can crit: **Unconfirmed**, assumed not.
  Fixed damage = Fixed % x Final ATK x a constant (Settings, default 0.35 like other cards): the owner thinks it is
  ATK-based (2026-10-28, not sure); **Unconfirmed**, test in-game.

**Additive vs multiplicative wording — User:** after a localization update, a buff written
with a leading "+" (e.g. "+30% Damage Amount") is additive; one without "+" is multiplicative.
No public source found for this. Buff types are picked by this rule.

**Multiplicative buffs combine by summing — User belief**, supported by UltimateGacha, which
cites Reddit testing. Prydwen's formula is ambiguous. Toggle: the "Multiplicative buffs combine" rule on the Settings tab, Summed/Chained.

**Morale — Sourced (Game8) + User:** +20% flat per stack in the additive bucket (Game8: 2 stacks
turn a 100% card into 140%). Max 20 stacks (owner). UltimateGacha claims Morale is a late
multiplier; this conflicts with Game8 and the owner, and was rejected.

## 2a. Partners, presets, Ravaged, Weakness Attack — User (2026-10-20)

- **Class-limited partner effects — User:** any partner can go with any character, but the
  partner's class-limited effects only work when the partner's class matches the character's.
  Base stats and the ego skill always apply. Presets mark each effect "Class-limited? Yes/No";
  the calculator switches a class-limited effect off on a mismatch.
- **Partner base stats** are already in the stats-screen numbers, so the Presets tab records
  them for reference only (not added again).
- **Marianne (Striker) — User:** 144 HP, 5 DEF, 155 ATK; class-limited: +16% Attack (as ATK%),
  +5% Weakness DMG, "15% increased damage to Ravaged enemies", and Basic Attack cards always
  count as Weakness Attacks.
  - The Ravaged 15% has no "+", so it's multiplicative under the owner's "+" rule.
    **Unconfirmed** that the "+" rule covers partner passives.
- **Ravaged — User:** Ravaged enemies take more damage. The size is **Unconfirmed**:
  the "Ravaged: extra damage taken" setting (default 0%) multiplies the card mult by (1 + it) when the card's
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
  `scripts/import_prydwen.py` writes `src/data/prydwen/<slug>.json`; our buffs and notes go in
  `src/data/characters/<slug>.ts`. Picking a card copies it into the card library with the
  **base** values; the build's card upgrade potentials are applied (below).
- Importer reading of the card text (check against the game; corrections go in the additions file):
  damage % and hits from the first "N% Damage" / "N% x H Damage" / "N% Damage x H" phrase;
  "Defense-based" = DEF scaling, "Fixed" = Fixed; Piercing only ignores enemy shields (User,
  2026-10-25; shields aren't modeled, so it counts as normal damage); for "100% (200%) Damage" the
  first % is used. Basic = a starting card with no epiphanies (User; tags Basic, plus Basic Attack
  or Basic Skill). Each character has one Basic Skill, Maribell two (User, 2026-10-25). The Weakness Attack tag means Weakness DMG applies (User). Ego skills are type
  Skill with tag "Ego Skill" and no AP cost: damaging ego skills are not Attack cards (User,
  2026-10-25). X-cost/unplayable cards have no cost and a tag. Status cards are type Skill with tag "Status".
- Buffs are added character by character with the owner (only Mei Lin's so far).
- **Potentials**: stat nodes are on the stats screen (User, 2026-10-25), so they're reference text.
  The card upgrade nodes are modeled (website only, User 2026-10-25):
  - **Basic Card Upgrade** raises Basic cards; **Signature Card Upgrade** (in-game name; Prydwen
    says "Unique Card Upgrade") raises all the character's other cards: the non-basic starting
    card, the 4 other cards, their epiphanies and the cards they generate, whatever the Unique tag
    says. Not Ego skills (their upgrades come from Manifest Ego). Common/Neutral Card Upgrade
    (cards from other characters) is not modeled yet.
    Exception (User, 2026-10-27, from the in-game epiphany screen): Mei Lin's Flame Dragon's Jewel V shows
    300% while Spire and Sovereignty show their upgrade; the owner thinks damage from a condition (On Ravage)
    instead of an Attack card isn't raised. Only Jewel V is marked (`upgrade: null`); other characters' non-basic
    starting cards stay Signature until checked.
  - In-game card % = base % x (1 + 2% x level) (Settings: per level). Levels 0-10 per build
    (default 0; in-game "by 12%" = level 6). The Manifest Ego levels whose text says "+3 levels" (E5 for most,
    E3 for some, both E3 and E5 for 12 characters such as Mika; read from the import) each add 3 (max 13 or 16 = 32%;
    Mika's Water Arrow 132% at Basic 10 and E6, owner's screenshots 2026-10-28).
  - Raises ATK- and DEF-scaling damage (User). Fixed damage: **Unconfirmed**, a Settings toggle
    (default off). In-game, Orlea's Annoying I shows its Fixed 40% unraised but its Heal raised (228% at Signature 7),
    which fits the default; card text marks Fixed damage %s as `{F40%}`.
  - Library cards store the base % with their upgrade (Basic / Signature / none). Own cards with no
    upgrade use the % as shown in-game. Save v8: preset cards still at the base % got their upgrade;
    edited ones kept their in-game % with no upgrade.
  - Potential nodes that raise one card's damage (Mei Lin 5-1: "+5% Strike Damage", +5% more above
    500 Attack) are part of the in-game card % (User: Strike shows 132% at Basic Card Upgrade 10 =
    100% x 1.2 x 1.1). They are buffs of type **Card %**: card % = base x (1 + upgrade levels x 2%)
    x (1 + sum of Card % buffs), only on cards with an upgrade (entered at base %).
    The "above 500 Attack" part is one buff with the node (owner, 2026-10-27): it adds the extra +5% by
    itself when the stats-screen Attack is above 500 (`attackBonus`).
  - **Rossweisse** (owner's screenshots, 2026-10-27; E1, Basic 1, Signature 10): every in-game % = Prydwen's
    base x 1.2. Not raised by the upgrade: the "+X% base Damage Amount" numbers (Sword Tassel +80%, Flicker
    Blade (Unbound) +120% per X, Radiant Sword Flow IV +50%) and the Ego skill (1,200%; Prydwen has 200%, wrong).
    Prydwen also lacks the base Shard:Light / Shard:Dark (80% base, 96% in-game), added as extra cards.
- **Base %** (User, 2026-10-27): "+X% base Damage Amount" is added to the card % as shown (after the
  potential): card % = base x upgrade + Base %. Mult then multiplies it like the rest of the card %
  (**Unconfirmed**: the owner said "added to the shown %"; whether the multiplicative buffs raise it too isn't tested).
- **Final** (User, 2026-10-27): "final Damage Amount" buffs are their own multiplier, x (1 + sum of the final
  buffs), after everything else. Rossweisse: Kyrken's Aegis on Flicker Blade (15%, E1 20%), E2 20%, E6 Blade
  Poised (15% Attack cards, 25% Flicker Blade = 15% + 10%, as final buffs add up).
- **Kyrken's Aegis below E1** (User, 2026-10-27): Attack Cards 20%, final on Flicker Blade 15% (E1: 30% / 20%).
  An effect with `egoBelow` is off from that Ego level, where another effect replaces it.
- **Shard activations** (User, 2026-10-27): "activate effect" (the shard's trigger, Sword Resonance I / V,
  Radiant Sword Flow II, Blade of the Cycle V on Shield Break) deals the card's full damage again: each one
  is another play of that card in the attack list.
- **Flickering White Night's Fixed damage** (User, 2026-10-27): 30% (E3 60%) of the damage of the next Equilux
  (Flicker Blade) play is added to that play as Fixed damage (non-crit, crit and expected each x the share).
- **Blade Afterimage** (E2, User, 2026-10-27): damage from an effect, not a card. An extra card (120%, no upgrade,
  type Skill, so no "Attack Card" buffs) you add once per Light / Dark activation. **Unconfirmed**: whether it's an
  Extra Attack, gets the Signature upgrade or the Attack-card buffs; the owner has E2 to test.
- **Brand of the Cycle** ("Increase Damage Amount taken from Rossweisse by 20%"): 20% multiplicative at any number
  of Brands, so a per-play counter that is 1 (on) or 0.
- **Rossweisse Potential 7**: +5% additive on Justice cards from 600 stats-screen Attack, +2% for every full 20
  Attack above 600, max +10% more (`minAttack`, `attackBonus.every`). Not counted: Radiant Sword Flow / I discard damage.
- **Tiphera** (owner's screenshots, 2026-10-28; Basic 1, Signature 6): every in-game % = Prydwen's base x upgrade
  (Creation and Destruction 120% -> 134%). Prydwen's Ego skill has the E3 numbers ("3 times"); in-game base is 2.
  - Archetype cards show Heal / Shield 67%, Prydwen 50%: (50% + Potential 5-1's +5% +5% at Defense above 250) x 1.12
    matches, so the card text shows it that way. Heal and shield only, no damage.
  - **Archetype: △ / Event Horizon** (User, 2026-10-28): "Increase Damage Amount of the first Hit of next Attack Card
    by 30% / 40%" reaches the next Attack card of **any ally** (`allies`), first hit only, multiplicative (no "+").
    Per-play counters: △ stacks (30% each, max 300%; E6 35%, max 350%; E2's △ shape card is one more), Event Horizon on/off.
    Not counted: Event Horizon's Form Upgrade (+100% to a random effect) and Form Convergence's "Double a random effect".
  - **Harmonization "Double all effects"** (User, 2026-10-28) doubles the card % (134% -> 268%): a Card % buff of +100%,
    switched on per play. Creation and Destruction III's Retain ("Increase all effects by 100% until activated, max 4
    times") is the same, +100% per stack.
  - **C&D V "150% for each Cost of this card"** (User, 2026-10-28): the in-game % (168%) x the Cost, set on each play
    (1-9, the card's 5 by default): Cost 3 = 168% x 3. Cards with `perCost` get a Cost setting per play (`RotationPlay.cost`).
  - Potential 7 (+10% Crit DMG of allies at Defense above 300) is an allies stat with a hint; E4 Power of Archetype is
    5% multiplicative each on Attack cards, Order and Defense-Based Damage (DEF cards), per-play stacks (max 2), allies.
- **Orlea** (owner's screenshots, 2026-10-28; E0, Basic 1, Signature 7 = x1.14): every in-game % = Prydwen's base x upgrade
  (Annoying III 450% -> 513%), except Fixed damage % and the buff %s (Softie, Swiftie's Retain, Sacred Censer IV / V).
  - Prydwen's Heaven's Healing is "Healing of Light" in-game, and Potential 3-1's 50% chance to create a Creation★ is on
    it (Prydwen: on Attack, My Minions). Potential 5-1 "Healing of Light's Healing +10%" is read as +10% base heal
    (**Unconfirmed**; the owner hasn't unlocked 5-1 yet, 2026-10-28: Heal 102%).
  - Base Annoying's Heal 20% isn't raised in-game either (Annoying I's Heal is); the text shows 20% as is.
  - Creation cards (Softie / Swiftie / Sturdie ★-★★★) evolve, so every card that creates one brings all nine into the deck.
  - **Softie** (User, 2026-10-28): "Increase Damage Amount by 10% for 1 turn" and "Retain: Increase Damage Amount of the
    next Attack Card activated by 10% (max 350%)" raise **any ally's** damage, multiplicative. Per-play counters: Softies
    used this turn, turns retained (max 350% / the %: ★ 35, ★★ 17, ★★★ 10 stacks).
  - **Swiftie "Retain: +40% Damage Amount"** (User, 2026-10-28) adds up every turn it is retained (★★ +80%, ★★★ +150%),
    additive; per-play counter Swiftie retains. Sacred Censer IV "next Swiftie by 40%": multiplicative, on/off per play.
  - **Annoying "40% Fixed Damage for each card in hand"** (User, 2026-10-28): a Cards in hand setting per play (default 1)
    multiplies the %. Cards with `perCount` get a count setting per play, kept in `RotationPlay.stacks` under its name.
    Annoying II / V "+100% / +120% Damage Amount for each Creation" are additive per-play counters.
  - Potential 7 "+6% Critical Chance of Combatant" (ATK > 700 or DEF > 300) reaches all allies (User, 2026-10-28).
    E4 "increase Damage Amount of allies by 10%" while holding a Creation: multiplicative, allies, hint. Not counted:
    E6 Fixed damage (★ x 50%) when a Creation is used.
- **Mika** (owner's screenshots, 2026-10-28; E6 = +6 card upgrade levels from E3 and E5, Basic 10 = x1.32, Signature 1 = x1.14;
  the Potential screen confirms it: Basic 16/16, Unique 7/16, 3-1 unlocked, 5-1 locked):
  every in-game % = Prydwen's base x upgrade (Whirlpool IV 300% -> 342%). A healer: no damage buffs.
  - Water Barrier Heal 172% = (100% + Potential 3-1's +30%) x 1.32: "+30% Healing" is +30% base heal. 5-1 "+5% Heal" is
    read the same way (**Unconfirmed**; not unlocked by the owner, 2026-10-28).
  - Whirlpool's "Heal 50% / 100% for each target hit" isn't raised in-game.
  - **Whirlpool V** "114%(228%) Damage ... Increase Damage Amount equal to Heal Amount of this card" (User, 2026-10-28):
    counts the bracket value, 228% (100% + its 100% Heal, both raised); Heal Amount buffs aren't added.
  - **Blessing of Waves IV** "Inflict Damage equal to Heal Amount to a random enemy": not counted (User, 2026-10-28).
  - Surge (Ego skill) creates Source of Water; E4 adds Retain to it, E1 adds Initiation to Deluge (in-game text).
- **Rei** (owner's screenshots, 2026-10-28; E6, Potential screen Basic / Common / Unique 7/16 = level 1 + 6 = x1.14,
  3-1 unlocked, 5-1 and 7 locked): every in-game % = Prydwen's base x 1.14 (Predator's Blade 250% -> 285%,
  Strike of Darkness II 350% -> 399%). Buff %s on cards and Resonating Darkness's end-of-turn Heal (60% / 90%) aren't raised.
  - Prydwen corrections: Final Shadow (Ego skill) shows 400% at E4 (300% + E4's +100%, a Base % buff); Predator's Blade
    Morale 4 = 2 + E1's 2; Strike of Darkness V says "Proc" (Prydwen: "Activate").
  - Buffs without "of this unit" (Strike of Darkness's Basic Attack Cards, Resonating Darkness's 1-Cost / Void cards,
    Dark Condensation's selected card) raise any ally's cards (User, 2026-10-28).
  - **Strike of Darkness II** "Decrease Damage Amount by 20% for 1 turn": Rei's later cards that turn x0.8, not its own
    399% hit (User, 2026-10-28). Switched on per play.
  - **Potential 7** "+10% Predator's Blade Damage" above 550 Attack (+1% per 10 more, max +20%) raises the card %, like
    5-1 on Dark Blade (User, 2026-10-28). 5-1's "+5% Damage for Dark Blade" is read as Mei Lin's 5-1 (card %).
  - **E6** is "+20% Damage Amount to allies' Attack Cards" in game (Prydwen: "increased by 20%"): additive, whole team
    (User, 2026-10-28).
  - Not counted: Predator's Blade Morale (set it on the Buffs tab), Strike of Darkness III's extra hits (set per play),
    Strike of Darkness V's procs (add them as plays).
- **Manifest Ego in-game wording** (owner's screenshots, 2026-10-28; Prydwen's can be outdated): Mei Lin E4, Rossweisse
  E2 / E4 / E6, Tiphera E4 (max 2 stacks, removed at the end of the turn) and Orlea E4 match what is modeled.
  Mei Lin E1 is not checked yet.
- **Team snapshot** (User, 2026-10-26), website only. Replaces the rotation buffs counted along
  the rotation (2026-10-25):
  - Each build has a team of up to 2 teammates (character, Manifest Ego level, partner, 3 fragment
    sets, picked cards incl. the Ego skill). Effects have a **target**: `self` (default), `allies`
    or `enemy`. The main character gets all of its own effects; a teammate gives only its allies /
    enemy effects (character and Ego, partner incl. the partner's Ego skill, fragment sets, picked
    cards). Teammates' equipment goes in My stat boosts / My buffs with a "From" label.
  - **Snapshot**: every switched-on buff counts on every hit of every play, including the card that
    applies it. "Damage taken" debuffs on the enemy (e.g. Adelheid's Truth) are additive. Only the
    main character's damage is calculated.
  - Each build has its own ordered **attack list** (the card library is shared; a list can be copied
    from another build). Per play: hits, Vulnerable on/off, Weakness debuff on/off, and the stacks of
    each per-play buff (`counter`), all off / 0 by default. A counter buff's switch is on/off only;
    its stacks are capped at its max stacks.
  - **Spirit of the Aromata**: stacks set per play (max 20). Aromata I counts Passion cards; allies'
    Passion cards count in the play's stacks.
  - **Ember** (text from the owner: "When hitting or putting a target in a Ravage state, deal +30%
    Damage for each stack of Ember the target has (up to 5 stacks). Upon activation, an Ember is
    removed."): +30% **additive** per stack, only on hits on a Ravaged target (cards marked Target
    Ravaged). Stacks are set per play; one is used per hit in-game, so lower the play's stacks to
    estimate that. Sources (notes on the cards): E2, potential 3-1, Rising Dragon Spire / I / II,
    Jewel III, Aromata IV.
  - Save v9: each build got a copy of the old shared rotation; a play has Vulnerable / Weakness
    debuff on if its first hit was within the build's old stack count; counter stacks start at 0.
  - The Excel workbook was removed (owner, 2026-10-27); the website is the only version.
- **Card % in hand / on target** (User, 2026-10-25), website only. The Results tab shows both for
  each hit. In hand = card % x Mult + Add, without the buffs that need a Ravaged target (Ember,
  Marianne's and E4's vs Ravaged). On target = the full card multiplier: those buffs, then x Weakness
  DMG, Vulnerable, enemy damage reduction, Weakness debuff and Ravaged. Owner's check: Mei Lin's
  Strike (Basic Card Upgrade 10, 5-1, Jewel, 1 Morale, Scarab, Obsidian Sword, Emblem) shows 251% in
  hand and 357% on target in-game; the calculator gives 250.6% and 355.9% (x 142% Weakness DMG). The
  ~0.3% gap on target is unexplained (game rounding or hidden decimals?).
- **Manifest Ego (dupes)** can't be switched off in-game, so each build has a level E0-E6 (User,
  2026-10-25). Ego buffs carry `egoLevel` and only count (and only show on the Buffs tab) from that level; set another build to a
  different level to see what a dupe adds. The E level that raises potential levels counts in the
  card upgrade factor (above).
- A card's buffs (e.g. Flame Dragon's Jewel's Attack damage, Spirit of the Aromata's per-card
  stacks) show as preset buffs while the card is in the library, on by default, switch per build.
  The "+" rule applies: "by 20%" = multiplicative, "+20%" = additive.
- Extra hits (Combo, Rising Dragon Spire V, Ego skill) are set per play in the attack list; a play's
  hit count also drives `N+ hits` matching.
- Jewel's "1 Passion Weakness to the target" is a Weakness Attack buff on all cards.
  **Unconfirmed** whether the first Attack card already gets it.
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
- [ ] How much extra damage Ravaged enemies take ("Ravaged: extra damage taken" setting; 0% for now).
- [ ] Is Marianne's Ravaged 15% multiplicative (no "+") or additive?
- [ ] Gather more hits to pin down the enemy DEF multiplier (later).

## Sources

- Prydwen damage formula (updated 2026-04-11): https://www.prydwen.gg/chaos-zero-nightmare/guides/damage-formula
- Game8 Morale: https://game8.co/games/Chaos-Zero-Nightmare/archives/561290
- UltimateGacha formula breakdown: https://ultimategacha.com/chaos-zero-nightmare-skill-damage-formula-breakdown-how-modifiers-combos-stack/
- UltimateGacha crit overview: https://ultimategacha.com/chaos-zero-nightmare-critical-rate-break-mechanics-overview/
- STOVE forum test thread (confirms Prydwen matched testing): https://page.onstove.com/chaoszeronightmare/en/view/11367707
- CZN Save Data Calculator (community tool): https://czn-save-cal.web.app/
