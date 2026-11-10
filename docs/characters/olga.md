# Olga

Reviewed 2026-11-09 (game version 841) from the in-game preview: the owner doesn't have Olga yet. Every Potential node shows 0 and is locked, every
Ego level is locked (E0), and there's no stats screen. Card wording and numbers in `src/data/characters/olga.ts`; tests in `tests/characters/olga.test.ts`.

- Levels: Basic 0, Signature 0, E0. Every in-game % equals Prydwen's base (Reaping Slash 100%, Rift of Severance 80%, Dispersed Desire 80%, End of the
  Line 200%, Reckoning 400%, Maelstrom of Oblivion 400%). E3 and E5 add +3 to the card upgrades (E3 in Prydwen's text, E5 in game).
- Prydwen corrections: wording only (Insatiable Cravings "time(s) per turn"; Rift of Severance V "At the end of the turn, 1 additional Fracture", Prydwen
  "Add 1 Fracture at the end of the turn"; Potential 5-1's wording; E2 "Recover 4% of max Health"). No numbers differ. The Ego skill's text is cut off at "(max" in the
  screenshot; 300% is Prydwen's, and E3's "from 300% to 450%" agrees.
- Fracture: one hit of 40% x the stacks, normal ATK damage, as Arabella's (User, 2026-11-09; **Unconfirmed**, in-game test fracture-tick).
  Agony: a Fixed DoT, one hit of 50% per stack, as Tressa's (measured on hers; docs/FORMULA.md, Crit and Fixed). Both are Instinct.
- Activations (User, 2026-11-09): Fracture and Agony plays come with the Ego skill, so they're always in the deck. Add one per activation (end of turn,
  and each card that activates them; Rift of Severance III's and Dispersed Desire III's "2 times" = 2 plays) and type the stacks before they halve.
  Nothing tracks stacks: add what cards inflict and halve after each activation.
- Rapacity (User, 2026-11-09): "Also treat Damage dealt by this card as DoT" makes End of the Line and Reckoning Attack cards and DoT: the Damage over Time stat
  raises them (not Extra Damage), and DoT buffs (Shard Erosion) reach them. Attack-card buffs still do. **Unconfirmed**, in-game test olga-readings.
- Reckoning: "+20% base Damage Amount for each Rapacity" is Base % per stack (max 30), set per play. E1's "+200% Damage Amount" is taken as part of the card's %
  (Card +), by the owner's rule for Ego "+X%" (Chizuru's E1, measured); **Unconfirmed** here (olga-readings), and E1 raises the per-Rapacity bonus to +30%.
- Maelstrom of Oblivion (User, 2026-11-09): "+50%, +20% and +30% base Damage Amount for each Fracture, Agony and Scorched activated this turn (max 300%)" is
  three per-play counters, Base %, capped together at +300% (+450% from E3; `sharedCap`). E3's "+200% Damage Amount" is added to the 400% (Base %), as
  Chizuru's E3. Whether the cap is shared: **Unconfirmed** (olga-readings).
- E4 / E6 Shard Erosion (User, 2026-11-09): "Increase Damage Amount of Olga's DoT effects by 6%" (10% from E6) is multiplicative per stack (max 5), set per play,
  on her Fracture and Agony ticks and the Rapacity cards. It's the one buff that reaches Agony (`fixedDot`), since Tressa's measurements left no room for
  other damage buffs on Agony (in-game test agony-limits); **Unconfirmed** (olga-readings). E6's "+50% to Olga's Critical Damage" at 5 stacks: a switch per
  play ("Shard Erosion at 5 stacks"), on all her hits.
- Insatiable Cravings V (User, 2026-11-09): "increase Damage Amount by 1% for 1 turn (max 30%)" is multiplicative per harmful effect applied this turn,
  on all her damage but Agony, set per play (**Unconfirmed**, olga-readings).
- 5-1 (locked) is Card + on Reaping Slash, +5% more with Damage over Time 6% or higher, like Tressa's 5-1 (**Unconfirmed**, olga-readings). 7 is on the stats
  screen, as every character's node 7, so nothing is added on top.
- Not counted: Shattering's Fixed damage (30% of damage taken, 40% from E2; it waits for the extra-damage model, like Arabella's Pathetic End), Fracture and
  Agony a card inflicts (add them to the count), Scorched (no tick modeled), Brands, Insatiable Cravings' added Fracture and Agony, Heals (E2), End of the
  Line's E1 cost, E6's moved card, other enemies (all-enemy damage counts one target).
