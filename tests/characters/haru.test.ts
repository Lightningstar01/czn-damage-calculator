import { describe, expect, it } from 'vitest'
import { computeBuild, shownPct } from '../../src/engine/calc'
import { renderCardText } from '../../src/engine/cardText'
import { activeBuffs } from '../../src/engine/buffs'
import { PRESETS } from '../../src/data/presets'
import { newCharacterSave } from '../../src/store/save'
import { cardFromPreset, settings } from '../helpers'

describe('Haru', () => {
  const haru = PRESETS.characters.find((c) => c.name === 'Haru')!
  const preset = (id: string) => haru.cards!.find((p) => p.id === id)!
  // Owner's screenshots (2026-10-30): E0, Basic 1/10, Unique 7/10, Common 1/10, Attack 775; 3-1 and 7 unlocked, 5-1 and 5-2 locked
  const ownerBuild = (egoLevel = 0) => {
    const cs = newCharacterSave()
    const [a] = cs.builds
    Object.assign(a, { egoLevel, basicLevel: 1, signatureLevel: 7 })
    a.stats.attack = 775
    a.presetSwitches['Haru|p5-1-anchors'] = false
    return { cs, a }
  }
  const textAt = (egoLevel: number) => {
    const { cs, a } = ownerBuild(egoLevel)
    return (id: string) => {
      const p = preset(id)
      const c = cardFromPreset(p, 'Justice')
      const buffs = activeBuffs(PRESETS, 'Haru', cs, a, settings)
      return renderCardText(p.text, { egoLevel: a.egoLevel, nodeOn: () => true, pct: (base, fixed) => shownPct(base, c, a, haru, buffs, settings, fixed) })
    }
  }

  it("card text matches the owner's in-game screenshots", () => {
    const text = textAt(0)
    expect(text('card-637')).toBe('600% Damage\n+60% Damage Amount for each beneficial effect in possession (max +600%)')
    expect(text('card-638')).toBe('122% Damage\n+10% Damage Amount to Anchor Shot')
    expect(text('card-639')).toBe('245% Damage\n+10% Damage Amount to Anchor Shot')
    expect(text('card-640')).toBe('102% Shield')
    expect(text('card-641')).toBe('[Pulverize]\n365% Damage\n+100% Damage Amount for each activation of this card (max 10)')
    expect(text('card-642')).toBe('[Pulverize]\n479% Damage\n+150% Damage Amount for each activation of this card (max 10)')
    expect(text('card-643')).toBe('[Pulverize]\n422% Damage\nStreak: Add 1 Hit')
    expect(text('card-644')).toContain('[Retain / Pulverize]\n422% Damage')
    expect(text('card-645')).toContain('456% Damage')
    expect(text('card-646')).toContain('422% Damage')
    expect(text('card-653')).toBe('274% Damage to all enemies\nIf there is only one target, +100% Damage Amount')
    expect(text('card-654')).toBe('365% Damage to all enemies\nIf there is only one target, +150% Damage Amount')
    expect(text('card-655')).toBe('[Weakness Attack]\n365% Damage to all enemies')
    expect(text('card-656')).toContain('308% Damage')
    expect(text('card-657')).toContain('308% Damage')
    expect(text('card-658')).toContain('365% Damage')
    expect(text('card-659')).toBe('[Retain]\nIncrease Damage Amount of Attack Cards of this unit by 50% for 1 turn')
    expect(text('card-665')).toBe('[Retain]\nIncrease Damage Amount of Anchor Shot in hand by 80% for 1 turn until activated')
    expect(preset('card-659').cost).toBe(0)
    expect(preset('card-662').cost).toBe(1)
  })

  it('E3 Power Strike is 800%, +80% each, max +800%; E1 Lift Anchor is 120%', () => {
    const text = textAt(3)
    expect(text('card-637')).toBe('800% Damage\n+80% Damage Amount for each beneficial effect in possession (max +800%)')
    expect(text('card-665')).toContain('by 120% for 1 turn')
    const { cs, a } = ownerBuild(3)
    a.rotation = [{ cardId: 'auto:card-637', stacks: { 'Beneficial effects': 12 } }]
    expect(computeBuild(PRESETS, 'Haru', cs, a, settings).plays[0].nonCrit).toBeCloseTo((6 + 2 + 10 * 0.8) * 775 * 0.35)
    a.egoLevel = 0
    expect(computeBuild(PRESETS, 'Haru', cs, a, settings).plays[0].nonCrit).toBeCloseTo((6 + 10 * 0.6) * 775 * 0.35)
  })

  it('Potential 7 needs Attack 600 for its second +10%', () => {
    const { cs, a } = ownerBuild()
    a.deck.push({ id: 'as', preset: 'card-641' })
    a.rotation = [{ cardId: 'as' }]
    expect(computeBuild(PRESETS, 'Haru', cs, a, settings).plays[0].nonCrit).toBeCloseTo(3.2 * 1.14 * 775 * 0.35)
    a.stats.attack = 599
    expect(computeBuild(PRESETS, 'Haru', cs, a, settings).plays[0].nonCrit).toBeCloseTo(3.1 * 1.14 * 599 * 0.35)
  })

  it('Anchor Shot: activations, Anchors played, Pulverize and Lift Anchor; every epiphany gets them', () => {
    const { cs, a } = ownerBuild()
    a.deck.push({ id: 'as', preset: 'card-645' }, { id: 'la', preset: 'card-665' })
    a.rotation = [{ cardId: 'as', stacks: { 'Anchor Shot activations': 3, 'Anchors played': 2, 'Target holding Shield': 1, 'Lift Anchor': 1 } }]
    const r = computeBuild(PRESETS, 'Haru', cs, a, settings)
    // (380% + 20%) x 1.14 x (1 + 20% + 80%) + 3 x 100% + 2 x 10%
    expect(r.plays[0].nonCrit).toBeCloseTo((4 * 1.14 * 2 + 3 + 0.2) * 775 * 0.35)
  })

  it('Charge Energy V is always on; single target is a switch; III and Power Supply read the play', () => {
    const { cs, a } = ownerBuild(4)
    a.deck.push({ id: 'pc', preset: 'card-653' }, { id: 'ce', preset: 'card-664' }, { id: 'ce3', preset: 'card-662' })
    a.rotation = [{ cardId: 'pc', stacks: { 'Cards of this unit in hand': 2, 'Power Supply': 5 } }]
    // 240% x 1.14 x (1 + 40%) + single target 100% + 2 x 70% + 3 x 30%
    const pct = 2.4 * 1.14 * 1.4 + 1 + 1.4 + 0.9
    expect(computeBuild(PRESETS, 'Haru', cs, a, settings).plays[0].nonCrit).toBeCloseTo(pct * 775 * 0.35)
    a.presetSwitches['Power Charge|single-target'] = false
    expect(computeBuild(PRESETS, 'Haru', cs, a, settings).plays[0].nonCrit).toBeCloseTo((pct - 1) * 775 * 0.35)
  })

  it('E2 / E6 lower Anchor Shot per AP short; E6 adds 30% on the start-of-turn card', () => {
    const { cs, a } = ownerBuild(2)
    a.deck.push({ id: 'as', preset: 'card-641' })
    a.rotation = [{ cardId: 'as', stacks: { 'AP short of Cost': 2, 'Start-of-turn Anchor Shot': 1 } }]
    expect(computeBuild(PRESETS, 'Haru', cs, a, settings).plays[0].nonCrit).toBeCloseTo(3.2 * 1.14 * (1 - 0.6) * 775 * 0.35)
    // E6 has E5's +3 levels on the upgrade: Unique 10
    a.egoLevel = 6
    expect(computeBuild(PRESETS, 'Haru', cs, a, settings).plays[0].nonCrit).toBeCloseTo(3.2 * 1.2 * (1 - 0.3 + 0.3) * 775 * 0.35)
  })
})
