import { describe, expect, it } from 'vitest'
import { computeBuild, shownPct } from '../../src/engine/calc'
import { renderCardText } from '../../src/engine/cardText'
import { activeBuffs } from '../../src/engine/buffs'
import { PRESETS } from '../../src/data/presets'
import { newCharacterSave } from '../../src/store/save'
import { cardFromPreset, settings } from '../helpers'

describe('Heidemarie', () => {
  const heidemarie = PRESETS.characters.find((c) => c.name === 'Heidemarie')!
  const preset = (id: string) => heidemarie.cards!.find((p) => p.id === id)!
  // Owner's screenshots (2026-11-09): E2, Basic 1 (x1.02), Unique 8 (x1.16), Attack 960, 3-1 and 7 unlocked, 5-1 locked
  const ownerBuild = (egoLevel = 2) => {
    const cs = newCharacterSave()
    const [a] = cs.builds
    Object.assign(a, { egoLevel, basicLevel: 1, signatureLevel: 8, potentialNodes: { '5-1': false } })
    a.stats.attack = 100
    return { cs, a }
  }
  const text = (id: string, b = ownerBuild()) => {
    const p = preset(id)
    const buffs = activeBuffs(PRESETS, 'Heidemarie', b.cs, b.a, settings)
    return renderCardText(p.text, { egoLevel: b.a.egoLevel, nodeOn: (n) => b.a.potentialNodes?.[n] !== false,
      pct: (base, fixed, of) => shownPct(base, cardFromPreset(of ? preset(of) : p, 'Passion'), b.a, heidemarie, buffs, settings, fixed) })
  }
  const run = (b: ReturnType<typeof ownerBuild>) => computeBuild(PRESETS, 'Heidemarie', b.cs, b.a, settings)

  it("card text matches the owner's in-game screenshots", () => {
    expect(text('card-1064')).toBe('400% Damage\n+80% Damage Amount for each card Discarded this battle (max 20 cards)')
    expect(text('card-1065')).toBe('102% Damage\n+30% Damage Amount to Effulgent Blade for 1 turn')
    expect(text('card-1066')).toBe('102% Shield')
    expect(text('card-1067')).toBe('[Linked]\n93% Damage × 2\nAttunement: Create 1 Effulgent Blade')
    expect(text('card-1069')).toContain('209% Damage\nAdd 1 Hit for each Effulgent Blade in hand before activation')
    expect(text('card-1072')).toContain('580% Damage to all enemies')
    expect(text('card-1079')).toBe('[Linked]\n139% Damage\n+120% Damage Amount for each Linked card in hand before activation')
    expect(text('card-1080')).toContain('209% Damage\n+180% Damage Amount')
    expect(text('card-1081')).toContain('348% Damage')
    expect(text('card-1082')).toContain('116% Damage')
    expect(text('card-1084')).toBe('[Linked / Unique]\nWhen used, 406% Damage × 2\nWhen this card is Discarded, 348% Damage to all enemies')
    expect(text('card-1092')).toBe('[Linked]\n139% Damage\nWhen this card is Discarded, 139% Extra Attack to a random enemy\n'
      + 'This card does not move to Draw Pile on Shuffle')
    expect(text('card-1093')).toBe('[Unique]\n812% Damage\nExhaust all Effulgent Blade in Graveyard, then +120% base Damage Amount for each '
      + 'Exhausted\nAt the end of the turn, change this card into Effulgent Compression')
  })

  it('Ego levels and nodes change the text', () => {
    expect(text('card-1064', ownerBuild(3))).toBe('600% Damage\n+100% Damage Amount for each card Discarded this battle (max 30 cards)')
    expect(text('card-1093', ownerBuild(0))).toContain('580% Damage\nExhaust all Effulgent Blade in Graveyard, then +100% base')
    const b = ownerBuild()
    b.a.potentialNodes = { '3-1': false, '5-1': false }
    expect(text('card-1065', b)).toBe('102% Damage')
    b.a.potentialNodes = {}
    b.a.stats.attack = 500
    expect(text('card-1065', b)).toBe('112% Damage\n+30% Damage Amount to Effulgent Blade for 1 turn')
  })

  it('Effulgent Blades discarded on a play add their Extra Attacks, raised by the Blade buffs', () => {
    const b = ownerBuild()
    b.a.deck.push({ id: 'rain', preset: 'card-1067' }, { id: 'exp', preset: 'card-1085' }, { id: 'flash', preset: 'card-1065' })
    b.a.rotation = [
      { cardId: 'rain', stacks: { 'Effulgent Blades discarded': 2 } },
      { cardId: 'rain', stacks: { 'Effulgent Blades discarded': 1, 'Effulgent Expansion this turn': 1, 'Sword Flash this turn': 1 } },
      { cardId: 'auto:card-1092', stacks: { 'Effulgent Expansion this turn': 1 } },
    ]
    const r = run(b)
    const blade = 1.2 * 1.16
    expect(r.plays[0].nonCrit).toBeCloseTo(0.8 * 1.16 * 2 * 35 + 2 * blade * 35)
    expect(r.plays[0].triggered[0].card.kind).toBe('Extra Attack')
    expect(r.plays[0].triggered[0].hits).toHaveLength(2)
    // Expansion's +50% and 3-1's +30% reach the discarded Blade, not Sword Rain
    expect(r.plays[1].nonCrit).toBeCloseTo(0.8 * 1.16 * 2 * 35 + (blade + 0.8) * 35)
    expect(r.plays[2].nonCrit).toBeCloseTo((blade + 0.5) * 35)
  })

  it("Sword Rain III procs 5 Blades; E2's Crimson Blade adds unraised 120% Extra Attacks", () => {
    const b = ownerBuild()
    b.a.deck.push({ id: 'r3', preset: 'card-1070' }, { id: 'thread', preset: 'card-1079' })
    b.a.rotation = [
      { cardId: 'r3', stacks: { 'Effulgent Expansion this turn': 0 } },
      { cardId: 'thread', stacks: { 'Crimson Blade activations': 3, 'Linked cards in hand': 2 } },
    ]
    let r = run(b)
    expect(r.plays[0].nonCrit).toBeCloseTo(5 * 1.2 * 1.16 * 35)
    expect(r.plays[0].triggered[0].hits).toHaveLength(5)
    expect(r.plays[1].nonCrit).toBeCloseTo((1.2 * 1.16 + 2 * 1.2) * 35 + 3 * 1.2 * 35)
    b.a.egoLevel = 0
    r = run(b)
    expect(r.plays[1].nonCrit).toBeCloseTo((1.2 * 1.16 + 2 * 1.2) * 35)
  })

  it('Thread of Light II triples the hit; V discarded is a play of its own; Release and the Ego skill count per play', () => {
    const b = ownerBuild()
    b.a.deck.push({ id: 't2', preset: 'card-1081' }, { id: 't5', preset: 'card-1084' }, { id: 'comp', preset: 'card-1091' })
    b.a.rotation = [
      { cardId: 't2', stacks: { 'Thread of Light II: 3+ Linked cards in hand': 1 } },
      { cardId: 'auto:tl5-discard' },
      { cardId: 'auto:card-1093', stacks: { 'Effulgent Blades exhausted': 4 } },
      { cardId: 'auto:card-1064', stacks: { 'Cards discarded this battle': 25 } },
    ]
    const r = run(b)
    expect(r.plays[0].nonCrit).toBeCloseTo(3 * 1.16 * 35 * 3)
    expect(r.plays[1].nonCrit).toBeCloseTo(3 * 1.16 * 35)
    expect(r.plays[2].nonCrit).toBeCloseTo((7 * 1.16 + 4 * 1.2) * 35)
    expect(r.plays[3].nonCrit).toBeCloseTo((4 + 20 * 0.8) * 35)
  })
})
