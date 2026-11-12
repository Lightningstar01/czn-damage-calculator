import { describe, expect, it } from 'vitest'
import { produce } from 'immer'
import { duplicateBuild, newBoost, newBuff, newCharacterSave } from '../src/store/save'

describe('duplicate build', () => {
  it('works inside an immer update (as the Setup tab calls it) and copies the team and attack list', () => {
    const cs = newCharacterSave()
    cs.builds[0].team = [{ character: 'Helper', egoLevel: 2, partner: '', fragments: ['', '', ''], cards: ['h-1'] }]
    cs.builds[0].rotation = [{ cardId: 'x', vulnerable: true, stacks: { Ember: 2 } }]
    cs.builds[0].boosts = [{ ...newBoost(), source: 'Ring', stat: 'ATK%', value: '12%' }]
    cs.builds[0].buffs = [{ ...newBuff(), value: '+25%' }]
    cs.builds[0].equipment = { weapon: { rarity: 'Legendary' } }
    const next = produce(cs, (c) => { c.builds.push(duplicateBuild(c.builds[0], 'Build B')) })
    const [a, b] = next.builds
    expect(b.id).not.toBe(a.id)
    expect(b.team).toEqual(a.team)
    expect(b.rotation).toEqual(a.rotation)
    expect(b.rotation).not.toBe(a.rotation)
    expect(b).toMatchObject({ boosts: a.boosts, buffs: a.buffs, equipment: a.equipment })
  })

  it("a copy's stat boosts and buffs are its own: changing one leaves the build it came from alone (owner, 2026-11-11)", () => {
    const cs = newCharacterSave()
    cs.builds[0].boosts = [{ ...newBoost(), source: 'Ring', stat: 'ATK%', value: '12%' }]
    cs.builds[0].buffs = [{ ...newBuff(), value: '+25%' }]
    const next = produce(cs, (c) => {
      const copy = duplicateBuild(c.builds[0], 'Build B')
      copy.boosts[0].value = '16%'
      copy.buffs[0].on = false
      copy.boosts.push(newBoost())
      c.builds.push(copy)
    })
    const [a, b] = next.builds
    expect(a.boosts).toEqual(cs.builds[0].boosts)
    expect(a.buffs[0].on).toBe(true)
    expect(b.boosts.map((x) => x.value)).toEqual(['16%', ''])
  })
})
