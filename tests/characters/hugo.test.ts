import { describe, expect, it } from 'vitest'
import { computeBuild, shownPct } from '../../src/engine/calc'
import { renderCardText } from '../../src/engine/cardText'
import { activeBuffs } from '../../src/engine/buffs'
import { cardTargets, presetCard } from '../../src/engine/deck'
import { PRESETS } from '../../src/data/presets'
import { newCharacterSave, newTeammate } from '../../src/store/save'
import { cardFromPreset, settings } from '../helpers'

describe('Hugo', () => {
  const hugo = PRESETS.characters.find((c) => c.name === 'Hugo')!
  const preset = (id: string) => hugo.cards!.find((p) => p.id === id)!
  // Owner's screenshots (2026-11-08): E0, Basic 5/10 and Signature 5/10 (x1.10), 3-1 and 7 unlocked, 5-1 locked
  const ownerBuild = () => {
    const cs = newCharacterSave()
    const [a] = cs.builds
    Object.assign(a, { egoLevel: 0, basicLevel: 5, signatureLevel: 5, potentialNodes: { '5-1': false } })
    a.stats.attack = 100
    return { cs, a }
  }
  const own = 100 * 0.35

  it("card text matches the owner's in-game screenshots", () => {
    const { a } = ownerBuild()
    const text = (id: string) => {
      const p = preset(id)
      const c = cardFromPreset(p, 'Order')
      const buffs = activeBuffs(PRESETS, 'Hugo', a, settings)
      return renderCardText(p.text, { egoLevel: a.egoLevel, nodeOn: (n) => n !== '5-1', pct: (base, fixed) => shownPct(base, c, a, hugo, buffs, settings, fixed) })
    }
    expect(preset('card-485').name).toBe('Knife Toss')
    expect(text('card-484')).toBe('250% Damage to all enemies\nIncrease Damage of Commence the Hunt by 30%')
    expect(text('card-485')).toBe('110% Damage\n50% Chance for 1 Commence the Hunt')
    expect(text('card-486')).toBe('110% Shield')
    expect(text('card-493')).toBe('[Haste]\n66% × 3 Damage to random enemies\nCommence the Hunt for each target hit')
    expect(text('card-494')).toContain('99% × 3 Damage to random enemies')
    expect(text('card-496')).toContain('275% Damage')
    expect(text('card-498')).toContain('60% Damage × 2 to random enemies')
    expect(text('card-499')).toBe('[Haste]\n88% Damage × 2\nIf in a Commence the Hunt state, Draw 1 Attack Card(s)')
    expect(text('card-500')).toContain('132% Damage × 2')
    expect(text('card-502')).toContain('110% Damage × 2')
    expect(text('card-503')).toContain('110% Damage × 3')
    expect(text('card-504')).toContain('132% Damage\n')
    expect(text('card-505')).toBe('110% Shield\n2 Commence the Hunt')
    expect(text('card-506')).toContain('165% Shield')
    expect(text('card-511')).toBe("[Unique]\nIncrease Damage Amount of Commence the Hunt's Extra Attacks by 40%")
  })

  it('cards know from their text whether they hit one target, all enemies or random enemies', () => {
    expect(cardTargets('{100%} Damage\n2 Mark to all enemies')).toBe('Single')
    expect(cardTargets('{250%} Damage to all enemies')).toBe('All')
    expect(cardTargets('[Haste]\n{60%} × 3 Damage to random enemies')).toBe('Random')
    expect(cardTargets('Attunement: 300% Damage to a random enemy')).toBe('Random')
    const card = (id: string) => presetCard(preset(id), 'Order', id)
    expect(card('card-485').targets).toBeUndefined()
    expect(card('card-484').targets).toBe('All')
    expect(card('card-493').targets).toBe('Random')
    expect(card('card-495').targets).toBeUndefined()
  })

  it("Commence the Hunt: a 50% Extra Attack (+30% per stack before the decrease) on single-target Attack Cards; Fixer's Approach, Last Resort", () => {
    const { a } = ownerBuild()
    a.deck.push({ id: 'kt', preset: 'card-485' }, { id: 'fod', preset: 'card-493' }, { id: 'fod4', preset: 'card-497' },
      { id: 'qf2', preset: 'card-501' }, { id: 'fa', preset: 'card-511' })
    a.rotation = [
      { cardId: 'kt', stacks: { 'Commence the Hunt': 3 } },
      { cardId: 'kt' },
      // random enemies: no Extra Attack, but Fan of Daggers IV's "in a Commence the Hunt state" doubles it
      { cardId: 'fod', stacks: { 'Commence the Hunt': 3 } },
      { cardId: 'fod4', stacks: { 'Commence the Hunt': 3 } },
      // Quick Fix II: one more hit in a Commence the Hunt state, and the stacks still count on the Extra Attack
      { cardId: 'qf2', stacks: { 'Commence the Hunt': 4, 'Last Resort used': 1 } },
      // Last Resort hits all enemies: no Extra Attack
      { cardId: 'auto:card-484', stacks: { 'Commence the Hunt': 2 } },
    ]
    const r = computeBuild(PRESETS, 'Hugo', a, settings)
    expect(r.counterOptions[4].find((c) => c.name === 'Commence the Hunt')?.max).toBe(5)
    expect(r.plays[0].triggered.map((t) => t.card.name)).toEqual(['Commence the Hunt'])
    expect(r.plays[0].triggered[0].nonCrit).toBeCloseTo((0.5 + 0.9) * 1.4 * own)
    expect(r.plays[0].nonCrit).toBeCloseTo(1.1 * own + 1.4 * 1.4 * own)
    expect(r.plays[1].triggered).toEqual([])
    expect(r.plays[2].triggered).toEqual([])
    expect(r.plays[3].triggered).toEqual([])
    expect(r.plays[3].nonCrit).toBeCloseTo(3 * 0.99 * 2 * own)
    expect(r.plays[4].hits).toHaveLength(3)
    expect(r.plays[4].triggered[0].nonCrit).toBeCloseTo((0.5 + 1.2) * (1 + 0.4 + 0.3) * own)
    expect(r.plays[5].triggered).toEqual([])
  })

  it("E1 raises Fixer's Approach to 50%; E2's Extra Attacks get the +30% per stack; E4 Fixer's Wrath +10% each", () => {
    const { a } = ownerBuild()
    a.egoLevel = 4
    a.deck.push({ id: 'kt', preset: 'card-485' }, { id: 'fa', preset: 'card-511' })
    a.rotation = [{ cardId: 'kt', stacks: { 'Commence the Hunt': 1, "Fixer's Wrath": 2 } },
      { cardId: 'auto:e2-extra', stacks: { 'Commence the Hunt': 6 } }]
    const r = computeBuild(PRESETS, 'Hugo', a, settings)
    expect(r.plays[0].triggered[0].nonCrit).toBeCloseTo(((0.5 + 0.3) * 1.5 + 0.2) * own)
    // E3: up to 6 stacks
    expect(r.plays[1].nonCrit).toBeCloseTo(2 * (0.4 + 1.8) * own)
  })

  it("Hugo as a teammate: another combatant's single-target Attack Card sets off his Extra Attack, with his own build", () => {
    const ml = newCharacterSave()
    const [b] = ml.builds
    b.deck = [{ id: 's', preset: 'card-338' }]
    b.team = [{ ...newTeammate(), character: 'Hugo', cards: ['card-511'] }]
    b.rotation = [{ cardId: 's', stacks: { 'Commence the Hunt': 2 } }]
    const { cs } = ownerBuild()
    cs.builds[0].stats.attack = 300
    const r = computeBuild(PRESETS, 'Mei Lin', b, settings, { Hugo: cs })
    expect(r.plays[0].triggered.map((t) => [t.by, t.card.name])).toEqual([['Hugo', 'Commence the Hunt']])
    expect(r.plays[0].triggered[0].nonCrit).toBeCloseTo((0.5 + 0.6) * 1.4 * 300 * 0.35)
  })
})
