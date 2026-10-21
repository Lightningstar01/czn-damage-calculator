"""Regression test: fill known inputs, recalculate with Excel, compare to hand math.

Run: python -m pytest tests -q     (needs Excel on Windows; skipped if not installed)

Hand math (Final ATK 1000, constant 0.35, so 100% card = 350 per hit; crit 50% rate, 200% Crit DMG):
  Cards, in order: Test (3 hits x 1 play), Two (2 hits x 2 plays), Weak (1 hit, Weakness DMG applies)
  Build A: Morale 2 stacks (+40% additive)          -> mult 1.40 -> 490/hit
           Test 1470 (crit 2940, expected 2205); Two 4 hits = 1960; Weak 1.40 x 1.25 = 1.75 -> 612.5
  Build B: + "30%" multiplicative on ALL            -> (1.0*1.3 + 0.4) = 1.70 -> Test 1785, Two 2380, Weak 743.75
  Build C: Morale 2, "+50%" first-hit-only on tag Attack, 1 Vulnerable stack
           Test hit1 = (1.0 + 0.4 + 0.5) * 1.5 = 2.85, hits 2-3 = 1.40 -> 997.5+490+490 = 1977.5
           Two: the Vulnerable stack is already used up -> 1960

Partner tab (copy of Template; Mei Lin = Striker, Marianne = Striker partner; ATK 1000, no crit):
  Cards: Strike (Basic Attack, 100%, target Ravaged), Other (tag x, 100%, not Ravaged)
  Build A: Marianne, all on -> ATK 1160, Weakness DMG 1.30; Strike mult 1.0 x 1.15 x 1.30 = 1.495
           -> 1.495 x 1160 x 0.35 = 606.97; Other: no Weakness Attack, not Ravaged -> 1160 x 0.35 = 406
  Build B: Marianne with her ATK% switched off -> Strike 1.495 x 350 = 523.25
  Build C: no partner -> 350
Mismatch tab: a Vanguard character with Marianne -> her class-limited effects are off -> 350
"""
import subprocess
import sys
from pathlib import Path

import pytest
from openpyxl import load_workbook

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))
from recalc import find_excel, recalc  # noqa: E402

pytestmark = pytest.mark.skipif(find_excel() is None, reason="Excel not installed")


def fill(T):
    """Write the main test scenario into a Template sheet."""
    for c in "EFG":
        T[f"{c}19"] = 1000   # Attack (stats screen)
        T[f"{c}22"] = 0.5    # Critical Chance
        T[f"{c}23"] = 2.0    # Critical Damage (total multiplier)
    T["J79"] = T["K79"] = T["L79"] = 2                        # Morale stacks per build
    T["L80"] = 1                                              # Build C: 1 Vulnerable stack
    T["B103"], T["D103"], T["F103"], T["G103"], T["K103"] = "Mult test", "30%", "ALL", "All hits", "Yes"
    T["B104"], T["D104"], T["F104"], T["G104"], T["L104"] = "First hit", "+50%", "Attack", "First hit only", "Yes"
    for r, (name, tags, hits, weak, plays) in zip(range(128, 131), [
            ("Test", "Attack", 3, "No", 1), ("Two", "x", 2, "No", 2), ("Weak", "x", 1, "Yes", 1)]):
        T[f"B{r}"], T[f"C{r}"], T[f"D{r}"], T[f"E{r}"], T[f"F{r}"] = name, tags, "ATK", "Normal", 1.0
        T[f"G{r}"], T[f"H{r}"], T[f"I{r}"], T[f"J{r}"] = hits, weak, "No", plays


def fill_partner(T, character):
    T["C1"] = character
    for c in "EFG":
        T[f"{c}19"] = 1000
    T["E12"] = T["F12"] = "Marianne"
    T["F41"] = "No"                                           # Build B: Marianne's ATK% off
    for r, (name, tags, rav) in zip((128, 129), [("Strike", "Basic Attack", "Yes"), ("Other", "x", "No")]):
        T[f"B{r}"], T[f"C{r}"], T[f"D{r}"], T[f"E{r}"], T[f"F{r}"] = name, tags, "ATK", "Normal", 1.0
        T[f"G{r}"], T[f"H{r}"], T[f"I{r}"], T[f"J{r}"] = 1, "No", rav, 1


@pytest.fixture(scope="module")
def wb(tmp_path_factory):
    out = tmp_path_factory.mktemp("wb") / "t.xlsx"
    subprocess.run([sys.executable, str(ROOT / "src" / "build_workbook.py"), str(out)], check=True)
    w = load_workbook(out)
    w["Presets"]["A7"], w["Presets"]["B7"], w["Presets"]["C7"] = "Testy", "Order", "Vanguard"
    for title, character in [("Partner", "Mei Lin"), ("Mismatch", "Testy")]:
        t = w.copy_worksheet(w["Template"])
        t.title = title
        fill_partner(t, character)
    fill(w["Template"])
    w.save(out)
    res = recalc(out)
    assert res.get("status") == "success", res
    return load_workbook(out, data_only=True)


@pytest.fixture(scope="module")
def results(wb):
    return wb["Template"]


def test_final_stats(results):
    assert [results[f"{c}67"].value for c in "EFG"] == [1000, 1000, 1000]
    assert [results[f"{c}74"].value for c in "EFG"] == [1.25, 1.25, 1.25]   # Weakness DMG default
    assert results["E71"].value == 0                                       # no element chosen


def test_build_a_morale_and_crit(results):
    assert results["K128"].value == pytest.approx(1470)
    assert results["L128"].value == pytest.approx(2940)
    assert results["M128"].value == pytest.approx(2205)


def test_times_played(results):
    assert results["K129"].value == pytest.approx(1960)
    assert (results["C154"].value, results["D154"].value, results["E154"].value) == (2, 2, 1)


def test_weakness_dmg_applies(results):
    assert results["F156"].value == pytest.approx(1.75)
    assert results["K130"].value == pytest.approx(612.5)


def test_build_b_multiplicative(results):
    assert results["N128"].value == pytest.approx(1785)
    assert results["N129"].value == pytest.approx(2380)


def test_build_c_first_hit_and_vulnerable_in_order(results):
    assert results["N149"].value == pytest.approx(2.85)
    assert results["N150"].value == pytest.approx(1.40)
    assert results["N152"].value == pytest.approx(1.40)   # card 2: stack already used up
    assert results["Q128"].value == pytest.approx(1977.5)
    assert results["Q129"].value == pytest.approx(1960)


def test_summary(results):
    assert results["E6"].value == pytest.approx(4042.5)
    assert results["E7"].value == pytest.approx(6063.75)
    assert results["F9"].value == pytest.approx(4908.75 / 4042.5 - 1)


def test_character_preset(wb):
    T = wb["Partner"]
    assert (T["E1"].value, T["G1"].value) == ("Passion", "Striker")


def test_partner_stats_per_build(wb):
    T = wb["Partner"]
    assert [T[f"{c}67"].value for c in "EFG"] == pytest.approx([1160, 1000, 1000])
    assert [T[f"{c}74"].value for c in "EFG"] == pytest.approx([1.30, 1.30, 1.25])


def test_partner_ravaged_and_weakness_attack(wb):
    T = wb["Partner"]
    assert T["F149"].value == pytest.approx(1.495)
    assert [T[f"{c}128"].value for c in "KNQ"] == pytest.approx([606.97, 523.25, 350])
    assert T["K129"].value == pytest.approx(406)      # not Basic Attack, not Ravaged


def test_partner_class_mismatch(wb):
    T = wb["Mismatch"]
    assert T["G1"].value == "Vanguard"
    assert T["E67"].value == pytest.approx(1000)
    assert T["K128"].value == pytest.approx(350)
