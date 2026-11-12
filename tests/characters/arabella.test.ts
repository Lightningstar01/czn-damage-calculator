import { describe, expect, it } from 'vitest'
import { computeBuild, shownPct } from '../../src/engine/calc'
import { renderCardText } from '../../src/engine/cardText'
import { activeBuffs } from '../../src/engine/buffs'
import { AUTO, buildDeck } from '../../src/engine/deck'
import { PRESETS } from '../../src/data/presets'
import { newCharacterSave } from '../../src/store/save'
import { cardFromPreset, gameSettings, settings } from '../helpers'

describe('Arabella', () => {
  const arabella = PRESETS.characters.find((c) => c.name === 'Arabella')!
  const preset = (id: string) => arabella.cards!.find((p) => p.id === id)!
  // Owner's screenshots (2026-11-09): E0, Basic 1/10 (x1.02), Unique 9/10 (x1.18), 3-1 and 7 on, 5-1 locked;
  // stats screen: Attack 870, Instinct 31%, Damage over Time 32.7%
  const ownerBuild = () => {
    const cs = newCharacterSave()
    const [a] = cs.builds
    Object.assign(a, { egoLevel: 0, basicLevel: 1, signatureLevel: 9, potentialNodes: { '5-1': false } })
    Object.assign(a.stats, { attack: 870, critChance: 0, dotDmg: 0.327 })
    a.stats.elemDmg.Instinct = 0.31
    return { cs, a }
  }
  type B = ReturnType<typeof ownerBuild>['a']
  /** One play's damage; the deck holds the card, and the Ego skill brings Fracture. */
  const play = (cardId: string, stacks: Record<string, number> = {}, tweak: (a: B) => void = () => {}, extra: Record<string, unknown> = {}) => {
    const { a } = ownerBuild()
    a.deck = [{ id: 'd', preset: cardId.startsWith(AUTO) ? 'card-1296' : cardId }]
    a.rotation = [{ cardId: cardId.startsWith(AUTO) ? cardId : 'd', stacks, ...extra }]
    tweak(a)
    return computeBuild(PRESETS, 'Arabella', a, settings)
  }
  const ATK = 870 * 0.35 * 1.31
  const FRACTURE = `${AUTO}fracture`
  const tick = (count: number, more: Record<string, number> = {}, tweak?: (a: B) => void, extra?: Record<string, unknown>) =>
    play(FRACTURE, { 'Fracture on target': count, ...more }, tweak, extra)

  it("card text matches the owner's in-game screenshots", () => {
    const { a } = ownerBuild()
    const text = (id: string) => {
      const p = preset(id)
      const c = cardFromPreset(p, 'Instinct')
      const buffs = activeBuffs(PRESETS, 'Arabella', a, gameSettings)
      return renderCardText(p.text, { egoLevel: a.egoLevel, nodeOn: (n) => n !== '5-1', pct: (base, fixed) => shownPct(base, c, a, arabella, buffs, gameSettings, fixed) })
    }
    expect(text('card-1295')).toBe("600% Damage\nFor 2 turn(s), inflict Fixed Damage to the target equal to 30% of Damage Amount taken by all enemies\n(cannot exceed 1000% of Arabella's Attack per turn)")
    expect(text('card-1296')).toBe('61% Damage to all enemies\n1 Fracture')
    expect(text('card-1297')).toBe('102% Shield')
    expect(text('card-1298')).toBe('[Lead]\n47% Damage and 2 Fracture to all enemies\n4 Fracture to the enemy with the highest HP')
    for (const id of ['card-1299', 'card-1300', 'card-1301', 'card-1302', 'card-1303', 'card-1311', 'card-1312', 'card-1314', 'card-1316', 'card-1321']) {
      expect(text(id)).toContain('71% Damage')
    }
    expect(text('card-1313')).toContain('425% Damage and 2 Fracture to all enemies')
    expect(text('card-1315')).toContain('118% Damage to all enemies')
    expect(text('card-1317')).toContain('118% Damage')
    expect(text('card-1318')).toContain('71% Damage × 4')
    expect(text('card-1319')).toContain('283% Damage')
    expect(text('card-1320')).toBe('[Lead]\n47% Damage × 4 to random enemies\n2 Fracture on each Hit\nEfficiency: Add 1 Hit')
    expect(text('card-1322')).toBe('[Unique]\n236% Damage to all enemies\nIncrease Damage Amount by 15% for each type of harmful effect the target has (max 120%)\nFracture Amplification: 2x base Damage Amount')
    expect(text('fracture')).toContain('40% DoT for each Fracture')
  })

  it('the Fracture play is always in the deck, through the Ego skill', () => {
    const { a } = ownerBuild()
    expect(buildDeck(arabella, a).map((i) => i.card.id)).toContain(FRACTURE)
  })

  describe('a Fracture tick', () => {
    const HIT = 0.4 * ATK * 1.327
    it('is one hit of 40% x the stacks, unraised by the card upgrade, up to 30', () => {
      const r = tick(10)
      expect(r.plays[0].hits).toHaveLength(1)
      expect(r.nonCrit).toBeCloseTo(10 * HIT)
      expect(tick(40).nonCrit).toBeCloseTo(30 * HIT)
    })
    it('Fracture Amplification: by 20%, on the plays where it is set', () => {
      expect(tick(10, { 'Fracture Amplification on target': 1 }).nonCrit).toBeCloseTo(10 * HIT * 1.2)
    })
    it('is normal damage: Vulnerable raises it', () => {
      expect(tick(10, {}, undefined, { vulnerable: true }).nonCrit).toBeCloseTo(10 * HIT * 1.5)
    })
    it("Observer's Pleasure IV's +80% to this unit reaches it; Attack Card buffs don't", () => {
      const r = tick(10, { "Observer's Pleasure IV": 1, 'Scream For Me II': 1 }, (a) => {
        a.deck.push({ id: 'o', preset: 'card-1308' }, { id: 's', preset: 'card-1300' })
      })
      expect(r.nonCrit).toBeCloseTo((10 * 0.4 + 0.8) * ATK * 1.327)
    })
    it('E4 Deconstruction Analysis: by 5% per stack, 6 max (10 from E6), added to Amplification', () => {
      const at = (ego: number) => tick(10, { 'Fracture Amplification on target': 1, 'Deconstruction Analysis': 10 }, (a) => { a.egoLevel = ego }).nonCrit
      expect(at(3)).toBeCloseTo(10 * HIT * 1.2)
      expect(at(4)).toBeCloseTo(10 * HIT * 1.5)
      expect(at(6)).toBeCloseTo(10 * HIT * 1.7)
    })
    it('E6: +50% Critical Damage on the Fracture Amplification target', () => {
      const crit = (amp: number) => tick(10, { 'Fracture Amplification on target': amp }, (a) => { a.egoLevel = 6; a.stats.critDmg = 1.5 })
      expect(crit(0).crit / crit(0).nonCrit).toBeCloseTo(1.5)
      expect(crit(1).crit / crit(1).nonCrit).toBeCloseTo(2)
    })
  })

  describe('The Art of Unmaking', () => {
    it('by 15% per harmful effect type (max 8 types = 120%), 2x base with Fracture Amplification', () => {
      expect(play('card-1322').nonCrit).toBeCloseTo(2.36 * ATK)
      expect(play('card-1322', { 'Harmful effect types on target': 3 }).nonCrit).toBeCloseTo(2.36 * 1.45 * ATK)
      expect(play('card-1322', { 'Harmful effect types on target': 9 }).nonCrit).toBeCloseTo(2.36 * 2.2 * ATK)
      expect(play('card-1322', { 'Fracture Amplification on target': 1 }).nonCrit).toBeCloseTo(4.72 * ATK)
    })
    it('E1: +50% in the card % and 20% per type (max 180%)', () => {
      const e1 = (types: number) => play('card-1322', { 'Harmful effect types on target': types }, (a) => { a.egoLevel = 1 }).nonCrit
      expect(e1(0)).toBeCloseTo(2.5 * 1.18 * ATK)
      expect(e1(9)).toBeCloseTo(2.5 * 1.18 * 2.8 * ATK)
    })
  })

  it("Observer's Pleasure: +20% to this unit per enemy present, on that turn's plays", () => {
    const r = play('card-1298', { "Observer's Pleasure: enemies present": 2 }, (a) => { a.deck.push({ id: 'o', preset: 'card-1304' }) })
    expect(r.nonCrit).toBeCloseTo((0.4 * 1.18 + 0.4) * ATK)
  })

  it('Scream For Me II: Attack Cards of this unit by 50% for 1 turn', () => {
    expect(play('card-1300', { 'Scream For Me II': 1 }).nonCrit).toBeCloseTo(0.6 * 1.18 * 1.5 * ATK)
  })

  it('5-1 adds to Diagonal Slash before the upgrade, +5% more at Attack 500', () => {
    expect(play('card-1296', {}, (a) => { a.potentialNodes = {} }).nonCrit).toBeCloseTo(0.7 * 1.02 * ATK)
    expect(play('card-1296').nonCrit).toBeCloseTo(0.6 * 1.02 * ATK)
  })

  it('E3: Pathetic End +200%', () => {
    expect(play('card-1295').nonCrit).toBeCloseTo(6 * ATK)
    expect(play('card-1295', {}, (a) => { a.egoLevel = 3 }).nonCrit).toBeCloseTo(8 * ATK)
  })
})
