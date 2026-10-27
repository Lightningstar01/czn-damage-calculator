// Pinned top bar: character picker and the build compare bar (which is also the build switcher).
import type { ReactNode } from 'react'
import { PRESETS } from '../data/presets'
import { findCharacter } from '../engine/buffs'
import { newBuild } from '../store/save'
import { selectCharacter, useCharacter, useStore } from '../store/store'
import { num, signedPct } from './format'

/** children: the tab bar on wide screens. */
export function Header({ children }: { children?: ReactNode }) {
  const { data, update } = useStore()
  const ch = useCharacter()
  const preset = findCharacter(PRESETS, data.activeCharacter)
  return (
    <header className="topbar">
      <div className="topbar-row">
        <select className="char-select" aria-label="Character" value={data.activeCharacter}
          onChange={(e) => update((d) => selectCharacter(d, e.target.value))}>
          <option value="">Pick a character…</option>
          {PRESETS.characters.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
        </select>
        {preset && (
          <span className="char-meta">
            <span className={`el el-${preset.element.toLowerCase()}`}>{preset.element}</span>
            <span className="cls">{preset.class}</span>
          </span>
        )}
      </div>
      {ch && <CompareBar />}
      {children}
    </header>
  )
}

function CompareBar() {
  const ch = useCharacter()!
  const { cs, results, updateCs } = ch
  const base = results.get(cs.builds[0].id)?.expected ?? 0
  const best = Math.max(...cs.builds.map((b) => results.get(b.id)?.expected ?? 0))
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  return (
    <div className="compare" role="tablist" aria-label="Builds">
      {cs.builds.map((b, i) => {
        const r = results.get(b.id)
        const exp = r?.expected ?? 0
        // A build with no damage yet (no plays, or the stats screen not filled in): say why instead of 0 / -100%
        const empty = exp <= 0
        const why = !r?.plays.length ? 'no plays yet' : !b.stats.attack ? 'no stats yet' : 'no damage'
        return (
          <button key={b.id} role="tab" aria-selected={b.id === cs.activeBuild}
            className={`build-chip ${b.id === cs.activeBuild ? 'active' : ''} ${exp > 0 && exp === best && cs.builds.length > 1 ? 'best' : ''}`}
            onClick={() => updateCs((c) => { c.activeBuild = b.id })}>
            <span className="build-name">{b.name}</span>
            <span className={`build-total ${empty ? 'empty' : ''}`}>{empty ? '—' : num(exp)}</span>
            {empty ? <span className="build-diff">{why}</span>
              : i > 0 && base > 0 && <span className={`build-diff ${exp >= base ? 'up' : 'down'}`}>{signedPct(exp / base - 1)}</span>}
          </button>
        )
      })}
      <button className="build-chip add" aria-label="Add build" onClick={() => updateCs((c) => {
        const b = newBuild(`Build ${letters[c.builds.length] ?? c.builds.length + 1}`)
        c.builds.push(b)
        c.activeBuild = b.id
      })}>+</button>
    </div>
  )
}
