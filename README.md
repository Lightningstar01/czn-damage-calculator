# CZN Damage Calculator

A fan-made card damage calculator for Chaos Zero Nightmare, for comparing builds per character: partners, memory fragments,
Manifest Ego, potentials, teammates and attack order. It works on a phone, and everything you enter stays in your browser.

**Use it: https://lightningstar01.github.io/czn-damage-calculator/**

The formula, with its sources and what's still unconfirmed, is in [docs/FORMULA.md](docs/FORMULA.md). What's known about each
reviewed character is in [docs/characters/](docs/characters/).

## Running it yourself

```bash
npm install
npm run dev        # local dev server
npm run check      # lint, tests, production build
npm run test:e2e   # the built site in a browser (first: npx playwright install chromium)
```

## Where things are

| Folder | What's in it |
|---|---|
| `src/engine/` | The math, with no UI code |
| `src/data/prydwen/` | Characters and cards written by `scripts/import_prydwen.py` (don't edit by hand) |
| `src/data/characters/`, `partners/` | Hand-written buffs and corrections, checked against the game |
| `src/store/` | Saved data, older-save migration and backups |
| `src/ui/` | The React tabs |
| `tests/`, `e2e/` | Engine and per-character tests; browser tests |

## Credits

Not affiliated with the game's developers. Card text and art come from the game, by way of
[Prydwen](https://www.prydwen.gg/chaos-zero-nightmare) and [cznmetadecks](https://cznmetadecks.com), and belong to their owners.
