import { describe, expect, it } from 'vitest'
import { computeBuild, shownPct } from '../../src/engine/calc'
import { renderCardText } from '../../src/engine/cardText'
import { activeBuffs } from '../../src/engine/buffs'
import { PRESETS } from '../../src/data/presets'
import { newCharacterSave } from '../../src/store/save'
import { addCards, cardFromPreset, settings } from '../helpers'

describe('Rossweisse', () => {
  const ross = PRESETS.characters.find((c) => c.name === 'Rossweisse')!
  const preset = (id: string) => ross.cards!.find((p) => p.id === id)!
  // Owner's screenshots (2026-10-27): E1, Basic 1, Signature 10, Potential 5-1 not unlocked (Sword Slash 102%)
  const ownerBuild = () => {
    const cs = newCharacterSave()
    const [a] = cs.builds
    Object.assign(a, { egoLevel: 1, basicLevel: 1, signatureLevel: 10 })
    a.presetSwitches['Rossweisse|p5-1-slash'] = false
    a.stats.attack = 500
    return { cs, a }
  }

  it("card text matches the owner's in-game screenshots", () => {
    const { a } = ownerBuild()
    const text = (id: string) => {
      const p = preset(id)
      const c = cardFromPreset(p, 'Justice')
      const buffs = activeBuffs(PRESETS, 'Rossweisse', a, settings)
      return renderCardText(p.text, { egoLevel: a.egoLevel, nodeOn: () => true, pct: (base) => shownPct(base, c, a, ross, buffs, settings) })
    }
    expect(text('card-1381')).toBe('102% Damage')
    expect(text('card-1383')).toBe('[Equilux / Unique]\n480% Damage\nOn polarization, split into Shard:Light and Shard:Dark')
    expect(preset('card-1384').name).toBe('Flicker Blade (Amped)')
    expect(text('card-1384')).toContain('720% Damage\nOn polarization, split into Shard:Light (Amped) and Shard:Dark (Amped)')
    expect(text('card-1388')).toContain('[Equilux / Unique / Finale]\n480% Damage\n+120% base Damage Amount for each X')
    expect(text('shard-light')).toContain('96% Damage to a random enemy')
    expect(text('card-1409')).toContain('144% Damage to a random enemy')
    expect(text('card-1412')).toContain('288% Damage\nCreate 1 Sword Tassel')
    expect(text('card-1396')).toBe('360% Damage\nDiscard up to 2 card(s) in hand, then that amount Discarded × 240% Damage')
    expect(text('card-1406')).toContain('600% Damage')
    expect(text('card-1380')).toBe('1200% Damage\nWhen the next Equilux card is activated, inflict Fixed Damage equal to 30% of Damage dealt to the target')
    expect(text('card-1407')).toBe("[Unique / Initiation]\nDraw 2\nGain 1 AP\n1 Kyrken's Aegis")
    expect(preset('card-1408').cost).toBeNull()
  })

  it('Sword Tassel base %, Kyrken\'s Aegis (final) and the Ego skill\'s Fixed damage on the next Flicker Blade', () => {
    const { cs, a } = ownerBuild()
    const [apostle, blade, ego] = ['card-1407', 'card-1383', 'card-1380'].map((id) => cardFromPreset(preset(id), 'Justice'))
    addCards(cs, apostle, blade, ego)
    a.rotation = [{ cardId: ego.id }, { cardId: blade.id, stacks: { 'Sword Tassel': 2 } }, { cardId: blade.id }]
    let r = computeBuild(PRESETS, 'Rossweisse', a, settings)
    // Ego skill: 1200%, a Skill, so not Kyrken's Aegis (Attack cards); ATK 500 x 0.35 = 175 per 100%
    expect(r.plays[0].nonCrit).toBeCloseTo(12 * 175)
    // Flicker Blade: (400% x 1.2 + 2 x 80%) x 1.3 (Aegis E1) x 1.2 (final), then + 30% Fixed from the Ego skill
    const hit = 6.4 * 1.3 * 175 * 1.2
    expect(r.plays[1].hits[0].nonCrit).toBeCloseTo(hit)
    expect(r.plays[1].followUp?.nonCrit).toBeCloseTo(hit * 0.3)
    expect(r.plays[1].nonCrit).toBeCloseTo(hit * 1.3)
    // Only the next Equilux play gets it
    expect(r.plays[2].followUp).toBeUndefined()
    expect(r.plays[2].nonCrit).toBeCloseTo(4.8 * 1.3 * 175 * 1.2)
    // Below E1: Kyrken's Aegis is 20% / final 15%
    a.egoLevel = 0
    r = computeBuild(PRESETS, 'Rossweisse', a, settings)
    expect(r.plays[2].nonCrit).toBeCloseTo(4.8 * 1.2 * 175 * 1.15)
    // E3: Fixed 60%, Ego skill +400% (part of its card %)
    a.egoLevel = 3
    r = computeBuild(PRESETS, 'Rossweisse', a, settings)
    expect(r.plays[0].nonCrit).toBeCloseTo(16 * 175 * 1.2)
    expect(r.plays[1].followUp?.share).toBe(0.6)
    expect(r.warnings).toEqual([])
    // With no Equilux play after it, its share is lost: Results says so
    a.rotation = [{ cardId: blade.id }, { cardId: ego.id }]
    expect(computeBuild(PRESETS, 'Rossweisse', a, settings).warnings).toEqual([
      "Play 2 (Flickering White Night): its damage goes on the next Equilux card played, and none follows it, so that part isn't counted."])
  })

  it("Potential 7's Justice Damage is on the stats screen (15.0% at Attack 925), so nothing is added on top", () => {
    expect(ross.effects.some((e) => e.node === '7')).toBe(false)
  })
})
