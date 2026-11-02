# Tressa

What the owner confirmed about this character's cards. The general rules are in [FORMULA.md](../FORMULA.md).

- **Tressa** (owner's screenshots, 2026-11-01; Ego 6, Basic x1.22 (level 5, E3 and E5 +6: badge 11/16), Unique x1.12 (level 0, E3 and E5 +6: badge 6/16); 3-1 on, 5-1 and 7 locked,
  so they're off on Setup > Potentials until unlocked): Dagger Throw 122%, Shadow Dagger 90%, Advanced Shadow Dagger 56%, Vital Attack 90% × 3. Stats: Attack 608, Void 7.5%, Extra 6.7%, Damage over Time 3.2%.
  - Prydwen corrections:
    - Wave of Darkness also has "4 Agony × 2" in game at E6 (Prydwen: only "Create 2 Shadow Dagger"). E4's "increases Agony by 2" gives 2 × 2 below E4 (read from E6; **Unconfirmed**, in-game test tressa-readings).
    - Shadow Reload II heals 168% = 150% x 1.12 (Prydwen: 10%).
    - 5-1 and 7 are "15% / 30% or higher" (Prydwen: "greater than"). E3 and E5 name the Signature Card Upgrade (Prydwen: Unique).
    - Wording throughout, such as "Damage Amount" and "when an Attack Card is activated, 1 Agony to the target" (Curse).
  - Agony's tick (measured by the owner, 2026-11-01, in-game test agony-tick): each stack is its own hit, each can crit (53 × 7 and 66 at 8 Agony), and halving rounds down (9 to 4, 1 to 0). One hit = 50% x Final ATK x 0.35 x (1 + Void) x (1 + DoT) x Enemy DEF.
    Measured: Attack (731 to 747, 53 to 54; 559, 47), Enemy DEF (53 to 61) and the DoT stat (727 Attack, 18.3%: 69) raise it; Vulnerable doesn't.
    **Unconfirmed**, in-game test agony-limits: that Void raises it (it fits only with Void at the 0.3733 below), that Offering of the Void and other "damage" buffs don't, and Enemy DR (not applied).
  - Enemies in those tests, as the Fights tab's Enemy DEF multiplier: about 0.374 (test enemy, the same enemy as Mei Lin's tests, which gave 0.3733; User, 2026-11-01) and about 0.429 (weak enemy), back-solved from the hits. The same enemy is why Void counts in the tick: without it these hits would need 0.40.
  - Normal hits beat their card % because of buffs in battle, not a hidden factor (User, 2026-11-01; 731 Attack, game version 841): equipment "by 12%" and "+25%", partner "by 10% on Attack Cards". Shadow Dagger then shows 135%, in hand and on target, and hits 139. Cursed Corpse wasn't equipped.
    After a first Exhaust (partner "by 12% on Attack Cards" for 1 turn, Offering of the Void's "by 20% on Void Cards") and on a target with 4 Agony: 164% in hand, 184% on target (so E2 shows only on target), hit 189. So the "by X%" buffs add up and E2 is +20%.
    The exact 89.6% gives 134.3%, 163% and 183%, about 1 low; 90%, as the card shows, gives 134.8%, 163.6% and 183.6%, and 139 and 189 at Enemy DEF 0.3736 to 0.3749, so the card % is rounded first (see FORMULA.md, Card upgrades).
    The earlier hits from before this test (153, 203, 176, 234) don't fit these buffs (153 would need Enemy DEF 0.38), so that fight had something more; they aren't used.
  - Ticks are typed per play (User, 2026-11-01): an Agony play comes with the Ego skill, so it's always in the deck, one per end of turn. Cursed Gouge is the same tick (measured). Nothing tracks stacks: the owner adds what cards apply and halves after each tick.
    Agony on target is one number per play, shared by the ticks, the Vital Attack bonuses, Advanced Shadow Dagger and E2.
  - Shadow Dagger's damage comes before its Agony (measured: no E2 bonus at 0 Agony). Advanced Shadow Dagger's "4 Agony" is listed before its damage, so type its count with its own 4 added (**Unconfirmed**: its one reading, 196 at 747 Attack, leans that way, but that build's buffs aren't known; in-game test tressa-readings). Agony isn't added by itself, because epiphanies and Curse V change how much a card applies.
  - E2 reaches Shadow Dagger by name only: the owner wasn't sure about Advanced Shadow Dagger, and the 196 can't settle it yet (User, 2026-11-01; **Unconfirmed**, in-game test tressa-readings).
  - The "+" bonuses (Vital Attack's +50% and +70%, +10% per Agony, E2's +20%) are additive and not raised by upgrades: they show as is at Unique 6.
    They all need a target, so they're left out of the In hand chip (`onTarget`): measured on E2, **Unconfirmed** on the others (in-game test target-buffs-in-hand).
  - A tick stops at 20 Agony, the keyword's "max 20 stacks", typed or not.
  - Vital Attack IV's extra hit has its own switch, Target has 3+ Agony. Shadow Reload I: set Hits to 1 + the Shadow Daggers it exhausts.
  - 5-1's +5% (+5% more at Damage over Time 15%, stats screen) adds before the upgrade (`Card +`), following the owner's rule for Potential nodes. 7's +4% (+4% more at 30%) is additive on Void cards, as Selena's 7 is, so
    it doesn't raise a Fixed tick. Both are locked, so neither has been seen (**Unconfirmed**, in-game test tressa-readings).
  - Not counted: Agony a card applies (typed), Heals, E1's cost change (the card shows Cost 1, in game 0 from E1), E6's created Shadow Dagger, all enemies and random enemies (one target).
