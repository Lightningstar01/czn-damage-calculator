// Equipment. Only the weapon's flat Attack so far (owner, 2026-11-11); the pieces and their effects come later.
import type { EquipRarity } from '../engine/types'

/** Flat Attack of a weapon at its top level, per rarity. Source: Prydwen's equipment page (Rare 25/41/56/67/74, Legendary 28/45/62/74/82,
 * Unique 31/50/68/81/90); the owner picked the top value for each (2026-11-11). Armor gives Defense (28 / 31 / 34) and trinkets Health
 * (75 / 83 / 91) the same way: not used yet. */
export const WEAPON_ATK: Record<EquipRarity, number> = { Rare: 74, Legendary: 82, Unique: 90 }
