"""Import every character and their cards from Prydwen into the website's presets.

    .venv\\Scripts\\python.exe scripts/import_prydwen.py [--html saved_page.html]

Writes web/src/data/prydwen/<character-slug>.json (one file per character) and _meta.json.
These files are generated: never edit them by hand. Our own additions (buffs, notes, corrections)
go in web/src/data/characters/<slug>.ts, keyed by the card ids here, so re-importing never
overwrites them. Run it again after a game update and review the git diff.

Prydwen has no card list page, but every character page embeds the full card list (Next.js
server data), so one page is fetched. Card text keeps Prydwen's wording, including the "+"
that marks additive buffs (owner's rule, docs/FORMULA.md).
"""
import argparse
import datetime
import html
import json
import re
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "web" / "src" / "data" / "prydwen"
URL = "https://www.prydwen.gg/chaos-zero-nightmare/characters/mei-lin"
ROMAN = r"(?:I|II|III|IV|V)"


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read().decode("utf-8")


def rsc_rows(page):
    """Decode the Next.js flight data: rows of "<id>:<json>\\n" or "<id>:T<hex length>,<text>"."""
    chunks = re.findall(r'self\.__next_f\.push\(\[1,"((?:[^"\\]|\\.)*)"\]\)', page)
    data = "".join(json.loads('"' + c + '"') for c in chunks).encode("utf-8")
    rows, pos, row_id = {}, 0, re.compile(rb"([0-9a-f]+):")
    while pos < len(data):
        m = row_id.match(data, pos)
        if not m:
            nl = data.find(b"\n", pos)
            if nl < 0:
                break
            pos = nl + 1
            continue
        rid, pos = m.group(1).decode(), m.end()
        if data[pos:pos + 1] == b"T":
            comma = data.index(b",", pos)
            end = comma + 1 + int(data[pos + 1:comma], 16)
            rows[rid], pos = data[comma + 1:end].decode("utf-8", "replace"), end
            continue
        nl = data.find(b"\n", pos)
        nl = len(data) if nl < 0 else nl
        try:
            rows[rid] = json.loads(data[pos:nl].decode("utf-8"))
        except ValueError:
            pass
        pos = nl + 1
    return rows


def find_lists(rows):
    """The props object that holds the full 'characters' and 'cards' lists."""
    stack = list(rows.values())
    while stack:
        o = stack.pop()
        if isinstance(o, dict):
            if isinstance(o.get("characters"), list) and isinstance(o.get("cards"), list):
                return o["characters"], o["cards"]
            stack.extend(o.values())
        elif isinstance(o, list):
            stack.extend(o)
    raise SystemExit("Card list not found: Prydwen's page layout changed; update rsc_rows/find_lists")


def plain(text):
    text = re.sub(r"<br\s*/?>", "\n", text)
    text = re.sub(r"</p>\s*<p[^>]*>", "\n", text)
    text = html.unescape(re.sub(r"<[^>]+>", "", text)).replace("​", "").replace("\xa0", " ")
    lines = [re.sub(r"[ \t]+", " ", line).strip() for line in text.split("\n")]
    return "\n".join(line for line in lines if line)


# "300% Damage", "100% Defense-Based Damage", "70% x 3 Damage", "40% Damage × 2", "100% Fixed Damage",
# "180% Piercing Damage", "100% (200%) Damage". Not "+30% Damage" (a buff) or "equal to 50% Damage dealt".
DAMAGE = re.compile(
    r"(?<![+\d.])(\d+(?:\.\d+)?)%\s*(?:\(\d+%\)\s*)?(?:[x×]\s*(\d+)\s*)?(Defense-based\s+|Fixed\s+|Piercing\s+)?"
    r"Damage(?!\s+(?:Amount|dealt|taken))(?:\s*[x×]\s*(\d+))?", re.I)


def damage(text):
    """(base % per hit, hits, scaling, kind word) from the first damage line of the card text."""
    m = DAMAGE.search(text)
    if not m:
        return 0, 0, "ATK", ""
    pct = float(m.group(1)) / 100
    hits = int(m.group(2) or m.group(4) or 1)
    kind = (m.group(3) or "").strip().lower()
    scaling = "DEF" if kind.startswith("defense") else "Fixed" if kind == "fixed" else "ATK"
    return round(pct, 4), hits, scaling, kind


def card_entry(c, base, is_basic, has_epiphanies):
    text = plain(c["cardEffect"])
    pct, hits, scaling, kind = damage(text)
    tags = [t.strip() for t in c["tags"] if t.strip()]
    notes = []
    if kind == "piercing":
        notes.append("Piercing Damage: ignores enemy shields (not modeled), otherwise normal damage")
    if re.search(r"\d+% \(\d+%\) Damage", text):
        notes.append("Uses the first % (the one in brackets is the boosted value)")
    cost = c["cost"]
    if c["costType"] == "EP":
        if c["cardType"] != "Ego Skill":
            notes.append(f"Costs {cost} EP")
        cost = None
    elif not isinstance(cost, int) or cost >= 99:
        tags.append("X-cost" if cost == "X" else "Unplayable" if cost == 99 else f"{cost}-cost")
        cost = None
    card_type = c["cardType"]
    if card_type == "Ego Skill":
        tags.append("Ego Skill")
        card_type = "Skill"
    elif card_type not in ("Attack", "Skill", "Upgrade"):
        tags.append(card_type)
        card_type = "Skill"
    if is_basic:
        tags = ["Basic"] + (["Basic Attack"] if card_type == "Attack" else []) + tags
    if c["cardCategory"] == "Unique Card" and base == c["name"] and not has_epiphanies and c["rarity"] == "Purple":
        notes.append("Mythic card: no epiphanies")
    if re.search(r"\bX\b", text) and pct:
        notes.append("Hits depend on X: set the hits on each play")
    entry = {
        "id": c["slug"],
        "base": base,
        "name": c["name"],
        "category": c["cardCategory"],
        "rarity": c["rarity"],
        "cardType": card_type,
        "cost": cost,
        "element": c["element"],
        "tags": ", ".join(dict.fromkeys(tags)),
        "scaling": scaling,
        "pct": pct,
        "hits": hits,
        "weaknessApplies": "Weakness Attack" in tags,
        "text": text,
    }
    if notes:
        entry["notes"] = ". ".join(notes)
    return entry


def build(page):
    characters, cards = find_lists(rsc_rows(page))
    OUT.mkdir(parents=True, exist_ok=True)
    written = set()
    for ch in sorted(characters, key=lambda c: c["slug"]):
        if ch.get("upcoming"):
            continue
        own = sorted((c for c in cards if c["combatant"] == ch["name"]), key=lambda c: c["cardId"])
        names = {c["name"] for c in own}
        bases = {}
        for c in own:
            m = re.fullmatch(rf"(.+) {ROMAN}", c["name"])
            bases[c["slug"]] = m.group(1) if m and m.group(1) in names else c["name"]
        with_epiphanies = {b for s, b in bases.items() if b != next(c["name"] for c in own if c["slug"] == s)}
        entries = [
            card_entry(c, bases[c["slug"]],
                       c["cardCategory"] == "Starting Card" and not c["isEpiphany"] and c["name"] not in with_epiphanies,
                       bases[c["slug"]] in with_epiphanies)
            for c in own
        ]
        doc = {
            "name": ch["name"],
            "slug": ch["slug"],
            "element": ch["element"],
            "class": ch["class"],
            "rarity": ch["rarity"],
            "cards": entries,
        }
        path = OUT / f"{ch['slug']}.json"
        path.write_text(json.dumps(doc, indent=1, ensure_ascii=False) + "\n", encoding="utf-8", newline="\n")
        written.add(path.name)
        print(f"{ch['name']:12} {len(entries):3} cards")
    for old in OUT.glob("*.json"):
        if old.name not in written and old.name != "_meta.json":
            old.unlink()
            print("removed", old.name)
    meta = {"source": URL, "imported": datetime.date.today().isoformat(), "characters": len(written)}
    (OUT / "_meta.json").write_text(json.dumps(meta, indent=1) + "\n", encoding="utf-8", newline="\n")


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--html", help="use a saved copy of the page instead of downloading it")
    args = ap.parse_args()
    build(Path(args.html).read_text(encoding="utf-8") if args.html else fetch(URL))
