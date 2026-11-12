// All presets: characters, partners, memory fragment sets and their effects (keep effect ids unique per owner).
// Effect value: as shown in-game. Stats: '16%' or '74'. Buffs: '+30%' = additive, '30%' = multiplicative,
// 'Weakness Attack' = Weakness DMG applies to matching cards. See docs/FORMULA.md for the rules.
//
// Characters and their cards are imported from Prydwen (scripts/import_prydwen.py -> prydwen/<slug>.json,
// generated: never edit by hand). Our additions (buffs, notes, corrections) go in characters/<slug>.ts, keyed by
// the imported card ids, so a re-import never overwrites them. Partners (partners/<slug>.ts) and fragment sets
// (fragmentSets.ts) are entered by hand.
import type { CharacterAdditions, ImportedCharacter, PartnerPreset, Presets } from '../engine/types'
import { WEAPON_ATK } from './equipment'
import { FRAGMENT_SETS } from './fragmentSets'
import { mergeCharacter } from './merge'

const bySlug = <T>(modules: Record<string, T>) =>
  Object.fromEntries(Object.entries(modules).map(([path, m]) => [path.replace(/^.*\/|\.\w+$/g, ''), m]))

export const IMPORTED: Record<string, ImportedCharacter> = bySlug(
  import.meta.glob<ImportedCharacter>(['./prydwen/*.json', '!./prydwen/_meta.json'], { eager: true, import: 'default' }))
export const ADDITIONS: Record<string, CharacterAdditions> = bySlug(
  import.meta.glob<CharacterAdditions>('./characters/*.ts', { eager: true, import: 'default' }))

export const PARTNERS: Record<string, PartnerPreset> = bySlug(
  import.meta.glob<PartnerPreset>('./partners/*.ts', { eager: true, import: 'default' }))

export const PRESETS: Presets = {
  characters: Object.values(IMPORTED)
    .map((c) => mergeCharacter(c, ADDITIONS[c.slug]))
    .sort((a, b) => a.name.localeCompare(b.name)),
  partners: Object.values(PARTNERS),
  fragmentSets: FRAGMENT_SETS,
  weaponAtk: WEAPON_ATK,
}
