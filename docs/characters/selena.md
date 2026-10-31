# Selena

What the owner confirmed about this character's cards. The general rules are in [FORMULA.md](../FORMULA.md).

- **Selena** (owner's screenshots, 2026-10-28; Ego 6, Basic and Unique cards x1.12 (E3 + E5 +6); 3-1, 5-1 and 7 locked, so
  their switches are on until turned off on the Buffs tab): Engagement Fire 112%, Target Spotted 168%, Drone Bombing 134%.
  - Prydwen corrections: the Ego skill Final Shot shows 350% Damage and 4 Mark at E4 (Prydwen 300%, 3 Mark; E4 "+50% Damage
    Amount to Final Shot, and increase Mark by 1"); Target Spotted I's Attunement is 300% (Prydwen 200%), shown unraised.
  - Mark (in game): "When an Attack Card is activated, inflict 100% Extra Attack, ... and decrease Mark by 1". Modeled as a
    **trigger**: on every Attack Card play, anyone's, while the play's Mark (set per play) is above 0, Selena's 100% Extra Attack
    is added to the play (User, 2026-10-28: automatic per play). Mark Damage buffs (Sniper's Domain +80%, E2 +20%, High-Power
    Scope III +50% for 1 turn) are additive and boost only Mark hits. E6's "30% chance to inflict 100% Extra Attack" counts as
    30% of the hit (expected value) and gets no Mark buffs (User, 2026-10-28).
  - Coordinated Attacks (High-Power Scope IV on other Combatants' Attack Cards, Drone Bombing IV on Weakness Attacks, Drone
    Bombing V 50% on Passion Attack Cards, Target Spotted V 200% on Ravage) are Selena's Extra Attacks (User, 2026-10-28).
    High-Power Scope IV / Drone Bombing IV are switched on per play (their 1 turn); Target Spotted V and I's Attunement are
    plays of their own (one per Ravage / draw).
  - Mark, Coordinated and Attunement hits are effects, not cards: Attack / Skill card buffs don't match them (`notACard`)
    and card upgrades don't raise them (User, 2026-10-28). Passion Weakness (Drone Bombing I / II) is a per-play enemy debuff
    that makes every Passion hit a Weakness Attack (x Weakness DMG), Selena's Coordinated Attacks included (User, 2026-10-28).
    Target Spotted V's hit counts the target as Ravaged (User, 2026-10-28).
  - 5-1's extra +5% (Extra Damage 15% or higher) and 7's extra +4% (30% or higher) read the stats-screen Extra Damage (User, 2026-10-30).
  - Not counted: Tenacity damage, 3-1's Piercing, Shields, draws.
