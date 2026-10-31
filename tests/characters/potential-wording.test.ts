import { describe, expect, it } from 'vitest'
import { computeBuild } from '../../src/engine/calc'
import { presetBuffValue } from '../../src/engine/buffs'
import { ADDITIONS, IMPORTED, PRESETS } from '../../src/data/presets'
import { checkAdditions } from '../../src/data/merge'
import { newBuild, newCharacterSave } from '../../src/store/save'
import { type Build } from '../../src/engine/types'
import { settings } from '../helpers'

describe('Manifest Ego wording', () => {
  const ego = (name: string, level: number) => PRESETS.characters.find((c) => c.name === name)!.manifestEgo!.find((m) => m.level === level)!

  it('uses the in-game text instead of the import', () => {
    expect(ego('Rei', 6).text).toBe("+20% Damage Amount to allies' Attack Cards.")
    expect(ego('Narja', 4).text).toBe('+40% Damage Amount to Predation.')
    expect(ego('Tiphera', 2).text).toContain('△: Increase Damage Amount of the first Hit')
    expect(ego('Mika', 3).text).toContain('[Signature Card Upgrade]')
    expect(ego('Adelheid', 4).text).toContain('apply Blessing to any number of cards in hand')
    expect(ego('Rei', 6).name).toBe('Liberated Memory')
  })

  it('the +3 card upgrade levels stay read from the import', () => {
    expect(PRESETS.characters.find((c) => c.name === 'Mika')!.potentialEgo).toEqual([{ level: 3, levels: 3 }, { level: 5, levels: 3 }])
  })

  it('every reviewed character has all six levels; an unknown level is a problem', () => {
    for (const [slug, add] of Object.entries(ADDITIONS)) expect(Object.keys(add.ego ?? {}), slug).toEqual(['1', '2', '3', '4', '5', '6'])
    expect(checkAdditions(IMPORTED, { 'mei-lin': { verified: { date: 'x', gameVersion: 'x' }, ego: { 9: { text: 'x' } } } })).toHaveLength(1)
  })
})

describe('Potential node wording', () => {
  const node = (name: string, id: string) => PRESETS.characters.find((c) => c.name === name)!.potentials!.find((p) => p.node === id)!

  it('uses the in-game name and text instead of the import', () => {
    expect(node('Chizuru', '3-1').text).toBe("Change Moonslash's card effect to 70% Damage × 2.")
    expect(node('Chizuru', '7').text).toContain('For every 10 Attack above 600')
    expect(node('Haru', '7').text).toContain('Attack is 600 or higher')
    expect(node('Renoa', '3-1').name).toBe('Signature Card Proficiency')
    expect(node('Tiphera', '5-1').name).toBe('Signature Card Proficiency')
    // nodes without a screenshot keep the import's text
    expect(node('Chizuru', '5').name).toBe('Critical Chance Proficiency')
    expect(node('Chizuru', '7').name).toBe('Unique Stat Upgrade')
  })

  it('every reviewed character has nodes 3-1, 5-1 and 7; an unknown node is a problem', () => {
    for (const [slug, add] of Object.entries(ADDITIONS)) expect(Object.keys(add.potentials ?? {}).sort(), slug).toEqual(['3-1', '5-1', '7'])
    expect(checkAdditions(IMPORTED, { 'mei-lin': { verified: { date: 'x', gameVersion: 'x' }, potentials: { '9-9': { text: 'x' } } } })).toHaveLength(1)
  })

  const value = (name: string, id: string, stats: Partial<Build['stats']>) => {
    const e = PRESETS.characters.find((c) => c.name === name)!.effects.find((x) => x.id === id)!
    if (e.kind !== 'Buff') throw new Error(`${id} is a buff`)
    return presetBuffValue(e, { ...newBuild('x').stats, ...stats }).value
  }

  it('Tenebria 7: +1% per 20 Attack above 600, +10% at most', () => {
    expect(value('Tenebria', 'p7-passion', { attack: 599 })).toBe(0)
    expect(value('Tenebria', 'p7-passion', { attack: 600 })).toBeCloseTo(0.05)
    expect(value('Tenebria', 'p7-passion', { attack: 640 })).toBeCloseTo(0.07)
    expect(value('Tenebria', 'p7-passion', { attack: 2000 })).toBeCloseTo(0.15)
  })

  it('Selena 5-1 and 7 read the Extra Damage stat', () => {
    expect(value('Selena', 'p5-1-fire', { extraDmg: 0.149 })).toBeCloseTo(0.05)
    expect(value('Selena', 'p5-1-fire', { extraDmg: 0.15 })).toBeCloseTo(0.1)
    expect(value('Selena', 'p7-passion', { extraDmg: 0.299 })).toBeCloseTo(0.04)
    expect(value('Selena', 'p7-passion', { extraDmg: 0.3 })).toBeCloseTo(0.08)
    const cs = newCharacterSave()
    const [a] = cs.builds
    a.stats.attack = 100
    a.stats.extraDmg = 0.2
    a.basicLevel = 0
    a.deck.push({ id: 'ef', preset: 'card-395' })
    a.rotation = [{ cardId: 'ef' }]
    // Engagement Fire: (100% + 5% + 5%) + 7's +4% Passion: a Normal card, so Extra Damage only opens the bonus
    expect(computeBuild(PRESETS, 'Selena', cs, a, settings).plays[0].hits[0].cardMult).toBeCloseTo(1.14)
  })

  it('Extra Damage multiplies Extra Attacks, triggered ones too, and not normal hits', () => {
    const build = (extraDmg: number) => {
      const cs = newCharacterSave()
      const [a] = cs.builds
      a.stats.attack = 100
      a.stats.extraDmg = extraDmg
      for (const id of ['p5-1-fire', 'p7-passion']) a.presetSwitches[`Selena|${id}`] = false
      a.deck.push({ id: 'ef', preset: 'card-395' })
      a.rotation = [{ cardId: 'ef', stacks: { Mark: 1 } }]
      return computeBuild(PRESETS, 'Selena', cs, a, settings).plays[0]
    }
    const [off, on] = [build(0), build(0.5)]
    expect(on.triggered[0].card.kind).toBe('Extra Attack')
    expect(on.triggered[0].nonCrit).toBeCloseTo(off.triggered[0].nonCrit * 1.5)
    expect(on.hits[0].nonCrit).toBeCloseTo(off.hits[0].nonCrit)
  })

  it('Rei and Mei Lin count exactly at the "or higher" thresholds', () => {
    expect(value('Rei', 'p5-1-blade', { attack: 500 })).toBeCloseTo(0.1)
    expect(value('Rei', 'p7-predator', { attack: 549 })).toBe(0)
    expect(value('Rei', 'p7-predator', { attack: 550 })).toBeCloseTo(0.1)
    expect(value('Mei Lin', 'p5-1-strike', { attack: 500 })).toBeCloseTo(0.1)
  })
})
