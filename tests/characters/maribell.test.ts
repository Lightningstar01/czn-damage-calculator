import { describe, expect, it } from 'vitest'
import { computeBuild, shownPct } from '../../src/engine/calc'
import { renderCardText } from '../../src/engine/cardText'
import { buildDeck } from '../../src/engine/deck'
import { activeBuffs } from '../../src/engine/buffs'
import { PRESETS } from '../../src/data/presets'
import { newBuff, newCharacterSave } from '../../src/store/save'
import { type Build, type RotationPlay } from '../../src/engine/types'
import { cardFromPreset, settings } from '../helpers'

const NODES_OFF = { '3-1': false, '5-1': false, '7': false }

describe('Maribell', () => {
  const maribell = PRESETS.characters.find((c) => c.name === 'Maribell')!
  const preset = (id: string) => maribell.cards!.find((p) => p.id === id)!
  // Owner's screenshots (2026-11-01): level 30, Attack 252, Defense 129, Health 281, E6, upgrades 6/16 (all from E3 and E5), 3-1, 5-1 and 7 locked
  const ownerBuild = () => {
    const cs = newCharacterSave()
    const [a] = cs.builds
    Object.assign(a, { egoLevel: 6, basicLevel: 0, signatureLevel: 0, potentialNodes: { ...NODES_OFF } })
    Object.assign(a.stats, { attack: 252, defense: 129, health: 281, critChance: 0, critDmg: 1.25 })
    return { cs, a }
  }
  const UNIT = (252 * 0.3 + 129 * 2.1) * 0.35
  const COUNTER = 'auto:counterattack'
  const damage = (id: string, play: Partial<RotationPlay> = {}, change: (a: Build) => void = () => {}, pick = id) => {
    const { a } = ownerBuild()
    a.deck.push({ id: 'c', preset: pick })
    change(a)
    a.rotation = [{ cardId: id === COUNTER ? COUNTER : 'c', ...play }]
    return computeBuild(PRESETS, 'Maribell', a, settings).plays[0].nonCrit
  }
  const text = (id: string, change: (a: Build) => void = () => {}) => {
    const { a } = ownerBuild()
    change(a)
    const p = preset(id)
    const c = cardFromPreset(p, 'Passion')
    const buffs = activeBuffs(PRESETS, 'Maribell', a, settings)
    return renderCardText(p.text, { egoLevel: a.egoLevel, nodeOn: (n) => a.potentialNodes?.[n] !== false, pct: (base, fixed) => shownPct(base, c, a, maribell, buffs, settings, fixed) })
  }

  it("card text matches the owner's in-game screenshots", () => {
    expect(text('card-308')).toBe('450% Shield')
    expect(text('card-309')).toBe('112% Defense-Based Damage')
    expect(text('card-310')).toBe('112% Shield')
    expect(text('card-311')).toBe('246% Shield')
    expect(text('card-312')).toBe('[Pulverize]\n157% Defense-Based Damage\n20% DMG-Based Shield\n1 Counterattack')
    expect(text('card-313')).toBe('[Pulverize]\n235% Defense-Based Damage\n20% DMG-Based Shield\n1 Counterattack\nWhen Damage is inflicted, add 1 Counterattack')
    expect(text('card-315')).toBe('[Pulverize]\n235% Defense-Based Damage to all enemies\n20% DMG-Based Shield\nGain Counterattack for each target Damaged')
    expect(text('card-316')).toBe('[Pulverize]\n235% Defense-Based Damage\n20% DMG-Based Shield\nIncreases Damage Amount equal to 30% of Shield owned')
    expect(text('card-317')).toBe('At the end of the turn, 1 Counterattack\n210% Defense-Based Damage to random enemies')
    expect(text('card-318')).toBe('[Pulverize]\n134% Defense-Based Damage\n100% DMG-Based Shield')
    expect(text('card-320')).toBe('[Pulverize]\n179% Defense-Based Damage\n100% DMG-Based Shield')
    expect(text('card-321')).toBe('[Pulverize]\n314% Defense-Based Damage\n100% DMG-Based Shield')
    expect(text('card-322')).toBe('[Pulverize]\n179% Defense-Based Damage\n+50% Damage Amount for each Counterattack of this unit')
    expect(text('card-327')).toBe('2 Counterattack\nAt the start of the turn,\n2 Counterattack\n2 Crystallization')
    expect(text('card-329')).toBe('[Lead]\nAt the start of the turn,\n2 Counterattack\n+20% Damage Amount to Counterattacks of this unit')
    expect(text('card-330')).toBe('112% Shield\n1 Counterattack\n1 Weaken to all enemies')
    expect(text('card-331')).toBe('168% Shield\n1 Counterattack\n2 Weaken to all enemies')
    expect(text('card-334')).toBe('At the end of the turn, Fixed Damage equal to 50% of Shield owned to the enemy with the lowest HP')
    expect(text('card-336')).toBe('[Pulverize]\nFixed Damage equal to 150% of Shield owned')
  })

  it('Ego levels and Potential nodes change the wording', () => {
    expect(text('card-308', (a) => { a.egoLevel = 3 })).toBe('350% Shield')
    expect(text('card-336', (a) => { a.egoLevel = 0 })).toBe('[Pulverize]\nFixed Damage equal to 100% of Shield owned')
    expect(text('card-310', (a) => { delete a.potentialNodes!['3-1'] })).toBe('112% Shield\n1 Counterattack')
    // 5-1: (100% + 5%) x 1.12; at Health 600, (100% + 10%) x 1.12
    expect(text('card-310', (a) => { delete a.potentialNodes!['5-1'] })).toBe('118% Shield')
    expect(text('card-310', (a) => { delete a.potentialNodes!['5-1']; a.stats.health = 600 })).toBe('123% Shield')
  })

  it('card upgrades: E3 and E5 give the 1.12, Resolute Blitz V stays at 210%', () => {
    expect(damage('card-309')).toBeCloseTo(1.12 * UNIT)
    expect(damage('card-312')).toBeCloseTo(1.4 * 1.12 * UNIT)
    expect(damage('card-317')).toBeCloseTo(2.1 * UNIT)
  })

  it('Shelter Strike: Fixed Damage = % x Shield owned, nothing else raises it but Pulverize', () => {
    expect(damage('card-336', { stacks: { 'Shield owned': 400 } })).toBeCloseTo(1.5 * 400)
    expect(damage('card-336', { stacks: { 'Shield owned': 400 } }, (a) => { a.egoLevel = 0 })).toBeCloseTo(400)
    expect(damage('card-336', { stacks: { 'Shield owned': 400, 'Target holding Shield': 1 } })).toBeCloseTo(1.5 * 1.2 * 400)
    expect(damage('card-336', { stacks: { 'Shield owned': 400, 'Target holding Shield': 1 } }, (a) => { a.egoLevel = 0 })).toBeCloseTo(1.2 * 400)
    expect(damage('card-336', { vulnerable: true, stacks: { 'Shield owned': 400 } })).toBeCloseTo(1.5 * 400)
  })

  it('Shelter Strike without Shield owned deals nothing, and says so', () => {
    const { a } = ownerBuild()
    a.deck.push({ id: 'c', preset: 'card-336' })
    a.rotation = [{ cardId: 'c' }]
    const r = computeBuild(PRESETS, 'Maribell', a, settings)
    expect(r.plays[0].nonCrit).toBe(0)
    expect(r.warnings.join()).toContain('Shield owned')
    expect(r.counterOptions[0].map((c) => c.name)).toContain('Shield owned')
  })

  it('with potentialFixed on, the text and the damage agree: E1\'s +50% comes after the upgrade', () => {
    const on = { ...settings, potentialFixed: true }
    const { a } = ownerBuild()
    a.deck.push({ id: 'c', preset: 'card-336' })
    a.rotation = [{ cardId: 'c', stacks: { 'Shield owned': 400 } }]
    expect(computeBuild(PRESETS, 'Maribell', a, on).plays[0].nonCrit).toBeCloseTo(1.62 * 400)
    const p = preset('card-336')
    const shown = renderCardText(p.text, { egoLevel: 6, nodeOn: () => false, pct: (base, fixed) => shownPct(base, cardFromPreset(p, 'Passion'), a, maribell, activeBuffs(PRESETS, 'Maribell', a, on), on, fixed) })
    expect(shown).toContain('162%')
  })

  it('a negative Shield owned from a hand-edited backup counts as 0', () => {
    expect(damage('card-336', { stacks: { 'Shield owned': -400 } })).toBe(0)
  })

  it('Shield owned counters are amounts, whatever they are called; the others are stacks', () => {
    const { a } = ownerBuild()
    a.deck.push({ id: 'c', preset: 'card-336' }, { id: 'd', preset: 'card-316' }, { id: 'e', preset: 'card-312' })
    a.rotation = [{ cardId: 'c' }, { cardId: 'd' }, { cardId: COUNTER }]
    const r = computeBuild(PRESETS, 'Maribell', a, settings)
    const amount = (i: number, name: string) => r.counterOptions[i].find((c) => c.name === name)?.amount
    expect(amount(0, 'Shield owned')).toBe(true)
    expect(amount(1, 'Shield owned')).toBe(true)
    expect(amount(2, 'Shield owned (first Counterattack)')).toBe(true)
    expect(amount(0, 'Target holding Shield')).toBeUndefined()
  })

  it('Flat damage is a number of its own: it counts with no stats, and a Fixed card adds it as it is', () => {
    const stacks = { 'Shield owned': 400 }
    const noStats = (a: Build) => { a.stats.attack = 0; a.stats.defense = 0 }
    expect(damage('card-316', { stacks }, noStats)).toBeCloseTo(120)
    expect(damage('card-316', { vulnerable: true, stacks }, noStats)).toBeCloseTo(120 * (1 + settings.vulnerable))
    const { a } = ownerBuild()
    a.deck.push({ id: 'c', preset: 'card-336' })
    a.rotation = [{ cardId: 'c', stacks }]
    a.buffs.push({ ...newBuff(), value: '5000', typeOverride: 'Flat', appliesTo: 'Shelter Strike' })
    expect(computeBuild(PRESETS, 'Maribell', a, settings).plays[0].nonCrit).toBeCloseTo(1.5 * 400 + 50)
    // In hand and on target stay the card's %
    const blitz = ownerBuild()
    blitz.a.deck.push({ id: 'c', preset: 'card-316' })
    blitz.a.rotation = [{ cardId: 'c', stacks }]
    const hit = computeBuild(PRESETS, 'Maribell', blitz.a, settings).plays[0].hits[0]
    expect(hit.inHand).toBeCloseTo(2.1 * 1.12)
    expect(hit.flat?.value).toBeCloseTo(120)
  })

  it('Oh... I see. IV is a share of Shield owned too', () => {
    expect(damage('card-334', { stacks: { 'Shield owned': 400 } })).toBeCloseTo(200)
  })

  it('Resolute Blitz IV: 30% of Shield owned, added under the multipliers', () => {
    const base = 2.1 * 1.12 * UNIT
    expect(damage('card-316')).toBeCloseTo(base)
    expect(damage('card-316', { stacks: { 'Shield owned': 400 } })).toBeCloseTo(base + 120)
    expect(damage('card-316', { stacks: { 'Shield owned': 400, 'Target holding Shield': 1 } })).toBeCloseTo((base + 120) * 1.2)
    expect(damage('card-316', { vulnerable: true, stacks: { 'Shield owned': 400 } })).toBeCloseTo((base + 120) * (1 + settings.vulnerable))
  })

  it('Pulverize: +20% on a target holding Shield, only on Pulverize cards', () => {
    expect(damage('card-312', { stacks: { 'Target holding Shield': 1 } })).toBeCloseTo(1.4 * 1.12 * 1.2 * UNIT)
    expect(damage('card-317', { stacks: { 'Target holding Shield': 1 } })).toBeCloseTo(2.1 * UNIT)
  })

  it('Counterattack joins the deck with the cards that give it, as 150% or 300%, not raised by upgrades', () => {
    const { a } = ownerBuild()
    a.deck.push({ id: 'c', preset: 'card-318' })
    expect(buildDeck(maribell, a).map((i) => i.card.id)).not.toContain(COUNTER)
    a.deck.push({ id: 'd', preset: 'card-312' })
    expect(buildDeck(maribell, a).map((i) => i.card.id)).toContain(COUNTER)
    expect(damage(COUNTER, {}, () => {}, 'card-312')).toBeCloseTo(1.5 * UNIT)
    expect(damage(COUNTER, { stacks: { 'Completely blocked by Shield': 1 } }, () => {}, 'card-312')).toBeCloseTo(3 * UNIT)
  })

  it("Wolves' Dome V: +20% on Counterattacks; MK.II IV: +50% per Counterattack owned", () => {
    expect(damage(COUNTER, {}, () => {}, 'card-329')).toBeCloseTo(1.7 * UNIT)
    expect(damage(COUNTER, { stacks: { 'Completely blocked by Shield': 1 } }, () => {}, 'card-329')).toBeCloseTo(3.2 * UNIT)
    expect(damage('card-322', { stacks: { 'Counterattack owned': 3 } })).toBeCloseTo((1.6 * 1.12 + 1.5) * UNIT)
    expect(damage('card-322', { stacks: { 'Counterattack owned': 20 } })).toBeCloseTo((1.6 * 1.12 + 5) * UNIT)
  })

  it('E6: the first Counterattack gains 20% of Shield owned', () => {
    const stacks = { 'Shield owned (first Counterattack)': 500 }
    expect(damage(COUNTER, { stacks }, () => {}, 'card-312')).toBeCloseTo(1.5 * UNIT + 100)
    expect(damage(COUNTER, { stacks }, (a) => { a.egoLevel = 5 }, 'card-312')).toBeCloseTo(1.5 * UNIT)
  })

  it('node 7: +5% on Attack Cards and Resolute Blitz V, +5% more at Health 800, not on Counterattacks or Fixed Damage', () => {
    const on = (health: number) => (a: Build) => { delete a.potentialNodes!['7']; a.stats.health = health }
    expect(damage('card-309', {}, on(799))).toBeCloseTo((1.12 + 0.05) * UNIT)
    expect(damage('card-309', {}, on(800))).toBeCloseTo((1.12 + 0.1) * UNIT)
    expect(damage('card-317', {}, on(800))).toBeCloseTo((2.1 + 0.1) * UNIT)
    expect(damage(COUNTER, {}, on(800), 'card-312')).toBeCloseTo(1.5 * UNIT)
    expect(damage('card-336', { stacks: { 'Shield owned': 400 } }, on(800))).toBeCloseTo(600)
  })
})
