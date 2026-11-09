import { describe, expect, it } from 'vitest'
import { computeBuild, shownPct } from '../../src/engine/calc'
import { renderCardText } from '../../src/engine/cardText'
import { buildDeck } from '../../src/engine/deck'
import { activeBuffs } from '../../src/engine/buffs'
import { PRESETS } from '../../src/data/presets'
import { newCharacterSave } from '../../src/store/save'
import { type Build, type RotationPlay } from '../../src/engine/types'
import { cardFromPreset, settings } from '../helpers'

describe('Magna', () => {
  const magna = PRESETS.characters.find((c) => c.name === 'Magna')!
  const preset = (id: string) => magna.cards!.find((p) => p.id === id)!
  // Owner's screenshots (2026-11-08): level 60, Attack 489, Defense 384, Health 774, E2, Basic 5/10 (x1.10), Unique 1/10 (x1.02),
  // 3-1 and 7 unlocked, 5-1 locked
  const ownerBuild = () => {
    const cs = newCharacterSave()
    const [a] = cs.builds
    Object.assign(a, { egoLevel: 2, basicLevel: 5, signatureLevel: 1, potentialNodes: { '5-1': false } })
    Object.assign(a.stats, { attack: 489, defense: 384, health: 774, critChance: 0, critDmg: 1.25 })
    return { cs, a }
  }
  const UNIT = (489 * 0.3 + 384 * 2.1) * 0.35
  const COUNTER = 'auto:counterattack'
  /** One play of `id` (a card picked as `pick`, or the Counterattack it creates) with `others` also in the deck. */
  const damage = (id: string, play: Partial<RotationPlay> = {}, change: (a: Build) => void = () => {}, pick = id, others: string[] = []) => {
    const { cs, a } = ownerBuild()
    a.deck.push({ id: 'c', preset: pick }, ...others.map((p, i) => ({ id: `o${i}`, preset: p })))
    change(a)
    a.rotation = [{ cardId: id === COUNTER ? COUNTER : 'c', ...play }]
    return computeBuild(PRESETS, 'Magna', cs, a, settings).plays[0].nonCrit
  }
  const text = (id: string, change: (a: Build) => void = () => {}) => {
    const { cs, a } = ownerBuild()
    change(a)
    const p = preset(id)
    const c = cardFromPreset(p, 'Justice')
    const buffs = activeBuffs(PRESETS, 'Magna', cs, a, settings)
    return renderCardText(p.text, { egoLevel: a.egoLevel, nodeOn: (n) => a.potentialNodes?.[n] !== false, pct: (base, fixed) => shownPct(base, c, a, magna, buffs, settings, fixed) })
  }

  it("card text matches the owner's in-game screenshots", () => {
    expect(text('card-93')).toBe('300% Defense-Based Damage\nIncreases Damage Amount by 20% for each Counterattack on this unit')
    expect(text('card-94')).toBe('110% Defense-Based Damage\n1 Counterattack')
    expect(text('card-95')).toBe('110% Shield\n1 Counterattack')
    expect(text('card-96')).toBe('[Lead]\n3 Crystallization\nAt the start of the turn,\n1 Counterattack')
    expect(text('card-100')).toBe('[Unique / Lead]\n3 Crystallization\nAt the end of the turn,\n200% Defense-Based Damage to all enemies')
    expect(text('card-101')).toBe('[Lead]\n4 Counterattack\nIncrease Damage Amount of the next Counterattack of this unit activated by 100%')
    expect(text('card-102')).toBe('306% Defense-Based Damage\n50% DMG-Based Shield')
    expect(text('card-103')).toBe('459% Defense-Based Damage\n50% DMG-Based Shield')
    expect(text('card-105')).toBe('459% Defense-Based Damage\nWhen Shield is owned, increases Damage Amount by 50%')
    expect(text('card-107')).toBe('[Exhaust 2]\n408% Defense-Based Damage\n50% DMG-Based Shield\n100% Shield Retention for 1 turn')
    expect(text('card-108')).toBe('204% Shield\n2 Counterattack\nSet the target of Counterattack to all enemies for 2 turn(s)')
    expect(text('card-110')).toBe('306% Shield\n2 Counterattack\n+30% Shield Gain Amount for each Counterattack of this unit')
    expect(text('card-112')).toBe('204% Shield\nInflict Fixed Damage to all enemies equal to Shield held')
    expect(text('card-114')).toBe('143% Shield\n3 Vulnerable to all enemies')
    expect(text('card-115')).toBe('214% Shield\n3 Vulnerable to all enemies\n+60% base Shield Gain Amount for each enemy present')
    expect(text('card-118')).toBe('102% Defense-Based Damage x 3 to random enemies\n1 Vulnerable to targets that were Hit')
    expect(text('card-120')).toBe('[Lead / Initiation]\n3 Crystallization\nWhen Shield is gained, 1 Counterattack')
  })

  it('Ego levels and Potential nodes change the wording', () => {
    expect(text('card-120', (a) => { a.egoLevel = 0 })).toBe('[Lead]\n2 Crystallization\nWhen Shield is gained, 1 Counterattack')
    expect(text('card-93', (a) => { a.egoLevel = 3 })).toBe('300% Defense-Based Damage\nIncreases Damage Amount by 30% for each Counterattack on this unit')
    expect(text('card-94', (a) => { a.potentialNodes = { '3-1': false } })).toBe('110% Defense-Based Damage')
  })

  it('card upgrades: Basic x1.10, Unique x1.02, Ice Fragment IV stays at 200%', () => {
    expect(damage('card-94')).toBeCloseTo(1.1 * UNIT)
    expect(damage('card-102')).toBeCloseTo(3 * 1.02 * UNIT)
    expect(damage('card-118')).toBeCloseTo(3 * 1.02 * UNIT)
    expect(damage('card-100')).toBeCloseTo(2 * UNIT)
  })

  it("node 7 is on the stats screen: on, it adds nothing", () => {
    expect(damage('card-94', {}, (a) => { a.potentialNodes = {} })).toBeCloseTo(1.1 * UNIT)
  })

  it('Counterattack joins the deck with the cards that give it, as 150% or 300%, not raised by upgrades', () => {
    const { a } = ownerBuild()
    a.deck.push({ id: 'c', preset: 'card-102' })
    expect(buildDeck(magna, a).map((i) => i.card.id)).not.toContain(COUNTER)
    a.deck.push({ id: 'd', preset: 'card-94' })
    expect(buildDeck(magna, a).map((i) => i.card.id)).toContain(COUNTER)
    expect(damage(COUNTER, {}, () => {}, 'card-94')).toBeCloseTo(1.5 * UNIT)
    expect(damage(COUNTER, { stacks: { 'Completely blocked by Shield': 1 } }, () => {}, 'card-94')).toBeCloseTo(3 * UNIT)
  })

  it('Absolute Zero: x(1 + 20% x Counterattacks), 30% from E3, up to 10', () => {
    expect(damage('card-93')).toBeCloseTo(3 * UNIT)
    expect(damage('card-93', { stacks: { 'Counterattack owned': 5 } })).toBeCloseTo(3 * 2 * UNIT)
    expect(damage('card-93', { stacks: { 'Counterattack owned': 5 } }, (a) => { a.egoLevel = 3 })).toBeCloseTo(3 * 2.5 * UNIT)
    expect(damage('card-93', { stacks: { 'Counterattack owned': 15 } })).toBeCloseTo(3 * 3 * UNIT)
  })

  it('Ice Fragment III x1.3 and V x2 (next one) on Counterattacks; E6 Enhanced Counterattack x1.3', () => {
    expect(damage(COUNTER, {}, () => {}, 'card-99')).toBeCloseTo(1.5 * 1.3 * UNIT)
    expect(damage(COUNTER, {}, () => {}, 'card-101')).toBeCloseTo(1.5 * UNIT)
    expect(damage(COUNTER, { stacks: { 'Ice Fragment V (next Counterattack)': 1 } }, () => {}, 'card-101')).toBeCloseTo(3 * UNIT)
    const enhanced = { stacks: { 'Enhanced Counterattack': 1 } }
    expect(damage(COUNTER, enhanced, () => {}, 'card-94')).toBeCloseTo(1.5 * UNIT)
    expect(damage(COUNTER, enhanced, (a) => { a.egoLevel = 6 }, 'card-94')).toBeCloseTo(1.5 * 1.3 * UNIT)
  })

  it('Glacial Iron Fist III: x1.5 while holding Shield', () => {
    expect(damage('card-105')).toBeCloseTo(4.5 * 1.02 * UNIT)
    expect(damage('card-105', { stacks: { 'Holding Shield': 1 } })).toBeCloseTo(4.5 * 1.02 * 1.5 * UNIT)
  })

  it('Ice Wall IV: Fixed Damage equal to Shield owned', () => {
    expect(damage('card-112', { stacks: { 'Shield owned': 400 } })).toBeCloseTo(400)
    expect(damage('card-112', { vulnerable: true, stacks: { 'Shield owned': 400 } })).toBeCloseTo(400)
  })
})
