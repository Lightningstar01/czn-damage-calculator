# Orlea

What the owner confirmed about this character's cards. The general rules are in [FORMULA.md](../FORMULA.md).

- **Orlea** (owner's screenshots, 2026-10-28; E0, Basic 1, Signature 7 = x1.14): every in-game % = Prydwen's base x upgrade
  (Annoying III 450% -> 513%), except Fixed damage % and the buff %s (Softie, Swiftie's Retain, Sacred Censer IV / V).
  - Prydwen's Heaven's Healing is "Healing of Light" in-game, and Potential 3-1's 50% chance to create a Creation★ is on
    it (Prydwen: on Attack, My Minions). Potential 5-1 "+10% Heal Amount to Orlea's Healing of Light" is read as +10% base heal
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
  - Potential 7 "+6% Critical Chance to allies" (ATK 700+ or DEF 300+) reaches all allies (User, 2026-10-28).
    E4 "increase Damage Amount of allies by 10%" while holding a Creation: multiplicative, allies, hint. Not counted:
    E6 Fixed damage (★ x 50%) when a Creation is used.
