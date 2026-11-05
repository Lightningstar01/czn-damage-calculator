import { describe, expect, it } from 'vitest'
import { computeBuild, shownPct } from '../../src/engine/calc'
import { renderCardText } from '../../src/engine/cardText'
import { activeBuffs } from '../../src/engine/buffs'
import { PRESETS } from '../../src/data/presets'
import { newCharacterSave } from '../../src/store/save'
import { cardFromPreset, settings } from '../helpers'

describe('Renoa', () => {
  const renoa = PRESETS.characters.find((c) => c.name === 'Renoa')!
  const preset = (id: string) => renoa.cards!.find((p) => p.id === id)!
  // Owner's screenshots (2026-10-30): E0, Basic 5 (x1.1), Unique 8 (x1.16), Critical Chance 53.6%, 3-1 and 7 unlocked, 5-1 locked
  const ownerBuild = (egoLevel = 0, critChance = 0.536) => {
    const cs = newCharacterSave()
    const [a] = cs.builds
    Object.assign(a, { egoLevel, basicLevel: 5, signatureLevel: 8 })
    a.stats.attack = 100
    a.stats.critChance = critChance
    a.presetSwitches['Renoa|p5-1-shot'] = false
    return { cs, a }
  }
  const text = (id: string, b = ownerBuild()) => {
    const p = preset(id)
    const buffs = activeBuffs(PRESETS, 'Renoa', b.cs, b.a, settings)
    return renderCardText(p.text, { egoLevel: b.a.egoLevel, nodeOn: () => true,
      pct: (base, fixed, of) => shownPct(base, cardFromPreset(of ? preset(of) : p, 'Void'), b.a, renoa, buffs, settings, fixed) })
  }

  it("card text matches the owner's in-game screenshots", () => {
    expect(text('card-1')).toBe('Move all Dirge Bullet from Draw Pile and Graveyard to hand\n300% Damage')
    expect(text('card-2')).toBe('110% Damage')
    expect(text('card-3')).toBe('110% Shield')
    expect(text('card-4')).toBe('162% Damage\nCreate 1 Dirge Bullet Card(s)')
    expect(text('card-10')).toBe('255% Damage\nIf Dirge Bullet is in hand, discard 1 and +100% Damage Amount')
    expect(text('card-11')).toContain('383% Damage')
    expect(text('card-12')).toContain('313% Damage')
    expect(text('card-14')).toBe('209% Damage\nWhen moved to Discard Pile, 290% Extra Attack to a random enemy')
    expect(text('card-15')).toContain('200% Extra Attack')
    expect(text('card-16')).toBe('70% Damage × 3\n+20% base Damage Amount for each Dirge Bullet in hand')
    expect(text('card-17')).toContain('104% Damage × 3')
    expect(text('card-28')).toBe('[Retain]\n348% Damage (+0%)\nDiscard all Dirge Bullet, +50% Damage Amount for each')
    expect(text('card-29')).toBe('[Bullet / Exhaust]\n238% Damage\nWhen moved to Discard Pile, 168% Extra Attack to a random enemy')
    expect(text('card-666')).toBe('[Bullet / Exhaust]\n238% Damage\nWhen moved to Discard Pile, 191% Extra Attack × 2 to random enemies')
  })

  it('Potential 7 adds +10% from Critical Chance 60%; Ego levels change the text', () => {
    expect(text('card-29', ownerBuild(0, 0.6))).toContain('249% Damage\nWhen moved to Discard Pile, 180% Extra Attack')
    expect(text('card-1', ownerBuild(3))).toContain('500% Damage')
    expect(text('card-28', ownerBuild(1))).toContain('+70% Damage Amount for each')
  })

  it('Dirge Bullets discarded on a play add that many Extra Attacks and the discard bonus', () => {
    const { cs, a } = ownerBuild()
    a.deck.push({ id: 'ij', preset: 'card-10' }, { id: 'lda', preset: 'card-28' }, { id: 'echo', preset: 'card-4' })
    a.rotation = [
      { cardId: 'auto:card-29' },
      { cardId: 'ij', stacks: { 'Dirge Bullets discarded': 1 } },
      { cardId: 'lda', stacks: { 'Dirge Bullets discarded': 3 } },
      { cardId: 'echo', stacks: { 'Dirge Bullets discarded': 2 } },
    ]
    const r = computeBuild(PRESETS, 'Renoa', cs, a, settings)
    const extra = 1.45 * 1.16 * 35
    expect(r.plays[0].nonCrit).toBeCloseTo(2.05 * 1.16 * 35)
    expect(r.plays[0].triggered).toEqual([])
    expect(r.plays[1].nonCrit).toBeCloseTo((2.2 * 1.16 + 1) * 35 + extra)
    expect(r.plays[2].nonCrit).toBeCloseTo((3 * 1.16 + 1.5) * 35 + 3 * extra)
    expect(r.plays[2].triggered[0].hits).toHaveLength(3)
    expect(r.plays[2].triggered[0].card.kind).toBe('Extra Attack')
    expect(r.plays[3].nonCrit).toBeCloseTo(1.4 * 1.16 * 35 + 2 * extra)
    // Ballad IV: "by 100%" doubles the Extra Attacks on that turn's plays
    a.deck.push({ id: 'b4', preset: 'card-20' })
    a.rotation = [{ cardId: 'echo', stacks: { 'Dirge Bullets discarded': 1, 'Ballad of Pitch Black IV': 1 } }]
    expect(computeBuild(PRESETS, 'Renoa', cs, a, settings).plays[0].triggered[0].nonCrit).toBeCloseTo(2 * extra)
  })

  it("a teammate's play can discard Dirge Bullets: the Extra Attacks are Renoa's", () => {
    const { cs: renoaSave } = ownerBuild()
    renoaSave.builds[0].stats.attack = 200
    const cs = newCharacterSave()
    const [a] = cs.builds
    a.stats.attack = 100
    a.team = [{ character: 'Renoa', egoLevel: 0, partner: '', fragments: [], cards: [] }]
    a.deck.push({ id: 'ef', preset: 'card-395' })
    a.rotation = [{ cardId: 'ef', stacks: { 'Dirge Bullets discarded': 2 } }]
    const r = computeBuild(PRESETS, 'Selena', cs, a, settings, { Renoa: renoaSave })
    expect(r.counterOptions[0].map((c) => c.name)).toContain('Dirge Bullets discarded')
    expect(r.plays[0].triggered[0].by).toBe('Renoa')
    expect(r.plays[0].triggered[0].nonCrit).toBeCloseTo(2 * 1.45 * 1.16 * 200 * 0.35)
  })

  it('Finale joins the deck at E2; Ballad V, Flower III and Mark count per play', () => {
    const { cs, a } = ownerBuild(2)
    a.deck.push({ id: 'b5', preset: 'card-21' }, { id: 'f3', preset: 'card-25' }, { id: 'b3', preset: 'card-19' }, { id: 'shot', preset: 'card-2' })
    a.rotation = [
      { cardId: 'auto:card-666', stacks: { 'Dirge Bullets: Finale discarded': 1 } },
      { cardId: 'b5', stacks: { 'Dirge Bullets exhausted': 2 } },
      { cardId: 'shot', stacks: { 'Flower of Devoured Fate III (Cost discarded)': 2, 'Mark (Renoa)': 1 } },
    ]
    const r = computeBuild(PRESETS, 'Renoa', cs, a, settings)
    expect(r.plays[0].nonCrit).toBeCloseTo(2.05 * 1.16 * 35 + 2 * 1.65 * 1.16 * 35)
    expect(r.plays[1].nonCrit).toBeCloseTo(3 * 0.6 * 1.16 * 2 * 35)
    expect(r.plays[2].nonCrit).toBeCloseTo((1.1 + 0.8) * 35 + 35)
  })

  it("Instant Judgment's bonus per Finale discarded counts from E2, where Finale exists", () => {
    const at = (egoLevel: number) => {
      const { cs, a } = ownerBuild(egoLevel)
      a.deck.push({ id: 'ij', preset: 'card-10' })
      a.rotation = [{ cardId: 'ij', stacks: { 'Dirge Bullets: Finale discarded': 1 } }]
      return computeBuild(PRESETS, 'Renoa', cs, a, settings).plays[0].hits[0].cardMult
    }
    expect(at(0)).toBeCloseTo(at(2) - 1)
  })
})
