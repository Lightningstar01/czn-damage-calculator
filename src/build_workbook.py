"""Generate the Chaos Zero Nightmare damage calculator workbook.

Usage: python src/build_workbook.py [output_path]
Default output: output/CZN_Damage_Calculator.xlsx
If the output file already exists, its Presets data and character tabs are carried over into the
new workbook (character tabs are rebuilt from the Template and their inputs copied back), so a
rebuild never wipes the owner's data. Close the file in Excel first.
See CLAUDE.md for the layout map and docs/FORMULA.md for the math.
"""
import sys
from pathlib import Path
from openpyxl import Workbook, load_workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.formatting.rule import FormulaRule
from openpyxl.workbook.defined_name import DefinedName
from openpyxl.worksheet.filters import CustomFilter, CustomFilters, FilterColumn
from openpyxl.utils import get_column_letter as L

LAYOUT_VERSION = 3   # stored in A1 of every character tab; bump (and add a migration) when Template cells move

F = "Arial"
def font(**k): return Font(name=F, **k)
INP_FILL = PatternFill("solid", fgColor="FFF9E5")
HDR_FILL = PatternFill("solid", fgColor="2F3E57")
SUB_FILL = PatternFill("solid", fgColor="DCE3EE")
OUT_FILL = PatternFill("solid", fgColor="E8F4EA")
HELP_FILL = PatternFill("solid", fgColor="F2F2F2")
def cf_fill(c): return PatternFill("solid", start_color=c, end_color=c)   # conditional formats read the background colour
ON_FILL = cf_fill("C6EFCE")
OFF_FILL = cf_fill("E0E0E0")
thin = Side(style="thin", color="C8CCD2")
BOX = Border(left=thin, right=thin, top=thin, bottom=thin)
BLUE = "0000FF"
NOTE = dict(italic=True, size=9, color="555555")

def header(ws, row, text, c1=2, c2=16):
    ws.cell(row, c1, text).font = font(bold=True, color="FFFFFF", size=11)
    for c in range(c1, c2 + 1): ws.cell(row, c).fill = HDR_FILL
def colhdr(ws, row, labels, start=2):
    for i, t in enumerate(labels):
        c = ws.cell(row, start + i, t); c.font = font(bold=True, size=9); c.fill = SUB_FILL
        c.alignment = Alignment(wrap_text=True, vertical="center"); c.border = BOX
INPUTS = set()   # input cells of the Template layout, copied back when a character tab is rebuilt
def inp(ws, ref, val=None, fmt=None):
    c = ws[ref]
    if val is not None: c.value = val
    c.font = font(color=BLUE); c.fill = INP_FILL; c.border = BOX
    if fmt: c.number_format = fmt
    if ws.title != "Presets": INPUTS.add(ref)
def out(ws, ref, formula, fmt=None, bold=False):
    c = ws[ref]; c.value = formula; c.font = font(bold=bold); c.fill = OUT_FILL; c.border = BOX
    if fmt: c.number_format = fmt
def grey(ws, ref, v):
    c = ws[ref]; c.value = v; c.font = font(size=8, color="888888"); c.fill = HELP_FILL
def note(ws, ref, text):
    ws[ref] = text; ws[ref].font = font(**NOTE)
def addv(ws, src, rng, strict=True):
    """Dropdown from a Settings list title, a defined name, or a formula. strict=False also accepts typed values."""
    d = DataValidation(type="list", formula1=LREF.get(src, src), allow_blank=True, showErrorMessage=strict)
    ws.add_data_validation(d); d.add(rng)

wb = Workbook()

# ---------------------------------------------------------------- Settings
S = wb.active
S.title = "Settings"
S["A1"] = "Global settings (shared by every character tab)"; S["A1"].font = font(bold=True, size=14)
S["A2"] = "Yellow cells are editable. Change a rule here if your in-game tests disagree — every character tab updates."
S["A2"].font = font(italic=True, color="555555")
rows = [
    ("Constants", None, None),
    ("ATK damage constant", 0.35, "Prydwen damage formula guide (prydwen.gg/chaos-zero-nightmare/guides/damage-formula)"),
    ("DEF-based card: ATK coefficient", 0.3, "Prydwen: DEF-based damage uses (ATK x 0.3 + DEF x 2.1)"),
    ("DEF-based card: DEF coefficient", 2.1, "Prydwen"),
    ("Extra weakness factor (UNCONFIRMED, for testing)", 0.0, "Your Mei Lin test (204% -> 290% = x1.42 Weakness DMG) shows no extra factor. Leave 0% unless a test says otherwise"),
    ("Vulnerable bonus", 0.5, "Prydwen: 1.5x, consumed per hit"),
    ("Weakness debuff penalty", 0.25, "Prydwen: 0.75x of your damage while the Weakness debuff is on you"),
    ("Crit rate cap", 1.0, "Assumed 100% cap"),
    ("Ravaged: extra damage taken (UNCONFIRMED)", 0.0, "Your note: Ravaged enemies take more damage. Size unknown — set it from a test. Applies to cards with 'Target Ravaged?' = Yes"),
    (None, None, None),
    ("Rules (switch to match in-game tests)", None, None),
    ("Multiplicative (no '+') buffs combine", "Summed", "Summed = 1+a+b (your belief; UltimateGacha cites Reddit testing). Chained = (1+a)x(1+b)"),
]
r = 4
for lab, val, nt in rows:
    if lab and val is None:
        S.cell(r, 1, lab).font = font(bold=True, color="FFFFFF")
        for c in range(1, 4): S.cell(r, c).fill = HDR_FILL
    elif lab:
        S.cell(r, 1, lab).font = font()
        c = S.cell(r, 2, val); c.font = font(color=BLUE); c.fill = INP_FILL; c.border = BOX
        if isinstance(val, float) and val <= 1 and lab not in ("ATK damage constant", "DEF-based card: ATK coefficient"):
            c.number_format = "0%"
        S.cell(r, 3, nt).font = font(size=9, color="555555")
    r += 1
SET = {k: f"Settings!$B${i}" for k, i in [
    ("K", 5), ("DEFATK", 6), ("DEFDEF", 7), ("EA", 8), ("VULN", 9), ("WEAK", 10), ("CRCAP", 11), ("RAV", 12),
    ("MODE", 15)]}

lists = {
    "E": ("Extra stats", ["ATK%", "Flat ATK", "DEF%", "Flat DEF", "Crit Rate", "Crit DMG", "Weakness DMG",
                          "Elemental DMG%", "Extra DMG%", "DoT DMG%"]),
    "F": ("Source categories", ["Character", "Potential", "Partner", "Memory Fragment", "Equipment", "Engraving",
                                "Affection", "Ego Manifestation", "Character Ego Skill", "Partner Ego Skill",
                                "Card Epiphany", "Neutral Card", "Save Data Mutation", "Support Character",
                                "Enemy Debuff", "Other"]),
    "G": ("Scaling", ["ATK", "DEF", "Fixed"]),
    "H": ("Damage kind", ["Normal", "Extra Attack", "DoT"]),
    "J": ("Hit scope", ["All hits", "First hit only"]),
    "K": ("Yes/No", ["Yes", "No"]),
    "M": ("Mult mode", ["Summed", "Chained"]),
    "N": ("Elements", ["Passion", "Justice", "Order", "Instinct", "Void"]),
    "O": ("Classes", ["Striker", "Psionic", "Hunter", "Controller", "Ranger", "Vanguard"]),
    "P": ("Effect kind", ["Stat", "Buff"]),
    "Q": ("Condition", ["Always", "Ravaged only"]),
}
LREF = {}
for col, (title, items) in lists.items():
    S[f"{col}3"] = title; S[f"{col}3"].font = font(bold=True, size=9)
    for i, it in enumerate(items):
        S[f"{col}{4+i}"] = it; S[f"{col}{4+i}"].font = font(size=9)
    LREF[title] = f"Settings!${col}${4}:${col}${3+len(items)}"
S.column_dimensions["A"].width = 40; S.column_dimensions["B"].width = 12; S.column_dimensions["C"].width = 70
for c in "EFGHJKMNOPQ": S.column_dimensions[c].width = 20
addv(S, "Mult mode", "B15")

# ---------------------------------------------------------------- Presets
P = wb.create_sheet("Presets")
PR0, CH1, PT1, EF1 = 6, 55, 105, 505   # first data row; last row of Characters / Partners / Effects
EFC = ["P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "AA", "AB"]   # Effects input columns
P["A1"] = "Character & partner presets (shared by every character tab)"; P["A1"].font = font(bold=True, size=14)
note(P, "A2", "Add a character, partner or effect by typing a new row — no blank rows in between. Picking a character / partner "
              "on a character tab pulls in its Element, Class and effects. Effects of the tab's character apply to every build; "
              "a partner's effects apply only to builds that picked that partner.")
note(P, "A3", "Effect value: type it as shown in-game (stats: '16%' or '74'; buffs: '+30%' = additive, '30%' = multiplicative, or "
              "'Weakness Attack' = Weakness DMG applies to matching cards). Class-limited partner effects switch off when the "
              "partner's class differs from the character's.")
header(P, 4, "CHARACTERS", 1, 4)
colhdr(P, 5, ["Name", "Element", "Class", "Notes"], 1)
header(P, 4, "PARTNERS", 6, 11)
colhdr(P, 5, ["Name", "Class", "Base HP", "Base DEF", "Base ATK", "Notes"], 6)
header(P, 4, "EFFECTS (one row per effect)", 16, 28)
colhdr(P, 5, ["Owner (character or partner name)", "Kind", "Effect", "Category", "Stat (Kind = Stat)",
              "Value / buff text", "Applies to (Buff)", "Hit scope (Buff)", "Condition (Buff)", "Max stacks",
              "Default stacks ('Yes' = this; blank = 1)", "Class-limited? (partners)", "Notes"], 16)
for r in range(PR0, EF1 + 1):
    if r <= CH1:
        for c in "ABCD": inp(P, f"{c}{r}")
    if r <= PT1:
        for c in "FGHIJK": inp(P, f"{c}{r}")
        # partners sorted by class then name, for the class-filtered partner dropdown
        grey(P, f"L{r}", f'=IF(F{r}="","",COUNTIF($G${PR0}:$G${PT1},"<"&G{r})+COUNTIFS($G${PR0}:$G${PT1},G{r},$F${PR0}:$F${PT1},"<"&F{r})+1)')
        grey(P, f"M{r}", f'=IFERROR(INDEX($F${PR0}:$F${PT1},MATCH({r-PR0+1},$L${PR0}:$L${PT1},0))&"","")')
        grey(P, f"N{r}", f'=IFERROR(INDEX($G${PR0}:$G${PT1},MATCH({r-PR0+1},$L${PR0}:$L${PT1},0))&"","")')
    for c in EFC: inp(P, f"{c}{r}")
    P[f"U{r}"].number_format = "@"
    grey(P, f"AD{r}", f'=IF(OR(P{r}="",Q{r}=""),"",P{r}&"|"&Q{r}&"|"&COUNTIFS(P${PR0}:P{r},P{r},Q${PR0}:Q{r},Q{r}))')
for c, t in [("L", "sort #"), ("M", "sorted name"), ("N", "sorted class"), ("AD", "lookup key")]:
    P[f"{c}5"] = t; P[f"{c}5"].font = font(size=8, color="888888")
addv(P, "Elements", f"B{PR0}:B{CH1}"); addv(P, "Classes", f"C{PR0}:C{CH1}"); addv(P, "Classes", f"G{PR0}:G{PT1}")
addv(P, "Effect kind", f"Q{PR0}:Q{EF1}"); addv(P, "Source categories", f"S{PR0}:S{EF1}")
addv(P, "Extra stats", f"T{PR0}:T{EF1}"); addv(P, "Hit scope", f"W{PR0}:W{EF1}")
addv(P, "Condition", f"X{PR0}:X{EF1}"); addv(P, "Yes/No", f"AA{PR0}:AA{EF1}")
P["A6"], P["B6"], P["C6"], P["D6"] = "Mei Lin", "Passion", "Striker", "Character buffs still to be entered (many are conditional)"
P["F6"], P["G6"], P["H6"], P["I6"], P["J6"] = "Marianne", "Striker", 144, 5, 155
P["K6"] = "Base stats are already included in the stats-screen numbers (not added again)"
for i, row in enumerate([
        ("Marianne", "Stat", "Attack", "Partner", "ATK%", "16%", None, None, None, None, None, "Yes", None),
        ("Marianne", "Stat", "Weakness DMG", "Partner", "Weakness DMG", "5%", None, None, None, None, None, "Yes", None),
        ("Marianne", "Buff", "Damage vs Ravaged", "Partner", None, "15%", "ALL", "All hits", "Ravaged only", None, None, "Yes",
         "'15% increased damage to Ravaged enemies' — no '+', so multiplicative (owner's rule)"),
        ("Marianne", "Buff", "Basic cards are Weakness Attacks", "Partner", None, "Weakness Attack", "Basic Attack", "All hits",
         "Always", None, None, "Yes", "Weakness DMG applies to Basic Attack cards even when the target isn't weak")]):
    for c, v in zip(EFC, row):
        P[f"{c}{PR0+i}"] = v
for c, w in {"A": 18, "B": 10, "C": 11, "D": 30, "E": 2, "F": 18, "G": 11, "H": 8, "I": 8, "J": 8, "K": 30, "O": 2,
             "P": 18, "Q": 7, "R": 28, "S": 12, "T": 13, "U": 15, "V": 14, "W": 12, "X": 12, "Y": 8, "Z": 12, "AA": 11,
             "AB": 40}.items():
    P.column_dimensions[c].width = w
P.freeze_panes = "A6"
def pre(c): return f"Presets!${c}${PR0}:${c}${EF1}"
PRE_KEY = pre("AD")
for name, ref in [("CharList", f"OFFSET(Presets!$A${PR0},0,0,MAX(1,COUNTA(Presets!$A${PR0}:$A${CH1})),1)"),
                  ("PartnerAll", f"OFFSET(Presets!$M${PR0},0,0,MAX(1,COUNTA(Presets!$F${PR0}:$F${PT1})),1)"),
                  ("PartnerClass", f"Presets!$N${PR0}:$N${PT1}"),
                  ("PartnerStart", f"Presets!$M${PR0}")]:
    wb.defined_names[name] = DefinedName(name, attr_text=ref)

# ---------------------------------------------------------------- Template layout
BUILDS = 3
BC = ["E", "F", "G"]                 # build columns for the top sections
PROW, SHOW, TGT_DEF, TGT_DR = 12, 13, 14, 15
SLOT = ["J", "K", "L"]               # grey helpers in row PROW: distinct partners picked across the builds
screen = [("Attack", "#,##0", "Includes partner base ATK and fragments; not partner effects or equipment"),
          ("Defense", "#,##0", None), ("Health", "#,##0", "Not used in damage yet"),
          ("Critical Chance", "0.0%", None), ("Critical Damage", "0.0%", "Total multiplier: 188.6% = crit hits x1.886"),
          ("Weakness Damage", "0.0%", "Multiplier vs targets weak to your element; base 125%"),
          ("Passion Damage", "0.0%", None), ("Justice Damage", "0.0%", None), ("Order Damage", "0.0%", None),
          ("Instinct Damage", "0.0%", None), ("Void Damage", "0.0%", None),
          ("Extra Damage", "0.0%", "Applies to 'Extra Attack' cards"), ("Damage over time", "0.0%", "Applies to 'DoT' cards")]
SC = {lab: 19 + i for i, (lab, _, _) in enumerate(screen)}   # stats-screen rows
EL0, EL1 = SC["Passion Damage"], SC["Void Damage"]

# Stat boosts (partner effects, equipment, ...): character presets, 3 partner slots, then the owner's own rows
NCS, NPS, NUS = 5, 5, 10
ST0 = 37
ST_PRESET = list(range(ST0, ST0 + NCS + 3 * NPS))   # packed: the character's effects, then partner slots 1-3
ST_USER = list(range(ST0 + NCS + 3 * NPS, ST0 + NCS + 3 * NPS + NUS))
ST1 = ST_USER[-1]
STE = ["L", "M", "N"]                # grey effective count per build

FS0 = ST1 + 5                        # final stats
fin_labels = ["Final ATK", "Final DEF", "Crit Rate (capped)", "Crit DMG", "Elemental DMG%", "Extra DMG%", "DoT DMG%", "Weakness DMG"]
FS = {lab: FS0 + i for i, lab in enumerate(fin_labels)}

# Buffs & debuffs: Morale, Vulnerable, Weakness debuff, character presets, 3 partner slots, then the owner's own rows
NCB, NPB, NUB = 6, 5, 20
B0 = FS0 + len(fin_labels) + 4
VROW, WROW = B0 + 1, B0 + 2
BU_PRESET = list(range(B0 + 3, B0 + 3 + NCB + 3 * NPB))   # packed, like the stat presets
BU_USER = list(range(BU_PRESET[-1] + 1, BU_PRESET[-1] + 1 + NUB))
B1 = BU_USER[-1]
FILT = "AB"                          # grey "show"/"hide" per preset row, used by the sheet's filter
BSW = ["J", "K", "L"]                # per-build switch / stacks
BEF = ["P", "Q", "R"]                # grey effective stacks per build

# Cards and hit breakdown
C0 = B1 + 6
C1 = C0 + 14
OUTC = [("K", "L", "M"), ("N", "O", "P"), ("Q", "R", "S")]
HKEYS = ["AddAll", "AddFirst", "SumAll", "SumFirst", "ProdAll", "ProdFirst", "WeakAtk"]
HELP = {b: {k: L(23 + b * len(HKEYS) + i) for i, k in enumerate(HKEYS)} for b in range(BUILDS)}   # from W
H0 = C1 + 7
MAXR = 300
H1 = H0 + MAXR - 1
HB = [("F", "G", "H", "I"), ("J", "K", "L", "M"), ("N", "O", "P", "Q")]
HTOT = f"$V${C1+1}"

PARTNER_DV = (f'IF(OR($E${SHOW}="Yes",$G$1=""),PartnerAll,IF(ISNA(MATCH($G$1,PartnerClass,0)),PartnerAll,'
              f'OFFSET(PartnerStart,MATCH($G$1,PartnerClass,0)-1,0,COUNTIF(PartnerClass,$G$1),1)))')
PCT_PARSE = 'IF({c}="",0,IF(ISNUMBER({c}),{c},IFERROR(VALUE(SUBSTITUTE(SUBSTITUTE(TRIM({c}),"+",""),"%",""))/{div},0)))'


def class_ok(own, r, idx):
    return (f'=IF(${idx}{r}="",0,IF(OR(INDEX({pre("AA")},${idx}{r})<>"Yes",'
            f'IFERROR(INDEX(Presets!$G${PR0}:$G${PT1},MATCH({own},Presets!$F${PR0}:$F${PT1},0)),"")=$G$1),1,0))')


def packed_rows(T, rows, kind, cum_cells, grp, own, idx):
    """Preset rows filled top-down with no gaps: the character's effects, then partner slots 1-3.
    cum_cells: 4 grey cells with running effect counts; grp/own/idx: grey helper columns per row.
    Returns a warning formula for when the presets don't all fit."""
    owners = ["$C$1"] + [f"${SLOT[s]}${PROW}" for s in range(3)]
    for i, (cell, o) in enumerate(zip(cum_cells, owners)):
        cnt = f'IF({o}="",0,COUNTIFS({pre("P")},{o},{pre("Q")},"{kind}"))'
        grey(T, cell, f"={cnt}" if i == 0 else f"={cum_cells[i-1]}+{cnt}")
    c0, c1, c2, c3 = (f"${cell.rstrip('0123456789')}${cell[len(cell.rstrip('0123456789')):]}" for cell in cum_cells)
    for k, r in enumerate(rows, 1):
        grey(T, f"{grp}{r}", f'=IF({k}>{c3},"",({k}>{c0})+({k}>{c1})+({k}>{c2}))')
        grey(T, f"{own}{r}", f'=IF(${grp}{r}="","",CHOOSE(${grp}{r}+1,{",".join(owners)}))')
        grey(T, f"{idx}{r}", f'=IF(${grp}{r}="","",IFERROR(MATCH(${own}{r}&"|{kind}|"&({k}-CHOOSE(${grp}{r}+1,0,{c0},{c1},{c2})),{PRE_KEY},0),""))')
    return f'=IF({c3}>{len(rows)},"Only the first {len(rows)} preset {kind.lower()} effects fit; the rest are left out","")'


def preset_get(idx):
    def get(c, text=True):
        v = f"INDEX({pre(c)},${idx})"
        return f'=IF(${idx}="","",{v}&"")' if text else f'=IF(${idx}="","",IF({v}="","",{v}))'
    return get


def plain(T, ref):
    """No static fill or border: the look comes from conditional formatting."""
    T[ref].fill = PatternFill(fill_type=None); T[ref].border = Border()


def switch_cf(T, rng, eff_tl, src_tl, preset_rng, idx_tl, preset_out):
    """Switches: green when effectively on, grey when off. Unused preset rows look blank (white, no text);
    used ones get the calculated-cell look."""
    T.conditional_formatting.add(preset_rng, FormulaRule(formula=[f'{idx_tl}=""'], fill=cf_fill("F2F2F2"),
                                                         font=font(color="F2F2F2"), stopIfTrue=True))
    T.conditional_formatting.add(rng, FormulaRule(formula=[f"{eff_tl}>0"], fill=ON_FILL, border=BOX))
    T.conditional_formatting.add(rng, FormulaRule(formula=[f'AND({eff_tl}=0,{src_tl}<>"")'], fill=OFF_FILL, font=font(color="888888"), border=BOX))
    for r in preset_out:
        T.conditional_formatting.add(r, FormulaRule(formula=[f'{idx_tl}<>""'], fill=cf_fill(OUT_FILL.fgColor.rgb[-6:]), border=BOX))


def build_template(T):
    T["A1"] = LAYOUT_VERSION; T["A1"].font = font(size=6, color="BBBBBB")
    T["B1"] = "Character:"; T["B1"].font = font(bold=True, size=14)
    inp(T, "C1"); T["C1"].font = font(bold=True, size=14, color=BLUE)
    addv(T, "CharList", "C1")
    for lab, ref, col in [("Element:", "D1", "B"), ("Class:", "F1", "C")]:
        T[ref] = lab; T[ref].font = font(bold=True, size=12); T[ref].alignment = Alignment(horizontal="right")
        nxt = f"{chr(ord(ref[0]) + 1)}1"
        out(T, nxt, f'=IFERROR(INDEX(Presets!${col}${PR0}:${col}${CH1},MATCH($C$1,Presets!$A${PR0}:$A${CH1},0))&"","")')
        T[nxt].font = font(bold=True, size=12)
    note(T, "B2", "Copy this tab for each character (right-click tab > Move or Copy > Create a copy), then pick the character in C1 "
                  "(add new characters on the Presets tab). Yellow = input, green = calculated. Cards are shared by all builds.")

    # Build summary (totals filled in after the hit breakdown)
    header(T, 4, "BUILD SUMMARY (all cards x times played)")
    colhdr(T, 5, ["", "", ""], 2)
    T["B5"] = "Build name"; T["B5"].font = font(bold=True, size=9)
    for i, c in enumerate(BC): inp(T, f"{c}5", f"Build {'ABC'[i]}"); T[f"{c}5"].font = font(bold=True, color=BLUE)

    # Partner & target
    header(T, 11, "PARTNER & TARGET (per build)")
    T.cell(PROW, 2, "Partner").font = font(size=10, bold=True)
    for c in BC: inp(T, f"{c}{PROW}")
    addv(T, PARTNER_DV, f"E{PROW}:G{PROW}")
    note(T, f"H{PROW}", "Lists partners of the character's class")
    T.cell(SHOW, 2, "Show all partners (allow class mismatch)?").font = font(size=10)
    inp(T, f"E{SHOW}", "No"); addv(T, "Yes/No", f"E{SHOW}")
    note(T, f"F{SHOW}", "Mismatched class: only the partner's base stats and ego skill apply")
    grey(T, f"{SLOT[0]}{PROW}", f'=$E${PROW}&""')
    grey(T, f"{SLOT[1]}{PROW}", f'=IF($F${PROW}=$E${PROW},"",$F${PROW}&"")')
    grey(T, f"{SLOT[2]}{PROW}", f'=IF(OR($G${PROW}=$E${PROW},$G${PROW}=$F${PROW}),"",$G${PROW}&"")')
    T[f"{SLOT[0]}{PROW-1}"] = "partner slots (helper)"; T[f"{SLOT[0]}{PROW-1}"].font = font(size=8, color="FFFFFF")
    for row, lab, d, fmt in [(TGT_DEF, "Enemy DEF multiplier (1 = none; enter from testing)", 1, "0.000"),
                             (TGT_DR, "Enemy damage reduction", 0, "0%")]:
        T.cell(row, 2, lab).font = font(size=10)
        for c in BC: inp(T, f"{c}{row}", d, fmt)

    # Character stats, copied from the in-game detailed stats screen
    header(T, 17, "CHARACTER STATS — copy from the detailed stats screen (includes partner base stats and memory fragments)")
    colhdr(T, 18, ["Stat (as shown in-game)", "", "", "Build A", "Build B", "Build C", "Notes"])
    for lab, fmt, nt in screen:
        r = SC[lab]
        T.cell(r, 2, lab).font = font(size=10)
        for c in BC: inp(T, f"{c}{r}", 1.25 if lab == "Weakness Damage" else None, fmt)
        if nt: T.cell(r, 8, nt).font = font(size=9, color="555555")
    note(T, f"B{EL1+3}", "Percent stats: type them as shown (e.g. 45.3%). Only the element row matching the Element at the top is used.")

    # Stat boosts not on the stats screen
    header(T, ST0 - 3, "STAT BOOSTS NOT ON THE STATS SCREEN — character & partner presets (top), then your own rows (equipment etc.)")
    note(T, f"B{ST0-2}", "Build columns: Yes = on, No = off (a number = that many stacks). Partner rows only count for builds that "
                         "picked that partner. Value: '16%' for percents, '74' for flat.")
    colhdr(T, ST0 - 1, ["Source", "Stat", "Value", "Build A", "Build B", "Build C", "Category", "Notes"])
    for c, t in zip("KLMNOPQ", ["value", "eff A", "eff B", "eff C", "default", "preset #", "class ok"]):
        T[f"{c}{ST0-1}"] = t; T[f"{c}{ST0-1}"].font = font(size=8, color="888888")
    for c, t in [("R", "owner"), ("S", "group"), ("U", "running count")]:
        T[f"{c}{ST0-1}"] = t; T[f"{c}{ST0-1}"].font = font(size=8, color="888888")
    T[f"K{ST0-3}"] = packed_rows(T, ST_PRESET, "Stat", [f"{c}{ST0}" for c in "UVWX"], "S", "R", "P")
    T[f"K{ST0-3}"].font = font(bold=True, color="FFC7CE")
    for r in ST_PRESET:
        get = preset_get(f"P{r}")
        out(T, f"B{r}", f'=IF($P{r}="","",$R{r}&": "&INDEX({pre("R")},$P{r}))')
        out(T, f"C{r}", get("T")); out(T, f"D{r}", get("U")); out(T, f"H{r}", get("S")); out(T, f"I{r}", get("AB"))
        grey(T, f"O{r}", f'=IF($P{r}="",1,IF(N(INDEX({pre("Z")},$P{r}))=0,1,INDEX({pre("Z")},$P{r})))')
        grey(T, f"Q{r}", f'=IF($S{r}=0,IF($P{r}="",0,1),' + class_ok(f"$R{r}", r, "P")[1:] + ")")
        for b in range(BUILDS):
            inp(T, f"{BC[b]}{r}", "Yes")
            gate = f"IF($S{r}=0,$Q{r},IF({BC[b]}${PROW}=$R{r},$Q{r},0))"
            grey(T, f"{STE[b]}{r}", f'=IF({BC[b]}{r}="Yes",$O{r},N({BC[b]}{r}))*{gate}')
        for c in "BCDEFGHI": plain(T, f"{c}{r}")
    for r in ST_USER:
        for c in "BCD": inp(T, f"{c}{r}")
        for c in BC: inp(T, f"{c}{r}")
        for c in "HI": inp(T, f"{c}{r}")
        grey(T, f"O{r}", 1)
        for b in range(BUILDS):
            grey(T, f"{STE[b]}{r}", f'=IF({BC[b]}{r}="Yes",$O{r},N({BC[b]}{r}))')
    for r in range(ST0, ST1 + 1):
        T[f"D{r}"].number_format = "@"
        grey(T, f"K{r}", "=" + PCT_PARSE.format(c=f"D{r}", div=f'IF(ISNUMBER(SEARCH("%",D{r})),100,1)'))
    T[f"B{ST_USER[0]}"], T[f"C{ST_USER[0]}"], T[f"H{ST_USER[0]}"] = "Equipment slot 1", "Flat ATK", "Equipment"
    T[f"I{ST_USER[0]}"] = "Slot 1 always gives flat ATK"
    addv(T, "Extra stats", f"C{ST_USER[0]}:C{ST1}")
    addv(T, "Source categories", f"H{ST_USER[0]}:H{ST1}")
    addv(T, "Yes/No", f"E{ST0}:G{ST1}", strict=False)
    switch_cf(T, f"E{ST0}:G{ST1}", f"L{ST0}", f"$B{ST0}", f"B{ST0}:I{ST_PRESET[-1]}", f"$P{ST0}",
              [f"B{ST0}:D{ST_PRESET[-1]}", f"H{ST0}:I{ST_PRESET[-1]}"])
    note(T, f"B{ST1+1}", "ATK% / DEF% multiply the stats-screen value; flat ATK / DEF is added after. Other stats add to the screen value.")

    # Final stats
    header(T, FS0 - 2, "FINAL STATS (calculated)")
    colhdr(T, FS0 - 1, ["Stat", "", "", "Build A", "Build B", "Build C", "Formula"])
    def ss(b, name):
        return f'SUMPRODUCT(($C${ST0}:$C${ST1}="{name}")*$K${ST0}:$K${ST1}*${STE[b]}${ST0}:${STE[b]}${ST1})'
    def sc(c, name): return f"N({c}${SC[name]})"
    fin = {
        "Final ATK": (lambda b, c: f"={sc(c,'Attack')}*(1+{ss(b,'ATK%')})+{ss(b,'Flat ATK')}", "#,##0.0",
                      "Screen ATK x (1 + partner/equipment ATK%) + equipment flat ATK"),
        "Final DEF": (lambda b, c: f"={sc(c,'Defense')}*(1+{ss(b,'DEF%')})+{ss(b,'Flat DEF')}", "#,##0.0", "Same structure as ATK"),
        "Crit Rate (capped)": (lambda b, c: f"=MIN({sc(c,'Critical Chance')}+{ss(b,'Crit Rate')},{SET['CRCAP']})", "0.0%", "Capped by Settings"),
        "Crit DMG": (lambda b, c: f"={sc(c,'Critical Damage')}+{ss(b,'Crit DMG')}", "0.0%", "Crit hit = non-crit x this (total multiplier)"),
        "Elemental DMG%": (lambda b, c: f"=IFERROR(N(INDEX({c}${EL0}:{c}${EL1},MATCH($E$1,{LREF['Elements']},0))),0)+{ss(b,'Elemental DMG%')}",
                           "0.0%", "Row for the character's Element; (1 + this) multiplier"),
        "Extra DMG%": (lambda b, c: f"={sc(c,'Extra Damage')}+{ss(b,'Extra DMG%')}", "0.0%", "Applies to 'Extra Attack' cards"),
        "DoT DMG%": (lambda b, c: f"={sc(c,'Damage over time')}+{ss(b,'DoT DMG%')}", "0.0%", "Applies to 'DoT' cards"),
        "Weakness DMG": (lambda b, c: f"={sc(c,'Weakness Damage')}+{ss(b,'Weakness DMG')}", "0.0%",
                         "Multiplier on cards with 'Weakness DMG applies?' = Yes or a Weakness Attack buff"),
    }
    for lab in fin_labels:
        fn, fmt, nt = fin[lab]; r = FS[lab]
        T.cell(r, 2, lab).font = font(size=10)
        for b, c in enumerate(BC): out(T, f"{c}{r}", fn(b, c), fmt)
        T.cell(r, 8, nt).font = font(size=9, color="555555")

    # Buffs & debuffs
    header(T, B0 - 3, "BUFFS & DEBUFFS — morale, vulnerable, weakness, character & partner presets, then your own rows", 2, 17)
    note(T, f"B{B0-2}", "Buff text as shown in-game: '+30%' = Additive, '30%' = Multiplicative, 'Weakness Attack' = Weakness DMG "
                        "applies to matching cards. Applies to: ALL, a card name, or a tag. Build columns: Yes / No, or a number of stacks.")
    colhdr(T, B0 - 1, ["Source", "Category", "Buff text", "Type (auto)", "Applies to", "Hit scope", "Condition", "Max stacks",
                       "Build A", "Build B", "Build C", "Notes"])
    for c, t in zip("OPQRSTU", ["value", "eff A", "eff B", "eff C", "default", "preset #", "class ok"]):
        T[f"{c}{B0-1}"] = t; T[f"{c}{B0-1}"].font = font(size=8, color="888888")
    for c, t in [("V", "owner"), ("W", "group"), ("X", "running count")]:
        T[f"{c}{B0-1}"] = t; T[f"{c}{B0-1}"].font = font(size=8, color="888888")
    T[f"K{B0-3}"] = packed_rows(T, BU_PRESET, "Buff", [f"{c}{B0}" for c in ("X", "Y", "Z", "AA")], "W", "V", "T")
    T[f"K{B0-3}"].font = font(bold=True, color="FFC7CE")
    gates = {}
    for r in BU_PRESET:
        get = preset_get(f"T{r}")
        out(T, f"B{r}", f'=IF($T{r}="","",$V{r}&": "&INDEX({pre("R")},$T{r}))')
        out(T, f"C{r}", get("S")); out(T, f"D{r}", get("U")); out(T, f"F{r}", get("V"))
        out(T, f"G{r}", get("W")); out(T, f"H{r}", get("X")); out(T, f"I{r}", get("Y", text=False)); out(T, f"M{r}", get("AB"))
        grey(T, f"S{r}", f'=IF($T{r}="",1,IF(N(INDEX({pre("Z")},$T{r}))=0,1,INDEX({pre("Z")},$T{r})))')
        grey(T, f"U{r}", f'=IF($W{r}=0,IF($T{r}="",0,1),' + class_ok(f"$V{r}", r, "T")[1:] + ")")
        for b in range(BUILDS):
            inp(T, f"{BSW[b]}{r}", "Yes")
            gates[(r, b)] = f"IF($W{r}=0,$U{r},IF({BC[b]}${PROW}=$V{r},$U{r},0))"
    for r in [B0, VROW, WROW] + BU_USER:
        grey(T, f"S{r}", 1)
        for b in range(BUILDS):
            inp(T, f"{BSW[b]}{r}")
    for r in BU_USER:
        for c in "BCDFGHI": inp(T, f"{c}{r}")
        inp(T, f"M{r}")
    for r in range(B0, B1 + 1):
        T[f"D{r}"].number_format = "@"
        if r not in (VROW, WROW):
            out(T, f"E{r}", f'=IF(D{r}="","",IF(UPPER(TRIM(D{r}))="WEAKNESS ATTACK","Weakness Attack",'
                            f'IF(LEFT(TRIM(D{r}),1)="+","Additive","Multiplicative")))')
            grey(T, f"O{r}", "=" + PCT_PARSE.format(c=f"D{r}", div="100"))
        for b in range(BUILDS):
            sw = f"{BSW[b]}{r}"
            base = f'IF({sw}="Yes",$S{r},N({sw}))'
            grey(T, f"{BEF[b]}{r}", f'=IF($I{r}="",{base},MIN({base},$I{r}))*{gates.get((r, b), 1)}')
    # Fixed rows: calculated look like the preset rows (don't edit); only the build columns J-L are inputs
    for c, v in zip("BCDFGHIM", ["Morale", "Other", "+20%", "ALL", "All hits", None, 20,
                                 "+20% flat per stack, max 20 (Game8; your note). Set stacks per build."]):
        out(T, f"{c}{B0}", v)
    for r, name, key, nt in [(VROW, "Vulnerable (on target)", "VULN", "Damage x (1 + this) on the first N hits in card-table order; N = stacks. Size: Settings."),
                             (WROW, "Weakness debuff (on you)", "WEAK", "Damage x (1 - this) on the first N hits in card-table order; N = stacks. Size: Settings.")]:
        out(T, f"B{r}", name); out(T, f"C{r}", "Enemy Debuff" if key == "VULN" else "Other")
        out(T, f"D{r}", f"={SET[key]}", "0%")
        out(T, f"E{r}", name.split(" (")[0])
        out(T, f"F{r}", "Every hit"); out(T, f"G{r}", "In order")
        for c in "HI": out(T, f"{c}{r}", None)
        out(T, f"M{r}", nt)
        grey(T, f"O{r}", 0)
    addv(T, "Source categories", f"C{BU_USER[0]}:C{B1}")
    addv(T, "Hit scope", f"G{BU_USER[0]}:G{B1}")
    addv(T, "Condition", f"H{BU_USER[0]}:H{B1}")
    addv(T, "Yes/No", f"J{B0}:L{B1}", strict=False)
    for r in BU_PRESET:
        for c in "BCDEFGHIJKLM": plain(T, f"{c}{r}")
    switch_cf(T, f"J{B0}:L{B1}", f"P{B0}", f"$B{B0}", f"B{BU_PRESET[0]}:M{BU_PRESET[-1]}", f"$T{BU_PRESET[0]}",
              [f"B{BU_PRESET[0]}:I{BU_PRESET[-1]}", f"M{BU_PRESET[0]}:M{BU_PRESET[-1]}"])

    # Filter that hides unused preset rows (Data > Reapply / Ctrl+Alt+L after changing character or partners)
    T[f"{FILT}{ST0-1}"] = "Filter"; T[f"{FILT}{ST0-1}"].font = font(size=8, color="888888")
    for rows_, idx in [(ST_PRESET, "P"), (BU_PRESET, "T")]:
        for r in rows_:
            grey(T, f"{FILT}{r}", f'=IF(${idx}{r}="","hide","show")')
        rng = f"{FILT}{rows_[0]}:{FILT}{rows_[-1]}"
        vis = f"SUBTOTAL(103,OFFSET({FILT}{rows_[0]},ROW({rng})-{rows_[0]},0))"
        stale = f'SUMPRODUCT(({rng}="hide")*{vis}+({rng}="show")*(1-{vis}))>0'
        cell = f"K{ST0-3}" if rows_ is ST_PRESET else f"K{B0-3}"
        T[cell] = (f'=IF({stale},"Press Ctrl+Alt+L to refresh which preset rows are shown",'
                   + T[cell].value[1:] + ")")
    T.auto_filter.ref = f"{FILT}{ST0-1}:{FILT}{B1}"
    T.auto_filter.filterColumn.append(FilterColumn(colId=0, customFilters=CustomFilters(customFilter=[CustomFilter(operator="notEqual", val="hide")])))
    for r in ST_PRESET + BU_PRESET:
        T.row_dimensions[r].hidden = True   # nothing picked yet; carry_over unhides the used ones

    # Cards
    header(T, C0 - 3, "CARDS (shared by all builds) — enter each card's damage % as shown in-game (already includes potentials and epiphany)", 2, 19)
    colhdr(T, C0 - 2, [""] * 9 + ["Build A", "", "", "Build B", "", "", "Build C", "", ""])
    colhdr(T, C0 - 1, ["Card", "Tags (comma-separated)", "Scaling", "Damage kind", "Damage % per hit as shown (Fixed: dmg per hit)",
                       "Hits", "Weakness DMG applies?", "Target Ravaged?", "Times played",
                       "Non-crit", "All-crit", "Expected", "Non-crit", "All-crit", "Expected", "Non-crit", "All-crit", "Expected"])
    for c, t in [("U", "start"), ("V", "hit rows")]:
        T[f"{c}{C0-1}"] = t; T[f"{c}{C0-1}"].font = font(size=8, color="888888")
    for b in range(BUILDS):
        for key, cl in HELP[b].items():
            T[f"{cl}{C0-1}"] = f"{'ABC'[b]} {key}"; T[f"{cl}{C0-1}"].font = font(size=8, color="888888")
    T[f"U{C0-2}"] = "Helper columns (don't edit)"; T[f"U{C0-2}"].font = font(size=8, italic=True, color="888888")

    def bufrng(c): return f"${c}${B0}:${c}${B1}"
    for r in range(C0, C1 + 1):
        for c in "BCDE": inp(T, f"{c}{r}")
        inp(T, f"F{r}", fmt="0%")
        inp(T, f"G{r}", fmt="0")
        inp(T, f"H{r}", "No"); inp(T, f"I{r}", "No")
        inp(T, f"J{r}", 1, "0")
        grey(T, f"U{r}", 0 if r == C0 else f"=U{r-1}+V{r-1}")
        grey(T, f"V{r}", f'=IF($B{r}="",0,N($G{r})*N($J{r}))')
        match = (f'SIGN(({bufrng("F")}="ALL")+({bufrng("F")}=$B{r})+ISNUMBER(SEARCH(","&SUBSTITUTE({bufrng("F")}," ","")&",",'
                 f'","&SUBSTITUTE($C{r}," ","")&",")))*({bufrng("F")}<>"")'
                 f'*SIGN(({bufrng("H")}<>"Ravaged only")+($I{r}="Yes"))')
        for b in range(BUILDS):
            eff = bufrng(BEF[b])
            def sp(tp, scope): return f'SUMPRODUCT({match}*({bufrng("E")}="{tp}")*({bufrng("G")}="{scope}")*{bufrng("O")}*{eff})'
            def pp(scope): return f'EXP(SUMPRODUCT({match}*({bufrng("E")}="Multiplicative")*({bufrng("G")}="{scope}")*LN(1+{bufrng("O")}*{eff})))'
            vals = {"AddAll": sp("Additive", "All hits"), "AddFirst": sp("Additive", "First hit only"),
                    "SumAll": sp("Multiplicative", "All hits"), "SumFirst": sp("Multiplicative", "First hit only"),
                    "ProdAll": pp("All hits"), "ProdFirst": pp("First hit only"),
                    "WeakAtk": f'SUMPRODUCT({match}*({bufrng("E")}="Weakness Attack")*{eff})'}
            for key, cl in HELP[b].items():
                grey(T, f"{cl}{r}", "=" + vals[key])
    grey(T, f"V{C1+1}", f"=SUM(V{C0}:V{C1})"); T[f"U{C1+1}"] = "total"; T[f"U{C1+1}"].font = font(size=8, color="888888")
    addv(T, "Scaling", f"D{C0}:D{C1}")
    addv(T, "Damage kind", f"E{C0}:E{C1}")
    addv(T, "Yes/No", f"H{C0}:I{C1}")

    # Hit breakdown: one row per hit of every play, in card-table order
    header(T, H0 - 3, f"HIT BREAKDOWN — every hit of every play, in card-table order (up to {MAXR} hits; Vulnerable/Weakness stacks are used up in this order)", 2, 17)
    colhdr(T, H0 - 2, ["", "", "", "", "Build A", "", "", "", "Build B", "", "", "", "Build C", "", "", ""])
    colhdr(T, H0 - 1, ["Card", "Card #", "Play #", "Hit #", "Card mult", "Non-crit", "Crit", "Expected",
                       "Card mult", "Non-crit", "Crit", "Expected", "Card mult", "Non-crit", "Crit", "Expected"])
    for k in range(1, MAXR + 1):
        r = H0 + k - 1
        def idx(c): return f"INDEX(${c}${C0}:${c}${C1},$C{r})"
        T[f"C{r}"] = f'=IF({k}<={HTOT},COUNTIF($U${C0}:$U${C1},"<="&{k-1}),"")'
        T[f"B{r}"] = f'=IF($C{r}="","",{idx("B")})'
        T[f"D{r}"] = f'=IF($C{r}="","",INT(({k-1}-{idx("U")})/{idx("G")})+1)'
        T[f"E{r}"] = f'=IF($C{r}="","",MOD({k-1}-{idx("U")},{idx("G")})+1)'
        for c in "BCDE": T[f"{c}{r}"].font = font(size=9)
        first = f"$E{r}=1"
        for b in range(BUILDS):
            bc = BC[b]; H = HELP[b]; cm, nc, cc, ex = HB[b]; effc = BEF[b]
            mf = (f'IF({SET["MODE"]}="Chained",{idx(H["ProdAll"])}*IF({first},{idx(H["ProdFirst"])},1),'
                  f'1+{idx(H["SumAll"])}+IF({first},{idx(H["SumFirst"])},0))')
            add = f'{idx(H["AddAll"])}+IF({first},{idx(H["AddFirst"])},0)'
            wk = f'IF(OR({idx("H")}="Yes",{idx(H["WeakAtk"])}>0),{bc}${FS["Weakness DMG"]}*(1+{SET["EA"]}),1)'
            T[f"{cm}{r}"] = (f'=IF($C{r}="","",({idx("F")}*{mf}+{add})*{wk}'
                             f'*(1+IF({k}<=${effc}${VROW},{SET["VULN"]},0))*(1-N({bc}${TGT_DR}))'
                             f'*(1-IF({k}<=${effc}${WROW},{SET["WEAK"]},0))*(1+IF({idx("I")}="Yes",{SET["RAV"]},0)))')
            T[f"{cm}{r}"].number_format = "0.0%"
            mech = f'IF({idx("E")}="Extra Attack",{bc}${FS["Extra DMG%"]},IF({idx("E")}="DoT",{bc}${FS["DoT DMG%"]},0))'
            stat = f'IF({idx("D")}="DEF",{bc}${FS["Final ATK"]}*{SET["DEFATK"]}+{bc}${FS["Final DEF"]}*{SET["DEFDEF"]},{bc}${FS["Final ATK"]})'
            T[f"{nc}{r}"] = (f'=IF($C{r}="","",IF({idx("D")}="Fixed",N({idx("F")}),{cm}{r}*{stat}*{SET["K"]}*(1+{bc}${FS["Elemental DMG%"]})'
                             f'*(1+{mech})*N({bc}${TGT_DEF})))')
            T[f"{cc}{r}"] = f'=IF($C{r}="","",IF({idx("D")}="Fixed",{nc}{r},{nc}{r}*{bc}${FS["Crit DMG"]}))'
            T[f"{ex}{r}"] = (f'=IF($C{r}="","",IF({idx("D")}="Fixed",{nc}{r},{nc}{r}*(1+{bc}${FS["Crit Rate (capped)"]}*({bc}${FS["Crit DMG"]}-1))))')
            for c in (nc, cc, ex): T[f"{c}{r}"].number_format = "#,##0"
            for c in (cm, nc, cc, ex): T[f"{c}{r}"].font = font(size=9)
    # card totals (all plays)
    for ci in range(C1 - C0 + 1):
        cr = C0 + ci
        for b in range(BUILDS):
            _, nc, cc, ex = HB[b]
            for src, dst in zip((nc, cc, ex), OUTC[b]):
                out(T, f"{dst}{cr}", f'=IF($B{cr}="","",SUMIFS(${src}${H0}:${src}${H1},$C${H0}:$C${H1},{ci+1}))', "#,##0")

    # summary rows
    for row, lab, k in [(6, "Total non-crit", 0), (7, "Total expected (crit-weighted)", 2), (8, "Total all-crit", 1)]:
        T.cell(row, 2, lab).font = font(size=10, bold=(k == 2))
        for b, c in enumerate(BC):
            out(T, f"{c}{row}", f'=SUM({OUTC[b][k]}${C0}:{OUTC[b][k]}${C1})', "#,##0", bold=(k == 2))
    T.cell(9, 2, "Expected vs Build A").font = font(size=10)
    for c in BC: out(T, f"{c}9", f'=IF($E$7=0,"",{c}7/$E$7-1)', "+0.0%;-0.0%;0.0%")
    T["H6"] = f'=IF({HTOT}>{MAXR},"Hit breakdown is full: only the first {MAXR} hits are counted","")'
    T["H6"].font = font(bold=True, color="C00000")

    T.column_dimensions["A"].width = 2
    widths = {"B": 34, "C": 22, "D": 14, "E": 13, "F": 13, "G": 13, "H": 13, "I": 13, "J": 11, "K": 11,
              "L": 11, "M": 30, "N": 11, "O": 11, "P": 11, "Q": 11, "R": 11, "S": 11}
    for k, v in widths.items(): T.column_dimensions[k].width = v
    for c in range(21, 23 + BUILDS * len(HKEYS)): T.column_dimensions[L(c)].width = 9
    T.freeze_panes = "C4"
    for rr in range(H0, H1 + 1): T.row_dimensions[rr].outlineLevel = 1


build_template(wb.create_sheet("Template"))

# ---------------------------------------------------------------- How To
G = wb.create_sheet("How To", 0)
lines = [
    ("Chaos Zero Nightmare — Damage Calculator", "title"),
    ("", None),
    ("HOW TO USE", "h"),
    ("1. Right-click the 'Template' tab > Move or Copy > tick 'Create a copy'. Rename it, then pick the Character in C1 (Element and Class fill in).", None),
    ("   New character or partner? Add it on the Presets tab first (name, element/class, and its effects).", None),
    ("2. Partner: pick each build's partner (row 12). Its preset effects switch on for that build only. Class-limited effects need a", None),
    ("   partner of the character's class; 'Show all partners' lists the rest too.", None),
    ("3. Character Stats: for each build, open the character's detailed stats screen in-game (with that build's partner and fragments) and copy every value", None),
    ("   into that build's column (percentages as shown, e.g. 45.3%). The screen includes partner base stats and memory fragments.", None),
    ("4. Stat Boosts: character and partner presets fill in at the top. Add your own rows for save-data equipment (slot 1 always gives flat ATK).", None),
    ("   Each row has one Value; the build columns say whether it's used: Yes / No (or a number of stacks).", None),
    ("   Preset rows (green) fill in from the top; empty reserved rows are hidden by a filter. After changing the character or a partner,", None),
    ("   press Ctrl+Alt+L (Data > Reapply) to refresh which rows show — a red note in the section header reminds you.", None),
    ("5. Buffs & Debuffs: presets fill in at the top; your own rows go below. Type the buff text as shown in-game ('+30%' or '30%');", None),
    ("   the Type fills in by itself. Morale, Vulnerable and Weakness debuff: enter stacks per build. Condition 'Ravaged only' needs a Ravaged target.", None),
    ("6. Cards: enter each card's damage % exactly as the card shows it (it already includes potentials and epiphany), its hits, tags,", None),
    ("   whether Weakness DMG applies (target weak to your element), whether the target is Ravaged, and how many times it's played.", None),
    ("   List cards in the order you play them.", None),
    ("7. Target: enter the enemy DEF multiplier and damage reduction per build.", None),
    ("8. Compare: set up Build A, copy it to Build B, change what you want to test, and read the Build Summary.", None),
    ("", None),
    ("FORMULA USED (Prydwen, updated Apr 2026, with your additions)", "h"),
    ("Final ATK = Stats-screen Attack x (1 + partner/equipment ATK%) + equipment flat ATK", None),
    ("Card mult (per hit) = (Card % as shown x MultFactor + Additive buffs incl. Morale)", None),
    ("        x Weakness DMG (if it applies; base 125%) x (1 + Vulnerable if a stack remains) x (1 - Enemy DR) x (1 - Weakness debuff if a stack remains)", None),
    ("        x (1 + Ravaged extra damage, Settings) on Ravaged targets", None),
    ("   MultFactor = 1 + sum of non-'+' buffs (Summed) or product of (1 + each) (Chained) — set in Settings", None),
    ("ATK damage = Card mult x Final ATK x 0.35 x (1 + Elemental DMG%) x (1 + Extra or DoT DMG%) x Enemy DEF multiplier", None),
    ("DEF damage = same, with (Final ATK x 0.3 + Final DEF x 2.1) in place of Final ATK", None),
    ("Crit hit = Non-crit x Crit DMG (the stat-screen value is the total multiplier, e.g. 188.6% = x1.886);  Expected = Non-crit x (1 + Crit Rate x (Crit DMG - 1)), per hit", None),
    ("Fixed damage: enter the per-hit damage directly; it ignores all multipliers and crit.", None),
    ("", None),
    ("RULES THAT COME FROM YOU OR ARE UNCONFIRMED — verify in-game", "h"),
    ("- '+' = additive, no '+' = multiplicative: from you (post-localization update); no public source found.", None),
    ("- Multiplicative buffs summed: your belief; UltimateGacha reports Reddit testing agreeing. Switchable in Settings.", None),
    ("- Morale: flat +20%/stack added to the card (Game8 example: 2 stacks turns 100% into 140%); 20-stack cap from you.", None),
    ("- Vulnerable and Weakness debuff: one stack is used up per hit, in card-table order across all plays (every hit counts, including Fixed damage).", None),
    ("- Weakness DMG does not apply to non-active damage (e.g. extra attacks) — set 'Weakness DMG applies?' to No for those.", None),
    ("- Partner class-limited effects only work when the partner's class matches the character's; base stats and ego skill always work (from you).", None),
    ("- Ravaged: enemies take more damage (from you); the size is unknown and set to 0% in Settings until tested.", None),
    ("- Enemy DEF multiplier: no known formula yet; back-solve it from an in-game hit.", None),
    ("- Fixed damage and crit: assumed not to crit.", None),
    ("", None),
    ("SOURCES", "h"),
    ("Prydwen damage formula: https://www.prydwen.gg/chaos-zero-nightmare/guides/damage-formula", None),
    ("Game8 Morale: https://game8.co/games/Chaos-Zero-Nightmare/archives/561290", None),
    ("UltimateGacha formula breakdown: https://ultimategacha.com/chaos-zero-nightmare-skill-damage-formula-breakdown-how-modifiers-combos-stack/", None),
    ("STOVE forum test thread: https://page.onstove.com/chaoszeronightmare/en/view/11367707", None),
    ("", None),
    ("COLOR KEY", "h"),
    ("Yellow fill, blue text = input   |   Green fill = calculated   |   Grey = helper, don't edit   |   Switches: green = on, grey = off", None),
]
for i, (t, kind) in enumerate(lines, 1):
    c = G.cell(i, 1, t)
    if kind == "title": c.font = font(bold=True, size=16)
    elif kind == "h": c.font = font(bold=True, color="FFFFFF"); c.fill = HDR_FILL
    else: c.font = font(size=10)
G.column_dimensions["A"].width = 160


# ---------------------------------------------------------------- carry over the owner's data
FIXED_TABS = {"How To", "Settings", "Presets", "Template"}


def copy_presets(old):
    o = old["Presets"]
    for cols, last in [("ABCD", CH1), ("FGHIJK", PT1), (EFC, EF1)]:
        for r in range(PR0, last + 1):
            for c in cols:
                P[f"{c}{r}"] = o[f"{c}{r}"].value


def migrate_v1(o, n):
    """Layout 1 (before presets) -> layout 2."""
    n["C1"] = o["C1"].value
    for c in BC:
        n[f"{c}5"] = o[f"{c}5"].value
        n[f"{c}{TGT_DEF}"], n[f"{c}{TGT_DR}"] = o[f"{c}12"].value, o[f"{c}13"].value
        for i in range(len(screen)):
            n[f"{c}{19+i}"] = o[f"{c}{18+i}"].value
    partners = {P[f"F{r}"].value for r in range(PR0, PT1 + 1)} - {None}
    user = iter(ST_USER)
    for r in range(35, 45):
        src = o[f"B{r}"].value
        vals = {b: o[f"{BC[b]}{r}"].value for b in range(BUILDS) if o[f"{BC[b]}{r}"].value not in (None, "")}
        if src in partners:       # now a preset: pick the partner for the builds that had it
            for b in vals: n[f"{BC[b]}{PROW}"] = src
            continue
        if not vals and src in (None, "Partner effect", "Equipment slot 1"):
            continue
        for v in dict.fromkeys(vals.values()) or [None]:
            nr = next(user)
            n[f"B{nr}"], n[f"C{nr}"], n[f"D{nr}"] = src, o[f"D{r}"].value, v
            n[f"H{nr}"], n[f"I{nr}"] = o[f"C{r}"].value, o[f"H{r}"].value
            for b in range(BUILDS): n[f"{BC[b]}{nr}"] = "Yes" if v is not None and vals.get(b) == v else None
    def sw(v, mx): return "Yes" if v == 1 and mx in (None, 1) else (None if v in (0, None) else v)
    for orow, nrow in [(62, B0), (63, VROW), (64, WROW)]:
        for oc, nc in zip("IJK", BSW): n[f"{nc}{nrow}"] = o[f"{oc}{orow}"].value
    user = iter(BU_USER)
    for r in range(65, 97):
        if o[f"B{r}"].value in (None, "") and o[f"D{r}"].value in (None, ""): continue
        nr = next(user)
        for oc, nc in zip("BCDFGHL", "BCDFGIM"): n[f"{nc}{nr}"] = o[f"{oc}{r}"].value
        for oc, nc in zip("IJK", BSW): n[f"{nc}{nr}"] = sw(o[f"{oc}{r}"].value, o[f"H{r}"].value)
    for i in range(15):
        orow, nrow = 102 + i, C0 + i
        for c in "BCDEFGH": n[f"{c}{nrow}"] = o[f"{c}{orow}"].value
        n[f"J{nrow}"] = o[f"I{orow}"].value


def migrate_v2(o, n):
    """Layout 2 -> 3: one more stat preset row per group (4 rows), so rows from the old user stat rows down move by 4."""
    old_user0 = ST_USER[0] - 4
    for ref in INPUTS:
        c, r = ref.rstrip("0123456789"), int(ref[len(ref.rstrip("0123456789")):])
        if r < old_user0:
            n[ref] = o[ref].value
        elif r >= ST_USER[0]:
            n[ref] = o[f"{c}{r-4}"].value


def show_used_presets(n):
    """Unhide the preset rows the tab's character and partners fill (the filter's state when the file opens)."""
    owners = [n["C1"].value] + list(dict.fromkeys(n[f"{c}{PROW}"].value for c in BC))
    effects = [(P[f"P{r}"].value, P[f"Q{r}"].value) for r in range(PR0, EF1 + 1)]
    for kind, rows_ in [("Stat", ST_PRESET), ("Buff", BU_PRESET)]:
        used = sum(1 for o, k in effects if k == kind and o and o in owners)
        for r in rows_[:used]:
            n.row_dimensions[r].hidden = False


def carry_over(old):
    if "Presets" in old.sheetnames: copy_presets(old)
    for o in old.worksheets:
        if o.title in FIXED_TABS: continue
        ver = o["A1"].value if o["A1"].value is not None else (1 if o["B1"].value == "Character:" else None)
        if ver not in (1, 2, LAYOUT_VERSION):
            sys.exit(f"Tab '{o.title}' isn't a calculator tab this build knows how to carry over (layout {ver}); "
                     "nothing was saved. Move it to another file first.")
        n = wb.create_sheet(o.title)
        build_template(n)
        if ver == 1:
            migrate_v1(o, n)
        elif ver == 2:
            migrate_v2(o, n)
        else:
            for ref in INPUTS: n[ref] = o[ref].value
        show_used_presets(n)
        print(f"Carried over tab '{o.title}' (layout {ver})")


out_path = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).resolve().parent.parent / "output" / "CZN_Damage_Calculator.xlsx"
out_path.parent.mkdir(parents=True, exist_ok=True)
if out_path.exists():
    carry_over(load_workbook(out_path))
wb.save(out_path)
print(f"Saved {out_path} (stat boosts {ST0}-{ST1}, final {FS0}-{FS0+7}, buffs {B0}-{B1}, cards {C0}-{C1}, hits {H0}-{H1})")
