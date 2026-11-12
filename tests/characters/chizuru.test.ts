import { describe, expect, it } from 'vitest'
import { computeBuild, shownPct } from '../../src/engine/calc'
import { renderCardText } from '../../src/engine/cardText'
import { AUTO } from '../../src/engine/deck'
import { activeBuffs } from '../../src/engine/buffs'
import { PRESETS } from '../../src/data/presets'
import { newCharacterSave } from '../../src/store/save'
import { type Build } from '../../src/engine/types'
import { cardFromPreset, settings } from '../helpers'

describe('Chizuru', () => {
  const chi = PRESETS.characters.find((c) => c.name === 'Chizuru')!
  const preset = (id: string) => chi.cards!.find((p) => p.id === id)!
  // Owner's screenshots (2026-10-30): E2, Basic 10 (x1.20), Signature 8 (x1.16), 3-1, 5-1 and 7 unlocked, Attack 972
  const ownerBuild = (attack = 972) => {
    const cs = newCharacterSave()
    const [a] = cs.builds
    Object.assign(a, { egoLevel: 2, basicLevel: 10, signatureLevel: 8 })
    a.stats.attack = attack
    return { cs, a }
  }
  const play = (attack: number, picks: string[], cardId: string, stacks: Record<string, number> = {}, edit: (a: Build) => void = () => {}) => {
    const { a } = ownerBuild(attack)
    a.deck.push(...picks.map((id) => ({ id, preset: id })))
    edit(a)
    a.rotation = [{ cardId, stacks }]
    return computeBuild(PRESETS, 'Chizuru', a, settings).plays[0]
  }

  it("card text matches the owner's in-game screenshots", () => {
    const { a } = ownerBuild()
    const text = (id: string) => {
      const p = preset(id)
      const c = cardFromPreset(p, 'Void')
      const buffs = activeBuffs(PRESETS, 'Chizuru', a, settings)
      return renderCardText(p.text, { egoLevel: a.egoLevel, nodeOn: () => true, pct: (base, fixed) => shownPct(base, c, a, chi, buffs, settings, fixed) })
    }
    expect(text('card-793')).toBe('500% Damage\n+100% Damage Amount for each Shadow of the Moon created (max 10)')
    expect(text('card-794')).toBe('96% Damage × 2')
    expect(text('card-795')).toBe('120% Shield')
    expect(text('card-796')).toBe('[Initiation]\n116% Damage × 2\n1 Cursed Shackles\nCursed Shackles: Add 1 Hit')
    expect(text('card-797')).toContain('174% Damage × 2')
    expect(text('card-798')).toContain('174% Damage')
    expect(text('card-799')).toBe('[Initiation]\n290% Damage\n1 Cursed Shackles\nCursed Shackles: Increase Damage Amount by 150%')
    expect(text('card-814')).toBe('[Haste]\n81% Damage × 3\n+80% Damage Amount to the next Bind card activated')
    expect(text('card-815')).toContain('70% Damage × 4')
    expect(text('card-816')).toBe('[Haste]\n174% Damage × 2\n+120% Damage Amount to the next Bind card activated')
    expect(text('card-817')).toContain('139% Damage × 3')
    expect(text('card-820')).toBe('[Bind (1/5) / Retain]\n110% Damage\n+80% Damage Amount for each Bind stack')
    expect(text('card-821')).toBe('[Unique / Bind (3/5) / Retain]\n249% Damage × 2\nRecover 8% of Max HP\n+80% Damage Amount for each Bind stack')
  })

  it('Shadow+ comes with Karmic Flames; every Bind stack counts; 7 and E1 add before the upgrade', () => {
    const p = play(972, ['card-796'], `${AUTO}card-821`, { 'Bind stacks': 3 })
    // ((180% + 20% + 15%) x 1.16 + 3 x 80%) x 2 hits
    expect(p.nonCrit).toBeCloseTo((2.15 * 1.16 + 2.4) * 2 * 972 * 0.35)
  })

  it('Potential 7 reads Attack: nothing below 600, +1% per 10 above it, +15% at most', () => {
    const shadow = (attack: number) => play(attack, ['card-820'], 'card-820').nonCrit
    expect(shadow(599)).toBeCloseTo(0.8 * 1.16 * 599 * 0.35)
    expect(shadow(600)).toBeCloseTo(0.85 * 1.16 * 600 * 0.35)
    expect(shadow(655)).toBeCloseTo(0.9 * 1.16 * 655 * 0.35)
    expect(shadow(972)).toBeCloseTo(0.95 * 1.16 * 972 * 0.35)
  })

  it("Potential 3-1 changes Moonslash's % and hits; off, it's 100% x 1", () => {
    const on = play(972, ['card-794'], 'card-794')
    expect(on.hits).toHaveLength(2)
    expect(on.nonCrit).toBeCloseTo(0.8 * 1.2 * 2 * 972 * 0.35)
    const off = play(972, ['card-794'], 'card-794', {}, (a) => { a.potentialNodes = { '3-1': false } })
    expect(off.hits).toHaveLength(1)
    expect(off.nonCrit).toBeCloseTo(1.1 * 1.2 * 972 * 0.35)
  })

  it("Oni Hunt raises the next Bind card; V's 80% is multiplicative; Karmic Flames III's Cursed Shackles x2.5", () => {
    expect(play(972, ['card-814', 'card-820'], 'card-820', { 'Oni Hunt': 1, 'Bind stacks': 1 }).nonCrit)
      .toBeCloseTo((0.95 * 1.16 + 0.8 + 0.8) * 972 * 0.35)
    expect(preset('card-814').effects![0]).toMatchObject({ target: 'allies', appliesTo: 'Bind' })
    expect(play(972, ['card-819'], `${AUTO}card-821`).nonCrit).toBeCloseTo(2.15 * 1.16 * 1.8 * 2 * 972 * 0.35)
    expect(play(972, ['card-799'], 'card-799', { 'Cursed Shackles': 1 }).nonCrit).toBeCloseTo(2.5 * 1.16 * 2.5 * 972 * 0.35)
  })

  it('Ego skill: +100% per Shadow, E3 +200% and +150% per Shadow; E4 Lunarshard on Attack cards', () => {
    expect(play(972, [], `${AUTO}card-793`, { 'Shadows created': 3 }).nonCrit).toBeCloseTo((5 + 3) * 972 * 0.35)
    const e3 = play(972, [], `${AUTO}card-793`, { 'Shadows created': 3 }, (a) => { a.egoLevel = 3 })
    expect(e3.nonCrit).toBeCloseTo((5 + 2 + 4.5) * 972 * 0.35)
    const shard = play(972, ['card-796'], 'card-796', { Lunarshard: 2 }, (a) => { a.egoLevel = 4 })
    expect(shard.nonCrit).toBeCloseTo((1.16 + 0.2) * 2 * 972 * 0.35)
  })
})
