import { describe, expect, it } from 'vitest'
import { computeBuild, shownPct } from '../../src/engine/calc'
import { renderCardText } from '../../src/engine/cardText'
import { activeBuffs } from '../../src/engine/buffs'
import { PRESETS } from '../../src/data/presets'
import { newCharacterSave } from '../../src/store/save'
import { addCards, cardFromPreset, settings } from '../helpers'

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
