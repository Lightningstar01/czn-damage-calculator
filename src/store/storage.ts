// Browser storage and backup files.
import type { SaveData } from '../engine/types'
import { changedSettings } from '../data/settings'
import { defaultSave, SAVE_VERSION } from './save'
import { migrate } from './migrate'
import { STORAGE_KEY } from './storageKey'

/** One undo copy of the stored save, kept before an import, a reset, a delete or the first load after a save format change (owner, 2026-11-03). */
const COPY_KEY = `${STORAGE_KEY}-undo`

export interface LoadedSave {
  data: SaveData
  /** The stored save couldn't be opened. It stays in storage untouched (no autosave) until the owner decides. */
  unreadable?: { text: string; reason: string }
}

/** The stored text as this tab last read or wrote it. Anything else in storage was saved by another tab (or the home-screen app) since. */
let known: string | null = null

export function loadSave(): LoadedSave {
  let text: string | null
  try {
    text = localStorage.getItem(STORAGE_KEY)
  } catch {
    return { data: defaultSave() } // storage is blocked: storeSave fails too, and the site says so
  }
  known = text
  if (!text) return { data: defaultSave() }
  try {
    const raw: unknown = JSON.parse(text)
    const version = (raw as { version?: unknown } | null)?.version
    const data = migrate(raw)
    // The first autosave rewrites an older save in the new format: keep the original
    if (version !== SAVE_VERSION) keepCopy(text, 'the site was updated')
    return { data }
  } catch (e) {
    return { data: defaultSave(), unreadable: { text, reason: (e as Error).message } }
  }
}

/** The save as stored and backed up: only the settings that differ from the defaults (missing = default). */
export const saveText = (data: SaveData, indent?: number) => JSON.stringify({ ...data, settings: changedSettings(data.settings) }, null, indent)

/** failed: the browser refused (storage full or blocked); changed: another tab saved since, so nothing was written. */
export type SaveResult = 'saved' | 'failed' | 'changed'

export function storeSave(data: SaveData): SaveResult {
  try {
    if (localStorage.getItem(STORAGE_KEY) !== known) return 'changed'
    const text = saveText(data)
    localStorage.setItem(STORAGE_KEY, text)
    known = text
    return 'saved'
  } catch {
    return 'failed'
  }
}

/** Whether another tab (or the home-screen app) saved since this tab last read or wrote. */
export function changedElsewhere(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== known
  } catch {
    return false
  }
}

/** Asks the browser not to clear the site's data when the device runs short of space (Chrome decides by itself, Firefox asks once). */
export function askToKeepData(): void {
  try {
    navigator.storage?.persist?.().catch(() => {})
  } catch {
    // not offered by this browser
  }
}

export interface UndoCopy {
  text: string
  /** When it was kept (ISO date). */
  at: string
  /** What came after it: "importing a backup"... */
  reason: string
}

/** Keeps `text` (a stored save) as the undo copy, replacing the last one. False if the browser refused (storage full). */
export function keepCopy(text: string, reason: string): boolean {
  try {
    localStorage.setItem(COPY_KEY, JSON.stringify({ text, at: new Date().toISOString(), reason } satisfies UndoCopy))
    return true
  } catch {
    return false
  }
}

/** Keeps the undo copy before everything is replaced; false if the owner stops because the browser couldn't keep one. */
export function keepUndo(text: string, reason: string): boolean {
  return keepCopy(text, reason) || confirm("This browser couldn't keep an undo copy (its storage is full). Continue anyway?")
}

export function readCopy(): UndoCopy | undefined {
  try {
    const c: unknown = JSON.parse(localStorage.getItem(COPY_KEY) ?? 'null')
    return c && typeof c === 'object' && typeof (c as UndoCopy).text === 'string' ? c as UndoCopy : undefined
  } catch {
    return undefined
  }
}

/** Puts the undo copy back and reloads the page. What was stored becomes the undo copy, so this can be undone too. */
export function restoreCopy(): void {
  const copy = readCopy()
  if (!copy) return
  try {
    const now = localStorage.getItem(STORAGE_KEY)
    if (now) keepCopy(now, 'restoring the undo copy')
    localStorage.setItem(STORAGE_KEY, copy.text)
  } catch {
    alert("This browser couldn't write its storage, so nothing changed.")
    return
  }
  location.reload()
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
  download(saveText(data, 2), 'czn-calculator-backup')
}

/** The stored text exactly as it is, for a save that couldn't be opened. */
export function downloadUnreadable(text: string): void {
  download(text, 'czn-calculator-unreadable-save')
}

/** What's stored now, exactly as it is (the page crashed, so the data in memory may be what broke it). */
export function downloadStored(): void {
  let text: string | null = null
  try {
    text = localStorage.getItem(STORAGE_KEY)
  } catch { /* blocked: nothing to download */ }
  if (text) download(text, 'czn-calculator-stored-data')
}
