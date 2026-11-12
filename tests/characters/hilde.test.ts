import { describe, expect, it } from 'vitest'
import { computeBuild, shownPct } from '../../src/engine/calc'
import { renderCardText } from '../../src/engine/cardText'
import { activeBuffs } from '../../src/engine/buffs'
import { PRESETS } from '../../src/data/presets'
import { newCharacterSave } from '../../src/store/save'
import { cardFromPreset, gameSettings, settings } from '../helpers'

describe('Hilde', () => {
  const hilde = PRESETS.characters.find((c) => c.name === 'Hilde')!
  const preset = (id: string) => hilde.cards!.find((p) => p.id === id)!
  // Owner's screenshots (2026-11-08): Basic 1, Unique 7 (x1.14), 3-1 and 7 unlocked, 5-1 locked, Ego level 0
  const ownerBuild = () => {
    const cs = newCharacterSave()
    const [a] = cs.builds
    Object.assign(a, { egoLevel: 0, basicLevel: 1, signatureLevel: 7 })
    a.potentialNodes = { '5-1': false }
    a.stats.attack = 100
    return { cs, a }
  }

  it("card text matches the owner's in-game screenshots", () => {
    const { a } = ownerBuild()
    const text = (id: string) => {
      const p = preset(id)
      const c = cardFromPreset(p, 'Instinct')
      const buffs = activeBuffs(PRESETS, 'Hilde', a, gameSettings)
      return renderCardText(p.text, { egoLevel: a.egoLevel, nodeOn: (n) => a.potentialNodes?.[n] !== false,
        pct: (base, fixed) => shownPct(base, c, a, hilde, buffs, gameSettings, fixed) })
    }
    expect(text('card-1230')).toBe('+15% Weakness Damage Amount taken to all enemies for 1 turn(s)\nDraw 3 Attack Card(s) of this unit\nApply Weakness Attack to those cards for 1 turn')
    // Multishot 82% = (60% + 3-1's 20%) x 1.02
    expect(text('card-1231')).toBe('82% Damage to all enemies')
    expect(text('card-1232')).toBe('102% Shield')
    expect(text('card-1239')).toBe('68% Damage and 2 Ionization to all enemies')
    expect(text('card-1240')).toContain('114% Damage and 2 Ionization')
    expect(text('card-1243')).toBe('[Ignition]\n205% Piercing Damage and 3 Ionization to all enemies')
    expect(text('card-1244')).toContain('137% Damage to all enemies')
    expect(text('card-1257')).toBe('[Unique]\nDraw 3\n137% Damage to all enemies\n+60% Damage Amount for each Attack Card Drawn through an ability this turn (max 8 cards)')
    expect(text('card-1258')).toBe('[Exhaust]\n137% Extra Attack to the enemy with the lowest HP\nDraw 1\nAttunement: Proc this card')
    expect(text('card-1259')).toContain('57% Extra Attack to all enemies')
    expect(text('card-1260')).toContain('570% Extra Attack to the enemy with the highest HP')
  })

  it('Homing Arrow: Extra Attack with Ionization (+8% and +4% from Hilde per stack) and Matrix Overlay (+15% Weakness DMG)', () => {
    const { a } = ownerBuild()
    a.deck.push({ id: 'qr', preset: 'card-1233' })
    a.rotation = [{ cardId: 'auto:card-1258' }, { cardId: 'auto:card-1258', stacks: { Ionization: 5 } },
      { cardId: 'auto:card-1258', stacks: { 'Matrix Overlay this turn': 1 } },
      { cardId: 'auto:card-1258', stacks: { 'Matrix Overlay this turn': 1, 'Matrix Overlay drew this card': 1 } }]
    const r = computeBuild(PRESETS, 'Hilde', a, settings)
    const pct = 1.2 * 1.14
    expect(r.plays[0].nonCrit).toBeCloseTo(pct * 35)
    expect(r.plays[1].nonCrit).toBeCloseTo((pct + 5 * 0.12) * 35)
    // The +15% only counts on a play that hits a Weakness
    expect(r.plays[2].nonCrit).toBeCloseTo(pct * 35)
    expect(r.plays[3].nonCrit).toBeCloseTo(pct * 1.4 * 35)
  })

  it('Zero In: one 35% x stacks Extra Attack, unraised; Vortex Arrow +60% per Attack Card drawn; E2 Double Tap on every Homing Arrow', () => {
    const { a } = ownerBuild()
    a.deck.push({ id: 'bgr', preset: 'card-1251' }, { id: 'va', preset: 'card-1257' }, { id: 'qr3', preset: 'card-1236' })
    a.rotation = [{ cardId: 'auto:zero-in', stacks: { 'Zero In': 20 } }, { cardId: 'va', stacks: { 'Attack Cards drawn by abilities this turn': 3 } },
      { cardId: 'auto:card-1260', stacks: { 'Double Tap': 1 } }]
    let r = computeBuild(PRESETS, 'Hilde', a, settings)
    expect(r.plays[0].hits).toHaveLength(1)
    expect(r.plays[0].nonCrit).toBeCloseTo(0.35 * 20 * 35)
    expect(r.plays[1].nonCrit).toBeCloseTo((1.2 * 1.14 + 3 * 0.6) * 35)
    expect(r.plays[2].triggered).toEqual([])
    a.egoLevel = 2
    r = computeBuild(PRESETS, 'Hilde', a, settings)
    expect(r.plays[2].triggered.map((t) => [t.card.name, t.nonCrit])).toEqual([['Double Tap', 3 * 35]])
  })
})
