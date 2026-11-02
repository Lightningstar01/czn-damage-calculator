import { describe, expect, it } from 'vitest'
import { computeBuild, shownPct } from '../../src/engine/calc'
import { renderCardText } from '../../src/engine/cardText'
import { buildDeck } from '../../src/engine/deck'
import { activeBuffs } from '../../src/engine/buffs'
import { PRESETS } from '../../src/data/presets'
import { newCharacterSave } from '../../src/store/save'
import { type Build, type RotationPlay } from '../../src/engine/types'
import { cardFromPreset, settings } from '../helpers'

describe('Beryl', () => {
  const beryl = PRESETS.characters.find((c) => c.name === 'Beryl')!
  const preset = (id: string) => beryl.cards!.find((p) => p.id === id)!
  // Owner's screenshots (2026-11-01): Attack 483, E6, Basic 7/16 (1 + E3 and E5's 6), Signature 6/16 (0 + 6), 3-1 unlocked, 5-1 and 7 locked
  const ownerBuild = () => {
    const cs = newCharacterSave()
    const [a] = cs.builds
    Object.assign(a, { egoLevel: 6, basicLevel: 1, signatureLevel: 0, potentialNodes: { '5-1': false, '7': false } })
    Object.assign(a.stats, { attack: 483, defense: 131, health: 324, critChance: 0, critDmg: 1.25 })
    return { cs, a }
  }
  const UNIT = 483 * 0.35
  const play = (id: string, stacks: RotationPlay['stacks'] = {}, change: (a: Build) => void = () => {}) => {
    const { cs, a } = ownerBuild()
    a.deck.push({ id: 'c', preset: id })
    change(a)
    a.rotation = [{ cardId: 'c', stacks }]
    return computeBuild(PRESETS, 'Beryl', cs, a, settings).plays[0]
  }
  const damage = (id: string, stacks: RotationPlay['stacks'] = {}, change: (a: Build) => void = () => {}) => play(id, stacks, change).nonCrit

  it("Charged Shot IV's 1 time doesn't stop the other Retain cards in the deck", () => {
    const { cs, a } = ownerBuild()
    a.deck.push({ id: 'iv', preset: 'card-526' }, { id: 'of', preset: 'card-520' }, { id: 'cs', preset: 'card-522' })
    const stacks = { 'Times Retained': 3 }
    a.rotation = [{ cardId: 'iv', stacks }, { cardId: 'of', stacks }, { cardId: 'cs', stacks }]
    const r = computeBuild(PRESETS, 'Beryl', cs, a, settings)
    expect(r.plays[0].nonCrit).toBeCloseTo((4.032 + 2.4 + 0.2) * UNIT)
    expect(r.plays[1].nonCrit).toBeCloseTo((2.016 + 2.4 + 0.2) * UNIT)
    expect(r.plays[2].nonCrit).toBeCloseTo((3.024 + 4.05 + 0.2) * UNIT)
    // The stepper stops at 1 on Charged Shot IV only, E6's trigger or not
    const max = (i: number) => r.counterOptions[i].find((c) => c.name === 'Times Retained')?.max
    expect([max(0), max(1), max(2)]).toEqual([1, null, null])
  })
  const text = (id: string, change: (a: Build) => void = () => {}) => {
    const { cs, a } = ownerBuild()
    change(a)
    const p = preset(id)
    const c = cardFromPreset(p, 'Justice')
    const buffs = activeBuffs(PRESETS, 'Beryl', cs, a, settings)
    return renderCardText(p.text, { egoLevel: a.egoLevel, nodeOn: (n) => a.potentialNodes?.[n] !== false, pct: (base, fixed) => shownPct(base, c, a, beryl, buffs, settings, fixed) })
  }

  it("card text matches the owner's in-game screenshots", () => {
    expect(preset('card-512').name).toBe('Max Output Charged Shot')
    expect(text('card-512')).toBe('400% Damage to all enemies')
    expect(text('card-513')).toBe('137% Damage')
    expect(text('card-514')).toBe('274% Damage')
    expect(text('card-515')).toBe('114% Shield')
    expect(text('card-516')).toBe('[Retain]\n179% Damage\nRetain: Add 1 Hit(s) for 1 turn')
    expect(text('card-517')).toBe('[Retain]\n235% Damage\nRetain: Add 1 Hit(s) for 1 turn')
    expect(text('card-518')).toBe('[Retain]\n291% Damage\nRetain: Change Cost to 0')
    expect(text('card-519')).toBe('[Retain]\n123% Damage\nRetain: Add 2 Hit(s) for 1 turn')
    expect(text('card-520')).toBe('[Retain]\n202% Damage\nRetain: +80% Damage Amount')
    expect(text('card-521')).toBe('When a card of this unit is Retained, 150% Extra Attack to random enemies')
    expect(text('card-522')).toBe('[Retain]\n302% Damage\nRetain: +135% Damage Amount')
    expect(text('card-523')).toBe('[Retain]\n403% Damage\nRetain: +180% Damage Amount')
    expect(text('card-524')).toBe('[Retain]\n302% Damage\nStreak: +135% Damage Amount')
    expect(text('card-525')).toBe('[Retain]\n560% Damage\nRetain: Decrease Cost by 1 until activated')
    expect(text('card-526')).toBe('[Retain]\n403% Damage\nRetain: +240% Damage Amount (max 1 time)')
    expect(text('card-527')).toBe('[Retain]\n157% Damage × 2\nRetain: +80% Damage Amount')
    expect(text('card-534')).toBe('112% Shield\n+80% Damage Amount to the next Attack Card of this unit activated')
    expect(text('card-535')).toBe('168% Shield\n+120% Damage Amount to the next Attack Card of this unit activated')
    expect(text('card-538')).toBe('168% Shield\n+80% Damage Amount to the next Attack Card activated')
    expect(text('card-541')).toBe('[Retain]\n179% Damage\nRetain: Add 1 Hit(s) for 1 turn')
    expect(preset('card-524').cost).toBe(1)
    expect(preset('card-525').cost).toBe(3)
  })

  it("nodes 5-1 and 7 add to the shown %, 7's Charged Shot part from Critical Damage 230%", () => {
    const on = (critDmg: number) => (a: Build) => {
      a.potentialNodes = {}
      a.stats.critDmg = critDmg
    }
    expect(text('card-513', on(1.59))).toBe('143% Damage') // (100% + 20% + 5%) x 1.14
    expect(text('card-513', on(1.6))).toBe('148% Damage') // (100% + 20% + 10%) x 1.14
    expect(text('card-516', on(1.25))).toContain('190% Damage') // (160% + 10%) x 1.12
    expect(text('card-522', on(2.29))).toContain('302% Damage')
    expect(text('card-522', on(2.3))).toContain('314% Damage') // (270% + 10%) x 1.12
    expect(text('card-541', on(1.25))).toContain('190% Damage')
    expect(text('card-542', on(2.3))).toContain('314% Damage')
    expect(text('card-521', on(2.3))).toContain('150% Extra Attack')
  })

  it("Retain: +X% adds up per Retain, Charged Shot IV's once; E2 counts on Retain cards", () => {
    expect(damage('card-522')).toBeCloseTo((3.024 + 0.2) * UNIT)
    expect(damage('card-522', { 'Times Retained': 2 })).toBeCloseTo((3.024 + 2.7 + 0.2) * UNIT)
    expect(damage('card-526', { 'Times Retained': 3 })).toBeCloseTo((4.032 + 2.4 + 0.2) * UNIT)
    expect(damage('card-520', { 'Times Retained': 2 })).toBeCloseTo((2.016 + 1.6 + 0.2) * UNIT)
    expect(damage('card-542', { 'Times Retained': 1 })).toBeCloseTo((3.024 + 1.35 + 0.2) * UNIT)
    expect(damage('card-524', { Streak: 1 })).toBeCloseTo((3.024 + 1.35 + 0.2) * UNIT)
    // E2 stays off the Basic Launcher
    expect(damage('card-513')).toBeCloseTo(1.368 * UNIT)
  })

  it('E4 raises the Ego skill by 50%, not by the upgrades', () => {
    const { cs, a } = ownerBuild()
    a.rotation = [{ cardId: 'auto:card-512' }]
    expect(computeBuild(PRESETS, 'Beryl', cs, a, settings).plays[0].nonCrit).toBeCloseTo(4 * UNIT)
  })

  it('Heavy Weapons Specialist brings the created cards, at the normal numbers', () => {
    const { cs, a } = ownerBuild()
    a.deck.push({ id: 'h', preset: 'card-540' })
    const names = buildDeck(beryl, a).map((d) => d.card.name)
    expect(names).toEqual(expect.arrayContaining(['Opening Found (created)', 'Charged Shot (created)']))
    a.rotation = [{ cardId: 'auto:card-541' }, { cardId: 'auto:card-542', stacks: { 'Times Retained': 1 } }]
    const { plays } = computeBuild(PRESETS, 'Beryl', cs, a, settings)
    expect(plays[0].nonCrit).toBeCloseTo((1.792 + 0.2) * UNIT)
    expect(plays[1].nonCrit).toBeCloseTo((3.024 + 1.35 + 0.2) * UNIT)
  })

  it("Unlimited Firepower's buffs reach Beryl's Attack Cards", () => {
    const pick = (id: string) => (a: Build) => a.deck.push({ id: 'u', preset: id })
    const firepower = (id: string, stacks: RotationPlay['stacks'], extra: number) =>
      expect(damage('card-513', stacks, pick(id))).toBeCloseTo((1.368 + extra) * UNIT)
    firepower('card-534', { 'Unlimited Firepower played': 1 }, 0.8)
    firepower('card-535', { 'Unlimited Firepower I played': 1 }, 1.2)
    firepower('card-536', { 'Unlimited Firepower II played this turn': 1 }, 0.8)
    firepower('card-537', { 'Unlimited Firepower III played': 1 }, 1.6)
    firepower('card-538', { 'Unlimited Firepower IV played': 1 }, 0.8)
    // V: "by 30%" multiplies the card %, always on
    expect(damage('card-513', {}, pick('card-539'))).toBeCloseTo(1.368 * 1.3 * UNIT)
  })

  it('E6: Condense adds a 50% Extra Attack per stack on Attack Cards, max 3', () => {
    const condense = (stacks: number, id = 'card-513') => play(id, { Condense: stacks }).triggered.reduce((n, t) => n + t.expected, 0)
    expect(condense(0)).toBe(0)
    expect(condense(1)).toBeCloseTo(0.5 * UNIT)
    expect(condense(3)).toBeCloseTo(1.5 * UNIT)
    expect(condense(5)).toBeCloseTo(1.5 * UNIT)
    // Skills and Opening Found V aren't Attack Cards
    expect(condense(3, 'card-521')).toBe(0)
    // Below E6, nothing
    const below = play('card-513', { Condense: 3 }, (a) => { a.egoLevel = 5 })
    expect(below.triggered).toEqual([])
  })

  it('Opening Found V is its own 150% Extra Attack, without Attack Card buffs', () => {
    const v = (change: (a: Build) => void = () => {}) => damage('card-521', {}, change)
    expect(v()).toBeCloseTo(1.5 * UNIT)
    expect(v((a) => a.deck.push({ id: 'u', preset: 'card-539' }))).toBeCloseTo(1.5 * UNIT)
  })
})
