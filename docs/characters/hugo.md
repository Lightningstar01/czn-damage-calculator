# Hugo

What the owner confirmed about this character's cards. The general rules are in [FORMULA.md](../FORMULA.md).

- **Hugo** (owner's screenshots, 2026-11-08; game version 841 taken from the same day's reviews; Ego 0, Basic 5/10 and Signature 5/10 (x1.10),
  Common 1/10; 3-1 and 7 unlocked, 5-1 locked, so its switch is off on Setup > Potentials): Knife Toss 110%, Fan of Daggers 66%,
  Quick Fix 88%, Dingo Howling 110% Shield. Detailed Stats: Attack 877, Critical 17.6% / 205%, Order Damage 16%, Extra Damage 42.7%.
  - Prydwen corrections: the Basic Attack is **Knife Toss** (Prydwen: Throw Dagger); Fan of Daggers V shows 60% at Signature 5,
    not raised (User, 2026-11-08: keep it at 60%, `upgrade: null`). Wording follows the game everywhere (Hunting Instincts: "of a
    different Combatant is activated"; Hunting Instincts III: "50% Coordinated Attack to the target"; Dingo Howling IV: "Streak").
  - Commence the Hunt (in game): "When a Targeting Attack Card is activated, 50% Extra Attack on the target, then decrease Commence the
    Hunt by 1. +30% base Damage Amount to Extra Attacks for each Commence the Hunt (max 5 stacks)". Modeled as a **trigger** on any
    combatant's single-target Attack Card (not Mark or other effect hits, which aren't cards) while the play's Commence the Hunt (set
    per play) is above 0 (User, 2026-11-08). Single-target is read from the card text (User, 2026-11-08: an engine change, "reviewed
    from card text"; FORMULA.md, "Applies to"). The +30% per stack counts the stacks before the decrease and raises all of Hugo's
    Extra Attacks, E2's too (User, 2026-11-08). It's a `Base %` (part of the Extra Attack's %).
  - Fixer's Approach "Increase Damage Amount of Commence the Hunt's Extra Attacks by 40%" (50% from E1) and Last Resort's "Increase
    Damage of Commence the Hunt by 30%" are multiplicative ("by", no "+"), so they add up (x1.7 together). How long Last Resort's 30%
    lasts is **Unconfirmed**: a per-play switch ("Last Resort used"). In-game test hugo-readings.
  - "If in a Commence the Hunt state" (Fan of Daggers IV's 100%, Quick Fix II's added hit) reads the play's Commence the Hunt.
    Quick Fix V's "Add 1 Hit(s) for each Commence the Hunt": set the play's hits.
  - E2's 40% Extra Attack x 2 is a play of its own (one per 2 activations, once per turn), with the +30% per stack. E3's sixth stack
    can be set from E3 on. E4's Fixer's Wrath is +10% per stack on all of Hugo's damage (per play, max 4). E6's Morale goes on the Buffs tab.
  - 5-1 (+5% to Knife Toss, +5% more at Attack 500 or higher) raises the card % (`Card +`), like Yuki's 5-1.
  - 7 is already in the stats screen's Extra Damage (7.5% at Attack 877 = 4% + 177/50), so it isn't added again (User, 2026-11-08). That
    7.54% also hints that the game doesn't round "for every 50" down (in-game test threshold-every-rounding).
  - Not counted: Hunting Instincts III's and Fan of Daggers III's Coordinated Attacks (a random ally's), Shields, draws, Action Count.
