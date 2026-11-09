import { describe, expect, it } from 'vitest'
import { computeBuild, shownPct } from '../../src/engine/calc'
import { renderCardText } from '../../src/engine/cardText'
import { activeBuffs } from '../../src/engine/buffs'
import { AUTO, buildDeck } from '../../src/engine/deck'
import { PRESETS } from '../../src/data/presets'
import { newCharacterSave } from '../../src/store/save'
import type { Build, RotationPlay } from '../../src/engine/types'
import { cardFromPreset, settings } from '../helpers'

describe('Rita', () => {
  const rita = PRESETS.characters.find((c) => c.name === 'Rita')!
  const preset = (id: string) => rita.cards!.find((p) => p.id === id)!
  // Owner's screenshots (2026-11-08): E1, Basic 10, Common 1, Unique 8, nodes 3-1, 5-1 and 7 unlocked, Attack 881
  const ownerBuild = () => {
    const cs = newCharacterSave()
    const [a] = cs.builds
    Object.assign(a, { egoLevel: 1, basicLevel: 10, signatureLevel: 8 })
    a.stats.attack = 881
    return { cs, a }
  }
  const UNIT = 881 * 0.35
  const SIG = 1.16
  /** One play of a card; `id` is a preset id added to the deck, or an auto: id of a card that joins by itself. */
  const play = (id: string, extra: Partial<RotationPlay> = {}, change: (a: Build) => void = () => {}) => {
    const { cs, a } = ownerBuild()
    change(a)
    if (!id.startsWith(AUTO)) a.deck.push({ id: 'c', preset: id })
    a.rotation = [{ cardId: id.startsWith(AUTO) ? id : 'c', ...extra }]
    return computeBuild(PRESETS, 'Rita', cs, a, settings).plays[0]
  }
  const text = (id: string, change: (a: Build) => void = () => {}) => {
    const { cs, a } = ownerBuild()
    change(a)
    const p = preset(id)
    const c = cardFromPreset(p, 'Justice')
    const buffs = activeBuffs(PRESETS, 'Rita', cs, a, settings)
    return renderCardText(p.text, { egoLevel: a.egoLevel, nodeOn: (n) => a.potentialNodes?.[n] !== false, pct: (base, fixed) => shownPct(base, c, a, rita, buffs, settings, fixed) })
  }

  it("card text matches the owner's in-game screenshots", () => {
    expect(text('card-990')).toBe('6 Chronal Ascension\nIncrease Damage Amount of the next Attack Card of this unit activated by 10% for each Cost of cards activated this battle (max 200%)')
    expect(text('card-990', (a) => { a.egoLevel = 3 })).toContain('by 20% for each Cost of cards activated this battle (max 300%)')
    expect(text('card-991')).toBe('492% Damage')
    expect(text('card-992')).toBe('Heal 120%')
    expect(text('card-995')).toContain('At the end of the turn, 100% Damage to a random enemy for each Chronal Ascension')
    expect(text('card-999')).toBe('348% Damage\nIncrease Damage Amount by 20% for each Cost of cards in hand\n(max 200%)')
    expect(text('card-1000')).toContain('522% Damage')
    expect(text('card-1001')).toBe('348% Damage\nIncrease Damage Amount by 30% for each 1-Cost or lower card in hand')
    expect(text('card-1003')).toBe('[Retain]\n464% Damage\n2 Vulnerable\nWhen Chronal Ascension is gained, proc this card if in hand')
    expect(text('card-1004')).toBe('290% Damage\nChange Cost of all Fate Imprint in hand to 4')
    expect(text('card-1010')).toBe('[Unique]\nWhen a card whose Cost is increased is used, 300% Damage to a random enemy')
    expect(text('card-1017')).toBe('[Unique]\nDecrease all Chronicle\nChronal Ascension for each decreased. If decreased by 6, 8 Chronal Ascension')
    expect(text('card-1017', (a) => { a.egoLevel = 0 })).toBe('[Unique]\nDecrease all Chronicle\nChronal Ascension for each decreased')
    expect(text('card-1018')).toBe('[Retain / Exhaust]\n139% Damage for each Cost of this card\nIncrease Cost of all Fate Imprint in hand by 1\nWhen this card leaves the hand, change Cost to 2')
  })

  it('3-1 and 5-1 raise Time Acceleration to 492% (Attack 500+), 486% below 500 Attack', () => {
    expect(play('card-991').nonCrit).toBeCloseTo(4.92 * UNIT)
    expect(play('card-991', {}, (a) => { a.stats.attack = 499 }).nonCrit).toBeCloseTo(4.86 * 499 * 0.35)
    expect(play('card-991', {}, (a) => { a.potentialNodes = { '3-1': false, '5-1': false } }).nonCrit).toBeCloseTo(4.2 * UNIT)
  })

  it('Time Axis Collapse: 20% for each Cost in hand, max 200%', () => {
    expect(play('card-999', { stacks: { 'Cost of cards in hand': 5 } }).nonCrit).toBeCloseTo(3 * SIG * UNIT * 2)
    expect(play('card-999', { stacks: { 'Cost of cards in hand': 14 } }).nonCrit).toBeCloseTo(3 * SIG * UNIT * 3)
  })

  it('Hour of Glory: 10% per Cost activated (max 200%); from E3 20% (max 300%)', () => {
    const glory = { stacks: { 'Hour of Glory (Cost activated this battle)': 30 } }
    expect(play('card-991', glory).nonCrit).toBeCloseTo(4.92 * UNIT * 3)
    expect(play('card-991', glory, (a) => { a.egoLevel = 3 }).nonCrit).toBeCloseTo(4.92 * UNIT * 4)
  })

  it('Fate Imprint joins with Chrono Circle and is 120% x its Cost; Fate Distortion (E2) adds 30% + 10% per Cost', () => {
    const { a } = ownerBuild()
    a.deck.push({ id: 'cc', preset: 'card-1011' })
    expect(buildDeck(rita, a).map((i) => i.card.name)).toEqual(['Hour of Glory', 'Chrono Circle', 'Fate Imprint'])
    const circle = (a: Build) => a.deck.push({ id: 'cc', preset: 'card-1011' })
    expect(play(AUTO + 'card-1018', { cost: 3 }, circle).nonCrit).toBeCloseTo(1.2 * SIG * 3 * UNIT)
    const e2 = (a: Build) => { circle(a); a.egoLevel = 2 }
    const p = play(AUTO + 'card-1018', { cost: 3, stacks: { 'Fate Distortion': 1 } }, e2)
    expect(p.nonCrit).toBeCloseTo(1.2 * SIG * 3 * UNIT * 1.6)
    // Time Acceleration costs 3 too
    expect(play('card-991', { stacks: { 'Fate Distortion': 1 } }, (a) => { a.egoLevel = 2 }).nonCrit).toBeCloseTo(4.92 * UNIT * 1.6)
  })

  it('Chrono Archon II: one unraised 100% hit per Chronal Ascension; Future Decreed V: an unraised 300%', () => {
    const p = play('card-995', { stacks: { 'Chronal Ascension': 6 } })
    expect(p.hits).toHaveLength(6)
    expect(p.nonCrit).toBeCloseTo(6 * UNIT)
    expect(play('card-1010').nonCrit).toBeCloseTo(3 * UNIT)
  })

  it('E4 Trace of Memory: 5% per stack on every card, max 6', () => {
    const e4 = (a: Build) => { a.egoLevel = 4 }
    expect(play('card-991', { stacks: { 'Trace of Memory': 9 } }, e4).nonCrit).toBeCloseTo(4.92 * UNIT * 1.3)
  })
})
