import { describe, expect, it } from 'vitest'
import { computeBuild, shownPct } from '../../src/engine/calc'
import { renderCardText } from '../../src/engine/cardText'
import { buildDeck } from '../../src/engine/deck'
import { activeBuffs } from '../../src/engine/buffs'
import { PRESETS } from '../../src/data/presets'
import { newCharacterSave } from '../../src/store/save'
import { type Build, type RotationPlay } from '../../src/engine/types'
import { cardFromPreset, settings } from '../helpers'

describe('Khalipe', () => {
  const khalipe = PRESETS.characters.find((c) => c.name === 'Khalipe')!
  const preset = (id: string) => khalipe.cards!.find((p) => p.id === id)!
  // Owner's screenshots (2026-11-01): level 60, Attack 436, Defense 215, Health 490, E0, Basic level 1, Signature level 5, 3-1 and 7 on, 5-1 locked
  const ownerBuild = () => {
    const cs = newCharacterSave()
    const [a] = cs.builds
    Object.assign(a, { egoLevel: 0, basicLevel: 1, signatureLevel: 5, potentialNodes: { '5-1': false } })
    Object.assign(a.stats, { attack: 436, defense: 215, health: 490, critChance: 0.088, critDmg: 1.318 })
    return { cs, a }
  }
  const UNIT = (436 * 0.3 + 215 * 2.1) * 0.35
  const damage = (id: string, play: Partial<RotationPlay> = {}, change: (a: Build) => void = () => {}) => {
    const { cs, a } = ownerBuild()
    a.deck.push({ id: 'c', preset: id })
    change(a)
    a.rotation = [{ cardId: 'c', ...play }]
    return computeBuild(PRESETS, 'Khalipe', cs, a, settings).plays[0].nonCrit
  }
  /** A play of the Silver Veil card, which joins the deck with a card that gives it. */
  const veil = (play: Partial<RotationPlay> = {}, change: (a: Build) => void = () => {}) => {
    const { cs, a } = ownerBuild()
    a.deck.push({ id: 'c', preset: 'card-67' })
    change(a)
    a.rotation = [{ cardId: 'auto:silver-veil', ...play }]
    return computeBuild(PRESETS, 'Khalipe', cs, a, settings).plays[0].nonCrit
  }
  const text = (id: string, change: (a: Build) => void = () => {}) => {
    const { cs, a } = ownerBuild()
    change(a)
    const p = preset(id)
    const c = cardFromPreset(p, 'Instinct')
    const buffs = activeBuffs(PRESETS, 'Khalipe', cs, a, settings)
    return renderCardText(p.text, { egoLevel: a.egoLevel, nodeOn: (n) => a.potentialNodes?.[n] !== false, pct: (base, fixed) => shownPct(base, c, a, khalipe, buffs, settings, fixed) })
  }

  it("card text matches the owner's in-game screenshots", () => {
    expect(text('card-63')).toBe('300% Defense-Based Damage to all enemies\nCreate 1 Vulture Ejection')
    expect(text('card-64')).toBe('102% Defense-Based Damage')
    expect(text('card-65')).toBe('184% Defense-Based Damage to all enemies')
    expect(text('card-66')).toBe('102% Shield')
    expect(text('card-67')).toBe('[Celestial / Retain]\n143% Defense-Based Damage to all enemies\n121% Shield\n1 Silver Veil')
    expect(text('card-68')).toBe('[Celestial / Retain]\n319% Defense-Based Damage to all enemies\n1 Silver Veil')
    expect(text('card-69')).toBe('[Celestial / Retain]\n319% Shield\n1 Silver Veil')
    expect(text('card-70')).toBe('[Celestial / Retain]\n209% Defense-Based Damage to all enemies\n176% Shield\n1 Silver Veil')
    expect(text('card-71')).toBe('[Celestial / Retain]\n209% Defense-Based Damage to all enemies\n1 Silver Veil\nRetain: 121% Shield')
    expect(text('card-72')).toBe('[Celestial / Retain]\n209% Defense-Based Damage to all enemies\n1 Silver Veil\n40% Shield for each card in hand')
    expect(text('card-73')).toBe('165% Defense-Based Damage to all enemies\nIf Vulture Ejection is in hand, increase Cost by 1, +120% Damage Amount')
    expect(text('card-74')).toBe('231% Defense-Based Damage to all enemies\nIf Vulture Ejection is in hand, increase Cost by 1, +170% Damage Amount')
    expect(text('card-75')).toBe('242% Defense-Based Damage to all enemies\nWhen activated, +40% Damage Amount')
    expect(text('card-76')).toBe('242% Defense-Based Damage to all enemies\nIf Vulture Ejection is in hand, 1 Silver Veil')
    expect(text('card-77')).toBe('[Retain]\n242% Defense-Based Damage to all enemies\nRetain: +60% Damage Amount to next activated Vulture Ejection')
    expect(text('card-78')).toBe('[Retrieve 3]\n165% Defense-Based Damage to all enemies\nIf Vulture Ejection is in hand, increase Cost by 1, +120% Damage Amount')
    expect(text('card-79')).toBe('275% Shield\n1 Tenacity Damage to all enemies')
    expect(text('card-80')).toBe('330% Shield\n1 Tenacity Damage to all enemies\n1 Damage Reduction for each enemy present')
    expect(text('card-83')).toBe('275% Shield\n1 Tenacity Damage to all enemies\n+40% base Shield Gain Amount for each card in hand')
    expect(text('card-85')).toBe('132% Shield\nDraw 1 highest-cost card(s)')
    expect(text('card-86')).toBe('165% Shield\nDraw 1 highest-cost card(s)\n1 Silver Veil')
    expect(text('card-88')).toBe('[Celestial]\n165% Shield\nDraw 1 highest-cost card(s)\n1 Silver Veil')
    expect(text('card-89')).toBe("132% Shield\nDraw 1,\ngain 66% Shield equal to that card's Cost\n1 Silver Veil")
    expect(text('card-90')).toBe('165% Shield\nSelect and Draw 1 2-Cost or higher cards from Draw Pile')
    expect(text('card-91')).toBe('[Finale]\n110% Shield for each X\nFor 1 turn, Retain all cards in hand (cannot stack)')
  })

  it('Ego levels and Potential nodes change the wording', () => {
    expect(text('card-63', (a) => { a.egoLevel = 3 })).toBe('350% Defense-Based Damage to all enemies\nCreate 1 Vulture Ejection\n1 Silver Veil')
    expect(text('card-91', (a) => { a.egoLevel = 1 })).toBe('[Finale / Retain]\n132% Shield for each X\nFor 1 turn, Retain all cards in hand (cannot stack)')
    expect(text('card-65', (a) => { a.potentialNodes!['3-1'] = false })).toBe('224% Defense-Based Damage')
    // 5-1: (100% + 5%) x 1.02; at Defense 250, (100% + 10%) x 1.02
    expect(text('card-64', (a) => { delete a.potentialNodes!['5-1'] })).toBe('107% Defense-Based Damage')
    expect(text('card-64', (a) => { delete a.potentialNodes!['5-1']; a.stats.defense = 250 })).toBe('112% Defense-Based Damage')
    expect(text('card-67', (a) => { a.potentialNodes!['7'] = false })).toBe('[Celestial / Retain]\n132% Defense-Based Damage to all enemies\n110% Shield\n1 Silver Veil')
  })

  it('Upward Slash: 3-1 takes 40% off the base %', () => {
    expect(damage('card-65')).toBeCloseTo(1.8 * 1.02 * UNIT)
    expect(damage('card-65', {}, (a) => { a.potentialNodes!['3-1'] = false })).toBeCloseTo(2.2 * 1.02 * UNIT)
  })

  it('node 7 is part of the card % on Vulture Ejection and every epiphany, with +20% at Attack 700', () => {
    expect(damage('card-67')).toBeCloseTo((1.2 + 0.1) * 1.1 * UNIT)
    expect(damage('card-68')).toBeCloseTo((2.8 + 0.1) * 1.1 * UNIT)
    expect(damage('card-67', {}, (a) => { a.potentialNodes!['7'] = false })).toBeCloseTo(1.2 * 1.1 * UNIT)
    const unit700 = (700 * 0.3 + 215 * 2.1) * 0.35
    expect(damage('card-67', {}, (a) => { a.stats.attack = 700 })).toBeCloseTo((1.2 + 0.3) * 1.1 * unit700)
  })

  it('Greatsword Aquila: the in-hand bonus is per play and additive, II always on, IV raises the next Vulture Ejection', () => {
    expect(damage('card-73')).toBeCloseTo(1.5 * 1.1 * UNIT)
    expect(damage('card-73', { stacks: { 'Vulture Ejection in hand': 1 } })).toBeCloseTo((1.5 * 1.1 + 1.2) * UNIT)
    expect(damage('card-74', { stacks: { 'Vulture Ejection in hand': 1 } })).toBeCloseTo((2.1 * 1.1 + 1.7) * UNIT)
    expect(damage('card-75')).toBeCloseTo((2.2 * 1.1 + 0.4) * UNIT)
    const withIV = (id: string, play: Partial<RotationPlay>) => damage(id, play, (a) => { a.deck.push({ id: 'g', preset: 'card-77' }) })
    expect(withIV('card-68', {})).toBeCloseTo(2.9 * 1.1 * UNIT)
    expect(withIV('card-68', { stacks: { 'Greatsword Aquila IV Retained': 1 } })).toBeCloseTo((2.9 * 1.1 + 0.6) * UNIT)
  })

  it('the Ego skill brings the plain Vulture Ejection and Silver Veil: 500% Defense-based, unraised, not an Attack Card', () => {
    const { a } = ownerBuild()
    const ids = buildDeck(khalipe, a).map((i) => i.card.id)
    expect(ids).toContain('auto:card-63')
    expect(ids).toContain('auto:card-67')
    expect(ids).toContain('auto:silver-veil')
    expect(veil()).toBeCloseTo(5 * UNIT)
    expect(preset('silver-veil').notACard).toBe(true)
  })

  it('E3 raises the Ego skill, E4 Deploy Veil reaches everything up to 2 stacks, E6 raises Silver Veil', () => {
    expect(damage('card-63', {}, (a) => { a.egoLevel = 3 })).toBeCloseTo(3.5 * UNIT)
    const e4 = (a: Build) => { a.egoLevel = 4 }
    expect(damage('card-64', { stacks: { 'Deploy Veil': 2 } }, e4)).toBeCloseTo((1.02 + 0.6) * UNIT)
    expect(damage('card-64', { stacks: { 'Deploy Veil': 5 } }, e4)).toBeCloseTo((1.02 + 0.6) * UNIT)
    expect(damage('card-64', { stacks: { 'Deploy Veil': 2 } })).toBeCloseTo(1.02 * UNIT)
    expect(veil({ stacks: { 'Deploy Veil': 1 } }, e4)).toBeCloseTo(5.3 * UNIT)
    expect(veil({}, (a) => { a.egoLevel = 6 })).toBeCloseTo(6.5 * UNIT)
  })

  it('E5 adds 3 card upgrade levels; E3 does not', () => {
    expect(khalipe.potentialEgo).toEqual([{ level: 5, levels: 3 }])
    expect(damage('card-64', {}, (a) => { a.egoLevel = 5 })).toBeCloseTo(1.08 * UNIT)
  })
})
