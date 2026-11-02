import { describe, expect, it } from 'vitest'
import { computeBuild, shownPct } from '../../src/engine/calc'
import { renderCardText } from '../../src/engine/cardText'
import { AUTO, buildDeck, changeEpiphany, prunePlays } from '../../src/engine/deck'
import { activeBuffs } from '../../src/engine/buffs'
import { ADDITIONS, IMPORTED, PARTNERS, PRESETS } from '../../src/data/presets'
import { checkAdditions, checkEffects, checkPartnersAndSets, mergeCharacter } from '../../src/data/merge'
import { newBuild, newCharacterSave } from '../../src/store/save'
import { type Build, type Card, type Effect, type PartnerPreset } from '../../src/engine/types'
import { addCards, cardFromPreset, newCard, noStrikeNode, plays, setPlays, settings } from '../helpers'

describe('card presets', () => {
  const mei = PRESETS.characters.find((c) => c.name === 'Mei Lin')!
  const preset = (id: string) => mei.cards!.find((p) => p.id === id)!

  it('every character is imported; the additions files match the import', () => {
    expect(PRESETS.characters.length).toBe(Object.keys(IMPORTED).length)
    expect(new Set(PRESETS.characters.map((c) => c.name)).size).toBe(PRESETS.characters.length)
    expect(checkAdditions(IMPORTED, ADDITIONS)).toEqual([])
    const verified = { date: '2026-10-30', gameVersion: '841' }
    expect(checkAdditions(IMPORTED, { nobody: {}, 'mei-lin': { verified, cards: { 'card-0': {} } } })).toHaveLength(2)
    expect(checkAdditions(IMPORTED, { 'mei-lin': { verified, cards: { 'card-338': { creates: ['card-0'] } } } })).toHaveLength(1)
    const badEgo = { ...PRESETS.characters[0].effects[0], kind: 'Buff', id: 'x', egoLevel: 7 } as never
    expect(checkAdditions(IMPORTED, { 'mei-lin': { verified, effects: [badEgo] } })).toHaveLength(1)
    expect(checkAdditions(IMPORTED, { 'mei-lin': {} })).toEqual(["characters/mei-lin.ts: no verified date and game version"])
  })

  it('the additions checks catch Potential nodes, Ego levels and text tokens that point nowhere', () => {
    const verified = { date: '2026-10-30', gameVersion: '841' }
    const check = (add: object) => checkAdditions(IMPORTED, { 'mei-lin': { verified, ...add } })
    expect(check({ ego: { 7: { text: 'x' } } })).toHaveLength(1)
    expect(check({ potentials: { '9-9': { text: 'x' } } })).toHaveLength(1)
    expect(check({ effects: [{ ...PRESETS.characters[0].effects[0], id: 'x', node: '9-9' }] })).toHaveLength(1)
    expect(check({ cards: { 'card-338': { nodeTags: { '9-9': 'X' } } } })).toHaveLength(1)
    expect(check({ cards: { 'card-338': { nodeCard: { '9-9': { hits: 2 } } } } })).toHaveLength(1)
    expect(check({ cards: { 'card-338': { text: '{P9-9:x} {100%@card-0}' } } })).toHaveLength(2)
    // Per-play counters named only once: a misspelling would do nothing, or split one switch in two
    expect(check({ playStacks: { Stance: 1 } })).toHaveLength(1)
    expect(check({ cards: { 'card-338': { counterHits: { counter: 'Stance', hits: 1 } } } })).toHaveLength(1)
    expect(check({ playStacks: { Stance: 1 }, cards: { 'card-338': { counterHits: { counter: 'Stanse', hits: 1 } } } })).toHaveLength(2)
    expect(check({ playStacks: { Stance: 1 }, cards: { 'card-338': { counterHits: { counter: 'Stance', hits: 1 } } } })).toEqual([])
    const fixedOf = (name: string) => ({ scaling: 'Fixed', fixedOf: name })
    expect(check({ cards: { 'card-338': fixedOf('Shield') } })).toHaveLength(1)
    expect(check({ playStacks: { Shield: 0 }, cards: { 'card-338': fixedOf('Shield') } })).toEqual([])
    expect(check({ playStacks: { Shield: 0 }, cards: { 'card-338': { ...fixedOf('Shield'), scaling: 'ATK' } } })).toHaveLength(1)
    expect(check({ cards: { 'card-338': { text: '{E7:x} {E30:6|4} {E1:x}' } } })).toHaveLength(2)
    expect(check({ cards: { 'card-338': { triggers: [{ card: 'card-338', on: 'Attack', egoLevel: 7 }] } } })).toHaveLength(1)
  })

  it('no effect silently does nothing: every "Applies to", trigger and value reads', () => {
    const others = [...PRESETS.partners, ...PRESETS.fragmentSets]
    expect(checkEffects(PRESETS.characters, others)).toEqual([])
    const buff = { kind: 'Buff', id: 'x', name: 'X', category: 'Other', value: '+5%', appliesTo: 'ALL', hitScope: 'All hits', condition: 'Always' } as const
    const mei2 = (effects: Effect[]) => [{ ...mei, effects }]
    expect(checkEffects(mei2([{ ...buff, appliesTo: 'Strik' }]), [])).toHaveLength(1)
    expect(checkEffects(mei2([{ ...buff, value: 'five' }]), [])).toHaveLength(1)
    expect(checkEffects(mei2([{ ...buff, thresholdBonus: { above: 1, value: 'x' } }]), [])).toHaveLength(1)
    expect(checkEffects(mei2([{ ...buff, thresholdBonus: { above: 1, value: '+5%', every: 10, max: '10 percent' } }]), [])).toHaveLength(1)
    expect(checkEffects([{ ...mei, effects: [], triggers: [{ card: 'c', on: 'Nothing' }] }], [])).toHaveLength(1)
    expect(checkEffects(mei2([]), [{ name: 'P', effects: [{ ...buff, appliesTo: 'Nothing' }] }])).toHaveLength(1)
    expect(checkEffects(mei2([{ ...buff, appliesTo: 'DoT' }]), [])).toHaveLength(1)
  })

  it('card ids keep pointing at the same cards (a re-import that moves them must be looked at: saves and additions use them)', async () => {
    const ids = Object.fromEntries(Object.values(IMPORTED).sort((a, b) => a.slug.localeCompare(b.slug))
      .map((c) => [c.slug, Object.fromEntries([...c.cards].sort((a, b) => a.id.localeCompare(b.id)).map((x) => [x.id, x.name]))]))
    await expect(`${JSON.stringify(ids, null, 1)}\n`).toMatchFileSnapshot('../fixtures/card-ids.json')
  })

  it('in-game wording replaces the text only: Ego overrides never change what the import says about levels', () => {
    const imported = IMPORTED['mei-lin']
    const before = mergeCharacter(imported)
    const merged = mergeCharacter(imported, { ego: { 5: { text: 'Other wording' }, 1: { name: 'In-game name' } } })
    expect(merged.manifestEgo!.find((m) => m.level === 5)!.text).toBe('Other wording')
    expect(merged.manifestEgo!.find((m) => m.level === 1)!.name).toBe('In-game name')
    expect(merged.potentialEgo).toEqual(before.potentialEgo)
    expect(before.potentialEgo!.length).toBeGreaterThan(0)
  })

  it('reviewed characters carry when they were verified, the rest are marked not reviewed', () => {
    expect(mei.verified).toEqual({ date: '2026-10-30', gameVersion: '841' })
    expect(PRESETS.characters.filter((c) => c.verified).map((c) => c.slug).sort()).toEqual(Object.keys(ADDITIONS).sort())
    expect(PRESETS.characters.some((c) => !c.verified)).toBe(true)
  })

  it('partners and fragment sets have default exports, unique names and unique effect ids', () => {
    expect(checkPartnersAndSets(PARTNERS, PRESETS.fragmentSets)).toEqual([])
    const effect = PRESETS.fragmentSets[0].effects[0]
    const partner: PartnerPreset = { name: 'P', class: 'Vanguard', baseHp: 0, baseDef: 0, baseAtk: 0, effects: [effect, effect] }
    expect(checkPartnersAndSets({ none: undefined }, [])).toEqual(['partners/none.ts: no default export'])
    expect(checkPartnersAndSets({ p: partner }, [])).toHaveLength(1)
    expect(checkPartnersAndSets({ p: { ...partner, effects: [] } }, [{ name: 'P', pieces: 2, effects: [] }])).toHaveLength(1)
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

  it('additions merge into the imported cards', () => {
    expect(mei).toMatchObject({ element: 'Passion', class: 'Striker' })
    expect(preset('card-345')).toMatchObject({ name: "Flame Dragon's Jewel V", targetRavaged: true, cardType: 'Upgrade' })
    expect(preset('card-344').effects?.[0]).toMatchObject({ kind: 'Stat', stat: 'Crit Rate', value: '30%' })
    expect(preset('card-364').notes).toContain('Mythic')
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
    // Strike also has potential 5-1: +5%, +5% more from 500 Attack (x1.1 on the card %)
    expect(mults()).toEqual([1.1, spire.pct, 1.5].map((x) => expect.closeTo(x)))
    a.basicLevel = 10
    a.signatureLevel = 6
    // the owner's in-game Strike: 132% at Basic Card Upgrade 10
    expect(mults()).toEqual([1.32, spire.pct * 1.12, 1.5].map((x) => expect.closeTo(x)))
    // the extra +5% follows the stats-screen Attack (500 or higher)
    a.stats.attack = 500
    expect(mults()[0]).toBeCloseTo(1.2 * 1.1)
    a.stats.attack = 499
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

})
