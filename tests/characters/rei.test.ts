import { describe, expect, it } from 'vitest'
import { computeBuild, shownPct } from '../../src/engine/calc'
import { renderCardText } from '../../src/engine/cardText'
import { activeBuffs } from '../../src/engine/buffs'
import { PRESETS } from '../../src/data/presets'
import { newBuff, newCharacterSave } from '../../src/store/save'
import { addCards, cardFromPreset, settings } from '../helpers'

describe('Rei', () => {
  const rei = PRESETS.characters.find((c) => c.name === 'Rei')!
  const preset = (id: string) => rei.cards!.find((p) => p.id === id)!
  // Owner's screenshots (2026-10-28): E6, Basic 1 + 6 and Signature 1 + 6 (x1.14), 3-1 unlocked, 5-1 and 7 not
  const ownerBuild = () => {
    const cs = newCharacterSave()
    const [a] = cs.builds
    Object.assign(a, { egoLevel: 6, basicLevel: 1, signatureLevel: 1 })
    a.presetSwitches['Rei|p5-1-blade'] = false
    a.presetSwitches['Rei|p7-predator'] = false
    a.stats.attack = 100
    return { cs, a }
  }
  const card = (id: string) => cardFromPreset(preset(id), 'Void')

  it("card text matches the owner's in-game screenshots", () => {
    const { cs, a } = ownerBuild()
    const text = (id: string) => {
      const p = preset(id)
      const c = cardFromPreset(p, 'Void')
      const buffs = activeBuffs(PRESETS, 'Rei', cs, a, settings)
      return renderCardText(p.text, { egoLevel: a.egoLevel, nodeOn: () => true, pct: (base, fixed) => shownPct(base, c, a, rei, buffs, settings, fixed) })
    }
    expect(text('card-217')).toBe('400% Damage\n15% DMG-Based Recovery\nGain 1 AP')
    expect(text('card-218')).toBe('114% Damage\n20% DMG-Based Recovery')
    expect(text('card-219')).toBe('Heal 114%')
    expect(text('card-220')).toBe('[Lead]\n114% Damage\nIncrease Damage Amount of Basic Attack Cards by 100% for 1 turn')
    expect(text('card-221')).toContain('171% Damage\nIncreases Damage Amount of Basic Attack Cards by 150% for 1 turn')
    expect(text('card-222')).toBe('399% Damage\n20% DMG-Based Recovery\nDecrease Damage Amount by 20% for 1 turn')
    expect(text('card-226')).toBe('[Unique]\n+40% Damage Amount to 1-Cost cards\nAt the end of the turn, Heal 60%')
    expect(text('card-231')).toBe('Heal 114%\nFor 1 turn, +80% Damage Amount to 1-Cost cards')
    expect(text('card-232')).toBe('[Exhaust]\nChoose 1 card(s) in hand to Exhaust\nHeal 228%\nDraw 1')
    expect(text('card-235')).toContain('Heal 171%')
    expect(text('card-244')).toBe('285% Damage\nFor 1 turn, 4 Morale')
  })

  it('Strike of Darkness raises Basic Attack cards; II lowers the later cards; E6 adds +20% to Attack cards', () => {
    const { cs, a } = ownerBuild()
    const blade = card('card-218')
    const predator = card('card-244')
    addCards(cs, blade, predator, card('card-220'), card('card-222'), card('card-224'))
    a.rotation = [{ cardId: blade.id, stacks: { 'Strike of Darkness': 1 } }, { cardId: predator.id, stacks: { 'Strike of Darkness II': 1 } }]
    const r = computeBuild(PRESETS, 'Rei', cs, a, settings)
    // 114% x (1 + 100% + 80%) + E6 20%
    expect(r.plays[0].nonCrit).toBeCloseTo((1.14 * 2.8 + 0.2) * 100 * 0.35)
    // 285% x (1 - 20%) + E6 20%
    expect(r.plays[1].nonCrit).toBeCloseTo((2.85 * 0.8 + 0.2) * 100 * 0.35)
  })

  it('Resonating Darkness IV reaches 1-Cost or lower cards; E4 makes Final Shadow 400%', () => {
    const { cs, a } = ownerBuild()
    const blade = card('card-218')
    const ego = card('card-217')
    addCards(cs, blade, ego, card('card-230'))
    a.rotation = [{ cardId: blade.id }, { cardId: ego.id }]
    const r = computeBuild(PRESETS, 'Rei', cs, a, settings)
    expect(r.plays[0].nonCrit).toBeCloseTo((1.14 + 0.4 + 0.2) * 100 * 0.35)
    expect(r.plays[1].nonCrit).toBeCloseTo(4 * 100 * 0.35)
    // The E4 part is in the card's own % (docs/FORMULA.md, Ego skill bonuses), so a "by X%" buff raises all 400%
    cs.buffs.push({ ...newBuff(a.id), value: '30%', appliesTo: 'Final Shadow' })
    expect(computeBuild(PRESETS, 'Rei', cs, a, settings).plays[1].nonCrit).toBeCloseTo(4 * 1.3 * 100 * 0.35)
  })

  it("Potential 7 raises Predator's Blade's card % from 550 Attack", () => {
    const { cs, a } = ownerBuild()
    delete a.presetSwitches['Rei|p7-predator']
    a.stats.attack = 600
    const predator = card('card-244')
    addCards(cs, predator)
    a.rotation = [{ cardId: predator.id }]
    const r = computeBuild(PRESETS, 'Rei', cs, a, settings)
    // (250% + 10% + 5 x 1%) x 1.14 + E6 20%
    expect(r.plays[0].nonCrit).toBeCloseTo(((2.5 + 0.15) * 1.14 + 0.2) * 600 * 0.35)
  })
})
