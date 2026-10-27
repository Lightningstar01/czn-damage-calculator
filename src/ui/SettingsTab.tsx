// Settings: formula constants and rules, backup export/import, reset.
import { useRef, useState } from 'react'
import { DEFAULT_SETTINGS, SETTING_INFO } from '../data/settings'
import type { MultMode } from '../engine/types'
import { defaultSave, downloadBackup, migrate } from '../store/save'
import { useStore } from '../store/store'
import { NumberField, Section, SelectField } from './inputs'

// Unconfirmed rules, shown first; the rest are game constants (folded away)
const TO_TEST: string[] = ['extraWeakness', 'ravaged']

export function SettingsTab() {
  const { data, update, replace } = useStore()
  const file = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState('')
  const [constants, setConstants] = useState(false)
  const field = (s: (typeof SETTING_INFO)[number]) => (
    <NumberField key={s.key} label={s.label} help={s.note} pct={s.pct} value={data.settings[s.key] as number}
      onChange={(v) => update((d) => { (d.settings[s.key] as number) = v })} />
  )
  return (
    <>
      <Section title="Rules to test" help="Rules that aren't confirmed yet. Change one if your in-game tests disagree. Every character updates.">
        <SelectField<MultMode> label="Multiplicative (no '+') buffs combine" value={data.settings.multMode}
          options={[{ value: 'Summed', label: 'Summed: 1 + a + b' }, { value: 'Chained', label: 'Chained: (1 + a) × (1 + b)' }]}
          help="Summed is your belief (UltimateGacha cites Reddit testing)."
          onChange={(v) => update((d) => { d.settings.multMode = v })} />
        <div className="grid2 gap-top">{SETTING_INFO.filter((s) => TO_TEST.includes(s.key)).map(field)}</div>
        <label className="check">
          <input type="checkbox" checked={data.settings.potentialFixed}
            onChange={(e) => update((d) => { d.settings.potentialFixed = e.target.checked })} />
          Card upgrade potentials also raise Fixed damage (Unconfirmed: test in-game)
        </label>
      </Section>
      <Section title="Game constants" help="Values from guides and the game text. You rarely need to change these."
        actions={<button className="btn small" onClick={() => setConstants(!constants)} aria-expanded={constants}>{constants ? 'Hide' : 'Show'}</button>}>
        {constants ? (
          <>
            <div className="grid2">{SETTING_INFO.filter((s) => !TO_TEST.includes(s.key)).map(field)}</div>
            <div className="btn-row">
              <button className="btn" onClick={() => update((d) => { d.settings = { ...DEFAULT_SETTINGS } })}>Reset all rules to defaults</button>
            </div>
          </>
        ) : <p className="muted">ATK constant, DEF card coefficients, Vulnerable, Weakness debuff, crit cap, Morale, card upgrade per level.</p>}
      </Section>
      <Section title="Backup">
        <p className="muted">Your data is saved in this browser automatically. Clearing the browser's site data deletes it, so export a backup now and then.</p>
        <div className="btn-row">
          <button className="btn" onClick={() => downloadBackup(data)}>Export backup</button>
          <button className="btn" onClick={() => file.current?.click()}>Import backup</button>
          <input ref={file} type="file" accept=".json,application/json" hidden onChange={async (e) => {
            const f = e.target.files?.[0]
            e.target.value = ''
            if (!f) return
            try {
              const imported = migrate(JSON.parse(await f.text()))
              if (!confirm('Replace all current data with this backup?')) return
              replace(imported)
              setMsg(`Imported ${Object.keys(imported.characters).length} character(s).`)
            } catch (err) {
              setMsg(`Import failed: ${(err as Error).message}`)
            }
          }} />
        </div>
        {msg && <p className="muted">{msg}</p>}
      </Section>
      <Section title="Delete everything" className="danger-zone">
        <p className="muted">Removes every character, build and card from this browser. Export a backup first.</p>
        <button className="btn danger" onClick={() => {
          if (confirm('Delete ALL characters, builds and cards from this browser? Export a backup first if you want to keep them.')) replace(defaultSave())
        }}>Delete all data</button>
      </Section>
    </>
  )
}
