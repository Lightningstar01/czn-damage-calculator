import { describe, expect, it } from 'vitest'
import { computeBuild, finalStats } from '../../src/engine/calc'
import { equipmentDoubles, equipped, presetStates } from '../../src/engine/buffs'
import { withLinkedTeam } from '../../src/engine/team'
import { checkEquipment, EQUIPMENT, IMPORTED_EQUIPMENT, mergeEquipment } from '../../src/data/equipment'
import { EQUIPMENT_EFFECTS } from '../../src/data/equipmentEffects'
import { PRESETS } from '../../src/data/presets'
import { newBoost, newBuff, newBuild, newCharacterSave, newTeammate } from '../../src/store/save'
import type { Build, Card, Effect, EquipmentPreset, Presets, RotationPlay } from '../../src/engine/types'
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

describe("weapons read with the owner, batch 1: The Blue Pot and Twin Star's Shadow (2026-11-13)", () => {
  const real: Presets = { ...presets, equipment: EQUIPMENT, equipFlat: PRESETS.equipFlat }
  const byName = (name: string) => EQUIPMENT.find((p) => p.name === name)!
  /** One play of a card with the weapon picked: the result, and its damage as a multiple of the same rarity's plain weapon. */
  const withWeapon = (name: string, c: Card, play: Partial<RotationPlay> = {}, change: (b: Build) => void = () => {}) => {
    const piece = byName(name)
    const cs = newCharacterSave()
    const [b] = cs.builds
    b.stats = { ...b.stats, attack: 1000, critChance: 0.2, critDmg: 1.5 }
    addCards(cs, c)
    b.rotation = [{ cardId: c.id, ...play }]
    b.equipment = { weapon: { rarity: piece.rarity } }
    const plain = computeBuild(real, 'Testy', b, settings)
    b.equipment = { weapon: { rarity: piece.rarity, piece: piece.id } }
    change(b)
    const r = computeBuild(real, 'Testy', b, settings)
    return { r, plain, ratio: r.nonCrit / plain.nonCrit, piece }
  }
  const attack = (over: Partial<Card> = {}): Card => ({ ...card('X', '', 1), ...over })

  it('every piece of the batch is listed, with effects or the reason nothing is counted', () => {
    const batch = IMPORTED_EQUIPMENT.filter((p) => p.slot === 'Weapon' && /^(The Blue Pot|Twin Star's Shadow)/.test(p.source) && p.id !== 'equip-99')
    expect(batch).toHaveLength(17)
    for (const p of batch) {
      const a = EQUIPMENT_EFFECTS[p.id]
      expect(a?.effects?.length || a?.triggers?.length || a?.notCounted, p.name).toBeTruthy()
    }
    expect(['equip-1', 'equip-6', 'equip-25', 'equip-32'].map((id) => EQUIPMENT_EFFECTS[id].effects)).toEqual([undefined, undefined, undefined, undefined])
  })

  it('Dull Bone Blade: 10% Attack on top of the stats screen, 5% less Critical Chance', () => {
    const { r } = withWeapon('Dull Bone Blade', attack())
    expect(r.stats.atk.value).toBeCloseTo(1000 * 1.1 + 74)
    expect(r.stats.critRate.value).toBeCloseTo(0.15)
    // With less than 5% to lose, a hit's chance stops at 0: the expected damage is the non-crit damage
    const low = withWeapon('Dull Bone Blade', attack(), {}, (b) => { b.stats.critChance = 0.03 }).r
    expect(low.plays[0].hits[0].critRate).toBe(0)
    expect(low.expected).toBeCloseTo(low.nonCrit)
  })

  it('Shell Bug Horn: +20% Critical Damage', () => {
    expect(withWeapon('Shell Bug Horn', attack()).r.stats.critDmg.value).toBeCloseTo(1.7)
  })

  it(`the Whips are both multiplicative (owner: Prydwen's "+" on Lepidola's is wrong), on Attack Cards costing 1 or less only`, () => {
    expect(withWeapon("Violet Butterfly's Whip", attack()).ratio).toBeCloseTo(1.2)
    expect(withWeapon("Lepidola's Whip", attack({ cost: 0 })).ratio).toBeCloseTo(1.25)
    // Multiplicative: it raises a 200% card by 50%, where an additive +25% would add 25%
    expect(withWeapon("Lepidola's Whip", attack({ pct: 2 })).ratio).toBeCloseTo(1.25)
    expect(withWeapon("Lepidola's Whip", attack({ cost: 2 })).ratio).toBeCloseTo(1)
    expect(withWeapon("Lepidola's Whip", attack({ cardType: 'Skill' })).ratio).toBeCloseTo(1)
  })

  it('Mutated Claws: +15% Damage, additive, once, on every card', () => {
    expect(withWeapon('Mutated Claws', attack({ pct: 2 })).ratio).toBeCloseTo(2.15 / 2)
    expect(withWeapon('Mutated Claws', attack({ cardType: 'Skill' })).ratio).toBeCloseTo(1.15)
    expect(withWeapon('Mutated Claws', attack(), {}, (b) => { b.presetSwitches['equip-7|dmg'] = false }).ratio).toBeCloseTo(1)
  })

  it('Ritual Dagger: nothing until an enemy is defeated, then +25% Attack Card Damage per enemy, 2 at most, set on each play', () => {
    expect(withWeapon('Ritual Dagger', attack()).ratio).toBeCloseTo(1)
    expect(withWeapon('Ritual Dagger', attack(), { stacks: { 'Enemies defeated': 1 } }).ratio).toBeCloseTo(1.25)
    expect(withWeapon('Ritual Dagger', attack(), { stacks: { 'Enemies defeated': 3 } }).ratio).toBeCloseTo(1.5)
    expect(withWeapon('Ritual Dagger', attack({ cardType: 'Skill' }), { stacks: { 'Enemies defeated': 2 } }).ratio).toBeCloseTo(1)
  })

  it("Executioner's Edge and Mutated Order: multiplicative while their switch is on", () => {
    expect(withWeapon("Executioner's Edge", attack()).ratio).toBeCloseTo(1.35)
    expect(withWeapon('Mutated Order', attack()).ratio).toBeCloseTo(1.25)
    expect(withWeapon('Mutated Order', attack(), {}, (b) => { b.presetSwitches['equip-24|dmg'] = false }).ratio).toBeCloseTo(1)
  })

  it("Dark Grip's Claws: only cards that target all enemies, of any type", () => {
    expect(withWeapon("Dark Grip's Claws", attack()).ratio).toBeCloseTo(1)
    expect(withWeapon("Dark Grip's Claws", attack({ targets: 'All' })).ratio).toBeCloseTo(1.25)
    expect(withWeapon("Dark Grip's Claws", attack({ targets: 'All', cardType: 'Skill' })).ratio).toBeCloseTo(1.25)
    expect(withWeapon("Dark Grip's Claws", attack({ targets: 'Random' })).ratio).toBeCloseTo(1)
  })

  it("Formica's spears: per enemy alive, starting at 1, 5 at most; the Perfect Spear's 10% joins it on cards that target all enemies", () => {
    expect(withWeapon("Formica's Broken Spear", attack()).ratio).toBeCloseTo(1.06)
    expect(withWeapon("Formica's Broken Spear", attack(), {}, (b) => { b.presetSwitches['equip-29|dmg'] = 3 }).ratio).toBeCloseTo(1.18)
    expect(byName("Formica's Broken Spear").effects[0]).toMatchObject({ maxStacks: 5, defaultStacks: 1 })
    expect(withWeapon("Formica's Perfect Spear", attack()).ratio).toBeCloseTo(1.07)
    // Summed (the Multiplicative setting's default): 1 + 5 x 7% + 10%
    expect(withWeapon("Formica's Perfect Spear", attack({ targets: 'All' }), {}, (b) => { b.presetSwitches['equip-38|dmg'] = 5 }).ratio).toBeCloseTo(1.45)
  })

  it('Twin Swords of Greater and Lesser Evil: 30% against Ravaged targets only', () => {
    expect(withWeapon('Twin Swords of Greater and Lesser Evil', attack()).ratio).toBeCloseTo(1)
    expect(withWeapon('Twin Swords of Greater and Lesser Evil', attack(), { ravaged: true }).ratio).toBeCloseTo(1.3)
  })

  it('The Destruction of Erysichthon: 5% of one more hit of each Attack Card its wearer plays (expected value)', () => {
    const one = withWeapon('The Destruction of Erysichthon', attack())
    expect(one.ratio).toBeCloseTo(1.05)
    expect(one.r.plays[0].triggered).toMatchObject([{ from: 'The Destruction of Erysichthon', by: 'Testy', chance: 0.05 }])
    expect(one.r.plays[0].hits).toHaveLength(1)
    // One hit more, whatever the card's hits: 3 hits -> 3.05
    expect(withWeapon('The Destruction of Erysichthon', attack({ hits: 3 })).ratio).toBeCloseTo(3.05 / 3)
    expect(withWeapon('The Destruction of Erysichthon', attack({ cardType: 'Skill' })).r.plays[0].triggered).toEqual([])
  })

  it("a teammate's Erysichthon adds to their own plays, not to mine", () => {
    const theirs = newCharacterSave()
    theirs.builds[0].stats.attack = 1000
    theirs.builds[0].equipment = { weapon: { rarity: 'Legendary', piece: 'equip-33' } }
    const mine = newCharacterSave()
    const [b] = mine.builds
    b.stats.attack = 1000
    b.team = [{ ...newTeammate(), character: 'Mei Lin' }]
    const x = attack()
    addCards(mine, x)
    setPlays(mine, plays(x.id))
    expect(computeBuild(real, 'Testy', b, settings, { 'Mei Lin': theirs, Testy: mine }).plays[0].triggered).toEqual([])
  })

  it('batch 2 (City of Mist, Shop, Cthulu Run Monster): every piece is listed', () => {
    const ids = [51, 52, 53, 61, 62, 64, 67, 69, 70, 71, 75, 87, 90, 91, 93].map((n) => `equip-${n}`)
    for (const id of ids) {
      const a = EQUIPMENT_EFFECTS[id]
      expect(IMPORTED_EQUIPMENT.find((p) => p.id === id)?.slot, id).toBe('Weapon')
      expect(a?.effects?.length || a?.notCounted, id).toBeTruthy()
    }
    expect(byName('Criticism of Discord')).toMatchObject({ notCounted: 'the Stress' })
  })

  it('Dream of the Devoured and Void of the Devourer: only the play that follows an Exhaust, once', () => {
    expect(withWeapon('Dream of the Devoured', attack()).ratio).toBeCloseTo(1)
    expect(withWeapon('Dream of the Devoured', attack({ cardType: 'Skill' }), { stacks: { 'Follows an Exhaust': 1 } }).ratio).toBeCloseTo(1.25)
    expect(withWeapon('Void of the Devourer', attack({ pct: 2 }), { stacks: { 'Follows an Exhaust': 3 } }).ratio).toBeCloseTo(1.35)
  })

  it('Foggy Crystal Ball and RFS-17: Attack cards with Cost 0 only', () => {
    expect(withWeapon('Foggy Crystal Ball', attack({ cost: 0, pct: 2 })).ratio).toBeCloseTo(1.4)
    expect(withWeapon('Foggy Crystal Ball', attack()).ratio).toBeCloseTo(1)
    expect(withWeapon('Foggy Crystal Ball', attack({ cost: 0, cardType: 'Skill' })).ratio).toBeCloseTo(1)
    expect(withWeapon('RFS-17', attack({ cost: 0 })).r.plays[0].hits[0].critRate).toBeCloseTo(0.3)
    expect(withWeapon('RFS-17', attack()).r.plays[0].hits[0].critRate).toBeCloseTo(0.2)
  })

  it('Command: #108: +40% on the one Attack Card it is set on', () => {
    expect(withWeapon('Command: #108', attack()).ratio).toBeCloseTo(1)
    expect(withWeapon('Command: #108', attack({ pct: 2 }), { stacks: { 'Command: #108': 1 } }).ratio).toBeCloseTo(2.4 / 2)
    expect(withWeapon('Command: #108', attack({ cardType: 'Skill' }), { stacks: { 'Command: #108': 1 } }).ratio).toBeCloseTo(1)
  })

  it('Second Method: +35% on Extra Attacks, additive, and nothing on other hits', () => {
    expect(withWeapon('Second Method', attack()).ratio).toBeCloseTo(1)
    expect(withWeapon('Second Method', attack({ kind: 'Extra Attack', pct: 2 })).ratio).toBeCloseTo(2.35 / 2)
  })

  it('Criticism of Discord: +18% Attack', () => {
    expect(withWeapon('Criticism of Discord', attack()).r.stats.atk.value).toBeCloseTo(1000 * 1.18 + 90)
  })

  it('batch 3 (Shop, Swamp of Judgment, Foretold Ruin): every piece is listed', () => {
    for (const n of [94, 98, 99, 108, 109, 110, 111, 116, 117, 118, 121, 130, 133, 136, 143]) {
      const a = EQUIPMENT_EFFECTS[`equip-${n}`]
      expect(IMPORTED_EQUIPMENT.find((p) => p.id === `equip-${n}`)?.slot, `${n}`).toBe('Weapon')
      expect(a?.effects?.length || a?.notCounted, `${n}`).toBeTruthy()
    }
  })

  it('Tentacles of Chaos: +8% Attack for all three combatants, the wearer and a linked teammate alike', () => {
    expect(withWeapon('Tentacles of Chaos', attack()).r.stats.atk.value).toBeCloseTo(1000 * 1.08 + 90)
    const theirs = newCharacterSave()
    theirs.builds[0].equipment = { weapon: { rarity: 'Mythic', piece: 'equip-94' } }
    const mine = newCharacterSave()
    const [b] = mine.builds
    b.stats.attack = 1000
    b.team = [{ ...newTeammate(), character: 'Mei Lin' }]
    expect(finalStats(real, 'Testy', withLinkedTeam(b, { 'Mei Lin': theirs, Testy: mine }), settings).atk.value).toBeCloseTo(1080)
  })

  it('the plain and conditional damage buffs of batch 3, by their wording', () => {
    const two = () => attack({ pct: 2 })
    expect(withWeapon('Obsidian Sword', two()).ratio).toBeCloseTo(1.12)
    expect(withWeapon('Esophagus of Madness', two()).ratio).toBeCloseTo(1.2)
    expect(withWeapon('Sword Reflected in the Lake', two()).ratio).toBeCloseTo(1.25)
    expect(withWeapon('Sword Reflected in the Lake', two(), {}, (b) => { b.presetSwitches['equip-110|dmg'] = false }).ratio).toBeCloseTo(1)
    expect(withWeapon('The Fading Flower of Life', two()).ratio).toBeCloseTo(2.4 / 2)
    expect(withWeapon('The Flower of Life', two()).ratio).toBeCloseTo(2.5 / 2)
    expect(withWeapon('Bone Cutter', two()).ratio).toBeCloseTo(2.3 / 2)
    expect(withWeapon('Rune Lance', two()).ratio).toBeCloseTo(2.25 / 2)
    expect(withWeapon('Dagger That Tricked the Shadow', two()).r.stats.critDmg.value).toBeCloseTo(1.62)
  })

  it('one card per turn or the next card only: Sun-Setting Bow, Mountain of Corpses and Cavalry of Lightning count on the play they are set on', () => {
    const bow = { stacks: { 'Sun-Setting Bow (1 per turn)': 1 } }
    expect(withWeapon('Sun-Setting Bow', attack({ cost: 2 })).ratio).toBeCloseTo(1)
    expect(withWeapon('Sun-Setting Bow', attack({ cost: 2 }), bow).ratio).toBeCloseTo(1.3)
    expect(withWeapon('Sun-Setting Bow', attack({ cost: 1 }), bow).ratio).toBeCloseTo(1)
    expect(withWeapon('Mountain of Corpses', attack(), { stacks: { 'Mountain of Corpses (1 per turn)': 1 } }).ratio).toBeCloseTo(1.25)
    expect(withWeapon('Mountain of Corpses', attack()).ratio).toBeCloseTo(1)
    expect(withWeapon('Cavalry of Lightning', attack({ pct: 2 }), { stacks: { 'Cavalry of Lightning': 1 } }).ratio).toBeCloseTo(3 / 2)
    expect(withWeapon('Cavalry of Lightning', attack({ cardType: 'Skill' }), { stacks: { 'Cavalry of Lightning': 1 } }).ratio).toBeCloseTo(1)
  })

  it('batch 4 (Foretold Ruin, Shop, Laboratory 0, Burning Life): every piece is listed', () => {
    for (const n of [144, 145, 148, 151, 152, 154, 155, 156, 157, 158, 165, 171, 175, 179, 184]) {
      const a = EQUIPMENT_EFFECTS[`equip-${n}`]
      expect(IMPORTED_EQUIPMENT.find((p) => p.id === `equip-${n}`)?.slot, `${n}`).toBe('Weapon')
      expect(a?.effects?.length || a?.notCounted, `${n}`).toBeTruthy()
    }
  })

  it('Trumpet of Revelation and W-52 Dopamine Injector: nothing to start with, then up to 2 stacks, set on the play', () => {
    expect(withWeapon('Trumpet of Revelation', attack()).ratio).toBeCloseTo(1)
    expect(withWeapon('Trumpet of Revelation', attack({ pct: 2 }), { stacks: { 'Trumpet of Revelation': 1 } }).ratio).toBeCloseTo(2.2 / 2)
    expect(withWeapon('Trumpet of Revelation', attack({ pct: 2 }), { stacks: { 'Trumpet of Revelation': 4 } }).ratio).toBeCloseTo(2.4 / 2)
    expect(withWeapon('W-52 Dopamine Injector', attack({ pct: 2 })).ratio).toBeCloseTo(1)
    expect(withWeapon('W-52 Dopamine Injector', attack({ pct: 2 }), { stacks: { 'W-52 Dopamine Injector': 2 } }).ratio).toBeCloseTo(1.4)
  })

  it('the switches of batch 4, by their wording', () => {
    const two = (over: Partial<Card> = {}) => attack({ pct: 2, ...over })
    expect(withWeapon('Radiant Orb', two()).ratio).toBeCloseTo(2.25 / 2)
    expect(withWeapon('Chimeranite', two()).ratio).toBeCloseTo(2.35 / 2)
    expect(withWeapon('Chimeranite', two({ cardType: 'Skill' })).ratio).toBeCloseTo(1)
    expect(withWeapon('Mutagenic Wave Amplifier', two()).ratio).toBeCloseTo(2.12 / 2)
    expect(withWeapon('Mutant Predator Spike', two()).ratio).toBeCloseTo(1.3)
    expect(withWeapon('Veiled Thorn', two()).ratio).toBeCloseTo(1.5)
    expect(withWeapon('Harp of Conflict', two()).ratio).toBeCloseTo(1.15)
    expect(withWeapon('Singing Sword', two()).r.stats.atk.value).toBeCloseTo(1000 * 1.15 + 82)
  })

  it('Replica Core: +50% on the Attack Card it is set on', () => {
    const drawn = { stacks: { 'Replica Core (drawn by an ability)': 1 } }
    expect(withWeapon('Replica Core', attack({ pct: 2 })).ratio).toBeCloseTo(1)
    expect(withWeapon('Replica Core', attack({ pct: 2 }), drawn).ratio).toBeCloseTo(2.5 / 2)
    expect(withWeapon('Replica Core', attack({ cardType: 'Skill' }), drawn).ratio).toBeCloseTo(1)
  })

  it("a linked teammate's Harp of Conflict reaches me, their Veiled Thorn doesn't", () => {
    const gear = (piece: string) => {
      const theirs = newCharacterSave()
      theirs.builds[0].equipment = { weapon: { rarity: 'Legendary', piece } }
      const mine = newCharacterSave()
      const [b] = mine.builds
      b.team = [{ ...newTeammate(), character: 'Mei Lin' }]
      return presetStates(real, 'Testy', withLinkedTeam(b, { 'Mei Lin': theirs, Testy: mine })).filter((s) => s.ownerKind === 'Equipment').map((s) => s.key)
    }
    expect(gear('equip-179')).toEqual(['Mei Lin>equip-179|dmg'])
    expect(gear('equip-171')).toEqual([])
  })

  it('batch 5 (Burning Life, Theater of Illusions, Kaleidoscope): every piece is listed', () => {
    for (const n of [185, 189, 191, 195, 202, 205, 208, 211, 215, 220]) {
      const a = EQUIPMENT_EFFECTS[`equip-${n}`]
      expect(IMPORTED_EQUIPMENT.find((p) => p.id === `equip-${n}`)?.slot, `${n}`).toBe('Weapon')
      expect(a?.effects?.length || a?.notCounted, `${n}`).toBeTruthy()
    }
  })

  it('Brilliant Eternal Flame?: Exhaust cards of 2 Cost or more; an "Exhaust 2" card only on the play set as its second', () => {
    const flame = 'Brilliant Eternal Flame?'
    expect(withWeapon(flame, attack({ cost: 2, tags: 'Exhaust' })).ratio).toBeCloseTo(1.4)
    expect(withWeapon(flame, attack({ cost: 2, tags: 'Exhaust', cardType: 'Skill' })).ratio).toBeCloseTo(1.4)
    expect(withWeapon(flame, attack({ cost: 1, tags: 'Exhaust' })).ratio).toBeCloseTo(1)
    expect(withWeapon(flame, attack({ cost: 2 })).ratio).toBeCloseTo(1)
    expect(withWeapon(flame, attack({ cost: 2, tags: 'Exhaust 2' })).ratio).toBeCloseTo(1)
    expect(withWeapon(flame, attack({ cost: 2, tags: 'Exhaust 2' }), { stacks: { 'Second play (it Exhausts)': 1 } }).ratio).toBeCloseTo(1.4)
    // A plain Exhaust card isn't raised twice by the second-play counter
    expect(withWeapon(flame, attack({ cost: 2, tags: 'Exhaust' }), { stacks: { 'Second play (it Exhausts)': 1 } }).ratio).toBeCloseTo(1.4)
  })

  it('the switches of batch 5: Pale Eternal Flame (allies), Sword of Judgment, Broken Golden Quill Pen, Yearning Left Hand', () => {
    expect(withWeapon('Pale Eternal Flame', attack({ pct: 2 })).ratio).toBeCloseTo(1.1)
    expect(byName('Pale Eternal Flame').effects[0].target).toBe('allies')
    expect(withWeapon('Sword of Judgment', attack({ pct: 2 })).ratio).toBeCloseTo(1.1)
    expect(withWeapon('Broken Golden Quill Pen', attack({ pct: 2 })).ratio).toBeCloseTo(1.2)
    expect(withWeapon('Yearning Left Hand', attack({ pct: 2 })).ratio).toBeCloseTo(1.3)
  })

  it("Corrupted Gauntlet and Order's Baton: nothing to start with, then a stack per Extra Attack (5) or card created (2)", () => {
    const crit = (stacks: number, c = attack()) => withWeapon('Corrupted Gauntlet', c, { stacks: { 'Corrupted Gauntlet': stacks } }).r.plays[0].hits[0].critRate
    expect([crit(0), crit(3), crit(9)].map((v) => Math.round(v * 100))).toEqual([20, 26, 30])
    expect(crit(5, attack({ cardType: 'Skill' }))).toBeCloseTo(0.3)
    expect(withWeapon("Order’s Baton", attack({ pct: 2 })).ratio).toBeCloseTo(1)
    expect(withWeapon("Order’s Baton", attack({ pct: 2 }), { stacks: { "Order's Baton": 2 } }).ratio).toBeCloseTo(2.4 / 2)
  })

  it('Key of Sleep: +40% on one target, +20% on 2, +10% on 3 or more (owner\'s reading)', () => {
    const targets = (n: number, c = attack({ pct: 2 })) => withWeapon('Key of Sleep', c, { stacks: { 'Key of Sleep: targets hit, if 2 or more': n } }).ratio
    expect(targets(0)).toBeCloseTo(2.4 / 2)
    expect(targets(2)).toBeCloseTo(2.2 / 2)
    expect(targets(3)).toBeCloseTo(2.1 / 2)
    expect(targets(5)).toBeCloseTo(2.1 / 2)
    expect(targets(2, attack({ cardType: 'Skill' }))).toBeCloseTo(1)
  })

  it('batch 6 (Kaleidoscope, Celestial Bulwark): every weapon now has effects or the reason nothing is counted', () => {
    for (const p of IMPORTED_EQUIPMENT.filter((x) => x.slot === 'Weapon')) {
      const a = EQUIPMENT_EFFECTS[p.id]
      expect(a?.effects?.length || a?.triggers?.length || a?.notCounted, p.name).toBeTruthy()
    }
  })

  it('Fragment of Condensed Radiance, Needle of the Severed Overseer and Triskelion of Judgment', () => {
    const critDmg = (c: Card) => withWeapon('Fragment of Condensed Radiance', c).r.plays[0].hits[0].critDmg
    expect(critDmg(attack({ tags: 'Bind, Retain' }))).toBeCloseTo(2)
    expect(critDmg(attack())).toBeCloseTo(1.5)
    expect(critDmg(attack({ tags: 'Bind', cardType: 'Skill' }))).toBeCloseTo(1.5)
    expect(withWeapon('Needle of the Severed Overseer', attack({ pct: 2 })).ratio).toBeCloseTo(1)
    expect(withWeapon('Needle of the Severed Overseer', attack({ pct: 2 }), { weakness: true }).ratio).toBeCloseTo(2.4 / 2)
    expect(withWeapon('Triskelion of Judgment', attack({ pct: 2 })).ratio).toBeCloseTo(1)
    expect(withWeapon('Triskelion of Judgment', attack({ pct: 2 }), { stacks: { 'Triskelion of Judgment': 1 } }).ratio).toBeCloseTo(1.2)
  })

  it('Runic Hammer: +20% Critical Damage on Unique Attack Cards, once, however many combatants wear one', () => {
    const unique = () => attack({ tags: 'Unique' })
    expect(withWeapon('Runic Hammer', unique()).r.plays[0].hits[0].critDmg).toBeCloseTo(1.7)
    expect(withWeapon('Runic Hammer', attack()).r.plays[0].hits[0].critDmg).toBeCloseTo(1.5)
    const theirs = newCharacterSave()
    theirs.builds[0].equipment = { weapon: { rarity: 'Legendary', piece: 'equip-238' } }
    const mine = newCharacterSave()
    const [b] = mine.builds
    b.stats = { ...b.stats, attack: 1000, critChance: 0.2, critDmg: 1.5 }
    b.team = [{ ...newTeammate(), character: 'Mei Lin' }]
    const x = unique()
    addCards(mine, x)
    setPlays(mine, plays(x.id))
    const saves = { 'Mei Lin': theirs, Testy: mine }
    const critDmg = () => computeBuild(real, 'Testy', b, settings, saves).plays[0].hits[0].critDmg
    const hammers = () => presetStates(real, 'Testy', withLinkedTeam(b, saves)).filter((s) => s.ownerKind === 'Equipment').map((s) => [s.key, s.stacks, !!s.doubled])
    // The teammate's alone reaches me
    expect(critDmg()).toBeCloseTo(1.7)
    // Mine and theirs: still +20%, and theirs says why it isn't counted
    b.equipment = { weapon: { rarity: 'Legendary', piece: 'equip-238' } }
    expect(critDmg()).toBeCloseTo(1.7)
    expect(hammers()).toEqual([['equip-238|crit-dmg', 1, false], ['Mei Lin>equip-238|crit-dmg', 0, true]])
    // Mine switched off: theirs counts
    b.presetSwitches['equip-238|crit-dmg'] = false
    expect(critDmg()).toBeCloseTo(1.7)
    expect(hammers()).toEqual([['equip-238|crit-dmg', 0, false], ['Mei Lin>equip-238|crit-dmg', 1, false]])
  })

  it('trinkets, batch 1 (The Blue Pot, Twin Star\'s Shadow, City of Mist): every piece is listed', () => {
    for (const n of [3, 5, 10, 11, 12, 13, 14, 17, 22, 23, 27, 30, 31, 36, 37, 43, 44, 45, 46, 48, 49]) {
      const a = EQUIPMENT_EFFECTS[`equip-${n}`]
      expect(IMPORTED_EQUIPMENT.find((p) => p.id === `equip-${n}`)?.slot, `${n}`).toBe('Trinket')
      expect(a?.effects?.length || a?.notCounted, `${n}`).toBeTruthy()
    }
  })

  /** One build with a trinket and an attack list of cards; each play's non-crit damage. */
  const withTrinket = (id: string, cards: Card[], stacks: Record<string, number>[] = []) => {
    const cs = newCharacterSave()
    const [b] = cs.builds
    b.stats = { ...b.stats, attack: 1000, defense: 200 }
    addCards(cs, ...cards)
    b.rotation = cards.map((c, i) => ({ cardId: c.id, ...(stacks[i] ? { stacks: stacks[i] } : {}) }))
    const plain = computeBuild(real, 'Testy', b, settings)
    b.equipment = { trinket: { rarity: 'Rare', piece: id } }
    const r = computeBuild(real, 'Testy', b, settings)
    return { r, plain, ratios: r.plays.map((p, i) => p.nonCrit / plain.plays[i].nonCrit) }
  }

  it('Proof of Initiation and Order\'s Emblem: +10% / +15% Defense, which Defense-based cards read', () => {
    expect(withTrinket('equip-5', [attack()]).r.stats.def.value).toBeCloseTo(220)
    expect(withTrinket('equip-17', [attack()]).r.stats.def.value).toBeCloseTo(230)
    const [atkCard, defCard] = withTrinket('equip-17', [attack(), attack({ scaling: 'DEF' })]).ratios
    expect(atkCard).toBeCloseTo(1)
    expect(defCard).toBeGreaterThan(1.05)
  })

  it("Madman's Masterpiece, Pulsating Egg, The Famished One's Belly and Natural Predator", () => {
    expect(withTrinket('equip-12', [attack({ pct: 2 })]).ratios[0]).toBeCloseTo(2.5 / 2)
    expect(withTrinket('equip-43', [attack()]).r.stats.atk.value).toBeCloseTo(1150)
    expect(withTrinket('equip-46', [attack({ pct: 2 })]).ratios[0]).toBeCloseTo(2.25 / 2)
    expect(withTrinket('equip-36', [attack({ pct: 2 }), attack({ pct: 2 })], [{}, { 'Natural Predator': 1 }]).ratios.map((v) => Math.round(v * 100))).toEqual([100, 150])
  })

  it('Flower of Dead Souls: not on the first Attack Card of the attack list, on every later one; Skill cards neither get it nor count as the first', () => {
    const skill = () => attack({ cardType: 'Skill' })
    const ratios = withTrinket('equip-44', [skill(), attack(), skill(), attack(), attack({ pct: 2 })]).ratios
    expect(ratios.map((v) => Math.round(v * 100))).toEqual([100, 100, 100, 120, 120])
  })

  it('trinkets, batch 2 (City of Mist, Shop, Cthulu Run Monster, Event): every piece is listed, and the four with damage count', () => {
    for (const n of [56, 57, 58, 59, 60, 66, 74, 76, 79, 81, 82, 84, 85, 86, 89, 96, 103, 104]) {
      const a = EQUIPMENT_EFFECTS[`equip-${n}`]
      expect(IMPORTED_EQUIPMENT.find((p) => p.id === `equip-${n}`)?.slot, `${n}`).toBe('Trinket')
      expect(a?.effects?.length || a?.notCounted, `${n}`).toBeTruthy()
    }
    const two = (over: Partial<Card> = {}) => attack({ pct: 2, ...over })
    expect(withTrinket('equip-56', [two({ tags: 'Basic, Basic Attack' }), two(), two({ tags: 'Basic, Basic Skill', cardType: 'Skill' })]).ratios.map((v) => Math.round(v * 100))).toEqual([140, 100, 100])
    expect(withTrinket('equip-60', [two()]).ratios[0]).toBeCloseTo(2.4 / 2)
    expect(withTrinket('equip-81', [two()]).ratios[0]).toBeCloseTo(2.25 / 2)
    expect(withTrinket('equip-96', [two()]).ratios[0]).toBeCloseTo(1.2)
  })

  it('trinkets, batch 3 (Swamp of Judgment, Shop, Foretold Ruin, Laboratory 0): every piece is listed, and the ones with damage count', () => {
    for (const n of [105, 106, 114, 115, 119, 120, 124, 125, 126, 129, 131, 137, 138, 140, 141, 142, 147, 150, 153, 161, 162]) {
      const a = EQUIPMENT_EFFECTS[`equip-${n}`]
      expect(IMPORTED_EQUIPMENT.find((p) => p.id === `equip-${n}`)?.slot, `${n}`).toBe('Trinket')
      expect(a?.effects?.length || a?.notCounted, `${n}`).toBeTruthy()
    }
    const two = () => attack({ pct: 2 })
    const stats = (id: string) => { const s = withTrinket(id, [two()]).r.stats; return [Math.round(s.atk.value), Math.round(s.def.value)] }
    expect(stats('equip-105')).toEqual([1100, 200])
    expect(EQUIPMENT_EFFECTS['equip-105'].effects![0].target).toBe('allies')
    expect(stats('equip-119')).toEqual([1080, 224])
    expect(stats('equip-120')).toEqual([1120, 216])
    expect(stats('equip-131')).toEqual([1120, 224])
    expect(stats('equip-150')).toEqual([1000, 230])
    expect(withTrinket('equip-106', [two()]).ratios[0]).toBeCloseTo(2.25 / 2)
    expect(withTrinket('equip-114', [two()]).ratios[0]).toBeCloseTo(2.3 / 2)
    expect(withTrinket('equip-126', [two()]).ratios[0]).toBeCloseTo(2.2 / 2)
    expect(withTrinket('equip-161', [two()]).ratios[0]).toBeCloseTo(2.3 / 2)
    expect(withTrinket('equip-140', [two()]).ratios[0]).toBeCloseTo(1.3)
    expect(withTrinket('equip-137', [two(), two(), two()], [{}, { 'Dimensional Cube': 2 }, { 'Dimensional Cube': 7 }]).ratios.map((v) => Math.round(v * 1000))).toEqual([1000, 1150, 1225])
  })

  it('trinkets, batch 4 (Shop, Laboratory 0, Burning Life): every piece is listed, and the four with damage count', () => {
    for (const n of [163, 164, 168, 169, 170, 173, 174, 177, 181, 182, 183, 187, 188, 190, 194, 197, 198, 199]) {
      const a = EQUIPMENT_EFFECTS[`equip-${n}`]
      expect(IMPORTED_EQUIPMENT.find((p) => p.id === `equip-${n}`)?.slot, `${n}`).toBe('Trinket')
      expect(a?.effects?.length || a?.notCounted, `${n}`).toBeTruthy()
    }
    const two = () => attack({ pct: 2 })
    const pcts = (v: number[]) => v.map((x) => Math.round(x * 100))
    expect(pcts(withTrinket('equip-170', [two(), two(), two()], [{}, { 'Nerve Hacking Module': 1 }, { 'Nerve Hacking Module': 2 }]).ratios)).toEqual([100, 110, 120])
    expect(pcts(withTrinket('equip-181', [two(), two()], [{}, { 'Combat Drum': 1 }]).ratios)).toEqual([100, 120])
    expect(EQUIPMENT_EFFECTS['equip-181'].effects![0].target).toBe('allies')
    const third = 'Third Attack Card created (Summoned Lump of Light)'
    expect(pcts(withTrinket('equip-198', [two(), two(), attack({ cardType: 'Skill' })], [{}, { [third]: 1 }, { [third]: 1 }]).ratios)).toEqual([100, 130, 100])
  })

  it('trinkets, batch 5 (Theater of Illusions, Kaleidoscope, Celestial Bulwark): every piece is listed, and the seven with damage count', () => {
    for (const n of [204, 206, 207, 210, 216, 218, 223, 224, 227, 229, 230, 234, 236, 237, 240, 244, 249, 252]) {
      const a = EQUIPMENT_EFFECTS[`equip-${n}`]
      expect(IMPORTED_EQUIPMENT.find((p) => p.id === `equip-${n}`)?.slot, `${n}`).toBe('Trinket')
      expect(a?.effects?.length || a?.notCounted, `${n}`).toBeTruthy()
    }
    expect(IMPORTED_EQUIPMENT.filter((p) => p.slot === 'Trinket').every((p) => EQUIPMENT_EFFECTS[p.id])).toBe(true)
    const two = () => attack({ pct: 2 })
    const pcts = (v: number[]) => v.map((x) => Math.round(x * 100))
    // +30% on a 200% Attack Card; a Skill card gets nothing
    expect(pcts(withTrinket('equip-204', [two(), attack({ cardType: 'Skill' })]).ratios)).toEqual([115, 100])
    const persona = 'Ally Persona Cards in hand'
    expect(pcts(withTrinket('equip-218', [two(), two(), two()], [{}, { [persona]: 2 }, { [persona]: 9 }]).ratios)).toEqual([100, 140, 160])
    // +20% on a 200% Attack Card, and 2% Critical Chance per enemy (1 to start) on everything
    const logs = withTrinket('equip-230', [two(), attack({ cardType: 'Skill' })])
    expect(pcts(logs.ratios)).toEqual([110, 100])
    expect(logs.r.plays.map((p) => Math.round((p.hits[0].critRate - logs.plain.plays[0].hits[0].critRate) * 100))).toEqual([2, 2])
    // Split Design Core: 8% per turn started, 1 to start
    expect(pcts(withTrinket('equip-244', [two()]).ratios)).toEqual([108])
    expect(EQUIPMENT_EFFECTS['equip-244'].effects![0]).toMatchObject({ target: 'allies', maxStacks: 3 })
    const bind = 'Bind cards stacked this turn'
    const engine = withTrinket('equip-240', [two(), two(), attack({ cardType: 'Skill' })], [{ [bind]: 4 }, { [bind]: 15 }, { [bind]: 4 }])
    expect(engine.r.plays.map((p) => Math.round((p.hits[0].critDmg - engine.plain.plays[0].hits[0].critDmg) * 100))).toEqual([12, 30, 0])
  })

  it("Raider's Scanning Gear: +30% Critical Damage on the first Attack Card of the attack list only", () => {
    const gear = withTrinket('equip-234', [attack({ cardType: 'Skill' }), attack(), attack()])
    expect(gear.r.plays.map((p) => Math.round((p.hits[0].critDmg - gear.plain.plays[0].hits[0].critDmg) * 100))).toEqual([0, 30, 0])
  })

  it('The Final Command: +3% Attack per stack set on the play (0 to 6), next to the other Attack %, before flat Attack', () => {
    const command = 'The Final Command'
    const cards = [attack(), attack(), attack()]
    const { r, plain } = withTrinket('equip-237', cards, [{}, { [command]: 2 }, { [command]: 8 }])
    // Stats screen 1000: 1000 x (1 + 6%) and x (1 + 18%)
    expect(r.plays.map((p) => Math.round(p.hits[0].stat.value - plain.plays[0].hits[0].stat.value))).toEqual([0, 60, 180])
    expect(r.plays[1].hits[0].stat.sources.at(-1)).toMatchObject({ value: 0.06 })
    expect(EQUIPMENT_EFFECTS['equip-237'].effects![0]).toMatchObject({ type: 'ATK %', target: 'allies' })
  })

  it('armor, batch 1 (equip-4 to equip-135): every piece is listed; Defense, Critical Chance and the two +% count', () => {
    const batch = IMPORTED_EQUIPMENT.filter((p) => p.slot === 'Armor' && Number(p.id.slice(6)) <= 135)
    expect(batch).toHaveLength(37)
    for (const p of batch) expect(EQUIPMENT_EFFECTS[p.id]?.effects?.length || EQUIPMENT_EFFECTS[p.id]?.notCounted, p.name).toBeTruthy()
    const withArmor = (id: string, cards: Card[], plays: Partial<RotationPlay>[] = []) => {
      const cs = newCharacterSave()
      const [b] = cs.builds
      b.stats = { ...b.stats, attack: 1000, defense: 200 }
      addCards(cs, ...cards)
      b.rotation = cards.map((c, i) => ({ cardId: c.id, ...plays[i] }))
      b.equipment = { armor: { rarity: 'Rare' } }
      const plain = computeBuild(real, 'Testy', b, settings)
      b.equipment = { armor: { rarity: 'Rare', piece: id } }
      const r = computeBuild(real, 'Testy', b, settings)
      return { r, plain, ratios: r.plays.map((p, i) => Math.round(p.nonCrit / plain.plays[i].nonCrit * 100)) }
    }
    const two = () => attack({ pct: 2 })
    expect(withArmor('equip-4', [two()]).ratios).toEqual([110])
    expect(withArmor('equip-123', [two()]).ratios).toEqual([115])
    // 12% of 200 Defense; Shell of Aberration is Mythic, so its flat Defense is 34, not the Rare 28
    for (const [id, more] of [['equip-47', 24], ['equip-73', 24 + 6]] as const) {
      const { r, plain } = withArmor(id, [two()])
      expect(Math.round(r.stats.def.value - plain.stats.def.value), id).toBe(more)
    }
    const crown = withArmor('equip-113', [two()])
    expect(crown.r.stats.critRate.value - crown.plain.stats.critRate.value).toBeCloseTo(0.06)
    // Mask of Flames: only on the play with Vulnerable switched on
    expect(withArmor('equip-128', [two(), two()], [{}, { vulnerable: true }]).ratios).toEqual([100, 135])
  })

  it('armor, batch 2 (equip-139 on): every piece of equipment is listed now; the six with damage count', () => {
    for (const p of IMPORTED_EQUIPMENT) {
      const a = EQUIPMENT_EFFECTS[p.id]
      expect(a?.effects?.length || a?.triggers?.length || a?.notCounted, p.name).toBeTruthy()
    }
    const withArmor = (id: string, cards: Card[], plays: Partial<RotationPlay>[] = []) => {
      const cs = newCharacterSave()
      const [b] = cs.builds
      b.stats = { ...b.stats, attack: 1000, defense: 200 }
      addCards(cs, ...cards)
      b.rotation = cards.map((c, i) => ({ cardId: c.id, ...plays[i] }))
      const rarity = real.equipment!.find((p) => p.id === id)!.rarity
      b.equipment = { armor: { rarity } }
      const plain = computeBuild(real, 'Testy', b, settings)
      b.equipment = { armor: { rarity, piece: id } }
      const r = computeBuild(real, 'Testy', b, settings)
      return { r, plain, ratios: r.plays.map((p, i) => Math.round(p.nonCrit / plain.plays[i].nonCrit * 100)) }
    }
    const crit = (x: ReturnType<typeof withArmor>) => x.r.plays.map((p, i) => Math.round((p.hits[0].critRate - x.plain.plays[i].hits[0].critRate) * 100))
    const two = () => attack({ pct: 2 })
    const skill = () => attack({ cardType: 'Skill' })
    // Wings of Freedom: 1 stack to start
    expect(withArmor('equip-160', [two()]).ratios).toEqual([110])
    expect(EQUIPMENT_EFFECTS['equip-160'].effects![0]).toMatchObject({ maxStacks: 3, defaultStacks: 1 })
    const phyto = 'Phytotype Synthetic'
    expect(withArmor('equip-172', [two(), two(), skill()], [{}, { stacks: { [phyto]: 2 } }, { stacks: { [phyto]: 1 } }]).ratios).toEqual([100, 120, 100])
    expect(withArmor('equip-192', [two(), skill()]).ratios).toEqual([120, 120])
    const def = withArmor('equip-200', [two()])
    expect(Math.round(def.r.stats.def.value - def.plain.stats.def.value)).toBe(24)
    const gauntlets = 'Essence-Fueled Gauntlets'
    expect(crit(withArmor('equip-233', [two(), two(), skill()], [{}, { stacks: { [gauntlets]: 1 } }, { stacks: { [gauntlets]: 1 } }]))).toEqual([0, 30, 0])
    // Crown of Corruption: Justice Attack Cards only
    expect(crit(withArmor('equip-239', [attack({ element: 'Justice' }), attack({ element: 'Passion' }), attack({ element: 'Justice', cardType: 'Skill' })]))).toEqual([10, 0, 0])
    expect(EQUIPMENT_EFFECTS['equip-201'].effects).toBeUndefined()
  })

  it('Rage Potion: 40% on every 5th Attack Card of the attack list; Skill cards are not counted', () => {
    const list = [...Array.from({ length: 4 }, () => attack()), attack({ cardType: 'Skill' }), ...Array.from({ length: 6 }, () => attack({ pct: 2 }))]
    const ratios = withTrinket('equip-183', list).ratios.map((v) => Math.round(v * 100))
    //                    A    A    A    A    S    A5   A    A    A    A    A10
    expect(ratios).toEqual([100, 100, 100, 100, 100, 140, 100, 100, 100, 100, 140])
  })

  it("the check catches a piece trigger that is not one more hit of the wearer's card", () => {
    const [p] = IMPORTED_EQUIPMENT
    expect(checkEquipment([p], { [p.id]: { triggers: [{ card: p.id, on: 'Attack', own: true, repeat: true, chance: 0.05 }] } })).toEqual([])
    expect(checkEquipment([p], { [p.id]: { triggers: [{ card: 'card-1', on: 'Attack', own: true, repeat: true }] } })).toHaveLength(1)
    expect(checkEquipment([p], { [p.id]: { triggers: [{ card: p.id, on: 'Attack', repeat: true, own: true, chance: 5 }] } })).toHaveLength(1)
  })
})
