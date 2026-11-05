import type { Settings } from '../engine/types'

/** One entry per setting: default value, label and source note (shown on the Settings page). */
export const SETTING_INFO: { key: keyof Settings; label: string; pct: boolean; note: string }[] = [
  { key: 'atkConstant', label: 'ATK damage constant', pct: false, note: 'Prydwen damage formula guide' },
  { key: 'defCardAtkCoef', label: 'DEF card: ATK coefficient', pct: false, note: 'Prydwen: DEF-based damage uses (ATK x 0.3 + DEF x 2.1)' },
  { key: 'defCardDefCoef', label: 'DEF card: DEF coefficient', pct: false, note: 'Prydwen' },
  { key: 'extraWeakness', label: 'Extra weakness factor (Unconfirmed)', pct: true, note: 'Mei Lin test (204% -> 290% = x1.42 Weakness DMG) shows no extra factor. Leave 0% unless a test says otherwise' },
  { key: 'vulnerable', label: 'Vulnerable bonus', pct: true, note: 'Prydwen: x1.5. Switched on per play (Cards tab)' },
  { key: 'weaknessDebuff', label: 'Weakness debuff penalty', pct: true, note: 'Prydwen: x0.75 while the Weakness debuff is on you' },
  { key: 'critCap', label: 'Crit rate cap', pct: true, note: 'Assumed 100%' },
  { key: 'ravaged', label: 'Ravaged: extra damage taken (Unconfirmed)', pct: true, note: "Ravaged enemies take more damage; size unknown. Applies to plays with Target Ravaged on" },
  { key: 'fixedAtkCoef', label: 'Fixed damage: ATK coefficient (Unconfirmed)', pct: false, note: "Fixed damage = Fixed % x Final ATK x this. The owner thinks it's ATK-based (2026-10-28); 0.35 like other cards until tested" },
  { key: 'moralePerStack', label: 'Morale per stack', pct: true, note: 'Game8: +20% additive per stack' },
  { key: 'moraleMax', label: 'Morale max stacks', pct: false, note: 'Owner' },
  { key: 'potentialPerLevel', label: 'Card upgrade potential per level', pct: true, note: "Owner and the in-game text: Basic / Signature Card Upgrade raise the card's base damage by 2% per level (max 10 = 20%)" },
]

/** The settings that differ from the defaults. A save keeps only these, so a default changed after an in-game test reaches every save
 * that didn't change that setting (owner, 2026-11-04). */
export function changedSettings(s: Settings): Partial<Settings> {
  return Object.fromEntries(Object.entries(s).filter(([k, v]) => v !== DEFAULT_SETTINGS[k as keyof Settings]))
}

/** Saved settings over the defaults. A value of another type than its default's (a hand-edited file) is left out. */
export function readSettings(saved: unknown): Settings {
  const out: Record<string, unknown> = { ...DEFAULT_SETTINGS }
  if (saved && typeof saved === 'object') {
    for (const [k, v] of Object.entries(saved)) if (k in DEFAULT_SETTINGS && typeof v === typeof out[k]) out[k] = v
  }
  return out as unknown as Settings
}

export const DEFAULT_SETTINGS: Settings = {
  atkConstant: 0.35,
  defCardAtkCoef: 0.3,
  defCardDefCoef: 2.1,
  extraWeakness: 0,
  vulnerable: 0.5,
  weaknessDebuff: 0.25,
  critCap: 1,
  ravaged: 0,
  multMode: 'Summed',
  moralePerStack: 0.2,
  moraleMax: 20,
  potentialPerLevel: 0.02,
  potentialFixed: false,
  roundCardPct: true,
  fixedAtkCoef: 0.35,
}
