# Fei

What the owner confirmed about this character's cards. The general rules are in [FORMULA.md](../FORMULA.md).

- **Fei** (screenshots 2026-11-09, game version 841): the owner doesn't have Fei yet, so these are the Combatant Archive preview: Lv 1,
  every Potential node 0 or locked, no Ego level. The card %s match Prydwen's base %s (no upgrade).
  - Prydwen corrections: Exorcist's Formation (base) is Initiation / Unique in game too (Prydwen has no tags); Soulfire Dance V costs 2
    (Prydwen none); Inferno Rhapsody's "When Flame Arts is activated through this card", Soliloquy's "Proc" (Prydwen "Activate") and the
    in-game wording of every card, node and Ego level. E5 names the Signature Card Upgrade (Prydwen "Unique").
  - **Flame Arts** (in game): "When Flame Arts reaches 3 stacks, 120% Extra Damage to the enemy that was attacked last. On effect activation,
    decrease Flame Arts by 3". A Flame Arts card joins the deck with every card that gives Flame Arts; the owner adds one play each time it fires
    (User, 2026-11-09). It's Fei's Extra Attack: ATK, Void DMG, the Extra Damage stat, crits and Extra Attack buffs raise it, card upgrades don't
    (User, 2026-11-09). E6's +120% (additive) and Soulfire Dance V's "Add 1 Hit(s) to Flame Arts" (a per-play switch) raise it; Exorcist's
    Formation IV's "When Flame Arts is activated, 100% Extra Attack on the target" is a trigger on each Flame Arts play.
  - **Inferno Rhapsody procs** (Soulfire Dance II, Soliloquy III / IV) count like a play of the card: one play per proc, with its buffs and
    Flame Arts (User, 2026-11-09).
  - **Heavensfall** (100% x 3, one per 8 Descent): Heavenscleaver's "Increase Damage Amount of the next Heavensfall by 100%" and Soulfire
    Dance III's "by 50% for each Hit Count (max 500%)" are multiplicative ("by", the "+" rule), per-play counters (Soulfire Dance III's
    counter is its hits, max 10). E4's +80% is additive. Heavenscleaver E3's "Add 2 Hits to the next Heavensfall" and E6's Judgment Upon the
    Wicked "Add 3 Hits" are one switch each on a Heavensfall play (User, 2026-11-09: the engine takes several `counterHits` for this).
    The switches show at every Ego level; turn them on only from E3 / E6.
  - Exorcist's Formation I's "+50% Damage Amount to those cards" is additive on Inferno Rhapsody while the card is in the deck. E1's "Increase
    Damage Amount of Inferno Rhapsody moved to hand by 100% until activated" is multiplicative, switched on per play ('Moved by Blazing War
    Dance'); it reaches Inferno Rhapsody: Heaven too (**Unconfirmed**, in-game test fei-readings).
  - 5-1's "+5% Damage Amount to Fei's Azure Flame" (+5% more at Attack 500 or higher) raises the card's %, like Selena's 5-1 (**Unconfirmed**,
    in-game test fei-readings). 7's Void Damage is on the stats screen (FORMULA.md, Stats), so it isn't added.
  - Not counted: E2's "Fixed Damage equal to 30% of the Damage dealt" by Inferno Rhapsody (waiting for the damage-parts model, CLAUDE.md),
    Descent itself (it only makes Heavensfall), draws, Shields.
