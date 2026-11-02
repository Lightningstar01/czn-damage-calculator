# Maribell

What the owner confirmed about this character's cards. The general rules are in [FORMULA.md](../FORMULA.md).

- **Maribell** (owner's screenshots, 2026-11-01; level 30, Attack 252, Defense 129, Health 281, E6; Basic, Common and Signature upgrades all 6/16, which is E3's and E5's +6 at level 0; 3-1, 5-1 and 7 locked):
  every in-game % is Prydwen's base x 1.12, except where listed below.
  - Prydwen corrections: E3 and E5 name Signature (Prydwen Unique). Resolute Blitz III keeps its 20% DMG-Based Shield (Prydwen lacks it). Wolves' Dome III has 2 Crystallization (Prydwen lacks it). Wolves' Dome II's Fixed Shield comes at the start of the turn. Maribell Shelter MK.II's Shield is written "100% DMG-Based Shield". Nodes 5-1 and 7 are "or higher" (Prydwen "greater than"); node 7 reaches Basic and Signature Cards (Prydwen "Defense-based Attack Damage").
  - Not raised at level 6: Resolute Blitz V stays 210% (no upgrade, like Mei Lin's Jewel V). Shelter Strike's 150% (100% + E1's 50%) and Oh... I see. IV's 50% are Fixed Damage, which fits the default of the potentialFixed setting.
  - **Shield owned** (User, 2026-11-01): the calculator doesn't compute Shield. Each play sets the amount, read in game. Shelter Strike and Oh... I see. IV deal Fixed Damage = % x Shield owned (`fixedOf`), with no ATK and no 0.35.
  - **Resolute Blitz IV and E6** (User, 2026-11-01): the amount (30% / 20% of Shield owned) doesn't say Fixed, so it's added under the multipliers (buff type `Flat`): Vulnerable, element, Pulverize and crit all raise it. **Unconfirmed**; in-game test `maribell-readings`.
  - **Counterattack** (User, 2026-11-01): one play per Counterattack, 150%, or 300% with "Completely blocked by Shield" on. It joins the deck with the cards that give it (with Shelter Defense and Shelter Hold whether or not 3-1 is on). It isn't raised by card upgrades (the keyword shows 150% at level 6), isn't a card (Attack Card buffs and node 7 skip it), and gets Wolves' Dome V's +20% and the fragment set's Counterattack buff. Whether it crits: **Unconfirmed**, assumed yes; in-game test `maribell-readings`.
    Only Maribell's Counterattacks are counted; Amir's and Nine's stay text.
  - **Pulverize on Shelter Strike** (User, 2026-11-01): it raises the card's Fixed Damage by 20%, as it's the card's own keyword, not a persistent effect. It's added to the Fixed % (`Base %`: +20%, or +30% from E1, which is 20% of 150%). **Unconfirmed**; in-game test `maribell-readings`.
  - E6's first Counterattack: set "Shield owned (first Counterattack)" on that play only.
  - Node 7's +5% is additive ("+" rule) on Attack Cards and Resolute Blitz V. Node 5-1's +5% is part of the shown Shield % (`Card +`). **Unconfirmed**, both nodes are locked; in-game test `maribell-readings`.
  - Resolute Blitz V counts one hit per play: "random enemies" doesn't say how many, and a fight has one target.
  - Not counted: Shields and Shield gain (E2, node 5-1, Crystallization, DMG-Based Shield), Weaken, Resolve, other enemies. End-of-turn damage (Resolute Blitz V, Oh... I see. IV) is one play per turn.
