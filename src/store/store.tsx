// App state: the save data in a React context, autosaved to the browser on every change.
import { produce } from 'immer'
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { PRESETS } from '../data/presets'
import { computeBuild, type BuildResult } from '../engine/calc'
import type { Build, CharacterSave, SaveData } from '../engine/types'
import { loadSave, newCharacterSave, storeSave } from './save'

interface Store {
  data: SaveData
  update: (recipe: (d: SaveData) => void) => void
  replace: (d: SaveData) => void
}

const Ctx = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<SaveData>(loadSave)
  useEffect(() => storeSave(data), [data])
  const update = useCallback((recipe: (d: SaveData) => void) => setData((d) => produce(d, recipe)), [])
  const store = useMemo(() => ({ data, update, replace: setData }), [data, update])
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

/** The open character, its active build, and every build's results. Null until a character is picked. */
export function useCharacter(): CharacterCtx | null {
  const { data, update } = useStore()
  const name = data.activeCharacter
  const cs = data.characters[name]
  const results = useMemo(() => {
    const m = new Map<string, BuildResult>()
    if (cs) for (const b of cs.builds) m.set(b.id, computeBuild(PRESETS, name, cs, b, data.settings))
    return m
  }, [cs, name, data.settings])
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
