import { describe, expect, it } from 'vitest'
import { computeBuild, shownPct } from '../../src/engine/calc'
import { renderCardText } from '../../src/engine/cardText'
import { AUTO } from '../../src/engine/deck'
import { activeBuffs } from '../../src/engine/buffs'
import { PRESETS } from '../../src/data/presets'
import { newCharacterSave } from '../../src/store/save'
import { addCards, cardFromPreset, settings } from '../helpers'

describe('Orlea', () => {
  const orl = PRESETS.characters.find((c) => c.name === 'Orlea')!
  const preset = (id: string) => orl.cards!.find((p) => p.id === id)!
  // Owner's screenshots (2026-10-28): E0 (Will of Light without Retain), Basic 1 (102%), Signature 7 (100% -> 114%)
  const ownerBuild = () => {
    const cs = newCharacterSave()
    const [a] = cs.builds
    Object.assign(a, { egoLevel: 0, basicLevel: 1, signatureLevel: 7 })
    a.stats.attack = 100
    return { cs, a }
  }

  it("card text matches the owner's in-game screenshots", () => {
    const { a } = ownerBuild()
    const text = (id: string) => {
      const p = preset(id)
      const c = cardFromPreset(p, 'Instinct')
      const buffs = activeBuffs(PRESETS, 'Orlea', a, settings)
      return renderCardText(p.text, { egoLevel: a.egoLevel, nodeOn: (n) => n !== '5-1', pct: (base, fixed) => shownPct(base, c, a, orl, buffs, settings, fixed) })
    }
    expect(text('card-122')).toBe('102% Damage')
    expect(preset('card-123').name).toBe('Healing of Light')
    expect(text('card-123')).toBe('Heal 102%\nHas a 50% chance to create 1 Creation★')
    expect(text('card-130')).toContain('Heal 114%')
    expect(text('card-132')).toContain('Heal 228%')
    expect(text('card-133')).toContain('Heal 171%')
    expect(text('card-136')).toBe('For each card in hand, 40% Fixed Damage and Heal 20%')
    expect(text('card-137')).toBe('40% Fixed Damage for each card in hand\nWhen there are 6 or more cards, Heal 228%')
    expect(text('card-138')).toBe('114% Defense-Based Damage\nFor each Creation in hand, +100% Damage Amount and Heal 68%')
    expect(text('card-139')).toContain('513% Defense-Based Damage\nHeal 228%')
    expect(text('card-140')).toContain('68% Defense-Based Damage × 3')
    expect(text('card-141')).toContain('137% Defense-Based Damage')
    expect(text('card-148')).toBe('Heal 228%\nActivate the Retain effect of all cards in hand')
    expect(text('card-149')).toContain('Increase Damage Amount by 10% for 1 turn')
    expect(text('card-150')).toBe('[Exhaust / Retain / Creation]\n114% Damage\nRetain: +40% Damage Amount')
    expect(text('card-151')).toBe('[Exhaust / Retain / Creation]\n114% Shield\nRetain: Heal 68%')
  })

  it('Annoying: 40% Fixed x the play\'s Cards in hand (1 unless set)', () => {
    const { cs, a } = ownerBuild()
    const ann = cardFromPreset(preset('card-136'), 'Instinct')
    addCards(cs, ann)
    a.rotation = [{ cardId: ann.id, stacks: { 'Cards in hand': 5 } }, { cardId: ann.id }]
    const r = computeBuild(PRESETS, 'Orlea', a, settings)
    expect(r.plays[0].nonCrit).toBeCloseTo(5 * r.plays[1].nonCrit)
    expect(r.plays[1].nonCrit).toBeCloseTo(0.4 * 100 * 0.35)   // Fixed: % x Final ATK x 0.35, not raised by the upgrade
  })

  it('Swiftie: Retain +40% per turn, Softie Retain and Sacred Censer IV multiply', () => {
    const { cs, a } = ownerBuild()
    const censer = cardFromPreset(preset('card-128'), 'Instinct')
    addCards(cs, censer)
    a.rotation = [{ cardId: AUTO + 'card-150', stacks: { 'Swiftie retains': 2, 'Softie ★ retains': 3, 'Sacred Censer IV': 1 } }]
    const r = computeBuild(PRESETS, 'Orlea', a, settings)
    // (114% x (1 + 30% + 40%) + 80%) x ATK 100 x 0.35
    expect(r.plays[0].nonCrit).toBeCloseTo((1.14 * 1.7 + 0.8) * 100 * 0.35)
  })
})
