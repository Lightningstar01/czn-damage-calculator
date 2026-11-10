import { describe, expect, it } from 'vitest'
import { computeBuild, shownPct } from '../../src/engine/calc'
import { renderCardText } from '../../src/engine/cardText'
import { activeBuffs } from '../../src/engine/buffs'
import { PRESETS } from '../../src/data/presets'
import { newCharacterSave } from '../../src/store/save'
import { cardFromPreset, gameSettings, settings } from '../helpers'

describe('Kayron', () => {
  const kayron = PRESETS.characters.find((c) => c.name === 'Kayron')!
  const preset = (id: string) => kayron.cards!.find((p) => p.id === id)!
  // Owner's screenshots (2026-11-09): Kayron locked, Lv. 1, every Potential at 0, Ego level 0
  const ownerBuild = () => {
    const cs = newCharacterSave()
    const [a] = cs.builds
    Object.assign(a, { egoLevel: 0, basicLevel: 0, signatureLevel: 0 })
    a.potentialNodes = { '3-1': false, '5-1': false, '7': false }
    a.stats.attack = 100
    return { cs, a }
  }
  const sum = (xs: { nonCrit: number }[]) => xs.reduce((s, t) => s + t.nonCrit, 0)

  it("card text matches the owner's in-game screenshots", () => {
    const { cs, a } = ownerBuild()
    const text = (id: string) => {
      const p = preset(id)
      const c = cardFromPreset(p, 'Void')
      const buffs = activeBuffs(PRESETS, 'Kayron', cs, a, gameSettings)
      return renderCardText(p.text, { egoLevel: a.egoLevel, nodeOn: (n) => a.potentialNodes?.[n] !== false,
        pct: (base, fixed) => shownPct(base, c, a, kayron, buffs, gameSettings, fixed) })
    }
    expect(text('card-187')).toBe('200% Damage to all enemies\nExhaust all Futility in hand\n+80% base Damage Amount for each Exhausted')
    expect(text('card-188')).toBe('100% Damage')
    expect(text('card-189')).toBe('Heal 100%')
    expect(text('card-190')).toBe('320% Damage\nCreate 2 Futility')
    expect(text('card-196')).toBe('400% Damage to all enemies\nWhen a card is Exhausted, decrease Cost of this card by 1 for 1 turn until activated')
    expect(text('card-202')).toBe('240% Damage\n+40% base Damage Amount for each Futility Exhausted')
    expect(text('card-207')).toBe('When Futility is Exhausted, 100% Fixed Damage to a random enemy')
    expect(text('card-208')).toBe('[Unique]\nWhen Futility is created, change those cards into 1-Cost Attack Cards with 100% Damage and Heal effects')
    expect(text('card-209')).toContain('with 150% Damage and Heal effects')
    expect(text('card-211')).toContain('with 200% Damage')
    expect(text('card-214')).toBe('240% Damage\nCreate 3 Futility\n+40 base Damage Amount for each created')
    expect(text('card-216')).toBe('[Exhaust]\n100% Damage\nHeal 100%')
    // 3-1 on: +50% to Elimination and Sphere, and a Futility each
    a.potentialNodes = { '5-1': false, '7': false }
    expect(text('card-188')).toBe('150% Damage\nCreate 1 Futility')
    expect(text('card-189')).toBe('Heal 150%\nCreate 1 Futility')
  })

  it('Black Hole III / IV take their added hits from Futility Exhausted (per stacks, capped)', () => {
    const { cs, a } = ownerBuild()
    a.deck.push({ id: 'b3', preset: 'card-205' }, { id: 'b4', preset: 'card-206' })
    const hits = (cardId: string, n: number) => {
      a.rotation = [{ cardId, stacks: { 'Futility Exhausted': n } }]
      return computeBuild(PRESETS, 'Kayron', cs, a, settings).plays[0].hits.length
    }
    expect(hits('b3', 0)).toBe(1)
    expect(hits('b3', 3)).toBe(4)
    expect(hits('b3', 9)).toBe(6)
    expect(hits('b4', 4)).toBe(1)
    expect(hits('b4', 10)).toBe(3)
    expect(hits('b4', 20)).toBe(3)
  })

  it("Black Hole V: a 100% Fixed hit per Futility play, and per Futility the Ego skill Exhausts; the Ego skill's +80% each", () => {
    const { cs, a } = ownerBuild()
    a.deck.push({ id: 'b5', preset: 'card-207' }, { id: 'oath', preset: 'card-208' })
    a.rotation = [{ cardId: 'auto:card-216' }, { cardId: 'auto:card-187', stacks: { 'Futility Exhausted by this card': 3 } }]
    const r = computeBuild(PRESETS, 'Kayron', cs, a, settings)
    expect(r.plays[0].triggered).toHaveLength(1)
    expect(sum(r.plays[0].triggered)).toBeCloseTo(35)
    expect(r.plays[0].nonCrit).toBeCloseTo(35 + 35)
    // one triggered entry with a hit per Futility Exhausted
    expect(r.plays[1].triggered.flatMap((t) => t.hits)).toHaveLength(3)
    expect(sum(r.plays[1].triggered)).toBeCloseTo(3 * 35)
    expect(r.plays[1].nonCrit).toBeCloseTo((2 + 3 * 0.8) * 35 + 3 * 35)
  })

  it('Echoes of True Abyss: +120% base (3 created), +200% from E1 (5); E4 +10% per Echo of Paradox on Attack cards', () => {
    const { cs, a } = ownerBuild()
    a.deck.push({ id: 'abyss', preset: 'card-214' }, { id: 'elim', preset: 'card-188' })
    a.rotation = [{ cardId: 'abyss' }]
    expect(computeBuild(PRESETS, 'Kayron', cs, a, settings).plays[0].nonCrit).toBeCloseTo((2.4 + 1.2) * 35)
    a.egoLevel = 1
    expect(computeBuild(PRESETS, 'Kayron', cs, a, settings).plays[0].nonCrit).toBeCloseTo((2.4 + 2) * 35)
    a.egoLevel = 4
    a.rotation = [{ cardId: 'elim', stacks: { 'Echo of Paradox': 2 } }]
    expect(computeBuild(PRESETS, 'Kayron', cs, a, settings).plays[0].nonCrit).toBeCloseTo((1 + 0.2) * 35)
  })
})
