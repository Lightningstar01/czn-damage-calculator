// App state: the save data in a React context, autosaved to the browser on every change.
import { produce } from 'immer'
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { PRESETS } from '../data/presets'
import { computeBuild, type BuildResult } from '../engine/calc'
import { linkedBuild, type Linked } from '../engine/team'
import type { Build, CharacterSave, SaveData, Teammate } from '../engine/types'
import { activeFight, newCharacterSave } from './save'
import { loadSave, storeSave, type LoadedSave } from './storage'

interface Store {
  data: SaveData
  update: (recipe: (d: SaveData) => void) => void
  /** Replaces everything, also a stored save that couldn't be opened. */
  replace: (d: SaveData) => void
  /** The stored save couldn't be opened: nothing is autosaved until the owner replaces it. */
  unreadable: LoadedSave['unreadable']
  /** The last autosave failed. */
  saveFailed: boolean
}

const Ctx = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [loaded] = useState(loadSave)
  const [data, setData] = useState<SaveData>(loaded.data)
  const [unreadable, setUnreadable] = useState(loaded.unreadable)
  const [saveFailed, setSaveFailed] = useState(false)
  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- the answer from the browser's storage, known only after writing
    if (!unreadable) setSaveFailed(!storeSave(data))
  }, [data, unreadable])
  const update = useCallback((recipe: (d: SaveData) => void) => setData((d) => produce(d, recipe)), [])
  const replace = useCallback((d: SaveData) => {
    setUnreadable(undefined)
    setData(d)
  }, [])
  const store = useMemo(() => ({ data, update, replace, unreadable, saveFailed }), [data, update, replace, unreadable, saveFailed])
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
export function useLinked(t: Teammate | undefined): Linked | undefined {
  const { data } = useStore()
  return linkedBuild(data.characters, t)
}

/** The open character, its active build, and every build's results. Null until a character is picked. */
export function useCharacter(): CharacterCtx | null {
  const { data, update } = useStore()
  const name = data.activeCharacter
  const cs = data.characters[name]
  const fight = activeFight(data)
  // Every character's saves: teammates linked to their saved builds deal damage with them
  const results = useMemo(() => {
    const m = new Map<string, BuildResult>()
    if (cs) for (const b of cs.builds) m.set(b.id, computeBuild(PRESETS, name, cs, b, data.settings, data.characters, fight))
    return m
  }, [cs, name, data.settings, data.characters, fight])
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
