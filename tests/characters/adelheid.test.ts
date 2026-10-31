import { describe, expect, it } from 'vitest'
import { computeBuild, shownPct } from '../../src/engine/calc'
import { renderCardText } from '../../src/engine/cardText'
import { buildDeck } from '../../src/engine/deck'
import { activeBuffs, presetBuffValue } from '../../src/engine/buffs'
import { PRESETS } from '../../src/data/presets'
import { newBuild, newCharacterSave } from '../../src/store/save'
import { addCards, cardFromPreset, settings } from '../helpers'

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

  it('Potential 3-1 adds the Blessing tag to Gather Around only while it is on (Protect Us V reaches it)', () => {
    for (const on of [true, false]) {
      const { cs, a } = ownerBuild()
      if (!on) a.potentialNodes = { '3-1': false }
      const protect = card('card-1140')
      a.deck.push({ id: 'g', preset: 'card-1127' })
      addCards(cs, protect)
      a.rotation = [{ cardId: 'g', stacks: { 'Protect Us V': 1 } }]
      expect(buildDeck(adel, a).find((i) => i.card.id === 'g')!.card.tags).toBe(on ? 'Basic, Basic Attack, Blessing' : 'Basic, Basic Attack')
      const r = computeBuild(PRESETS, 'Adelheid', cs, a, settings)
      expect(r.plays[0].nonCrit).toBeCloseTo(1.1 * (on ? 1.6 : 1) * stat * 0.35)
    }
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

  it('Potential 7 follows the stats-screen Defense: +5% from 300, +2% per 10 above, max +10% more', () => {
    const p7 = adel.effects.find((e) => e.id === 'p7-void')!
    if (p7.kind !== 'Buff') throw new Error('p7 is a buff')
    const at = (defense: number) => presetBuffValue(p7, { ...newBuild('x').stats, attack: 1000, defense }).value
    expect(at(299)).toBe(0)
    expect(at(300)).toBeCloseTo(0.05)
    expect(at(325)).toBeCloseTo(0.05 + 0.04)
    expect(at(1000)).toBeCloseTo(0.15)
  })
})
