// Saved data: defaults, versioning/migrations, browser storage, backup files.
import { DEFAULT_SETTINGS } from '../data/settings'
import { ELEMENTS, CARD_TYPES, FRAGMENT_SET_PICKS, type Build, type Card, type CharacterSave, type SaveData, type ScreenStats, type UserBoost, type UserBuff } from '../engine/types'

/** Bump when the save format changes, and add a step to migrate(). */
export const SAVE_VERSION = 3
const STORAGE_KEY = 'czn-damage-calculator'

export function newId(): string {
  return Math.random().toString(36).slice(2, 10)
}

export function newStats(): ScreenStats {
  return {
    attack: 0, defense: 0, health: 0, critChance: 0, critDmg: 0, weaknessDmg: 1.25,
    elemDmg: Object.fromEntries(ELEMENTS.map((e) => [e, 0])) as ScreenStats['elemDmg'],
    extraDmg: 0, dotDmg: 0,
  }
}

export function newBuild(name: string): Build {
  return {
    id: newId(), name, partner: '', fragments: Array(FRAGMENT_SET_PICKS).fill(''), stats: newStats(), enemyDefMult: 1, enemyDr: 0,
    morale: 0, vulnerable: 0, weaknessDebuff: 0, presetSwitches: {},
  }
}

export function newCharacterSave(): CharacterSave {
  const a = newBuild('Build A')
  return { builds: [a], activeBuild: a.id, showAllPartners: false, boosts: [], buffs: [], cards: [], rotation: [] }
}

export function newCard(): Card {
  return { id: newId(), name: '', cardType: 'Attack', tags: '', scaling: 'ATK', kind: 'Normal', pct: 1, hits: 1, weaknessApplies: false, targetRavaged: false }
}

export function newBoost(buildId: string): UserBoost {
  return { id: newId(), source: '', stat: 'Flat ATK', value: '', category: 'Equipment', notes: '', switches: { [buildId]: true } }
}

export function newBuff(buildId: string): UserBuff {
  return {
    id: newId(), source: '', category: 'Other', value: '', typeOverride: '', appliesTo: 'ALL', hitScope: 'All hits',
    condition: 'Always', maxStacks: null, notes: '', switches: { [buildId]: true },
  }
}

/** Copy of a build with a new id; the owner's boosts/buffs get the same switch for the copy. */
export function duplicateBuild(cs: CharacterSave, build: Build, name: string): Build {
  const copy: Build = { ...structuredClone(build), id: newId(), name }
  for (const row of [...cs.boosts, ...cs.buffs]) {
    if (build.id in row.switches) row.switches[copy.id] = row.switches[build.id]
  }
  return copy
}

export function defaultSave(): SaveData {
  return { version: SAVE_VERSION, settings: { ...DEFAULT_SETTINGS }, activeCharacter: '', characters: {} }
}

/** Bring an older (or partial) save up to the current format. Throws if it isn't a save file. */
export function migrate(raw: unknown): SaveData {
  if (!raw || typeof raw !== 'object' || !('characters' in raw)) throw new Error("This file isn't a calculator save.")
  const data = raw as SaveData
  if ((data.version ?? 0) > SAVE_VERSION) throw new Error('This save is from a newer version of the calculator.')
  // Future migrations go here: if (data.version === 3) { ...; data.version = 4 }
  if ((data.version ?? 1) <= 1) {
    // v2: memory fragment set picks per build
    for (const cs of Object.values(data.characters ?? {})) {
      for (const b of cs.builds ?? []) b.fragments ??= Array(FRAGMENT_SET_PICKS).fill('')
    }
    data.version = 2
  }
  if (data.version === 2) {
    // v3: card type dropdown. Take it from a matching tag (and drop that tag), else Attack.
    for (const cs of Object.values(data.characters ?? {})) {
      for (const c of cs.cards ?? []) {
        const tags = (c.tags ?? '').split(',').map((t) => t.trim()).filter(Boolean)
        const found = tags.find((t) => (CARD_TYPES as readonly string[]).includes(t))
        c.cardType ??= (found as Card['cardType']) ?? 'Attack'
        if (found) c.tags = tags.filter((t) => t !== found).join(', ')
      }
    }
    data.version = 3
  }
  return {
    ...defaultSave(),
    ...data,
    settings: { ...DEFAULT_SETTINGS, ...data.settings },
    version: SAVE_VERSION,
  }
}

export function loadSave(): SaveData {
  try {
    const text = localStorage.getItem(STORAGE_KEY)
    if (text) return migrate(JSON.parse(text))
  } catch (e) {
    console.error('Could not load the saved data', e)
  }
  return defaultSave()
}

export function storeSave(data: SaveData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (e) {
    console.error('Could not save', e)
  }
}

export function downloadBackup(data: SaveData): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `czn-calculator-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(a.href)
}
