"""Import every equipment piece (weapons, armor, trinkets) from Prydwen into the website's data.

    .venv\\Scripts\\python.exe scripts/import_equipment.py [--cache folder] [--refresh-art]

Writes src/data/prydwen-equipment.json. The file is generated: never edit it by hand. Our own additions (the Effects of the pieces
that change damage) are in src/data/equipmentEffects.ts, keyed by the piece ids here (equip-206), so re-importing never overwrites
them. Run it again after a game update and review the git diff.

Prydwen's equipment page embeds the whole list (Next.js server data, read with import_prydwen's rsc_rows): one page. Effect text
keeps Prydwen's wording, including the "+" that marks additive buffs (owner's rule, docs/FORMULA.md). Each piece's icon (40x40, the
only size Prydwen has; owner, 2026-11-11: small icons in the picker) is copied into public/equipment/<id>.webp and its `image` points
there. Icons already copied are kept (--refresh-art downloads them again).

It is its own script, not part of import_prydwen.py: that one downloads a page and the card art per character and is run per
character (--only); equipment is one page with its own checks, and a problem in either must not stop the other. The download,
page decoding and file writing are import_prydwen's.

The page and the icons are read and checked before anything is written: an empty list, one under half of before, a piece whose
fields don't read (a page layout change, not a game update) or an icon that can't be downloaded stops the import with nothing written.
"""
import argparse
import datetime
import json
import sys
from pathlib import Path

from import_prydwen import ROOT, download, fetch, plain, rsc_rows, write_atomic

OUT = ROOT / "src" / "data" / "prydwen-equipment.json"
ICONS = ROOT / "public" / "equipment"
URL = "https://www.prydwen.gg/chaos-zero-nightmare/equipment"
RARITY = {"3": "Rare", "4": "Legendary", "5": "Mythic"}
STAT = {"Weapon": "ATK", "Armor": "DEF", "Trinket": "HP"}
FIELDS = ("name", "slot", "rarity", "stat", "values", "text", "source", "seasonal")


def find_equipment(rows):
    """The props object that holds the full 'equipment' list."""
    stack = list(rows.values())
    while stack:
        o = stack.pop()
        if isinstance(o, dict):
            if isinstance(o.get("equipment"), list) and o["equipment"] and isinstance(o["equipment"][0], dict):
                return o["equipment"]
            stack.extend(o.values())
        elif isinstance(o, list):
            stack.extend(o)
    raise SystemExit("Equipment list not found: Prydwen's page layout changed; update find_equipment. Nothing written")


def piece(e):
    """One piece as we keep it. A field that is missing or doesn't read raises, and read_pieces reports it."""
    return {
        "id": e["slug"],
        "name": e["name"].strip(),
        "slot": e["slot"],
        "rarity": RARITY[str(e["rarity"])],
        "stat": e["statType"],
        "values": [int(v) for v in e["mainStat"].split("/")],
        "text": plain(e["effect"]),
        "source": e["source"].strip(),
        "seasonal": bool(e["seasonal"]),
        # Prydwen's address for now: plan_icons points it at our copy
        "image": e["image"],
    }


def number(p):
    return int(p["id"].rsplit("-", 1)[1])


def read_pieces(raw):
    """(pieces sorted by their number, what's wrong with the list). Any problem means the page isn't what we expect."""
    pieces, bad = [], []
    for e in raw:
        label = f"{e.get('slug')} ({e.get('name')})"
        try:
            p = piece(e)
            number(p)
        except (KeyError, ValueError, AttributeError, TypeError) as err:
            bad.append(f"{label}: can't read {type(err).__name__} {err}")
            continue
        if not p["name"]:
            bad.append(f"{label}: no name")
        if p["slot"] not in STAT:
            bad.append(f"{label}: unknown slot {p['slot']}")
        elif p["stat"] != STAT[p["slot"]]:
            bad.append(f"{label}: a {p['slot']} with {p['stat']}, expected {STAT[p['slot']]}")
        if len(p["values"]) != 5 or p["values"] != sorted(p["values"]):
            bad.append(f"{label}: its stat values {p['values']} aren't five rising numbers")
        pieces.append(p)
    for key in ("id", "name"):
        seen = set()
        for p in pieces:
            if p[key] in seen:
                bad.append(f"two pieces share the {key} {p[key]}")
            seen.add(p[key])
    return sorted(pieces, key=number), bad


def plan_icons(pieces, refresh=False):
    """The icons for public/equipment/, without writing them: {file name: the downloaded picture, or None to keep the copy already
    there}. Points each piece's `image` there."""
    files = {}
    for p in pieces:
        url = p["image"]
        if not isinstance(url, str) or not url.startswith("https://") or "." not in url.rsplit("/", 1)[-1]:
            raise SystemExit(f"{p['id']} ({p['name']}): its icon address doesn't read ({url!r}). Nothing written")
        name = f"{p['id']}.{url.rsplit('.', 1)[1]}"
        data = download(url) if refresh or not (ICONS / name).exists() else None
        if data is not None and not data:
            raise SystemExit(f"{p['id']} ({p['name']}): its icon came back empty. Nothing written")
        files[name] = data
        p["image"] = f"equipment/{name}"
    return files


def write_icons(files):
    """Write plan_icons's new pictures and delete the ones no piece uses any more."""
    ICONS.mkdir(parents=True, exist_ok=True)
    for name, data in files.items():
        if data is not None:
            write_atomic(ICONS / name, data)
    for old in ICONS.iterdir():
        if old.name not in files:
            old.unlink()


def usual_values(pieces):
    """{(slot, rarity): the stat values most pieces of that slot and rarity have}."""
    counts = {}
    for p in pieces:
        by_values = counts.setdefault((p["slot"], p["rarity"]), {})
        by_values[tuple(p["values"])] = by_values.get(tuple(p["values"]), 0) + 1
    return {key: list(max(v, key=v.get)) for key, v in counts.items()}


def odd_values(pieces):
    """Pieces whose stat values differ from the others of their slot and rarity: read as Prydwen's mistakes, for the owner to check in-game."""
    usual = usual_values(pieces)
    return [f"{p['id']} ({p['name']}): a {p['rarity']} {p['slot']} with {p['stat']} {'/'.join(map(str, p['values']))}, "
            f"the others have {'/'.join(map(str, usual[(p['slot'], p['rarity'])]))}"
            for p in pieces if p["values"] != usual[(p["slot"], p["rarity"])]]


def changes(old, pieces):
    """What a re-import changes that our additions and saves depend on: piece ids (saved builds and our Effects point at them),
    names, rarity and stat values (the flat Attack) and wording (our Effects were read from the old text)."""
    before = {p["id"]: p for p in old}
    after = {p["id"]: p for p in pieces}
    out = [f"{i} ({before[i]['name']}) is gone: saved builds and our additions may point at it" for i in before if i not in after]
    out += [f"{i} ({after[i]['name']}) is new: a {after[i]['rarity']} {after[i]['slot']}: {after[i]['text']}" for i in after if i not in before]
    for i in before.keys() & after.keys():
        a, b = before[i], after[i]
        if a["name"] != b["name"]:
            out.append(f"{i} was {a['name']}, now {b['name']}: its id may point at another piece")
        for field in FIELDS[1:]:
            if a.get(field) != b.get(field):
                was, now = (json.dumps(x.get(field), ensure_ascii=False) for x in (a, b))
                out.append(f"{i} ({b['name']}): {field} {was} -> {now}" + (" (compare our Effects for it)" if field == "text" else ""))
    return sorted(out)


def build(cache=None, refresh_art=False):
    if cache:
        print(f"A page already in {cache} is reused, not downloaded again: empty the folder for a fresh one after a game update")
    pieces, bad = read_pieces(find_equipment(rsc_rows(fetch("_equipment", cache, URL))))
    old = json.loads(OUT.read_text(encoding="utf-8"))["pieces"] if OUT.exists() else []
    for slot in STAT:
        n, was = (sum(1 for p in ps if p["slot"] == slot) for ps in (pieces, old))
        if n == 0 or n < was / 2:
            bad.append(f"{n} {slot} pieces (had {was})")
    if bad:
        raise SystemExit("Nothing written: the list came back incomplete, which is likely a change in the page's layout "
                         "(update the importer) rather than a game update:\n  " + "\n  ".join(bad))
    files = plan_icons(pieces, refresh_art)
    for line in changes(old, pieces) if old else ():
        print(f"CHANGED {line}")
    for line in odd_values(pieces):
        print(f"CHECK {line}")
    write_icons(files)
    doc = {"source": URL, "imported": datetime.date.today().isoformat(), "pieces": pieces}
    write_atomic(OUT, (json.dumps(doc, indent=1, ensure_ascii=False) + "\n").encode("utf-8"))
    for slot in STAT:
        of_slot = [p for p in pieces if p["slot"] == slot]
        by_rarity = ", ".join(f"{sum(1 for p in of_slot if p['rarity'] == r)} {r}" for r in RARITY.values())
        print(f"{slot:8} {len(of_slot):3} ({by_rarity})")
    print(f"{len(pieces)} pieces, {sum(1 for p in pieces if p['seasonal'])} of them seasonal, {sum(1 for d in files.values() if d is not None)} new icons")


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--cache", help="folder for the downloaded page: reused if there, saved if not")
    ap.add_argument("--refresh-art", action="store_true", help="download the icons again, even those already copied")
    args = ap.parse_args()
    # Names may have characters a piped Windows console can't encode: a print must not stop the import halfway
    sys.stdout.reconfigure(errors="backslashreplace")
    build(args.cache, args.refresh_art)
