// The first regression scenarios: Build A, B and C below, with hand-worked numbers.
//
// Hand math (Final ATK 1000, constant 0.35, so 100% card = 350 per hit; crit 50% rate, 200% Crit DMG):
//   Cards, in order: Test (3 hits x 1 play), Two (2 hits x 2 plays), Weak (1 hit, Weakness DMG applies)
//   Build A: Morale 2 stacks (+40% additive)          -> mult 1.40 -> 490/hit
//   Build B: + "30%" multiplicative on ALL            -> (1.0*1.3 + 0.4) = 1.70
//   Build C: Morale 2, "+50%" first-hit-only on tag Attack, Vulnerable on the first play (website: per play, not per hit)
// Partner scenarios: Mei Lin (Striker) with Marianne (Striker partner), ATK 1000, no crit.
import { describe, expect, it } from 'vitest'
import { computeBuild } from '../../src/engine/calc'
import { PRESETS } from '../../src/data/presets'
import { migrate } from '../../src/store/migrate'
import { newBuff, newBuild, newCharacterSave } from '../../src/store/save'
import { type Build, type Card, type CharacterSave } from '../../src/engine/types'
import { addCards, card, cardFromPreset, cardTotal, plays, presets, setPlays, settings } from '../helpers'
import fixture from '../fixtures/save-v1.json'

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
  cs.buffs.push({ ...newBuff(b.id), source: 'Mult test', value: '30%', appliesTo: 'ALL' })
  cs.buffs.push({ ...newBuff(c.id), source: 'First hit', value: '+50%', appliesTo: 'Attack', hitScope: 'First hit only' })
  const test = card('Test', 'Attack', 3), two = card('Two', 'x', 2), weak = card('Weak', 'x', 1, true)
  two.cardType = weak.cardType = 'Skill'   // only "Test" is an Attack
  addCards(cs, test, two, weak)
  setPlays(cs, plays(test.id, two.id, two.id, weak.id))
  c.rotation[0].vulnerable = true
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

  it('build C: first-hit buff, and Vulnerable on every hit of its play', () => {
    expect(C.plays[0].hits[0].cardMult).toBeCloseTo(2.85)
    expect(C.plays[0].hits[1].cardMult).toBeCloseTo(2.1)
    expect(C.plays[1].hits[0].cardMult).toBeCloseTo(1.4)
    expect(cardTotal(C, 'Test')).toBeCloseTo(2467.5)
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
  addCards(cs, strike, other)
  setPlays(cs, plays(strike.id, other.id))
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

describe('card % in hand and on target', () => {
  it("matches the owner's Strike: 251% in hand, ~357% on target (owner, 2026-10-25)", () => {
    // The owner's saved Mei Lin (an old save) + Flame Dragon's Jewel, 1 Morale, Strike at base 100% with Basic Card Upgrade 10
    const save = migrate(structuredClone(fixture))   // migrate() changes what it reads, and other tests read the same fixture
    const cs = save.characters['Mei Lin']
    const a = cs.builds[0]
    a.morale = 1
    a.basicLevel = 10
    const mei = PRESETS.characters.find((c) => c.name === 'Mei Lin')!
    Object.assign(a.deck[0].custom!, { pct: 1, upgrade: 'Basic' })
    addCards(cs, cardFromPreset(mei.cards!.find((p) => p.id === 'card-340')!, 'Passion'))
    const hit = () => computeBuild(PRESETS, 'Mei Lin', cs, a, settings).plays[0].hits[0]
    // 132% x (1 + 20% Scarab + 12% Sword + 20% Jewel) + 30% Emblem + 20% Morale; x 142% Weakness DMG on target
    expect(hit().inHand).toBeCloseTo(2.5064, 4)
    expect(hit().cardMult).toBeCloseTo(2.5064 * 1.42, 4)
    // Buffs that need a Ravaged target (Ember, Marianne) only show on target
    a.deck[0].custom!.targetRavaged = true
    a.rotation[0].stacks = { Ember: 1 }
    expect(hit().inHand).toBeCloseTo(2.5064, 4)
    expect(hit().cardMult).toBeCloseTo((1.32 * 1.67 + 0.5 + 0.3) * 1.42, 4)
  })
})

describe('stat factors, and settings off their defaults', () => {
  // ATK 1000, every card 100% x 1 hit: 350 before the factor under test
  const run = (c: Card, edit: (b: Build) => void = () => {}, s = settings) => {
    const cs = newCharacterSave()
    const [b] = cs.builds
    b.stats.attack = 1000
    edit(b)
    addCards(cs, c)
    setPlays(cs, plays(c.id))
    return computeBuild(presets, '', cs, b, s)
  }
  const kind = (k: Card['kind']) => ({ ...card('X', '', 1), kind: k })

  it('Extra DMG% raises Extra Attacks only, DoT DMG% DoT cards only', () => {
    const stats = (b: Build) => { b.stats.extraDmg = 0.2; b.stats.dotDmg = 0.3 }
    expect(run(kind('Normal'), stats).nonCrit).toBeCloseTo(350)
    expect(run(kind('Extra Attack'), stats).nonCrit).toBeCloseTo(420)
    expect(run(kind('DoT'), stats).nonCrit).toBeCloseTo(455)
  })

  it('the crit rate stops at the cap', () => {
    const crit = (b: Build) => { b.stats.critChance = 1.5; b.stats.critDmg = 2 }
    expect(run(kind('Normal'), crit).expected).toBeCloseTo(700)
    const capped = run(kind('Normal'), crit, { ...settings, critCap: 0.8 })
    expect(capped.expected).toBeCloseTo(350 * 1.8)
    expect(capped.plays[0].hits[0].critRateSources.map((s) => s.label)).toContain('Capped (Settings)')
  })

  it('Ravaged and the extra weakness factor count once set', () => {
    const ravaged = card('R', '', 1, false, true), weak = card('W', '', 1, true)
    expect(run(ravaged).nonCrit).toBeCloseTo(350)
    expect(run(ravaged, undefined, { ...settings, ravaged: 0.3 }).nonCrit).toBeCloseTo(455)
    expect(run(weak).nonCrit).toBeCloseTo(437.5)
    expect(run(weak, undefined, { ...settings, extraWeakness: 0.1 }).nonCrit).toBeCloseTo(350 * 1.25 * 1.1)
  })
})
