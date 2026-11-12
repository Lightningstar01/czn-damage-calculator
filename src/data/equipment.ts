// Equipment: the pieces imported from Prydwen (scripts/import_equipment.py -> prydwen-equipment.json, generated: never edit by
// hand) merged with our Effects for them (equipmentEffects.ts, keyed by the piece ids), and the flat stat each slot gives.
import imported from './prydwen-equipment.json'
import { EQUIPMENT_EFFECTS } from './equipmentEffects'
import { EQUIP_RARITIES, EQUIP_SLOTS, type EquipmentAdditions, type EquipmentPreset, type EquipRarity, type EquipSlot } from '../engine/types'

/** The flat stat of a piece at its top level, per slot and rarity (owner, 2026-11-11: always the top of Prydwen's five values, and
 * always the rarity's, whatever the piece: Prydwen gives 3 weapons the Mythic values at a lower rarity, read as its mistakes).
 * Weapon: Attack (Rare 25/41/56/67/74, Legendary 28/45/62/74/82, Mythic 31/50/68/81/90). Armor: Defense (9/15/21/24/28,
 * 10/17/23/27/31, 11/19/25/30/34). Trinket: Health (20/37/54/66/75, 22/41/60/73/83, 24/45/66/80/91). */
export const EQUIP_FLAT: Record<EquipSlot, Record<EquipRarity, number>> = {
  weapon: { Rare: 74, Legendary: 82, Mythic: 90 },
  armor: { Rare: 28, Legendary: 31, Mythic: 34 },
  trinket: { Rare: 75, Legendary: 83, Mythic: 91 },
}

/** A piece as the import has it (prydwen-equipment.json). */
export interface ImportedPiece {
  id: string
  name: string
  /** 'Weapon' / 'Armor' / 'Trinket'. */
  slot: string
  rarity: string
  stat: string
  values: number[]
  text: string
  source: string
  seasonal: boolean
  image?: string
}

export const IMPORTED_EQUIPMENT: ImportedPiece[] = imported.pieces

export function mergeEquipment(pieces: ImportedPiece[], additions: Record<string, EquipmentAdditions>): EquipmentPreset[] {
  return pieces.map((p) => ({
    id: p.id, name: p.name, slot: p.slot.toLowerCase() as EquipSlot, rarity: p.rarity as EquipRarity, text: p.text, source: p.source,
    ...(p.seasonal ? { seasonal: true } : {}), ...(p.image ? { image: p.image } : {}),
    effects: additions[p.id]?.effects ?? [],
    ...(additions[p.id]?.notCounted ? { notCounted: additions[p.id].notCounted } : {}),
  })).sort((a, b) => a.name.localeCompare(b.name))
}

export const EQUIPMENT: EquipmentPreset[] = mergeEquipment(IMPORTED_EQUIPMENT, EQUIPMENT_EFFECTS)

/** What's wrong with the import or our additions (run by the tests): a slot or rarity the site doesn't know, an id or a name used
 * twice (the picker and the Results labels tell pieces apart by name), additions for a piece the import doesn't have, an effect id
 * used twice on a piece, and a category other than Equipment. */
export function checkEquipment(pieces: ImportedPiece[], additions: Record<string, EquipmentAdditions>): string[] {
  const problems: string[] = []
  const taken = new Set<string>()
  for (const p of pieces) {
    if (!(EQUIP_SLOTS as readonly string[]).includes(p.slot.toLowerCase())) problems.push(`prydwen-equipment.json: ${p.id} (${p.name}) has the unknown slot '${p.slot}'`)
    if (!(EQUIP_RARITIES as readonly string[]).includes(p.rarity)) problems.push(`prydwen-equipment.json: ${p.id} (${p.name}) has the unknown rarity '${p.rarity}'`)
    for (const key of [p.id, p.name]) {
      if (taken.has(key)) problems.push(`prydwen-equipment.json: '${key}' is used twice`)
      taken.add(key)
    }
  }
  for (const [id, a] of Object.entries(additions)) {
    const piece = pieces.find((p) => p.id === id)
    if (!piece) {
      problems.push(`equipmentEffects.ts: no piece '${id}' in prydwen-equipment.json`)
      continue
    }
    const ids = new Set<string>()
    for (const e of a.effects ?? []) {
      if (ids.has(e.id)) problems.push(`equipmentEffects.ts: effect id '${e.id}' used twice on ${id} (${piece.name})`)
      ids.add(e.id)
      if (e.category !== 'Equipment') problems.push(`equipmentEffects.ts: effect '${e.id}' on ${id} (${piece.name}) has the category '${e.category}', not Equipment`)
    }
  }
  return problems
}
