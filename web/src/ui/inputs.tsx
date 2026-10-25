// Small form controls, sized for phones.
import { useId, useState, type ReactNode } from 'react'
import type { Switch } from '../engine/types'

function fmtNumber(v: number, pct: boolean): string {
  if (!Number.isFinite(v)) return ''
  const n = pct ? v * 100 : v
  return String(Number(n.toFixed(6)))
}

/** Number box with the phone number pad. pct: type "45.3" for 45.3% (stored as 0.453). */
export function NumberField({ label, value, onChange, pct = false, help, min, suffix }: {
  label?: ReactNode; value: number; onChange: (v: number) => void; pct?: boolean; help?: string; min?: number; suffix?: string
}) {
  const id = useId()
  const [text, setText] = useState(() => fmtNumber(value, pct))
  // follow outside changes (e.g. switching build) without fighting the user's typing
  const [seen, setSeen] = useState(value)
  if (seen !== value) {
    setSeen(value)
    const parsed = Number(text.replace(',', '.'))
    const shown = pct ? parsed / 100 : parsed
    if (text === '' ? value !== 0 : Math.abs(shown - value) > 1e-9) setText(fmtNumber(value, pct))
  }
  return (
    <label className="field" htmlFor={id}>
      {label && <span className="field-label">{label}{help && <Help text={help} />}</span>}
      <span className="field-box">
        <input
          id={id} type="text" inputMode="decimal" value={text}
          onChange={(e) => {
            setText(e.target.value)
            const n = Number(e.target.value.replace(',', '.'))
            if (e.target.value.trim() === '') onChange(0)
            else if (Number.isFinite(n)) onChange(Math.max(min ?? -Infinity, pct ? n / 100 : n))
          }}
          onFocus={(e) => e.target.select()}
        />
        {(pct || suffix) && <span className="unit">{pct ? '%' : suffix}</span>}
      </span>
    </label>
  )
}

export function TextField({ label, value, onChange, placeholder, help, list }: {
  label: ReactNode; value: string; onChange: (v: string) => void; placeholder?: string; help?: string; list?: string[]
}) {
  const id = useId()
  return (
    <label className="field" htmlFor={id}>
      <span className="field-label">{label}{help && <Help text={help} />}</span>
      <input id={id} type="text" value={value} placeholder={placeholder} list={list ? `${id}-list` : undefined}
        onChange={(e) => onChange(e.target.value)} />
      {list && <datalist id={`${id}-list`}>{list.map((o) => <option key={o} value={o} />)}</datalist>}
    </label>
  )
}

export function SelectField<T extends string>({ label, value, options, onChange, help }: {
  label: ReactNode; value: T; options: readonly (T | { value: T; label: string })[]; onChange: (v: T) => void; help?: string
}) {
  const id = useId()
  return (
    <label className="field" htmlFor={id}>
      <span className="field-label">{label}{help && <Help text={help} />}</span>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value as T)}>
        {options.map((o) => typeof o === 'string'
          ? <option key={o} value={o}>{o}</option>
          : <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  )
}

export function Toggle({ checked, onChange, label, disabled }: {
  checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean
}) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} disabled={disabled}
      className={`toggle ${checked ? 'on' : ''}`} onClick={() => onChange(!checked)}>
      <span className="knob" />
    </button>
  )
}

export function Stepper({ value, onChange, min = 0, max, label }: {
  value: number; onChange: (v: number) => void; min?: number; max?: number; label: string
}) {
  const clamp = (v: number) => Math.max(min, max === undefined ? v : Math.min(max, v))
  return (
    <span className="stepper" aria-label={label}>
      <button type="button" aria-label={`${label} minus`} onClick={() => onChange(clamp(value - 1))} disabled={value <= min}>−</button>
      <span className="stepper-value">{value}</span>
      <button type="button" aria-label={`${label} plus`} onClick={() => onChange(clamp(value + 1))} disabled={max !== undefined && value >= max}>+</button>
    </span>
  )
}

/** On/off switch plus a stack stepper when the effect can stack. */
export function SwitchControl({ value, onChange, defaultStacks = 1, maxStacks, label, disabled }: {
  value: Switch | undefined; onChange: (v: Switch) => void; defaultStacks?: number; maxStacks?: number | null; label: string; disabled?: boolean
}) {
  const on = value === true || (typeof value === 'number' && value > 0)
  const stacks = value === true ? defaultStacks : typeof value === 'number' ? value : 0
  const stackable = (maxStacks ?? 1) > 1 || defaultStacks > 1 || (typeof value === 'number' && value > 1)
  return (
    <span className="switch-control">
      {stackable && on && !disabled && (
        <Stepper value={stacks} min={1} max={maxStacks ?? undefined} onChange={(v) => onChange(v)} label={`${label} stacks`} />
      )}
      <Toggle checked={on && !disabled} disabled={disabled} label={label} onChange={(v) => onChange(v ? true : false)} />
    </span>
  )
}

export function Help({ text }: { text: string }) {
  const [open, setOpen] = useState(false)
  return (
    <span className="help">
      <button type="button" className="help-btn" aria-label="Help" aria-expanded={open}
        onClick={(e) => { e.preventDefault(); setOpen(!open) }}>?</button>
      {open && <span className="help-text" role="note">{text}</span>}
    </span>
  )
}

export function Section({ title, children, actions, help }: { title: string; children: ReactNode; actions?: ReactNode; help?: string }) {
  return (
    <section className="section">
      <header className="section-head">
        <h2>{title}{help && <Help text={help} />}</h2>
        {actions}
      </header>
      {children}
    </section>
  )
}
