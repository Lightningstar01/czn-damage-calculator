import { describe, expect, it } from 'vitest'
import { computeBuild, shownPct } from '../../src/engine/calc'
import { renderCardText } from '../../src/engine/cardText'
import { activeBuffs } from '../../src/engine/buffs'
import { PRESETS } from '../../src/data/presets'
import { newCharacterSave } from '../../src/store/save'
import { cardFromPreset, settings } from '../helpers'

describe('Yuki', () => {
  const yuki = PRESETS.characters.find((c) => c.name === 'Yuki')!
  const preset = (id: string) => yuki.cards!.find((p) => p.id === id)!
  // Owner's screenshots (2026-10-30): E0, Basic 1 (x1.02), Signature 6 (x1.12), 3-1 and 7 unlocked, 5-1 locked, Attack 830
  const ownerBuild = (attack = 830) => {
    const cs = newCharacterSave()
    const [a] = cs.builds
    Object.assign(a, { egoLevel: 0, basicLevel: 1, signatureLevel: 6 })
    a.stats.attack = attack
    a.presetSwitches['Yuki|p5-1-basic'] = false
    return { cs, a }
  }
  const atk = 830 * 0.35

  it("card text matches the owner's in-game screenshots", () => {
    const { cs, a } = ownerBuild()
    const text = (id: string) => {
      const p = preset(id)
      const c = cardFromPreset(p, 'Order')
      const buffs = activeBuffs(PRESETS, 'Yuki', cs, a, settings)
      return renderCardText(p.text, { egoLevel: a.egoLevel, nodeOn: () => true, pct: (base, fixed) => shownPct(base, c, a, yuki, buffs, settings, fixed) })
    }
    const single = 'If there is only a single target, increase Damage Amount by 50%'
    expect(text('card-745')).toBe('450% Damage to all enemies\nMove all Attack Cards of this unit in hand to the top of Draw Pile\n'
      + '+100% base Damage Amount for each card moved to top of Draw Pile')
    expect(text('card-746')).toBe('102% Damage\nInspiration: Decrease Cost by 1')
    expect(text('card-747')).toBe('224% Damage\nInspiration: Increase Damage Amount by 30%')
    expect(text('card-748')).toBe('102% Shield')
    expect(text('card-756')).toBe(`258% Damage to all enemies\n${single}\nInspiration: Decrease Cost by 1`)
    expect(text('card-757')).toBe(`381% Damage to all enemies\n${single}\nInspiration: Decrease Cost by 1`)
    expect(text('card-759')).toBe(`258% Damage to all enemies\n${single}\nInspiration: Add 1 Hit`)
    expect(text('card-760')).toContain('459% Damage')
    expect(text('card-761')).toContain('414% Damage to all enemies')
    expect(text('card-762')).toContain('202% Damage')
    expect(text('card-763')).toContain('269% Damage')
    expect(text('card-766')).toContain('202% Damage')
    expect(text('card-767')).toBe('224% Damage\nInspiration: Add 1 Hit')
    expect(text('card-768')).toContain('120% Damage to all enemies')
    expect(text('card-774')).toBe('213% Damage to all enemies\nInspiration: Add 1 Hit')
  })

  it('Inspiration adds the hit and sets off Freezing Blade, skipped by Attack Card buffs; a Rapid Slash gets 30%', () => {
    const { cs, a } = ownerBuild()
    a.deck.push({ id: 'ice', preset: 'card-774' }, { id: 'fb', preset: 'card-768' }, { id: 'rs', preset: 'card-747' }, { id: 'ps', preset: 'card-750' })
    a.rotation = [{ cardId: 'ice' }, { cardId: 'ice', stacks: { Inspiration: 1, 'Prepare to Subdue': 1 } }, { cardId: 'rs', stacks: { Inspiration: 1 } },
      { cardId: 'ice', hits: 5, stacks: { Inspiration: 1 } }]
    const [off, on, rapid, set] = computeBuild(PRESETS, 'Yuki', cs, a, settings).plays
    const ice = 1.9 * 1.12 * atk
    expect(off.hits.length).toBe(1)
    expect(off.triggered).toEqual([])
    expect(on.hits.length).toBe(2)
    expect(on.hits[1].nonCrit).toBeCloseTo(ice * 1.4)
    expect(on.triggered[0].card.name).toBe('Freezing Blade (hit)')
    expect(on.triggered[0].nonCrit).toBeCloseTo(1.2 * atk)
    expect(rapid.hits[0].nonCrit).toBeCloseTo(2.2 * 1.02 * 1.3 * atk)
    expect(set.hits.length).toBe(5)
  })

  it('Potential 7: +5 at Attack 600, +1 per 20 above it, at most +10', () => {
    const flash = (attack: number) => {
      const { cs, a } = ownerBuild(attack)
      a.deck.push({ id: 'fs', preset: 'card-756' })
      a.rotation = [{ cardId: 'fs' }]
      const r = computeBuild(PRESETS, 'Yuki', cs, a, settings).plays[0].hits[0]
      return r.cardPct
    }
    expect(flash(599)).toBeCloseTo(2.2)
    expect(flash(600)).toBeCloseTo(2.25)
    expect(flash(640)).toBeCloseTo(2.27)
    expect(flash(830)).toBeCloseTo(2.3)
  })

  it('Flash Slash IV, Freezing Blade IV, the Ego skill per card and Sword Dance', () => {
    const { cs, a } = ownerBuild()
    a.deck.push({ id: 'iv', preset: 'card-760' }, { id: 'fs', preset: 'card-756' }, { id: 'fb', preset: 'card-772' })
    a.rotation = [{ cardId: 'iv', stacks: { 'Cards Drawn this turn': 9 } }, { cardId: 'fs' }, { cardId: 'auto:card-745', stacks: { 'Cards moved to Draw Pile': 2 } }]
    const [iv, fs, ego] = computeBuild(PRESETS, 'Yuki', cs, a, settings).plays
    expect(iv.hits[0].nonCrit).toBeCloseTo((4.1 * 1.12 + 1.5 * 5) * atk)
    // Summed multipliers: 50% single target + 50% All-Target
    expect(fs.hits[0].nonCrit).toBeCloseTo(2.3 * 1.12 * 2 * atk)
    expect(ego.hits[0].nonCrit).toBeCloseTo((4.5 + 2) * atk)
    a.egoLevel = 6
    a.rotation = [{ cardId: 'fs', stacks: { 'Sword Dance': 9, 'Swiftblade Flurry': 1 } }, { cardId: 'auto:card-745', stacks: { 'Cards moved to Draw Pile': 2 } }]
    const [e6, ego6] = computeBuild(PRESETS, 'Yuki', cs, a, settings).plays
    // E5 adds 3 levels: Signature x1.18. 15% x 4 Sword Dance + 20% Swiftblade Flurry + 50% + 50%
    expect(e6.hits[0].nonCrit).toBeCloseTo(2.3 * 1.18 * (1 + 0.6 + 0.2 + 1) * atk)
    expect(ego6.hits[0].nonCrit).toBeCloseTo((4.5 + 3 + 1.5) * atk)
  })
})
