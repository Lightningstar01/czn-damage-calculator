import { describe, expect, it } from 'vitest'
import { AUTO } from '../src/engine/deck'
import { PRESETS } from '../src/data/presets'
import { migrate } from '../src/store/migrate'
import { activeFight, defaultSave, SAVE_VERSION } from '../src/store/save'

describe('migrate', () => {
  it('v12: each build gets its own stat boosts and buffs: the shared rows that were on for it; a row off everywhere stays in all, off', () => {
    const old = { version: 11, characters: { X: { activeBuild: 'a', builds: [{ id: 'a' }, { id: 'b' }],
      boosts: [
        { id: 'sword', source: 'Sword', stat: 'Flat ATK', value: '74', switches: { a: true, b: true } },
        { id: 'ring', source: 'Ring', stat: 'ATK%', value: '12%', switches: { a: true, b: false } },
        { id: 'spare', source: 'Spare', stat: 'ATK%', value: '8%', switches: { a: false, gone: true } },
      ],
      buffs: [
        { id: 'stacks', value: '+10%', maxStacks: 5, switches: { b: 3 } },
        { id: 'bare', value: '20%' },
      ],
    } } }
    const cs = migrate(old).characters.X
    const [a, b] = cs.builds
    expect(a.boosts.map((r) => [r.id, r.on])).toEqual([['sword', true], ['ring', true], ['spare', false]])
    expect(b.boosts.map((r) => [r.id, r.on])).toEqual([['sword', true], ['spare', false]])
    expect(a.buffs.map((r) => [r.id, r.on])).toEqual([['bare', false]])
    expect(b.buffs.map((r) => [r.id, r.on])).toEqual([['stacks', 3], ['bare', false]])
    expect(a.boosts[0]).toMatchObject({ source: 'Sword', stat: 'Flat ATK', value: '74' })
    expect(a.boosts[0]).not.toHaveProperty('switches')
    expect(a.boosts[0]).not.toBe(b.boosts[0])
    expect(cs).not.toHaveProperty('boosts')
    expect(cs).not.toHaveProperty('buffs')
  })

  it('v11: the enemy moves to shared fights, one per distinct pair of values, and the open build keeps its own', () => {
    const build = (id: string, enemyDefMult: number, enemyDr: number) => ({ id, enemyDefMult, enemyDr, stats: { attack: 900, critDmg: 1.8, critChance: 0.2 } })
    const old = { version: 10, activeCharacter: 'Y', characters: {
      X: { activeBuild: 'a', builds: [build('a', 0.387, 0), build('b', 1, 0)] },
      Y: { activeBuild: 'd', builds: [build('c', 0.387, 0), build('d', 0.5, 0.2)] },
    } }
    const save = migrate(old)
    expect(save.fights.map((f) => f.enemies[0])).toEqual(expect.arrayContaining([{ defMult: 0.387, dr: 0 }, { defMult: 1, dr: 0 }, { defMult: 0.5, dr: 0.2 }]))
    expect(save.fights).toHaveLength(3)
    expect(activeFight(save).enemies[0]).toEqual({ defMult: 0.5, dr: 0.2 })
    expect(save.characters.X.builds[0]).not.toHaveProperty('enemyDefMult')
    expect(save.characters.X.builds[0]).not.toHaveProperty('enemyDr')
    expect(new Set(save.fights.map((f) => f.id)).size).toBe(3)
  })

  it('v11: untouched builds get the game base crit stats, filled-in ones keep theirs', () => {
    const old = { version: 10, characters: { X: { activeBuild: 'a', builds: [
      { id: 'a', stats: { attack: 0, critChance: 0, critDmg: 0 } },
      { id: 'b', stats: { attack: 900, critChance: 0, critDmg: 1.5 } },
      { id: 'c', stats: { attack: 900, critChance: 0.4, critDmg: 0 } },
    ] } } }
    const [a, b, c] = migrate(old).characters.X.builds.map((x) => x.stats)
    expect([a.critChance, a.critDmg]).toEqual([0.03, 1.25])
    expect([b.critChance, b.critDmg]).toEqual([0, 1.5])
    expect([c.critChance, c.critDmg]).toEqual([0.4, 1.25])
  })

  it('a current save keeps its fights; a partial one gets a default; unreadable fights are refused', () => {
    const fights = [{ id: 'f', name: 'Boss', enemies: [{ defMult: 0.4, dr: 0 }] }]
    const save = migrate({ version: SAVE_VERSION, activeFight: 'f', fights, characters: {} })
    expect(save.fights).toEqual(fights)
    expect(save.activeFight).toBe('f')
    const partial = migrate({ version: SAVE_VERSION, characters: {} })
    expect(partial.fights).toHaveLength(1)
    expect(partial.activeFight).toBe(partial.fights[0].id)
    const bad = migrate({ version: SAVE_VERSION, activeFight: 'gone', fights, characters: {} })
    expect(bad.activeFight).toBe('f')
    expect(migrate({ version: SAVE_VERSION, fights: [{ id: 'f', enemies: [] }], characters: {} }).fights[0].enemies).toEqual([{ defMult: 1, dr: 0 }])
    expect(() => migrate({ version: SAVE_VERSION, fights: 'x', characters: {} })).toThrow()
    expect(() => migrate({ version: SAVE_VERSION, fights: [{ id: 'f', enemies: 'x' }], characters: {} })).toThrow()
    expect(() => migrate({ version: SAVE_VERSION, fights: [{ id: 'f', enemies: [{ defMult: null, dr: 0 }] }], characters: {} })).toThrow()
    expect(() => migrate({ version: SAVE_VERSION, fights: [{ id: 'f', enemies: [{ defMult: 1, dr: '0' }] }], characters: {} })).toThrow()
    expect(() => migrate({ version: SAVE_VERSION, fights: [{ id: 7, enemies: [] }], characters: {} })).toThrow()
    expect(() => migrate({ version: SAVE_VERSION, fights: [{ id: 'f' }, { id: 'f' }], characters: {} })).toThrow()
    expect(migrate({ version: SAVE_VERSION, fights: [{ enemies: [{ dr: 0.1 }] }], characters: {} }).fights[0].enemies).toEqual([{ defMult: 1, dr: 0.1 }])
  })

  const mei = PRESETS.characters.find((c) => c.name === 'Mei Lin')!
  const preset = (id: string) => mei.cards!.find((p) => p.id === id)!

  it('migrate adds empty set picks to old saves', () => {
    const old = { version: 1, characters: { X: { builds: [{ id: 'b' }] } } }
    expect(migrate(old).characters.X.builds[0].fragments).toEqual(['', '', ''])
  })

  it('migrate moves element and cost tags into their fields (else the character element)', () => {
    const old = { version: 4, characters: { 'Mei Lin': { builds: [{ id: 'x' }], rotation: [], cards: [
      { id: 'a', name: 'A', tags: 'Order, Exhaust, 2-cost' }, { id: 'b', name: 'B', tags: 'Basic Attack' },
    ] } } }
    const [ca, cb] = migrate(old).characters['Mei Lin'].builds[0].deck.map((d) => d.custom)
    expect(ca).toMatchObject({ element: 'Order', cost: 2, tags: 'Exhaust' })
    expect(cb).toMatchObject({ element: 'Passion', cost: null, tags: 'Basic Attack' })
  })

  it('migrate moves a type tag into the card type', () => {
    const old = { version: 2, characters: { X: { builds: [{ id: 'x' }], cards: [
      { id: 'a', name: 'A', tags: 'Passion, Upgrade, 1-cost' }, { id: 'b', name: 'B', tags: 'Basic Attack' },
    ] } } }
    const [ca, cb] = migrate(old).characters.X.builds[0].deck.map((d) => d.custom)
    expect(ca).toMatchObject({ cardType: 'Upgrade', tags: '', element: 'Passion', cost: 1 })
    expect(cb).toMatchObject({ cardType: 'Attack', tags: 'Basic Attack', cost: null })
  })

  it('migrate gives old builds Manifest Ego E0', () => {
    const old = { version: 6, characters: { X: { builds: [{ id: 'a' }], cards: [], rotation: [] } } }
    expect(migrate(old).characters.X.builds[0].egoLevel).toBe(0)
  })

  it('migrate maps the old hand-entered Mei Lin card ids to the imported ones', () => {
    const cards = ['strike', 'ego', 'jewel', 'jewel-1', 'spire-5', 'unity-1', 'aromata-5', 'sovereignty', 'custom'].map((preset, i) => ({ id: String(i), preset }))
    const old = { version: 5, characters: { 'Mei Lin': { builds: [{ id: 'x' }], cards, rotation: [] } } }
    // The Ego skill (card-337) leaves the deck in v10: it comes with every deck
    expect(migrate(old).characters['Mei Lin'].builds[0].deck.map((d) => d.preset ?? d.custom?.preset)).toEqual(
      ['card-338', 'card-340', 'card-341', 'card-351', 'card-353', 'card-363', 'card-364', 'custom'])
    for (const id of ['card-338', 'card-351', 'card-353', 'card-363']) expect(preset(id)).toBeDefined()
    expect([preset('card-351').name, preset('card-353').name, preset('card-363').name]).toEqual(
      ['Rising Dragon Spire V', 'Unity of Attack and Defense I', 'Spirit of the Aromata V'])
  })

  it('migrate: levels 0; preset cards follow their preset (v10), others stay custom without an upgrade', () => {
    const cards = [
      { id: 's', preset: 'card-338', pct: preset('card-338').pct },
      { id: 'e', preset: 'card-346', pct: 9.99 },
      { id: 'g', preset: 'card-337', pct: preset('card-337').pct },
      { id: 'c', pct: 1 },
    ]
    const old = { version: 7, characters: { 'Mei Lin': { builds: [{ id: 'a' }], cards, rotation: [] } } }
    const b = migrate(old).characters['Mei Lin'].builds[0]
    expect(b).toMatchObject({ basicLevel: 0, signatureLevel: 0 })
    expect(b.deck).toEqual([{ id: 's', preset: 'card-338' }, { id: 'e', preset: 'card-346' }, { id: 'c', custom: expect.objectContaining({ pct: 1 }) }])
    expect(b.deck[2].custom!.upgrade).toBeUndefined()
  })

  it('migrate v8: each build gets the rotation, Vulnerable / Weakness debuff on the plays their stacks reached, an empty team', () => {
    const old = { version: 8, characters: { X: {
      builds: [{ id: 'a', vulnerable: 3, weaknessDebuff: 0 }, { id: 'b', vulnerable: 0, weaknessDebuff: 1 }],
      cards: [{ id: 'two', hits: 2 }, { id: 'one', hits: 1 }],
      rotation: [{ cardId: 'two' }, { cardId: 'gone' }, { cardId: 'one', hits: 3 }, { cardId: 'two' }],
    } } }
    const cs = migrate(old).characters.X
    expect(cs).not.toHaveProperty('rotation')
    const [a, b] = cs.builds
    expect(a.rotation).toEqual([{ cardId: 'two', vulnerable: true }, { cardId: 'gone' }, { cardId: 'one', hits: 3, vulnerable: true }, { cardId: 'two' }])
    expect(b.rotation).toEqual([{ cardId: 'two', weaknessDebuff: true }, { cardId: 'gone' }, { cardId: 'one', hits: 3 }, { cardId: 'two' }])
    expect(a.team).toEqual([])
    expect(a).not.toHaveProperty('vulnerable')
    expect(b).not.toHaveProperty('weaknessDebuff')
  })

  it('migrate turns card ids into plays', () => {
    const old = { version: 3, characters: { X: { builds: [{ id: 'a' }], cards: [], rotation: ['a', 'b'] } } }
    expect(migrate(old).characters.X.builds[0].rotation).toEqual([{ cardId: 'a' }, { cardId: 'b' }])
  })

  it('migrate fills missing settings and rejects other files', () => {
    expect(migrate({ version: SAVE_VERSION, characters: {}, settings: {} }).settings.atkConstant).toBe(0.35)
    expect(() => migrate({ foo: 1 })).toThrow()
    // Read as v1, a newer save without a version lost every attack list
    expect(() => migrate({ characters: {} })).toThrow('no version number')
  })

  it('migrate fills rows and teammates missing a field the page reads', () => {
    const cs = migrate({ version: SAVE_VERSION, characters: { X: { builds: [{ id: 'a', team: [{ character: 'Y' }], boosts: [{ id: 'b' }], buffs: [{ id: 'c', on: 2 }] }] } } }).characters.X
    // A row without a switch is off
    expect(cs.builds[0].boosts[0]).toMatchObject({ id: 'b', stat: 'Flat ATK', value: '', on: false })
    expect(cs.builds[0].buffs[0]).toMatchObject({ id: 'c', appliesTo: 'ALL', on: 2 })
    expect(cs.builds[0].team[0].cards).toEqual([])
    expect(migrate(defaultSave()).version).toBe(SAVE_VERSION)
  })

  it('migrate rejects files the site could not read', () => {
    for (const bad of [
      { version: 10, characters: null },
      { version: '10', characters: {} },
      { characters: [] },
      { characters: { X: {} } },
      { characters: { X: { builds: [] } } },
      { characters: { X: { builds: [{}] } } },
      { characters: { X: { builds: [{ id: 'a', deck: 5 }] } } },
      { version: 11, characters: { X: { builds: [{ id: 'a' }], boosts: 'none' } } },
      { version: SAVE_VERSION, characters: { X: { builds: [{ id: 'a', buffs: 'none' }] } } },
    ]) expect(() => migrate(bad), JSON.stringify(bad)).toThrow(/isn't a calculator save/)
    expect(() => migrate({ version: SAVE_VERSION + 1, characters: {} })).toThrow(/newer version/)
  })

  it('migrate fills in what a partial save left out', () => {
    const cs = migrate({ version: SAVE_VERSION, characters: { X: { activeBuild: 'gone', builds: [{ id: 'a', name: 'Mine', deck: [], stats: { attack: 5, elemDmg: { Order: 0.1 } } }] } } }).characters.X
    expect(cs).toMatchObject({ activeBuild: 'a' })
    expect(cs.builds[0]).toMatchObject({ id: 'a', name: 'Mine', rotation: [], team: [], presetSwitches: {}, boosts: [], buffs: [], stats: { attack: 5, weaknessDmg: 1.25, elemDmg: { Order: 0.1, Passion: 0 } } })
  })

  it('migrate v9: the shared library goes into every build; Ego skill and created cards come with the deck', () => {
    const old = { version: 9, characters: { Rossweisse: {
      builds: [{ id: 'a', rotation: [{ cardId: 'e' }, { cardId: 'f' }, { cardId: 's' }], team: [] }, { id: 'b', rotation: [],
        team: [{ character: 'Rossweisse', cards: ['card-1380', 'card-1384', 'card-1409'] }] }],
      cards: [{ id: 'e', preset: 'card-1380' }, { id: 'f', preset: 'card-1384', pct: 9 }, { id: 's', preset: 'card-1409' }, { id: 'c', name: 'Mine', pct: 2 }],
    } } }
    const [a, b] = migrate(old).characters.Rossweisse.builds
    expect(a.deck).toEqual([{ id: 'f', preset: 'card-1384' }, { id: 'c', custom: expect.objectContaining({ name: 'Mine' }) }])
    expect(b.deck).toEqual(a.deck)
    expect(a.rotation).toEqual([{ cardId: AUTO + 'card-1380' }, { cardId: 'f' }, { cardId: AUTO + 'card-1409' }])
    expect(b.team[0].cards).toEqual(['card-1384'])
    expect(migrate(old).characters.Rossweisse).not.toHaveProperty('cards')
  })

  it('a v10 save with builds missing a deck gets them (stamped v10 by a half-written step)', () => {
    const old = { version: 10, characters: {
      Rossweisse: { builds: [{ id: 'a', rotation: [{ cardId: 'f' }], team: [] }, { id: 'b', deck: [], rotation: [], team: [] }],
        cards: [{ id: 'f', preset: 'card-1384' }] },
      'Mei Lin': { builds: [{ id: 'm', deck: [{ id: 'x', preset: 'card-341' }], rotation: [], team: [] }] },
    } }
    const chars = migrate(old).characters
    expect(chars.Rossweisse.builds.map((b) => b.deck)).toEqual([[{ id: 'f', preset: 'card-1384' }], []])
    expect(chars['Mei Lin'].builds[0].deck).toEqual([{ id: 'x', preset: 'card-341' }])
  })
})
