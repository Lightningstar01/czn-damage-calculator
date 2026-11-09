import { describe, expect, it } from 'vitest'
import { computeBuild, shownPct } from '../../src/engine/calc'
import { renderCardText } from '../../src/engine/cardText'
import { activeBuffs } from '../../src/engine/buffs'
import { PRESETS } from '../../src/data/presets'
import { newCharacterSave } from '../../src/store/save'
import { cardFromPreset, settings } from '../helpers'

describe('Veronica', () => {
  const veronica = PRESETS.characters.find((c) => c.name === 'Veronica')!
  const preset = (id: string) => veronica.cards!.find((p) => p.id === id)!
  // Owner's screenshots (2026-11-08): E0, Basic 2 (x1.04), Unique 8 (x1.16), Attack 906, 3-1 and 7 unlocked, 5-1 locked
  const ownerBuild = (egoLevel = 0, attack = 906) => {
    const cs = newCharacterSave()
    const [a] = cs.builds
    Object.assign(a, { egoLevel, basicLevel: 2, signatureLevel: 8, potentialNodes: { '5-1': false } })
    a.stats.attack = attack
    return { cs, a }
  }
  const text = (id: string, b = ownerBuild()) => {
    const p = preset(id)
    const buffs = activeBuffs(PRESETS, 'Veronica', b.cs, b.a, settings)
    return renderCardText(p.text, { egoLevel: b.a.egoLevel, nodeOn: (n) => b.a.potentialNodes?.[n] ?? true,
      pct: (base, fixed, of) => Math.round(shownPct(base, cardFromPreset(of ? preset(of) : p, 'Passion'), b.a, veronica, buffs, settings, fixed) * 100) / 100 })
  }

  it("card text matches the owner's in-game screenshots", () => {
    expect(text('card-422')).toBe('250% Piercing Damage to all enemies\nGain Maximum Reload')
    expect(text('card-423')).toBe('104% Damage\n20% chance to create 1 Ballista card')
    expect(text('card-424')).toBe('104% Shield')
    expect(text('card-431')).toBe('116% Shield\nDraw 2 card(s) from other combatant')
    expect(text('card-436')).toContain('174% Shield')
    expect(text('card-449')).toBe('[Unique]\nIncrease max stack of Reload by 1\n2 Reload')
    // Potential 7 at 906 Attack: +5% and +1% for each 40 over 700 (5) = +10%, before the upgrade
    expect(text('card-450')).toBe('[Ephemeral]\n186% Extra Attack to a random enemy\nAt the end of the turn, proc')
    expect(text('card-451')).toContain('244% Piercing Damage')
    expect(text('card-452')).toContain('244% Extra Attack')
    expect(text('card-453')).toContain('186% Extra Attack to all enemies')
    expect(text('card-454')).toContain('128% Extra Attack × 2')
    expect(text('card-455')).toContain('58% Extra Attack')
  })

  it('Potential 7 follows Attack; 5-1 and the Ego levels change the text', () => {
    expect(text('card-450', ownerBuild(0, 699))).toContain('174% Extra Attack')
    expect(text('card-450', ownerBuild(0, 700))).toContain('180% Extra Attack')
    expect(text('card-450', ownerBuild(0, 2000))).toContain('191% Extra Attack')
    const nodeOn = ownerBuild()
    nodeOn.a.potentialNodes = {}
    expect(text('card-423', nodeOn)).toContain('114% Damage')
    expect(text('card-422', ownerBuild(3))).toContain('Gain Maximum Reload\nCreate 1 random Ballista card in hand')
    expect(text('card-449', ownerBuild(1))).toContain('4 Reload')
  })

  it('Ballistas join the deck with Rapid Fire; Reload and Sir Kowalski count per Ballista play', () => {
    const { cs, a } = ownerBuild()
    a.deck.push({ id: 'rf', preset: 'card-423' }, { id: 'kw', preset: 'card-443' }, { id: 'kw5', preset: 'card-448' })
    a.rotation = [
      { cardId: 'auto:card-450' },
      { cardId: 'auto:card-450', stacks: { Reload: 2 } },
      { cardId: 'auto:card-450', stacks: { Reload: 2, 'Sir Kowalski': 1 } },
      { cardId: 'auto:card-454', stacks: { 'Sir Kowalski V': 1 } },
    ]
    const r = computeBuild(PRESETS, 'Veronica', cs, a, settings)
    const pct = 1.6 * 1.16
    expect(r.plays[0].card.kind).toBe('Extra Attack')
    expect(r.plays[0].nonCrit).toBeCloseTo(pct * 906 * 0.35)
    // Reload: 50% per stack, multiplicative (owner, 2026-11-08)
    expect(r.plays[1].nonCrit).toBeCloseTo(pct * 2 * 906 * 0.35)
    expect(r.plays[2].nonCrit).toBeCloseTo((pct * 2 + 1) * 906 * 0.35)
    // Sir Kowalski V's -25% is on the plain Ballistas it creates only
    expect(r.plays[3].hits).toHaveLength(2)
    expect(r.plays[3].hits[0].cardMult).toBeCloseTo(1.1 * 1.16)
  })

  it("Piercing Ballista is normal damage; its Shield bonus and Enhanced Ballista's crit count", () => {
    const { cs, a } = ownerBuild()
    a.deck.push({ id: 'fp2', preset: 'card-427' }, { id: 'fp3', preset: 'card-428' })
    a.stats.critChance = 0.1
    a.rotation = [{ cardId: 'auto:card-451', stacks: { 'Target has Shield': 1 } }, { cardId: 'auto:card-452' }]
    const r = computeBuild(PRESETS, 'Veronica', cs, a, settings)
    expect(r.plays[0].card.kind).not.toBe('Extra Attack')
    expect(r.plays[0].hits[0].cardMult).toBeCloseTo(2.1 * 1.16 + 0.5)
    expect(r.plays[1].hits[0].critRate).toBeCloseTo(0.4)
  })
})
