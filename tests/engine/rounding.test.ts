import { describe, expect, it } from 'vitest'
import { computeBuild, shownPct } from '../../src/engine/calc'
import { renderCardText, wholePct } from '../../src/engine/cardText'
import type { Card, Settings } from '../../src/engine/types'
import { PRESETS } from '../../src/data/presets'
import { newCharacterSave } from '../../src/store/save'
import { chipsFor } from '../../src/ui/FormulaStrip'
import { gameSettings, settings } from '../helpers'

const custom = (extra: Partial<Card>): Card => ({
  id: 'f', name: 'F', cardType: 'Attack', element: 'Void', cost: 1, tags: '', scaling: 'ATK', kind: 'Normal', pct: 1, hits: 1,
  weaknessApplies: false, targetRavaged: false, upgrade: 'Basic', ...extra,
})

/** The first hit of one play of a custom card at a Basic Card Upgrade level. */
function hitOf(c: Card, level: number, play: { cost?: number; stacks?: Record<string, number> } = {}, s: Settings = gameSettings) {
  const cs = newCharacterSave()
  const [b] = cs.builds
  Object.assign(b, { basicLevel: level, egoLevel: 0, potentialNodes: { '5-1': false, 7: false } })
  b.stats.attack = 1000
  b.deck = [{ id: 'f', custom: c }]
  b.rotation = [{ cardId: 'f', ...play }]
  const r = computeBuild(PRESETS, 'Tressa', cs, b, s)
  return { hit: r.plays[0].hits[0], card: r.plays[0].card }
}

describe('an upgraded card % rounds to whole', () => {
  // [base %, level, shown %]: an exact .5 rounds up, whichever way the float landed (these were 127 and 126 before)
  it.each([[125, 1, 128], [115, 5, 127], [35, 15, 46], [95, 15, 124], [175, 11, 214], [275, 9, 325], [75, 5, 83], [80, 6, 90], [120, 6, 134]])(
    '%i%% at level %i shows %i%%', (base, level, shown) => {
      expect(hitOf(custom({ pct: base / 100 }), level).hit.upgradedPct).toBeCloseTo(shown / 100, 10)
    },
  )

  it('the card text and the damage agree at every level', () => {
    for (const base of [25, 35, 40, 75, 80, 95, 115, 120, 125, 150, 175, 275]) {
      for (let level = 0; level <= 16; level++) {
        const c = custom({ pct: base / 100 })
        const { hit } = hitOf(c, level)
        const cs = newCharacterSave()
        const b = Object.assign(cs.builds[0], { basicLevel: level, egoLevel: 0 })
        const text = renderCardText(`{${base}%}`, { egoLevel: 0, nodeOn: () => true, pct: (x, fixed) => shownPct(x, c, b, undefined, [], gameSettings, fixed) })
        expect(text).toBe(`${Math.round(hit.upgradedPct * 100)}%`)
      }
    }
  })

  it('wholePct leaves whole %s alone', () => {
    expect(wholePct(0.9)).toBeCloseTo(0.9, 12)
    expect(wholePct(0)).toBe(0)
  })

  describe('per unit on per-Cost and per-count cards', () => {
    it('per count: 15% x 1.04 shows 16%, so 6 are 96%, not 94%', () => {
      const { hit } = hitOf(custom({ pct: 0.15, perCount: 'Rhythms' }), 2, { stacks: { Rhythms: 6 } })
      expect(hit.upgradedPct).toBeCloseTo(0.96, 10)
      expect(hit.nonCrit).toBeCloseTo(0.96 * 1000 * 0.35)
    })
    it('per Cost: 80% x 1.02 shows 82%, so Cost 3 is 246%, not 245%', () => {
      expect(hitOf(custom({ pct: 0.8, perCost: true }), 1, { cost: 3 }).hit.upgradedPct).toBeCloseTo(2.46, 10)
    })
    it('a count of 0 is no damage, not an error', () => {
      expect(hitOf(custom({ pct: 0.15, perCount: 'Rhythms' }), 2, { stacks: { Rhythms: 0 } }).hit.nonCrit).toBe(0)
    })
    it('with the setting off, the exact total', () => {
      expect(hitOf(custom({ pct: 0.15, perCount: 'Rhythms' }), 2, { stacks: { Rhythms: 6 } }, settings).hit.upgradedPct).toBeCloseTo(0.936, 10)
    })
    it('the Potential chip says what the game shows for one unit', () => {
      const { hit, card } = hitOf(custom({ pct: 0.15, perCount: 'Rhythms' }), 2, { stacks: { Rhythms: 6 } })
      expect(chipsFor(hit, card).inner.find((c) => c.key === 'pot')!.note).toBe('In-game card %: 16% × 6 (15.6% rounded, Settings).')
    })
  })

  it('a Fixed % raised by the setting rounds too, and its Potential chip says so', () => {
    const fixed = custom({ pct: 0.4, scaling: 'Fixed' })
    const { hit, card } = hitOf(fixed, 6, {}, { ...gameSettings, potentialFixed: true })
    expect(hit.upgradedPct).toBeCloseTo(0.45, 10)
    expect(hit.nonCrit).toBeCloseTo(0.45 * 1000 * 0.35)
    expect(chipsFor(hit, card).inner.find((c) => c.key === 'pot')!.note).toContain('(44.8% rounded, Settings)')
    // Off, as in game so far: 40%, no upgrade
    expect(hitOf(fixed, 6).hit.upgradedPct).toBeCloseTo(0.4, 10)
  })
})
