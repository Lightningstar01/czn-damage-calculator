import { describe, expect, it } from 'vitest'
import { computeBuild, shownPct } from '../../src/engine/calc'
import { renderCardText } from '../../src/engine/cardText'
import { activeBuffs } from '../../src/engine/buffs'
import { PRESETS } from '../../src/data/presets'
import { newCharacterSave } from '../../src/store/save'
import { cardFromPreset, settings } from '../helpers'

describe('Fei', () => {
  const fei = PRESETS.characters.find((c) => c.name === 'Fei')!
  const preset = (id: string) => fei.cards!.find((p) => p.id === id)!
  // Screenshots (2026-11-09): the Combatant Archive preview, Lv 1, no card upgrades, no Potential node, no Ego level
  const archiveBuild = () => {
    const cs = newCharacterSave()
    const [a] = cs.builds
    a.stats.attack = 100
    a.presetSwitches['Fei|p5-1-azure'] = false
    return { cs, a }
  }

  it('card text matches the in-game screenshots', () => {
    const { cs, a } = archiveBuild()
    const text = (id: string, nodeOn = false) => {
      const p = preset(id)
      const c = cardFromPreset(p, 'Void')
      const buffs = activeBuffs(PRESETS, 'Fei', cs, a, settings)
      return renderCardText(p.text, { egoLevel: a.egoLevel, nodeOn: () => nodeOn, pct: (base, fixed) => shownPct(base, c, a, fei, buffs, settings, fixed) })
    }
    expect(text('card-1199')).toBe('8 Descent\nFor 2 turn(s), at the start of the turn, 8 Descent\nIncrease Damage Amount of the next Heavensfall by 100%')
    expect(text('card-1200')).toBe('100% Damage')
    expect(text('card-1200', true)).toBe('100% Damage\n1 Flame Arts')
    expect(text('card-1202')).toBe('[Initiation / Unique]\nOn Draw through an ability, 1 Descent\nCreate 8 Inferno Rhapsody in Draw Pile')
    expect(text('card-1207')).toBe('[Initiation / Unique]\nOn Draw through an ability, 1 Descent\nCreate 6 Inferno Rhapsody: Heaven in Draw Pile')
    expect(text('card-1222')).toBe('[Unique]\n100% Damage × X+1\nProc Inferno Rhapsody in Graveyard on the target for each Hit Count')
    expect(text('card-1223')).toContain('150% Damage × X+1')
    expect(text('card-1226')).toBe('[Exhaust / Unique]\nMove Inferno Rhapsody to hand for each Descent gained this turn')
    expect(text('card-1227')).toBe('[Ephemeral / Exhaust]\n100% Damage × 3')
    expect(text('card-1228')).toBe('70% Damage\n1 Flame Arts\nWhen Flame Arts is activated through this card, Draw 1')
    expect(text('card-1229')).toBe('110% Damage\n1 Flame Arts\nWhen Flame Arts is activated through this card, 3 Descent')
    expect(preset('card-1225').cost).toBe(2)
  })

  it("Flame Arts: a 120% Extra Attack play; Soulfire Dance V adds a hit, Exorcist's Formation IV adds 100%, E6 +120%", () => {
    const { cs, a } = archiveBuild()
    a.deck.push({ id: 'ef4', preset: 'card-1206' }, { id: 'sd5', preset: 'card-1225' })
    a.rotation = [{ cardId: 'auto:flame-arts' }, { cardId: 'auto:flame-arts', stacks: { 'Soulfire Dance V': 1 } }]
    let r = computeBuild(PRESETS, 'Fei', cs, a, settings)
    expect(r.plays[0].hits).toHaveLength(1)
    expect(r.plays[0].triggered.map((t) => [t.card.name, t.nonCrit])).toEqual([["Exorcist's Formation IV (Extra Attack)", 35]])
    expect(r.plays[0].nonCrit).toBeCloseTo(1.2 * 35 + 35)
    expect(r.plays[1].hits).toHaveLength(2)
    expect(r.plays[1].nonCrit).toBeCloseTo(2 * 1.2 * 35 + 35)
    a.egoLevel = 6
    r = computeBuild(PRESETS, 'Fei', cs, a, settings)
    expect(r.plays[0].nonCrit).toBeCloseTo(2.4 * 35 + 35)
  })

  it('Heavensfall: Heavenscleaver 100% and Soulfire Dance III 50% per hit multiply, E4 +80%, E3 +2 and Judgment +3 hits', () => {
    const { cs, a } = archiveBuild()
    a.egoLevel = 4
    a.deck.push({ id: 'ef', preset: 'card-1202' }, { id: 'sd3', preset: 'card-1223' })
    a.rotation = [
      { cardId: 'auto:card-1227' },
      { cardId: 'auto:card-1227', stacks: { Heavenscleaver: 1, 'Soulfire Dance III hits': 4, 'Heavenscleaver E3 (+2 Hits)': 1, 'Judgment Upon the Wicked': 1 } },
    ]
    const r = computeBuild(PRESETS, 'Fei', cs, a, settings)
    expect(r.plays[0].hits).toHaveLength(3)
    expect(r.plays[0].nonCrit).toBeCloseTo(3 * (1 + 0.8) * 35)
    // Summed MultFactor: 1 + 100% + 4 x 50% = 4
    expect(r.plays[1].hits).toHaveLength(8)
    expect(r.plays[1].nonCrit).toBeCloseTo(8 * (1 * 4 + 0.8) * 35)
  })

  it("Inferno Rhapsody: Exorcist's Formation I +50%, E1 Blazing War Dance 100% when moved to hand", () => {
    const { cs, a } = archiveBuild()
    a.egoLevel = 1
    a.deck.push({ id: 'ef1', preset: 'card-1203' }, { id: 'bwd', preset: 'card-1226' })
    a.rotation = [{ cardId: 'auto:card-1228' }, { cardId: 'auto:card-1228', stacks: { 'Moved by Blazing War Dance': 1 } }]
    const r = computeBuild(PRESETS, 'Fei', cs, a, settings)
    expect(r.plays[0].nonCrit).toBeCloseTo((0.7 + 0.5) * 35)
    expect(r.plays[1].nonCrit).toBeCloseTo((0.7 * 2 + 0.5) * 35)
  })
})
