# Rin

What the owner confirmed about this character's cards. The general rules are in [FORMULA.md](../FORMULA.md).

- **Rin** (owner's screenshots, 2026-11-01; game version 841; level 1, Basic 0, Signature 0, E0, nothing unlocked): every in-game %
  is Prydwen's base, so the upgrades can't be checked yet.
  - **Prydwen corrections**: Ego skill name ("Secret Ark" -> Dark Mist Secret Art: Slash); First Form / Third Form lose "Attack" from
    their names; Destruction III is "by 50%", multiplicative (Prydwen "+50%"); Drawing Slash III is Unactivatable outside the stance;
    E2 creates Sheathe Sword at the start of the turn if she's in the stance (Prydwen: on gaining the stance, once per turn);
    "Attack above 500 / 600" is "500 / 600 or higher"; Prydwen lacks Sheathe Sword (added from the owner's screenshot).
  - **Dark Mist Stance** (User, 2026-11-01): a switch on each play that starts on (`playStacks`); turn it off for plays outside the
    stance. It drives Annihilation's added hits, Annihilation III's +100% Critical Damage, Annihilation IV's 100% and Inner Art V's 50%.
    Losing the stance when another combatant activates an Attack Card isn't tracked: switch it off on those plays.
  - **Drawing Slash's own "Gain Dark Mist Stance"** (User, 2026-11-01; **Unconfirmed**, in-game test `rin-drawing-slash-own-stance`):
    counts for that same play, so Drawing Slash, I, V's 100%, II's added hit and IV's bonus are always on.
  - **Black Dance** "Add 1 Hit(s) for each Skill Card in hand": set Hits on the play (1 + Skill Cards in hand, in the stance). It
    isn't tied to the stance switch.
  - **Inner Art / I** ("+40% / +80% ... for 1 turn") and **Destruction III** (the drawn card, until activated): switched on per play.
    **Drawing Slash IV**: Cards in hand per play. **Sheathe Sword**: Attack Cards activated this turn per play, +20% base each.
  - E3's +100% on the Ego skill is additive; its +3 Vulnerable only changes the text (Vulnerable is set per play). E6's 2 Morale goes on
    the Buffs tab. Costs, draws, Shields, Retain and Lead aren't counted.
  - **Unconfirmed** (in-game test `rin-unconfirmed`): Black Dance (Mythic) and Sheathe Sword get the Signature upgrade (both are under
    Signature Cards in game); node 7's Critical Chance isn't on the stats screen; E1's +30% is part of Black Dance's shown %
    (`Card +`, like Chizuru's E1); Drawing Slash III plays at Cost 0 in the stance (Prydwen's number).
