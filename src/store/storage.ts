// Browser storage and backup files.
import type { SaveData } from '../engine/types'
import { defaultSave } from './save'
import { migrate } from './migrate'
import { STORAGE_KEY } from './storageKey'

export interface LoadedSave {
  data: SaveData
  /** The stored save couldn't be opened. It stays in storage untouched (no autosave) until the owner decides. */
  unreadable?: { text: string; reason: string }
}

export function loadSave(): LoadedSave {
  let text: string | null
  try {
    text = localStorage.getItem(STORAGE_KEY)
  } catch {
    return { data: defaultSave() } // storage is blocked: storeSave fails too, and the site says so
  }
  if (!text) return { data: defaultSave() }
  try {
    return { data: migrate(JSON.parse(text)) }
  } catch (e) {
    return { data: defaultSave(), unreadable: { text, reason: (e as Error).message } }
  }
}

/** False if the browser refused (storage full or blocked): the site shows a warning. */
export function storeSave(data: SaveData): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    return true
  } catch {
    return false
  }
}

function download(text: string, name: string): void {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }))
  a.download = `${name}-${new Date().toISOString().slice(0, 10)}.json`
  document.body.append(a)
  a.click()
  a.remove()
  // Some mobile browsers start the download later, so the URL has to outlive the click
  setTimeout(() => URL.revokeObjectURL(a.href), 60_000)
}

export function downloadBackup(data: SaveData): void {
  download(JSON.stringify(data, null, 2), 'czn-calculator-backup')
}

/** The stored text exactly as it is, for a save that couldn't be opened. */
export function downloadUnreadable(text: string): void {
  download(text, 'czn-calculator-unreadable-save')
}
