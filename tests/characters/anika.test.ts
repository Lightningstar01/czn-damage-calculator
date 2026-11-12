import { describe, expect, it } from 'vitest'
import { computeBuild, shownPct } from '../../src/engine/calc'
import { renderCardText } from '../../src/engine/cardText'
import { activeBuffs } from '../../src/engine/buffs'
import { PRESETS } from '../../src/data/presets'
import { newCharacterSave, newTeammate } from '../../src/store/save'
import { type Build, type CharacterSave, type RotationPlay } from '../../src/engine/types'
import { cardFromPreset, settings } from '../helpers'

describe('Anika', () => {
  const anika = PRESETS.characters.find((c) => c.name === 'Anika')!
  const preset = (id: string) => anika.cards!.find((p) => p.id === id)!
  // Owner's screenshots (2026-11-01): Attack 817, E2, Basic 1/10, Signature 7/10, 3-1 and 7 unlocked, 5-1 locked
  const ownerBuild = () => {
    const cs = newCharacterSave()
    const [a] = cs.builds
    Object.assign(a, { egoLevel: 2, basicLevel: 1, signatureLevel: 7, potentialNodes: { '5-1': false } })
    Object.assign(a.stats, { attack: 817, defense: 236, health: 641, critChance: 0.369, critDmg: 1.589, extraDmg: 0.153 })
    return { cs, a }
  }
  const UNIT = 817 * 0.35
  const play = (id: string, stacks: RotationPlay['stacks'] = {}, change: (a: Build) => void = () => {}, ravaged?: boolean) => {
    const { a } = ownerBuild()
    a.deck.push({ id: 'c', preset: id })
    change(a)
    a.rotation = [{ cardId: 'c', stacks, ravaged }]
    return computeBuild(PRESETS, 'Anika', a, settings).plays[0]
  }
  const damage = (id: string, stacks: RotationPlay['stacks'] = {}, change: (a: Build) => void = () => {}, ravaged?: boolean) =>
    play(id, stacks, change, ravaged).nonCrit
  const pick = (id: string) => (a: Build) => a.deck.push({ id: 'p', preset: id })
  const text = (id: string, change: (a: Build) => void = () => {}) => {
    const { a } = ownerBuild()
    change(a)
    const p = preset(id)
    const c = cardFromPreset(p, 'Order')
    const buffs = activeBuffs(PRESETS, 'Anika', a, settings)
    return renderCardText(p.text, { egoLevel: a.egoLevel, nodeOn: (n) => a.potentialNodes?.[n] !== false, pct: (base, fixed) => shownPct(base, c, a, anika, buffs, settings, fixed) })
  }

  it("card text matches the owner's in-game screenshots", () => {
    expect(text('card-1352')).toBe('250% Damage to all enemies\n2 Tenacity Damage')
    expect(text('card-1353')).toBe('[Lead]\n102% Damage')
    expect(text('card-1354')).toBe('[Lead]\n102% Shield')
    expect(text('card-1355')).toBe('[Lead]\n456% Damage\n2 Tenacity Damage\nEfficiency: Gain 1 AP')
    expect(text('card-1356')).toContain('627% Damage')
    expect(text('card-1357')).toContain('513% Damage')
    expect(text('card-1358')).toContain('570% Damage')
    expect(text('card-1359')).toContain('456% Damage')
    expect(text('card-1360')).toContain('100% Coordinated Attack')
    expect(text('card-1361')).toBe('[Bullet / Lead]\n171% Damage\n1 Shockwave\nEfficiency: 1 Tenacity Damage')
    expect(text('card-1362')).toContain('251% Damage')
    expect(text('card-1363')).toContain('228% Damage to all enemies')
    expect(text('card-1364')).toContain('171% Damage')
    expect(text('card-1366')).toContain('228% Damage')
    expect(text('card-1379')).toBe('[Weakness Attack]\n114% Damage × 4\nOn Ravage, move from Draw Pile to hand\nDestroy: +100% Damage Amount')
    expect(preset('card-1358').cost).toBe(3)
    expect(preset('card-1360').cardType).toBe('Upgrade')
    expect(preset('card-1365').cardType).toBe('Skill')
    expect(preset('card-1370').cardType).toBe('Upgrade')
    expect(preset('card-1377').cost).toBe(2)
  })

  it('node 3-1 adds Lead to the Basic cards, and E1 and E4 change the text', () => {
    const nodeOff = (a: Build) => { a.potentialNodes = { '3-1': false, '5-1': false } }
    expect(text('card-1353', nodeOff)).toBe('102% Damage')
    expect(preset('card-1353').nodeTags).toEqual({ '3-1': 'Lead' })
    expect(text('card-1379', (a) => { a.egoLevel = 0 })).not.toContain('On Ravage')
    expect(text('card-1352', (a) => { a.egoLevel = 4 })).toBe('300% Damage to all enemies\n3 Tenacity Damage')
  })

  it('node 5-1 adds to Blaster Swing\'s shown %, with +10% more from Attack 250', () => {
    const on = (attack: number) => (a: Build) => {
      a.potentialNodes = {}
      a.stats.attack = attack
    }
    expect(text('card-1353', on(249))).toContain('107% Damage') // (100% + 5%) x 1.02
    expect(text('card-1353', on(250))).toContain('117% Damage') // (100% + 15%) x 1.02
  })

  it('node 7 adds nothing: its +10% Attack is on the stats screen', () => {
    expect(damage('card-1353')).toBeCloseTo(1.02 * UNIT)
  })

  it('Rampage Trigger hits 4 times, with Destroy on each hit of a Ravaged target', () => {
    const weak = 1.25
    expect(damage('card-1379')).toBeCloseTo(1.14 * weak * UNIT * 4)
    expect(damage('card-1379', {}, () => {}, true)).toBeCloseTo((1.14 + 1) * weak * UNIT * 4)
  })

  it('Shockwave: a flat +50% on a Ravaged target only', () => {
    expect(damage('card-1361', { Shockwave: 1 })).toBeCloseTo(1.71 * UNIT)
    expect(damage('card-1361', { Shockwave: 1 }, () => {}, true)).toBeCloseTo((1.71 + 0.5) * UNIT)
    expect(damage('card-1361', { Shockwave: 3 }, () => {}, true)).toBeCloseTo((1.71 + 0.5) * UNIT)
  })

  it('Stampede: +10% per stack on her own Attack Cards, max 5, from E2; not on her Ego skill', () => {
    expect(damage('card-1353', { Stampede: 1 })).toBeCloseTo((1.02 + 0.1) * UNIT)
    expect(damage('card-1353', { Stampede: 9 })).toBeCloseTo((1.02 + 0.5) * UNIT)
    expect(damage('card-1353', { Stampede: 5 }, (a) => { a.egoLevel = 1 })).toBeCloseTo(1.02 * UNIT)
    const { a } = ownerBuild()
    a.rotation = [{ cardId: 'auto:card-1352', stacks: { Stampede: 5 } }]
    expect(computeBuild(PRESETS, 'Anika', a, settings).plays[0].nonCrit).toBeCloseTo(2.5 * UNIT)
  })

  it('E4 adds 50% to the Ego skill', () => {
    const { a } = ownerBuild()
    a.egoLevel = 4
    a.rotation = [{ cardId: 'auto:card-1352' }]
    expect(computeBuild(PRESETS, 'Anika', a, settings).plays[0].nonCrit).toBeCloseTo(3 * UNIT)
  })

  // A teammate's Basic Attack in Anika's team, with Ignition Slash V in her deck
  const withMate = (stacks: RotationPlay['stacks'], ravaged?: boolean) => {
    const { cs, a } = ownerBuild()
    a.deck.push({ id: 'v', preset: 'card-1360' })
    const mate = newCharacterSave()
    mate.builds[0].stats.attack = 1000
    const selena = PRESETS.characters.find((x) => x.name === 'Selena')!
    const basic = selena.cards!.find((p) => p.tags?.includes('Basic Attack'))!
    a.team = [{ ...newTeammate(), character: 'Selena', cards: [basic.id] }]
    a.rotation = [{ cardId: basic.id, by: 0, stacks, ravaged }]
    const saves: Record<string, CharacterSave> = { Anika: cs, Selena: mate }
    return { result: computeBuild(PRESETS, 'Anika', a, settings, saves).plays[0], basic }
  }

  it("Ignition Slash V's Coordinated Attack goes off on anyone's Basic Attack, unraised, as an Extra Attack", () => {
    const hit = 1 * UNIT * 1.153
    const own = play('card-1353', {}, pick('card-1360'))
    expect(own.triggered.map((t) => t.nonCrit)).toEqual([expect.closeTo(hit)])
    // Other cards don't set it off, and Stampede (Attack Cards) doesn't raise the hit
    expect(play('card-1361', {}, pick('card-1360')).triggered).toEqual([])
    const stampede = play('card-1353', { Stampede: 5 }, pick('card-1360'))
    expect(stampede.triggered[0].nonCrit).toBeCloseTo(hit)
    expect(withMate({}).result.triggered.map((t) => t.nonCrit)).toEqual([expect.closeTo(hit)])
  })

  it("Stampede and Shockwave reach a teammate's plays at the allies' numbers", () => {
    const base = withMate({}).result.nonCrit
    const unit = 1000 * 0.35
    const stampede = withMate({ Stampede: 5 }).result.nonCrit
    expect(stampede - base).toBeCloseTo(0.25 * unit)
    const shockwave = withMate({ Shockwave: 1 }, true).result.nonCrit
    // On the teammate's hit and on the Coordinated Attack it sets off (Anika's stats)
    expect(shockwave - withMate({}, true).result.nonCrit).toBeCloseTo(0.5 * unit + 0.5 * UNIT * 1.153)
  })

  it('Ignition Slash III adds +80% per Lead card in All Piles', () => {
    expect(damage('card-1358', { 'Lead cards in All Piles': 4 })).toBeCloseTo((5.7 + 3.2) * UNIT)
  })

  it("Warming Up II: by 50% (100% with Efficiency) on her base 2-Cost or higher Attack Cards; IV: by 25% per Attack Card in hand", () => {
    const ii = 'Warming Up II (2 with Efficiency)'
    expect(damage('card-1355', { [ii]: 1 }, pick('card-1375'))).toBeCloseTo(4.56 * 1.5 * UNIT)
    expect(damage('card-1355', { [ii]: 2 }, pick('card-1375'))).toBeCloseTo(4.56 * 2 * UNIT)
    expect(damage('card-1361', { [ii]: 2 }, pick('card-1375'))).toBeCloseTo(1.71 * UNIT)
    expect(damage('card-1361', { 'Warming Up IV: Attack Cards in hand': 3 }, pick('card-1377'))).toBeCloseTo(1.71 * 1.75 * UNIT)
  })
})
