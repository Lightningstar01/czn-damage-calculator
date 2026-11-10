import { describe, expect, it } from 'vitest'
import { computeBuild, shownPct } from '../../src/engine/calc'
import { renderCardText } from '../../src/engine/cardText'
import { activeBuffs } from '../../src/engine/buffs'
import { PRESETS } from '../../src/data/presets'
import { newCharacterSave } from '../../src/store/save'
import { cardFromPreset, gameSettings, settings } from '../helpers'

describe('Diana', () => {
  const diana = PRESETS.characters.find((c) => c.name === 'Diana')!
  const preset = (id: string) => diana.cards!.find((p) => p.id === id)!
  // Owner's screenshots (2026-11-09): Basic 1, Unique 8 (x1.16), 3-1 and 7 unlocked, 5-1 locked, Ego level 0
  const ownerBuild = () => {
    const cs = newCharacterSave()
    const [a] = cs.builds
    Object.assign(a, { egoLevel: 0, basicLevel: 1, signatureLevel: 8 })
    a.potentialNodes = { '5-1': false }
    a.stats.attack = 100
    return { cs, a }
  }
  const sig = 1.16
  const sum = (xs: { nonCrit: number }[]) => xs.reduce((s, t) => s + t.nonCrit, 0)

  it("card text matches the owner's in-game screenshots", () => {
    const { cs, a } = ownerBuild()
    const text = (id: string) => {
      const p = preset(id)
      const c = cardFromPreset(p, 'Passion')
      const buffs = activeBuffs(PRESETS, 'Diana', cs, a, gameSettings)
      return renderCardText(p.text, { egoLevel: a.egoLevel, nodeOn: (n) => a.potentialNodes?.[n] !== false,
        pct: (base, fixed) => shownPct(base, c, a, diana, buffs, gameSettings, fixed) })
    }
    expect(text('card-1033')).toBe('Create 1 Cupid Shot\nCreate 2 Heart Bullet')
    expect(text('card-1034')).toBe('102% Damage\nDiscard 1 random card(s) of this unit')
    expect(text('card-1035')).toBe('Heal 102%')
    expect(text('card-1036')).toBe('[Quietus]\n116% Damage\nCreate 2 Heart Breaker')
    expect(text('card-1037')).toBe('[Quietus]\n174% Damage\nCreate 3 Heart Breaker')
    expect(text('card-1048')).toBe('[Bullet / Quietus]\n139% Damage\n2 Resonance\nIf this card is Discarded, activate Resonance inflicted on the target by this unit 3 more times')
    expect(text('card-1051')).toBe('[Quietus]\n209% Damage\nActivate Resonance inflicted on the target by this unit 10 time(s)')
    expect(text('card-1052')).toBe('[Bullet / Quietus]\n209% Damage\n+100% base Damage Amount for each Bullet Discarded this turn')
    expect(text('card-1058')).toBe('Discard all Bullet cards in hand\n93% Extra Attack × that amount to a random enemy')
    expect(text('card-1060')).toBe('Draw 2 Exhaust Bullet card(s)\n348% Damage\nIncrease base Damage Amount by 30% for each different Bullet card in hand')
    expect(text('card-1062')).toBe('[Bullet / Haste / Exhaust]\n93% Damage\nDiscard 1 random Bullet card(s)\nIf this card is Discarded, 139% Extra Attack to a random enemy')
    expect(text('card-1063')).toBe('[Bullet / Quietus]\n139% Damage\n70% Extra Attack × Bullet card count in hand to a random enemy')
    expect(preset('card-1043').name).toBe("C'mere, Milk & Pong! I")
  })

  it('Resonance: one unraised 80% Extra Attack per activation set on any play', () => {
    const { cs, a } = ownerBuild()
    a.deck.push({ id: 'pp', preset: 'card-1048' })
    a.rotation = [{ cardId: 'pp' }, { cardId: 'pp', stacks: { 'Resonance activations': 3 } }]
    const r = computeBuild(PRESETS, 'Diana', cs, a, settings)
    expect(r.plays[0].nonCrit).toBeCloseTo(1.2 * sig * 35)
    expect(r.plays[0].triggered).toEqual([])
    expect(r.plays[1].nonCrit).toBeCloseTo((1.2 * sig + 3 * 0.8) * 35)
    expect(r.plays[1].triggered.every((t) => t.card.name === 'Resonance')).toBe(true)
    expect(sum(r.plays[1].triggered)).toBeCloseTo(3 * 0.8 * 35)
  })

  it("Heart Breaker's discard and Cupid Shot's per-Bullet Extra Attacks are raised by the Signature upgrade", () => {
    const { cs, a } = ownerBuild()
    a.deck.push({ id: 'wamh', preset: 'card-1036' })
    a.rotation = [{ cardId: 'auto:card-1062', stacks: { 'Heart Breakers Discarded': 2 } },
      { cardId: 'auto:card-1063', stacks: { 'Bullet cards in hand': 3 } }]
    const r = computeBuild(PRESETS, 'Diana', cs, a, settings)
    // a play's total includes the hits it triggers
    expect(r.plays[0].nonCrit).toBeCloseTo((0.8 + 2 * 1.2) * sig * 35)
    expect(sum(r.plays[0].triggered)).toBeCloseTo(2 * 1.2 * sig * 35)
    expect(r.plays[1].nonCrit).toBeCloseTo((1.2 + 3 * 0.6) * sig * 35)
    expect(r.plays[1].triggered.every((t) => t.card.name === 'Cupid Shot (Extra Attack)')).toBe(true)
    expect(sum(r.plays[1].triggered)).toBeCloseTo(3 * 0.6 * sig * 35)
  })

  it('Liberated Feelings x(1 + 30% per different Bullet), Pistol IV +100% base per Bullet, Blooming Love IV 80% per Bullet', () => {
    const { cs, a } = ownerBuild()
    a.deck.push({ id: 'lf', preset: 'card-1060' }, { id: 'p4', preset: 'card-1052' }, { id: 'bl4', preset: 'card-1058' })
    a.rotation = [{ cardId: 'lf', stacks: { 'Different Bullet cards in hand': 2 } }, { cardId: 'p4', stacks: { 'Bullets Discarded this turn': 2 } },
      { cardId: 'bl4', stacks: { 'Bullet cards Discarded': 4 } }]
    const r = computeBuild(PRESETS, 'Diana', cs, a, settings)
    expect(r.plays[0].nonCrit).toBeCloseTo(3 * sig * 1.6 * 35)
    expect(r.plays[1].nonCrit).toBeCloseTo((1.8 * sig + 2) * 35)
    expect(r.plays[2].hits).toHaveLength(4)
    expect(r.plays[2].nonCrit).toBeCloseTo(4 * 0.8 * sig * 35)
  })

  it('E2 Flutters: 200% Extra Attack, by 10% per Flutters (max 20 below E6); E4 +30% and +1% per Flutters', () => {
    const { cs, a } = ownerBuild()
    a.egoLevel = 2
    a.rotation = [{ cardId: 'auto:flutters', stacks: { Flutters: 25 } }]
    let r = computeBuild(PRESETS, 'Diana', cs, a, settings)
    expect(r.plays[0].nonCrit).toBeCloseTo(2 * (1 + 2) * 35)
    a.egoLevel = 4
    a.rotation = [{ cardId: 'auto:flutters', stacks: { Flutters: 10 } }]
    r = computeBuild(PRESETS, 'Diana', cs, a, settings)
    expect(r.plays[0].nonCrit).toBeCloseTo((2 * 2 + 0.3 + 0.1) * 35)
  })
})
