import { afterEach, describe, expect, it, vi } from 'vitest'
import { defaultSave, SAVE_VERSION } from '../src/store/save'
import { loadSave, storeSave } from '../src/store/storage'

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
    expect(storeSave(defaultSave())).toBe(false)
    stubStorage(null)
    expect(storeSave(defaultSave())).toBe(true)
  })
})
