---
name: card-review
description: Compare a character's cards with the owner's in-game screenshots and write src/data/characters/<slug>.ts (in-game card text with tokens, corrections, created cards, damage buffs). Use when the owner says they've taken screenshots of a character, or asks to review/check a character's cards.
---

# Card review from in-game screenshots

The owner takes screenshots of one character's card pages with the Xbox Game Bar and says which character. Done so far:
see "Card text check" in CLAUDE.md. Worked examples: `src/data/characters/mei-lin.ts`, `rossweisse.ts`, `tiphera.ts`
(and their `describe` blocks in `tests/engine.test.ts`).

## 1. Collect the screenshots

- They land in `~/Videos/Captures` as `Chaos Zero Nightmare <date> <time>.png` (2560x1440).
  `ls -lt ~/Videos/Captures`: take only the new batch (the folder is emptied after each character, so it's usually all of them).
- Move them, oldest first, to `card-screenshots/<slug>/01.png, 02.png...` (git-ignored; slug as in `src/data/prydwen/`):
  ```bash
  cd ~/Videos/Captures; i=1; ls -tr *.png | while IFS= read -r f; do mv "$f" "<repo>/card-screenshots/<slug>/$(printf %02d $i).png"; i=$((i+1)); done
  ```
  If the folder holds files from before the owner's message, or the count looks wrong, ask before moving.

## 2. Read everything

- Every screenshot (Read tool). Usual set: the Cards overview (starting + epiphany cards, Ego skill), one detail page per
  card (keyword glossary on the right, Related Cards = the cards it creates), and one Epiphany page per card (its 5 variants).
- `src/data/prydwen/<slug>.json` (cards, potentials, Manifest Ego) and `src/data/characters/<slug>.ts` if it exists.

## 3. Work out the owner's levels

- Basic level: a Basic card's in-game % / Prydwen's base (102% / 100% = level 1, 2% per level).
- Signature level: same with a Unique card (134% / 120% = 1.12 = level 6).
- Ego level: from E-dependent text (Tiphera's Ego skill says "2 times", so below E3). The E5 potential +3 levels count in
  the upgrade factor. The number badge on the Ego skill icon is its EP cost, not the Ego level.
- Every in-game % should then be Prydwen x factor. A mismatch is a correction (Rossweisse's Ego skill: 1,200%, Prydwen
  200%) or a potential at work (Tiphera's Archetype 67% = (50% + 5-1's +10%) x 1.12). Never guess: ask if unexplained.

## 4. Compare each card

Name (epiphanies can have their own names), cost, type (Attack / Skill / Upgrade), keywords in `[ ]` (become the first
text line and the `tags`), every line of text, and the numbers. Note what Prydwen gets wrong or lacks (cards to add as
`extraCards`, created cards, Ego-level numbers shown as base).

## 5. Ask the owner (one AskUserQuestion, up to 4 questions)

Before writing buffs, ask about every mechanic that's ambiguous. CLAUDE.md: never assume. Typical questions:
- Whose cards a buff reaches: "this unit" = self, "allies" = allies, "next Attack Card" without an owner = ask.
- How "Double all effects" / "Increase all effects by 100%" / "for each X" scale the card %.
- Whether a triggered effect is an extra play of a card, Fixed damage, an Extra Attack.
Offer a recommended reading as the first option. Record the answers as "(User, <date>)" in docs/FORMULA.md.

## 6. Write `src/data/characters/<slug>.ts`

Copy the shape of the worked examples. Rules:
- Header comment: what the owner confirmed, with dates. Character `effects` before `cards`; `notes` lists what to set per
  play and what isn't counted.
- `text`: the in-game wording, one line per in-game line, keywords first as `[Unique / Retain]`. Tokens
  (`src/engine/cardText.ts`): `{120%}` base % (shown raised by the build's upgrade; use it for Heal/Shield % too),
  `{E3:3|2}` Ego level, `{P3-1:text|else}` potential node; they nest: `Heal {P3-1:{70%}|{100%}}`.
- Corrections override the import: `pct`, `cost`, `name`, `cardType`, `tags`, `upgrade: null`, `replaceNotes`.
- `creates: [ids]` on every card that creates others (shards, Archetypes...), so they join the deck.
- Damage buffs: card buffs via `cardBuff()` in that card's `effects`; character, potential and Ego buffs in `effects`.
  - "+X%" = Additive, "by X%" (no "+") = Multiplicative; "+X% base Damage Amount" = `type: 'Base %'`;
    "final Damage Amount" = `type: 'Final'`; scaling the card's own % (potential-like, doubled...) = `type: 'Card %'`.
  - `target: 'allies'` / `'enemy'` when it reaches the team or is a debuff on the target.
  - Changes per play (stacks, "next card", conditions) = `counter` + `maxStacks`; fight-dependent always-on = `hint`.
  - `hitScope: 'First hit only'`, `egoLevel` / `egoBelow` for Ego versions, `minAttack` / `attackBonus` for Attack thresholds.
  - "Applies to": ALL, card name, tag, Attack/Skill/Upgrade, element, `Defense-Based`, `N+ hits`, `A & B`, `A/B`.
- Effect ids unique per owner; never rename an existing id (resets saved switches).
- Heal, shield, draw, cost and AP effects get text only; mention unmodeled damage effects in `notes`.
- A mechanic the engine can't express: propose the engine change to the owner first; then add it with a test,
  and update CLAUDE.md's Code section.

## 7. Test, document, commit

- `tests/engine.test.ts`: a `describe('<Name>')` with the owner's levels: rendered text of the key cards equals the
  in-game screenshots (numbers included), plus one damage check per new mechanic. Delete `node_modules/.vitest-cache`
  first (new characters/*.ts files aren't seen otherwise).
- docs/FORMULA.md section 2c: a bullet for the character (levels, Prydwen corrections, each User answer, Unconfirmed points).
- CLAUDE.md: add the character to the "Done" lists (Card text, Card text check).
- `npm test`, `npm run build`, `npm run lint`; `npm run screenshot` only if UI code changed. Commit
  ("<Name>: in-game card text, ..."), then tell the owner what differed from Prydwen, what was modeled and what wasn't.
