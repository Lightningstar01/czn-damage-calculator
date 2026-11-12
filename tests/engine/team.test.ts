import { describe, expect, it } from 'vitest'
import { computeBuild } from '../../src/engine/calc'
import { AUTO, changeTeammateEpiphany, pruneTeamPlays } from '../../src/engine/deck'
import { deletedLinks, withLinkedTeam } from '../../src/engine/team'
import { PRESETS } from '../../src/data/presets'
import { produce } from 'immer'
import { newCharacterSave, newTeammate } from '../../src/store/save'
import { NO_BUILD, type Presets } from '../../src/engine/types'
import { addCards, card, plays, presets, settings } from '../helpers'

describe('linked teammates', () => {
  // A character with a card from a Manifest Ego level (Narja E6, Rossweisse E2): a linked teammate has it at their build's level
  const ch = PRESETS.characters.find((c) => c.cards?.some((p) => p.egoLevel !== undefined))!
  const egoCard = ch.cards!.find((p) => p.egoLevel !== undefined)!
  const saves = () => {
    const theirs = newCharacterSave()
    theirs.builds[0].egoLevel = egoCard.egoLevel!
    const mine = newCharacterSave()
    mine.builds[0].team = [{ ...newTeammate(), character: ch.name, build: theirs.builds[0].id }]
    mine.builds[0].rotation = [{ cardId: `auto:${egoCard.id}`, by: 0 }]
    return { [ch.name]: theirs, Me: mine }
  }

  it("keep their plays of their linked build's Manifest Ego cards", () => {
    const s = saves()
    const kept = produce(s.Me.builds[0], (b) => pruneTeamPlays(ch, b, 0, s))
    expect(kept.rotation).toHaveLength(1)
    expect(produce(s.Me.builds[0], (b) => pruneTeamPlays(ch, b, 0)).rotation).toHaveLength(0)
  })

  it('a link to a deleted build uses their active build, with a warning', () => {
    const s = saves()
    s[ch.name].builds[0].id = 'renamed'
    s[ch.name].activeBuild = 'renamed'
    expect(deletedLinks(s.Me.builds[0], s)).toEqual([`${ch.name}'s linked build was deleted, so their active build (Build A) is used. Pick one on Setup › Team.`])
    expect(withLinkedTeam(s.Me.builds[0], s).team[0].egoLevel).toBe(egoCard.egoLevel)
  })
})

describe('team', () => {
  const buff = (id: string, value: string, extra: object = {}) => ({ kind: 'Buff' as const, id, name: id, category: 'Character' as const,
    value, appliesTo: 'ALL', hitScope: 'All hits' as const, condition: 'Always' as const, ...extra })
  const teamPresets: Presets = {
    ...presets,
    characters: [...presets.characters, {
      name: 'Helper', element: 'Void', class: 'Controller', effects: [
        buff('own', '+50%'),
        buff('ally', '+20%', { target: 'allies' }),
        buff('e2', '+10%', { target: 'allies', egoLevel: 2 }),
        { kind: 'Stat', id: 'atk', name: 'Attack', category: 'Character', stat: 'ATK%', value: '10%', target: 'allies', onStatsScreen: true },
      ],
      cards: [{ id: 'h-1', base: 'Help', name: 'Help', cardType: 'Skill', pct: 0, hits: 0, text: '',
        effects: [buff('taken', '+100%', { target: 'enemy', category: 'Card Epiphany' }), buff('self', '+40%', { category: 'Card Epiphany' })] }],
    }],
    partners: [...presets.partners, { name: 'Buddy', class: 'Controller', baseHp: 0, baseDef: 0, baseAtk: 0, effects: [
      buff('pego', '30%', { target: 'allies', category: 'Partner Ego Skill', classLimited: true }),
    ] }],
  }
  const setup = () => {
    const cs = newCharacterSave()
    const [a] = cs.builds
    a.stats.attack = 1000
    const x = card('X', '', 1)
    addCards(cs, x)
    a.rotation = plays(x.id)
    a.team = [{ character: 'Helper', egoLevel: 0, partner: 'Buddy', fragments: ['', '', ''], cards: [] }]
    const run = () => computeBuild(teamPresets, 'Testy', a, settings)
    return { cs, a, run }
  }

  it("only a teammate's ally and enemy effects count; class limits use the teammate's class", () => {
    const { a, run } = setup()
    // +20% ally (additive), ATK +10% (an ally stat isn't on the main's stats screen), Buddy's 30% (Controller = Controller)
    expect(run().plays[0].hits[0].cardMult).toBeCloseTo(1.3 + 0.2)
    expect(run().stats.atk.value).toBeCloseTo(1100)
    a.team[0].egoLevel = 2
    expect(run().plays[0].hits[0].cardMult).toBeCloseTo(1.3 + 0.3)
    a.team[0].cards = ['h-1']
    // The picked card's enemy debuff counts, its self buff doesn't
    expect(run().plays[0].hits[0].cardMult).toBeCloseTo(1.3 + 1.3)
    a.presetSwitches['Helper>Help|taken'] = false
    expect(run().plays[0].hits[0].cardMult).toBeCloseTo(1.3 + 0.3)
  })

  it('teammate switches are keyed per teammate; the same partner on the main keeps its own switch', () => {
    const { a, run } = setup()
    a.presetSwitches['Helper>Buddy|pego'] = false
    expect(run().plays[0].hits[0].cardMult).toBeCloseTo(1.2)
    a.partner = 'Buddy'   // Testy is a Vanguard: Buddy's class-limited buff is off for the main
    expect(run().plays[0].hits[0].cardMult).toBeCloseTo(1.2)
    a.team = []
    expect(run().plays[0].hits[0].cardMult).toBeCloseTo(1)
  })

  it("Glory's Reign reaches allies", () => {
    const glory = PRESETS.fragmentSets.find((f) => f.name === "Glory's Reign")!
    expect(glory.effects[0].target).toBe('allies')
  })
})

describe('Team damage (owner, 2026-10-28)', () => {
  const meiLinSave = () => {
    const cs = newCharacterSave()
    Object.assign(cs.builds[0], { egoLevel: 2 })
    cs.builds[0].stats.attack = 200
    return cs
  }
  const selenaWithMeiLin = () => {
    const cs = newCharacterSave()
    const [a] = cs.builds
    Object.assign(a, { egoLevel: 6 })
    a.stats.attack = 100
    a.presetSwitches['Selena|p5-1-fire'] = false
    a.deck.push({ id: 'ef', preset: 'card-395' }, { id: 'hps4', preset: 'card-401' })
    a.team = [{ ...newTeammate(), character: 'Mei Lin', cards: ['card-338'] }]
    return { cs, a }
  }

  it("a linked teammate's play deals their own build's damage; Selena's Mark and High-Power Scope IV follow it", () => {
    const { a } = selenaWithMeiLin()
    const ml = meiLinSave()
    a.rotation = [{ cardId: 'ef', stacks: { 'High-Power Scope IV': 1 } }, { cardId: 'card-338', by: 0, stacks: { Mark: 1, 'High-Power Scope IV': 1 } }]
    const r = computeBuild(PRESETS, 'Selena', a, settings, { 'Mei Lin': ml })
    // Mei Lin's Strike as Mei Lin's own build computes it
    const alone = produce(ml, (d) => { d.builds[0].deck = [{ id: 's', preset: 'card-338' }]; d.builds[0].rotation = [{ cardId: 's' }] })
    const strike = computeBuild(PRESETS, 'Mei Lin', alone.builds[0], settings).plays[0]
    expect(r.plays[1].by).toBe('Mei Lin')
    expect(r.plays[1].hits[0].nonCrit).toBeCloseTo(strike.hits[0].nonCrit)
    expect(r.plays[1].hits[0].stat.value).toBe(200)
    // High-Power Scope IV only on another combatant's Attack Card
    expect(r.plays[0].triggered).toEqual([])
    expect(r.plays[1].triggered.map((t) => [t.by, t.card.name])).toEqual([['Selena', 'Mark'], ['Selena', 'Mark (E6 Extra Attack)'], ['Selena', 'Coordinated Attack']])
    expect(r.plays[1].triggered[0].nonCrit).toBeCloseTo((1 + 0.2) * 35)
    expect(r.byCharacter.map((c) => c.name)).toEqual(['Selena', 'Mei Lin'])
    expect(r.byCharacter[1].nonCrit).toBeCloseTo(strike.nonCrit)
    expect(r.byCharacter[0].nonCrit + r.byCharacter[1].nonCrit).toBeCloseTo(r.nonCrit)
    // The slot's Manifest Ego, partner and sets come from the linked build
    expect(withLinkedTeam(a, { 'Mei Lin': ml }).team[0].egoLevel).toBe(2)
  })

  it('an unlinked teammate deals no damage of their own, but their Attack Cards still set off Mark', () => {
    const { a } = selenaWithMeiLin()
    a.team[0].build = NO_BUILD
    a.rotation = [{ cardId: 'card-338', by: 0, stacks: { Mark: 1 } }]
    const r = computeBuild(PRESETS, 'Selena', a, settings, { 'Mei Lin': meiLinSave() })
    expect(r.plays[0].noBuild).toBe(true)
    expect(r.plays[0].hits).toEqual([])
    expect(r.plays[0].nonCrit).toBeCloseTo(1.2 * 35 + 0.3 * 35)
  })

  it("Selena as the teammate: her Mark hits use her own saved build on the main character's Attack Cards", () => {
    const ml = meiLinSave()
    const [b] = ml.builds
    b.deck = [{ id: 's', preset: 'card-338' }]
    b.team = [{ ...newTeammate(), character: 'Selena', cards: ['card-421'] }]
    b.rotation = [{ cardId: 's', stacks: { Mark: 1 } }]
    const sel = newCharacterSave()
    Object.assign(sel.builds[0], { egoLevel: 1 })
    sel.builds[0].stats.attack = 300
    const r = computeBuild(PRESETS, 'Mei Lin', b, settings, { Selena: sel })
    expect(r.plays[0].triggered.map((t) => t.card.name)).toEqual(['Mark'])
    // 100% + Sniper's Domain +80% (E2 not unlocked), with Selena's 300 Attack (her 7 is on her stats screen)
    expect(r.plays[0].triggered[0].nonCrit).toBeCloseTo((1 + 0.8) * 300 * 0.35)
  })

  it('removing a teammate card drops its plays; emptying the slot drops all of theirs', () => {
    const { a } = selenaWithMeiLin()
    a.rotation = [{ cardId: 'ef' }, { cardId: 'card-338', by: 0 }]
    const meiLin = PRESETS.characters.find((c) => c.name === 'Mei Lin')
    pruneTeamPlays(meiLin, a, 0)
    expect(a.rotation).toHaveLength(2)
    a.team[0].cards = []
    pruneTeamPlays(meiLin, a, 0)
    expect(a.rotation).toEqual([{ cardId: 'ef' }])
  })

  it('a play of a teammate slot emptied since says so', () => {
    const { a } = selenaWithMeiLin()
    a.rotation = [{ cardId: 'card-338', by: 0 }]
    a.team[0].character = ''
    expect(computeBuild(PRESETS, 'Selena', a, settings).warnings).toContain(
      "Play 1: it's a card of teammate 1, and that slot has no teammate now, so it's left out.")
  })

  it("changing a teammate card's epiphany moves its plays and its shards' plays, as for the main character", () => {
    const ross = PRESETS.characters.find((c) => c.name === 'Rossweisse')
    const { a } = selenaWithMeiLin()
    a.team[0] = { ...newTeammate(), character: 'Rossweisse', cards: ['card-1384'] }
    a.rotation = [{ cardId: 'ef' }, { cardId: 'card-1384', by: 0 }, { cardId: AUTO + 'card-1414', by: 0 }]
    changeTeammateEpiphany(ross, a, 0, 0, 'card-1385')
    expect(a.team[0].cards).toEqual(['card-1385'])
    expect(a.rotation).toEqual([{ cardId: 'ef' }, { cardId: 'card-1385', by: 0 }, { cardId: AUTO + 'card-1415', by: 0 }])
  })
})
