import { describe, expect, it } from 'vitest'
import { computeBuild, shownPct } from '../../src/engine/calc'
import { renderCardText } from '../../src/engine/cardText'
import { activeBuffs } from '../../src/engine/buffs'
import { PRESETS } from '../../src/data/presets'
import { newCharacterSave } from '../../src/store/save'
import { type Build, type RotationPlay } from '../../src/engine/types'
import { cardFromPreset, settings } from '../helpers'

describe('Sereniel', () => {
  const sereniel = PRESETS.characters.find((c) => c.name === 'Sereniel')!
  const preset = (id: string) => sereniel.cards!.find((p) => p.id === id)!
  // Owner's screenshots (2026-11-08): level 60, Attack 923, Critical 59.1% / 168.8%, Instinct 31%, E0, Basic level 1, Signature level 10,
  // 3-1 and 7 on, 5-1 locked
  const ownerBuild = () => {
    const cs = newCharacterSave()
    const [a] = cs.builds
    Object.assign(a, { egoLevel: 0, basicLevel: 1, signatureLevel: 10, potentialNodes: { '5-1': false } })
    Object.assign(a.stats, { attack: 923, defense: 199, health: 567, critChance: 0.591, critDmg: 1.688 })
    a.stats.elemDmg.Instinct = 0.31
    return { cs, a }
  }
  const damage = (id: string, play: Partial<RotationPlay> = {}, change: (a: Build) => void = () => {}) => {
    const { cs, a } = ownerBuild()
    a.deck.push({ id: 'c', preset: id })
    change(a)
    a.rotation = [{ cardId: 'c', ...play }]
    return computeBuild(PRESETS, 'Sereniel', cs, a, settings).plays[0].nonCrit
  }
  const text = (id: string, change: (a: Build) => void = () => {}) => {
    const { cs, a } = ownerBuild()
    change(a)
    const p = preset(id)
    const c = cardFromPreset(p, 'Instinct')
    const buffs = activeBuffs(PRESETS, 'Sereniel', cs, a, settings)
    return renderCardText(p.text, { egoLevel: a.egoLevel, nodeOn: (n) => a.potentialNodes?.[n] !== false, pct: (base, fixed) => shownPct(base, c, a, sereniel, buffs, settings, fixed) })
  }

  it("card text matches the owner's in-game screenshots", () => {
    expect(text('card-823')).toBe('500% Damage to all enemies\nMove all Homing Laser L in Exhaust Pile to hand')
    expect(text('card-824')).toBe('102% Damage\n50% chance to create 1 Homing Laser L')
    expect(text('card-825')).toBe('102% Shield')
    expect(text('card-826')).toBe('144% Damage\n2 Afterglow\nOn Ravage, move from Graveyard to hand')
    expect(text('card-827')).toBe('216% Damage\nOn Ravage, move to hand\nDestroy: Add 1 Hit(s)')
    expect(text('card-828')).toBe('216% Damage\n3 Afterglow\nOn Ravage, move to hand')
    expect(text('card-829')).toBe('270% Damage\n2 Afterglow\nCreate 2 Homing Laser L in Discard Pile')
    expect(text('card-830')).toBe('144% Damage\n1 Afterglow\nOn Ravage or at the start of the turn, move to hand')
    expect(text('card-831')).toBe('216% Damage\n2 Afterglow\nMove all Homing Laser L in Graveyard to hand')
    expect(text('card-832')).toBe('144% Damage\n0.5 Tenacity Damage\nIf the target is not Ravaged, proc 1 more time.')
    expect(text('card-833')).toContain('216% Damage\n1 Tenacity Damage')
    expect(text('card-834')).toContain('216% Damage\n+60% base Damage Amount')
    expect(text('card-835')).toBe('144% Damage\n2 Instinct Weakness\n+60% Damage Amount to Homing Laser for 1 turn(s)')
    expect(text('card-836')).toBe('144% Damage\nCreate 3 Homing Laser L in Draw Pile')
    expect(text('card-837')).toContain('[Unique]\nAt the end of the turn, 50% Damage to a random enemy')
    expect(text('card-844')).toBe('168% Damage × 4 to random enemies\n1 Tenacity Damage for each Hit')
    expect(text('card-845')).toContain('252% Damage × 4')
    expect(text('card-846')).toContain('[Retain]\n168% Damage × 4')
    expect(text('card-847')).toContain('168% Damage × 4')
    expect(text('card-848')).toContain('168% Damage to random enemies')
    expect(text('card-849')).toBe('[Weakness Attack]\n168% Damage × 4\nRavage: Proc 1 more time')
    expect(text('card-850')).toBe('180% Damage\nProc 3 Homing Laser in Draw Pile and Graveyard')
    expect(text('card-851')).toBe('[Exhaust 2]\n72% Damage\n1 Afterglow\nOn Ravage, move from Graveyard to hand')
    // Ego levels: E1's 5 procs, E3's 650% Death Halo; 5-1 on with Critical Chance 20%+: (100% + 10%) x 1.02
    expect(text('card-850', (a) => { a.egoLevel = 1 })).toContain('Proc 5 Homing Laser')
    expect(text('card-823', (a) => { a.egoLevel = 3 })).toContain('650% Damage')
    expect(text('card-824', (a) => { a.potentialNodes = {} })).toContain('112% Damage')
  })

  it('Afterglow adds +100% on a Ravaged target only', () => {
    const plain = damage('card-826', { ravaged: true })
    expect(damage('card-826', { ravaged: true, stacks: { Afterglow: 1 } }) / plain).toBeCloseTo((1.44 + 1) / 1.44)
    expect(damage('card-826', { stacks: { Afterglow: 1 } })).toBeCloseTo(damage('card-826'))
  })

  it("Homing Laser I's Destroy adds a hit on a Ravaged target", () => {
    expect(damage('card-827', { ravaged: true })).toBeCloseTo(2 * damage('card-827'))
    // The play's own hit count still wins
    expect(damage('card-827', { ravaged: true, hits: 1 })).toBeCloseTo(damage('card-827'))
  })

  it("Plasma Missile II adds +60% base per decreased Tenacity, max 10", () => {
    const base = damage('card-834')
    expect(damage('card-834', { stacks: { 'Decreased Tenacity': 10 } }) / base).toBeCloseTo((2.16 + 6) / 2.16)
    expect(damage('card-834', { stacks: { 'Decreased Tenacity': 12 } })).toBeCloseTo(damage('card-834', { stacks: { 'Decreased Tenacity': 10 } }))
  })

  it("E6: +20% Weakness DMG, and 80% x the target's max Tenacity on an ally's Ravage", () => {
    const e6 = (a: Build) => { a.egoLevel = 6 }
    const withStat = damage('card-849', {}, e6)
    const without = damage('card-849', {}, (a) => { e6(a); a.presetSwitches['Sereniel|e6-weakness'] = false })
    expect(withStat / without).toBeCloseTo(1.45 / 1.25)
    const ravage = (count: number) => {
      const { cs, a } = ownerBuild()
      e6(a)
      a.rotation = [{ cardId: 'auto:e6-ravage', stacks: { 'Max Tenacity of the target': count } }]
      return computeBuild(PRESETS, 'Sereniel', cs, a, settings).plays[0].nonCrit
    }
    expect(ravage(5)).toBeGreaterThan(0)
    expect(ravage(5)).toBeCloseTo(5 * ravage(1))
  })
})
