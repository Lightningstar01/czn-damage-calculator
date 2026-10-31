"""Import every character and their cards from Prydwen into the website's presets.

    .venv\\Scripts\\python.exe scripts/import_prydwen.py [--cache folder]

Writes src/data/prydwen/<character-slug>.json (one file per character) and _meta.json.
These files are generated: never edit them by hand. Our own additions (buffs, notes, corrections)
go in src/data/characters/<slug>.ts, keyed by the card ids here, so re-importing never
overwrites them. Run it again after a game update and review the git diff.

Prydwen has no card list page, but every character page embeds the full card list (Next.js
server data). Each character's own page adds their Potential and Manifest Ego (dupes) text, so
one page per character is fetched (--cache keeps the pages, to re-run without downloading). Card text keeps Prydwen's wording, including the "+"
that marks additive buffs (owner's rule, docs/FORMULA.md).

Card art (art only: the site draws the frame) is copied into public/cards/<slug>/ and each card's `image` points there
(owner, 2026-10-27). It comes from cznmetadecks.com (420x632, the game's files): each character's page there lists every
card's art id, and every listed picture is copied, so cards added by hand (extraCards) can use them too. A card is matched by
its name, else its base card's name (epiphanies share their base card's art); unmatched cards copy Prydwen's picture (200x300).
Pictures already copied are kept (--refresh-art downloads them again).
"""
import argparse
import datetime
import html
import json
import re
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "src" / "data" / "prydwen"
ART = ROOT / "public" / "cards"
URL = "https://www.prydwen.gg/chaos-zero-nightmare/characters/{slug}"
META_URL = "https://cznmetadecks.com/characters/{slug}"
META_ART = "https://cdn.czndecksmeta.com/thumbnails/{art}@2x.webp"
ROMAN = r"(?:I|II|III|IV|V)"
AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36"


def download(url):
    req = urllib.request.Request(url, headers={"User-Agent": AGENT})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()


# Prydwen card name -> cznmetadecks card name, where they differ (checked by comparing the pictures)
ART_NAMES = {
    "Maximum Output Charged Shot": "Max Output Charged Shot",
    "Card": "Cards",
    "Throw Dagger": "Knife Toss",
    "Rapid Fire (Luke)": "Chain Fire",
    "High-Velocity AP Round": "HV AP Round",
    "Tracer": "Tracer Shot",
    "Soul Rip": "Soul Riff",
    "Heaven's Healing": "Healing of Light",
    "Dark Mist Secret Ark: Slash": "Dark Mist Secret Art: Slash",
    "Dark Mist Sword: First Form Attack": "Dark Mist Sword: First Form",
    "Dark Mist Sword: Third Form Attack": "Dark Mist Sword: Third Form",
}


def norm(name):
    # ★ stays: Orlea's Softie ★★ has its own picture (on Prydwen only), not Softie ★'s
    return re.sub(r"[^a-z0-9★]", "", name.lower())


def meta_art(page):
    """Card name -> art id from a cznmetadecks character page (each card's `name` comes before its sctName / spineModel)."""
    text = re.sub(r"\\u([0-9a-fA-F]{4})", lambda m: chr(int(m.group(1), 16)), page.replace('\\"', '"'))
    arts = {}
    for m in re.finditer(r'"(?:sctName|spineModel)":"([a-z][a-z0-9_]*)"', text):
        names = re.findall(r'"name":"([^"]+)"', text[max(0, m.start() - 2500):m.start()])
        if names:
            arts.setdefault(norm(names[-1]), m.group(1))
    return arts


def copy_art(slug, entries, page, refresh=False):
    """Save the character's card art in public/cards/<slug>/ and point `image` there. Returns (pictures, cards on Prydwen's)."""
    folder = ART / slug
    folder.mkdir(parents=True, exist_ok=True)
    arts = meta_art(page)
    kept, fallback = set(), 0

    def save(name, url):
        path = folder / name
        if refresh or not path.exists():
            path.write_bytes(download(url))
        kept.add(name)
        return f"cards/{slug}/{name}"

    for art in sorted(set(arts.values())):
        save(f"{art}.webp", META_ART.format(art=art))
    by_base = {}
    for e in entries:
        art = next((arts[norm(n)] for n in (e["name"], e["base"], ART_NAMES.get(e["base"], "")) if norm(n) in arts), None)
        if art:
            e["image"] = f"cards/{slug}/{art}.webp"
        elif e.get("image"):
            # Prydwen's epiphanies have their own URLs for the same picture: keep the base card's
            e["image"] = by_base.get(e["base"]) or save(e["image"].rsplit("/", 1)[1], e["image"])
            by_base[e["base"]] = e["image"]
            fallback += 1
    for old in folder.iterdir():
        if old.name not in kept:
            old.unlink()
    return len(kept), fallback


def fetch(slug, cache=None, url=URL, prefix=""):
    path = Path(cache) / f"{prefix}{slug}.html" if cache else None
    if path and path.exists():
        return path.read_text(encoding="utf-8")
    page = download(url.format(slug=slug)).decode("utf-8")
    if path:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(page, encoding="utf-8")
    return page


def kit_section(page, label, key):
    """[{key: '3-1', name, text}] from a character page's <section aria-label="Potential"> / "Manifest Ego"."""
    m = re.search(rf'<section class="kit-section" aria-label="{label}">(.*?)</section>', page, re.S)
    if not m:
        raise SystemExit(f"No '{label}' section: Prydwen's page layout changed; update kit_section")
    out = []
    for art in re.findall(r'<article class="constellation-database-card">(.*?)</article>', m.group(1), re.S):
        node = re.search(r'<span class="mini-label">(.*?)</span>', art, re.S)
        name = re.search(r"<h3>(.*?)</h3>", art, re.S)
        text = re.search(r'<div class="kit-description[^"]*">(.*)</div>', art, re.S)
        out.append({key: plain(node.group(1)), "name": plain(name.group(1)), "text": plain(text.group(1) if text else "")})
    return out


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
        tags = ["Basic", "Basic Attack" if card_type == "Attack" else "Basic Skill"] + tags
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
    if c.get("image"):
        entry["image"] = c["image"]
    if notes:
        entry["notes"] = ". ".join(notes)
    return entry


def changes(old, doc):
    """What a re-import changes that our additions and saves depend on: card ids (saved decks and characters/<slug>.ts point at them) and numbers."""
    before = {c["id"]: c for c in old["cards"]}
    after = {c["id"]: c for c in doc["cards"]}
    out = [f"card {i} ({before[i]['name']}) is gone: saved decks and our additions may point at it" for i in before if i not in after]
    for i in before.keys() & after.keys():
        a, b = before[i], after[i]
        if a["name"] != b["name"]:
            out.append(f"card {i} was {a['name']}, now {b['name']}: its id may point at another card")
        for field in ("pct", "hits", "cost"):
            if a.get(field) != b.get(field):
                out.append(f"card {i} ({b['name']}): {field} {a.get(field)} -> {b.get(field)}")
    return sorted(out)


def build(cache=None, refresh_art=False):
    characters, cards = find_lists(rsc_rows(fetch("mei-lin", cache)))
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
        page = fetch(ch["slug"], cache)
        pictures, fallback = copy_art(ch["slug"], entries, fetch(ch["slug"], cache, META_URL, "meta-"), refresh_art)
        ego = kit_section(page, "Manifest Ego", "level")
        for e in ego:
            e["level"] = int(e["level"].lstrip("E"))
        doc = {
            "name": ch["name"],
            "slug": ch["slug"],
            "element": ch["element"],
            "class": ch["class"],
            "rarity": ch["rarity"],
            "cards": entries,
            "potentials": kit_section(page, "Potential", "node"),
            "manifestEgo": ego,
        }
        path = OUT / f"{ch['slug']}.json"
        if path.exists():
            for line in changes(json.loads(path.read_text(encoding="utf-8")), doc):
                print(f"CHANGED {ch['name']}: {line}")
        path.write_text(json.dumps(doc, indent=1, ensure_ascii=False) + "\n", encoding="utf-8", newline="\n")
        written.add(path.name)
        print(f"{ch['name']:12} {len(entries):3} cards, {len(doc['potentials'])} potentials, {len(ego)} ego levels, "
              f"{pictures} pictures" + (f", {fallback} cards with Prydwen's art" if fallback else ""))
    # A character missing from the list is never deleted: saves, additions and tests may depend on it, and it may be a slip on the site
    kept = [old.name for old in OUT.glob("*.json") if old.name not in written and old.name != "_meta.json"]
    for name in kept:
        print(f"WARNING: {name} is not in Prydwen's list any more (or is marked upcoming): kept as it was. Check it, and delete it by hand if it's really gone")
    meta = {"source": URL.format(slug="<slug>"), "imported": datetime.date.today().isoformat(), "characters": len(written) + len(kept)}
    (OUT / "_meta.json").write_text(json.dumps(meta, indent=1) + "\n", encoding="utf-8", newline="\n")


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--cache", help="folder for the downloaded pages: reused if there, saved if not")
    ap.add_argument("--refresh-art", action="store_true", help="download the card art again, even pictures already copied")
    args = ap.parse_args()
    # Card names have characters a piped Windows console can't encode (Diana's "、"): a print must not stop the import halfway
    sys.stdout.reconfigure(errors="backslashreplace")
    build(args.cache, args.refresh_art)
