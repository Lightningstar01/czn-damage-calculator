// Saved data: defaults, versioning/migrations, browser storage, backup files.
import { PRESETS } from '../data/presets'
import { DEFAULT_SETTINGS } from '../data/settings'
import { ELEMENTS, CARD_TYPES, FRAGMENT_SET_PICKS, type Build, type Card, type CardPreset, type CharacterSave, type Element, type SaveData, type ScreenStats, type UserBoost, type UserBuff } from '../engine/types'

/** Bump when the save format changes, and add a step to migrate(). */
export const SAVE_VERSION = 6
const STORAGE_KEY = 'czn-damage-calculator'

/** Mei Lin's card preset ids before v6 -> Prydwen card ids. */
const MEI_LIN_V5_IDS: Record<string, string> = {
  strike: 'card-338', guardian: 'card-339', ego: 'card-337', sovereignty: 'card-364',
  ...Object.fromEntries((['jewel', 'spire', 'unity', 'aromata'] as const).flatMap((base, i) =>
    [0, 1, 2, 3, 4, 5].map((n) => [n ? `${base}-${n}` : base, `card-${340 + i * 6 + n}`]))),
}

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

/** element: the character's. */
export function newCard(element: Element): Card {
  return { id: newId(), name: '', cardType: 'Attack', element, cost: 1, tags: '', scaling: 'ATK', kind: 'Normal', pct: 1, hits: 1, weaknessApplies: false, targetRavaged: false }
}

/** Library copy of a card preset; element: the character's (unless the preset sets its own). */
export function cardFromPreset(p: CardPreset, element: Element): Card {
  return {
    ...newCard(p.element ?? element), name: p.name, cardType: p.cardType, cost: p.cost ?? null, tags: p.tags ?? '', scaling: p.scaling ?? 'ATK',
    kind: p.kind ?? 'Normal', pct: p.pct, hits: p.hits, weaknessApplies: !!p.weaknessApplies, targetRavaged: !!p.targetRavaged,
    preset: p.id,
  }
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
  // Future migrations go here: if (data.version === 6) { ...; data.version = 7 }
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
  if (data.version === 3) {
    // v4: rotation plays are objects, so a play can override the card's hits
    for (const cs of Object.values(data.characters ?? {})) {
      cs.rotation = ((cs.rotation ?? []) as unknown[]).map((p) => typeof p === 'string' ? { cardId: p } : p as CharacterSave['rotation'][number])
    }
    data.version = 4
  }
  if (data.version === 4) {
    // v5: element and cost are card fields. Take them from tags like 'Passion' / '1-cost' (and drop those tags);
    // else the character's element and no cost.
    for (const [name, cs] of Object.entries(data.characters ?? {})) {
      const charElement = PRESETS.characters.find((c) => c.name === name)?.element ?? ELEMENTS[0]
      for (const c of cs.cards ?? []) {
        const tags = (c.tags ?? '').split(',').map((t) => t.trim()).filter(Boolean)
        const el = tags.find((t) => (ELEMENTS as readonly string[]).includes(t))
        const cost = tags.find((t) => /^\d+-cost$/i.test(t))
        c.element ??= (el as Element) ?? charElement
        c.cost ??= cost ? parseInt(cost, 10) : null
        c.tags = tags.filter((t) => t !== el && t !== cost).join(', ')
      }
    }
    data.version = 5
  }
  if (data.version === 5) {
    // v6: card presets are imported from Prydwen, so Mei Lin's hand-entered preset ids became Prydwen card ids
    for (const c of data.characters?.['Mei Lin']?.cards ?? []) {
      if (c.preset && c.preset in MEI_LIN_V5_IDS) c.preset = MEI_LIN_V5_IDS[c.preset]
    }
    data.version = 6
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
