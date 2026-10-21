"""Generate the Chaos Zero Nightmare damage calculator workbook.

Usage: python src/build_workbook.py [output_path]
Default output: output/CZN_Damage_Calculator.xlsx
See CLAUDE.md for the layout map and docs/FORMULA.md for the math.
"""
import sys
from pathlib import Path
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.utils import get_column_letter as L

F = "Arial"
def font(**k): return Font(name=F, **k)
INP_FILL = PatternFill("solid", fgColor="FFF9E5")
HDR_FILL = PatternFill("solid", fgColor="2F3E57")
SUB_FILL = PatternFill("solid", fgColor="DCE3EE")
OUT_FILL = PatternFill("solid", fgColor="E8F4EA")
HELP_FILL = PatternFill("solid", fgColor="F2F2F2")
thin = Side(style="thin", color="C8CCD2")
BOX = Border(left=thin, right=thin, top=thin, bottom=thin)
BLUE = "0000FF"

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
    (None, None, None),
    ("Rules (switch to match in-game tests)", None, None),
    ("Multiplicative (no '+') buffs combine", "Summed", "Summed = 1+a+b (your belief; UltimateGacha cites Reddit testing). Chained = (1+a)x(1+b)"),
]
r = 4
for lab, val, note in rows:
    if lab and val is None:
        S.cell(r, 1, lab).font = font(bold=True, color="FFFFFF")
        for c in range(1, 4): S.cell(r, c).fill = HDR_FILL
    elif lab:
        S.cell(r, 1, lab).font = font()
        c = S.cell(r, 2, val); c.font = font(color=BLUE); c.fill = INP_FILL; c.border = BOX
        if isinstance(val, float) and val <= 1 and lab not in ("ATK damage constant", "DEF-based card: ATK coefficient"):
            c.number_format = "0%"
        S.cell(r, 3, note).font = font(size=9, color="555555")
    r += 1
SET = {k: f"Settings!$B${i}" for k, i in [
    ("K", 5), ("DEFATK", 6), ("DEFDEF", 7), ("EA", 8), ("VULN", 9), ("WEAK", 10), ("CRCAP", 11),
    ("MODE", 14)]}

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
}
LREF = {}
for col, (title, items) in lists.items():
    S[f"{col}3"] = title; S[f"{col}3"].font = font(bold=True, size=9)
    for i, it in enumerate(items):
        S[f"{col}{4+i}"] = it; S[f"{col}{4+i}"].font = font(size=9)
    LREF[title] = f"Settings!${col}$4:${col}${3+len(items)}"
S.column_dimensions["A"].width = 38; S.column_dimensions["B"].width = 12; S.column_dimensions["C"].width = 70
for c in "EFGHJKMN": S.column_dimensions[c].width = 22
dv = DataValidation(type="list", formula1=LREF["Mult mode"]); S.add_data_validation(dv); dv.add("B14")

# ---------------------------------------------------------------- Template
T = wb.create_sheet("Template")
BUILDS = 3
def header(ws, row, text, c1=2, c2=16):
    ws.cell(row, c1, text).font = font(bold=True, color="FFFFFF", size=11)
    for c in range(c1, c2 + 1): ws.cell(row, c).fill = HDR_FILL
def colhdr(ws, row, labels, start=2):
    for i, t in enumerate(labels):
        c = ws.cell(row, start + i, t); c.font = font(bold=True, size=9); c.fill = SUB_FILL
        c.alignment = Alignment(wrap_text=True, vertical="center"); c.border = BOX
def inp(ws, ref, val=None, fmt=None):
    c = ws[ref]
    if val is not None: c.value = val
    c.font = font(color=BLUE); c.fill = INP_FILL; c.border = BOX
    if fmt: c.number_format = fmt
def out(ws, ref, formula, fmt=None, bold=False):
    c = ws[ref]; c.value = formula; c.font = font(bold=bold); c.fill = OUT_FILL; c.border = BOX
    if fmt: c.number_format = fmt
def addv(ws, title, rng):
    d = DataValidation(type="list", formula1=LREF[title], allow_blank=True); ws.add_data_validation(d); d.add(rng)

T["B1"] = "Character:"; T["B1"].font = font(bold=True, size=14)
inp(T, "C1", "(name)"); T["C1"].font = font(bold=True, size=14, color=BLUE)
T["D1"] = "Element:"; T["D1"].font = font(bold=True, size=12); T["D1"].alignment = Alignment(horizontal="right")
inp(T, "E1"); T["E1"].font = font(bold=True, size=12, color=BLUE)
addv(T, "Elements", "E1")
T["B2"] = ("Copy this tab for each character (right-click tab > Move or Copy > Create a copy). "
           "Yellow = input, green = calculated. Cards are shared by all builds; everything else can differ per build.")
T["B2"].font = font(italic=True, size=9, color="555555")
BC = ["E", "F", "G"]  # build columns for top sections

# Build summary (totals filled in after the hit breakdown)
header(T, 4, "BUILD SUMMARY (all cards x times played)")
colhdr(T, 5, ["", "", ""], 2)
T["B5"] = "Build name"; T["B5"].font = font(bold=True, size=9)
for i, c in enumerate(BC): inp(T, f"{c}5", f"Build {'ABC'[i]}"); T[f"{c}5"].font = font(bold=True, color=BLUE)

# Target
header(T, 11, "TARGET (per build)")
TGT_DEF, TGT_DR = 12, 13
for row, lab, d, fmt in [(TGT_DEF, "Enemy DEF multiplier (1 = none; enter from testing)", 1, "0.000"),
                         (TGT_DR, "Enemy damage reduction", 0, "0%")]:
    T.cell(row, 2, lab).font = font(size=10)
    for c in BC: inp(T, f"{c}{row}", d, fmt)

# Character stats, copied from the in-game detailed stats screen
header(T, 16, "CHARACTER STATS — copy from the detailed stats screen (includes partner base stats and memory fragments)")
colhdr(T, 17, ["Stat (as shown in-game)", "", "", "Build A", "Build B", "Build C", "Notes"])
screen = [("Attack", "#,##0", "Includes partner base ATK and fragments; not partner effects or equipment"),
          ("Defense", "#,##0", None), ("Health", "#,##0", "Not used in damage yet"),
          ("Critical Chance", "0.0%", None), ("Critical Damage", "0.0%", "Total multiplier: 188.6% = crit hits x1.886"),
          ("Weakness Damage", "0.0%", "Multiplier vs targets weak to your element; base 125%"),
          ("Passion Damage", "0.0%", None), ("Justice Damage", "0.0%", None), ("Order Damage", "0.0%", None),
          ("Instinct Damage", "0.0%", None), ("Void Damage", "0.0%", None),
          ("Extra Damage", "0.0%", "Applies to 'Extra Attack' cards"), ("Damage over time", "0.0%", "Applies to 'DoT' cards")]
SC = {}
for i, (lab, fmt, note) in enumerate(screen):
    r = 18 + i; SC[lab] = r
    T.cell(r, 2, lab).font = font(size=10)
    for c in BC: inp(T, f"{c}{r}", 1.25 if lab == "Weakness Damage" else None, fmt)
    if note: T.cell(r, 8, note).font = font(size=9, color="555555")
EL0, EL1 = SC["Passion Damage"], SC["Void Damage"]
T["B31"] = "Percent stats: type them as shown (e.g. 45.3%). Only the element row matching the Element at the top is used."
T["B31"].font = font(italic=True, size=9, color="555555")

# Partner effects and equipment: not shown on the stats screen
SS0, SS1 = 35, 44
header(T, 33, "PARTNER EFFECTS & EQUIPMENT — bonuses NOT on the stats screen (partner ATK% / Weakness DMG, save-data equipment)")
colhdr(T, 34, ["Source", "Category", "Stat", "Build A", "Build B", "Build C", "Notes"])
for r in range(SS0, SS1 + 1):
    for c in "BCD": inp(T, f"{c}{r}")
    for c in BC: inp(T, f"{c}{r}", fmt="General")
    inp(T, f"H{r}")
for r, (src, cat, stat, note) in zip(range(SS0, SS1 + 1), [
        ("Partner effect", "Partner", "ATK%", "e.g. +16% Attack"),
        ("Equipment slot 1", "Equipment", "Flat ATK", "Slot 1 always gives flat ATK")]):
    T[f"B{r}"], T[f"C{r}"], T[f"D{r}"], T[f"H{r}"] = src, cat, stat, note
addv(T, "Source categories", f"C{SS0}:C{SS1}")
addv(T, "Extra stats", f"D{SS0}:D{SS1}")
T[f"B{SS1+1}"] = "ATK% / DEF% multiply the stats-screen value; flat ATK / DEF is added after. Other stats add to the screen value."
T[f"B{SS1+1}"].font = font(italic=True, size=9, color="555555")

# Final stats
header(T, 47, "FINAL STATS (calculated)")
colhdr(T, 48, ["Stat", "", "", "Build A", "Build B", "Build C", "Formula"])
def ss(col, name): return f'SUMIFS({col}${SS0}:{col}${SS1},$D${SS0}:$D${SS1},"{name}")'
def sc(col, name): return f"N({col}${SC[name]})"
FS = {}
fin = [
    ("Final ATK", lambda c: f"={sc(c,'Attack')}*(1+{ss(c,'ATK%')})+{ss(c,'Flat ATK')}", "#,##0.0",
     "Screen ATK x (1 + partner/equipment ATK%) + equipment flat ATK"),
    ("Final DEF", lambda c: f"={sc(c,'Defense')}*(1+{ss(c,'DEF%')})+{ss(c,'Flat DEF')}", "#,##0.0", "Same structure as ATK"),
    ("Crit Rate (capped)", lambda c: f"=MIN({sc(c,'Critical Chance')}+{ss(c,'Crit Rate')},{SET['CRCAP']})", "0.0%", "Capped by Settings"),
    ("Crit DMG", lambda c: f"={sc(c,'Critical Damage')}+{ss(c,'Crit DMG')}", "0.0%", "Crit hit = non-crit x this (total multiplier)"),
    ("Elemental DMG%", lambda c: f"=IFERROR(N(INDEX({c}${EL0}:{c}${EL1},MATCH($E$1,{LREF['Elements']},0))),0)+{ss(c,'Elemental DMG%')}",
     "0.0%", "Row for the character's Element; (1 + this) multiplier"),
    ("Extra DMG%", lambda c: f"={sc(c,'Extra Damage')}+{ss(c,'Extra DMG%')}", "0.0%", "Applies to 'Extra Attack' cards"),
    ("DoT DMG%", lambda c: f"={sc(c,'Damage over time')}+{ss(c,'DoT DMG%')}", "0.0%", "Applies to 'DoT' cards"),
    ("Weakness DMG", lambda c: f"={sc(c,'Weakness Damage')}+{ss(c,'Weakness DMG')}", "0.0%",
     "Multiplier on cards with 'Weakness DMG applies?' = Yes (x (1 + Settings extra factor))"),
]
for i, (lab, fn, fmt, note) in enumerate(fin):
    r = 49 + i; FS[lab] = r
    T.cell(r, 2, lab).font = font(size=10)
    for c in BC:
        out(T, f"{c}{r}", fn(c), fmt)
    T.cell(r, 8, note).font = font(size=9, color="555555")

# Buffs & debuffs
B0, B1 = 62, 96
VROW, WROW = B0 + 1, B0 + 2   # prefilled Vulnerable / Weakness debuff rows
header(T, B0 - 3, "BUFFS & DEBUFFS — morale, vulnerable, weakness, set bonuses, epiphanies, partners, supports, ego skills, equipment", 2, 17)
T[f"B{B0-2}"] = ("Type the buff text exactly as shown in-game (e.g. '+30%' or '30%'). A leading '+' = Additive, no '+' = Multiplicative. "
                 "Applies to: ALL, an exact card name, or a tag from the card's Tags. Stacks per build: blank/0 = off.")
T[f"B{B0-2}"].font = font(italic=True, size=9, color="555555")
colhdr(T, B0 - 1, ["Source", "Category", "Buff text", "Type (auto)", "Applies to", "Hit scope", "Max stacks",
                   "Stacks A", "Stacks B", "Stacks C", "Notes"])
for c, t in zip("NOPQ", ["value", "eff A", "eff B", "eff C"]):
    T[f"{c}{B0-1}"] = t; T[f"{c}{B0-1}"].font = font(size=8, color="888888")
def grey(ref, v):
    c = T[ref]; c.value = v; c.font = font(size=8, color="888888"); c.fill = HELP_FILL
for r in range(B0, B1 + 1):
    for c in "BCD": inp(T, f"{c}{r}")
    T[f"D{r}"].number_format = "@"
    out(T, f"E{r}", f'=IF(D{r}="","",IF(LEFT(TRIM(D{r}),1)="+","Additive","Multiplicative"))')
    for c in "FG": inp(T, f"{c}{r}")
    for c in "HIJK": inp(T, f"{c}{r}", fmt="0")
    inp(T, f"L{r}")
    grey(f"N{r}", f'=IF(D{r}="",0,IF(ISNUMBER(D{r}),D{r},IFERROR(VALUE(SUBSTITUTE(SUBSTITUTE(TRIM(D{r}),"+",""),"%",""))/100,0)))')
    for sc_, ec in zip("IJK", "OPQ"):
        grey(f"{ec}{r}", f'=IF(N({sc_}{r})=0,0,IF($H{r}="",{sc_}{r},MIN({sc_}{r},$H{r})))')
T[f"B{B0}"], T[f"C{B0}"], T[f"D{B0}"], T[f"F{B0}"], T[f"G{B0}"], T[f"H{B0}"] = "Morale", "Other", "+20%", "ALL", "All hits", 20
T[f"L{B0}"] = "+20% flat per stack, max 20 (Game8; your note). Set stacks per build."
for r, name, key, note in [(VROW, "Vulnerable (on target)", "VULN", "Damage x (1 + this) on the first N hits in card-table order; N = stacks. Size: Settings."),
                           (WROW, "Weakness debuff (on you)", "WEAK", "Damage x (1 - this) on the first N hits in card-table order; N = stacks. Size: Settings.")]:
    T[f"B{r}"], T[f"C{r}"] = name, "Enemy Debuff" if key == "VULN" else "Other"
    out(T, f"D{r}", f"={SET[key]}", "0%")
    out(T, f"E{r}", name.split(" (")[0])
    out(T, f"F{r}", "Every hit"); out(T, f"G{r}", "In order")
    T[f"L{r}"] = note
    grey(f"N{r}", 0)
addv(T, "Source categories", f"C{B0}:C{B1}")
addv(T, "Hit scope", f"G{B0}:G{B1}")

# Cards
C0, C1 = 102, 116
header(T, C0 - 3, "CARDS (shared by all builds) — enter each card's damage % as shown in-game (already includes potentials and epiphany)", 2, 18)
colhdr(T, C0 - 2, ["", "", "", "", "", "", "", "", "Build A", "", "", "Build B", "", "", "Build C", "", ""])
colhdr(T, C0 - 1, ["Card", "Tags (comma-separated)", "Scaling", "Damage kind", "Damage % per hit as shown (Fixed: dmg per hit)",
                   "Hits", "Weakness DMG applies?", "Times played",
                   "Non-crit", "All-crit", "Expected", "Non-crit", "All-crit", "Expected", "Non-crit", "All-crit", "Expected"])
OUTC = [("J", "K", "L"), ("M", "N", "O"), ("P", "Q", "R")]
# helper columns: T first hit index (0-based) in the hit breakdown, U hit rows; per build: AddAll ... ProdFirst
HELP = {}
col = 22  # V
for b in range(BUILDS):
    HELP[b] = {}
    for key in ["AddAll", "AddFirst", "SumAll", "SumFirst", "ProdAll", "ProdFirst"]:
        HELP[b][key] = L(col); col += 1
for c, t in [("T", "start"), ("U", "hit rows")]:
    T[f"{c}{C0-1}"] = t; T[f"{c}{C0-1}"].font = font(size=8, color="888888")
for b in range(BUILDS):
    for key, cl in HELP[b].items():
        T[f"{cl}{C0-1}"] = f"{'ABC'[b]} {key}"; T[f"{cl}{C0-1}"].font = font(size=8, color="888888")
T[f"T{C0-2}"] = "Helper columns (don't edit)"; T[f"T{C0-2}"].font = font(size=8, italic=True, color="888888")

def bufrng(c): return f"${c}${B0}:${c}${B1}"
for r in range(C0, C1 + 1):
    for c in "BCDE": inp(T, f"{c}{r}")
    inp(T, f"F{r}", fmt="0%")
    inp(T, f"G{r}", fmt="0")
    inp(T, f"H{r}", "No")
    inp(T, f"I{r}", 1, "0")
    grey(f"T{r}", 0 if r == C0 else f"=T{r-1}+U{r-1}")
    grey(f"U{r}", f'=IF($B{r}="",0,N($G{r})*N($I{r}))')
    match = (f'SIGN(({bufrng("F")}="ALL")+({bufrng("F")}=$B{r})+ISNUMBER(SEARCH(","&SUBSTITUTE({bufrng("F")}," ","")&",",'
             f'","&SUBSTITUTE($C{r}," ","")&",")))*({bufrng("F")}<>"")')
    for b in range(BUILDS):
        eff = bufrng("OPQ"[b])
        def sp(tp, scope): return f'SUMPRODUCT({match}*({bufrng("E")}="{tp}")*({bufrng("G")}="{scope}")*{bufrng("N")}*{eff})'
        def pp(scope): return f'EXP(SUMPRODUCT({match}*({bufrng("E")}="Multiplicative")*({bufrng("G")}="{scope}")*LN(1+{bufrng("N")}*{eff})))'
        vals = {"AddAll": "=" + sp("Additive", "All hits"), "AddFirst": "=" + sp("Additive", "First hit only"),
                "SumAll": "=" + sp("Multiplicative", "All hits"), "SumFirst": "=" + sp("Multiplicative", "First hit only"),
                "ProdAll": "=" + pp("All hits"), "ProdFirst": "=" + pp("First hit only")}
        for key, cl in HELP[b].items():
            grey(f"{cl}{r}", vals[key])
HTOT = f"$U${C1+1}"
grey(f"U{C1+1}", f"=SUM(U{C0}:U{C1})"); T[f"T{C1+1}"] = "total"; T[f"T{C1+1}"].font = font(size=8, color="888888")
addv(T, "Scaling", f"D{C0}:D{C1}")
addv(T, "Damage kind", f"E{C0}:E{C1}")
addv(T, "Yes/No", f"H{C0}:H{C1}")

# Hit breakdown: one row per hit of every play, in card-table order
H0 = C1 + 7
MAXR = 300
header(T, H0 - 3, f"HIT BREAKDOWN — every hit of every play, in card-table order (up to {MAXR} hits; Vulnerable/Weakness stacks are used up in this order)", 2, 17)
colhdr(T, H0 - 2, ["", "", "", "", "Build A", "", "", "", "Build B", "", "", "", "Build C", "", "", ""])
colhdr(T, H0 - 1, ["Card", "Card #", "Play #", "Hit #", "Card mult", "Non-crit", "Crit", "Expected",
                   "Card mult", "Non-crit", "Crit", "Expected", "Card mult", "Non-crit", "Crit", "Expected"])
HB = [("F", "G", "H", "I"), ("J", "K", "L", "M"), ("N", "O", "P", "Q")]
for k in range(1, MAXR + 1):
    r = H0 + k - 1
    def idx(c): return f"INDEX(${c}${C0}:${c}${C1},$C{r})"
    T[f"C{r}"] = f'=IF({k}<={HTOT},COUNTIF($T${C0}:$T${C1},"<="&{k-1}),"")'
    T[f"B{r}"] = f'=IF($C{r}="","",{idx("B")})'
    T[f"D{r}"] = f'=IF($C{r}="","",INT(({k-1}-{idx("T")})/{idx("G")})+1)'
    T[f"E{r}"] = f'=IF($C{r}="","",MOD({k-1}-{idx("T")},{idx("G")})+1)'
    for c in "BCDE": T[f"{c}{r}"].font = font(size=9)
    first = f"$E{r}=1"
    for b in range(BUILDS):
        bc = BC[b]; H = HELP[b]; cm, nc, cc, ex = HB[b]; effc = "OPQ"[b]
        mf = (f'IF({SET["MODE"]}="Chained",{idx(H["ProdAll"])}*IF({first},{idx(H["ProdFirst"])},1),'
              f'1+{idx(H["SumAll"])}+IF({first},{idx(H["SumFirst"])},0))')
        add = f'{idx(H["AddAll"])}+IF({first},{idx(H["AddFirst"])},0)'
        wk = f'IF({idx("H")}="Yes",{bc}${FS["Weakness DMG"]}*(1+{SET["EA"]}),1)'
        T[f"{cm}{r}"] = (f'=IF($C{r}="","",({idx("F")}*{mf}+{add})*{wk}'
                         f'*(1+IF({k}<=${effc}${VROW},{SET["VULN"]},0))*(1-N({bc}${TGT_DR}))'
                         f'*(1-IF({k}<=${effc}${WROW},{SET["WEAK"]},0)))')
        T[f"{cm}{r}"].number_format = "0.0%"
        mech = f'IF({idx("E")}="Extra Attack",{bc}${FS["Extra DMG%"]},IF({idx("E")}="DoT",{bc}${FS["DoT DMG%"]},0))'
        stat = f'IF({idx("D")}="DEF",{bc}${FS["Final ATK"]}*{SET["DEFATK"]}+{bc}${FS["Final DEF"]}*{SET["DEFDEF"]},{bc}${FS["Final ATK"]})'
        T[f"{nc}{r}"] = (f'=IF($C{r}="","",IF({idx("D")}="Fixed",N({idx("F")}),{cm}{r}*{stat}*{SET["K"]}*(1+{bc}${FS["Elemental DMG%"]})'
                         f'*(1+{mech})*N({bc}${TGT_DEF})))')
        T[f"{cc}{r}"] = f'=IF($C{r}="","",IF({idx("D")}="Fixed",{nc}{r},{nc}{r}*{bc}${FS["Crit DMG"]}))'
        T[f"{ex}{r}"] = (f'=IF($C{r}="","",IF({idx("D")}="Fixed",{nc}{r},{nc}{r}*(1+{bc}${FS["Crit Rate (capped)"]}*({bc}${FS["Crit DMG"]}-1))))')
        for c in (nc, cc, ex): T[f"{c}{r}"].number_format = "#,##0"
        for c in (cm, nc, cc, ex): T[f"{c}{r}"].font = font(size=9)
H1 = H0 + MAXR - 1
# card totals (all plays)
for ci in range(C1 - C0 + 1):
    cr = C0 + ci
    for b in range(BUILDS):
        _, nc, cc, ex = HB[b]
        for src, dst in zip((nc, cc, ex), OUTC[b]):
            out(T, f"{dst}{cr}", f'=IF($B{cr}="","",SUMIFS(${src}${H0}:${src}${H1},$C${H0}:$C${H1},{ci+1}))', "#,##0")

# summary rows
summ = [(6, "Total non-crit", 0), (7, "Total expected (crit-weighted)", 2), (8, "Total all-crit", 1)]
for row, lab, k in summ:
    T.cell(row, 2, lab).font = font(size=10, bold=(k == 2))
    for b, c in enumerate(BC):
        sc_ = OUTC[b][k]
        out(T, f"{c}{row}", f'=SUM({sc_}${C0}:{sc_}${C1})', "#,##0", bold=(k == 2))
T.cell(9, 2, "Expected vs Build A").font = font(size=10)
for c in BC: out(T, f"{c}9", f'=IF($E$7=0,"",{c}7/$E$7-1)', "+0.0%;-0.0%;0.0%")
T["H6"] = f'=IF({HTOT}>{MAXR},"Hit breakdown is full: only the first {MAXR} hits are counted","")'
T["H6"].font = font(bold=True, color="C00000")

T.column_dimensions["A"].width = 2
widths = {"B": 34, "C": 22, "D": 14, "E": 13, "F": 13, "G": 13, "H": 13, "I": 13, "J": 11, "K": 11,
          "L": 30, "M": 11, "N": 11, "O": 11, "P": 11, "Q": 11, "R": 11}
for k, v in widths.items(): T.column_dimensions[k].width = v
for c in range(20, col): T.column_dimensions[L(c)].width = 9
T.freeze_panes = "C4"
for rr in range(H0, H1 + 1): T.row_dimensions[rr].outlineLevel = 1

# ---------------------------------------------------------------- How To
G = wb.create_sheet("How To", 0)
lines = [
    ("Chaos Zero Nightmare — Damage Calculator", "title"),
    ("", None),
    ("HOW TO USE", "h"),
    ("1. Right-click the 'Template' tab > Move or Copy > tick 'Create a copy'. Rename it to the character, and pick the Element at the top.", None),
    ("2. Character Stats: for each build, open the character's detailed stats screen in-game (with that build's partner and fragments) and copy every value", None),
    ("   into that build's column (percentages as shown, e.g. 45.3%). The screen includes partner base stats and memory fragments.", None),
    ("3. Partner Effects & Equipment: add what the stats screen leaves out: partner effects (e.g. +16% Attack, +5% Weakness DMG) and", None),
    ("   save-data equipment (slot 1 always gives flat ATK; any piece may give ATK%).", None),
    ("4. Buffs & Debuffs: type the buff text as shown in-game ('+30%' or '30%'); the Type fills in by itself. Set Applies to (ALL / card name / tag),", None),
    ("   hit scope, and stacks per build. Morale, Vulnerable and Weakness debuff are pre-filled: just set their stacks per build.", None),
    ("5. Cards: enter each card's damage % exactly as the card shows it (it already includes potentials and epiphany), its hits, tags,", None),
    ("   whether Weakness DMG applies (the target is weak to your element), and how many times it's played. List cards in the order you play them.", None),
    ("6. Target: enter the enemy DEF multiplier and damage reduction per build.", None),
    ("7. Compare: set up Build A, copy it to Build B, change what you want to test, and read the Build Summary.", None),
    ("", None),
    ("FORMULA USED (Prydwen, updated Apr 2026, with your additions)", "h"),
    ("Final ATK = Stats-screen Attack x (1 + partner/equipment ATK%) + equipment flat ATK", None),
    ("Card mult (per hit) = (Card % as shown x MultFactor + Additive buffs incl. Morale)", None),
    ("        x Weakness DMG (if it applies; base 125%) x (1 + Vulnerable if a stack remains) x (1 - Enemy DR) x (1 - Weakness debuff if a stack remains)", None),
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
    ("Yellow fill, blue text = input   |   Green fill = calculated   |   Grey = helper, don't edit", None),
]
for i, (t, kind) in enumerate(lines, 1):
    c = G.cell(i, 1, t)
    if kind == "title": c.font = font(bold=True, size=16)
    elif kind == "h": c.font = font(bold=True, color="FFFFFF"); c.fill = HDR_FILL
    else: c.font = font(size=10)
G.column_dimensions["A"].width = 160

out_path = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).resolve().parent.parent / "output" / "CZN_Damage_Calculator.xlsx"
out_path.parent.mkdir(parents=True, exist_ok=True)
wb.save(out_path)
print(f"Saved {out_path} (hit breakdown rows {H0}-{H1})")
