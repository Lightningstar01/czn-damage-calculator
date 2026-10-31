# Tiphera

What the owner confirmed about this character's cards. The general rules are in [FORMULA.md](../FORMULA.md).

- **Tiphera** (owner's screenshots, 2026-10-28; Basic 1, Signature 6): every in-game % = Prydwen's base x upgrade
  (Creation and Destruction 120% -> 134%). Prydwen's Ego skill has the E3 numbers ("3 times"); in-game base is 2.
  - Archetype cards show Heal / Shield 67%, Prydwen 50%: (50% + Potential 5-1's +5% +5% at Defense 250 or higher) x 1.12
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
  - Potential 7 (+10% Crit DMG of allies at Defense 300 or higher) is an allies stat with a hint; E4 Power of Archetype is
    5% multiplicative each on Attack cards, Order and Defense-Based Damage (DEF cards), per-play stacks (max 2), allies.
