import { describe, expect, it } from 'vitest'
import { computeBuild, shownPct } from '../../src/engine/calc'
import { renderCardText } from '../../src/engine/cardText'
import { buildDeck } from '../../src/engine/deck'
import { activeBuffs } from '../../src/engine/buffs'
import { PRESETS } from '../../src/data/presets'
import { newCharacterSave } from '../../src/store/save'
import { type Build } from '../../src/engine/types'
import { addCards, cardFromPreset, settings } from '../helpers'

describe('Cassius', () => {
  const cassius = PRESETS.characters.find((c) => c.name === 'Cassius')!
  const preset = (id: string) => cassius.cards!.find((p) => p.id === id)!
  // Owner's screenshots (2026-10-28): Ego 6 (E3 + E5: +6 levels), Basic 13/16 (x1.26), Unique 12/16 (x1.24), 3-1 and 7 unlocked,
  // 5-1 locked
  const ownerBuild = (health = 500) => {
    const cs = newCharacterSave()
    const [a] = cs.builds
    Object.assign(a, { egoLevel: 6, basicLevel: 7, signatureLevel: 6 })
    a.stats.attack = 100
    a.stats.health = health
    return { cs, a }
  }
  const lockedNode = (b: Build) => { b.presetSwitches['Cassius|p5-1-cards'] = false }
  const card = (id: string) => cardFromPreset(preset(id), 'Instinct')

  it("card text matches the owner's in-game screenshots", () => {
    const { a } = ownerBuild()
    lockedNode(a)
    const text = (id: string) => {
      const p = preset(id)
      const c = cardFromPreset(p, 'Instinct')
      const buffs = activeBuffs(PRESETS, 'Cassius', a, settings)
      return renderCardText(p.text, { egoLevel: a.egoLevel, nodeOn: () => true, pct: (base, fixed) => shownPct(base, c, a, cassius, buffs, settings, fixed) })
    }
    expect(preset('card-573').name).toBe('Cards')
    expect(text('card-572')).toBe('Create 2 Quest card(s)\nDecrease Morale of all enemies by 5 for 1 turn')
    expect(text('card-573')).toBe('126% Damage\n30% chance to Draw 1')
    expect(text('card-574')).toBe('277% Damage\n30% chance to Draw 1')
    expect(text('card-575')).toBe('Heal 126%')
    expect(text('card-582')).toBe('198% Damage\nDraw 1')
    expect(text('card-583')).toBe('248% Damage\nCreate 1 Quest card(s)')
    expect(text('card-586')).toBe('298% Damage\nDraw 2\nDiscard 2')
    expect(text('card-587')).toBe("Draw 1\n99% Damage to all enemies equal to that card's Cost")
    expect(text('card-594')).toContain('298% Damage\nDecrease Morale by 1 for 1 turn')
    expect(text('card-595')).toContain('446% Damage')
    expect(text('card-596')).toContain('372% Damage to all enemies')
    expect(text('card-597')).toBe('99% Damage\n+80% base Damage Amount for each Quest completed (max 5 times)')
    expect(text('card-598')).toBe('[Unique]\nWhen a Quest card is activated, Heal 100%, then 100% Fixed Damage to a random enemy')
    expect(text('card-600')).toBe('Select 1 card(s) from Draw Pile or Discard Pile, then move those cards to hand')
    expect(text('card-605')).toContain('248% Damage\n+40% base Damage Amount')
    expect(text('card-880')).toContain('310% Damage\n+50% base Damage Amount')
    expect(text('card-881')).toBe('[Exhaust / Ephemeral]\nDraw 1\n248% Damage\nHeal 248%')
  })

  it('Quest cards join the deck with the cards that create them', () => {
    const { a } = ownerBuild()
    a.deck.push({ id: 'dt', preset: 'card-599' })
    const names = buildDeck(cassius, a).map((i) => i.card.name)
    expect(names).toEqual(expect.arrayContaining(['Death Trick', 'Triple 0', 'Full House', 'Empowered Triple 0', 'Empowered Full House']))
  })

  it("Dice Trick III and Triple 0 add base % per play; Devil Dice V x the drawn card's Cost; Dice Trick IV is Fixed", () => {
    const { cs, a } = ownerBuild()
    lockedNode(a)
    const [d3, t0, dd5, d4] = [card('card-597'), card('card-605'), card('card-587'), card('card-598')]
    addCards(cs, d3, t0, dd5, d4)
    a.rotation = [{ cardId: d3.id, stacks: { 'Completed Quests': 7 } }, { cardId: t0.id, stacks: { 'Attack Cards activated this turn': 2 } },
      { cardId: dd5.id, stacks: { "Drawn card's Cost": 2 } }, { cardId: d4.id }]
    const r = computeBuild(PRESETS, 'Cassius', a, settings)
    expect(r.plays[0].nonCrit).toBeCloseTo((0.8 * 1.24 + 5 * 0.8) * 100 * 0.35)
    expect(r.plays[1].nonCrit).toBeCloseTo((2 * 1.24 + 2 * 0.4) * 100 * 0.35)
    expect(r.plays[2].nonCrit).toBeCloseTo(0.8 * 1.24 * 2 * 100 * 0.35)
    expect(r.plays[3].nonCrit).toBeCloseTo(1 * 100 * settings.fixedAtkCoef)
  })

  it('Potential 5-1 raises Cards and Wild Card, +5% more at Health 600 or higher', () => {
    for (const [health, extra] of [[599, 0.05], [600, 0.1]]) {
      const { a } = ownerBuild(health)
      a.deck.push({ id: 'c', preset: 'card-573' })
      a.rotation = [{ cardId: 'c' }]
      const r = computeBuild(PRESETS, 'Cassius', a, settings)
      expect(r.plays[0].nonCrit).toBeCloseTo((1 + extra) * 1.26 * 100 * 0.35)
    }
  })
})
