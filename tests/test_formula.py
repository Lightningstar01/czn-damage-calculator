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
    """Write the test scenario into a Template sheet."""
    for c in "EFG":
        T[f"{c}18"] = 1000   # Attack (stats screen)
        T[f"{c}21"] = 0.5    # Critical Chance
        T[f"{c}22"] = 2.0    # Critical Damage (total multiplier)
    T["I62"] = T["J62"] = T["K62"] = 2                        # Morale stacks per build
    T["K63"] = 1                                              # Build C: 1 Vulnerable stack
    T["B65"], T["D65"], T["F65"], T["G65"], T["J65"] = "Mult test", "30%", "ALL", "All hits", 1
    T["B66"], T["D66"], T["F66"], T["G66"], T["K66"] = "First hit", "+50%", "Attack", "First hit only", 1
    for r, (name, tags, hits, weak, plays) in zip(range(102, 105), [
            ("Test", "Attack", 3, "No", 1), ("Two", "x", 2, "No", 2), ("Weak", "x", 1, "Yes", 1)]):
        T[f"B{r}"], T[f"C{r}"], T[f"D{r}"], T[f"E{r}"], T[f"F{r}"] = name, tags, "ATK", "Normal", 1.0
        T[f"G{r}"], T[f"H{r}"], T[f"I{r}"] = hits, weak, plays


@pytest.fixture(scope="module")
def results(tmp_path_factory):
    out = tmp_path_factory.mktemp("wb") / "t.xlsx"
    subprocess.run([sys.executable, str(ROOT / "src" / "build_workbook.py"), str(out)], check=True)
    wb = load_workbook(out)
    fill(wb["Template"])
    wb.save(out)
    res = recalc(out)
    assert res.get("status") == "success", res
    return load_workbook(out, data_only=True)["Template"]


def test_final_stats(results):
    assert [results[f"{c}49"].value for c in "EFG"] == [1000, 1000, 1000]
    assert [results[f"{c}56"].value for c in "EFG"] == [1.25, 1.25, 1.25]   # Weakness DMG default
    assert results["E53"].value == 0                                       # no element chosen


def test_build_a_morale_and_crit(results):
    assert results["J102"].value == pytest.approx(1470)
    assert results["K102"].value == pytest.approx(2940)
    assert results["L102"].value == pytest.approx(2205)


def test_times_played(results):
    assert results["J103"].value == pytest.approx(1960)
    assert (results["C128"].value, results["D128"].value, results["E128"].value) == (2, 2, 1)


def test_weakness_dmg_applies(results):
    assert results["F130"].value == pytest.approx(1.75)
    assert results["J104"].value == pytest.approx(612.5)


def test_build_b_multiplicative(results):
    assert results["M102"].value == pytest.approx(1785)
    assert results["M103"].value == pytest.approx(2380)


def test_build_c_first_hit_and_vulnerable_in_order(results):
    assert results["N123"].value == pytest.approx(2.85)
    assert results["N124"].value == pytest.approx(1.40)
    assert results["N126"].value == pytest.approx(1.40)   # card 2: stack already used up
    assert results["P102"].value == pytest.approx(1977.5)
    assert results["P103"].value == pytest.approx(1960)


def test_summary(results):
    assert results["E6"].value == pytest.approx(4042.5)
    assert results["E7"].value == pytest.approx(6063.75)
    assert results["F9"].value == pytest.approx(4908.75 / 4042.5 - 1)
