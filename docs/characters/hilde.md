# Hilde

What the owner confirmed about this character's cards. The general rules are in [FORMULA.md](../FORMULA.md).

- **Hilde** (owner's screenshots, 2026-11-08; E0, Basic 1/10, Common 1/10, Unique 7/10; 3-1 and 7 unlocked, 5-1 and 5-2 locked; Attack 709,
  Extra Damage 18.7%): Basic cards x1.02, Unique cards x1.14. The Homing Arrows (generated cards) take the Signature upgrade:
  Homing Arrow 137% = 120% x 1.14, Fracture 57% = 50% x 1.14, Grand 570% = 500% x 1.14.
  - 3-1 is Card + on Multishot, measured: 82% = (60% + 20%) x 1.02. 5-1 (locked) is modeled the same way, +10% at Extra Damage 6% or
    higher, like Selena's 5-1.
  - Potential 7 is on the stats screen (Instinct Damage 15.0% = 7% + 8% at Extra Damage 18.7%), so nothing is added on top (as Selena's 7).
  - Zero In (User, 2026-11-08): "At the end of the turn, 35% Extra Attack ... for each Zero In" is one hit of 35% x the stacks (one crit roll),
    not raised by card upgrades. It's a play of its own (Big Game Ranger brings it into the deck); set the stacks on it. Max 60, 100 from E6
    (the calculator allows 100 at every level). E6's "+1% Critical Damage to Zero In" per stack reads the same number (max +45%).
  - Vortex Arrow (User, 2026-11-08): +60% per Attack Card drawn through an ability this turn, fixed (Prydwen +50%), additive, max 8;
    E1 makes it +90%. E1's "+60% Damage Amount" is taken as part of the card's % (Card +, like a Potential node; **Unconfirmed**: in-game test
    hilde-readings).
  - Double Tap (E2; User, 2026-11-08): goes off on every Homing Arrow version (plain, Fracture, Grand) played with Double Tap above 0.
  - Matrix Overlay (User, 2026-11-08): its "+15% Weakness Damage Amount taken" (+25% at E3) is set per play ("Matrix Overlay this turn") and
    adds to Weakness DMG on every ally's plays that hit a Weakness (125% -> 140%; **Unconfirmed** whether it adds or multiplies: in-game test
    hilde-readings). Its Weakness Attack on the 3 Attack Cards it draws is a second per-play switch ("Matrix Overlay drew this card").
    The engine's buff type `Weakness DMG` was added for it.
  - Ionization (keyword): "+8% Damage Amount taken for each Ionization, and +4% additional Damage Amount taken from Hilde" (max 12): additive
    ("+"), set per play; the +8% counts on every ally's hits, the +4% on Hilde's. A Plasma Rain's own Ionization counts on its hit only if
    you set it on that play.
  - "+" rule: Draw & Release's +50% (I: +80%) additive on the Attack Cards it drew (per-play switch), V's "by 30% for each card Drawn" multiplicative
    on the next Attack Card (max 10 cards = 300%), E4 Find the Gap "by 5%" multiplicative on Hilde's Extra Attacks (max 8).
  - E2's +10% Critical Chance is added to the stat (start of battle, not on the stats screen). E6's +15% Critical Chance at 8 Find the Gap
    goes to every ally's Instinct cards, a switch (hint "Find the Gap at 8").
  - Prydwen corrections: the Homing Arrows read 0% (their damage is an Extra Attack phrase); set to their %, 1 hit, Extra Attack. Vortex Arrow's
    +50% is +60%. Matrix Overlay is +15% at E0 (Prydwen's text is the E3 +25%). Wording from the game ("Proc this card", "until activated").
  - Not counted: Fracture (DoT; Homing Arrow (Fracture), Plasma Rain III, Draw & Release II), Piercing (Plasma Rain IV: normal damage),
    Shields, draws, cost changes, Zero In / Ionization / Double Tap gains (set the numbers per play), several targets (one target).
