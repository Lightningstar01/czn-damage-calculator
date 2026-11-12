import { describe, expect, it } from 'vitest'
import { computeBuild, shownPct } from '../../src/engine/calc'
import { renderCardText } from '../../src/engine/cardText'
import { activeBuffs } from '../../src/engine/buffs'
import { AUTO, buildDeck } from '../../src/engine/deck'
import { PRESETS } from '../../src/data/presets'
import { newCharacterSave } from '../../src/store/save'
import { addCards, cardFromPreset, settings } from '../helpers'

describe('Amir', () => {
  const amir = PRESETS.characters.find((c) => c.name === 'Amir')!
  const preset = (id: string) => amir.cards!.find((p) => p.id === id)!
  // Owner's screenshots (2026-11-01): E6, Basic 0 + 6, Signature 0 + 6, nodes 3-1, 5-1, 7 locked, Defense 94
  const ownerBuild = () => {
    const cs = newCharacterSave()
    const [a] = cs.builds
    Object.assign(a, { egoLevel: 6, basicLevel: 0, signatureLevel: 0, potentialNodes: { '3-1': false, '5-1': false, '7': false } })
    a.stats.attack = 100
    a.stats.defense = 100
    return { cs, a }
  }
  type Build = ReturnType<typeof ownerBuild>['a']
  // Defense-Based stat: 30% of Attack + 210% of Defense
  const unit = (100 * 0.3 + 100 * 2.1) * 0.35
  const up = 1.12
  const damage = (id: string, stacks: Record<string, number> = {}, setup: (a: Build) => void = () => {}, hits?: number) => {
    const { cs, a } = ownerBuild()
    setup(a)
    const c = cardFromPreset(preset(id), 'Order')
    addCards(cs, c)
    a.rotation = [{ cardId: c.id, stacks, ...(hits ? { hits } : {}) }]
    return computeBuild(PRESETS, 'Amir', a, settings).plays[0]
  }
  /** One Metallization strike, with these cards in the deck. */
  const strike = (ids: string[], stacks: Record<string, number> = {}, setup: (a: Build) => void = () => {}) => {
    const { cs, a } = ownerBuild()
    setup(a)
    addCards(cs, ...ids.map((id) => cardFromPreset(preset(id), 'Order')))
    a.rotation = [{ cardId: AUTO + 'metallization', stacks }]
    return computeBuild(PRESETS, 'Amir', a, settings).plays[0]
  }

  it("card text matches the owner's in-game screenshots", () => {
    const { a } = ownerBuild()
    const text = (id: string, nodeOn: () => boolean = () => false) => {
      const p = preset(id)
      const c = cardFromPreset(p, 'Order')
      const buffs = activeBuffs(PRESETS, 'Amir', a, settings)
      return renderCardText(p.text, { egoLevel: a.egoLevel, nodeOn, pct: (base) => shownPct(base, c, a, amir, buffs, settings) })
    }
    expect(text('card-456')).toBe('150% Shield for each Metallization\nRemove Metallization\nAt the start of the next turn, 5 Metallization')
    expect(text('card-457')).toBe('112% Defense-Based Damage')
    expect(text('card-458')).toBe('112% Shield')
    expect(text('card-458', () => true)).toBe('112% Shield\n1 Metallization')
    expect(text('card-465')).toBe('101% Defense-Based Damage × 2\nIf in Metallization state, decrease Metallization by 1 and inflict 2 Vulnerable')
    expect(text('card-466')).toContain('123% Defense-Based Damage × 2')
    expect(text('card-467')).toBe('224% Defense-Based Damage\nDecrease Metallization by up to 2\n+150% Damage Amount for each')
    expect(text('card-468')).toContain('101% Defense-Based Damage × 2')
    expect(text('card-477')).toBe('224% Defense-Based Damage to all enemies\nFor 1 turn, Metallization targets all enemies and +20% Damage Amount')
    expect(text('card-480')).toContain('224% Defense-Based Damage to all enemies\nAt the end of the turn')
    expect(text('card-480')).toContain('120% Defense-Based Damage to all enemies for each')
    expect(text('card-481')).toContain('90% Defense-Based Damage × 4 to all enemies')
    expect(text('card-482')).toContain('112% Defense-Based Damage × 3 to all enemies')
    expect(text('card-483')).toBe('[Exhaust]\nDecrease Damage Taken by 40% for 1 turn\nDecrease up to 3 Metallization\nAdditionally decrease Damage Taken by 20% for each')
  })

  it('Ego levels change Iron Skin and Steel Resolve', () => {
    const at = (id: string, egoLevel: number) => renderCardText(preset(id).text, { egoLevel, nodeOn: () => false, pct: (base) => base })
    expect(at('card-483', 0)).toBe('[Exhaust / Finale]\nDecrease Damage Taken by 20% for 1 turn\nDecrease up to 4 Metallization\nAdditionally decrease Damage Taken by 20% for each')
    expect(at('card-456', 3)).toBe('120% Shield for each Metallization\nRemove Metallization\nAt the start of the next turn, 3 Metallization')
  })

  it('E3 and E5 raise cards by 6 levels at E6, so Rapier is 112%', () => {
    expect(damage('card-457').nonCrit).toBeCloseTo(up * unit)
    expect(damage('card-457', {}, (a) => { a.egoLevel = 0 }).nonCrit).toBeCloseTo(unit)
  })

  it('Metallization is always in the deck: an unraised 80% Defense-Based hit that Attack Card buffs miss', () => {
    const { a } = ownerBuild()
    expect(buildDeck(amir, a).map((i) => i.card.name)).toEqual(['Steel Resolve', 'Metallization'])
    const r = strike([])
    expect(r.hits).toHaveLength(1)
    expect(r.nonCrit).toBeCloseTo(0.8 * unit)
    expect(r.card.notACard).toBe(true)
  })

  it('Metal Extraction V and Full Metal Hurricane raise strikes, not the Hurricane itself', () => {
    expect(strike(['card-476']).nonCrit).toBeCloseTo(0.8 * unit)
    expect(strike(['card-476'], { 'Metal Extraction V': 1 }).nonCrit).toBeCloseTo((0.8 + 0.3) * unit)
    expect(strike(['card-477'], { 'Full Metal Hurricane': 1 }).nonCrit).toBeCloseTo((0.8 + 0.2) * unit)
    expect(strike(['card-478'], { 'Full Metal Hurricane I': 1 }).nonCrit).toBeCloseTo((0.8 + 0.6) * unit)
    expect(strike(['card-481'], { 'Full Metal Hurricane IV': 1 }).nonCrit).toBeCloseTo((0.8 + 0.2) * unit)
    expect(damage('card-477', { 'Full Metal Hurricane': 1 }).nonCrit).toBeCloseTo(2 * up * unit)
  })

  it('Full Metal Hurricane II: each strike hits twice with +50%, only while it is switched on and in the deck', () => {
    const on = { 'Full Metal Hurricane II': 1 }
    expect(strike(['card-479']).nonCrit).toBeCloseTo(0.8 * unit)
    const r = strike(['card-479'], on)
    expect(r.triggered).toHaveLength(1)
    expect(r.nonCrit).toBeCloseTo(2 * (0.8 + 0.5) * unit)
    expect(strike([], on).nonCrit).toBeCloseTo(0.8 * unit)
    // Its own hit gets nothing
    const own = damage('card-479', on)
    expect(own.triggered).toEqual([])
    expect(own.nonCrit).toBeCloseTo(2 * up * unit)
  })

  it('Metal Pierce I adds a hit in the Metallization state, and new plays start in it', () => {
    expect(amir.playStacks).toEqual({ 'In Metallization state': 1 })
    expect(damage('card-466').hits).toHaveLength(2)
    expect(damage('card-466', { 'In Metallization state': 1 }).hits).toHaveLength(3)
  })

  it('Metal Pierce II: +150% for each Metallization decreased, up to 2', () => {
    expect(damage('card-467').nonCrit).toBeCloseTo(2 * up * unit)
    expect(damage('card-467', { 'Metallization decreased': 2 }).nonCrit).toBeCloseTo((2 * up + 3) * unit)
    expect(damage('card-467', { 'Metallization decreased': 5 }).nonCrit).toBeCloseTo((2 * up + 3) * unit)
  })

  it('Full Metal Hurricane III: 224% once, and an unraised 120% end-of-turn play per Metallization decreased', () => {
    expect(damage('card-480').nonCrit).toBeCloseTo(2 * up * unit)
    const { a } = ownerBuild()
    a.deck.push({ id: 'h3', preset: 'card-480' })
    a.rotation = [{ cardId: AUTO + 'hurricane-iii-end', hits: 2 }]
    expect(computeBuild(PRESETS, 'Amir', a, settings).plays[0].nonCrit).toBeCloseTo(2 * 1.2 * unit)
  })

  it('Full Metal Hurricane V: 3 hits, more when set on the play', () => {
    expect(damage('card-482').hits).toHaveLength(3)
    expect(damage('card-482', {}, () => {}, 5).nonCrit).toBeCloseTo(5 * up * unit)
  })

  it('Potentials: 5-1 raises Rapier from Defense 250, 7 raises strikes from Defense 300', () => {
    const nodes = (defense: number) => (a: Build) => {
      a.potentialNodes = { '3-1': false }
      a.stats.defense = defense
    }
    const stat = (defense: number) => (100 * 0.3 + defense * 2.1) * 0.35
    expect(damage('card-457', {}, nodes(249)).nonCrit).toBeCloseTo((1 + 0.05) * up * stat(249))
    expect(damage('card-457', {}, nodes(250)).nonCrit).toBeCloseTo((1 + 0.1) * up * stat(250))
    expect(strike([], {}, nodes(299)).nonCrit).toBeCloseTo((0.8 + 0.1) * stat(299))
    expect(strike([], {}, nodes(300)).nonCrit).toBeCloseTo((0.8 + 0.2) * stat(300))
  })
})
