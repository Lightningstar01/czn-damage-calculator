import { describe, expect, it } from 'vitest'
import { computeBuild, shownPct } from '../../src/engine/calc'
import { renderCardText } from '../../src/engine/cardText'
import { buildDeck } from '../../src/engine/deck'
import { activeBuffs } from '../../src/engine/buffs'
import { PRESETS } from '../../src/data/presets'
import { newCharacterSave } from '../../src/store/save'
import { cardFromPreset, settings } from '../helpers'

describe('Nia', () => {
  const nia = PRESETS.characters.find((c) => c.name === 'Nia')!
  const preset = (id: string) => nia.cards!.find((p) => p.id === id)!
  // Owner's screenshots (2026-10-28): E6, Basic and Unique 7/16 (1 + 6 from E3 and E5: x1.14), 3-1 and 7 unlocked, 5-1 locked
  const ownerBuild = () => {
    const cs = newCharacterSave()
    const [a] = cs.builds
    Object.assign(a, { egoLevel: 6, basicLevel: 1, signatureLevel: 1 })
    a.stats.attack = 100
    return { cs, a }
  }

  it("card text matches the owner's in-game screenshots", () => {
    const { cs, a } = ownerBuild()
    const text = (id: string) => {
      const p = preset(id)
      const c = cardFromPreset(p, 'Instinct')
      const buffs = activeBuffs(PRESETS, 'Nia', cs, a, settings)
      return renderCardText(p.text, { egoLevel: a.egoLevel, nodeOn: () => true, pct: (base, fixed) => shownPct(base, c, a, nia, buffs, settings, fixed) })
    }
    expect(text('card-609')).toBe('200% Damage to all enemies\n5 Decibel\nDiscard all cards in Draw Pile')
    expect(text('card-610')).toBe('114% Damage')
    expect(text('card-611')).toBe('Heal 114%\n2 Elasticity')
    expect(text('card-618')).toContain('150% Extra Attack')
    expect(text('card-619')).toContain('250% Extra Attack')
    expect(text('card-621')).toBe('Heal 171%\nProc 1 of the lowest-Cost card(s)')
    expect(text('card-615')).toContain('120% Extra Attack')
    expect(text('card-624')).toBe('[Retain]\nHeal 171%\nFor 1 turn, when a card is Discarded, 1 Decibel and 2 Elasticity')
    expect(text('card-625')).toContain('Heal 228%')
    expect(text('card-626')).toContain('Heal 171%')
    expect(text('card-628')).toContain('Heal 228%')
  })

  it('Owner Extra Attacks are unraised Extra Attack plays; Decibel comes with the Ego skill, +50% per Decibel; E2 Rhythm Boost', () => {
    const { cs, a } = ownerBuild()
    a.deck.push({ id: 'm', preset: 'card-618' })
    expect(buildDeck(nia, a).map((i) => i.card.name)).toContain('Decibel (Shuffle)')
    a.rotation = [{ cardId: 'm' }, { cardId: 'auto:decibel', stacks: { Decibel: 5 } },
      { cardId: 'm', stacks: { 'Rhythm Boost': 4 } }, { cardId: 'auto:card-609', stacks: { Decibel: 5 } }]
    const r = computeBuild(PRESETS, 'Nia', cs, a, settings)
    expect(r.plays[0].nonCrit).toBeCloseTo(1.5 * 100 * 0.35)
    expect(r.plays[1].nonCrit).toBeCloseTo((0.5 + 5 * 0.5) * 100 * 0.35)
    expect(r.plays[2].nonCrit).toBeCloseTo((1.5 + 4 * 0.05) * 100 * 0.35)
    // Decibel's bonus reaches only the shuffle Extra Attack
    expect(r.plays[3].nonCrit).toBeCloseTo(2 * 100 * 0.35)
  })
})
