// Saved data: defaults and new objects. Older saves: migrate.ts; browser storage and backups: storage.ts.
import { current, isDraft, type Draft } from 'immer'
import { DEFAULT_SETTINGS } from '../data/settings'
import { ELEMENTS, FRAGMENT_SET_PICKS, type Build, type CharacterSave, type SaveData, type ScreenStats, type Teammate, type UserBoost, type UserBuff } from '../engine/types'

/** Bump when the save format changes, and add a step to migrate(). */
export const SAVE_VERSION = 10

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
    morale: 0, egoLevel: 0, basicLevel: 0, signatureLevel: 0, presetSwitches: {}, team: [], deck: [], rotation: [],
  }
}

export function newTeammate(): Teammate {
  return { character: '', egoLevel: 0, partner: '', fragments: Array(FRAGMENT_SET_PICKS).fill(''), cards: [] }
}

export function newCharacterSave(): CharacterSave {
  const a = newBuild('Build A')
  return { builds: [a], activeBuild: a.id, showAllPartners: false, boosts: [], buffs: [] }
}

export function newBoost(buildId: string): UserBoost {
  return { id: newId(), source: '', from: '', stat: 'Flat ATK', value: '', category: 'Equipment', notes: '', switches: { [buildId]: true } }
}

export function newBuff(buildId: string): UserBuff {
  return {
    id: newId(), source: '', from: '', category: 'Other', value: '', typeOverride: '', appliesTo: 'ALL', hitScope: 'All hits',
    condition: 'Always', maxStacks: null, notes: '', switches: { [buildId]: true },
  }
}

/** Deep copy; works on immer drafts too (structuredClone can't copy a draft). */
export function clone<T>(x: T): T {
  return structuredClone(isDraft(x) ? (current(x as Draft<T>) as T) : x)
}

/** Copy of a build with a new id; the owner's boosts/buffs get the same switch for the copy. */
export function duplicateBuild(cs: CharacterSave, build: Build, name: string): Build {
  const copy: Build = { ...clone(build), id: newId(), name }
  for (const row of [...cs.boosts, ...cs.buffs]) {
    if (build.id in row.switches) row.switches[copy.id] = row.switches[build.id]
  }
  return copy
}

export function defaultSave(): SaveData {
  return { version: SAVE_VERSION, settings: { ...DEFAULT_SETTINGS }, activeCharacter: '', characters: {} }
}
