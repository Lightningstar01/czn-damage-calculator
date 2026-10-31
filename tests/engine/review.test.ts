// Target Ravaged per play, Potential nodes, shared fights, owner's thresholds, warnings, card elements.
import { describe, expect, it } from 'vitest'
import { PRESETS } from '../../src/data/presets'
import { activeBuffs, presetBuffValue, presetStates } from '../../src/engine/buffs'
import { computeBuild, playCard } from '../../src/engine/calc'
import { withLinkedTeam } from '../../src/engine/team'
import type { Build, CardPreset, CharacterPreset, CharacterSave, Presets } from '../../src/engine/types'
import { newBuild, newCharacterSave, newStats, newTeammate } from '../../src/store/save'
import { addCards, card, plays, presets, setPlays, settings } from '../helpers'

/** Mei Lin with one Strike-like card, Attack 1000. */
function mei(ravaged = false) {
  const cs = newCharacterSave()
  const c = card('Test Card', '', 1, false, ravaged)
  addCards(cs, c)
  setPlays(cs, plays(c.id))
  const b = cs.builds[0]
  b.stats.attack = 1000
  return { cs, b, c }
}

describe('Target Ravaged per play', () => {
  it("the play's switch overrides the card's flag both ways; missing = the card's", () => {
    expect(playCard(card('A', '', 1), { cardId: 'a' }).targetRavaged).toBe(false)
    expect(playCard(card('A', '', 1), { cardId: 'a', ravaged: true }).targetRavaged).toBe(true)
    expect(playCard(card('On Ravage', '', 1, false, true), { cardId: 'a' }).targetRavaged).toBe(true)
    expect(playCard(card('On Ravage', '', 1, false, true), { cardId: 'a', ravaged: false }).targetRavaged).toBe(false)
  })

  it('Ember counts once the play has it on, and the Results warn while it does nothing', () => {
    const { cs, b } = mei()
    b.rotation[0].stacks = { Ember: 5 }
    const off = computeBuild(PRESETS, 'Mei Lin', cs, b, settings)
    expect(off.plays[0].ravaged).toBe(false)
    expect(off.plays[0].nonCrit).toBeCloseTo(350)
    expect(off.warnings.join()).toContain('Ember only counts on a Ravaged target')
    b.rotation[0].ravaged = true
    const on = computeBuild(PRESETS, 'Mei Lin', cs, b, settings)
    expect(on.plays[0].ravaged).toBe(true)
    // 100% + 5 x 30% Ember = 250%, x 1000 x 0.35
    expect(on.plays[0].nonCrit).toBeCloseTo(875)
    expect(on.warnings).toEqual([])
  })

  it('switching it off on an On Ravage card turns its Ravaged-only buffs off', () => {
    const { cs, b } = mei(true)
    b.rotation[0].stacks = { Ember: 1 }
    expect(computeBuild(PRESETS, 'Mei Lin', cs, b, settings).plays[0].nonCrit).toBeCloseTo(455)
    b.rotation[0].ravaged = false
    expect(computeBuild(PRESETS, 'Mei Lin', cs, b, settings).plays[0].nonCrit).toBeCloseTo(350)
  })

  it('a hit the play sets off is on the same Ravaged target', () => {
    const extra: CardPreset = { id: 'extra', base: 'Extra', name: 'Extra', cardType: 'Attack', pct: 1, hits: 1, text: '', notACard: true }
    const owner: CharacterPreset = { name: 'Owner', element: 'Passion', class: 'Striker', cards: [extra], triggers: [{ card: 'extra', on: 'ALL' }],
      effects: [{ kind: 'Buff', id: 'r', name: 'R', category: 'Character', value: '+100%', appliesTo: 'Extra', hitScope: 'All hits', condition: 'Ravaged only' }] }
    const test: Presets = { ...presets, characters: [...presets.characters, owner] }
    const cs = newCharacterSave()
    const c = card('Test Card', '', 1)
    addCards(cs, c)
    setPlays(cs, plays(c.id))
    cs.builds[0].stats.attack = 1000
    expect(computeBuild(test, 'Owner', cs, cs.builds[0], settings).plays[0].triggered[0].nonCrit).toBeCloseTo(350)
    cs.builds[0].rotation[0].ravaged = true
    expect(computeBuild(test, 'Owner', cs, cs.builds[0], settings).plays[0].triggered[0].nonCrit).toBeCloseTo(700)
    // A trigger card that's On Ravage by itself follows the play too: on by default, off when the play says off
    extra.targetRavaged = true
    delete cs.builds[0].rotation[0].ravaged
    expect(computeBuild(test, 'Owner', cs, cs.builds[0], settings).plays[0].triggered[0].nonCrit).toBeCloseTo(700)
    cs.builds[0].rotation[0].ravaged = false
    expect(computeBuild(test, 'Owner', cs, cs.builds[0], settings).plays[0].triggered[0].nonCrit).toBeCloseTo(350)
  })
})

describe('Potential nodes switch their effects', () => {

  it("a node that's off takes its buff away and hides it; missing = on", () => {
    const b = newBuild('x')
    b.stats.attack = 1000
    const state = () => presetStates(PRESETS, 'Mei Lin', b).find((s) => s.effect.id === 'p5-1-strike')!
    expect(state()).toMatchObject({ nodeLocked: false, stacks: 1 })
    b.potentialNodes = { '5-1': false }
    expect(state()).toMatchObject({ nodeLocked: true, stacks: 0 })
    expect(activeBuffs(PRESETS, 'Mei Lin', newCharacterSave(), b, settings).map((x) => x.label).join()).not.toContain('Basic Card Proficiency')
  })

  it('every Potential effect names its node', () => {
    const effects = PRESETS.characters.flatMap((c) => c.effects.filter((e) => e.category === 'Potential'))
    expect(effects.length).toBeGreaterThan(0)
    expect(effects.filter((e) => !e.node)).toEqual([])
  })

  it("a teammate's node follows their linked build", () => {
    const main = newBuild('main')
    const orlea = newCharacterSave()
    main.team = [{ ...newTeammate(), character: 'Orlea' }]
    const key = 'p7-crit'
    const crit = () => presetStates(PRESETS, 'Mei Lin', withLinkedTeam(main, { Orlea: orlea })).find((s) => s.effect.id === key)!
    expect(crit().stacks).toBe(1)
    orlea.builds[0].potentialNodes = { '7': false }
    expect(crit()).toMatchObject({ nodeLocked: true, stacks: 0 })
  })
})

describe('fights', () => {
  it('the same enemy for every team member, whatever their builds', () => {
    const { cs, b, c } = mei()
    const selena = newCharacterSave()
    selena.builds[0].stats.attack = 1000
    const fire = PRESETS.characters.find((x) => x.name === 'Selena')!.cards!.find((p) => p.category === 'Starting Card' && p.pct > 0)!
    b.team = [{ ...newTeammate(), character: 'Selena', cards: [fire.id] }]
    b.rotation = [{ cardId: c.id }, { cardId: fire.id, by: 0 }]
    const saves: Record<string, CharacterSave> = { 'Mei Lin': cs, Selena: selena }
    const free = computeBuild(PRESETS, 'Mei Lin', cs, b, settings, saves)
    const hard = computeBuild(PRESETS, 'Mei Lin', cs, b, settings, saves, { enemies: [{ defMult: 0.5, dr: 0.2 }] })
    expect(hard.plays[0].hits[0].enemyDef?.value).toBe(0.5)
    expect(hard.plays[1].hits[0].enemyDef?.value).toBe(0.5)
    expect(hard.plays[0].nonCrit).toBeCloseTo(free.plays[0].nonCrit * 0.4)
    expect(hard.plays[1].nonCrit).toBeCloseTo(free.plays[1].nonCrit * 0.4)
  })

  it('without a fight there are no enemy modifiers', () => {
    const { cs, b } = mei()
    const hit = computeBuild(PRESETS, 'Mei Lin', cs, b, settings).plays[0].hits[0]
    expect(hit.enemyDef).toBeNull()
    expect(hit.enemyDr).toBeNull()
  })
})

describe("thresholds read the effect owner's stats", () => {
  const buff = { kind: 'Buff', id: 'gift', name: 'Gift', category: 'Character', target: 'allies', value: '+10%', appliesTo: 'ALL', hitScope: 'All hits', condition: 'Always',
    thresholdBonus: { above: 500, value: '+40%', orEqual: true } } as const
  const giver: CharacterPreset = { name: 'Giver', element: 'Passion', class: 'Striker', effects: [buff] }
  const test: Presets = { ...presets, characters: [...presets.characters, giver] }

  it('presetBuffValue: without stats no threshold is met', () => {
    expect(presetBuffValue(buff, undefined)).toEqual({ value: 0.1, bonus: false })
    expect(presetBuffValue({ ...buff, thresholdMin: 1 }, undefined).value).toBe(0)
    expect(presetBuffValue(buff, { ...newStats(), attack: 500 }).value).toBeCloseTo(0.5)
  })

  it("a teammate's ally buff reads the teammate's Attack, not the receiver's", () => {
    const main = newBuild('main')
    main.stats.attack = 1000
    const givers = newCharacterSave()
    givers.builds[0].stats.attack = 100
    main.team = [{ ...newTeammate(), character: 'Giver' }]
    const value = (saves: Record<string, CharacterSave>) => activeBuffs(test, 'Mei Lin', newCharacterSave(), withLinkedTeam(main, saves), settings)
      .find((b) => b.label.includes('Gift'))!.value
    expect(value({ Giver: givers })).toBeCloseTo(0.1)
    givers.builds[0].stats.attack = 600
    expect(value({ Giver: givers })).toBeCloseTo(0.5)
    // Not linked: their stats aren't known
    expect(value({})).toBeCloseTo(0.1)
  })

  it("a teammate's play reads the main character's Attack for the main character's ally buff", () => {
    const giverSave = newCharacterSave()
    giverSave.builds[0].stats.attack = 900
    const mate = newCharacterSave()
    mate.builds[0].stats.attack = 100
    const c = PRESETS.characters.find((x) => x.name === 'Selena')!.cards!.find((p) => p.category === 'Starting Card' && p.pct > 0)!
    const b = giverSave.builds[0]
    b.team = [{ ...newTeammate(), character: 'Selena', cards: [c.id] }]
    b.rotation = [{ cardId: c.id, by: 0 }]
    const r = computeBuild(test, 'Giver', giverSave, b, settings, { Giver: giverSave, Selena: mate })
    const gift = r.plays[0].hits[0].additive.sources.find((s) => s.label.includes('Gift'))
    expect(gift?.value).toBeCloseTo(0.5)
  })
})

describe('warnings', () => {
  it('a deck card, partner or set the presets lost is named instead of silently dropped', () => {
    const { cs, b } = mei()
    expect(computeBuild(PRESETS, 'Mei Lin', cs, b, settings).warnings).toEqual([])
    b.deck.push({ id: 'old', preset: 'card-0' })
    b.partner = 'Nobody'
    b.fragments = ['No Such Set', '', '']
    b.rotation.push({ cardId: 'old' })
    const w = computeBuild(PRESETS, 'Mei Lin', cs, b, settings).warnings.join(' | ')
    expect(w).toContain('card-0')
    expect(w).toContain('Nobody')
    expect(w).toContain('No Such Set')
    expect(w).toContain('Play 2')
  })

  it('a linked teammate with an empty stats screen is pointed out when they play', () => {
    const { cs, b } = mei()
    const fire = PRESETS.characters.find((x) => x.name === 'Selena')!.cards!.find((p) => p.category === 'Starting Card' && p.pct > 0)!
    b.team = [{ ...newTeammate(), character: 'Selena', cards: [fire.id] }]
    b.rotation = [{ cardId: fire.id, by: 0 }]
    const r = computeBuild(PRESETS, 'Mei Lin', cs, b, settings, { Selena: newCharacterSave() })
    expect(r.warnings.join()).toContain('no Attack')
  })

  it("the same goes when they don't play but their trigger fires; no warning while it doesn't", () => {
    const { cs, b } = mei()
    b.team = [{ ...newTeammate(), character: 'Selena' }]
    const compute = () => computeBuild(PRESETS, 'Mei Lin', cs, b, settings, { Selena: newCharacterSave() }).warnings.join()
    expect(compute()).not.toContain('no Attack')
    b.rotation[0].stacks = { Mark: 1 }
    expect(compute()).toContain('no Attack')
  })

  it('a warning that comes up twice shows once', () => {
    const { cs, b } = mei()
    b.fragments = ['No Such Set', 'No Such Set', '']
    expect(computeBuild(PRESETS, 'Mei Lin', cs, b, settings).warnings.filter((w) => w.includes('No Such Set'))).toHaveLength(1)
  })
})

describe('a computed team stays out of saves', () => {
  it("a teammate with live stats can't be assigned into a saved build", () => {
    const main = newBuild('main')
    main.team = [{ ...newTeammate(), character: 'Orlea' }]
    const live = withLinkedTeam(main, { Orlea: newCharacterSave() })
    expect(live.team[0].live?.stats).toBeDefined()
    // @ts-expect-error the save type has no room for a computed team (checked by npm run build)
    const saved: Build = live
    expect(saved).toBe(live)
    expect(main.team[0].live).toBeUndefined()
  })
})

describe('elemental damage follows the card', () => {
  it("a card of another element reads that element's stat, without the character's boosts", () => {
    const { cs, b } = mei()
    const other = { ...card('Other', '', 1), element: 'Order' as const }
    addCards(cs, other)
    setPlays(cs, plays(b.deck[0].id, other.id))
    b.stats.elemDmg.Passion = 0.5
    b.stats.elemDmg.Order = 0.2
    const r = computeBuild(PRESETS, 'Mei Lin', cs, b, settings)
    expect(r.plays[0].hits[0].elemDmg?.value).toBeCloseTo(1.5)
    expect(r.plays[1].hits[0].elemDmg?.value).toBeCloseTo(1.2)
    expect(r.stats.elemDmg.value).toBeCloseTo(0.5)
  })
})
