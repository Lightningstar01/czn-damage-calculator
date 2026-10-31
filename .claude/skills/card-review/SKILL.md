---
name: card-review
description: Compare a character's cards with the owner's in-game screenshots and write src/data/characters/<slug>.ts (in-game card text with tokens, corrections, created cards, damage buffs). Use when the owner says they've taken screenshots of a character, or asks to review/check a character's cards.
---

# Card review from in-game screenshots

The owner takes screenshots of one character's card pages with the Xbox Game Bar and says which character. Done so far:
every character with a `src/data/characters/<slug>.ts`. Worked examples: `rossweisse.ts`, `tiphera.ts` there
(and `tests/characters/<slug>.test.ts`, `docs/characters/<slug>.md`).

## 1. Collect the screenshots

- They land in `~/Videos/Captures` as `<window title> <date> <time>.png` (2560x1440). The title is usually
  `Chaos Zero Nightmare`, but Game Bar lags behind the focused window, so a game screenshot can carry the name of VS Code,
  Chrome or another window (owner, 2026-10-28). Ignore the names: every new .png in the batch is a game screenshot (they're
  renamed on moving anyway). Read them all; delete duplicates, ask about anything that isn't the game.
  `ls -lt ~/Videos/Captures`: take only the new batch (the folder is emptied after each character, so it's usually all of them).
- Read them, then move each to `card-screenshots/<slug>/` (git-ignored; slug as in `src/data/prydwen/`) under the name for
  what it shows (owner, 2026-10-30), using the in-game card name in lowercase with dashes and no apostrophes:
  - `card-<name>.png`: a card's detail page; `epiphany-<name>.png`: its 5 variants; `related-<name>.png`: its Related Cards page.
    A variant of a card adds a suffix (`card-music-start-crescendo`); a page scrolled to show the rest of its text adds `-scrolled` (`node-7-scrolled`).
  - `ego-skill.png`: the Ego skill's View Details page (`ego-skill-e3.png` for the preview of an Ego level's version).
  - `ego-<N>.png`: Ego Manifestation level N, from the title: Sleeping 1, Awakening 2, Vivid 3, Inner 4, Complete 5, Liberated 6.
    `ego-overview.png`: that screen with no level selected.
  - `potential.png`: the Potential screen with no node selected; `node-3-1.png`, `node-5-1.png`, `node-7.png`: those nodes selected.
  - `stats-detail.png`: the stats screen with Detailed Stats open (it also shows the basic numbers, so no plain stats shot).
  Don't keep the Cards overview (every card has its own page). If the folder holds files from before the owner's message, or
  the count looks wrong, ask before moving.
- Every character needs `node-3-1`, `node-5-1`, `node-7` and `stats-detail`; tell the owner if any is missing.

## 1b. Ego Manifestation wording (owner, 2026-10-28)

Prydwen's Manifest Ego texts are outdated (Rei's E6 is "+20% Damage Amount to allies' Attack Cards" in game, Prydwen
"increased by 20%"). Before the owner takes a character's screenshots, or right after reading them, tell them which Ego levels
to screenshot (Ego Manifestation screen, tap a level; the text may scroll, so ask for the rest if it's cut off). Only the levels
that can change damage and aren't shown elsewhere: skip E3 / E5 "+3 card upgrade levels" (the card %s confirm them), levels
that change a card's text (the card shows them), and heal / stress / draw levels. Save them as `card-screenshots/<slug>/ego-<N>.png`.

## 2. Read everything

- Every screenshot (Read tool). Usual set: the Cards overview (starting + epiphany cards, Ego skill; read it, then discard it), one detail page per
  card (keyword glossary on the right, Related Cards = the cards it creates), one Epiphany page per card (its 5 variants),
  the Potential screen and nodes 3-1, 5-1 and 7, the Detailed Stats screen, and the Ego Manifestation screen.
- `src/data/prydwen/<slug>.json` (cards, potentials, Manifest Ego) and `src/data/characters/<slug>.ts` if it exists.

## 3. Work out the owner's levels

- Read them off the Potential screen when it's there: each node's badge is level / max, Ego bonus included (Mika's Basic
  16/16 = 10 + 6, Unique 7/16 = Signature 1 + 6); a node without a badge is unlocked when dark, still locked when lit (bright yellow; Mika's 5-1, Tenebria's 5-2). The
  Ego Manifestation screen shows the unlocked levels. Then check them against the card %s below.

- Basic level: a Basic card's in-game % / Prydwen's base (102% / 100% = level 1, 2% per level).
- Signature level: same with a Unique card (134% / 120% = 1.12 = level 6).
- Ego level: from E-dependent text (Tiphera's Ego skill says "2 times", so below E3). The E3 / E5 potential +3 levels (some characters have both: Mika) count in
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
Offer a recommended reading as the first option. Record the answers as "(User, <date>)" in docs/characters/<slug>.md
(a rule for every character: docs/FORMULA.md).

## 6. Write `src/data/characters/<slug>.ts`

Copy the shape of the worked examples. Rules:
- Header comment: what the owner confirmed, with dates. Character `effects` before `cards`; `notes` lists what to set per
  play and what isn't counted.
- `text`: the in-game wording, one line per in-game line, keywords first as `[Unique / Retain]`. Tokens
  (`src/engine/cardText.ts`): `{120%}` base % (shown raised by the build's upgrade; use it for Heal/Shield % too),
  `{F40%}` Fixed damage % (not raised by default, Orlea's Annoying), `{120%@id}` another card preset's base % (Renoa's Dirge Bullet), `{E3:3|2}` Ego level, `{P3-1:text|else}` potential
  node; they nest: `Heal {P3-1:{70%}|{100%}}`. Buff %s on a card (Softie's "by 10%") aren't raised: write them as is.
- `potentials`: nodes 3-1, 5-1 and 7 in the game's wording: `{ '3-1': { text: '...' } }`, plus `name` if it differs. Check every number
  against the node's buff. "X or higher" = `minAttack: X` and `attackBonus` with `orEqual: true` (with `every`, `minAttack` alone is enough). Text cut off in a
  screenshot: ask for the rest.
- Corrections override the import: `pct`, `cost`, `name`, `cardType`, `tags`, `upgrade: null`, `replaceNotes`. A Potential node that
  changes a card's numbers: `nodeCard: { '3-1': { pct: 0.7, hits: 2 } }` (Chizuru's Moonslash).
- Card % "for each Cost of this card" = `perCost: true` (Tiphera's C&D V); "for each <thing>" = `perCount: '<Thing>'`
  (Orlea's Annoying: 'Cards in hand'); both give a setting per play.
- `creates: [ids]` on every card that creates others (shards, Archetypes...), so they join the deck.
- Damage set off by other plays (Selena's Mark, Coordinated Attacks) = `triggers` with an `extraCards` hit marked `notACard`
  (see `selena.ts`); it's computed with its owner's build, so it works when that character is a teammate.
- Damage buffs: card buffs via `cardBuff()` in that card's `effects`; character, potential and Ego buffs in `effects`.
  - "+X%" = Additive, "by X%" (no "+") = Multiplicative; "+X% base Damage Amount" = `type: 'Base %'`;
    "final Damage Amount" = `type: 'Final'`; scaling the card's own % (doubled...) = `type: 'Card %'`; a Potential node or Ego "+X%" that's part of the card's shown % = `type: 'Card +'` (added before the upgrade: Chizuru's Shadow 110% = (80% + 15%) x 1.16).
  - `target: 'allies'` / `'enemy'` when it reaches the team or is a debuff on the target.
  - Changes per play (stacks, "next card", conditions) = `counter` + `maxStacks`; fight-dependent always-on = `hint`.
  - `hitScope: 'First hit only'`, `egoLevel` / `egoBelow` for Ego versions, `minAttack` / `attackBonus` for Attack thresholds.
  - "Applies to": ALL, card name, tag, Attack/Skill/Upgrade, element, `Defense-Based`, `N+ hits`, `A & B`, `A/B`.
- Effect ids unique per owner; never rename an existing id (resets saved switches).
- Heal, shield, draw, cost and AP effects get text only; mention unmodeled damage effects in `notes`.
- A mechanic the engine can't express: propose the engine change to the owner first; then add it with a test,
  and update CLAUDE.md's Code section.

## 7. Test, document, commit

- `tests/characters/<slug>.test.ts`: a `describe('<Name>')` with the owner's levels: rendered text of the key cards equals the
  in-game screenshots (numbers included), plus one damage check per new mechanic.
- `docs/characters/<slug>.md`: levels, Prydwen corrections, each User answer, Unconfirmed points.
- Tell the owner what differed from Prydwen, what was modeled and what wasn't, then ask before committing. If UI code changed, also
  run `npm run test:e2e` and `npm run screenshot` and look at the phone pictures. If the owner agrees: `npm run check`, then commit
  ("<Name>: in-game card text, ...").
