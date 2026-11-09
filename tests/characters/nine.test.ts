import { describe, expect, it } from 'vitest'
import { computeBuild, shownPct } from '../../src/engine/calc'
import { renderCardText } from '../../src/engine/cardText'
import { buildDeck } from '../../src/engine/deck'
import { activeBuffs } from '../../src/engine/buffs'
import { PRESETS } from '../../src/data/presets'
import { newCharacterSave } from '../../src/store/save'
import { type Build, type RotationPlay } from '../../src/engine/types'
import { cardFromPreset, settings } from '../helpers'

const NODES_OFF = { '3-1': false, '5-1': false, '7': false }

describe('Nine', () => {
  const nine = PRESETS.characters.find((c) => c.name === 'Nine')!
  const preset = (id: string) => nine.cards!.find((p) => p.id === id)!
  // Owner's screenshots (2026-11-01): level 1, Attack 138, Defense 50, every potential 0 or locked, no Ego
  const ownerBuild = (defense = 50) => {
    const cs = newCharacterSave()
    const [a] = cs.builds
    Object.assign(a, { egoLevel: 0, basicLevel: 0, signatureLevel: 0, potentialNodes: { ...NODES_OFF } })
    a.stats.attack = 138
    a.stats.defense = defense
    return { cs, a }
  }
  const unit = (def: number) => (138 * 0.3 + def * 2.1) * 0.35
  const damage = (id: string, play: Partial<RotationPlay> = {}, change: (a: Build) => void = () => {}, def = 50, pick = id) => {
    const { cs, a } = ownerBuild(def)
    a.deck.push({ id: 'c', preset: pick })
    change(a)
    a.rotation = [{ cardId: id === pick ? 'c' : `auto:${id}`, ...play }]
    return computeBuild(PRESETS, 'Nine', cs, a, settings).plays[0].nonCrit
  }

  it("card text matches the owner's in-game screenshots", () => {
    const { cs, a } = ownerBuild()
    const text = (id: string) => {
      const p = preset(id)
      const c = cardFromPreset(p, 'Order')
      const buffs = activeBuffs(PRESETS, 'Nine', cs, a, settings)
      return renderCardText(p.text, { egoLevel: a.egoLevel, nodeOn: () => false, pct: (base, fixed) => shownPct(base, c, a, nine, buffs, settings, fixed) })
    }
    expect(text('card-884')).toBe('250% Defense-Based Damage to all enemies\n+50% Damage Amount for each point of the combined Cost of the 2 highest-Cost cards, then Exhaust those cards')
    expect(text('card-885')).toBe('100% Defense-Based Damage')
    expect(text('card-886')).toBe('100% Shield')
    expect(text('card-887')).toBe('[Unique / Initiation / Exhaust / Ephemeral]\n350% Defense-Based Damage\nIncinerate: Create 1 Hew Lv. 1')
    expect(text('card-914')).toBe('[Unique / Exhaust / Retain]\n600% Defense-Based Damage\nIncinerate: At the start of the turn, create 1 Hew in hand')
    expect(text('card-917')).toBe('[Unique / Exhaust / Retain]\n700% Defense-Based Damage\n200% Shield\nIncinerate: At the start of the turn, create 1 Hew (Ironclad) in hand')
    expect(text('card-922')).toBe('[Unique / Exhaust / Retain]\n1000% Defense-Based Damage\nIncinerate: At the start of the turn, create 1 Hew (Extreme) in hand')
    expect(text('card-926')).toBe('[Unique / Exhaust / Ephemeral]\n480% Defense-Based Damage to all enemies\nDecrease Damage Amount by 10% for each target\nIncinerate: Create 1 Hew (Massacre) Lv. 2')
    expect(text('card-931')).toBe('[Unique / Exhaust / Retain]\n700% Defense-Based Damage\nOn ally Counterattack, proc this card\nIncinerate: At the start of the turn, create 1 Hew (Ambush) in hand')
    expect(text('card-893')).toBe('140% Defense-Based Damage\n20% DMG-Based Shield\nIncrease Damage Amount of Exhaust cards by 20% for 1 turn')
    expect(text('card-901')).toBe('260% Defense-Based Damage\nIncrease Damage Amount by 20% for each Cost of the highest-Cost card in hand')
    expect(text('card-904')).toBe('[Retain]\n210% Defense-Based Damage\nIncrease Damage Amount by 80% for each ally owning Counterattack')
    expect(text('card-910')).toBe('[Unique]\nAt the start of the turn, proc the Hew card in hand 1 times')
  })

  it('the E3 Ego skill shows 400% and +100%; E5 adds the +3 upgrade levels', () => {
    expect(renderCardText(preset('card-884').text, { egoLevel: 3, nodeOn: () => true, pct: (base) => base }))
      .toBe('400% Defense-Based Damage to all enemies\n+100% Damage Amount for each point of the combined Cost of the 2 highest-Cost cards, then Exhaust those cards')
    expect(nine.potentialEgo).toEqual([{ level: 5, levels: 3 }])
  })

  it('each Hew brings its own levels, E2 brings Exploit Opening', () => {
    const { a } = ownerBuild()
    a.deck.push({ id: 'h', preset: 'card-889' })
    expect(buildDeck(nine, a).map((i) => i.card.name)).toEqual(expect.arrayContaining(
      ['Hew (Extreme)', 'Hew (Extreme) Lv. 1', 'Hew (Extreme) Lv. 2', 'Hew (Extreme) Lv. 3', 'Hew (Extreme) Lv. 4', 'Hew (Extreme) Lv. 5']))
    expect(buildDeck(nine, a).map((i) => i.card.name)).not.toContain('Exploit Opening')
    a.egoLevel = 2
    expect(buildDeck(nine, a).map((i) => i.card.name)).toContain('Exploit Opening')
  })

  it('Defense-Based damage uses the Defense-Based stat', () => {
    expect(damage('card-885')).toBeCloseTo(unit(50))
  })

  it('Potentials 3-1 and 5-1 raise Slash, +5% more at Defense 250 or higher', () => {
    const nodes = (on: Partial<Record<keyof typeof NODES_OFF, boolean>>) => (a: Build) => { a.potentialNodes = { ...NODES_OFF, ...on } }
    expect(damage('card-885', {}, nodes({ '3-1': true }))).toBeCloseTo(1.3 * unit(50))
    expect(damage('card-885', {}, nodes({ '5-1': true }), 249)).toBeCloseTo(1.05 * unit(249))
    expect(damage('card-885', {}, nodes({ '3-1': true, '5-1': true }), 250)).toBeCloseTo(1.4 * unit(250))
    expect(damage('card-885', {}, (a) => { nodes({ '3-1': true, '5-1': true })(a); a.basicLevel = 10 }, 250))
      .toBeCloseTo(1.4 * 1.2 * unit(250))
  })

  it("Potential 3-1's Exhaust buff needs the node, reaches Exhaust cards only, max 2 stacks", () => {
    const stacks = { stacks: { 'Slash (Exhaust cards)': 3 } }
    const on = (a: Build) => { a.potentialNodes = { ...NODES_OFF, '3-1': true } }
    expect(damage('card-887', stacks, on)).toBeCloseTo(3.5 * 1.3 * unit(50))
    expect(damage('card-887', stacks)).toBeCloseTo(3.5 * unit(50))
    expect(damage('card-899', { stacks: { 'Slash (Exhaust cards)': 2 } }, on)).toBeCloseTo(1.4 * unit(50))
  })

  it("Potential 7's Order Damage is on the stats screen, so nothing is added on top", () => {
    const on = (a: Build) => { a.potentialNodes = { ...NODES_OFF, '7': true } }
    expect(damage('card-885', {}, on, 400)).toBeCloseTo(unit(400))
  })

  it('Reflection: Zero: +50% per combined Cost; E3 raises the base and the per-Cost bonus', () => {
    const cost = { stacks: { 'Combined Cost (2 highest)': 6 } }
    const ego = (level: number) => (a: Build) => { a.egoLevel = level }
    expect(damage('card-884', cost, () => {}, 50, 'card-885')).toBeCloseTo((2.5 + 3) * unit(50))
    expect(damage('card-884', cost, ego(3), 50, 'card-885')).toBeCloseTo((2.5 + 1.5 + 6) * unit(50))
    // Honed Edge reaches Attack Cards, and the Ego skill isn't one
    expect(damage('card-884', { ...cost, stacks: { ...cost.stacks, 'Honed Edge': 3 } }, (a) => { ego(3)(a); a.deck.push({ id: 'cb', preset: 'card-905' }) }, 50, 'card-885'))
      .toBeCloseTo((2.5 + 1.5 + 6) * unit(50))
  })

  it('Honed Edge, Honed Edge+ and E4 Improvisation reach Defense-Based Attack Cards, per stack', () => {
    const counterblade = (preset: string) => (a: Build) => { a.deck.push({ id: 'cb', preset }) }
    expect(damage('card-887', { stacks: { 'Honed Edge': 5 } }, counterblade('card-905'))).toBeCloseTo(3.5 * 1.6 * unit(50))
    expect(damage('card-887', { stacks: { 'Honed Edge+': 2 } }, counterblade('card-909'))).toBeCloseTo(3.5 * 1.4 * unit(50))
    expect(damage('card-887', { stacks: { Improvisation: 5 } }, (a) => { a.egoLevel = 4 })).toBeCloseTo((3.5 + 1.5) * unit(50))
    expect(preset('card-905').effects![0].target).toBeUndefined()
    expect(preset('card-909').effects![0].target).toBe('allies')
  })

  it('per-play card buffs', () => {
    const exhaust = (card: string) => (a: Build) => { a.deck.push({ id: 'es', preset: card }) }
    const strike = { stacks: { 'Experienced Strike (Exhaust cards)': 1 } }
    expect(damage('card-887', strike, exhaust('card-893'))).toBeCloseTo(3.5 * 1.2 * unit(50))
    expect(damage('card-887', strike, exhaust('card-894'))).toBeCloseTo(3.5 * 1.3 * unit(50))
    expect(damage('card-895', { stacks: { 'A card was Exhausted this turn': 1 } })).toBeCloseTo(2.1 * 1.3 * unit(50))
    expect(damage('card-897', { stacks: { 'Exhaust cards in hand': 2 } })).toBeCloseTo((1.4 + 1.2) * unit(50))
    expect(damage('card-899', { stacks: { 'Cost of highest-Cost Exhaust card in hand': 3 } })).toBeCloseTo(1.4 * 1.6 * unit(50))
    expect(damage('card-900', { stacks: { 'Cost of highest-Cost Exhaust card in hand': 3 } })).toBeCloseTo(2.1 * 1.9 * unit(50))
    expect(damage('card-901', { stacks: { 'Cost of highest-Cost card in hand': 3 } })).toBeCloseTo(2.6 * 1.6 * unit(50))
    expect(damage('card-904', { stacks: { 'Allies owning Counterattack': 2 } })).toBeCloseTo(2.1 * 2.6 * unit(50))
    expect(damage('card-887', { stacks: { 'Fatal Strike IV (cards Exhausted)': 3 } }, exhaust('card-903'))).toBeCloseTo(3.5 * 1.6 * unit(50))
  })

  it('Hew (Massacre) and its levels take -10%, other Hews none', () => {
    expect(damage('card-891')).toBeCloseTo(4 * 0.9 * unit(50))
    expect(damage('card-928', {}, () => {}, 50, 'card-891')).toBeCloseTo(7 * 0.9 * unit(50))
    expect(damage('card-890')).toBeCloseTo(4 * unit(50))
  })
})
