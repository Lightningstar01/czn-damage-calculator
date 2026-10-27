// Settings: formula constants and rules, backup export/import, reset.
import { useRef, useState } from 'react'
import { DEFAULT_SETTINGS, SETTING_INFO } from '../data/settings'
import type { MultMode } from '../engine/types'
import { defaultSave, downloadBackup, migrate } from '../store/save'
import { useStore } from '../store/store'
import { NumberField, Section, SelectField } from './inputs'

export function SettingsTab() {
  const { data, update, replace } = useStore()
  const file = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState('')
  return (
    <>
      <Section title="Rules" help="Change a rule here if your in-game tests disagree. Every character updates.">
        <SelectField<MultMode> label="Multiplicative (no '+') buffs combine" value={data.settings.multMode}
          options={[{ value: 'Summed', label: 'Summed: 1 + a + b' }, { value: 'Chained', label: 'Chained: (1 + a) × (1 + b)' }]}
          help="Summed is your belief (UltimateGacha cites Reddit testing)."
          onChange={(v) => update((d) => { d.settings.multMode = v })} />
        <div className="grid2">
          {SETTING_INFO.map((s) => (
            <NumberField key={s.key} label={s.label} help={s.note} pct={s.pct} value={data.settings[s.key] as number}
              onChange={(v) => update((d) => { (d.settings[s.key] as number) = v })} />
          ))}
        </div>
        <label className="check">
          <input type="checkbox" checked={data.settings.potentialFixed}
            onChange={(e) => update((d) => { d.settings.potentialFixed = e.target.checked })} />
          Card upgrade potentials also raise Fixed damage (Unconfirmed: test in-game)
        </label>
        <button className="btn" onClick={() => update((d) => { d.settings = { ...DEFAULT_SETTINGS } })}>Reset rules to defaults</button>
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
      <Section title="Reset">
        <button className="btn danger" onClick={() => {
          if (confirm('Delete ALL characters, builds and cards from this browser? Export a backup first if you want to keep them.')) replace(defaultSave())
        }}>Delete all data</button>
      </Section>
    </>
  )
}
