import { describe, expect, it } from 'vitest'
import { computeBuild, shownPct } from '../../src/engine/calc'
import { renderCardText } from '../../src/engine/cardText'
import { activeBuffs } from '../../src/engine/buffs'
import { PRESETS } from '../../src/data/presets'
import { newCharacterSave } from '../../src/store/save'
import { cardFromPreset, settings } from '../helpers'

describe('Lucas', () => {
  const lucas = PRESETS.characters.find((c) => c.name === 'Lucas')!
  const preset = (id: string) => lucas.cards!.find((p) => p.id === id)!
  // Owner's screenshots (2026-11-01): E6, Basic and Unique 6/16 (0 + 6 from E3 and E5: x1.12), 3-1, 5-1 and 7 locked
  const ownerBuild = () => {
    const cs = newCharacterSave()
    const [a] = cs.builds
    Object.assign(a, { egoLevel: 6, potentialNodes: { '3-1': false, '5-1': false, 7: false } })
    Object.assign(a.stats, { attack: 100, critChance: 0.03, critDmg: 1.25, weaknessDmg: 1.25 })
    return { cs, a }
  }
  const up = 1.12
  const atk = 100 * 0.35
  const run = (cs: ReturnType<typeof newCharacterSave>, a: ReturnType<typeof ownerBuild>['a']) => computeBuild(PRESETS, 'Lucas', cs, a, settings)

  it("card text matches the owner's in-game screenshots", () => {
    const { cs, a } = ownerBuild()
    const text = (id: string) => {
      const p = preset(id)
      const c = cardFromPreset(p, 'Passion')
      const buffs = activeBuffs(PRESETS, 'Lucas', cs, a, settings)
      return renderCardText(p.text, { egoLevel: a.egoLevel, nodeOn: () => false, pct: (base, fixed) => shownPct(base, c, a, lucas, buffs, settings, fixed) })
    }
    expect(text('card-275')).toBe('Draw 3\n300% Damage to all enemies')
    expect(text('card-276')).toBe('112% Damage')
    expect(text('card-277')).toBe('112% Shield')
    expect(text('card-278')).toBe('[Lead]\nAt the start of the turn, create 1 Launcher Bullet')
    expect(text('card-283')).toBe('[Exhaust]\nCreate 5 Launcher Bullet')
    expect(text('card-284')).toBe('112% Damage\nFor 1 turn, +40% Bullet card Damage')
    expect(text('card-285')).toContain('224% Damage')
    expect(text('card-287')).toBe('168% Damage\n+60% Damage per Bullet card in hand')
    expect(text('card-288')).toContain('168% Damage')
    expect(text('card-289')).toBe('112% Damage\nFor 1 turn(s), when a Bullet card is activated, 50% Fixed Damage to a random enemy')
    expect(text('card-290')).toBe('202% Damage to all enemies\nDraw 1\nDiscard 1')
    expect(text('card-292')).toContain('353% Damage')
    expect(text('card-293')).toBe('302% Damage to all enemies\nOn Critical Hit, 168% Damage to all enemies')
    expect(text('card-294')).toContain('302% Damage to all enemies')
    expect(text('card-296')).toBe('134% Damage to all enemies\n2 Weaken\nIf the target has Shield, +50% Damage')
    expect(text('card-297')).toContain('202% Damage')
    expect(text('card-302')).toBe('When Bullet cards are Exhausted, 50% Fixed Damage')
    expect(text('card-303')).toBe('[Exhaust / Ephemeral / Bullet]\n157% Damage\n78% Damage to another enemy\nIf the target has Shield, +30% Damage Amount')
    expect(text('card-306')).toBe('[Exhaust / Ephemeral / Bullet / Haste]\n157% Damage\n78% Damage to another enemy\nIncreases Action Count of all enemies by 1')
  })

  it("Extended Magazine brings the Launcher Bullets; E2's +20% and S.S.S's +40% are additive, per S.S.S played", () => {
    const { cs, a } = ownerBuild()
    a.deck.push({ id: 'em', preset: 'card-278' }, { id: 's', preset: 'card-284' })
    a.rotation = [{ cardId: 'auto:card-307' }, { cardId: 'auto:card-307', stacks: { 'S.S.S': 2 } }]
    const r = run(cs, a)
    expect(r.plays[0].nonCrit).toBeCloseTo((1.4 * up + 0.2) * atk)
    expect(r.plays[1].nonCrit).toBeCloseTo((1.4 * up + 0.2 + 0.8) * atk)
  })

  it('Machine Gun is a Bullet card only while 3-1 is on', () => {
    const { cs, a } = ownerBuild()
    a.deck.push({ id: 'mg', preset: 'card-276' }, { id: 's', preset: 'card-284' })
    a.rotation = [{ cardId: 'mg', stacks: { 'S.S.S': 1 } }]
    expect(run(cs, a).plays[0].nonCrit).toBeCloseTo(up * atk)
    a.potentialNodes!['3-1'] = true
    expect(run(cs, a).plays[0].nonCrit).toBeCloseTo((up + 0.2 + 0.4) * atk)
  })

  it('5-1 and 7 add before the upgrade, with more at Critical Damage 160% and 240%', () => {
    const { cs, a } = ownerBuild()
    a.potentialNodes = { '3-1': false }
    a.deck.push({ id: 'mg', preset: 'card-276' }, { id: 'em', preset: 'card-278' })
    a.rotation = [{ cardId: 'mg' }, { cardId: 'auto:card-304' }]
    let r = run(cs, a)
    expect(r.plays[0].nonCrit).toBeCloseTo(1.05 * up * atk)
    expect(r.plays[1].nonCrit).toBeCloseTo((1.45 * up + 0.2) * atk)
    a.stats.critDmg = 1.6
    r = run(cs, a)
    expect(r.plays[0].nonCrit).toBeCloseTo(1.1 * up * atk)
    expect(r.plays[1].nonCrit).toBeCloseTo((1.45 * up + 0.2) * atk)
    a.stats.critDmg = 2.4
    expect(run(cs, a).plays[1].nonCrit).toBeCloseTo((1.5 * up + 0.2) * atk)
  })

  it('R.P.G-7: Fixed damage per Bullet played, per Bullet Flame Thrower IV exhausts and per Bullet Ephemeral exhausts', () => {
    const { cs, a } = ownerBuild()
    a.potentialNodes!['3-1'] = true
    a.deck.push({ id: 'rpg', preset: 'card-302' }, { id: 'em', preset: 'card-278' }, { id: 'ft', preset: 'card-294' }, { id: 'mg', preset: 'card-276' })
    a.rotation = [
      { cardId: 'auto:card-307' }, { cardId: 'ft', stacks: { 'Bullets Exhausted': 2 } },
      { cardId: 'mg' }, { cardId: 'mg', stacks: { 'Bullets exhausted by Ephemeral': 3 } },
    ]
    const r = run(cs, a)
    const fixed = (i: number) => r.plays[i].triggered.reduce((n, t) => n + t.expected, 0)
    expect(fixed(0)).toBeCloseTo(0.5 * atk)
    expect(fixed(1)).toBeCloseTo(2 * 0.5 * atk)
    // Machine Gun with 3-1 has Bullet but not Exhaust
    expect(fixed(2)).toBe(0)
    expect(fixed(3)).toBeCloseTo(3 * 0.5 * atk)
    a.egoLevel = 0
    a.rotation = [{ cardId: 'mg', stacks: { 'Bullets exhausted by Ephemeral': 1 } }]
    expect(run(cs, a).plays[0].triggered[0].expected).toBeCloseTo(0.4 * atk)
  })

  it('Flame Thrower III: the Critical Hit counts x the crit chance in expected damage, in full on a crit, not without', () => {
    const { cs, a } = ownerBuild()
    a.deck.push({ id: 'ft', preset: 'card-293' })
    a.rotation = [{ cardId: 'ft' }]
    const p = run(cs, a).plays[0]
    const avg = 1 + 0.03 * 0.25
    expect(p.triggered[0].chance).toBeCloseTo(0.03)
    expect(p.nonCrit).toBeCloseTo(2.7 * up * atk)
    expect(p.crit).toBeCloseTo((2.7 + 1.5) * up * atk * 1.25)
    expect(p.expected).toBeCloseTo(2.7 * up * atk * avg + 0.03 * 1.5 * up * atk * avg)
    // A play set to 0 hits can't crit, so no Critical Hit damage either; the trigger's hits take no hit number in the list
    expect(p.triggered[0].hits[0].globalHit).toBe(0)
    a.rotation = [{ cardId: 'ft', hits: 0 }]
    const none = run(cs, a).plays[0]
    expect(none.triggered).toEqual([])
    expect(none.crit).toBe(0)
  })

  it('Flame Thrower IV raises its card %: 302% to 604% with 2 Bullets, no more than 2', () => {
    const { cs, a } = ownerBuild()
    a.deck.push({ id: 'ft', preset: 'card-294' })
    a.rotation = [{ cardId: 'ft' }, { cardId: 'ft', stacks: { 'Bullets Exhausted': 2 } }, { cardId: 'ft', stacks: { 'Bullets Exhausted': 5 } }]
    const r = run(cs, a)
    expect(r.plays[0].nonCrit).toBeCloseTo(2.7 * up * atk)
    expect(r.plays[1].nonCrit).toBeCloseTo(2.7 * up * 2 * atk)
    expect(r.plays[2].nonCrit).toBeCloseTo(2.7 * up * 2 * atk)
  })

  it('S.S.S: III per Bullet in hand, IV on the next Bullet, V adds Fixed damage to Bullet plays', () => {
    const { cs, a } = ownerBuild()
    a.deck.push({ id: 's3', preset: 'card-287' }, { id: 's4', preset: 'card-288' }, { id: 's5', preset: 'card-289' }, { id: 'em', preset: 'card-278' })
    a.rotation = [{ cardId: 's3', stacks: { 'Bullet cards in hand': 3 } }, { cardId: 'auto:card-305', stacks: { 'S.S.S IV': 1 } }, { cardId: 'auto:card-305', stacks: { 'S.S.S V': 1 } }, { cardId: 's4', stacks: { 'S.S.S V': 1 } }]
    const r = run(cs, a)
    expect(r.plays[0].nonCrit).toBeCloseTo((1.5 * up + 1.8) * atk)
    expect(r.plays[1].nonCrit).toBeCloseTo((1.4 * up + 0.2 + 1.2) * atk)
    expect(r.plays[2].triggered[0].expected).toBeCloseTo(0.5 * atk)
    expect(r.plays[3].triggered).toEqual([])
  })

  it('Flashbang: Shield buffs per play, V multiplies and II adds on all Lucas hits, III applies Passion Weakness', () => {
    const { cs, a } = ownerBuild()
    a.deck.push({ id: 'f0', preset: 'card-296' }, { id: 'f2', preset: 'card-298' }, { id: 'f3', preset: 'card-299' }, { id: 'f5', preset: 'card-301' }, { id: 'mg', preset: 'card-276' })
    a.rotation = [
      { cardId: 'f0', stacks: { 'Target has Shield': 1 } }, { cardId: 'mg', stacks: { 'Target has Shield': 1 } },
      { cardId: 'mg', stacks: { 'Flashbang II on a Shield target': 1 } }, { cardId: 'f3', stacks: { 'Passion Weakness': 1 } },
    ]
    const r = run(cs, a)
    expect(r.plays[0].nonCrit).toBeCloseTo((1.2 * up * 1.3 + 0.5) * atk)
    expect(r.plays[1].nonCrit).toBeCloseTo(up * 1.3 * atk)
    expect(r.plays[2].nonCrit).toBeCloseTo((up + 0.5) * atk)
    expect(r.plays[3].nonCrit).toBeCloseTo(1.8 * up * 1.25 * atk)
  })

  it("Flashbang IV's Mark is Lucas's own 100% Extra Attack, apart from Selena's", () => {
    const { cs, a } = ownerBuild()
    a.deck.push({ id: 'f4', preset: 'card-300' }, { id: 'mg', preset: 'card-276' })
    a.rotation = [{ cardId: 'mg' }, { cardId: 'mg', stacks: { 'Mark (Lucas)': 1 } }, { cardId: 'mg', stacks: { Mark: 1 } }]
    const r = run(cs, a)
    expect(r.plays[0].triggered).toEqual([])
    expect(r.plays[1].triggered[0].nonCrit).toBeCloseTo(atk)
    expect(r.plays[2].triggered).toEqual([])
  })

  it('S.S.S I / II add +40% to Bullet plays; Flashbang I / IV and Armor-Piercing Rounds add on a Shield target; E4 raises Full Burst', () => {
    const { cs, a } = ownerBuild()
    a.deck.push({ id: 's1', preset: 'card-285' }, { id: 's2', preset: 'card-286' }, { id: 'em', preset: 'card-278' },
      { id: 'f1', preset: 'card-297' }, { id: 'f4', preset: 'card-300' }, { id: 'fb', preset: 'card-275' })
    const shield = { 'Target has Shield': 1 }
    a.rotation = [
      { cardId: 'auto:card-307', stacks: { 'S.S.S I': 1 } }, { cardId: 'auto:card-307', stacks: { 'S.S.S II': 1 } },
      { cardId: 'f1', stacks: shield }, { cardId: 'f4', stacks: shield }, { cardId: 'auto:card-303', stacks: shield }, { cardId: 'auto:card-303' },
      { cardId: 'fb' },
    ]
    const r = run(cs, a)
    expect(r.plays[0].nonCrit).toBeCloseTo((1.4 * up + 0.2 + 0.4) * atk)
    expect(r.plays[1].nonCrit).toBeCloseTo((1.4 * up + 0.2 + 0.4) * atk)
    expect(r.plays[2].nonCrit).toBeCloseTo((1.8 * up + 0.75) * atk)
    expect(r.plays[3].nonCrit).toBeCloseTo((1.8 * up + 0.5) * atk)
    expect(r.plays[4].nonCrit).toBeCloseTo((1.4 * up + 0.2 + 0.3) * atk)
    expect(r.plays[5].nonCrit).toBeCloseTo((1.4 * up + 0.2) * atk)
    // An Ego skill has no upgrade: 250% + 50%
    expect(r.plays[6].nonCrit).toBeCloseTo(3 * atk)
  })
})
