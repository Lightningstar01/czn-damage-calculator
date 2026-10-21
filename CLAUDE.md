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
  references to "Template"; only Settings! references cross sheets).
- Document every new assumption in docs/FORMULA.md with its source or "Unconfirmed".

## Formula (summary — full notes and sources in docs/FORMULA.md)

```
Final ATK  = Stats-screen Attack (includes partner base ATK + fragments; NOT partner effects or equipment)
             x (1 + partner/equipment ATK%) + equipment flat ATK
Card mult  = (Card % as shown in-game x MultFactor + Additive buffs incl. Morale)
             x Weakness DMG (if the card's "applies" = Yes; base 125%) x (1 + Vulnerable) x (1 - Enemy DR) x (1 - Weakness debuff)
Damage     = Card mult x Stat x 0.35 x (1 + Elemental DMG%) x (1 + Extra/DoT DMG%) x Enemy DEF mult
             Stat = Final ATK, or (ATK x 0.3 + DEF x 2.1) for DEF cards; Fixed ignores all of this
Crit       = Damage x Crit DMG (stat is the total multiplier); Expected = Damage x (1 + CritRate x (CritDMG - 1)), per hit
```
- "+X%" buff text = Additive; "X%" without "+" = Multiplicative (owner's rule).
- MultFactor = 1 + sum (Summed, default) or product of (1 + each) (Chained) — Settings!B14.
- Morale = +20%/stack additive, max 20 stacks.
- Vulnerable/Weakness-debuff stacks are used up one per hit, in card-table order across every play;
  first-hit-only buffs apply to hit 1 of each play.

## Workbook layout (src/build_workbook.py)

Tabs: **How To**, **Settings**, **Template**.

Settings: B5 constant 0.35, B6/B7 DEF coefficients, B8 extra weakness factor (default 0; test showed none),
B9 Vulnerable, B10 Weakness debuff, B11 crit cap, B14 mult mode. Dropdown lists in columns E–N.

Template (build columns E/F/G = Builds A/B/C in the top sections):
| Rows | Section |
|---|---|
| 1 | C1 character name, E1 character element (dropdown) |
| 5–9 | Build summary (totals of all cards x times played; H6 warns if the hit breakdown is full) |
| 12–13 | Target per build: 12 enemy DEF multiplier, 13 enemy damage reduction |
| 18–30 | Character stats from the in-game stats screen (E–G per build): 18 Attack, 19 Defense, 20 Health, 21 Crit Chance, 22 Crit DMG, 23 Weakness DMG, 24–28 Passion/Justice/Order/Instinct/Void DMG, 29 Extra DMG, 30 DoT |
| 35–44 | Partner effects & equipment not on the stats screen (B source, C category, D stat, E–G per build) |
| 49–56 | Final stats: 49 ATK, 50 DEF, 51 Crit Rate, 52 Crit DMG, 53 Elemental DMG%, 54 Extra DMG%, 55 DoT DMG%, 56 Weakness DMG |
| 62–96 | Buffs & debuffs (B source, C category, D text, E auto type, F applies-to, G hit scope, H max stacks, I–K stacks per build, L notes; grey N value, O–Q effective stacks). 62 Morale, 63 Vulnerable, 64 Weakness debuff (sizes from Settings) |
| 102–116 | Cards (B name, C tags, D scaling, E kind, F % as shown, G hits, H Weakness DMG applies?, I times played; J–R totals per build; grey T start index, U hit rows, V–AM helper sums per build) |
| 123–422 | Hit breakdown: one row per hit of every play in card order (B card, C card #, D play #, E hit #; per build: card mult, non-crit, crit, expected) |

"Applies to" matches ALL, an exact card name, or one tag in the card's comma-separated Tags.

## Status / backlog

- Waiting on the owner: text of two Reddit posts on the formula (Reddit is blocked from the
  cloud session; in Claude Code you may be able to fetch them) and another player's calculator
  sheet as .xlsx, to compare against ours line by line.
- Open mechanics questions are listed in docs/FORMULA.md section 4.
