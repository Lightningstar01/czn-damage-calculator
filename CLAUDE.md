# CZN Damage Calculator

A Python generator that builds an Excel workbook for calculating Chaos Zero Nightmare card
damage. The owner copies the Template tab for each character and compares up to three builds
(supports, equipment, memory fragments, save-data setups) side by side to maximize damage.

## Working with the owner

- **Never assume — ask.** The owner's standing preference: when anything is ambiguous
  (game mechanics, layout, scope), ask a question instead of guessing.
- The owner knows the game well. Their stated mechanics (see docs/FORMULA.md, marked "User")
  take precedence over web guides unless they agree to change them.
- When research conflicts, report the conflict with sources and ask, or make it a toggle
  in the Settings tab rather than silently picking one.
- Keep the workbook simple to use: yellow inputs, green outputs, dropdowns where possible.

## Commands

```bash
# Python is not on PATH on the owner's PC; use the project venv: .venv\Scripts\python.exe
pip install -r requirements.txt
python src/build_workbook.py                    # -> output/CZN_Damage_Calculator.xlsx
python scripts/recalc.py output/CZN_Damage_Calculator.xlsx   # recalcs in Excel (COM); must report 0 errors
python -m pytest tests -q                       # regression test of the math (recalcs a filled copy in Excel)
# Excel can't save a file the owner has open — close it first (the tests use a temp copy, so they're unaffected).
```
After any change: rebuild, recalc (zero errors), run tests, then commit to git (the owner's
filled-in output workbook is tracked too, so its data has history). If you change layout rows/columns,
update the cell references in tests/test_formula.py and the layout map below.

## Rules for the generator

- Every result is an Excel formula, never a Python-computed value — the sheet must recalc
  when the owner edits inputs.
- Excel-2007-era functions only (SUMIFS, SUMPRODUCT, INDEX/MATCH, IFERROR). No XLOOKUP,
  FILTER, LET, LAMBDA, or spilling arrays — keep the workbook usable in older Excel and LibreOffice.
- Font Arial. Inputs: blue text on yellow fill. Calculated: green fill. Helpers: grey.
- Percentages stored as fractions (0.2 = 20%).
- Constants and rules live on the Settings tab and are referenced, never hard-coded in formulas.
- The workbook must work after the owner duplicates the Template tab (no sheet-name
  references to "Template"; only Settings!, Presets! and the defined names CharList /
  PartnerAll / PartnerClass / PartnerStart cross sheets).
- Rebuilding keeps the owner's data: the Presets inputs and every character tab are carried over
  from the existing output file. Character tabs store LAYOUT_VERSION in A1. If you move any
  Template input cell, bump LAYOUT_VERSION and add a migration (see migrate_v1 / migrate_v2). Current: 3.
- Document every new assumption in docs/FORMULA.md with its source or "Unconfirmed".

## Formula (summary — full notes and sources in docs/FORMULA.md)

```
Final ATK  = Stats-screen Attack (includes partner base ATK + fragments; NOT partner effects or equipment)
             x (1 + partner/equipment ATK%) + equipment flat ATK
Card mult  = (Card % as shown in-game x MultFactor + Additive buffs incl. Morale)
             x Weakness DMG (if the card's "applies" = Yes or a Weakness Attack buff matches; base 125%)
             x (1 + Vulnerable) x (1 - Enemy DR) x (1 - Weakness debuff) x (1 + Ravaged factor if target Ravaged)
Damage     = Card mult x Stat x 0.35 x (1 + Elemental DMG%) x (1 + Extra/DoT DMG%) x Enemy DEF mult
             Stat = Final ATK, or (ATK x 0.3 + DEF x 2.1) for DEF cards; Fixed ignores all of this
Crit       = Damage x Crit DMG (stat is the total multiplier); Expected = Damage x (1 + CritRate x (CritDMG - 1)), per hit
```
- "+X%" buff text = Additive; "X%" without "+" = Multiplicative (owner's rule).
- MultFactor = 1 + sum (Summed, default) or product of (1 + each) (Chained) — Settings!B15.
- Morale = +20%/stack additive, max 20 stacks.
- Vulnerable/Weakness-debuff stacks are used up one per hit, in card-table order across every play;
  first-hit-only buffs apply to hit 1 of each play.
- Partner class-limited effects only apply when the partner's class = the character's class.

## Workbook layout (src/build_workbook.py)

Tabs: **How To**, **Settings**, **Presets**, **Template** (+ the owner's character tabs).

Settings: B5 constant 0.35, B6/B7 DEF coefficients, B8 extra weakness factor (default 0; test showed none),
B9 Vulnerable, B10 Weakness debuff, B11 crit cap, B12 Ravaged extra damage (Unconfirmed, 0), B15 mult mode.
Dropdown lists in columns E–Q (O Classes, P Effect kind, Q Condition).

Presets (data from row 6): Characters A–D rows 6–55 (Name, Element, Class, Notes); Partners F–K rows
6–105 (Name, Class, Base HP/DEF/ATK, Notes; grey L–N sorted by class for the filtered dropdown);
Effects P–AB rows 6–505 (Owner, Kind Stat/Buff, Effect, Category, Stat, Value, Applies to, Hit scope,
Condition, Max stacks, Default stacks, Class-limited?, Notes; grey AD key Owner|Kind|n).

Template (build columns E/F/G = Builds A/B/C in the top sections):
| Rows | Section |
|---|---|
| 1 | A1 layout version, C1 character (dropdown from Presets), E1 element and G1 class (looked up) |
| 4–9 | Build summary (totals of all cards x times played; H6 warns if the hit breakdown is full) |
| 12–15 | 12 Partner per build (class-filtered dropdown; grey J–L distinct partner slots), E13 Show all partners, 14 enemy DEF multiplier, 15 enemy damage reduction |
| 19–31 | Stats screen: 19 Attack, 20 Defense, 21 Health, 22 Crit Chance, 23 Crit DMG, 24 Weakness DMG, 25–29 Passion/Justice/Order/Instinct/Void DMG, 30 Extra DMG, 31 DoT |
| 37–66 | Stat boosts: 37–56 preset rows (packed: the character's effects, then partner slots 1–3; up to 5 + 3x5), 57–66 user rows. B source, C stat, D value, E–G switch per build (Yes/No/number), H category, I notes; grey K value, L–N effective, O default, P preset #, Q class ok, R owner, S group (0 = character), U–X running counts (row 37); K34 red note (overflow / press Ctrl+Alt+L) |
| 71–78 | Final stats: 71 ATK, 72 DEF, 73 Crit Rate, 74 Crit DMG, 75 Elemental DMG%, 76 Extra DMG%, 77 DoT DMG%, 78 Weakness DMG |
| 83–126 | Buffs: 83 Morale, 84 Vulnerable, 85 Weakness debuff, 86–106 preset rows (packed, up to 6 + 3x5), 107–126 user rows. B source, C category, D text, E auto type, F applies-to, G hit scope, H condition, I max stacks, J–L switch/stacks per build, M notes; grey O value, P–R effective, S default, T preset #, U class ok, V owner, W group, X–AA running counts (row 83); K80 red note |
| AB36:AB126 | Sheet filter: grey "show"/"hide" per preset row; filter hides "hide" (Ctrl+Alt+L to reapply). The build sets the initial hidden rows |
| 132–146 | Cards: B name, C tags, D scaling, E kind, F % as shown, G hits, H Weakness DMG applies?, I Target Ravaged?, J times played; K–S totals (A: K non-crit, L crit, M expected; B: N–P; C: Q–S); grey U start, V hit rows (V147 total), W–AQ helper sums (7 per build) |
| 153–452 | Hit breakdown: B card, C card #, D play #, E hit #; per build F–I / J–M / N–Q (card mult, non-crit, crit, expected) |

"Applies to" matches ALL, an exact card name, or one tag in the card's comma-separated Tags.

## Status / backlog

- Waiting on the owner: text of two Reddit posts on the formula (Reddit is blocked from the
  cloud session; in Claude Code you may be able to fetch them) and another player's calculator
  sheet as .xlsx, to compare against ours line by line.
- Open mechanics questions are listed in docs/FORMULA.md section 4.
- Presets: Mei Lin's own character buffs (many conditional) still to be designed with the owner;
  more characters/partners to be entered by the owner.
