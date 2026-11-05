import { afterEach, describe, expect, it, vi } from 'vitest'
import { defaultSave, SAVE_VERSION } from '../src/store/save'
import { changedElsewhere, keepCopy, loadSave, readCopy, storeSave } from '../src/store/storage'
import { STORAGE_KEY } from '../src/store/storageKey'
import { DEFAULT_SETTINGS } from '../src/data/settings'

const stubStorage = (stored: string | null, setItem = vi.fn()) => {
  vi.stubGlobal('localStorage', { getItem: () => stored, setItem })
  return setItem
}

describe('browser storage', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('loads a stored save', () => {
    stubStorage(JSON.stringify(defaultSave()))
    expect(loadSave()).toEqual({ data: defaultSave() })
  })

  it('an empty browser starts with an empty save', () => {
    stubStorage(null)
    expect(loadSave()).toEqual({ data: defaultSave() })
  })

  it('a stored save that cannot be opened comes back as is, and nothing is written', () => {
    for (const text of ['{broken', JSON.stringify({ version: SAVE_VERSION + 1, characters: { X: { builds: [{ id: 'a' }] } } })]) {
      const setItem = stubStorage(text)
      const loaded = loadSave()
      expect(loaded.data).toEqual(defaultSave())
      expect(loaded.unreadable?.text).toBe(text)
      expect(loaded.unreadable?.reason).toBeTruthy()
      expect(setItem).not.toHaveBeenCalled()
    }
  })

  it('blocked storage still gives a working save, and storeSave reports failed writes', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => { throw new Error('blocked') },
      setItem: () => { throw new Error('full') },
    })
    expect(loadSave()).toEqual({ data: defaultSave() })
    expect(storeSave(defaultSave())).toBe('failed')
    stubStorage(null)
    loadSave()
    expect(storeSave(defaultSave())).toBe('saved')
  })
})

/** A localStorage that keeps what's written. */
const memoryStorage = (items: Record<string, string> = {}) => {
  vi.stubGlobal('localStorage', { getItem: (k: string) => items[k] ?? null, setItem: (k: string, v: string) => { items[k] = v } })
  return items
}

describe('undo copy and other tabs', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('the first load after a format change keeps the original as the undo copy', () => {
    const old = JSON.stringify({ version: 1, characters: {} })
    memoryStorage({ [STORAGE_KEY]: old })
    loadSave()
    expect(readCopy()).toMatchObject({ text: old, reason: 'the site was updated' })
    memoryStorage({ [STORAGE_KEY]: JSON.stringify(defaultSave()) })
    loadSave()
    expect(readCopy()).toBeUndefined()
  })

  it('stores only the settings that differ from the defaults, so a changed default reaches the save; a wrong type is left out', () => {
    const items = memoryStorage()
    loadSave()
    const data = defaultSave()
    data.settings.ravaged = 0.3
    expect(storeSave(data)).toBe('saved')
    expect(JSON.parse(items[STORAGE_KEY]).settings).toEqual({ ravaged: 0.3 })
    expect(loadSave().data.settings).toEqual({ ...DEFAULT_SETTINGS, ravaged: 0.3 })
    items[STORAGE_KEY] = JSON.stringify({ ...defaultSave(), settings: { atkConstant: 'abc', critCap: 0.9, gone: 1 } })
    expect(loadSave().data.settings).toEqual({ ...DEFAULT_SETTINGS, critCap: 0.9 })
  })

  it('keepCopy keeps one copy, and a save another tab wrote since is not overwritten', () => {
    const items = memoryStorage()
    expect(keepCopy('a', 'importing a backup') && keepCopy('b', 'deleting all data')).toBe(true)
    expect(readCopy()).toMatchObject({ text: 'b', reason: 'deleting all data' })
    loadSave()
    expect(storeSave(defaultSave())).toBe('saved')
    expect(changedElsewhere()).toBe(false)
    items[STORAGE_KEY] = 'from another tab'
    expect(changedElsewhere()).toBe(true)
    expect(storeSave(defaultSave())).toBe('changed')
    expect(items[STORAGE_KEY]).toBe('from another tab')
  })
})
