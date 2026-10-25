// The Excel regression scenarios (tests/test_formula.py), same inputs and expected numbers.
//
// Hand math (Final ATK 1000, constant 0.35, so 100% card = 350 per hit; crit 50% rate, 200% Crit DMG):
//   Cards, in order: Test (3 hits x 1 play), Two (2 hits x 2 plays), Weak (1 hit, Weakness DMG applies)
//   Build A: Morale 2 stacks (+40% additive)          -> mult 1.40 -> 490/hit
//   Build B: + "30%" multiplicative on ALL            -> (1.0*1.3 + 0.4) = 1.70
//   Build C: Morale 2, "+50%" first-hit-only on tag Attack, 1 Vulnerable stack
// Partner scenarios: Mei Lin (Striker) with Marianne (Striker partner), ATK 1000, no crit.
import { describe, expect, it } from 'vitest'
import { computeBuild, type BuildResult } from '../src/engine/calc'
import { buffType, fragmentPiecesUsed, parseBuffValue, parseStatValue } from '../src/engine/buffs'
import { PRESETS } from '../src/data/presets'
import { DEFAULT_SETTINGS } from '../src/data/settings'
import { newBuff, newBuild, newCard, newCharacterSave, migrate, defaultSave, SAVE_VERSION } from '../src/store/save'
import type { Card, CharacterSave, Presets } from '../src/engine/types'

const presets: Presets = {
  characters: [...PRESETS.characters, { name: 'Testy', element: 'Order', class: 'Vanguard', effects: [] }],
  partners: PRESETS.partners,
  // Made-up sets for the tests (the real ones live in src/data/presets.ts)
  fragmentSets: [
    { name: 'Test Four', pieces: 4, effects: [
      { kind: 'Stat', id: 'atk', name: 'Attack', category: 'Memory Fragment', stat: 'ATK%', value: '20%', onStatsScreen: true },
      { kind: 'Buff', id: 'dmg', name: 'Damage', category: 'Memory Fragment', value: '+30%', appliesTo: 'ALL', hitScope: 'All hits', condition: 'Always' },
    ] },
    { name: 'Test Two', pieces: 2, effects: [
      { kind: 'Stat', id: 'crit', name: 'Crit DMG', category: 'Memory Fragment', stat: 'Crit DMG', value: '10%', onStatsScreen: true },
    ] },
  ],
}
const settings = DEFAULT_SETTINGS

function card(name: string, tags: string, hits: number, weak = false, ravaged = false): Card {
  return { ...newCard(), name, tags, hits, pct: 1, weaknessApplies: weak, targetRavaged: ravaged }
}

/** Sum of a card's plays in a build result. */
function cardTotal(r: BuildResult, name: string, key: 'nonCrit' | 'crit' | 'expected' = 'nonCrit') {
  return r.plays.filter((p) => p.card.name === name).reduce((a, p) => a + p[key], 0)
}

function mainScenario() {
  const cs: CharacterSave = newCharacterSave()
  const b = { ...newBuild('Build B') }
  const c = { ...newBuild('Build C') }
  cs.builds.push(b, c)
  for (const x of cs.builds) {
    x.stats.attack = 1000
    x.stats.critChance = 0.5
    x.stats.critDmg = 2
    x.morale = 2
  }
  c.vulnerable = 1
  cs.buffs.push({ ...newBuff(b.id), source: 'Mult test', value: '30%', appliesTo: 'ALL' })
  cs.buffs.push({ ...newBuff(c.id), source: 'First hit', value: '+50%', appliesTo: 'Attack', hitScope: 'First hit only' })
  const test = card('Test', 'Attack', 3), two = card('Two', 'x', 2), weak = card('Weak', 'x', 1, true)
  cs.cards.push(test, two, weak)
  cs.rotation = [test.id, two.id, two.id, weak.id]
  const run = (i: number) => computeBuild(presets, '', cs, cs.builds[i], settings)
  return { A: run(0), B: run(1), C: run(2) }
}

describe('main scenario', () => {
  const { A, B, C } = mainScenario()

  it('final stats', () => {
    for (const r of [A, B, C]) {
      expect(r.stats.atk.value).toBe(1000)
      expect(r.stats.weaknessDmg.value).toBe(1.25)
      expect(r.stats.elemDmg.value).toBe(0)
    }
  })

  it('build A: Morale and crit', () => {
    expect(cardTotal(A, 'Test')).toBeCloseTo(1470)
    expect(cardTotal(A, 'Test', 'crit')).toBeCloseTo(2940)
    expect(cardTotal(A, 'Test', 'expected')).toBeCloseTo(2205)
  })

  it('times played', () => {
    expect(cardTotal(A, 'Two')).toBeCloseTo(1960)
    expect(A.plays[2].hits[1]).toMatchObject({ hitNo: 2, globalHit: 7 })
  })

  it('Weakness DMG applies', () => {
    expect(A.plays[3].hits[0].cardMult).toBeCloseTo(1.75)
    expect(cardTotal(A, 'Weak')).toBeCloseTo(612.5)
  })

  it('build B: multiplicative', () => {
    expect(cardTotal(B, 'Test')).toBeCloseTo(1785)
    expect(cardTotal(B, 'Two')).toBeCloseTo(2380)
    expect(cardTotal(B, 'Weak')).toBeCloseTo(743.75)
  })

  it('build C: first-hit buff and Vulnerable used up in order', () => {
    expect(C.plays[0].hits[0].cardMult).toBeCloseTo(2.85)
    expect(C.plays[0].hits[1].cardMult).toBeCloseTo(1.4)
    expect(C.plays[1].hits[0].cardMult).toBeCloseTo(1.4)
    expect(cardTotal(C, 'Test')).toBeCloseTo(1977.5)
    expect(cardTotal(C, 'Two')).toBeCloseTo(1960)
  })

  it('totals', () => {
    expect(A.nonCrit).toBeCloseTo(4042.5)
    expect(A.expected).toBeCloseTo(6063.75)
    expect(B.nonCrit / A.nonCrit - 1).toBeCloseTo(4908.75 / 4042.5 - 1)
  })
})

function partnerScenario(character: string) {
  const cs = newCharacterSave()
  const [a] = cs.builds
  const b = newBuild('Build B'), c = newBuild('Build C')
  cs.builds.push(b, c)
  for (const x of cs.builds) x.stats.attack = 1000
  a.partner = b.partner = 'Marianne'
  b.presetSwitches['Marianne|atk'] = false
  const strike = card('Strike', 'Basic Attack', 1, false, true), other = card('Other', 'x', 1)
  cs.cards.push(strike, other)
  cs.rotation = [strike.id, other.id]
  return cs.builds.map((x) => computeBuild(presets, character, cs, x, settings))
}

describe('partner presets', () => {
  const [A, B, C] = partnerScenario('Mei Lin')

  it('stats per build', () => {
    expect([A, B, C].map((r) => r.stats.atk.value)).toEqual([1160, 1000, 1000])
    expect(A.stats.weaknessDmg.value).toBeCloseTo(1.3)
    expect(B.stats.weaknessDmg.value).toBeCloseTo(1.3)
    expect(C.stats.weaknessDmg.value).toBeCloseTo(1.25)
  })

  it('Ravaged and Weakness Attack', () => {
    expect(A.plays[0].hits[0].cardMult).toBeCloseTo(1.495)
    expect(cardTotal(A, 'Strike')).toBeCloseTo(606.97)
    expect(cardTotal(B, 'Strike')).toBeCloseTo(523.25)
    expect(cardTotal(C, 'Strike')).toBeCloseTo(350)
    expect(cardTotal(A, 'Other')).toBeCloseTo(406)
  })

  it('class mismatch switches class-limited effects off', () => {
    const [M] = partnerScenario('Testy')
    expect(M.stats.atk.value).toBeCloseTo(1000)
    expect(cardTotal(M, 'Strike')).toBeCloseTo(350)
  })
})

describe('memory fragment sets', () => {
  const cs = newCharacterSave()
  const [a] = cs.builds
  const b = newBuild('Build B'), c = newBuild('Build C')
  cs.builds.push(b, c)
  for (const x of cs.builds) x.stats.attack = 1000
  a.fragments = ['Test Four', 'Test Two', '']
  b.fragments = ['Test Four', '', '']
  b.presetSwitches['Test Four|dmg'] = false
  c.fragments = ['Test Four', 'Test Four', 'Test Two']
  const x = card('X', '', 1)
  cs.cards.push(x)
  cs.rotation = [x.id]
  const [A, B, C] = cs.builds.map((bd) => computeBuild(presets, 'Mei Lin', cs, bd, settings))

  it('set buffs apply; set stats are already on the stats screen', () => {
    expect(A.stats.atk.value).toBe(1000)
    expect(A.plays[0].hits[0].cardMult).toBeCloseTo(1.3)
    expect(B.plays[0].hits[0].cardMult).toBeCloseTo(1)
  })

  it('a set picked twice counts once; pieces are counted per pick', () => {
    expect(C.plays[0].hits[0].cardMult).toBeCloseTo(1.3)
    expect(fragmentPiecesUsed(presets, a)).toBe(6)
    expect(fragmentPiecesUsed(presets, c)).toBe(10)
  })

  it('migrate adds empty set picks to old saves', () => {
    const old = { version: 1, characters: { X: { builds: [{ id: 'b' }] } } }
    expect(migrate(old).characters.X.builds[0].fragments).toEqual(['', '', ''])
  })
})

describe('parsing', () => {
  it('values and buff types', () => {
    expect(parseStatValue('16%')).toBeCloseTo(0.16)
    expect(parseStatValue('74')).toBe(74)
    expect(parseBuffValue('+30%')).toBeCloseTo(0.3)
    expect(parseBuffValue('Weakness Attack')).toBe(0)
    expect(buffType('+30%')).toBe('Additive')
    expect(buffType('30%')).toBe('Multiplicative')
    expect(buffType(' weakness attack ')).toBe('Weakness Attack')
    expect(buffType('30%', 'Additive')).toBe('Additive')
  })

  it('chained multiplicative buffs', () => {
    const cs = newCharacterSave()
    const [a] = cs.builds
    a.stats.attack = 1000
    cs.buffs.push({ ...newBuff(a.id), value: '30%' }, { ...newBuff(a.id), value: '20%' })
    const x = card('X', '', 1)
    cs.cards.push(x)
    cs.rotation = [x.id]
    const summed = computeBuild(presets, '', cs, a, settings)
    const chained = computeBuild(presets, '', cs, a, { ...settings, multMode: 'Chained' })
    expect(summed.plays[0].hits[0].cardMult).toBeCloseTo(1.5)
    expect(chained.plays[0].hits[0].cardMult).toBeCloseTo(1.56)
  })

  it('migrate fills missing settings and rejects other files', () => {
    expect(migrate({ characters: {}, settings: {} }).settings.atkConstant).toBe(0.35)
    expect(() => migrate({ foo: 1 })).toThrow()
    expect(migrate(defaultSave()).version).toBe(SAVE_VERSION)
  })
})
