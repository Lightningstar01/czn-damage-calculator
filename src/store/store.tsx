// App state: the save data in a React context, autosaved to the browser on every change.
import { produce } from 'immer'
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { PRESETS } from '../data/presets'
import { computeBuild, type BuildResult } from '../engine/calc'
import { linkedBuild, type Linked } from '../engine/team'
import type { Build, CharacterSave, SaveData, Teammate } from '../engine/types'
import { activeFight, newCharacterSave } from './save'
import { askToKeepData, changedElsewhere, loadSave, storeSave, type LoadedSave } from './storage'

interface Store {
  data: SaveData
  update: (recipe: (d: SaveData) => void) => void
  /** Replaces everything, also a stored save that couldn't be opened. */
  replace: (d: SaveData) => void
  /** The stored save couldn't be opened: nothing is autosaved until the owner replaces it. */
  unreadable: LoadedSave['unreadable']
  /** The last autosave failed. */
  saveFailed: boolean
  /** Another tab (or the home-screen app) saved since this tab loaded: nothing is autosaved, so neither overwrites the other, until a reload. */
  stale: boolean
  /** The open character's results per build id, computed once per change for every component (each computing its own was slow on a phone). */
  results: Map<string, BuildResult>
}

const Ctx = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [loaded] = useState(loadSave)
  const [data, setData] = useState<SaveData>(loaded.data)
  const [unreadable, setUnreadable] = useState(loaded.unreadable)
  const [saveFailed, setSaveFailed] = useState(false)
  const [stale, setStale] = useState(false)
  useEffect(() => {
    if (unreadable || stale) return
    const saved = storeSave(data)
    // oxlint-disable-next-line react/set-state-in-effect -- the answer from the browser's storage, known only after writing
    if (saved === 'changed') setStale(true)
    // oxlint-disable-next-line react/set-state-in-effect -- same
    else setSaveFailed(saved === 'failed')
  }, [data, unreadable, stale])
  const hasData = Object.keys(data.characters).length > 0
  useEffect(() => { if (hasData) askToKeepData() }, [hasData])
  useEffect(() => {
    // Another tab's save fires a storage event here; a tab the phone froze in the background finds it when it's shown again
    const check = () => { if (changedElsewhere()) setStale(true) }
    window.addEventListener('storage', check)
    document.addEventListener('visibilitychange', check)
    return () => {
      window.removeEventListener('storage', check)
      document.removeEventListener('visibilitychange', check)
    }
  }, [])
  const update = useCallback((recipe: (d: SaveData) => void) => setData((d) => produce(d, recipe)), [])
  const replace = useCallback((d: SaveData) => {
    setUnreadable(undefined)
    setData(d)
  }, [])
  // Every character's saves: teammates linked to their saved builds deal damage with them
  const results = useMemo(() => {
    const name = data.activeCharacter
    const cs = data.characters[name]
    const m = new Map<string, BuildResult>()
    if (cs) for (const b of cs.builds) m.set(b.id, computeBuild(PRESETS, name, cs, b, data.settings, data.characters, activeFight(data)))
    return m
  }, [data])
  const store = useMemo(() => ({ data, update, replace, unreadable, saveFailed, stale, results }),
    [data, update, replace, unreadable, saveFailed, stale, results])
  return <Ctx.Provider value={store}>{children}</Ctx.Provider>
}

export function useStore(): Store {
  const s = useContext(Ctx)
  if (!s) throw new Error('useStore outside StoreProvider')
  return s
}

/** Open a character's "sheet", creating it the first time. */
export function selectCharacter(d: SaveData, name: string) {
  d.activeCharacter = name
  if (name && !d.characters[name]) d.characters[name] = newCharacterSave()
}

export interface CharacterCtx {
  name: string
  cs: CharacterSave
  build: Build
  results: Map<string, BuildResult>
  updateCs: (recipe: (cs: CharacterSave) => void) => void
  updateBuild: (recipe: (b: Build) => void) => void
}

/** The saved build a teammate slot of the open build is linked to (engine/team.ts), if any. */
export function useLinked(t: Pick<Teammate, 'character' | 'build'> | undefined): Linked | undefined {
  const { data } = useStore()
  return linkedBuild(data.characters, t)
}

/** The open character, its active build, and every build's results. Null until a character is picked. */
export function useCharacter(): CharacterCtx | null {
  const { data, update, results } = useStore()
  const name = data.activeCharacter
  const cs = data.characters[name]
  const updateCs = useCallback((recipe: (cs: CharacterSave) => void) => update((d) => recipe(d.characters[name])), [update, name])
  const buildId = cs?.activeBuild
  const updateBuild = useCallback((recipe: (b: Build) => void) => update((d) => {
    const b = d.characters[name].builds.find((x) => x.id === buildId)
    if (b) recipe(b)
  }), [update, name, buildId])
  if (!cs) return null
  const build = cs.builds.find((b) => b.id === cs.activeBuild) ?? cs.builds[0]
  return { name, cs, build, results, updateCs, updateBuild }
}
