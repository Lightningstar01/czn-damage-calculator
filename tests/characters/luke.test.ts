import { describe, expect, it } from 'vitest'
import { computeBuild, shownPct } from '../../src/engine/calc'
import { renderCardText } from '../../src/engine/cardText'
import { activeBuffs } from '../../src/engine/buffs'
import { PRESETS } from '../../src/data/presets'
import { newCharacterSave } from '../../src/store/save'
import type { RotationPlay } from '../../src/engine/types'
import { cardFromPreset, settings } from '../helpers'

describe('Luke', () => {
  const luke = PRESETS.characters.find((c) => c.name === 'Luke')!
  const preset = (id: string) => luke.cards!.find((p) => p.id === id)!
  // Screenshots (2026-11-09): the Combatant Archive preview, Lv 1, no card upgrades, no Potential node, no Ego level,
  // Critical Chance 3%, Critical Damage 125%
  const archiveBuild = (egoLevel = 0, nodes = false) => {
    const cs = newCharacterSave()
    const [a] = cs.builds
    a.egoLevel = egoLevel
    a.stats.attack = 100
    if (!nodes) a.potentialNodes = { '3-1': false, '5-1': false, '7': false }
    // Chain Fire creates the Handgun Bullets
    a.deck.push({ id: 'cf', preset: 'card-33' })
    return { cs, a }
  }
  const run = (rotation: RotationPlay[], b = archiveBuild()) => {
    b.a.rotation = rotation
    return computeBuild(PRESETS, 'Luke', b.a, settings)
  }

  it('card text matches the in-game screenshots', () => {
    const text = (id: string, { egoLevel = 0, nodeOn = false } = {}) => {
      const { a } = archiveBuild(egoLevel)
      const p = preset(id)
      const buffs = activeBuffs(PRESETS, 'Luke', a, settings)
      return renderCardText(p.text, { egoLevel, nodeOn: () => nodeOn,
        pct: (base, fixed) => shownPct(base, cardFromPreset(p, 'Order'), a, luke, buffs, settings, fixed) })
    }
    expect(text('card-30')).toBe('450% Damage\n+25% base Damage Amount for each card in hand')
    expect(text('card-30', { egoLevel: 3 })).toBe('550% Damage\n+35% base Damage Amount for each card in hand')
    expect(text('card-31')).toBe('100% Damage')
    expect(text('card-31', { nodeOn: true })).toBe('[Bullet]\n100% Damage')
    expect(text('card-33')).toBe('50% Damage × 2\nFor each Critical Hit create a Handgun Bullet\n+50% Critical Chance')
    expect(text('card-34')).toBe('[Retrieve]\n75% Damage × 2\nFor each Critical Hit create a Handgun Bullet\n+50% Critical Chance')
    expect(text('card-36')).toBe('300% Damage\nCreate Handgun Bullet for each Critical Hit\nGuaranteed Critical')
    expect(text('card-37')).toBe('[Bullet]\n100% Damage × 3\n+50% Critical Chance')
    expect(text('card-54')).toBe('50% Damage\nAdd 1 Hit for each Bullet card activated this turn\nWeakness Attack: +50% Damage Amount')
    expect(text('card-56')).toBe('50% Damage × 6\nWhen a Bullet card is activated, decrease Cost by 1 for 1 turn until activated')
    expect(text('card-57')).toBe('[Unique / Bullet]\n500% Damage\nWhen 5 Handgun Bullet cards are activated, remove Unactivatable')
    expect(text('card-57', { egoLevel: 1 })).toContain('When 4 Handgun Bullet cards')
    expect(text('card-58')).toBe('[Ephemeral / Exhaust / Bullet]\n85% Damage')
    expect(text('card-59')).toBe('[Ephemeral / Exhaust / Bullet]\n60% Damage\nWeakness Attack: Increase Damage Amount by 100%')
    expect(text('card-61')).toBe('[Ephemeral / Exhaust / Bullet]\n30% Damage\n1 Mark')
    expect(['card-33', 'card-38', 'card-61', 'card-62'].map((id) => preset(id).name))
      .toEqual(['Chain Fire', 'Chain Fire V', 'Tracer Shot', 'High-Velocity Armor Piercing (HVAP) Round'])
    expect(preset('card-56').hits).toBe(6)
    expect(preset('card-57').pct).toBe(5)
  })

  it("Silver Shot's 100% and Dance of the Demon III's +50% count only on a play that hits a Weakness", () => {
    const b = archiveBuild()
    b.a.deck.push({ id: 'dd3', preset: 'card-54' })
    const r = run([{ cardId: 'auto:card-59' }, { cardId: 'auto:card-59', weakness: true }, { cardId: 'dd3' }, { cardId: 'dd3', weakness: true }], b)
    expect(r.plays[0].nonCrit).toBeCloseTo(0.6 * 35)
    // 60% x (1 + 100%) x Weakness DMG 125%
    expect(r.plays[1].nonCrit).toBeCloseTo(0.6 * 2 * 1.25 * 35)
    expect(r.plays[2].nonCrit).toBeCloseTo(0.5 * 35)
    expect(r.plays[3].nonCrit).toBeCloseTo((0.5 + 0.5) * 1.25 * 35)
    // An enemy weak to Order: on by itself
    b.a.rotation = [{ cardId: 'auto:card-59' }]
    const weak = computeBuild(PRESETS, 'Luke', b.a, settings, {}, { enemies: [{ defMult: 1, dr: 0, weakness: 'Order' }] })
    expect(weak.plays[0].nonCrit).toBeCloseTo(0.6 * 2 * 1.25 * 35)
  })

  it("Mark (Luke): an Attack Card play on a Marked target adds Luke's 100% Extra Attack", () => {
    const r = run([{ cardId: 'auto:card-61' }, { cardId: 'auto:card-58', stacks: { 'Mark (Luke)': 1 } }])
    expect(r.plays[0].triggered).toEqual([])
    expect(r.plays[1].triggered.map((t) => [t.card.name, t.nonCrit])).toEqual([['Mark', expect.closeTo(35)]])
    expect(r.plays[1].nonCrit).toBeCloseTo(0.85 * 35 + 35)
  })

  it('Dance of the Demon adds a hit per Bullet card (II: Attack Card) activated this turn; V has 6 hits', () => {
    const b = archiveBuild()
    b.a.deck.push({ id: 'dd', preset: 'card-51' }, { id: 'dd2', preset: 'card-53' }, { id: 'dd5', preset: 'card-56' })
    const r = run([{ cardId: 'dd' }, { cardId: 'dd', stacks: { 'Bullet cards activated this turn': 3 } },
      { cardId: 'dd2', stacks: { 'Attack Cards activated this turn': 2 } }, { cardId: 'dd5' }], b)
    expect(r.plays.map((p) => p.hits.length)).toEqual([1, 4, 3, 6])
    expect(r.plays[1].nonCrit).toBeCloseTo(4 * 0.5 * 35)
  })

  it('Lethal Design: 450% + 25% per card in hand; E3 550% + 35%', () => {
    const play = [{ cardId: 'auto:card-30', stacks: { 'Cards in hand': 4 } }]
    expect(run(play).plays[0].nonCrit).toBeCloseTo((4.5 + 4 * 0.25) * 35)
    expect(run(play, archiveBuild(3)).plays[0].nonCrit).toBeCloseTo((4.5 + 1 + 4 * 0.35) * 35)
  })

  it('Potentials 5-1 and 7 read Critical Chance; Chain Fire adds its Critical Chance', () => {
    const at = (critChance: number) => {
      const b = archiveBuild(0, true)
      b.a.stats.critChance = critChance
      b.a.deck.push({ id: 'ss', preset: 'card-31' })
      return run([{ cardId: 'auto:card-58' }, { cardId: 'ss' }, { cardId: 'cf' }], b)
    }
    // Below 40%: no 7; 5-1 +5% (+5% more from 20%)
    expect(at(0.39).plays[0].nonCrit).toBeCloseTo(0.85 * 35)
    expect(at(0.1).plays[1].nonCrit).toBeCloseTo(1.05 * 35)
    expect(at(0.2).plays[1].nonCrit).toBeCloseTo(1.1 * 35)
    // 50%: +3% + 2 x 2%; 100%: +3% + 12% max
    expect(at(0.5).plays[0].nonCrit).toBeCloseTo(0.92 * 35)
    expect(at(1).plays[0].nonCrit).toBeCloseTo(1 * 35)
    // Chain Fire: 3% + 50%, Critical Damage 125%
    const cf = at(0.03).plays[2]
    expect(cf.expected).toBeCloseTo(cf.nonCrit * (1 + 0.53 * 0.25))
  })

  it('E2 created bullets -50%; Target Analysis +10% per stack on Bullet cards, +15% from E6; E1 +50% Finisher Round', () => {
    const play = (stacks: Record<string, number>): RotationPlay[] => [{ cardId: 'auto:card-58', stacks }]
    expect(run(play({ 'Created by E2': 1 }), archiveBuild(2)).plays[0].nonCrit).toBeCloseTo(0.85 * 0.5 * 35)
    expect(run(play({ 'Target Analysis': 4 }), archiveBuild(4)).plays[0].nonCrit).toBeCloseTo((0.85 + 0.4) * 35)
    // E6: also E5's +3 Signature levels (x 1.06)
    expect(run(play({ 'Target Analysis': 5 }), archiveBuild(6)).plays[0].nonCrit).toBeCloseTo((0.85 * 1.06 + 0.6) * 35)
    const b = archiveBuild(1)
    b.a.deck.push({ id: 'fr', preset: 'card-57' })
    expect(run([{ cardId: 'fr' }], b).plays[0].nonCrit).toBeCloseTo((5 + 0.5) * 35)
  })
})
