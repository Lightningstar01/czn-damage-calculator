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

  it('Rei 7: +1% per 10 Attack above 550, +20% at most', () => {
    expect(value('Rei', 'p7-predator', { attack: 549 })).toBe(0)
    expect(value('Rei', 'p7-predator', { attack: 550 })).toBeCloseTo(0.1)
    expect(value('Rei', 'p7-predator', { attack: 579 })).toBeCloseTo(0.12)
    expect(value('Rei', 'p7-predator', { attack: 2000 })).toBeCloseTo(0.3)
  })

  it('a threshold on the stats-screen Defense, with "for every 10 exceeding 300" (as attribute node 7s read before they moved to the stats screen)', () => {
    const buff = { kind: 'Buff', id: 'x', name: 'x', category: 'Potential', value: '+5%', appliesTo: 'Void', hitScope: 'All hits',
      condition: 'Always', thresholdStat: 'Defense', thresholdMin: 300, thresholdBonus: { above: 300, value: '+2%', every: 10, max: '+10%' } } as const
    const at = (defense: number) => presetBuffValue(buff, { ...newBuild('x').stats, attack: 1000, defense }).value
    expect(at(299)).toBe(0)
    expect(at(300)).toBeCloseTo(0.05)
    expect(at(325)).toBeCloseTo(0.05 + 0.04)
    expect(at(1000)).toBeCloseTo(0.15)
  })

  it("attribute node 7s are on the stats screen (owner, 2026-11-08): no character adds them again", () => {
    for (const c of PRESETS.characters) {
      expect(c.effects.filter((e) => e.node === '7' && e.kind === 'Buff' && ['Passion', 'Justice', 'Order', 'Instinct', 'Void'].includes(e.appliesTo)), c.name).toEqual([])
    }
  })

  it('Selena 5-1 reads the Extra Damage stat', () => {
    expect(value('Selena', 'p5-1-fire', { extraDmg: 0.149 })).toBeCloseTo(0.05)
    expect(value('Selena', 'p5-1-fire', { extraDmg: 0.15 })).toBeCloseTo(0.1)
    const cs = newCharacterSave()
    const [a] = cs.builds
    a.stats.attack = 100
    a.stats.extraDmg = 0.2
    a.basicLevel = 0
    a.deck.push({ id: 'ef', preset: 'card-395' })
    a.rotation = [{ cardId: 'ef' }]
    // Engagement Fire: 100% + 5% + 5%: a Normal card, so Extra Damage only opens the bonus
    expect(computeBuild(PRESETS, 'Selena', cs, a, settings).plays[0].hits[0].cardMult).toBeCloseTo(1.1)
  })

  it('Extra Damage multiplies Extra Attacks, triggered ones too, and not normal hits', () => {
    const build = (extraDmg: number) => {
      const cs = newCharacterSave()
      const [a] = cs.builds
      a.stats.attack = 100
      a.stats.extraDmg = extraDmg
      a.presetSwitches['Selena|p5-1-fire'] = false
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
