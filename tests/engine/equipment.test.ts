import { describe, expect, it } from 'vitest'
import { computeBuild, finalStats } from '../../src/engine/calc'
import { equipmentDoubles, equipped, presetStates } from '../../src/engine/buffs'
import { withLinkedTeam } from '../../src/engine/team'
import { checkEquipment, EQUIPMENT, IMPORTED_EQUIPMENT, mergeEquipment } from '../../src/data/equipment'
import { EQUIPMENT_EFFECTS } from '../../src/data/equipmentEffects'
import { PRESETS } from '../../src/data/presets'
import { newBoost, newBuff, newBuild, newCharacterSave, newTeammate } from '../../src/store/save'
import type { Effect, EquipmentPreset, Presets } from '../../src/engine/types'
import { addCards, card, plays, presets, setPlays, settings } from '../helpers'

describe('the equipment import and our additions', () => {
  it('piece ids keep pointing at the same pieces (a re-import that moves them must be looked at: saved builds and our Effects use them)', async () => {
    const number = (id: string) => Number(id.split('-')[1])
    const ids = Object.fromEntries([...IMPORTED_EQUIPMENT].sort((a, b) => number(a.id) - number(b.id)).map((p) => [p.id, `${p.name} (${p.rarity} ${p.slot})`]))
    await expect(`${JSON.stringify(ids, null, 1)}\n`).toMatchFileSnapshot('../fixtures/equipment-ids.json')
  })

  it('every piece has a known slot and rarity, its own id and name, and additions that point at a piece', () => {
    expect(checkEquipment(IMPORTED_EQUIPMENT, EQUIPMENT_EFFECTS)).toEqual([])
    expect(EQUIPMENT).toHaveLength(IMPORTED_EQUIPMENT.length)
    for (const slot of ['weapon', 'armor', 'trinket']) expect(EQUIPMENT.some((p) => p.slot === slot)).toBe(true)
  })

  it('the check catches additions for a piece that is gone, a repeated effect id, another category, a repeated name and an unknown slot or rarity', () => {
    const [p] = IMPORTED_EQUIPMENT
    const e: Effect = { kind: 'Stat', id: 'atk', name: 'Attack', category: 'Equipment', stat: 'ATK%', value: '10%' }
    expect(checkEquipment([p], { 'equip-0': {} })).toEqual(["equipmentEffects.ts: no piece 'equip-0' in prydwen-equipment.json"])
    expect(checkEquipment([p], { [p.id]: { effects: [e, e] } })).toHaveLength(1)
    expect(checkEquipment([p], { [p.id]: { effects: [{ ...e, category: 'Partner' }] } })).toHaveLength(1)
    expect(checkEquipment([p, { ...p, id: 'equip-0' }], {})).toHaveLength(1)
    expect(checkEquipment([{ ...p, slot: 'Ring', rarity: 'Epic' }], {})).toHaveLength(2)
  })

  it('our additions give a piece its effects; a piece without any has none and keeps its text', () => {
    const [p] = IMPORTED_EQUIPMENT
    const e: Effect = { kind: 'Stat', id: 'atk', name: 'Attack', category: 'Equipment', stat: 'ATK%', value: '10%' }
    expect(mergeEquipment([p], { [p.id]: { effects: [e], notCounted: 'the Credits' } })[0]).toMatchObject({ id: p.id, slot: 'weapon', effects: [e], notCounted: 'the Credits', text: p.text })
    expect(mergeEquipment([p], {})[0].effects).toEqual([])
  })
})

/** Made-up pieces: the real ones' effects are read with the owner, batch by batch. */
const sword: EquipmentPreset = { id: 't-sword', name: 'Test Sword', slot: 'weapon', rarity: 'Legendary', text: '+12% Attack. Increase Damage Amount by 20%.', effects: [
  { kind: 'Stat', id: 'atk', name: '+12% Attack', category: 'Equipment', stat: 'ATK%', value: '12%' },
  { kind: 'Buff', id: 'dmg', name: 'Increase Damage Amount by 20%', category: 'Equipment', value: '20%', appliesTo: 'ALL', hitScope: 'All hits', condition: 'Always' },
] }
const banner: EquipmentPreset = { id: 't-banner', name: 'Test Banner', slot: 'trinket', rarity: 'Mythic', text: '+10% Damage Amount of allies. +5% Attack.', effects: [
  { kind: 'Buff', id: 'allies', name: '+10% Damage Amount of allies', category: 'Equipment', target: 'allies', value: '+10%', appliesTo: 'ALL', hitScope: 'All hits', condition: 'Always' },
  { kind: 'Stat', id: 'atk', name: '+5% Attack', category: 'Equipment', stat: 'ATK%', value: '5%' },
] }
const plate: EquipmentPreset = { id: 't-plate', name: 'Test Plate', slot: 'armor', rarity: 'Rare', text: 'At the start of battle, +20% Shield.', effects: [] }
const withGear: Presets = { ...presets, equipment: [sword, banner, plate], equipFlat: PRESETS.equipFlat }

describe('equipment on a build (owner, 2026-11-11)', () => {
  const testy = () => {
    const b = newBuild('A')
    b.stats = { ...b.stats, attack: 1000, defense: 200, health: 500 }
    return b
  }

  it('each slot adds its flat stat from the rarity: Attack (weapon), Defense (armor), Health (trinket)', () => {
    const b = testy()
    b.equipment = { weapon: { rarity: 'Rare' }, armor: { rarity: 'Legendary' }, trinket: { rarity: 'Mythic' } }
    const s = finalStats(withGear, 'Testy', b, settings)
    expect([s.atk.value, s.def.value, s.hp.value]).toEqual([1074, 231, 591])
    expect(s.def.sources).toContainEqual({ label: 'Armor (Legendary)', value: 31, unit: 'flat' })
    expect(s.hp.sources).toContainEqual({ label: 'Trinket (Mythic)', value: 91, unit: 'flat' })
    const bare = finalStats(withGear, 'Testy', testy(), settings)
    expect([bare.atk.value, bare.def.value, bare.hp.value]).toEqual([1000, 200, 500])
  })

  it("a named piece's own rarity sets the flat stat, whatever rarity the save holds, and its effects are preset switches", () => {
    const b = testy()
    b.equipment = { weapon: { rarity: 'Rare', piece: 't-sword' }, armor: { rarity: 'Rare', piece: 't-plate' } }
    const atk = finalStats(withGear, 'Testy', b, settings).atk
    expect(atk.value).toBeCloseTo(1000 * 1.12 + 82)
    expect(atk.sources.map((s) => s.label)).toEqual(['Stats screen Attack', 'Test Sword: +12% Attack', 'Test Sword (Legendary)'])
    const states = presetStates(withGear, 'Testy', b)
    expect(states.map((s) => [s.key, s.ownerKind, s.stacks])).toEqual([['t-sword|atk', 'Equipment', 1], ['t-sword|dmg', 'Equipment', 1]])
    b.presetSwitches['t-sword|atk'] = false
    expect(finalStats(withGear, 'Testy', b, settings).atk.value).toBe(1082)
  })

  it("the buffs of a picked piece raise the damage, and its switch turns them off for that build", () => {
    const cs = newCharacterSave()
    const [b] = cs.builds
    b.stats.attack = 1000
    const x = card('X', '', 1)
    addCards(cs, x)
    setPlays(cs, plays(x.id))
    const base = computeBuild(withGear, 'Testy', b, settings).nonCrit
    b.equipment = { weapon: { rarity: 'Legendary', piece: 't-sword' } }
    expect(computeBuild(withGear, 'Testy', b, settings).nonCrit).toBeCloseTo(base * 1.2 * (1000 * 1.12 + 82) / 1000)
    b.presetSwitches['t-sword|dmg'] = false
    expect(computeBuild(withGear, 'Testy', b, settings).nonCrit).toBeCloseTo(base * (1000 * 1.12 + 82) / 1000)
  })

  it('the real pieces follow their rarity: Mountain of Corpses is Legendary, so 82 Attack, not the 90 Prydwen lists', () => {
    const piece = EQUIPMENT.find((p) => p.name === 'Mountain of Corpses')!
    const b = testy()
    b.equipment = { weapon: { rarity: piece.rarity, piece: piece.id } }
    expect(piece.rarity).toBe('Legendary')
    expect(finalStats({ ...presets, equipment: EQUIPMENT, equipFlat: PRESETS.equipFlat }, 'Testy', b, settings).atk.value).toBe(1082)
  })

  it('a piece the presets lost counts as its saved rarity, without effects, and the Results tab says so', () => {
    const b = testy()
    b.equipment = { weapon: { rarity: 'Mythic', piece: 'equip-0' } }
    expect(equipped(withGear, b.equipment)).toEqual([{ slot: 'weapon', rarity: 'Mythic', flat: 90, lost: 'equip-0' }])
    const r = computeBuild(withGear, 'Testy', b, settings)
    expect(r.stats.atk.value).toBe(1090)
    expect(r.warnings).toEqual(["Testy's weapon equip-0 is not in the presets any more: it counts as a Mythic weapon (its flat Attack), without effects. Pick it again on Setup › Equipment."])
    // A piece saved in another slot isn't that slot's piece
    b.equipment = { armor: { rarity: 'Rare', piece: 't-sword' } }
    expect(equipped(withGear, b.equipment)[0]).toMatchObject({ lost: 't-sword', flat: 28 })
  })

  it("a teammate linked to a saved build brings their equipment's ally effects, not the ones for themselves; unlinked, none", () => {
    const theirs = newCharacterSave()
    theirs.builds[0].equipment = { weapon: { rarity: 'Legendary', piece: 't-sword' }, trinket: { rarity: 'Mythic', piece: 't-banner' } }
    const mine = newCharacterSave()
    const [b] = mine.builds
    b.stats.attack = 1000
    b.team = [{ ...newTeammate(), character: 'Mei Lin' }]
    const saves = { 'Mei Lin': theirs, Testy: mine }
    const gear = (build = b) => presetStates(withGear, 'Testy', withLinkedTeam(build, saves)).filter((s) => s.ownerKind === 'Equipment')
    expect(gear().map((s) => [s.key, s.teammateName])).toEqual([['Mei Lin>t-banner|allies', 'Mei Lin']])
    // Their weapon's flat Attack and ATK% are theirs alone
    expect(finalStats(withGear, 'Testy', withLinkedTeam(b, saves), settings).atk.value).toBe(1000)
    const x = card('X', '', 1)
    addCards(mine, x)
    setPlays(mine, plays(x.id))
    const withThem = computeBuild(withGear, 'Testy', b, settings, saves).nonCrit
    b.presetSwitches['Mei Lin>t-banner|allies'] = false
    expect(withThem).toBeCloseTo(computeBuild(withGear, 'Testy', b, settings, saves).nonCrit * 1.1)
    expect(gear({ ...b, team: [{ ...b.team[0], build: 'none' }] })).toEqual([])
  })

  it('warns about typed rows that look like a picked piece: the same flat stat, or a row named like it (never converted)', () => {
    const b = testy()
    b.boosts = [{ ...newBoost(), source: 'Old sword', stat: 'Flat ATK', value: '74' }, { ...newBoost(), source: 'Test Sword ATK', stat: 'ATK%', value: '12%' },
      { ...newBoost(), source: 'Ring', stat: 'Flat DEF', value: '20', on: false }, { ...newBoost(), source: "Teammate's blade", stat: 'Flat ATK', value: '82', from: 'Teammate 1' }]
    b.buffs = [{ ...newBuff(), source: 'test sword', value: '20%' }, { ...newBuff(), source: 'Test Plate', value: '+5%' }, { ...newBuff(), source: 'Other', value: '+5%' }]
    expect(equipmentDoubles(withGear, b)).toEqual([])
    b.equipment = { weapon: { rarity: 'Legendary', piece: 't-sword' }, armor: { rarity: 'Rare', piece: 't-plate' } }
    const [flat, named, uncounted, ...rest] = equipmentDoubles(withGear, b)
    expect(flat).toBe("My stat boosts also add flat Attack (Old sword: 74). If that's this weapon, switch it off or delete it, or it counts twice.")
    expect(named).toMatch(/named like Test Sword \(Test Sword ATK, test sword\)\. Its effects are in the preset lists now/)
    expect(uncounted).toMatch(/named like Test Plate \(Test Plate\)\. The piece's effect isn't counted by itself yet, so keep them/)
    expect(rest).toEqual([])
    // A rarity alone has no name to compare
    b.equipment = { armor: { rarity: 'Rare' } }
    expect(equipmentDoubles(withGear, b)).toEqual([])
  })
})
