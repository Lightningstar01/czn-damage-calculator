# Kayron

What the owner confirmed about this character's cards. The general rules are in [FORMULA.md](../FORMULA.md).

- **Kayron** (owner's screenshots, 2026-11-09, game version 841 taken from Diana's screenshots of the same day): the owner doesn't have
  him yet. The screenshots show him locked (Lv. 1/10, every Potential 0, every Ego level locked), so every in-game % is the base %,
  and they all match Prydwen's.
  - Futility (User, 2026-11-09): Echo of Futility, Echoes of True Abyss and the Ego skill create the Status Ailment (no damage,
    [Exhaust]). Oath of Vanity changes Futility into a 1-Cost Attack: Oath and Oath II 100% Damage + Heal, Oath I 150% + Heal, Oath III
    200% (no Heal); one Futility card per version, created by it. Raised by the Signature upgrade like other characters' generated cards
    (**Unconfirmed**: in-game test kayron-readings). Prydwen's Futility attack says 80%.
  - "Futility Exhausted" (User, 2026-11-09) is one count set on each play: Black Hole's +40% and Black Hole II's +60% base, Echo of
    Futility II's +20% base, and the hits of Black Hole III ("Add 1 Hit for each Exhausted Futility (max 5 times)": 1 + min(N, 5))
    and IV ("Add 1 Hit for each 5 Exhausted Futility (max 2 times)": 1 + min(N / 5, 2)), through `counterHits` with `per` / `max`.
  - Black Hole V (User, 2026-11-09): "When Futility is Exhausted, 100% Fixed Damage to a random enemy" is a hit on every Futility play,
    and one per Futility the Ego skill or Oath of Vanity IV Exhausts ("Futility Exhausted by this card" on that play). The Ego skill's
    "+80% base Damage Amount for each Exhausted" reads the same count.
  - Echoes of True Abyss (User, 2026-11-09): "+40 base Damage Amount for each created" (the game drops the %) counts the 3 Futility it
    creates, +120% base (360%), and 5 from E1, +200% (440%) (**Unconfirmed**: kayron-readings).
  - Echo of Futility IV: "+150% Damage Amount for each X" has no "base", unlike his other bonuses; it's taken as Base % like Rossweisse's
    Unbound (**Unconfirmed**: kayron-readings). Set X on each play. Echo of Futility V: +30% base per Futility created this battle;
    Brand of Annihilation IV: +40% base per card Exhausted this turn (counts on the play).
  - Potentials: 3-1 "+50% Damage and Heal Amounts to Elimination and Sphere" is Card + (part of the shown %) and adds "Create 1 Futility";
    5-1 is Card + on Elimination, +10% at Attack 500 or higher (Prydwen: "Destruction Damage"); 7 is +5% Critical Damage at Attack
    600 or higher, +1% per 40 above (max +10%), added in battle like Rin's 7 (**Unconfirmed** whether the stats screen shows it).
  - Ego (User, 2026-11-09): E2 "For each 2 Futility Card used, deal 100% Damage to all enemies" is a play of its own, added per 2
    Futility used. E4 "Each time a Futility card is Exhausted, gain 1 Echo of Paradox: +10% Damage Amount to Kayron's Attack Cards
    (max 3 stacks)" is an additive count (0-3) per play; the game names no duration (Prydwen: "for 1 turn", "used", "Paradox of
    Nothingness"; **Unconfirmed**). E6 applies Vulnerable, Weaken or Impair (Prydwen: Injured): text only, set Vulnerable per play.
  - Prydwen corrections: Futility's attack % (above); 5-1 is Elimination; E4 and E6 wording; "base Damage Amount" on the bonuses.
  - Not counted: Agony (Brand of Annihilation V, Oath of Vanity V; Kayron's DoT waits for the DoT work), Ephemeral, cost changes,
    heals, draws, E3's Graveyard (same count on the Ego skill), several targets (one target).
