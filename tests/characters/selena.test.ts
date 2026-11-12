import { describe, expect, it } from 'vitest'
import { computeBuild, shownPct } from '../../src/engine/calc'
import { renderCardText } from '../../src/engine/cardText'
import { activeBuffs } from '../../src/engine/buffs'
import { PRESETS } from '../../src/data/presets'
import { newCharacterSave } from '../../src/store/save'
import { cardFromPreset, settings } from '../helpers'

describe('Selena', () => {
  const selena = PRESETS.characters.find((c) => c.name === 'Selena')!
  const preset = (id: string) => selena.cards!.find((p) => p.id === id)!
  // Owner's screenshots (2026-10-28): E6, Basic and Unique 6/16 (0 + 6 from E3 and E5: x1.12), 3-1, 5-1 and 7 locked
  const ownerBuild = () => {
    const cs = newCharacterSave()
    const [a] = cs.builds
    Object.assign(a, { egoLevel: 6 })
    a.stats.attack = 100
    a.presetSwitches['Selena|p5-1-fire'] = false
    return { cs, a }
  }

  it("card text matches the owner's in-game screenshots", () => {
    const { a } = ownerBuild()
    const text = (id: string) => {
      const p = preset(id)
      const c = cardFromPreset(p, 'Passion')
      const buffs = activeBuffs(PRESETS, 'Selena', a, settings)
      return renderCardText(p.text, { egoLevel: a.egoLevel, nodeOn: () => true, pct: (base, fixed) => shownPct(base, c, a, selena, buffs, settings, fixed) })
    }
    expect(text('card-394')).toBe('350% Damage\n4 Mark')
    expect(text('card-395')).toBe('112% Damage')
    expect(text('card-396')).toBe('112% Shield')
    expect(text('card-403')).toBe('168% Damage\nAttunement: 1 Mark to a random enemy')
    expect(text('card-404')).toBe('112% Damage\nAttunement: 300% Damage to a random enemy')
    expect(text('card-406')).toBe('168% Shield\n2 Mark to all enemies')
    expect(text('card-409')).toBe('134% Damage to all enemies, 1 Passion Weakness')
    expect(text('card-416')).toBe('252% Shield\n3 Tenacity Damage')
    expect(text('card-417')).toContain('168% Damage')
    expect(text('card-421')).toBe('[Unique / Initiation]\n+80% Mark Damage')
  })

  it('Mark: every Attack Card play with Mark adds her 100% Extra Attack (+80% Sniper, +20% E2) and E6 30% of 100%', () => {
    const { a } = ownerBuild()
    a.deck.push({ id: 'ef', preset: 'card-395' }, { id: 'sd', preset: 'card-421' }, { id: 'hps', preset: 'card-400' }, { id: 'sk', preset: 'card-397' })
    a.rotation = [{ cardId: 'ef', stacks: { Mark: 2 } }, { cardId: 'ef' }, { cardId: 'ef', stacks: { Mark: 1, 'High-Power Scope III': 1 } },
      { cardId: 'sk', stacks: { Mark: 1 } }, { cardId: 'auto:card-394', stacks: { Mark: 1 } }]
    const r = computeBuild(PRESETS, 'Selena', a, settings)
    const own = 1.12 * 100 * 0.35
    expect(r.plays[0].triggered.map((t) => t.card.name)).toEqual(['Mark', 'Mark (E6 Extra Attack)'])
    expect(r.plays[0].triggered[0].nonCrit).toBeCloseTo((1 + 0.8 + 0.2) * 35)
    expect(r.plays[0].triggered[1].nonCrit).toBeCloseTo(0.3 * 35)
    expect(r.plays[0].nonCrit).toBeCloseTo(own + 2 * 35 + 0.3 * 35)
    expect(r.plays[1].triggered).toEqual([])
    // High-Power Scope III: +50% Mark Damage on that turn's plays
    expect(r.plays[2].triggered[0].nonCrit).toBeCloseTo(2.5 * 35)
    // A Skill card doesn't activate Mark; the Ego skill (a Skill) neither
    expect(r.plays[3].triggered).toEqual([])
    expect(r.plays[4].triggered).toEqual([])
    expect(r.plays[4].nonCrit).toBeCloseTo((3 + 0.5) * 35)
  })

  it('Coordinated Attacks: Drone Bombing V on Passion Attack Cards, IV on Weakness Attacks; Target Spotted I Attunement play', () => {
    const { a } = ownerBuild()
    a.egoLevel = 0
    a.deck.push({ id: 'ef', preset: 'card-395' }, { id: 'db5', preset: 'card-414' }, { id: 'db', preset: 'card-409' },
      { id: 'db4', preset: 'card-413' }, { id: 'ts1', preset: 'card-404' })
    a.rotation = [{ cardId: 'ef' }, { cardId: 'ef', stacks: { 'Drone Bombing IV': 1 } },
      { cardId: 'ef', stacks: { 'Drone Bombing IV': 1, 'Passion Weakness': 1 } }, { cardId: 'auto:ts-attunement' }]
    const r = computeBuild(PRESETS, 'Selena', a, settings)
    expect(r.plays[0].triggered.map((t) => [t.card.name, t.nonCrit])).toEqual([['Coordinated Attack (Drone Bombing V)', 0.5 * 35]])
    expect(r.plays[1].triggered).toHaveLength(1)
    // Passion Weakness makes Passion hits Weakness Attacks (x1.25, the Coordinated Attacks too); that sets off Drone Bombing IV
    expect(r.plays[2].nonCrit).toBeCloseTo(1.25 * 35 + 0.5 * 1.25 * 35 + 1.25 * 35)
    // An effect's damage: no card upgrade, and it sets off no Attack Card trigger
    expect(r.plays[3].nonCrit).toBeCloseTo(3 * 35)
    expect(r.plays[3].triggered).toEqual([])
  })
})
