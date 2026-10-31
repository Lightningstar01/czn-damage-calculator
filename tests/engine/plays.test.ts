import { describe, expect, it } from 'vitest'
import { computeBuild, type BuildResult } from '../../src/engine/calc'
import { PRESETS } from '../../src/data/presets'
import { newBuff, newBuild, newCharacterSave } from '../../src/store/save'
import { addCards, card, cardFromPreset, noStrikeNode, plays, presets, setPlays, settings } from '../helpers'

describe('per-play stacks', () => {
  const mei = PRESETS.characters.find((c) => c.name === 'Mei Lin')!
  const preset = (id: string) => mei.cards!.find((p) => p.id === id)!
  const setup = (...ids: string[]) => {
    const cs = newCharacterSave()
    const [a] = cs.builds
    a.stats.attack = 1000
    noStrikeNode(a)
    const lib = ids.map((id) => cardFromPreset(preset(id), 'Passion'))
    addCards(cs, ...lib)
    return { cs, a, lib }
  }
  const adds = (r: BuildResult) => r.plays.map((p) => p.hits.map((h) => Math.round(h.additive.value * 100) / 100))

  it('Spirit of the Aromata: the stacks set on each play, capped at 20', () => {
    const { cs, a, lib: [strike, aromata, spire] } = setup('card-338', 'card-358', 'card-346')
    a.rotation = [{ cardId: strike.id }, { cardId: aromata.id }, { cardId: strike.id, stacks: { 'Spirit of the Aromata': 2 } },
      { cardId: spire.id, stacks: { 'Spirit of the Aromata': 25 } }]
    const r = computeBuild(PRESETS, 'Mei Lin', cs, a, settings)
    expect(adds(r)).toEqual([[0], [], [0.4], [4]])
    expect(r.plays[3].counters).toEqual([{ name: 'Spirit of the Aromata', stacks: 20 }])
    a.presetSwitches['Spirit of the Aromata|dmg'] = false
    expect(adds(computeBuild(PRESETS, 'Mei Lin', cs, a, settings))).toEqual([[0], [], [0], [0]])
  })

  it('Aromata V only boosts Basic cards', () => {
    const { cs, a, lib: [strike, aromata, spire] } = setup('card-338', 'card-363', 'card-346')
    const n = { 'Spirit of the Aromata V': 3 }
    a.rotation = [{ cardId: aromata.id }, { cardId: spire.id, stacks: n }, { cardId: strike.id, stacks: n }]
    expect(adds(computeBuild(PRESETS, 'Mei Lin', cs, a, settings))).toEqual([[], [0], [1.5]])
  })

  it('Ember: +30% per stack on every hit vs a Ravaged target, up to 5; nothing otherwise', () => {
    const { cs, a, lib: [strike] } = setup('card-338')
    const ravaged = { ...strike, id: 'rs', targetRavaged: true }
    addCards(cs, ravaged)
    a.rotation = [{ cardId: ravaged.id, hits: 2, stacks: { Ember: 3 } }, { cardId: strike.id, stacks: { Ember: 5 } },
      { cardId: ravaged.id, stacks: { Ember: 7 } }, { cardId: ravaged.id }]
    expect(adds(computeBuild(PRESETS, 'Mei Lin', cs, a, settings))).toEqual([[0.9, 0.9], [0], [1.5], [0]])
    a.presetSwitches['Mei Lin|ember'] = false
    expect(adds(computeBuild(PRESETS, 'Mei Lin', cs, a, settings))).toEqual([[0, 0], [0], [0], [0]])
  })
})

describe('per-play debuffs and per-build attack lists', () => {
  it('Vulnerable and the Weakness debuff count on every hit of the plays that have them', () => {
    const cs = newCharacterSave()
    const [a] = cs.builds
    a.stats.attack = 1000
    const x = card('X', '', 2)
    addCards(cs, x)
    a.rotation = [{ cardId: x.id, vulnerable: true }, { cardId: x.id, weaknessDebuff: true }, { cardId: x.id, vulnerable: true, weaknessDebuff: true }, { cardId: x.id }]
    const r = computeBuild(presets, '', cs, a, settings)
    expect(r.plays.map((p) => p.hits.map((h) => h.cardMult))).toEqual(
      [[1.5, 1.5], [0.75, 0.75], [1.125, 1.125], [1, 1]].map((xs) => xs.map((v) => expect.closeTo(v))))
    expect(r.plays[2]).toMatchObject({ vulnerable: true, weaknessDebuff: true })
  })

  it('each build plays its own list', () => {
    const cs = newCharacterSave()
    const [a] = cs.builds
    const b = newBuild('Build B')
    cs.builds.push(b)
    for (const x of cs.builds) x.stats.attack = 1000
    const x = card('X', '', 1)
    addCards(cs, x)
    a.rotation = plays(x.id)
    b.rotation = plays(x.id, x.id, x.id)
    expect(cs.builds.map((bd) => computeBuild(presets, '', cs, bd, settings).nonCrit)).toEqual([350, 1050].map((v) => expect.closeTo(v)))
  })
})

describe('rotation plays', () => {
  it('a play can override the hits; 2+ hits buffs follow the play', () => {
    const cs = newCharacterSave()
    const [a] = cs.builds
    a.stats.attack = 1000
    cs.buffs.push({ ...newBuff(a.id), value: '+50%', appliesTo: '2+ hits' })
    const x = card('X', '', 1)
    addCards(cs, x)
    setPlays(cs, [{ cardId: x.id }, { cardId: x.id, hits: 3 }, { cardId: x.id }])
    const r = computeBuild(presets, '', cs, a, settings)
    expect(r.plays.map((p) => p.hits.length)).toEqual([1, 3, 1])
    expect(r.plays[0].hits[0].cardMult).toBeCloseTo(1)
    expect(r.plays[1].hits[0].cardMult).toBeCloseTo(1.5)
    expect(r.plays[2].hits[0].globalHit).toBe(5)
  })
})
