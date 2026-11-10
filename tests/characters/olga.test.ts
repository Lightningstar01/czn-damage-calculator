import { describe, expect, it } from 'vitest'
import { computeBuild, shownPct } from '../../src/engine/calc'
import { renderCardText } from '../../src/engine/cardText'
import { activeBuffs } from '../../src/engine/buffs'
import { AUTO } from '../../src/engine/deck'
import { PRESETS } from '../../src/data/presets'
import { newCharacterSave } from '../../src/store/save'
import { cardFromPreset, settings } from '../helpers'

describe('Olga', () => {
  const olga = PRESETS.characters.find((c) => c.name === 'Olga')!
  const preset = (id: string) => olga.cards!.find((p) => p.id === id)!
  // The in-game preview (2026-11-09): the owner doesn't have her, so E0, Basic 0, Signature 0, every node locked
  const build = (egoLevel = 0) => {
    const cs = newCharacterSave()
    const [a] = cs.builds
    Object.assign(a, { egoLevel, basicLevel: 0, signatureLevel: 0, potentialNodes: { '3-1': false, '5-1': false, 7: false } })
    Object.assign(a.stats, { attack: 500, critChance: 0, dotDmg: 0.1 })
    a.stats.elemDmg.Instinct = 0.1
    return { cs, a }
  }
  /** One play; deck: extra cards in the deck (their buffs count). */
  const play = (cardId: string, stacks: Record<string, number>, egoLevel = 0, deck: string[] = []) => {
    const { cs, a } = build(egoLevel)
    a.deck = [...deck, ...(cardId.startsWith(AUTO) ? [] : [cardId])].map((preset, i) => ({ id: `d${i}`, preset }))
    const id = cardId.startsWith(AUTO) ? cardId : `d${a.deck.length - 1}`
    a.rotation = [{ cardId: id, stacks }]
    return computeBuild(PRESETS, 'Olga', cs, a, settings, {}, { enemies: [{ defMult: 1, dr: 0 }] })
  }
  const ATK = 500 * 0.35 * 1.1

  it("card text matches the in-game screenshots", () => {
    const { cs, a } = build()
    const text = (id: string) => {
      const p = preset(id)
      const c = cardFromPreset(p, 'Instinct')
      const buffs = activeBuffs(PRESETS, 'Olga', cs, a, settings)
      return renderCardText(p.text, { egoLevel: a.egoLevel, nodeOn: () => false, pct: (base, fixed) => shownPct(base, c, a, olga, buffs, settings, fixed) })
    }
    expect(text('card-1323')).toBe('400% Damage to all enemies\nFor each Fracture, Agony, and Scorched activated this turn, +50%, +20%, and +30% base Damage Amount, respectively (max 300%)')
    expect(text('card-1324')).toBe('100% Damage')
    expect(text('card-1325')).toBe('Heal 100%')
    expect(text('card-1326')).toBe('80% Damage and 2 Fracture, then activate Fracture inflicted by this unit')
    expect(text('card-1327')).toBe('140% Damage and 3 Fracture, then activate Fracture inflicted by this unit')
    expect(text('card-1332')).toBe('80% Damage and 4 Agony, then activate Agony inflicted by this unit')
    expect(text('card-1337')).toBe('100% Damage and 4 Agony, then activate Agony inflicted by this unit\nAt the end of the turn, 1 additional Agony (max 4)')
    expect(text('card-1338')).toBe('1 Brand of Agony\n4 Agony to the enemy with the highest HP')
    expect(text('card-1344')).toBe('[Unique]\nWhen Fracture or Agony is activated through a Targeting Card, 2 Fracture and 3 Agony to the target (3 time(s) per turn)')
    expect(text('card-1350')).toBe('[Unique / Rapacity]\n2 Shattering, 200% Damage, 2 Fracture, and 4 Agony\nWhen this card is activated, change into Reckoning')
    expect(text('card-1351')).toBe('[Unique / Rapacity]\n400% Damage\n+20% base Damage Amount for each Rapacity\nActivate Agony and Fracture inflicted by this unit\nWhen this card is activated, change into End of the Line')
    expect(text('fracture')).toBe('At the end of the turn, 40% DoT for each Fracture\nOn effect activation, decrease Fracture stacks by half (max 30 stacks)')
    expect(text('agony')).toBe('At the end of the turn, 50% Fixed DoT × Agony count\nOn effect activation, decrease Agony stacks by half (max 20 stacks)')
  })

  describe('Maelstrom of Oblivion', () => {
    const EGO = `${AUTO}card-1323`
    const counts = (f: number, a: number, s: number) => ({ 'Fracture activated this turn': f, 'Agony activated this turn': a, 'Scorched activated this turn': s })

    it('adds +50% / +20% / +30% base Damage Amount per activation', () => {
      expect(play(EGO, counts(2, 5, 0)).plays[0].hits[0].cardMult).toBeCloseTo(6)
    })
    it('stops the three together at +300% (sharedCap)', () => {
      // 4 x 50% + 5 x 20% + 2 x 30% = 360%, capped at 300%
      expect(play(EGO, counts(4, 5, 2)).plays[0].hits[0].cardMult).toBeCloseTo(7)
    })
    it('E3: +200% and a 450% cap', () => {
      expect(play(EGO, counts(4, 5, 2), 3).plays[0].hits[0].cardMult).toBeCloseTo(4 + 2 + 3.6)
      expect(play(EGO, counts(9, 22, 15), 3).plays[0].hits[0].cardMult).toBeCloseTo(4 + 2 + 4.5)
    })
  })

  describe('Reckoning', () => {
    it('+20% base Damage Amount per Rapacity, raised by the DoT stat (Rapacity: Attack and DoT)', () => {
      const hit = play('card-1351', { Rapacity: 10 }).plays[0].hits[0]
      expect(hit.cardMult).toBeCloseTo(6)
      expect(hit.mechDmg?.value).toBeCloseTo(1.1)
      expect(hit.nonCrit).toBeCloseTo(6 * ATK * 1.1)
    })
    it('E1: +200% Damage Amount and +30% per Rapacity', () => {
      expect(play('card-1351', { Rapacity: 10 }, 1).plays[0].hits[0].cardMult).toBeCloseTo(6 + 3)
    })
  })

  describe('ticks', () => {
    const FRACTURE = `${AUTO}fracture`
    const AGONY = `${AUTO}agony`

    it('Fracture: one hit of 40% x the stacks', () => {
      const r = play(FRACTURE, { 'Fracture on target': 10 })
      expect(r.plays[0].hits).toHaveLength(1)
      expect(r.nonCrit).toBeCloseTo(4 * ATK * 1.1)
    })
    it('Agony: one Fixed hit of 50% per stack', () => {
      const r = play(AGONY, { 'Agony on target': 6 })
      expect(r.plays[0].hits).toHaveLength(6)
      expect(r.nonCrit).toBeCloseTo(6 * 0.5 * ATK * 1.1)
    })
    it('E4 Shard Erosion raises both ticks (fixedDot reaches Agony); E6 makes it 10%', () => {
      expect(play(AGONY, { 'Agony on target': 6, 'Shard Erosion': 3 }, 4).nonCrit).toBeCloseTo(6 * 0.5 * ATK * 1.1 * 1.18)
      expect(play(FRACTURE, { 'Fracture on target': 10, 'Shard Erosion': 3 }, 4).nonCrit).toBeCloseTo(4 * ATK * 1.1 * 1.18)
      expect(play(AGONY, { 'Agony on target': 6, 'Shard Erosion': 5 }, 6).nonCrit).toBeCloseTo(6 * 0.5 * ATK * 1.1 * 1.5)
    })
    it("Insatiable Cravings V raises Fracture but not Agony", () => {
      const cravings = ['card-1349']
      expect(play(FRACTURE, { 'Fracture on target': 10, 'Harmful effects applied this turn': 10 }, 0, cravings).nonCrit).toBeCloseTo(4 * ATK * 1.1 * 1.1)
      expect(play(AGONY, { 'Agony on target': 6, 'Harmful effects applied this turn': 10 }, 0, cravings).nonCrit).toBeCloseTo(6 * 0.5 * ATK * 1.1)
    })
  })
})
