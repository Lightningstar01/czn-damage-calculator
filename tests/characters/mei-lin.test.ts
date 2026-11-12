import { describe, expect, it } from 'vitest'
import { computeBuild } from '../../src/engine/calc'
import { PRESETS } from '../../src/data/presets'
import { newCharacterSave } from '../../src/store/save'
import { type Build, type RotationPlay } from '../../src/engine/types'
import { noStrikeNode, settings } from '../helpers'

// Mei Lin's card text, potentials and Ember are in tests/engine/cards.test.ts and plays.test.ts (the engine's first character);
// these are her card buffs and Manifest Ego.
describe('Mei Lin', () => {
  const ownerBuild = (change: (a: Build) => void = () => {}) => {
    const cs = newCharacterSave()
    const [a] = cs.builds
    a.stats.attack = 100
    noStrikeNode(a)
    change(a)
    return { cs, a }
  }
  const unit = 100 * 0.35
  /** The plays' hits, with the deck holding these presets (ids 'd0', 'd1'...). */
  const run = (deck: string[], rotation: RotationPlay[], change?: (a: Build) => void) => {
    const { a } = ownerBuild(change)
    a.deck = deck.map((preset, i) => ({ id: `d${i}`, preset }))
    a.rotation = rotation
    return computeBuild(PRESETS, 'Mei Lin', a, settings).plays
  }

  it("Jewel's and Unity's buffs are multiplicative and add up (Summed); Jewel applies Passion Weakness", () => {
    const strike = (deck: string[]) => run(['card-338', ...deck], [{ cardId: 'd0' }])[0].hits[0].cardMult
    expect(strike(['card-340'])).toBeCloseTo(1.2 * 1.25)
    expect(strike(['card-342'])).toBeCloseTo(1.2)   // Jewel II: Tenacity Damage instead of the Weakness
    expect(strike(['card-353'])).toBeCloseTo(1.5)
    expect(strike(['card-357'])).toBeCloseTo(2)
    expect(strike(['card-340', 'card-357'])).toBeCloseTo((1 + 0.2 + 1) * 1.25)
  })

  it('Jewel IV: +30% Critical Chance', () => {
    const [plain] = run(['card-338'], [{ cardId: 'd0' }])
    const [jewel] = run(['card-338', 'card-344'], [{ cardId: 'd0' }])
    expect(jewel.hits[0].critRate - plain.hits[0].critRate).toBeCloseTo(0.3)
  })

  it('E1: Sovereignty always crits on a Ravaged target, from E1 only', () => {
    const sovereignty = (egoLevel: number, ravaged: boolean) =>
      run(['card-364'], [{ cardId: 'd0', ravaged }], (a) => { a.egoLevel = egoLevel })[0]
    const on = sovereignty(1, true)
    expect(on.nonCrit).toBeCloseTo(3 * 1.25 * unit)
    expect(on.hits[0].critRate).toBe(1)
    expect(on.expected).toBeCloseTo(on.crit)
    expect(sovereignty(1, false).hits[0].critRate).toBeCloseTo(0.03)
    expect(sovereignty(0, true).hits[0].critRate).toBeCloseTo(0.03)
  })

  it('E4 Flame Dragon Awakens: +20% on Attack Cards, +20% more against a Ravaged target', () => {
    const e4 = (a: Build) => { a.egoLevel = 4 }
    const [strike, ravagedStrike, jewelV] = run(['card-338', 'card-345'], [{ cardId: 'd0' }, { cardId: 'd0', ravaged: true }, { cardId: 'd1' }], e4)
    expect(strike.hits[0].cardMult).toBeCloseTo(1.2)
    expect(ravagedStrike.hits[0].cardMult).toBeCloseTo(1.4)
    // Jewel V is an Upgrade card, On Ravage: only the Ravaged part
    expect(jewelV.hits[0].cardMult).toBeCloseTo(3.2)
    expect(run(['card-338'], [{ cardId: 'd0', ravaged: true }])[0].hits[0].cardMult).toBeCloseTo(1)
  })
})
