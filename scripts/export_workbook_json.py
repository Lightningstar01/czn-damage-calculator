"""Convert the owner's workbook into a save file for the website.

    .venv\\Scripts\\python.exe scripts/export_workbook_json.py [workbook.xlsx]

Writes:
  output/czn-save.json               import it on the website's Settings tab (Import backup)
  web/tests/fixtures/workbook.json   the same save plus the workbook's cached results, for the parity test

Reads the character tabs (layout version 3) with the values Excel last calculated, so recalc the
workbook in Excel first (scripts/recalc.py) if it was edited outside Excel.
"""
import json
import re
import sys
from pathlib import Path

import openpyxl

ROOT = Path(__file__).resolve().parent.parent
WORKBOOK = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "output" / "CZN_Damage_Calculator.xlsx"
SAVE_OUT = ROOT / "output" / "czn-save.json"
FIXTURE_OUT = ROOT / "web" / "tests" / "fixtures" / "workbook.json"
PRESETS_TS = ROOT / "web" / "src" / "data" / "presets.ts"

LAYOUT_VERSION = 3
BUILD_COLS = "EFG"              # top sections: Builds A/B/C
BOOST_SW, BUFF_SW = "EFG", "JKL"
BUILD_IDS = ["a", "b", "c"]
ELEMENT_ROWS = {"Passion": 25, "Justice": 26, "Order": 27, "Instinct": 28, "Void": 29}
TOTAL_COLS = ["KLM", "NOP", "QRS"]  # per build: non-crit, crit, expected


def preset_ids():
    """(owner, effect name) -> effect id, read from the website's presets file and character additions
    (characters/<slug>.ts: owner = the character, or the card for effects under a 'card-N' key)."""
    ids, owner = {}, None
    text = PRESETS_TS.read_text(encoding="utf-8")
    pattern = r"name: '((?:[^'\\]|\\.)*)', (?:element|class):|id: '([^']*)', name: '((?:[^'\\]|\\.)*)'"
    for m in re.finditer(pattern, text):
        if m.group(1) is not None:
            owner = m.group(1)
        else:
            ids[(owner, m.group(3))] = m.group(2)
    for path in sorted((PRESETS_TS.parent / "characters").glob("*.ts")):
        imported = json.loads((PRESETS_TS.parent / "prydwen" / f"{path.stem}.json").read_text(encoding="utf-8"))
        card_names = {c["id"]: c["name"] for c in imported["cards"]}
        owner = imported["name"]
        for m in re.finditer(r"'(card-\d+)': \{|id: '([^']*)', name: '((?:[^'\\]|\\.)*)'|cardBuff\('([^']*)', '((?:[^'\\]|\\.)*)'",
                             path.read_text(encoding="utf-8")):
            if m.group(1):
                owner = card_names.get(m.group(1), m.group(1))
            elif m.group(2) is not None:
                ids[(owner, m.group(3))] = m.group(2)
            else:
                ids[(owner, m.group(5))] = m.group(4)
    return ids


def blank(v):
    return v is None or (isinstance(v, str) and v.strip() == "")


def num(v, default=0.0):
    return default if blank(v) else float(v)


def text(v):
    if blank(v):
        return ""
    if isinstance(v, float) and v.is_integer():
        return str(int(v))
    return str(v).strip()


def switch(v, preset):
    """Workbook switch (Yes / No / stacks) -> website switch. Blank preset = on, blank own row = off."""
    if blank(v):
        return True if preset else False
    if isinstance(v, str):
        return v.strip().lower() == "yes"
    return float(v) if not float(v).is_integer() else int(v)


def export_tab(ws, ids, problems):
    name = ws["C1"].value
    builds = []
    for b, col in enumerate(BUILD_COLS):
        def st(row):
            return num(ws[f"{col}{row}"].value)
        builds.append({
            "id": BUILD_IDS[b], "name": text(ws[f"{col}5"].value) or f"Build {'ABC'[b]}",
            "partner": text(ws[f"{col}12"].value),
            "stats": {
                "attack": st(19), "defense": st(20), "health": st(21), "critChance": st(22), "critDmg": st(23),
                "weaknessDmg": st(24), "elemDmg": {e: st(r) for e, r in ELEMENT_ROWS.items()},
                "extraDmg": st(30), "dotDmg": st(31),
            },
            "enemyDefMult": num(ws[f"{col}14"].value, 1.0), "enemyDr": st(15),
            "morale": int(num(ws[f"{BUFF_SW[b]}83"].value)),
            "vulnerable": int(num(ws[f"{BUFF_SW[b]}84"].value)),
            "weaknessDebuff": int(num(ws[f"{BUFF_SW[b]}85"].value)),
            "presetSwitches": {},
        })

    # preset rows: only switches that differ from the default (on) are stored
    for rows, owner_col, label_col, sw_cols in [(range(37, 57), "R", "B", BOOST_SW), (range(86, 107), "V", "B", BUFF_SW)]:
        for r in rows:
            owner = ws[f"{owner_col}{r}"].value
            if blank(owner):
                continue
            effect = text(ws[f"{label_col}{r}"].value)[len(owner) + 2:]
            key_id = ids.get((owner, effect))
            for b, c in enumerate(sw_cols):
                sw = switch(ws[f"{c}{r}"].value, preset=True)
                if sw is True:
                    continue
                if key_id is None:
                    problems.append(f"{name}: preset '{owner}: {effect}' (row {r}) is switched off but isn't in presets.ts")
                    continue
                builds[b]["presetSwitches"][f"{owner}|{key_id}"] = sw

    boosts = []
    for r in range(57, 67):
        if blank(ws[f"B{r}"].value) and blank(ws[f"D{r}"].value):
            continue
        boosts.append({
            "id": f"s{r}", "source": text(ws[f"B{r}"].value), "stat": text(ws[f"C{r}"].value) or "Flat ATK",
            "value": text(ws[f"D{r}"].value), "category": text(ws[f"H{r}"].value), "notes": text(ws[f"I{r}"].value),
            "switches": {BUILD_IDS[b]: switch(ws[f"{c}{r}"].value, preset=False) for b, c in enumerate(BOOST_SW)},
        })

    buffs = []
    for r in range(107, 127):
        if blank(ws[f"B{r}"].value) and blank(ws[f"D{r}"].value):
            continue
        max_stacks = ws[f"I{r}"].value
        buffs.append({
            "id": f"u{r}", "source": text(ws[f"B{r}"].value), "category": text(ws[f"C{r}"].value),
            "value": text(ws[f"D{r}"].value), "typeOverride": "",
            "appliesTo": text(ws[f"F{r}"].value) or "ALL", "hitScope": text(ws[f"G{r}"].value) or "All hits",
            "condition": text(ws[f"H{r}"].value) or "Always", "maxStacks": None if blank(max_stacks) else num(max_stacks),
            "notes": text(ws[f"M{r}"].value),
            "switches": {BUILD_IDS[b]: switch(ws[f"{c}{r}"].value, preset=False) for b, c in enumerate(BUFF_SW)},
        })

    cards, rotation, card_totals = [], [], {}
    for r in range(132, 147):
        if blank(ws[f"B{r}"].value):
            continue
        cid = f"c{r}"
        cards.append({
            "id": cid, "name": text(ws[f"B{r}"].value), "tags": text(ws[f"C{r}"].value),
            "scaling": text(ws[f"D{r}"].value) or "ATK", "kind": text(ws[f"E{r}"].value) or "Normal",
            "pct": num(ws[f"F{r}"].value), "hits": num(ws[f"G{r}"].value, 1),
            "weaknessApplies": text(ws[f"H{r}"].value) == "Yes", "targetRavaged": text(ws[f"I{r}"].value) == "Yes",
        })
        rotation += [cid] * int(num(ws[f"J{r}"].value))
        card_totals[cid] = {BUILD_IDS[b]: [num(ws[f"{c}{r}"].value) for c in cols] for b, cols in enumerate(TOTAL_COLS)}

    save = {
        "builds": builds, "activeBuild": "a", "showAllPartners": text(ws["E13"].value) == "Yes",
        "boosts": boosts, "buffs": buffs, "cards": cards, "rotation": rotation,
    }
    expected = {
        "totals": {BUILD_IDS[b]: [num(ws[f"{c}{r}"].value) for r in (6, 8, 7)] for b, c in enumerate(BUILD_COLS)},
        "cards": card_totals,
    }
    return name, save, expected


def main():
    wb = openpyxl.load_workbook(WORKBOOK, data_only=True)
    st = wb["Settings"]
    settings = {
        "atkConstant": num(st["B5"].value), "defCardAtkCoef": num(st["B6"].value), "defCardDefCoef": num(st["B7"].value),
        "extraWeakness": num(st["B8"].value), "vulnerable": num(st["B9"].value), "weaknessDebuff": num(st["B10"].value),
        "critCap": num(st["B11"].value), "ravaged": num(st["B12"].value), "multMode": text(st["B15"].value) or "Summed",
        "moralePerStack": 0.2, "moraleMax": 20,
    }
    ids, problems = preset_ids(), []
    characters, expected = {}, {}
    for ws in wb.worksheets:
        if ws.title in ("How To", "Settings", "Presets", "Template") or ws["A1"].value != LAYOUT_VERSION:
            continue
        if ws["E6"].value is None:
            problems.append(f"{ws.title}: no cached results; open and save it in Excel (or run scripts/recalc.py) first")
        name, save, exp = export_tab(ws, ids, problems)
        if not name:
            problems.append(f"{ws.title}: no character picked in C1; skipped")
            continue
        characters[name], expected[name] = save, exp

    data = {"version": 1, "settings": settings, "activeCharacter": next(iter(characters), ""), "characters": characters}
    SAVE_OUT.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
    FIXTURE_OUT.parent.mkdir(parents=True, exist_ok=True)
    FIXTURE_OUT.write_text(json.dumps({"save": data, "expected": expected}, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Exported {len(characters)} character(s): {', '.join(characters) or '-'}")
    print(f"  {SAVE_OUT.relative_to(ROOT)}\n  {FIXTURE_OUT.relative_to(ROOT)}")
    for p in problems:
        print("WARNING:", p)


if __name__ == "__main__":
    main()
