import { useEffect, useState } from 'react'
import { PRESETS } from './data/presets'
import { selectCharacter, useCharacter, useStore } from './store/store'
import { BuffsTab } from './ui/BuffsTab'
import { CardsTab } from './ui/CardsTab'
import { Header } from './ui/Header'
import { ResultsTab } from './ui/ResultsTab'
import { SettingsTab } from './ui/SettingsTab'
import { SetupTab } from './ui/SetupTab'

const TABS = [
  { id: 'setup', label: 'Setup', icon: '⚙︎' },
  { id: 'buffs', label: 'Buffs', icon: '▲' },
  { id: 'cards', label: 'Cards', icon: '▤' },
  { id: 'results', label: 'Results', icon: '∑' },
  { id: 'settings', label: 'Settings', icon: '☰' },
] as const
type TabId = (typeof TABS)[number]['id']

/** Wide screens show Results beside the other tabs instead of as a tab. */
function useWide() {
  const q = '(min-width: 1000px)'
  const [wide, setWide] = useState(() => window.matchMedia(q).matches)
  useEffect(() => {
    const m = window.matchMedia(q)
    const on = () => setWide(m.matches)
    m.addEventListener('change', on)
    return () => m.removeEventListener('change', on)
  }, [])
  return wide
}

export default function App() {
  const [tab, setTab] = useState<TabId>('setup')
  const ch = useCharacter()
  const wide = useWide()
  const shown = wide && tab === 'results' ? 'setup' : tab
  const needsCharacter = shown !== 'settings' && !ch
  // Phone: tab bar at the bottom (thumb reach); wide screens: under the header
  const tabbar = (
    <nav className={`tabbar ${wide ? 'top' : ''}`}>
      {TABS.filter((t) => !(wide && t.id === 'results')).map((t) => (
        <button key={t.id} className={shown === t.id ? 'active' : ''} aria-current={shown === t.id ? 'page' : undefined} onClick={() => setTab(t.id)}>
          <span className="tab-icon" aria-hidden>{t.icon}</span>
          {t.label}
        </button>
      ))}
    </nav>
  )
  return (
    <div className={`app ${wide ? 'wide' : ''}`}>
      <Header>{wide && tabbar}</Header>
      <main className="content">
        <div className="pane">
          {needsCharacter ? <Welcome /> : (
            <>
              {shown === 'setup' && <SetupTab />}
              {shown === 'buffs' && <BuffsTab />}
              {shown === 'cards' && <CardsTab />}
              {shown === 'results' && <ResultsTab />}
              {shown === 'settings' && <SettingsTab />}
            </>
          )}
        </div>
        {wide && ch && <div className="pane results-pane"><ResultsTab /></div>}
      </main>
      {!wide && tabbar}
    </div>
  )
}

function Welcome() {
  const { update } = useStore()
  return (
    <section className="section welcome">
      <h2>CZN Damage Calculator</h2>
      <p>Pick a character to start. Each character keeps its own builds (with their team and attack list) and cards.</p>
      <div className="btn-row">
        {PRESETS.characters.map((c) => (
          <button key={c.name} className="btn" onClick={() => update((d) => selectCharacter(d, c.name))}>{c.name}</button>
        ))}
      </div>
    </section>
  )
}
