// Equipment: our additions to the Prydwen import (src/data/prydwen-equipment.json), keyed by the import's piece ids.
// A re-import never touches this file. A piece listed here with `effects` shows them as preset switches (Setup, Buffs) while it's
// picked; `notCounted` says why nothing, or not everything, in its text is counted. A piece not listed shows its text marked
// "not counted".
//
// Effects are read from the piece's text with the owner (never assumed): "+X%" = Additive, "X%" without "+" = Multiplicative
// (docs/FORMULA.md). category: 'Equipment'. Effect ids must be unique per piece: saved switches are keyed "<piece id>|effectId"
// ("equip-206|dmg"), so renaming an effect id resets that switch.
import type { EquipmentAdditions } from '../engine/types'

export const EQUIPMENT_EFFECTS: Record<string, EquipmentAdditions> = {
}
