import { describe, expect, it } from 'vitest'
import { computeBuild, shownPct } from '../../src/engine/calc'
import { renderCardText } from '../../src/engine/cardText'
import { AUTO, buildDeck } from '../../src/engine/deck'
import { activeBuffs } from '../../src/engine/buffs'
import { PRESETS } from '../../src/data/presets'
import { newCharacterSave } from '../../src/store/save'
import { addCards, cardFromPreset, settings } from '../helpers'

describe('Narja', () => {
  const narja = PRESETS.characters.find((c) => c.name === 'Narja')!
  const preset = (id: string) => narja.cards!.find((p) => p.id === id)!
  // Owner's screenshots (2026-10-28): Ego 0 (Mealtime 4 Predation, E3+ locked), Basic 1 (x1.02), Signature 7 (x1.14), 3-1 and 7
  // unlocked, 5-1 locked
  const ownerBuild = (egoLevel = 0, defense = 100) => {
    const cs = newCharacterSave()
    const [a] = cs.builds
    Object.assign(a, { egoLevel, basicLevel: 1, signatureLevel: 7 })
    a.stats.attack = 100
    a.stats.defense = defense
    return { cs, a }
  }
  const card = (id: string) => cardFromPreset(preset(id), 'Instinct')
  // Defense-Based: ATK x 0.3 + DEF x 2.1
  const stat = (defense = 100) => 100 * 0.3 + defense * 2.1

  it("card text matches the owner's in-game screenshots", () => {
    const { cs, a } = ownerBuild()
    const text = (id: string) => {
      const p = preset(id)
      const c = cardFromPreset(p, 'Instinct')
      const buffs = activeBuffs(PRESETS, 'Narja', cs, a, settings)
      return renderCardText(p.text, { egoLevel: a.egoLevel, nodeOn: () => true, pct: (base, fixed) => shownPct(base, c, a, narja, buffs, settings, fixed) })
    }
    expect(text('card-852')).toBe('10 Voracity\n250% Defense-Based Damage\nIf Mealtime is in Graveyard, 5 Predation')
    expect(text('card-853')).toBe('102% Defense-Based Damage')
    expect(text('card-854')).toBe('Heal 102%\n2 Voracity')
    expect(text('card-855')).toBe('34% Defense-Based Damage × 3\nAttunement: 4 Voracity')
    expect(text('card-858')).toContain('57% Defense-Based Damage × 3')
    expect(text('card-860')).toContain('68% Shield')
    expect(text('card-873')).toContain('114% Defense-Based Damage to all enemies')
    expect(text('card-876')).toContain('171% Defense-Based Damage to all enemies')
    expect(text('card-877')).toContain('365% Defense-Based Damage to all enemies')
    expect(text('card-879')).toContain('182% Defense-Based Damage to all enemies\nHeal 114%\n4 Predation')
  })

  it('Voracity and Predation per play, raised by Potential 7 (Predation only at Defense 300 or higher) and E4', () => {
    for (const [ego, defense, bonus] of [[0, 100, 0.4 + 0.8], [0, 300, 0.4 + 1.0], [4, 300, 0.4 + 1.4]]) {
      const { cs, a } = ownerBuild(ego, defense)
      a.deck.push({ id: 'na', preset: 'card-853' })
      a.rotation = [{ cardId: 'na' }, { cardId: 'na', stacks: { Voracity: 1, Predation: 1 } }]
      const r = computeBuild(PRESETS, 'Narja', cs, a, settings)
      expect(r.plays[0].nonCrit).toBeCloseTo(1.02 * stat(defense) * 0.35)
      expect(r.plays[1].nonCrit).toBeCloseTo((1.02 + bonus) * stat(defense) * 0.35)
    }
  })

  it("Domain of Voracity II's debuff counts on the plays after it; Bottomless Hunger V raises the next Mealtime", () => {
    const { cs, a } = ownerBuild()
    const domain = card('card-875')
    const hunger = card('card-866')
    const mealtime = card('card-879')
    addCards(cs, domain, hunger, mealtime)
    a.rotation = [{ cardId: domain.id },
      { cardId: mealtime.id, stacks: { 'Domain of Voracity II (on target)': 1, 'Voracity activations (Bottomless Hunger V)': 3 } }]
    const r = computeBuild(PRESETS, 'Narja', cs, a, settings)
    expect(r.plays[0].nonCrit).toBeCloseTo(1.14 * stat() * 0.35)
    // 182% + 100% taken + 3 x 40%
    expect(r.plays[1].nonCrit).toBeCloseTo((1.824 + 1 + 1.2) * stat() * 0.35)
  })

  it('E6 Liberated Memory joins the deck from E6: 50% Defense-Based, no Attack Card buffs', () => {
    expect(buildDeck(narja, ownerBuild(5).a).some((i) => i.card.id === AUTO + 'liberated-memory')).toBe(false)
    const { cs, a } = ownerBuild(6)
    expect(buildDeck(narja, a).find((i) => i.card.id === AUTO + 'liberated-memory')?.createdBy).toBe('E6')
    a.rotation = [{ cardId: AUTO + 'liberated-memory', stacks: { Voracity: 1, Predation: 1 } }]
    const r = computeBuild(PRESETS, 'Narja', cs, a, settings)
    expect(r.plays[0].nonCrit).toBeCloseTo(0.5 * stat() * 0.35)
  })
})
