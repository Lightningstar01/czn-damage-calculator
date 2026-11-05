import { describe, expect, it } from 'vitest'
import { computeBuild, shownPct } from '../../src/engine/calc'
import { renderCardText } from '../../src/engine/cardText'
import { activeBuffs } from '../../src/engine/buffs'
import { PRESETS } from '../../src/data/presets'
import { newCharacterSave, newTeammate } from '../../src/store/save'
import { cardFromPreset, settings } from '../helpers'

describe('Owen', () => {
  const owen = PRESETS.characters.find((c) => c.name === 'Owen')!
  const preset = (id: string) => owen.cards!.find((p) => p.id === id)!
  // Owner's screenshots (2026-11-01): E4, Basic and Unique 3/13 (0 + 3 from E3: x1.06), 3-1, 5-1 and 7 locked
  const ownerBuild = () => {
    const cs = newCharacterSave()
    const [a] = cs.builds
    Object.assign(a, { egoLevel: 4, potentialNodes: { '3-1': false, '5-1': false, 7: false } })
    a.stats.attack = 100
    return { cs, a }
  }
  const up = 1.06
  const atk = 100 * 0.35

  it("card text matches the owner's in-game screenshots", () => {
    const { cs, a } = ownerBuild()
    const text = (id: string) => {
      const p = preset(id)
      const c = cardFromPreset(p, 'Passion')
      const buffs = activeBuffs(PRESETS, 'Owen', cs, a, settings)
      return renderCardText(p.text, { egoLevel: a.egoLevel, nodeOn: () => true, pct: (base, fixed) => shownPct(base, c, a, owen, buffs, settings, fixed) })
    }
    expect(text('card-365')).toBe('300% Damage\n300% Shield')
    expect(text('card-366')).toBe('106% Damage')
    expect(text('card-367')).toBe('106% Shield')
    expect(text('card-368')).toBe('Add 1 Hit(s) to the next Attack Card of this unit activated')
    expect(text('card-370')).toBe('Add 1 Hit(s) to the next Attack Card activated\nDecrease Damage Amount by 25%')
    expect(text('card-374')).toBe('297% Damage to all enemies')
    expect(text('card-376')).toBe('159% Damage × 3')
    expect(text('card-378')).toBe('At the start of the turn, decrease AP by 1\nAt the end of the turn, 280% Damage to all enemies')
    expect(text('card-380')).toBe('148% Damage\n2 Vulnerable')
    expect(text('card-381')).toBe('223% Damage\nDecrease Fortitude by 4 for 1 turn')
    expect(text('card-383')).toContain('223% Damage')
    expect(text('card-385')).toContain('148% Damage\n3 Vulnerable')
    expect(text('card-386')).toBe('159% Shield\nMove Wind Charge from Discard Pile to hand')
    expect(text('card-387')).toContain('233% Shield')
    expect(text('card-388')).toBe('When Wind Charge is activated, 120% Shield\n120% Damage to all enemies')
    expect(text('card-391')).toBe('233% Shield\nIf Wind Charge is activated this turn, gain additional 233% Shield')
    expect(text('card-392')).toBe('371% Damage\n191% Shield')
  })

  it('E1 and E4 raise the shown %s: Gale Strike (300% + 50%) x 1.06, Raging Storm 250% + 50%', () => {
    const { cs, a } = ownerBuild()
    a.deck.push({ id: 'gs', preset: 'card-392' })
    a.rotation = [{ cardId: 'gs' }, { cardId: 'auto:card-365' }]
    const r = computeBuild(PRESETS, 'Owen', cs, a, settings)
    expect(r.plays[0].nonCrit).toBeCloseTo(3.5 * up * atk)
    expect(r.plays[1].nonCrit).toBeCloseTo(3 * atk)
  })

  it('Downward Cut: 3-1 and 5-1 add before the upgrade, 5-1 doubles at Health 600', () => {
    const { cs, a } = ownerBuild()
    a.potentialNodes = {}
    a.stats.health = 600
    a.deck.push({ id: 'dc', preset: 'card-366' })
    a.rotation = [{ cardId: 'dc' }]
    expect(computeBuild(PRESETS, 'Owen', cs, a, settings).plays[0].nonCrit).toBeCloseTo((1 + 0.3 + 0.1) * up * atk)
    a.stats.health = 599
    expect(computeBuild(PRESETS, 'Owen', cs, a, settings).plays[0].nonCrit).toBeCloseTo((1 + 0.3 + 0.05) * up * atk)
  })

  it('Wind Charge II / V: the decrease is on the play switched on, with the hits set on it', () => {
    const { cs, a } = ownerBuild()
    a.deck.push({ id: 'dc', preset: 'card-366' }, { id: 'w2', preset: 'card-370' }, { id: 'w5', preset: 'card-373' })
    a.rotation = [{ cardId: 'dc', hits: 2, stacks: { 'Wind Charge II': 1 } }, { cardId: 'dc', hits: 4, stacks: { 'Wind Charge V': 1 } }, { cardId: 'dc' }]
    const r = computeBuild(PRESETS, 'Owen', cs, a, settings)
    expect(r.plays[0].nonCrit).toBeCloseTo(2 * up * 0.75 * atk)
    expect(r.plays[1].nonCrit).toBeCloseTo(4 * up * 0.5 * atk)
    expect(r.plays[2].nonCrit).toBeCloseTo(up * atk)
  })

  it("Wind Charge II's decrease reaches a teammate's next Attack Card, V's doesn't", () => {
    const { cs, a } = ownerBuild()
    const ml = newCharacterSave()
    ml.builds[0].stats.attack = 100
    a.deck.push({ id: 'w2', preset: 'card-370' }, { id: 'w5', preset: 'card-373' })
    a.team = [{ ...newTeammate(), character: 'Mei Lin', cards: ['card-338'] }]
    a.rotation = [{ cardId: 'card-338', by: 0 }, { cardId: 'card-338', by: 0, stacks: { 'Wind Charge II': 1 } }, { cardId: 'card-338', by: 0, stacks: { 'Wind Charge V': 1 } }]
    const r = computeBuild(PRESETS, 'Owen', cs, a, settings, { 'Mei Lin': ml })
    expect(r.plays[0].nonCrit).toBeCloseTo(1.05 * 100 * 0.35)   // Mei Lin's Strike: 100% + her 5-1's +5% (Attack under 500)
    expect(r.plays[1].nonCrit).toBeCloseTo(r.plays[0].nonCrit * 0.75)
    expect(r.plays[2].nonCrit).toBeCloseTo(r.plays[0].nonCrit)
  })

  it("Wind Charge III: 30% of one more hit on Owen's own Attack plays, without first-hit buffs", () => {
    const { cs, a } = ownerBuild()
    const ml = newCharacterSave()
    ml.builds[0].stats.attack = 100
    a.deck.push({ id: 'dc', preset: 'card-366' }, { id: 'w3', preset: 'card-371' }, { id: 'wb', preset: 'card-367' }, { id: 'wc', preset: 'card-378' })
    a.team = [{ ...newTeammate(), character: 'Mei Lin', cards: ['card-338'] }]
    a.rotation = [{ cardId: 'dc', hits: 2 }, { cardId: 'wb' }, { cardId: 'wc' }, { cardId: 'card-338', by: 0 }]
    const r = computeBuild(PRESETS, 'Owen', cs, a, settings, { 'Mei Lin': ml })
    expect(r.plays[0].triggered).toHaveLength(1)
    expect(r.plays[0].triggered[0].chance).toBe(0.3)
    expect(r.plays[0].triggered[0].hits[0].hitNo).toBe(3)
    expect(r.plays[0].nonCrit).toBeCloseTo((2 + 0.3) * up * atk)
    // A Skill, an effect hit and a teammate's Attack Card add nothing
    expect(r.plays[1].triggered).toEqual([])
    expect(r.plays[2].triggered).toEqual([])
    expect(r.plays[3].triggered).toEqual([])
  })

  it('Wind Charge III adds nothing to a play set to 0 hits', () => {
    const { cs, a } = ownerBuild()
    a.deck.push({ id: 'dc', preset: 'card-366' }, { id: 'w3', preset: 'card-371' })
    a.rotation = [{ cardId: 'dc', hits: 0 }]
    const r = computeBuild(PRESETS, 'Owen', cs, a, settings)
    expect(r.plays[0].triggered).toEqual([])
    expect(r.plays[0].expected).toBe(0)
  })

  it('effect hits are unraised: Wind Riding II on each Wind Charge, Wind Slash IV per turn, E2 per move to hand', () => {
    const { cs, a } = ownerBuild()
    a.deck.push({ id: 'wr', preset: 'card-388' }, { id: 'wc', preset: 'card-368' }, { id: 'w1', preset: 'card-369' }, { id: 'ws', preset: 'card-378' }, { id: 'dc', preset: 'card-366' })
    a.rotation = [{ cardId: 'wr' }, { cardId: 'wc' }, { cardId: 'w1' }, { cardId: 'dc' }, { cardId: 'ws' }, { cardId: 'auto:e2-hit' }]
    const r = computeBuild(PRESETS, 'Owen', cs, a, settings)
    expect(r.plays[0].nonCrit).toBe(0)
    expect(r.plays[1].nonCrit).toBeCloseTo(1.2 * atk)
    expect(r.plays[2].nonCrit).toBeCloseTo(1.2 * atk)
    expect(r.plays[3].triggered).toEqual([])
    expect(r.plays[4].nonCrit).toBeCloseTo(2.8 * atk)
    expect(r.plays[5].nonCrit).toBeCloseTo(0.8 * atk)
  })

  it('the E2 hit joins the deck from E2, E6 adds +20% per Wind Charge this turn', () => {
    const { cs, a } = ownerBuild()
    a.egoLevel = 1
    a.rotation = [{ cardId: 'auto:e2-hit' }]
    expect(computeBuild(PRESETS, 'Owen', cs, a, settings).plays).toHaveLength(0)
    a.egoLevel = 6
    a.deck.push({ id: 'dc', preset: 'card-366' })
    a.rotation = [{ cardId: 'dc', stacks: { 'Wind Charges this turn': 2 } }]
    // E3 and E5: +6 levels
    expect(computeBuild(PRESETS, 'Owen', cs, a, settings).plays[0].nonCrit).toBeCloseTo((1.12 + 0.4) * atk)
  })

  it('Break Armor: I +80% on the target (additive), III and IV x1.3 on their own plays', () => {
    const { cs, a } = ownerBuild()
    a.deck.push({ id: 'b1', preset: 'card-381' }, { id: 'b3', preset: 'card-383' }, { id: 'b4', preset: 'card-384' }, { id: 'dc', preset: 'card-366' })
    a.rotation = [{ cardId: 'dc', stacks: { 'Fortitude decreased': 1 } }, { cardId: 'b3', stacks: { 'Target in a Vulnerable state': 1 } }, { cardId: 'b4', stacks: { 'Target has Shield': 1 } }, { cardId: 'b3', vulnerable: true }]
    const r = computeBuild(PRESETS, 'Owen', cs, a, settings)
    expect(r.plays[0].nonCrit).toBeCloseTo((up + 0.8) * atk)
    expect(r.plays[1].nonCrit).toBeCloseTo(2.1 * up * 1.3 * atk)
    expect(r.plays[2].nonCrit).toBeCloseTo(2.1 * up * 1.3 * atk)
    expect(r.plays[3].nonCrit).toBeCloseTo(2.1 * up * 1.5 * atk)
  })
})
