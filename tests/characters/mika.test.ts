import { describe, expect, it } from 'vitest'
import { computeBuild, shownPct } from '../../src/engine/calc'
import { renderCardText } from '../../src/engine/cardText'
import { activeBuffs } from '../../src/engine/buffs'
import { PRESETS } from '../../src/data/presets'
import { newCharacterSave } from '../../src/store/save'
import { addCards, cardFromPreset, settings } from '../helpers'

describe('Mika', () => {
  const mika = PRESETS.characters.find((c) => c.name === 'Mika')!
  const preset = (id: string) => mika.cards!.find((p) => p.id === id)!
  // Owner's screenshots (2026-10-28): E6 (Basic 10 + 6 = 132%), Signature 1 + 6 (100% -> 114%), 5-1 not unlocked
  const ownerBuild = () => {
    const cs = newCharacterSave()
    const [a] = cs.builds
    Object.assign(a, { egoLevel: 6, basicLevel: 10, signatureLevel: 1 })
    a.stats.attack = 100
    return { cs, a }
  }

  it("card text matches the owner's in-game screenshots", () => {
    const { a } = ownerBuild()
    const text = (id: string) => {
      const p = preset(id)
      const c = cardFromPreset(p, 'Justice')
      const buffs = activeBuffs(PRESETS, 'Mika', a, settings)
      return renderCardText(p.text, { egoLevel: a.egoLevel, nodeOn: (n) => n !== '5-1', pct: (base, fixed) => shownPct(base, c, a, mika, buffs, settings, fixed) })
    }
    expect(text('card-543')).toBe('Create 2 Source of Water Card(s), grant Exhaust and Retain to it')
    expect(text('card-544')).toBe('132% Damage')
    expect(text('card-545')).toBe('Heal 172%')
    expect(text('card-546')).toBe('Heal 114%\nGain 1 AP')
    expect(text('card-547')).toContain('Heal 171%')
    expect(text('card-557')).toContain('Heal 57%')
    expect(text('card-559')).toContain('Heal 57%')
    expect(text('card-564')).toBe('228% Damage to all enemies\nHeal 50% for each target hit')
    expect(text('card-568')).toContain('342% Damage')
    expect(text('card-569')).toContain('Heal 114%\n114%(228%) Damage to all enemies')
    expect(text('card-570')).toBe('[Unique / Initiation]\n1 Wave\nAt the start of the turn, 1 Wave')
  })

  it('Whirlpool V counts the bracket value, 228%', () => {
    const { cs, a } = ownerBuild()
    const wv = cardFromPreset(preset('card-569'), 'Justice')
    addCards(cs, wv)
    a.rotation = [{ cardId: wv.id }]
    const r = computeBuild(PRESETS, 'Mika', a, settings)
    expect(r.plays[0].nonCrit).toBeCloseTo(2.28 * 100 * 0.35)
  })
})
