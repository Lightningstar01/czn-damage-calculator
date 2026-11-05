// Settings: formula constants and rules, backup export/import, reset.
import { useRef, useState } from 'react'
import { changedSettings, DEFAULT_SETTINGS, SETTING_INFO } from '../data/settings'
import type { MultMode, Settings } from '../engine/types'
import { migrate } from '../store/migrate'
import { defaultSave } from '../store/save'
import { downloadBackup, keepUndo, readCopy, restoreCopy, saveText } from '../store/storage'
import { useStore } from '../store/store'
import { NumberField, Section, SelectField } from './inputs'

// Unconfirmed rules, shown first; the rest are game constants (folded away)
const TO_TEST: string[] = ['extraWeakness', 'ravaged', 'fixedAtkCoef']

export function SettingsTab() {
  const { data, update, replace, unreadable } = useStore()
  // A save that couldn't be opened is kept as it is, not as the empty data shown meanwhile
  const current = () => unreadable ? unreadable.text : saveText(data)
  const copy = readCopy()
  const file = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState('')
  const [constants, setConstants] = useState(false)
  const changed = Object.keys(changedSettings(data.settings)) as (keyof Settings)[]
  const constantsChanged = changed.filter((k) => SETTING_INFO.some((s) => s.key === k && !TO_TEST.includes(k))).length
  const field = (s: (typeof SETTING_INFO)[number]) => (
    <div key={s.key}>
      <NumberField label={s.label} help={s.note} pct={s.pct} value={data.settings[s.key] as number}
        onChange={(v) => update((d) => { (d.settings[s.key] as number) = v })} />
      <ResetSetting k={s.key} />
    </div>
  )
  return (
    <>
      <Section title="Rules to test" help="Rules that aren't confirmed yet. Change one if your in-game tests disagree. Every character updates.">
        <SelectField<MultMode> label="Multiplicative (no '+') buffs combine" value={data.settings.multMode}
          options={[{ value: 'Summed', label: 'Summed: 1 + a + b' }, { value: 'Chained', label: 'Chained: (1 + a) × (1 + b)' }]}
          help="Summed: measured on Tressa's Shadow Dagger (164%; chained would show 173%)."
          onChange={(v) => update((d) => { d.settings.multMode = v })} />
        <ResetSetting k="multMode" />
        <div className="grid2 gap-top">{SETTING_INFO.filter((s) => TO_TEST.includes(s.key)).map(field)}</div>
        <label className="check">
          <input type="checkbox" checked={data.settings.potentialFixed}
            onChange={(e) => update((d) => { d.settings.potentialFixed = e.target.checked })} />
          Card upgrade potentials also raise Fixed damage (Unconfirmed: test in-game)
        </label>
        <ResetSetting k="potentialFixed" />
        <label className="check">
          <input type="checkbox" checked={data.settings.roundCardPct}
            onChange={(e) => update((d) => { d.settings.roundCardPct = e.target.checked })} />
          Round an upgraded card % to a whole % before buffs: 89.6% counts as 90% (Unconfirmed: test in-game)
        </label>
        <ResetSetting k="roundCardPct" />
      </Section>
      <Section title="Game constants" help="Values from guides and the game text. You rarely need to change these."
        actions={<button className="btn small" onClick={() => setConstants(!constants)} aria-expanded={constants}>{constants ? 'Hide' : 'Show'}</button>}>
        {constants ? (
          <>
            <div className="grid2">{SETTING_INFO.filter((s) => !TO_TEST.includes(s.key)).map(field)}</div>
            {changed.length > 0 && (
              <div className="btn-row">
                <button className="btn" onClick={() => {
                  if (confirm(`Put the ${changed.length} setting(s) you changed, here and under Rules to test, back to their defaults?`)) update((d) => { d.settings = { ...DEFAULT_SETTINGS } })
                }}>Reset all settings to defaults</button>
              </div>
            )}
          </>
        ) : <p className="muted">ATK constant, DEF card coefficients, Vulnerable, Weakness debuff, crit cap, Morale, card upgrade per level.{constantsChanged > 0 && <b> {constantsChanged} changed from the default.</b>}</p>}
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
              if (!confirm('Replace all current data with this backup? You can undo this below.') || !keepUndo(current(), 'importing a backup')) return
              replace(imported)
              setMsg(`Imported ${Object.keys(imported.characters).length} character(s).`)
            } catch (err) {
              setMsg(`Import failed: ${(err as Error).message}`)
            }
          }} />
        </div>
        {msg && <p className="muted">{msg}</p>}
        {copy && (
          <div className="gap-top">
            <p className="muted">Undo copy: your data from before {copy.reason} ({new Date(copy.at).toLocaleString()}).</p>
            <button className="btn" onClick={() => {
              if (confirm('Go back to the undo copy? What you have now becomes the undo copy, so you can switch back.')) restoreCopy()
            }}>Restore the undo copy</button>
          </div>
        )}
      </Section>
      <Section title="Delete everything" className="danger-zone">
        <p className="muted">Removes every character, build and card from this browser. You can undo it under Backup until the next import or delete.</p>
        <button className="btn danger" onClick={() => {
          if (confirm('Delete ALL characters, builds and cards from this browser?') && keepUndo(current(), 'deleting all data')) replace(defaultSave())
        }}>Delete all data</button>
      </Section>
    </>
  )
}

/** A setting that differs from its default says what the default is, with a way back to it; settings left at their default follow
 * the site's defaults when they change (owner, 2026-11-04). */
function ResetSetting({ k }: { k: keyof Settings }) {
  const { data, update } = useStore()
  const def = DEFAULT_SETTINGS[k]
  if (data.settings[k] === def) return null
  const pct = SETTING_INFO.find((s) => s.key === k)?.pct
  const shown = typeof def === 'boolean' ? (def ? 'on' : 'off') : typeof def === 'number' && pct ? `${Number((def * 100).toFixed(4))}%` : String(def)
  return (
    <button type="button" className="link small" onClick={() => update((d) => { d.settings = { ...d.settings, [k]: def } })}>
      Changed: reset to the default ({shown})
    </button>
  )
}
