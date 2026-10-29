// The Excel regression scenarios (tests/test_formula.py), same inputs and expected numbers.
//
// Hand math (Final ATK 1000, constant 0.35, so 100% card = 350 per hit; crit 50% rate, 200% Crit DMG):
//   Cards, in order: Test (3 hits x 1 play), Two (2 hits x 2 plays), Weak (1 hit, Weakness DMG applies)
//   Build A: Morale 2 stacks (+40% additive)          -> mult 1.40 -> 490/hit
//   Build B: + "30%" multiplicative on ALL            -> (1.0*1.3 + 0.4) = 1.70
//   Build C: Morale 2, "+50%" first-hit-only on tag Attack, Vulnerable on the first play (website: per play, not per hit)
// Partner scenarios: Mei Lin (Striker) with Marianne (Striker partner), ATK 1000, no crit.
import { describe, expect, it } from 'vitest'
import { computeBuild, shownPct, type BuildResult } from '../src/engine/calc'
import { renderCardText } from '../src/engine/cardText'
import { AUTO, buildDeck, changeEpiphany, prunePlays } from '../src/engine/deck'
import { activeBuffs, buffMatches, buffType, fragmentPiecesUsed, parseBuffValue, parseStatValue, presetBuffValue } from '../src/engine/buffs'
import { ADDITIONS, IMPORTED, PRESETS } from '../src/data/presets'
import { checkAdditions } from '../src/data/merge'
import { DEFAULT_SETTINGS } from '../src/data/settings'
import { produce } from 'immer'
import { cardFromPreset, duplicateBuild, newBuff, newBuild, newCard, newCharacterSave, migrate, defaultSave, SAVE_VERSION } from '../src/store/save'
import type { Build, Card, CharacterSave, Presets, RotationPlay } from '../src/engine/types'
import fixture from './fixtures/workbook.json'

const presets: Presets = {
  characters: [...PRESETS.characters, { name: 'Testy', element: 'Order', class: 'Vanguard', effects: [] }],
  partners: PRESETS.partners,
  // Made-up sets for the tests (the real ones live in src/data/presets.ts)
  fragmentSets: [
    { name: 'Test Four', pieces: 4, effects: [
      { kind: 'Stat', id: 'atk', name: 'Attack', category: 'Memory Fragment', stat: 'ATK%', value: '20%', onStatsScreen: true },
      { kind: 'Buff', id: 'dmg', name: 'Damage', category: 'Memory Fragment', value: '+30%', appliesTo: 'ALL', hitScope: 'All hits', condition: 'Always' },
    ] },
    { name: 'Test Two', pieces: 2, effects: [
      { kind: 'Stat', id: 'crit', name: 'Crit DMG', category: 'Memory Fragment', stat: 'Crit DMG', value: '10%', onStatsScreen: true },
    ] },
  ],
}
const settings = DEFAULT_SETTINGS
/** Switch off Mei Lin's potential 5-1 (Strike card %), for tests about something else. */
const noStrikeNode = (b: Build) => { b.presetSwitches['Mei Lin|p5-1-strike'] = false }

function card(name: string, tags: string, hits: number, weak = false, ravaged = false): Card {
  return { ...newCard('Passion'), name, tags, hits, pct: 1, weaknessApplies: weak, targetRavaged: ravaged }
}

const plays = (...ids: string[]): RotationPlay[] => ids.map((cardId) => ({ cardId }))
/** Put cards in every build's deck, as custom cards (a preset copy keeps its preset's effects). */
const addCards = (cs: CharacterSave, ...cards: Card[]) => { for (const b of cs.builds) b.deck.push(...cards.map((c) => ({ id: c.id, custom: c }))) }
/** The same attack list for every build of the save. */
const setPlays = (cs: CharacterSave, list: RotationPlay[]) => { for (const b of cs.builds) b.rotation = structuredClone(list) }

/** Sum of a card's plays in a build result. */
function cardTotal(r: BuildResult, name: string, key: 'nonCrit' | 'crit' | 'expected' = 'nonCrit') {
  return r.plays.filter((p) => p.card.name === name).reduce((a, p) => a + p[key], 0)
}

function mainScenario() {
  const cs: CharacterSave = newCharacterSave()
  const b = { ...newBuild('Build B') }
  const c = { ...newBuild('Build C') }
  cs.builds.push(b, c)
  for (const x of cs.builds) {
    x.stats.attack = 1000
    x.stats.critChance = 0.5
    x.stats.critDmg = 2
    x.morale = 2
  }
  cs.buffs.push({ ...newBuff(b.id), source: 'Mult test', value: '30%', appliesTo: 'ALL' })
  cs.buffs.push({ ...newBuff(c.id), source: 'First hit', value: '+50%', appliesTo: 'Attack', hitScope: 'First hit only' })
  const test = card('Test', 'Attack', 3), two = card('Two', 'x', 2), weak = card('Weak', 'x', 1, true)
  two.cardType = weak.cardType = 'Skill'   // only "Test" is an Attack, as in the Excel scenario
  addCards(cs, test, two, weak)
  setPlays(cs, plays(test.id, two.id, two.id, weak.id))
  c.rotation[0].vulnerable = true
  const run = (i: number) => computeBuild(presets, '', cs, cs.builds[i], settings)
  return { A: run(0), B: run(1), C: run(2) }
}

describe('main scenario', () => {
  const { A, B, C } = mainScenario()

  it('final stats', () => {
    for (const r of [A, B, C]) {
      expect(r.stats.atk.value).toBe(1000)
      expect(r.stats.weaknessDmg.value).toBe(1.25)
      expect(r.stats.elemDmg.value).toBe(0)
    }
  })

  it('build A: Morale and crit', () => {
    expect(cardTotal(A, 'Test')).toBeCloseTo(1470)
    expect(cardTotal(A, 'Test', 'crit')).toBeCloseTo(2940)
    expect(cardTotal(A, 'Test', 'expected')).toBeCloseTo(2205)
  })

  it('times played', () => {
    expect(cardTotal(A, 'Two')).toBeCloseTo(1960)
    expect(A.plays[2].hits[1]).toMatchObject({ hitNo: 2, globalHit: 7 })
  })

  it('Weakness DMG applies', () => {
    expect(A.plays[3].hits[0].cardMult).toBeCloseTo(1.75)
    expect(cardTotal(A, 'Weak')).toBeCloseTo(612.5)
  })

  it('build B: multiplicative', () => {
    expect(cardTotal(B, 'Test')).toBeCloseTo(1785)
    expect(cardTotal(B, 'Two')).toBeCloseTo(2380)
    expect(cardTotal(B, 'Weak')).toBeCloseTo(743.75)
  })

  it('build C: first-hit buff, and Vulnerable on every hit of its play', () => {
    expect(C.plays[0].hits[0].cardMult).toBeCloseTo(2.85)
    expect(C.plays[0].hits[1].cardMult).toBeCloseTo(2.1)
    expect(C.plays[1].hits[0].cardMult).toBeCloseTo(1.4)
    expect(cardTotal(C, 'Test')).toBeCloseTo(2467.5)
    expect(cardTotal(C, 'Two')).toBeCloseTo(1960)
  })

  it('totals', () => {
    expect(A.nonCrit).toBeCloseTo(4042.5)
    expect(A.expected).toBeCloseTo(6063.75)
    expect(B.nonCrit / A.nonCrit - 1).toBeCloseTo(4908.75 / 4042.5 - 1)
  })
})

function partnerScenario(character: string) {
  const cs = newCharacterSave()
  const [a] = cs.builds
  const b = newBuild('Build B'), c = newBuild('Build C')
  cs.builds.push(b, c)
  for (const x of cs.builds) x.stats.attack = 1000
  a.partner = b.partner = 'Marianne'
  b.presetSwitches['Marianne|atk'] = false
  const strike = card('Strike', 'Basic Attack', 1, false, true), other = card('Other', 'x', 1)
  addCards(cs, strike, other)
  setPlays(cs, plays(strike.id, other.id))
  return cs.builds.map((x) => computeBuild(presets, character, cs, x, settings))
}

describe('partner presets', () => {
  const [A, B, C] = partnerScenario('Mei Lin')

  it('stats per build', () => {
    expect([A, B, C].map((r) => r.stats.atk.value)).toEqual([1160, 1000, 1000])
    expect(A.stats.weaknessDmg.value).toBeCloseTo(1.3)
    expect(B.stats.weaknessDmg.value).toBeCloseTo(1.3)
    expect(C.stats.weaknessDmg.value).toBeCloseTo(1.25)
  })

  it('Ravaged and Weakness Attack', () => {
    expect(A.plays[0].hits[0].cardMult).toBeCloseTo(1.495)
    expect(cardTotal(A, 'Strike')).toBeCloseTo(606.97)
    expect(cardTotal(B, 'Strike')).toBeCloseTo(523.25)
    expect(cardTotal(C, 'Strike')).toBeCloseTo(350)
    expect(cardTotal(A, 'Other')).toBeCloseTo(406)
  })

  it('class mismatch switches class-limited effects off', () => {
    const [M] = partnerScenario('Testy')
    expect(M.stats.atk.value).toBeCloseTo(1000)
    expect(cardTotal(M, 'Strike')).toBeCloseTo(350)
  })
})

describe('memory fragment sets', () => {
  const cs = newCharacterSave()
  const [a] = cs.builds
  const b = newBuild('Build B'), c = newBuild('Build C')
  cs.builds.push(b, c)
  for (const x of cs.builds) x.stats.attack = 1000
  a.fragments = ['Test Four', 'Test Two', '']
  b.fragments = ['Test Four', '', '']
  b.presetSwitches['Test Four|dmg'] = false
  c.fragments = ['Test Four', 'Test Four', 'Test Two']
  const x = card('X', '', 1)
  addCards(cs, x)
  setPlays(cs, plays(x.id))
  const [A, B, C] = cs.builds.map((bd) => computeBuild(presets, 'Mei Lin', cs, bd, settings))

  it('set buffs apply; set stats are already on the stats screen', () => {
    expect(A.stats.atk.value).toBe(1000)
    expect(A.plays[0].hits[0].cardMult).toBeCloseTo(1.3)
    expect(B.plays[0].hits[0].cardMult).toBeCloseTo(1)
  })

  it('a set picked twice counts once; pieces are counted per pick', () => {
    expect(C.plays[0].hits[0].cardMult).toBeCloseTo(1.3)
    expect(fragmentPiecesUsed(presets, a)).toBe(6)
    expect(fragmentPiecesUsed(presets, c)).toBe(10)
  })

  it('migrate adds empty set picks to old saves', () => {
    const old = { version: 1, characters: { X: { builds: [{ id: 'b' }] } } }
    expect(migrate(old).characters.X.builds[0].fragments).toEqual(['', '', ''])
  })
})

describe('applies to', () => {
  const m = (appliesTo: string, c: Card) => buffMatches({ appliesTo, condition: 'Always' }, c)
  const exhaust: Card = { ...card('Slash', 'Exhaust', 3), element: 'Order', cost: 2 }
  it('AND, OR, hits, cost and card kind', () => {
    expect(m('Justice/Order & Exhaust & Attack', exhaust)).toBe(true)
    expect(m('Justice & Exhaust', exhaust)).toBe(false)
    expect(m('Void/Order & 2+ hits', exhaust)).toBe(true)
    expect(m('4+ hits', exhaust)).toBe(false)
    expect(m('2+ cost', exhaust)).toBe(true)
    expect(m('3+ cost', exhaust)).toBe(false)
    expect(m('1-cost', exhaust)).toBe(false)
    expect(m('2-cost', exhaust)).toBe(true)
    expect(m('Order', exhaust)).toBe(true)
    expect(m('Passion', exhaust)).toBe(false)
    expect(m('0+ cost', { ...exhaust, cost: null })).toBe(false)
    expect(m('Slash', exhaust)).toBe(true)
    expect(m('DoT', { ...exhaust, kind: 'DoT' })).toBe(true)
    expect(m('Counterattack/Extra Attack', { ...exhaust, kind: 'Extra Attack' })).toBe(true)
  })

  it('card type matches like a tag', () => {
    const skill: Card = { ...card('Guard', '', 1), cardType: 'Skill', element: 'Order' }
    expect(m('Skill', skill)).toBe(true)
    expect(m('Attack', skill)).toBe(false)
    expect(m('Order & Skill', skill)).toBe(true)
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
})

describe('per-card crit buffs', () => {
  it('add to Crit DMG / Crit Chance of matching cards only, capped', () => {
    const cs = newCharacterSave()
    const [a] = cs.builds
    a.stats.attack = 1000
    a.stats.critChance = 0.9
    a.stats.critDmg = 1.5
    cs.buffs.push({ ...newBuff(a.id), value: '+35%', typeOverride: 'Crit DMG', appliesTo: '1-cost' })
    cs.buffs.push({ ...newBuff(a.id), value: '+20%', typeOverride: 'Crit Chance', appliesTo: '1-cost' })
    const one = { ...card('One', '', 1), cost: 1 }, two = { ...card('Two', '', 1), cost: 2 }
    addCards(cs, one, two)
    setPlays(cs, plays(one.id, two.id))
    const r = computeBuild(presets, '', cs, a, settings)
    expect(r.plays[0].hits[0].critDmg).toBeCloseTo(1.85)
    expect(r.plays[0].hits[0].critRate).toBeCloseTo(1)
    expect(r.plays[0].crit).toBeCloseTo(350 * 1.85)
    expect(r.plays[0].hits[0].cardMult).toBeCloseTo(1)
    expect(r.plays[1].hits[0].critDmg).toBeCloseTo(1.5)
    expect(r.plays[1].hits[0].critRate).toBeCloseTo(0.9)
  })
})

describe('real fragment set presets', () => {
  it('names and effect ids are unique, pieces are 2 or 4', () => {
    const names = PRESETS.fragmentSets.map((f) => f.name)
    expect(new Set(names).size).toBe(names.length)
    for (const f of PRESETS.fragmentSets) {
      expect([2, 4]).toContain(f.pieces)
      expect(new Set(f.effects.map((e) => e.id)).size).toBe(f.effects.length)
    }
  })
})

describe('card presets', () => {
  const mei = PRESETS.characters.find((c) => c.name === 'Mei Lin')!
  const preset = (id: string) => mei.cards!.find((p) => p.id === id)!

  it('every character is imported; the additions files match the import', () => {
    expect(PRESETS.characters.length).toBe(Object.keys(IMPORTED).length)
    expect(new Set(PRESETS.characters.map((c) => c.name)).size).toBe(PRESETS.characters.length)
    expect(checkAdditions(IMPORTED, ADDITIONS)).toEqual([])
    expect(checkAdditions(IMPORTED, { nobody: {}, 'mei-lin': { cards: { 'card-0': {} } } })).toHaveLength(2)
    expect(checkAdditions(IMPORTED, { 'mei-lin': { cards: { 'card-338': { creates: ['card-0'] } } } })).toHaveLength(1)
    const badEgo = { ...PRESETS.characters[0].effects[0], kind: 'Buff', id: 'x', egoLevel: 7 } as never
    expect(checkAdditions(IMPORTED, { 'mei-lin': { effects: [badEgo] } })).toHaveLength(1)
  })

  it('every character has potentials, 6 Manifest Ego levels and one Basic Skill (Maribell two; Tenebria: Rhythm: Fermata too)', () => {
    for (const ch of PRESETS.characters) {
      expect(ch.potentials?.length).toBeGreaterThan(0)
      expect(ch.manifestEgo?.map((m) => m.level)).toEqual([1, 2, 3, 4, 5, 6])
      expect(ch.cards!.filter((c) => c.tags?.includes('Basic Skill'))).toHaveLength(ch.name === 'Maribell' || ch.name === 'Tenebria' ? 2 : 1)
    }
  })

  it('Manifest Ego effects only count from the build level', () => {
    const cs = newCharacterSave()
    const [a] = cs.builds
    a.stats.attack = 1000
    noStrikeNode(a)
    const strike = cardFromPreset(preset('card-338'), 'Passion')
    addCards(cs, strike)
    setPlays(cs, plays(strike.id))
    const mult = () => computeBuild(PRESETS, 'Mei Lin', cs, a, settings).plays[0].hits[0].cardMult
    expect(mult()).toBeCloseTo(1)
    a.egoLevel = 3
    expect(mult()).toBeCloseTo(1)
    a.egoLevel = 4   // E4: +20% additive on Attack cards (the Ravaged part needs a Ravaged target)
    expect(mult()).toBeCloseTo(1.2)
    a.presetSwitches['Mei Lin|e4-atk'] = false
    expect(mult()).toBeCloseTo(1)
  })

  it('migrate gives old builds Manifest Ego E0', () => {
    const old = { version: 6, characters: { X: { builds: [{ id: 'a' }], cards: [], rotation: [] } } }
    expect(migrate(old).characters.X.builds[0].egoLevel).toBe(0)
  })

  it('additions merge into the imported cards', () => {
    expect(mei).toMatchObject({ element: 'Passion', class: 'Striker' })
    expect(preset('card-345')).toMatchObject({ name: "Flame Dragon's Jewel V", targetRavaged: true, cardType: 'Upgrade' })
    expect(preset('card-344').effects?.[0]).toMatchObject({ kind: 'Stat', stat: 'Crit Rate', value: '30%' })
    expect(preset('card-364').notes).toContain('Mythic')
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

  it('ids are unique per character, effect ids per card', () => {
    for (const ch of PRESETS.characters) {
      const ids = (ch.cards ?? []).map((p) => p.id)
      expect(new Set(ids).size).toBe(ids.length)
      for (const p of ch.cards ?? []) expect(new Set((p.effects ?? []).map((e) => e.id)).size).toBe((p.effects ?? []).length)
    }
  })

  it('copy takes the character element; library card effects become preset buffs', () => {
    const cs = newCharacterSave()
    const [a] = cs.builds
    a.stats.attack = 1000
    noStrikeNode(a)
    const strike = cardFromPreset(preset('card-338'), 'Passion'), jewel = cardFromPreset(preset('card-341'), 'Passion')
    expect(strike).toMatchObject({ name: 'Strike', element: 'Passion', cost: 1, tags: 'Basic, Basic Attack', pct: 1, hits: 1, preset: 'card-338' })
    expect(cardFromPreset(preset('card-337'), 'Passion').cost).toBeNull()
    addCards(cs, strike)
    setPlays(cs, plays(strike.id))
    const before = computeBuild(PRESETS, 'Mei Lin', cs, a, settings)
    expect(before.plays[0].hits[0].cardMult).toBeCloseTo(1)
    addCards(cs, jewel, { ...jewel, id: 'copy' })   // a second copy doesn't double the buff
    const after = computeBuild(PRESETS, 'Mei Lin', cs, a, settings)
    // Jewel I: 30% multiplicative on Attack cards, plus Passion Weakness (Weakness DMG 125%)
    expect(after.plays[0].hits[0].cardMult).toBeCloseTo(1.3 * 1.25)
    a.presetSwitches["Flame Dragon's Jewel I|weak"] = false
    expect(computeBuild(PRESETS, 'Mei Lin', cs, a, settings).plays[0].hits[0].cardMult).toBeCloseTo(1.3)
  })
})

describe('potentials', () => {
  const mei = PRESETS.characters.find((c) => c.name === 'Mei Lin')!
  const preset = (id: string) => mei.cards!.find((p) => p.id === id)!

  it('every character has one or two Manifest Ego levels that add 3 card upgrade levels (E3 and/or E5)', () => {
    for (const ch of PRESETS.characters) {
      expect(ch.potentialEgo!.length).toBeGreaterThan(0)
      for (const e of ch.potentialEgo!) {
        expect(e.levels).toBe(3)
        expect([3, 5]).toContain(e.level)
      }
    }
  })

  it('preset cards: Basic cards Basic, Ego skills none, the rest (generated too) Signature', () => {
    expect(cardFromPreset(preset('card-338'), 'Passion').upgrade).toBe('Basic')
    expect(cardFromPreset(preset('card-339'), 'Passion').upgrade).toBe('Basic')
    expect(cardFromPreset(preset('card-337'), 'Passion').upgrade).toBeUndefined()
    for (const id of ['card-340', 'card-346', 'card-364']) expect(cardFromPreset(preset(id), 'Passion').upgrade).toBe('Signature')
    expect(newCard('Passion').upgrade).toBeUndefined()
  })

  it('card % = base x (1 + 2% per level), plus the Manifest Ego levels once unlocked', () => {
    const cs = newCharacterSave()
    const [a] = cs.builds
    a.stats.attack = 1000
    const strike = cardFromPreset(preset('card-338'), 'Passion'), spire = cardFromPreset(preset('card-346'), 'Passion')
    const own = { ...newCard('Passion'), pct: 1.5 }
    addCards(cs, strike, spire, own)
    setPlays(cs, plays(strike.id, spire.id, own.id))
    const mults = () => computeBuild(PRESETS, 'Mei Lin', cs, a, settings).plays.map((p) => p.hits[0].cardMult)
    // Strike also has potential 5-1: +5%, +5% more above 500 Attack (x1.1 on the card %)
    expect(mults()).toEqual([1.1, spire.pct, 1.5].map((x) => expect.closeTo(x)))
    a.basicLevel = 10
    a.signatureLevel = 6
    // the owner's in-game Strike: 132% at Basic Card Upgrade 10
    expect(mults()).toEqual([1.32, spire.pct * 1.12, 1.5].map((x) => expect.closeTo(x)))
    // the extra +5% follows the stats-screen Attack (above 500, not at 500)
    a.stats.attack = 500
    expect(mults()[0]).toBeCloseTo(1.2 * 1.05)
    a.stats.attack = 1000
    a.egoLevel = mei.potentialEgo![0].level
    a.presetSwitches['Mei Lin|e4-atk'] = false
    noStrikeNode(a)
    expect(mults()).toEqual([strike.pct * 1.26, spire.pct * 1.18, 1.5].map((x) => expect.closeTo(x)))
  })

  it("card text shows the build's numbers like the owner's in-game screenshots (E6, Basic 7, Signature 3)", () => {
    const cs = newCharacterSave()
    const [a] = cs.builds
    Object.assign(a, { egoLevel: 6, basicLevel: 7, signatureLevel: 3 })
    a.stats.attack = 1000
    const text = (id: string) => {
      const p = preset(id)
      const c = cardFromPreset(p, 'Passion')
      const buffs = activeBuffs(PRESETS, 'Mei Lin', cs, a, settings)
      return renderCardText(p.text, {
        egoLevel: a.egoLevel, nodeOn: (n) => a.potentialNodes?.[n] !== false, pct: (base) => shownPct(base, c, a, mei, buffs, settings),
      })
    }
    expect(text('card-338')).toBe('132% Damage\n1 Ember')
    expect(text('card-339')).toBe('120% Shield')
    expect(text('card-346')).toBe('112% Damage\n2 Ember\nStreak: Add 1 Hit(s)')
    expect(text('card-364')).toContain('336% Damage\nIf the target is in a Ravage state, guaranteed Critical\n')
    // Jewel V: no potential upgrade (in-game 300%)
    expect(text('card-345')).toBe('[Initiation]\nOn Ravage, 300% Damage to the target')
    expect(text('card-337')).toContain('next 6 Basic')
    a.potentialNodes = { '3-1': false }
    a.egoLevel = 0
    expect(text('card-338')).not.toContain('Ember')
    expect(text('card-364')).not.toContain('guaranteed')
    expect(text('card-337')).toContain('next 4 Basic')
  })

  it('Fixed damage: % x Final ATK x its constant; the upgrade only with the setting on', () => {
    const cs = newCharacterSave()
    const [a] = cs.builds
    a.signatureLevel = 10
    a.stats.attack = 100
    const fixed: Card = { ...newCard('Passion'), scaling: 'Fixed', pct: 1, upgrade: 'Signature' }
    addCards(cs, fixed)
    setPlays(cs, plays(fixed.id))
    expect(computeBuild(PRESETS, 'Mei Lin', cs, a, settings).nonCrit).toBeCloseTo(35)
    expect(computeBuild(PRESETS, 'Mei Lin', cs, a, { ...settings, potentialFixed: true }).nonCrit).toBeCloseTo(42)
    expect(computeBuild(PRESETS, 'Mei Lin', cs, a, { ...settings, fixedAtkCoef: 1 }).nonCrit).toBeCloseTo(100)
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
})

describe('per-play stacks', () => {
  const mei = PRESETS.characters.find((c) => c.name === 'Mei Lin')!
  const preset = (id: string) => mei.cards!.find((p) => p.id === id)!
  const setup = (...ids: string[]) => {
    const cs = newCharacterSave()
    const [a] = cs.builds
    a.stats.attack = 1000
    noStrikeNode(a)
    const lib = ids.map((id) => cardFromPreset(preset(id), 'Passion'))
    addCards(cs, ...lib)
    return { cs, a, lib }
  }
  const adds = (r: BuildResult) => r.plays.map((p) => p.hits.map((h) => Math.round(h.additive.value * 100) / 100))

  it('Spirit of the Aromata: the stacks set on each play, capped at 20', () => {
    const { cs, a, lib: [strike, aromata, spire] } = setup('card-338', 'card-358', 'card-346')
    a.rotation = [{ cardId: strike.id }, { cardId: aromata.id }, { cardId: strike.id, stacks: { 'Spirit of the Aromata': 2 } },
      { cardId: spire.id, stacks: { 'Spirit of the Aromata': 25 } }]
    const r = computeBuild(PRESETS, 'Mei Lin', cs, a, settings)
    expect(adds(r)).toEqual([[0], [], [0.4], [4]])
    expect(r.plays[3].counters).toEqual([{ name: 'Spirit of the Aromata', stacks: 20 }])
    a.presetSwitches['Spirit of the Aromata|dmg'] = false
    expect(adds(computeBuild(PRESETS, 'Mei Lin', cs, a, settings))).toEqual([[0], [], [0], [0]])
  })

  it('Aromata V only boosts Basic cards', () => {
    const { cs, a, lib: [strike, aromata, spire] } = setup('card-338', 'card-363', 'card-346')
    const n = { 'Spirit of the Aromata V': 3 }
    a.rotation = [{ cardId: aromata.id }, { cardId: spire.id, stacks: n }, { cardId: strike.id, stacks: n }]
    expect(adds(computeBuild(PRESETS, 'Mei Lin', cs, a, settings))).toEqual([[], [0], [1.5]])
  })

  it('Ember: +30% per stack on every hit vs a Ravaged target, up to 5; nothing otherwise', () => {
    const { cs, a, lib: [strike] } = setup('card-338')
    const ravaged = { ...strike, id: 'rs', targetRavaged: true }
    addCards(cs, ravaged)
    a.rotation = [{ cardId: ravaged.id, hits: 2, stacks: { Ember: 3 } }, { cardId: strike.id, stacks: { Ember: 5 } },
      { cardId: ravaged.id, stacks: { Ember: 7 } }, { cardId: ravaged.id }]
    expect(adds(computeBuild(PRESETS, 'Mei Lin', cs, a, settings))).toEqual([[0.9, 0.9], [0], [1.5], [0]])
    a.presetSwitches['Mei Lin|ember'] = false
    expect(adds(computeBuild(PRESETS, 'Mei Lin', cs, a, settings))).toEqual([[0, 0], [0], [0], [0]])
  })
})

describe('per-play debuffs and per-build attack lists', () => {
  it('Vulnerable and the Weakness debuff count on every hit of the plays that have them', () => {
    const cs = newCharacterSave()
    const [a] = cs.builds
    a.stats.attack = 1000
    const x = card('X', '', 2)
    addCards(cs, x)
    a.rotation = [{ cardId: x.id, vulnerable: true }, { cardId: x.id, weaknessDebuff: true }, { cardId: x.id, vulnerable: true, weaknessDebuff: true }, { cardId: x.id }]
    const r = computeBuild(presets, '', cs, a, settings)
    expect(r.plays.map((p) => p.hits.map((h) => h.cardMult))).toEqual(
      [[1.5, 1.5], [0.75, 0.75], [1.125, 1.125], [1, 1]].map((xs) => xs.map((v) => expect.closeTo(v))))
    expect(r.plays[2]).toMatchObject({ vulnerable: true, weaknessDebuff: true })
  })

  it('each build plays its own list', () => {
    const cs = newCharacterSave()
    const [a] = cs.builds
    const b = newBuild('Build B')
    cs.builds.push(b)
    for (const x of cs.builds) x.stats.attack = 1000
    const x = card('X', '', 1)
    addCards(cs, x)
    a.rotation = plays(x.id)
    b.rotation = plays(x.id, x.id, x.id)
    expect(cs.builds.map((bd) => computeBuild(presets, '', cs, bd, settings).nonCrit)).toEqual([350, 1050].map((v) => expect.closeTo(v)))
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
})

describe('duplicate build', () => {
  it('works inside an immer update (as the Setup tab calls it) and copies the team and attack list', () => {
    const cs = newCharacterSave()
    cs.builds[0].team = [{ character: 'Helper', egoLevel: 2, partner: '', fragments: ['', '', ''], cards: ['h-1'] }]
    cs.builds[0].rotation = [{ cardId: 'x', vulnerable: true, stacks: { Ember: 2 } }]
    const next = produce(cs, (c) => { c.builds.push(duplicateBuild(c, c.builds[0], 'Build B')) })
    const [a, b] = next.builds
    expect(b.id).not.toBe(a.id)
    expect(b.team).toEqual(a.team)
    expect(b.rotation).toEqual(a.rotation)
    expect(b.rotation).not.toBe(a.rotation)
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
    const run = () => computeBuild(teamPresets, 'Testy', cs, a, settings)
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

describe('rotation plays', () => {
  it('a play can override the hits; 2+ hits buffs follow the play', () => {
    const cs = newCharacterSave()
    const [a] = cs.builds
    a.stats.attack = 1000
    cs.buffs.push({ ...newBuff(a.id), value: '+50%', appliesTo: '2+ hits' })
    const x = card('X', '', 1)
    addCards(cs, x)
    setPlays(cs, [{ cardId: x.id }, { cardId: x.id, hits: 3 }, { cardId: x.id }])
    const r = computeBuild(presets, '', cs, a, settings)
    expect(r.plays.map((p) => p.hits.length)).toEqual([1, 3, 1])
    expect(r.plays[0].hits[0].cardMult).toBeCloseTo(1)
    expect(r.plays[1].hits[0].cardMult).toBeCloseTo(1.5)
    expect(r.plays[2].hits[0].globalHit).toBe(5)
  })

  it('migrate turns card ids into plays', () => {
    const old = { version: 3, characters: { X: { builds: [{ id: 'a' }], cards: [], rotation: ['a', 'b'] } } }
    expect(migrate(old).characters.X.builds[0].rotation).toEqual([{ cardId: 'a' }, { cardId: 'b' }])
  })
})

describe('parsing', () => {
  it('values and buff types', () => {
    expect(parseStatValue('16%')).toBeCloseTo(0.16)
    expect(parseStatValue('74')).toBe(74)
    expect(parseBuffValue('+30%')).toBeCloseTo(0.3)
    expect(parseBuffValue('Weakness Attack')).toBe(0)
    expect(buffType('+30%')).toBe('Additive')
    expect(buffType('30%')).toBe('Multiplicative')
    expect(buffType(' weakness attack ')).toBe('Weakness Attack')
    expect(buffType('30%', 'Additive')).toBe('Additive')
  })

  it('chained multiplicative buffs', () => {
    const cs = newCharacterSave()
    const [a] = cs.builds
    a.stats.attack = 1000
    cs.buffs.push({ ...newBuff(a.id), value: '30%' }, { ...newBuff(a.id), value: '20%' })
    const x = card('X', '', 1)
    addCards(cs, x)
    setPlays(cs, plays(x.id))
    const summed = computeBuild(presets, '', cs, a, settings)
    const chained = computeBuild(presets, '', cs, a, { ...settings, multMode: 'Chained' })
    expect(summed.plays[0].hits[0].cardMult).toBeCloseTo(1.5)
    expect(chained.plays[0].hits[0].cardMult).toBeCloseTo(1.56)
  })

  it('migrate fills missing settings and rejects other files', () => {
    expect(migrate({ characters: {}, settings: {} }).settings.atkConstant).toBe(0.35)
    expect(() => migrate({ foo: 1 })).toThrow()
    expect(migrate(defaultSave()).version).toBe(SAVE_VERSION)
  })
})

describe('card % in hand and on target', () => {
  it("matches the owner's Strike: 251% in hand, ~357% on target (owner, 2026-10-25)", () => {
    // The owner's saved Mei Lin (workbook) + Flame Dragon's Jewel, 1 Morale, Strike at base 100% with Basic Card Upgrade 10
    const save = migrate(fixture.save)
    const cs = save.characters['Mei Lin']
    const a = cs.builds[0]
    a.morale = 1
    a.basicLevel = 10
    const mei = PRESETS.characters.find((c) => c.name === 'Mei Lin')!
    Object.assign(a.deck[0].custom!, { pct: 1, upgrade: 'Basic' })
    addCards(cs, cardFromPreset(mei.cards!.find((p) => p.id === 'card-340')!, 'Passion'))
    const hit = () => computeBuild(PRESETS, 'Mei Lin', cs, a, settings).plays[0].hits[0]
    // 132% x (1 + 20% Scarab + 12% Sword + 20% Jewel) + 30% Emblem + 20% Morale; x 142% Weakness DMG on target
    expect(hit().inHand).toBeCloseTo(2.5064, 4)
    expect(hit().cardMult).toBeCloseTo(2.5064 * 1.42, 4)
    // Buffs that need a Ravaged target (Ember, Marianne) only show on target
    a.deck[0].custom!.targetRavaged = true
    a.rotation[0].stacks = { Ember: 1 }
    expect(hit().inHand).toBeCloseTo(2.5064, 4)
    expect(hit().cardMult).toBeCloseTo((1.32 * 1.67 + 0.5 + 0.3) * 1.42, 4)
  })
})

describe('Rossweisse', () => {
  const ross = PRESETS.characters.find((c) => c.name === 'Rossweisse')!
  const preset = (id: string) => ross.cards!.find((p) => p.id === id)!
  // Owner's screenshots (2026-10-27): E1, Basic 1, Signature 10, Potential 5-1 not unlocked (Sword Slash 102%)
  const ownerBuild = () => {
    const cs = newCharacterSave()
    const [a] = cs.builds
    Object.assign(a, { egoLevel: 1, basicLevel: 1, signatureLevel: 10 })
    a.presetSwitches['Rossweisse|p5-1-slash'] = false
    a.stats.attack = 500
    return { cs, a }
  }

  it("card text matches the owner's in-game screenshots", () => {
    const { cs, a } = ownerBuild()
    const text = (id: string) => {
      const p = preset(id)
      const c = cardFromPreset(p, 'Justice')
      const buffs = activeBuffs(PRESETS, 'Rossweisse', cs, a, settings)
      return renderCardText(p.text, { egoLevel: a.egoLevel, nodeOn: () => true, pct: (base) => shownPct(base, c, a, ross, buffs, settings) })
    }
    expect(text('card-1381')).toBe('102% Damage')
    expect(text('card-1383')).toBe('[Equilux / Unique]\n480% Damage\nOn polarization, split into Shard:Light and Shard:Dark')
    expect(preset('card-1384').name).toBe('Flicker Blade (Amped)')
    expect(text('card-1384')).toContain('720% Damage\nOn polarization, split into Shard:Light (Amped) and Shard:Dark (Amped)')
    expect(text('card-1388')).toContain('[Equilux / Unique / Finale]\n480% Damage\n+120% base Damage Amount for each X')
    expect(text('shard-light')).toContain('96% Damage to a random enemy')
    expect(text('card-1409')).toContain('144% Damage to a random enemy')
    expect(text('card-1412')).toContain('288% Damage\nCreate 1 Sword Tassel')
    expect(text('card-1396')).toBe('360% Damage\nDiscard up to 2 card(s) in hand, then that amount Discarded × 240% Damage')
    expect(text('card-1406')).toContain('600% Damage')
    expect(text('card-1380')).toBe('1200% Damage\nWhen the next Equilux card is activated, inflict Fixed Damage equal to 30% of Damage dealt to the target')
    expect(text('card-1407')).toBe("[Unique / Initiation]\nDraw 2\nGain 1 AP\n1 Kyrken's Aegis")
    expect(preset('card-1408').cost).toBeNull()
  })

  it('Sword Tassel base %, Kyrken\'s Aegis (final) and the Ego skill\'s Fixed damage on the next Flicker Blade', () => {
    const { cs, a } = ownerBuild()
    const [apostle, blade, ego] = ['card-1407', 'card-1383', 'card-1380'].map((id) => cardFromPreset(preset(id), 'Justice'))
    addCards(cs, apostle, blade, ego)
    a.rotation = [{ cardId: ego.id }, { cardId: blade.id, stacks: { 'Sword Tassel': 2 } }, { cardId: blade.id }]
    let r = computeBuild(PRESETS, 'Rossweisse', cs, a, settings)
    // Ego skill: 1200%, a Skill, so not Kyrken's Aegis (Attack cards); ATK 500 x 0.35 = 175 per 100%
    expect(r.plays[0].nonCrit).toBeCloseTo(12 * 175)
    // Flicker Blade: (400% x 1.2 + 2 x 80%) x 1.3 (Aegis E1) x 1.2 (final), then + 30% Fixed from the Ego skill
    const hit = 6.4 * 1.3 * 175 * 1.2
    expect(r.plays[1].hits[0].nonCrit).toBeCloseTo(hit)
    expect(r.plays[1].followUp?.nonCrit).toBeCloseTo(hit * 0.3)
    expect(r.plays[1].nonCrit).toBeCloseTo(hit * 1.3)
    // Only the next Equilux play gets it
    expect(r.plays[2].followUp).toBeUndefined()
    expect(r.plays[2].nonCrit).toBeCloseTo(4.8 * 1.3 * 175 * 1.2)
    // Below E1: Kyrken's Aegis is 20% / final 15%
    a.egoLevel = 0
    r = computeBuild(PRESETS, 'Rossweisse', cs, a, settings)
    expect(r.plays[2].nonCrit).toBeCloseTo(4.8 * 1.2 * 175 * 1.15)
    // E3: Fixed 60%, Ego skill +400% additive
    a.egoLevel = 3
    r = computeBuild(PRESETS, 'Rossweisse', cs, a, settings)
    expect(r.plays[0].nonCrit).toBeCloseTo(16 * 175 * 1.2)
    expect(r.plays[1].followUp?.share).toBe(0.6)
  })

  it('Potential 7 follows the stats-screen Attack: +5% from 600, +2% per 20 above, max +10% more', () => {
    const p7 = ross.effects.find((e) => e.id === 'p7-justice')!
    if (p7.kind !== 'Buff') throw new Error('p7 is a buff')
    const at = (attack: number) => presetBuffValue(p7, { stats: { ...newBuild('x').stats, attack } }).value
    expect(at(599)).toBe(0)
    expect(at(600)).toBeCloseTo(0.05)
    expect(at(659)).toBeCloseTo(0.05 + 0.04)
    expect(at(1000)).toBeCloseTo(0.15)
  })
})

describe('Tiphera', () => {
  const tip = PRESETS.characters.find((c) => c.name === 'Tiphera')!
  const preset = (id: string) => tip.cards!.find((p) => p.id === id)!
  // Owner's screenshots (2026-10-28): below E3 (Ego skill "2 times"), Basic 1 (102%), Signature 6 (120% -> 134%)
  const ownerBuild = () => {
    const cs = newCharacterSave()
    const [a] = cs.builds
    Object.assign(a, { egoLevel: 0, basicLevel: 1, signatureLevel: 6 })
    a.stats.attack = 100
    a.stats.defense = 300
    return { cs, a }
  }

  it("card text matches the owner's in-game screenshots", () => {
    const { cs, a } = ownerBuild()
    const text = (id: string) => {
      const p = preset(id)
      const c = cardFromPreset(p, 'Order')
      const buffs = activeBuffs(PRESETS, 'Tiphera', cs, a, settings)
      return renderCardText(p.text, { egoLevel: a.egoLevel, nodeOn: () => true, pct: (base) => shownPct(base, c, a, tip, buffs, settings) })
    }
    expect(text('card-958')).toBe('102% Defense-Based Damage')
    expect(text('card-959')).toBe('Heal 71%\n71% Shield')
    expect(text('card-960')).toContain('Heal 112%')
    expect(text('card-972')).toBe('134% Defense-Based Damage\n90% Shield\nHeal 90%\nHarmonization: Double all effects')
    expect(text('card-973')).toContain('202% Defense-Based Damage\n112% Shield\nHeal 112%')
    expect(text('card-974')).toContain('616% Defense-Based Damage')
    expect(text('card-975')).toContain('179% Defense-Based Damage\n45% Shield\nHeal 45%')
    expect(text('card-977')).toContain('168% Defense-Based Damage for each Cost')
    expect(text('card-985')).toBe('[Exhaust]\nHeal 67%\n1 AP')
    expect(text('card-986')).toContain('67% Shield\nIncrease Damage Amount of the first Hit of next Attack Card by 30%\n(max 300%)')
    expect(text('card-957')).toContain('The next 2 times')
    expect(text('card-984')).toContain('[Unique / Form Upgrade (0/3)]')
  })

  it('Harmonization doubles the card %, △ stacks raise the first hit of any ally\'s Attack card', () => {
    const { cs, a } = ownerBuild()
    const [cd, seed] = ['card-972', 'card-960'].map((id) => cardFromPreset(preset(id), 'Order'))
    addCards(cs, cd, seed)
    a.rotation = [{ cardId: cd.id }, { cardId: cd.id, stacks: { Harmonization: 1, 'Archetype △': 2 } }]
    const r = computeBuild(PRESETS, 'Tiphera', cs, a, settings)
    // Stat: ATK 100 x 0.3 + DEF 300 x 2.1 = 660, x 0.35
    const unit = 660 * 0.35
    expect(r.plays[0].nonCrit).toBeCloseTo(1.2 * 1.12 * unit)
    expect(r.plays[1].nonCrit).toBeCloseTo(1.2 * 1.12 * 2 * 1.6 * unit)
    const triangle = tip.cards!.find((p) => p.id === 'card-986')!.effects![0]
    expect(triangle.target).toBe('allies')
  })

  it('Creation and Destruction V: 168% x the play\'s Cost (the card\'s 5 unless set)', () => {
    const { cs, a } = ownerBuild()
    const v = cardFromPreset(preset('card-977'), 'Order')
    addCards(cs, v)
    a.rotation = [{ cardId: v.id, cost: 3 }, { cardId: v.id }]
    const r = computeBuild(PRESETS, 'Tiphera', cs, a, settings)
    const unit = 660 * 0.35
    expect(r.plays[0].nonCrit).toBeCloseTo(1.5 * 1.12 * 3 * unit)
    expect(r.plays[0].card.cost).toBe(3)
    expect(r.plays[1].nonCrit).toBeCloseTo(1.5 * 1.12 * 5 * unit)
  })

  it('Defense-Based matches DEF cards only', () => {
    expect(buffMatches({ appliesTo: 'Defense-Based', condition: 'Always' }, cardFromPreset(preset('card-958'), 'Order'))).toBe(true)
    expect(buffMatches({ appliesTo: 'Defense-Based', condition: 'Always' }, card('Strike', 'Attack', 1))).toBe(false)
  })
})

describe('Orlea', () => {
  const orl = PRESETS.characters.find((c) => c.name === 'Orlea')!
  const preset = (id: string) => orl.cards!.find((p) => p.id === id)!
  // Owner's screenshots (2026-10-28): E0 (Will of Light without Retain), Basic 1 (102%), Signature 7 (100% -> 114%)
  const ownerBuild = () => {
    const cs = newCharacterSave()
    const [a] = cs.builds
    Object.assign(a, { egoLevel: 0, basicLevel: 1, signatureLevel: 7 })
    a.stats.attack = 100
    return { cs, a }
  }

  it("card text matches the owner's in-game screenshots", () => {
    const { cs, a } = ownerBuild()
    const text = (id: string) => {
      const p = preset(id)
      const c = cardFromPreset(p, 'Instinct')
      const buffs = activeBuffs(PRESETS, 'Orlea', cs, a, settings)
      return renderCardText(p.text, { egoLevel: a.egoLevel, nodeOn: (n) => n !== '5-1', pct: (base, fixed) => shownPct(base, c, a, orl, buffs, settings, fixed) })
    }
    expect(text('card-122')).toBe('102% Damage')
    expect(preset('card-123').name).toBe('Healing of Light')
    expect(text('card-123')).toBe('Heal 102%\nHas a 50% chance to create 1 Creation★')
    expect(text('card-130')).toContain('Heal 114%')
    expect(text('card-132')).toContain('Heal 228%')
    expect(text('card-133')).toContain('Heal 171%')
    expect(text('card-136')).toBe('For each card in hand, 40% Fixed Damage and Heal 20%')
    expect(text('card-137')).toBe('40% Fixed Damage for each card in hand\nWhen there are 6 or more cards, Heal 228%')
    expect(text('card-138')).toBe('114% Defense-Based Damage\nFor each Creation in hand, +100% Damage Amount and Heal 68%')
    expect(text('card-139')).toContain('513% Defense-Based Damage\nHeal 228%')
    expect(text('card-140')).toContain('68% Defense-Based Damage × 3')
    expect(text('card-141')).toContain('137% Defense-Based Damage')
    expect(text('card-148')).toBe('Heal 228%\nActivate the Retain effect of all cards in hand')
    expect(text('card-149')).toContain('Increase Damage Amount by 10% for 1 turn')
    expect(text('card-150')).toBe('[Exhaust / Retain / Creation]\n114% Damage\nRetain: +40% Damage Amount')
    expect(text('card-151')).toBe('[Exhaust / Retain / Creation]\n114% Shield\nRetain: Heal 68%')
  })

  it('Annoying: 40% Fixed x the play\'s Cards in hand (1 unless set)', () => {
    const { cs, a } = ownerBuild()
    const ann = cardFromPreset(preset('card-136'), 'Instinct')
    addCards(cs, ann)
    a.rotation = [{ cardId: ann.id, stacks: { 'Cards in hand': 5 } }, { cardId: ann.id }]
    const r = computeBuild(PRESETS, 'Orlea', cs, a, settings)
    expect(r.plays[0].nonCrit).toBeCloseTo(5 * r.plays[1].nonCrit)
    expect(r.plays[1].nonCrit).toBeGreaterThan(0)
  })

  it('Swiftie: Retain +40% per turn, Softie Retain and Sacred Censer IV multiply', () => {
    const { cs, a } = ownerBuild()
    const censer = cardFromPreset(preset('card-128'), 'Instinct')
    addCards(cs, censer)
    a.rotation = [{ cardId: AUTO + 'card-150', stacks: { 'Swiftie retains': 2, 'Softie ★ retains': 3, 'Sacred Censer IV': 1 } }]
    const r = computeBuild(PRESETS, 'Orlea', cs, a, settings)
    // (114% x (1 + 30% + 40%) + 80%) x ATK 100 x 0.35
    expect(r.plays[0].nonCrit).toBeCloseTo((1.14 * 1.7 + 0.8) * 100 * 0.35)
  })
})

describe('deck', () => {
  const ross = PRESETS.characters.find((c) => c.name === 'Rossweisse')!
  const names = (b: Build) => buildDeck(ross, b).map((i) => `${i.card.name}${i.createdBy ? ` <${i.createdBy}>` : ''}`)

  it('the Ego skill comes with every deck; a picked card brings the cards it creates, once each', () => {
    const b = newBuild('A')
    expect(names(b)).toEqual(['Flickering White Night <Auto>'])
    b.deck = [{ id: 'f', preset: 'card-1384' }, { id: 'r', preset: 'card-1389' }, { id: 'f2', preset: 'card-1384' }]
    expect(names(b)).toEqual(['Flickering White Night <Auto>', 'Flicker Blade (Amped)', 'Shard:Light (Amped) <Flicker Blade (Amped)>',
      'Sword Tassel <Shard:Light (Amped)>', 'Shard:Dark (Amped) <Flicker Blade (Amped)>', 'Sword Resonance', 'Flicker Blade (Amped)'])
    expect(buildDeck(ross, b).find((i) => i.card.name === 'Sword Tassel')!.card.id).toBe(AUTO + 'card-1408')
  })

  it('removing the last card that creates one drops it and its plays', () => {
    const b = newBuild('A')
    b.deck = [{ id: 'f', preset: 'card-1383' }]
    b.rotation = [{ cardId: 'f' }, { cardId: AUTO + 'shard-light' }, { cardId: AUTO + 'card-1380' }]
    b.deck = []
    prunePlays(ross, b)
    expect(b.rotation).toEqual([{ cardId: AUTO + 'card-1380' }])
  })

  it('changing the epiphany keeps the plays, and moves the shard plays to the new shards', () => {
    const b = newBuild('A')
    b.deck = [{ id: 'f', preset: 'card-1384' }]
    b.rotation = [{ cardId: 'f', stacks: { 'Sword Tassel': 2 } }, { cardId: AUTO + 'card-1414' }, { cardId: AUTO + 'card-1408' }]
    changeEpiphany(ross, b, 'f', 'card-1385')
    expect(b.deck).toEqual([{ id: 'f', preset: 'card-1385' }])
    expect(b.rotation).toEqual([{ cardId: 'f', stacks: { 'Sword Tassel': 2 } }, { cardId: AUTO + 'card-1415' }, { cardId: AUTO + 'card-1408' }])
    // Sword Resonance has no shards: their plays go
    changeEpiphany(ross, b, 'f', 'card-1389')
    expect(b.rotation.map((p) => p.cardId)).toEqual(['f', AUTO + 'card-1408'])
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

describe('Mika', () => {
  const mika = PRESETS.characters.find((c) => c.name === 'Mika')!
  const preset = (id: string) => mika.cards!.find((p) => p.id === id)!
  // Owner's screenshots (2026-10-28): E6 (Basic 10 + 6 = 132%), Signature 1 + 6 (100% -> 114%), 5-1 not unlocked
  const ownerBuild = () => {
    const cs = newCharacterSave()
    const [a] = cs.builds
    Object.assign(a, { egoLevel: 6, basicLevel: 10, signatureLevel: 1 })
    a.stats.attack = 100
    return { cs, a }
  }

  it("card text matches the owner's in-game screenshots", () => {
    const { cs, a } = ownerBuild()
    const text = (id: string) => {
      const p = preset(id)
      const c = cardFromPreset(p, 'Justice')
      const buffs = activeBuffs(PRESETS, 'Mika', cs, a, settings)
      return renderCardText(p.text, { egoLevel: a.egoLevel, nodeOn: (n) => n !== '5-1', pct: (base, fixed) => shownPct(base, c, a, mika, buffs, settings, fixed) })
    }
    expect(text('card-543')).toBe('Create 2 Source of Water Card(s), grant Exhaust and Retain to it')
    expect(text('card-544')).toBe('132% Damage')
    expect(text('card-545')).toBe('Heal 172%')
    expect(text('card-546')).toBe('Heal 114%\nGain 1 AP')
    expect(text('card-547')).toContain('Heal 171%')
    expect(text('card-557')).toContain('Heal 57%')
    expect(text('card-559')).toContain('Heal 57%')
    expect(text('card-564')).toBe('228% Damage to all enemies\nHeal 50% for each target hit')
    expect(text('card-568')).toContain('342% Damage')
    expect(text('card-569')).toContain('Heal 114%\n114%(228%) Damage to all enemies')
    expect(text('card-570')).toBe('[Unique / Initiation]\n1 Wave\nAt the start of the turn, 1 Wave')
  })

  it('Whirlpool V counts the bracket value, 228%', () => {
    const { cs, a } = ownerBuild()
    const wv = cardFromPreset(preset('card-569'), 'Justice')
    addCards(cs, wv)
    a.rotation = [{ cardId: wv.id }]
    const r = computeBuild(PRESETS, 'Mika', cs, a, settings)
    expect(r.plays[0].nonCrit).toBeCloseTo(2.28 * 100 * 0.35)
  })
})

describe('Rei', () => {
  const rei = PRESETS.characters.find((c) => c.name === 'Rei')!
  const preset = (id: string) => rei.cards!.find((p) => p.id === id)!
  // Owner's screenshots (2026-10-28): E6, Basic 1 + 6 and Signature 1 + 6 (x1.14), 3-1 unlocked, 5-1 and 7 not
  const ownerBuild = () => {
    const cs = newCharacterSave()
    const [a] = cs.builds
    Object.assign(a, { egoLevel: 6, basicLevel: 1, signatureLevel: 1 })
    a.presetSwitches['Rei|p5-1-blade'] = false
    a.presetSwitches['Rei|p7-predator'] = false
    a.stats.attack = 100
    return { cs, a }
  }
  const card = (id: string) => cardFromPreset(preset(id), 'Controller')

  it("card text matches the owner's in-game screenshots", () => {
    const { cs, a } = ownerBuild()
    const text = (id: string) => {
      const p = preset(id)
      const c = cardFromPreset(p, 'Controller')
      const buffs = activeBuffs(PRESETS, 'Rei', cs, a, settings)
      return renderCardText(p.text, { egoLevel: a.egoLevel, nodeOn: () => true, pct: (base, fixed) => shownPct(base, c, a, rei, buffs, settings, fixed) })
    }
    expect(text('card-217')).toBe('400% Damage\n15% DMG-Based Recovery\nGain 1 AP')
    expect(text('card-218')).toBe('114% Damage\n20% DMG-Based Recovery')
    expect(text('card-219')).toBe('Heal 114%')
    expect(text('card-220')).toBe('[Lead]\n114% Damage\nIncrease Damage Amount of Basic Attack Cards by 100% for 1 turn')
    expect(text('card-221')).toContain('171% Damage\nIncreases Damage Amount of Basic Attack Cards by 150% for 1 turn')
    expect(text('card-222')).toBe('399% Damage\n20% DMG-Based Recovery\nDecrease Damage Amount by 20% for 1 turn')
    expect(text('card-226')).toBe('[Unique]\n+40% Damage Amount to 1-Cost cards\nAt the end of the turn, Heal 60%')
    expect(text('card-231')).toBe('Heal 114%\nFor 1 turn, +80% Damage Amount to 1-Cost cards')
    expect(text('card-232')).toBe('[Exhaust]\nChoose 1 card(s) in hand to Exhaust\nHeal 228%\nDraw 1')
    expect(text('card-235')).toContain('Heal 171%')
    expect(text('card-244')).toBe('285% Damage\nFor 1 turn, 4 Morale')
  })

  it('Strike of Darkness raises Basic Attack cards; II lowers the later cards; E6 adds +20% to Attack cards', () => {
    const { cs, a } = ownerBuild()
    const blade = card('card-218')
    const predator = card('card-244')
    addCards(cs, blade, predator, card('card-220'), card('card-222'), card('card-224'))
    a.rotation = [{ cardId: blade.id, stacks: { 'Strike of Darkness': 1 } }, { cardId: predator.id, stacks: { 'Strike of Darkness II': 1 } }]
    const r = computeBuild(PRESETS, 'Rei', cs, a, settings)
    // 114% x (1 + 100% + 80%) + E6 20%
    expect(r.plays[0].nonCrit).toBeCloseTo((1.14 * 2.8 + 0.2) * 100 * 0.35)
    // 285% x (1 - 20%) + E6 20%
    expect(r.plays[1].nonCrit).toBeCloseTo((2.85 * 0.8 + 0.2) * 100 * 0.35)
  })

  it('Resonating Darkness IV reaches 1-Cost or lower cards; E4 makes Final Shadow 400%', () => {
    const { cs, a } = ownerBuild()
    const blade = card('card-218')
    const ego = card('card-217')
    addCards(cs, blade, ego, card('card-230'))
    a.rotation = [{ cardId: blade.id }, { cardId: ego.id }]
    const r = computeBuild(PRESETS, 'Rei', cs, a, settings)
    expect(r.plays[0].nonCrit).toBeCloseTo((1.14 + 0.4 + 0.2) * 100 * 0.35)
    expect(r.plays[1].nonCrit).toBeCloseTo(4 * 100 * 0.35)
  })

  it("Potential 7 raises Predator's Blade's card % above 550 Attack", () => {
    const { cs, a } = ownerBuild()
    delete a.presetSwitches['Rei|p7-predator']
    a.stats.attack = 600
    const predator = card('card-244')
    addCards(cs, predator)
    a.rotation = [{ cardId: predator.id }]
    const r = computeBuild(PRESETS, 'Rei', cs, a, settings)
    // 250% x 1.14 x (1 + 10% + 5 x 1%) + E6 20%
    expect(r.plays[0].nonCrit).toBeCloseTo((2.5 * 1.14 * 1.15 + 0.2) * 600 * 0.35)
  })
})

describe('Tenebria', () => {
  const ten = PRESETS.characters.find((c) => c.name === 'Tenebria')!
  const preset = (id: string) => ten.cards!.find((p) => p.id === id)!
  // Owner's screenshots (2026-10-28): E1, Basic 10 (x1.20, Rhythm cards too), Signature 6 (x1.12), 3-1, 5-1 and 7 unlocked
  const ownerBuild = () => {
    const cs = newCharacterSave()
    const [a] = cs.builds
    Object.assign(a, { egoLevel: 1, basicLevel: 10, signatureLevel: 6 })
    a.stats.attack = 100
    return { cs, a }
  }
  const card = (id: string) => cardFromPreset(preset(id), 'Passion')

  it("card text matches the owner's in-game screenshots", () => {
    const { cs, a } = ownerBuild()
    const text = (id: string) => {
      const p = preset(id)
      const c = cardFromPreset(p, 'Passion')
      const buffs = activeBuffs(PRESETS, 'Tenebria', cs, a, settings)
      return renderCardText(p.text, { egoLevel: a.egoLevel, nodeOn: () => true, pct: (base, fixed) => shownPct(base, c, a, ten, buffs, settings, fixed) })
    }
    expect(text('card-1159')).toContain('increase Damage Amount of Rhythm cards by 7%')
    expect(text('card-1160')).toBe('120% Damage\nIncinerate: Heal 60%')
    expect(text('card-1161')).toBe('Heal 120%')
    expect(text('card-1168')).toBe('157% Damage\nMove 1 Rhythm card(s) to hand\nDecrease Cost of those cards by 2 until activated')
    expect(text('card-1169')).toContain('235% Damage')
    expect(text('card-1171')).toContain('392% Damage')
    expect(text('card-1174')).toBe('[Haste]\n224% Damage\nIf in hand, treat as a Rhythm card\nAttunement: Draw 1 Rhythm card(s)')
    expect(text('card-1175')).toContain('280% Damage')
    expect(text('card-1176')).toContain('269% Damage × 2')
    expect(text('card-1178')).toContain('134% Damage')
    expect(text('card-1179')).toContain('784% Damage')
    expect(text('card-1180')).toContain('134% Damage')
    expect(text('card-1182')).toContain('100% Damage to the enemy with the lowest HP')
    expect(text('card-1187')).toBe('72% Damage\n+30% base Damage Amount for each Rhythm\nProc 1 Rhythm in hand')
    expect(text('card-1188')).toContain('216% Damage\n+40% base Damage Amount')
    expect(text('card-1189')).toContain('96% Damage\n+50% base Damage Amount')
    expect(text('card-1190')).toContain('108% Damage\n+55% base Damage Amount')
    expect(['card-1192', 'card-1193', 'card-1194', 'card-1195', 'card-1196', 'card-1197'].map((id) => text(id).match(/(\d+)% Damage/)![1]))
      .toEqual(['18', '24', '48', '60', '96', '108'])
    expect(preset('card-1195').name).toBe('Rhythm: Arpeggio(3)')
  })

  it("Rhythm adds +30% base per Rhythm; Everyone's Idol and 5-1 raise Rhythm cards and Call & Response", () => {
    const { cs, a } = ownerBuild()
    const ego = card('card-1159')
    const rhythm = card('card-1187')
    const call = card('card-1174')
    addCards(cs, ego, rhythm, call)
    a.rotation = [{ cardId: rhythm.id, stacks: { Rhythms: 3, "Everyone's Idol": 1 } }, { cardId: call.id }]
    const r = computeBuild(PRESETS, 'Tenebria', cs, a, settings)
    // (60% x 1.2 + 3 x 30%) x (1 + 10% + 7%)
    expect(r.plays[0].nonCrit).toBeCloseTo((0.72 + 0.9) * 1.17 * 100 * 0.35)
    expect(r.plays[1].nonCrit).toBeCloseTo(2 * 1.12 * 1.1 * 100 * 0.35)
  })

  it('Arpeggio deals its % per Rhythm; Photo Time deals 150% per Performance Buzz at E1, not upgraded', () => {
    const { cs, a } = ownerBuild()
    const arp = card('card-1194')
    const photo = card('card-1186')
    addCards(cs, arp, photo)
    a.rotation = [{ cardId: arp.id, stacks: { Rhythms: 3 } }, { cardId: photo.id, stacks: { 'Performance Buzz': 4 } }]
    const r = computeBuild(PRESETS, 'Tenebria', cs, a, settings)
    expect(r.plays[0].nonCrit).toBeCloseTo(0.4 * 1.2 * 3 * 1.1 * 100 * 0.35)
    expect(r.plays[1].nonCrit).toBeCloseTo(4 * 1.5 * 100 * 0.35)
  })
})

describe('Adelheid', () => {
  const adel = PRESETS.characters.find((c) => c.name === 'Adelheid')!
  const preset = (id: string) => adel.cards!.find((p) => p.id === id)!
  // Owner's screenshots (2026-10-28): Ego 0 (Garden of Secrets costs 1, Happy Ending capped at 30%), Basic 5 (x1.10),
  // Signature 7 (x1.14, Doggie and Teddy cards too), 3-1 unlocked
  const ownerBuild = (egoLevel = 0) => {
    const cs = newCharacterSave()
    const [a] = cs.builds
    Object.assign(a, { egoLevel, basicLevel: 5, signatureLevel: 7 })
    a.stats.attack = 100
    a.stats.defense = 100
    return { cs, a }
  }
  const card = (id: string) => cardFromPreset(preset(id), 'Void')
  // Defense-Based: ATK x 0.3 + DEF x 2.1
  const stat = 100 * 0.3 + 100 * 2.1

  it("card text matches the owner's in-game screenshots", () => {
    const { cs, a } = ownerBuild()
    const text = (id: string) => {
      const p = preset(id)
      const c = cardFromPreset(p, 'Void')
      const buffs = activeBuffs(PRESETS, 'Adelheid', cs, a, settings)
      return renderCardText(p.text, { egoLevel: a.egoLevel, nodeOn: () => true, pct: (base, fixed) => shownPct(base, c, a, adel, buffs, settings, fixed) })
    }
    expect(text('card-1126')).toBe('300% Shield\nFixed Heal equal to Shield in possession\n(cannot exceed 30% of max HP)')
    expect(text('card-1127')).toBe('[Blessing]\n110% Defense-Based Damage')
    expect(text('card-1128')).toBe('[Blessing]\n110% Shield')
    expect(text('card-1147')).toBe('[Haste]\n228% Defense-Based Damage\n+100% Damage Amount taken by the target for 1 turn')
    expect(text('card-1148')).toContain('342% Defense-Based Damage\n2 Weaken')
    expect(text('card-1151')).toContain('456% Defense-Based Damage')
    expect(text('card-1152')).toContain('342% Defense-Based Damage')
    expect(text('card-1153')).toBe('[Unique]\n228% Shield\n25% Shield Retention')
    expect(text('card-1154')).toBe('[Haste / Blessing]\n68% Defense-Based Damage × 4')
    expect(text('card-1155')).toBe('[Haste / Blessing]\n228% Shield\n2 Damage Reduction')
    expect(text('card-1156')).toContain('228% Defense-Based Damage\nIncrease Damage Amount by 50% for each Doggie in hand')
    expect(text('card-1157')).toContain('103% Defense-Based Damage × 4')
    expect(text('card-1158')).toContain('342% Shield\n3 Damage Reduction')
    // At E3 (owner, 2026-10-28)
    expect(renderCardText(preset('card-1126').text, { egoLevel: 3, nodeOn: () => true, pct: (b) => b }))
      .toBe('500% Shield\nFixed Heal equal to Shield in possession\n(cannot exceed 50% of max HP)')
  })

  it("Truth's debuff counts on the plays after it; Truth III and Doggies in hand raise Doggie (Pack)", () => {
    const { cs, a } = ownerBuild()
    const truth = card('card-1147')
    const truth3 = card('card-1150')
    const pack = card('card-1156')
    addCards(cs, truth, truth3, pack)
    a.rotation = [{ cardId: truth.id },
      { cardId: pack.id, stacks: { 'Truth Behind A Story (on target)': 1, 'Truth Behind A Story III': 1, 'Doggies in hand': 2 } }]
    const r = computeBuild(PRESETS, 'Adelheid', cs, a, settings)
    expect(r.plays[0].nonCrit).toBeCloseTo(2.28 * stat * 0.35)
    // 228% x (1 + 100% + 2 x 50%) + 100% taken
    expect(r.plays[1].nonCrit).toBeCloseTo((2.28 * 3 + 1) * stat * 0.35)
  })

  it('Bliss of Dreams: 3% per stack (max 10) from E2, 8% (max 5) from E6', () => {
    for (const [ego, value] of [[2, 0.3], [6, 0.4]]) {
      const { cs, a } = ownerBuild(ego)
      const gather = card('card-1127')
      addCards(cs, gather)
      a.rotation = [{ cardId: gather.id, stacks: { 'Bliss of Dreams': 12 } }]
      const r = computeBuild(PRESETS, 'Adelheid', cs, a, settings)
      // E6 includes E5's +3 Basic levels (Basic 8)
      const basic = ego >= 5 ? 1.16 : 1.1
      expect(r.plays[0].nonCrit).toBeCloseTo(basic * (1 + value) * stat * 0.35)
    }
  })

  it('Potential 7 follows the stats-screen Defense: +5% above 300, +2% per 10 above, max +10% more', () => {
    const p7 = adel.effects.find((e) => e.id === 'p7-void')!
    if (p7.kind !== 'Buff') throw new Error('p7 is a buff')
    const at = (defense: number) => presetBuffValue(p7, { stats: { ...newBuild('x').stats, attack: 1000, defense } }).value
    expect(at(300)).toBe(0)
    expect(at(301)).toBeCloseTo(0.05)
    expect(at(325)).toBeCloseTo(0.05 + 0.04)
    expect(at(1000)).toBeCloseTo(0.15)
  })
})
