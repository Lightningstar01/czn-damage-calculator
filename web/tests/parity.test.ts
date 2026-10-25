// Parity with the owner's Excel workbook: the same inputs must give the numbers Excel calculated.
// Regenerate the fixture after editing the workbook: .venv\Scripts\python.exe scripts/export_workbook_json.py
import { describe, expect, it } from 'vitest'
import { computeBuild } from '../src/engine/calc'
import { PRESETS } from '../src/data/presets'
import { migrate } from '../src/store/save'
import fixture from './fixtures/workbook.json'

type Triple = [number, number, number] // non-crit, crit, expected
const expected = fixture.expected as Record<string, { totals: Record<string, Triple>; cards: Record<string, Record<string, Triple>> }>
const save = migrate(fixture.save)

describe.each(Object.keys(save.characters))('workbook tab %s', (name) => {
  const cs = save.characters[name]
  it.each(cs.builds.map((b) => [b.name, b] as const))('%s matches Excel', (_, build) => {
    const r = computeBuild(PRESETS, name, cs, build, save.settings)
    const want = expected[name].totals[build.id]
    expect([r.nonCrit, r.crit, r.expected]).toEqual(want.map((v) => expect.closeTo(v, 6)))
    for (const card of cs.cards) {
      const plays = r.plays.filter((p) => p.card.id === card.id)
      const got = [plays.reduce((a, p) => a + p.nonCrit, 0), plays.reduce((a, p) => a + p.crit, 0), plays.reduce((a, p) => a + p.expected, 0)]
      expect(got, card.name).toEqual(expected[name].cards[card.id][build.id].map((v) => expect.closeTo(v, 6)))
    }
  })
})
