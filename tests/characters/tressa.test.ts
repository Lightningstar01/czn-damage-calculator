import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { computeBuild, shownPct } from '../../src/engine/calc'
import { renderCardText } from '../../src/engine/cardText'
import { activeBuffs } from '../../src/engine/buffs'
import { AUTO, buildDeck } from '../../src/engine/deck'
import { cardBuff } from '../../src/data/helpers'
import { PRESETS } from '../../src/data/presets'
import { newBuff, newCharacterSave } from '../../src/store/save'
import { chipsFor, FormulaStrip } from '../../src/ui/FormulaStrip'
import { cardFromPreset, gameSettings, settings } from '../helpers'

describe('Tressa', () => {
  const tressa = PRESETS.characters.find((c) => c.name === 'Tressa')!
  const preset = (id: string) => tressa.cards!.find((p) => p.id === id)!
  // Owner's screenshots (2026-11-01): E6, Basic 11/16 (5 + 6 from E3 and E5: x1.22), Unique 6/16 (0 + 6: x1.12), 3-1 on, 5-1 and 7 locked
  const ownerBuild = () => {
    const cs = newCharacterSave()
    const [a] = cs.builds
    Object.assign(a, { egoLevel: 6, basicLevel: 5, signatureLevel: 0, potentialNodes: { '5-1': false, 7: false } })
    Object.assign(a.stats, { attack: 608, critChance: 0, dotDmg: 0.032 })
    a.stats.elemDmg.Void = 0.075
    return { cs, a }
  }
  /** Damage of one play of a card; tweak: the build's changes. */
  const play = (id: string, stacks: Record<string, number> = {}, tweak: (a: ReturnType<typeof ownerBuild>['a']) => void = () => {}, hits?: number) => {
    const { cs, a } = ownerBuild()
    tweak(a)
    a.deck = [{ id: 'd', preset: id }]
    a.rotation = [{ cardId: 'd', stacks, ...(hits ? { hits } : {}) }]
    return computeBuild(PRESETS, 'Tressa', cs, a, settings)
  }
  const ATK = 608 * 0.35 * 1.075

  it("card text matches the owner's in-game screenshots", () => {
    const { cs, a } = ownerBuild()
    const text = (id: string) => {
      const p = preset(id)
      const c = cardFromPreset(p, 'Void')
      const buffs = activeBuffs(PRESETS, 'Tressa', cs, a, settings)
      return renderCardText(p.text, { egoLevel: a.egoLevel, nodeOn: () => true, pct: (base, fixed) => shownPct(base, c, a, tressa, buffs, settings, fixed) })
    }
    expect(text('card-245')).toBe('Create 2 Shadow Dagger\n4 Agony × 2')
    expect(text('card-246')).toBe('122% Damage\n2 Agony')
    expect(text('card-247')).toBe('Heal 122%')
    expect(text('card-260')).toBe('Heal 112%\nCreate 1 Advanced Shadow Dagger')
    expect(text('card-261')).toContain('90% Damage to all enemies')
    expect(text('card-262')).toBe('Heal 168%\nCreate 1 Advanced Shadow Dagger')
    expect(text('card-263')).toContain('112% Heal × X')
    expect(text('card-266')).toBe('90% Damage × 3\nIf the target is in an Agony state, +50% Damage Amount')
    expect(text('card-267')).toBe('[Lead]\n168% Damage × 3')
    expect(text('card-268')).toBe('134% Damage × 3\nIf the target is in an Agony state, +70% Damage Amount')
    expect(text('card-269')).toBe('90% Damage × 3\n2~6 Agony')
    expect(text('card-270')).toBe('224% Damage × 2\nWhen the target has 3 or more Agony, proc 1 more time')
    expect(text('card-271')).toBe('168% Damage × 3\n+10% Damage Amount for each Agony on the target')
    expect(text('card-273')).toBe('[Exhaust]\n90% Damage\n2 Agony')
    expect(text('card-274')).toBe('[Retain / Exhaust]\n4 Agony\n56% Damage\n+10% Damage Amount for each Agony on the target')
    expect(text('agony')).toContain('50% Fixed DoT × Agony count')
  })

  describe('an Agony tick', () => {
    const HIT = 0.5 * ATK * 1.032
    const tick = (count: number, tweak: (play: Record<string, unknown>) => void = () => {}, critChance = 0, defMult = 1) => {
      const { cs, a } = ownerBuild()
      a.stats.critChance = critChance
      a.stats.critDmg = 1.25
      const p = { cardId: `${AUTO}agony`, stacks: { 'Agony on target': count } }
      tweak(p)
      a.rotation = [p]
      return computeBuild(PRESETS, 'Tressa', cs, a, settings, {}, { enemies: [{ defMult, dr: 0 }] })
    }

    it('is one hit per stack, unraised by the card upgrade', () => {
      const r = tick(8)
      expect(r.plays[0].hits).toHaveLength(8)
      expect(r.plays[0].hits[0].nonCrit).toBeCloseTo(HIT)
      expect(r.nonCrit).toBeCloseTo(8 * HIT)
      expect(tick(0).nonCrit).toBe(0)
    })

    it("shows its whole count, though E2's bonus stops reading it at 1", () => {
      expect(tick(8).plays[0].counters).toEqual([{ name: 'Agony on target', stacks: 8 }])
    })

    it('shows its count below E2 too, with no buff reading it', () => {
      const { cs, a } = ownerBuild()
      a.egoLevel = 0
      a.rotation = [{ cardId: `${AUTO}agony`, stacks: { 'Agony on target': 8 } }]
      expect(computeBuild(PRESETS, 'Tressa', cs, a, settings).plays[0].counters).toEqual([{ name: 'Agony on target', stacks: 8 }])
    })

    it('stops at 20 stacks', () => {
      const r = tick(25)
      expect(r.plays[0].hits).toHaveLength(20)
      expect(r.nonCrit).toBeCloseTo(20 * HIT)
      expect(r.plays[0].counters).toEqual([{ name: 'Agony on target', stacks: 20 }])
      expect(play('card-272', { 'Agony on target': 25 }).plays[0].hits).toHaveLength(20)
    })

    it('a buff reading the count reads what the stepper shows: 1 with nothing typed', () => {
      const { cs, a } = ownerBuild()
      a.rotation = [{ cardId: `${AUTO}agony` }]
      const reader = cardBuff('reader', 'Reader', '+10%', 'Agony', { counter: 'Agony on target', maxStacks: 20 })
      const presets = { ...PRESETS, characters: PRESETS.characters.map((c) => (c === tressa ? { ...c, effects: [...c.effects, reader] } : c)) }
      const r = computeBuild(presets, 'Tressa', cs, a, settings)
      expect(r.plays[0].hits).toHaveLength(1)
      expect(r.plays[0].hits[0].additive.value).toBeCloseTo(0.1)
    })

    it('a Flat buff goes under its factors, as the strip shows', () => {
      const { cs, a } = ownerBuild()
      a.rotation = [{ cardId: `${AUTO}agony` }]
      cs.buffs.push({ ...newBuff(a.id), value: '10000', typeOverride: 'Flat', appliesTo: 'Agony' })
      const r = computeBuild(PRESETS, 'Tressa', cs, a, settings, {}, { enemies: [{ defMult: 0.5, dr: 0 }] })
      const hit = r.plays[0].hits[0]
      expect(hit.nonCrit).toBeCloseTo((0.5 * 608 * 0.35 + 100) * 1.075 * 1.032 * 0.5)
      const html = renderToStaticMarkup(createElement(FormulaStrip, { hit, card: r.plays[0].card })).replace(/<[^>]+>/g, ' ')
      expect(html).toMatch(/\(\s*Fixed.*Flat\s*\+100\s*\)\s*×\s*Element.*DoT.*Enemy DEF/s)
      const flat = chipsFor(hit, r.plays[0].card).outer.find((c) => c.key === 'flat')!
      expect(flat.note).toContain('the factors after the bracket raise it')
    })


    it('each hit can crit', () => {
      expect(tick(8, undefined, 0.5).expected).toBeCloseTo(8 * HIT * (1 + 0.5 * 0.25))
      expect(tick(8).crit).toBeCloseTo(8 * HIT * 1.25)
    })

    it('Enemy DEF raises it; Vulnerable does not', () => {
      expect(tick(2, undefined, 0, 0.5).nonCrit).toBeCloseTo(HIT)
      expect(tick(2, (p) => { p.vulnerable = true }).nonCrit).toBeCloseTo(2 * HIT)
    })
  })

  it('the Agony play is always in the deck, through the Ego skill', () => {
    const { a } = ownerBuild()
    expect(buildDeck(tressa, a).map((i) => i.card.id)).toContain(`${AUTO}agony`)
  })

  it('Cursed Gouge is the same tick', () => {
    expect(play('card-272', { 'Agony on target': 10 }).nonCrit).toBeCloseTo(0.5 * 10 * ATK * 1.032)
  })

  it("other Fixed damage still gets neither the element nor the DoT stat", () => {
    const { cs, a } = ownerBuild()
    a.deck = [{ id: 'f', custom: { id: 'f', name: 'F', cardType: 'Attack', element: 'Void', cost: 1, tags: '', scaling: 'Fixed', kind: 'Normal', pct: 1, hits: 1, weaknessApplies: false, targetRavaged: false } }]
    a.rotation = [{ cardId: 'f' }]
    expect(computeBuild(PRESETS, 'Tressa', cs, a, settings).nonCrit).toBeCloseTo(608 * 0.35)
  })

  it('Vital Attack: +50% from 1 Agony, not more with more stacks', () => {
    const hit = (agony: number) => play('card-266', { 'Agony on target': agony }).nonCrit
    expect(hit(0)).toBeCloseTo(3 * 0.8 * 1.12 * ATK)
    expect(hit(1)).toBeCloseTo(3 * (0.8 * 1.12 + 0.5) * ATK)
    expect(hit(9)).toBeCloseTo(hit(1))
  })

  it('the Agony bonuses need a target: on target, not in hand', () => {
    const vital = play('card-266', { 'Agony on target': 3 }).plays[0].hits[0]
    expect(vital.inHand).toBeCloseTo(0.8 * 1.12)
    expect(vital.cardMult).toBeCloseTo(0.8 * 1.12 + 0.5)
    const fifth = play('card-271', { 'Agony on target': 5 }).plays[0].hits[0]
    expect(fifth.inHand).toBeCloseTo(1.5 * 1.12)
    expect(fifth.cardMult).toBeCloseTo(1.5 * 1.12 + 0.5)
  })

  it('Vital Attack IV: one more hit at 3+ Agony', () => {
    const one = 2 * 1.12 * ATK
    expect(play('card-270').nonCrit).toBeCloseTo(2 * one)
    expect(play('card-270', { 'Target has 3+ Agony': 1 }).nonCrit).toBeCloseTo(3 * one)
  })

  it('Vital Attack V and Advanced Shadow Dagger: +10% per Agony, up to 20', () => {
    expect(play('card-271', { 'Agony on target': 5 }).nonCrit).toBeCloseTo(3 * (1.5 * 1.12 + 0.5) * ATK)
    expect(play('card-271', { 'Agony on target': 25 }).nonCrit).toBeCloseTo(3 * (1.5 * 1.12 + 2) * ATK)
    const { cs, a } = ownerBuild()
    a.rotation = [{ cardId: `${AUTO}card-274`, stacks: { 'Agony on target': 4 } }]
    a.deck = [{ id: 'd', preset: 'card-260' }]
    expect(computeBuild(PRESETS, 'Tressa', cs, a, settings).nonCrit).toBeCloseTo((0.5 * 1.12 + 0.4) * ATK)
  })

  it('E2: +20% to Shadow Dagger in Agony, from E2 only, and not to Advanced Shadow Dagger', () => {
    const dagger = (ego: number, agony: number) => {
      const { cs, a } = ownerBuild()
      a.egoLevel = ego
      a.rotation = [{ cardId: `${AUTO}card-273`, stacks: { 'Agony on target': agony } }]
      return computeBuild(PRESETS, 'Tressa', cs, a, settings).nonCrit
    }
    const factor = (ego: number) => 1 + 0.02 * (ego >= 5 ? 6 : ego >= 3 ? 3 : 0)
    expect(dagger(6, 0)).toBeCloseTo(0.8 * factor(6) * ATK)
    expect(dagger(6, 3)).toBeCloseTo((0.8 * factor(6) + 0.2) * ATK)
    expect(dagger(1, 3)).toBeCloseTo(0.8 * factor(1) * ATK)
    const { cs, a } = ownerBuild()
    a.deck = [{ id: 'd', preset: 'card-260' }]
    a.rotation = [{ cardId: `${AUTO}card-274` }]
    expect(computeBuild(PRESETS, 'Tressa', cs, a, settings).nonCrit).toBeCloseTo(0.5 * 1.12 * ATK)
  })

  describe('an upgraded card % is rounded before buffs (Settings)', () => {
    const hit = (cardId: string, s = gameSettings, tweak: (a: ReturnType<typeof ownerBuild>['a']) => void = () => {}) => {
      const { cs, a } = ownerBuild()
      a.deck = [{ id: 'f', custom: { id: 'f', name: 'F', cardType: 'Attack', element: 'Void', cost: 1, tags: '', scaling: 'ATK', kind: 'Normal', pct: 0.896, hits: 1, weaknessApplies: false, targetRavaged: false } }]
      a.rotation = [{ cardId }]
      tweak(a)
      return computeBuild(PRESETS, 'Tressa', cs, a, s).plays[0].hits[0]
    }
    it('Shadow Dagger counts as 90%, not 89.6%, and the upgrade stays visible', () => {
      const h = hit(`${AUTO}card-273`)
      expect(h.upgradedPct).toBeCloseTo(0.9)
      expect(h.inHand).toBeCloseTo(0.9)
      expect(h.nonCrit).toBeCloseTo(0.9 * ATK)
    })
    it('rounds down too: Vital Attack II counts as 134%, not 134.4%', () => {
      const { cs, a } = ownerBuild()
      a.deck = [{ id: 'd', preset: 'card-268' }]
      a.rotation = [{ cardId: 'd', hits: 1 }]
      expect(computeBuild(PRESETS, 'Tressa', cs, a, gameSettings).plays[0].hits[0].inHand).toBeCloseTo(1.34)
    })
    it('with the setting off, the exact %', () => {
      expect(hit(`${AUTO}card-273`, settings).inHand).toBeCloseTo(0.896)
    })
    it('a card with no upgrade keeps its exact %', () => {
      expect(hit('f').inHand).toBeCloseTo(0.896)
    })
  })

  it('Shadow Reload I: Hits set on the play repeat it', () => {
    expect(play('card-261', {}, undefined, 3).nonCrit).toBeCloseTo(3 * 0.8 * 1.12 * ATK)
  })

  it('5-1 and 7 read the Damage over Time stat, at "or higher"', () => {
    const throwAt = (dot: number) => play('card-246', {}, (a) => { a.stats.dotDmg = dot; a.potentialNodes = { 7: false } }).nonCrit
    expect(throwAt(0.149)).toBeCloseTo(1.05 * 1.22 * ATK)
    expect(throwAt(0.15)).toBeCloseTo(1.1 * 1.22 * ATK)
    const seven = (dot: number) => {
      const { cs, a } = ownerBuild()
      Object.assign(a, { potentialNodes: { '5-1': false } })
      a.stats.dotDmg = dot
      a.rotation = [{ cardId: `${AUTO}card-273` }]
      return computeBuild(PRESETS, 'Tressa', cs, a, settings).nonCrit
    }
    expect(seven(0.299)).toBeCloseTo((0.8 * 1.12 + 0.04) * ATK)
    expect(seven(0.3)).toBeCloseTo((0.8 * 1.12 + 0.08) * ATK)
  })
})
