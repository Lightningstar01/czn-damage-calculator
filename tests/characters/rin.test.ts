import { describe, expect, it } from 'vitest'
import { computeBuild, shownPct } from '../../src/engine/calc'
import { renderCardText } from '../../src/engine/cardText'
import { activeBuffs } from '../../src/engine/buffs'
import { buildDeck } from '../../src/engine/deck'
import { PRESETS } from '../../src/data/presets'
import { newCharacterSave } from '../../src/store/save'
import { addCards, cardFromPreset, settings } from '../helpers'

describe('Rin', () => {
  const rin = PRESETS.characters.find((c) => c.name === 'Rin')!
  const preset = (id: string) => rin.cards!.find((p) => p.id === id)!
  const STANCE = { 'Dark Mist Stance': 1 }
  // Owner's screenshots (2026-11-01): level 1, nothing unlocked: Basic 0, Signature 0, E0, Attack 166
  const ownerBuild = () => {
    const cs = newCharacterSave()
    const [a] = cs.builds
    Object.assign(a, { egoLevel: 0, basicLevel: 0, signatureLevel: 0, potentialNodes: { '3-1': false, '5-1': false, '7': false } })
    a.stats.attack = 100
    return { cs, a }
  }
  const unit = 100 * 0.35
  const damage = (id: string, stacks: Record<string, number> = {}, setup: (a: ReturnType<typeof ownerBuild>['a']) => void = () => {}) => {
    const { cs, a } = ownerBuild()
    setup(a)
    const c = cardFromPreset(preset(id), 'Void')
    addCards(cs, c)
    a.rotation = [{ cardId: c.id, stacks }]
    return computeBuild(PRESETS, 'Rin', cs, a, settings).plays[0]
  }

  it('the stance that adds Annihilation\'s hit shows on its play, with no buff reading it', () => {
    const on = damage('card-174', STANCE)
    expect(on.hits).toHaveLength(2)
    expect(on.counters).toEqual([{ name: 'Dark Mist Stance', stacks: 1 }])
    const off = damage('card-174')
    expect(off.hits).toHaveLength(1)
    expect(off.counters).toEqual([])
    // A card without it doesn't list it
    expect(damage('card-159', STANCE).counters).toEqual([])
  })

  it("card text matches the owner's in-game screenshots", () => {
    const { cs, a } = ownerBuild()
    const text = (id: string, nodeOn: () => boolean = () => false) => {
      const p = preset(id)
      const c = cardFromPreset(p, 'Void')
      const buffs = activeBuffs(PRESETS, 'Rin', cs, a, settings)
      return renderCardText(p.text, { egoLevel: a.egoLevel, nodeOn, pct: (base) => shownPct(base, c, a, rin, buffs, settings) })
    }
    expect(preset('card-158').name).toBe('Dark Mist Secret Art: Slash')
    expect(text('card-158')).toBe('400% Damage\n6 Vulnerable')
    expect(preset('card-159').name).toBe('Dark Mist Sword: First Form')
    expect(text('card-159')).toBe('100% Damage')
    expect(text('card-160', () => true)).toBe('220% Damage\nGain Dark Mist Stance')
    expect(text('card-162')).toBe('[Haste]\n120% Damage\nGain Dark Mist Stance\nDark Mist Stance: Increase Damage Amount by 100%')
    expect(text('card-165')).toContain('450% Damage\nDark Mist Stance: Temporarily remove Unactivatable')
    expect(text('card-171')).toContain('by 50% for 1 turn until activated')
    expect(text('card-176')).toBe('[Haste]\n100% Damage × 2\nDark Mist Stance: Add 2 Hit(s)')
    expect(text('card-180')).toBe('[Lead]\nRetain Dark Mist Stance for 1 turn\nDark Mist Stance: +40% Damage Amount to Attack Cards of this unit for 1 turn')
    expect(text('card-186')).toBe('120% Damage\nDark Mist Stance: Add 1 Hit(s) for each Skill Card in hand')
    expect(text('sheathe-sword')).toContain('[Haste / Exhaust / Ephemeral]\n60% Damage\n+20% base Damage Amount')
  })

  it('new plays start in the stance, and Annihilation can switch it without any other stance card in the deck', () => {
    expect(rin.playStacks).toEqual(STANCE)
    const { cs, a } = ownerBuild()
    const c = cardFromPreset(preset('card-174'), 'Void')
    addCards(cs, c)
    a.rotation = [{ cardId: c.id }]
    expect(computeBuild(PRESETS, 'Rin', cs, a, settings).counterOptions[0]).toContainEqual({ name: 'Dark Mist Stance', max: 1 })
  })

  it('Dark Mist Stance adds Annihilation\'s hits, and Annihilation IV\'s and Inner Art V\'s multipliers only in the stance', () => {
    expect(damage('card-174').hits).toHaveLength(1)
    expect(damage('card-174', STANCE).hits).toHaveLength(2)
    expect(damage('card-176', STANCE).hits).toHaveLength(4)
    expect(damage('card-178').nonCrit).toBeCloseTo(3 * unit)
    expect(damage('card-178', STANCE).nonCrit).toBeCloseTo(3 * 2 * unit)
    const withInnerV = (stacks: Record<string, number>) => {
      const { cs, a } = ownerBuild()
      const [strike, inner] = ['card-159', 'card-185'].map((id) => cardFromPreset(preset(id), 'Void'))
      addCards(cs, strike, inner)
      a.rotation = [{ cardId: strike.id, stacks }]
      return computeBuild(PRESETS, 'Rin', cs, a, settings).plays[0].nonCrit
    }
    expect(withInnerV({})).toBeCloseTo(unit)
    expect(withInnerV(STANCE)).toBeCloseTo(1.5 * unit)
  })

  it('Drawing Slash: the +100% is always on, II has its added hit, IV is 30% per card in hand', () => {
    expect(damage('card-162').nonCrit).toBeCloseTo(1.2 * 2 * unit)
    expect(damage('card-164').hits).toHaveLength(2)
    expect(damage('card-166', { 'Cards in hand': 4 }).nonCrit).toBeCloseTo(1.5 * (1 + 0.3 * 4) * unit)
  })

  it('Annihilation III: +100% Critical Damage in the stance', () => {
    const critDmg = ownerBuild().a.stats.critDmg
    expect(damage('card-177', STANCE).crit / damage('card-177').crit).toBeCloseTo((critDmg + 1) / critDmg)
  })

  it('Inner Art adds +40% to Attack Cards for the plays it\'s switched on', () => {
    const { cs, a } = ownerBuild()
    const [strike, inner] = ['card-159', 'card-180'].map((id) => cardFromPreset(preset(id), 'Void'))
    addCards(cs, strike, inner)
    a.rotation = [{ cardId: strike.id }, { cardId: strike.id, stacks: { 'Dark Mist Inner Art': 1 } }]
    const r = computeBuild(PRESETS, 'Rin', cs, a, settings)
    expect(r.plays[0].nonCrit).toBeCloseTo(unit)
    expect(r.plays[1].nonCrit).toBeCloseTo(1.4 * unit)
  })

  it('Ego: Sheathe Sword joins the deck from E2, E3 raises the Ego skill by +100%', () => {
    const { a } = ownerBuild()
    const ids = () => buildDeck(rin, a).map((i) => i.card.name)
    expect(ids()).not.toContain('Sheathe Sword')
    a.egoLevel = 2
    expect(ids()).toContain('Sheathe Sword')
    expect(damage('card-158', {}, (b) => { b.egoLevel = 3 }).nonCrit).toBeCloseTo(5 * unit)
  })

  it('Sheathe Sword: +20% base for each Attack Card activated this turn', () => {
    const sheathe = (n: number) => {
      const { cs, a } = ownerBuild()
      a.egoLevel = 2
      const id = buildDeck(rin, a).find((i) => i.card.name === 'Sheathe Sword')!.card.id
      a.rotation = [{ cardId: id, stacks: { 'Attack Cards activated this turn': n } }]
      return computeBuild(PRESETS, 'Rin', cs, a, settings).plays[0].nonCrit
    }
    expect(sheathe(0)).toBeCloseTo(0.6 * unit)
    expect(sheathe(3)).toBeCloseTo((0.6 + 0.6) * unit)
  })

  it('5-1 adds before the upgrade on First and Third Form, with +5% more from Attack 500', () => {
    const at = (attack: number) => (a: ReturnType<typeof ownerBuild>['a']) => { a.potentialNodes = { '5-1': true }; a.stats.attack = attack }
    expect(damage('card-159', {}, at(100)).nonCrit).toBeCloseTo(1.05 * unit)
    expect(damage('card-159', {}, at(499)).nonCrit).toBeCloseTo(1.05 * 499 * 0.35)
    expect(damage('card-159', {}, at(500)).nonCrit).toBeCloseTo(1.1 * 500 * 0.35)
    expect(damage('card-160', {}, at(100)).nonCrit).toBeCloseTo((2.2 + 0.05) * unit)
  })

  it('7: +5% Critical Chance from Attack 600, +1% for every 40 above it, up to +10% more', () => {
    const rate = (attack: number, node = true) =>
      damage('card-159', {}, (a) => { a.potentialNodes = { '7': node }; a.stats.attack = attack }).hits[0].critRate
    const base = rate(599)
    expect(rate(600, false)).toBeCloseTo(base)
    expect(rate(600) - base).toBeCloseTo(0.05)
    expect(rate(639) - base).toBeCloseTo(0.05)
    expect(rate(640) - base).toBeCloseTo(0.06)
    expect(rate(1000) - base).toBeCloseTo(0.15)
    expect(rate(2000) - base).toBeCloseTo(0.15)
  })

  it('E1: +30% on Black Dance before the upgrade, from E1 only', () => {
    expect(damage('card-186').nonCrit).toBeCloseTo(1.2 * unit)
    expect(damage('card-186', {}, (a) => { a.egoLevel = 1 }).nonCrit).toBeCloseTo(1.5 * unit)
    expect(damage('card-186', {}, (a) => { a.egoLevel = 1; a.signatureLevel = 10 }).nonCrit).toBeCloseTo(1.5 * 1.2 * unit)
  })
})
