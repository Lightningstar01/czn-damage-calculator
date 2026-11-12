import { describe, expect, it } from 'vitest'
import { computeBuild, shownPct } from '../../src/engine/calc'
import { renderCardText } from '../../src/engine/cardText'
import { activeBuffs, buffMatches } from '../../src/engine/buffs'
import { PRESETS } from '../../src/data/presets'
import { newCharacterSave } from '../../src/store/save'
import { addCards, card, cardFromPreset, settings } from '../helpers'

describe('Tiphera', () => {
  const tip = PRESETS.characters.find((c) => c.name === 'Tiphera')!
  const preset = (id: string) => tip.cards!.find((p) => p.id === id)!
  // Owner's screenshots (2026-10-28): below E3 (Ego skill "2 times"), Basic 1 (102%), Signature 6 (120% -> 134%)
  const ownerBuild = () => {
    const cs = newCharacterSave()
    const [a] = cs.builds
    Object.assign(a, { egoLevel: 0, basicLevel: 1, signatureLevel: 6 })
    a.stats.attack = 100
    a.stats.defense = 300
    return { cs, a }
  }

  it("card text matches the owner's in-game screenshots", () => {
    const { a } = ownerBuild()
    const text = (id: string) => {
      const p = preset(id)
      const c = cardFromPreset(p, 'Order')
      const buffs = activeBuffs(PRESETS, 'Tiphera', a, settings)
      return renderCardText(p.text, { egoLevel: a.egoLevel, nodeOn: () => true, pct: (base) => shownPct(base, c, a, tip, buffs, settings) })
    }
    expect(text('card-958')).toBe('102% Defense-Based Damage')
    expect(text('card-959')).toBe('Heal 71%\n71% Shield')
    expect(text('card-960')).toContain('Heal 112%')
    expect(text('card-972')).toBe('134% Defense-Based Damage\n90% Shield\nHeal 90%\nHarmonization: Double all effects')
    expect(text('card-973')).toContain('202% Defense-Based Damage\n112% Shield\nHeal 112%')
    expect(text('card-974')).toContain('616% Defense-Based Damage')
    expect(text('card-975')).toContain('179% Defense-Based Damage\n45% Shield\nHeal 45%')
    expect(text('card-977')).toContain('168% Defense-Based Damage for each Cost')
    expect(text('card-985')).toBe('[Exhaust]\nHeal 67%\n1 AP')
    expect(text('card-986')).toContain('67% Shield\nIncrease Damage Amount of the first Hit of next Attack Card by 30%\n(max 300%)')
    expect(text('card-957')).toContain('The next 2 times')
    expect(text('card-984')).toContain('[Unique / Form Upgrade (0/3)]')
  })

  it('Harmonization doubles the card %, △ stacks raise the first hit of any ally\'s Attack card', () => {
    const { cs, a } = ownerBuild()
    const [cd, seed] = ['card-972', 'card-960'].map((id) => cardFromPreset(preset(id), 'Order'))
    addCards(cs, cd, seed)
    a.rotation = [{ cardId: cd.id }, { cardId: cd.id, stacks: { Harmonization: 1, 'Archetype △': 2 } }]
    const r = computeBuild(PRESETS, 'Tiphera', a, settings)
    // Stat: ATK 100 x 0.3 + DEF 300 x 2.1 = 660, x 0.35
    const unit = 660 * 0.35
    expect(r.plays[0].nonCrit).toBeCloseTo(1.2 * 1.12 * unit)
    expect(r.plays[1].nonCrit).toBeCloseTo(1.2 * 1.12 * 2 * 1.6 * unit)
    const triangle = tip.cards!.find((p) => p.id === 'card-986')!.effects![0]
    expect(triangle.target).toBe('allies')
  })

  it('Creation and Destruction V: 168% x the play\'s Cost (the card\'s 5 unless set)', () => {
    const { cs, a } = ownerBuild()
    const v = cardFromPreset(preset('card-977'), 'Order')
    addCards(cs, v)
    a.rotation = [{ cardId: v.id, cost: 3 }, { cardId: v.id }]
    const r = computeBuild(PRESETS, 'Tiphera', a, settings)
    const unit = 660 * 0.35
    expect(r.plays[0].nonCrit).toBeCloseTo(1.5 * 1.12 * 3 * unit)
    expect(r.plays[0].card.cost).toBe(3)
    expect(r.plays[1].nonCrit).toBeCloseTo(1.5 * 1.12 * 5 * unit)
  })

  it('Defense-Based matches DEF cards only', () => {
    expect(buffMatches({ appliesTo: 'Defense-Based', condition: 'Always' }, cardFromPreset(preset('card-958'), 'Order'))).toBe(true)
    expect(buffMatches({ appliesTo: 'Defense-Based', condition: 'Always' }, card('Strike', 'Attack', 1))).toBe(false)
  })
})
