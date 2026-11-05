import { describe, expect, it } from 'vitest'
import { computeBuild } from '../../src/engine/calc'
import { buffMatches, buffReadable, buffType, fragmentPiecesUsed, parseBuffValue, parseStatValue, readBuffValue, readNumber, readStatValue, statReadable, unreadableValues } from '../../src/engine/buffs'
import { PRESETS } from '../../src/data/presets'
import { newBoost, newBuff, newBuild, newCharacterSave } from '../../src/store/save'
import { type Card } from '../../src/engine/types'
import { addCards, card, plays, presets, setPlays, settings } from '../helpers'

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
  addCards(cs, x)
  setPlays(cs, plays(x.id))
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
})

describe('applies to', () => {
  const m = (appliesTo: string, c: Card) => buffMatches({ appliesTo, condition: 'Always' }, c)
  const exhaust: Card = { ...card('Slash', 'Exhaust', 3), element: 'Order', cost: 2 }
  it('AND, OR, hits, cost and card kind', () => {
    expect(m('Justice/Order & Exhaust & Attack', exhaust)).toBe(true)
    expect(m('Justice & Exhaust', exhaust)).toBe(false)
    expect(m('Void/Order & 2+ hits', exhaust)).toBe(true)
    expect(m('4+ hits', exhaust)).toBe(false)
    expect(m('2+ cost', exhaust)).toBe(true)
    expect(m('3+ cost', exhaust)).toBe(false)
    expect(m('1-cost', exhaust)).toBe(false)
    expect(m('2-cost', exhaust)).toBe(true)
    expect(m('Order', exhaust)).toBe(true)
    expect(m('Passion', exhaust)).toBe(false)
    expect(m('0+ cost', { ...exhaust, cost: null })).toBe(false)
    expect(m('Slash', exhaust)).toBe(true)
    expect(m('DoT', { ...exhaust, kind: 'DoT' })).toBe(true)
    expect(m('Counterattack/Extra Attack', { ...exhaust, kind: 'Extra Attack' })).toBe(true)
  })

  it('card type matches like a tag', () => {
    const skill: Card = { ...card('Guard', '', 1), cardType: 'Skill', element: 'Order' }
    expect(m('Skill', skill)).toBe(true)
    expect(m('Attack', skill)).toBe(false)
    expect(m('Order & Skill', skill)).toBe(true)
  })

})

describe('per-card crit buffs', () => {
  it('add to Crit DMG / Crit Chance of matching cards only, capped', () => {
    const cs = newCharacterSave()
    const [a] = cs.builds
    a.stats.attack = 1000
    a.stats.critChance = 0.9
    a.stats.critDmg = 1.5
    cs.buffs.push({ ...newBuff(a.id), value: '+35%', typeOverride: 'Crit DMG', appliesTo: '1-cost' })
    cs.buffs.push({ ...newBuff(a.id), value: '+20%', typeOverride: 'Crit Chance', appliesTo: '1-cost' })
    const one = { ...card('One', '', 1), cost: 1 }, two = { ...card('Two', '', 1), cost: 2 }
    addCards(cs, one, two)
    setPlays(cs, plays(one.id, two.id))
    const r = computeBuild(presets, '', cs, a, settings)
    expect(r.plays[0].hits[0].critDmg).toBeCloseTo(1.85)
    expect(r.plays[0].hits[0].critRate).toBeCloseTo(1)
    expect(r.plays[0].crit).toBeCloseTo(350 * 1.85)
    expect(r.plays[0].hits[0].cardMult).toBeCloseTo(1)
    expect(r.plays[1].hits[0].critDmg).toBeCloseTo(1.5)
    expect(r.plays[1].hits[0].critRate).toBeCloseTo(0.9)
  })
})

describe('real fragment set presets', () => {
  it('names and effect ids are unique, pieces are 2 or 4', () => {
    const names = PRESETS.fragmentSets.map((f) => f.name)
    expect(new Set(names).size).toBe(names.length)
    for (const f of PRESETS.fragmentSets) {
      expect([2, 4]).toContain(f.pieces)
      expect(new Set(f.effects.map((e) => e.id)).size).toBe(f.effects.length)
    }
  })
})

describe('parsing', () => {
  it('typed numbers: thousands commas, a plain number on a % stat is a %, unreadable values are undefined', () => {
    expect(readNumber('1,272')).toBe(1272)
    expect(readNumber('12.5')).toBe(12.5)
    for (const bad of ['12,5', '1,27', 'abc', '', ' ']) expect(readNumber(bad)).toBeUndefined()
    expect(readStatValue('ATK%', '16')).toBeCloseTo(0.16)
    expect(readStatValue('Crit DMG', '+30%')).toBeCloseTo(0.3)
    expect(readStatValue('Flat ATK', '1,272')).toBe(1272)
    expect(readStatValue('Flat ATK', '5%')).toBeUndefined()
    expect(readBuffValue('12,5%')).toBeUndefined()
    expect(buffType('weakness  attack')).toBe('Weakness Attack')
    expect(buffReadable('Weakness Attack')).toBe(true)
    expect(statReadable('ATK%', '')).toBe(true)
    const cs = { ...newCharacterSave(), boosts: [{ ...newBoost('b'), stat: 'ATK%' as const, value: '1 6' }], buffs: [{ ...newBuff('b'), value: '+x%' }] }
    expect(unreadableValues(cs, { id: 'b' })).toHaveLength(2)
    expect(unreadableValues(cs, { id: 'other' })).toEqual([])
  })

  it('values and buff types', () => {
    expect(parseStatValue('ATK%', '16%')).toBeCloseTo(0.16)
    expect(parseStatValue('Flat ATK', '74')).toBe(74)
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
    addCards(cs, x)
    setPlays(cs, plays(x.id))
    const summed = computeBuild(presets, '', cs, a, settings)
    const chained = computeBuild(presets, '', cs, a, { ...settings, multMode: 'Chained' })
    expect(summed.plays[0].hits[0].cardMult).toBeCloseTo(1.5)
    expect(chained.plays[0].hits[0].cardMult).toBeCloseTo(1.56)
  })
})
