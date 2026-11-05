// Small form controls, sized for phones.
import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { readNumber } from '../engine/buffs'
import type { Switch } from '../engine/types'

function fmtNumber(v: number, pct: boolean): string {
  if (!Number.isFinite(v)) return ''
  const n = pct ? v * 100 : v
  return String(Number(n.toFixed(6)))
}

/** Number box with the phone number pad. pct: type "45.3" for 45.3% (stored as 0.453). Thousands commas are fine ("1,272"); a box
 * left empty or unreadable keeps the last good value and shows it again on leaving (an empty DEF multiplier made every hit 0). */
export function NumberField({ label, value, onChange, pct = false, help, min, max, suffix }: {
  label?: ReactNode; value: number; onChange: (v: number) => void; pct?: boolean; help?: string; min?: number; max?: number; suffix?: string
}) {
  const id = useId()
  const [text, setText] = useState(() => fmtNumber(value, pct))
  // follow outside changes (e.g. switching build) without fighting the user's typing
  const [seen, setSeen] = useState(value)
  if (seen !== value) {
    setSeen(value)
    const parsed = readNumber(text)
    if (parsed === undefined || Math.abs((pct ? parsed / 100 : parsed) - value) > 1e-9) setText(fmtNumber(value, pct))
  }
  const typed = readNumber(text)
  return (
    <label className="field" htmlFor={id}>
      {label && <span className="field-label">{label}{help && <Help text={help} />}</span>}
      <span className="field-box">
        <input
          id={id} type="text" inputMode="decimal" value={text} aria-invalid={text.trim() !== '' && typed === undefined}
          onChange={(e) => {
            setText(e.target.value)
            const n = readNumber(e.target.value)
            if (n !== undefined) onChange(Math.min(max ?? Infinity, Math.max(min ?? -Infinity, pct ? n / 100 : n)))
          }}
          onFocus={(e) => e.target.select()}
          onBlur={() => setText(fmtNumber(value, pct))}
        />
        {(pct || suffix) && <span className="unit">{pct ? '%' : suffix}</span>}
      </span>
    </label>
  )
}

/** invalid: the text can't be read (red border). */
export function TextField({ label, value, onChange, placeholder, help, list, invalid }: {
  label: ReactNode; value: string; onChange: (v: string) => void; placeholder?: string; help?: string; list?: string[]; invalid?: boolean
}) {
  const id = useId()
  return (
    <label className="field" htmlFor={id}>
      <span className="field-label">{label}{help && <Help text={help} />}</span>
      <input id={id} type="text" value={value} placeholder={placeholder} list={list ? `${id}-list` : undefined} aria-invalid={invalid}
        onChange={(e) => onChange(e.target.value)} />
      {list && <datalist id={`${id}-list`}>{list.map((o) => <option key={o} value={o} />)}</datalist>}
    </label>
  )
}

/** label: shown above the box; leave it out when the section title already says it (ariaLabel then names the box). */
export function SelectField<T extends string>({ label, ariaLabel, value, options, onChange, help }: {
  label?: ReactNode; ariaLabel?: string; value: T; options: readonly (T | { value: T; label: string })[]; onChange: (v: T) => void; help?: string
}) {
  const id = useId()
  return (
    <label className="field" htmlFor={id}>
      {(label || help) && <span className="field-label">{label}{help && <Help text={help} />}</span>}
      <select id={id} aria-label={ariaLabel} value={value} onChange={(e) => onChange(e.target.value as T)}>
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

/** Tap "?" to show the text; tapping anywhere else (or Escape) closes it. */
export function Help({ text }: { text: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)
  const bubble = useRef<HTMLSpanElement>(null)
  // A "?" near the right edge would push the bubble off a phone screen: slide it back in
  useLayoutEffect(() => {
    const b = bubble.current
    if (!open || !b) return
    const room = 8
    const r = b.getBoundingClientRect()
    const over = r.right - (document.documentElement.clientWidth - room)
    if (over > 0) b.style.translate = `${-Math.min(over, r.left - room)}px 0`
  }, [open])
  useEffect(() => {
    if (!open) return
    const close = (e: PointerEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('pointerdown', close)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('pointerdown', close)
      document.removeEventListener('keydown', esc)
    }
  }, [open])
  // The "?" sits in a field's label: a tap on the bubble mustn't reach the label, which would focus the box and open the keyboard
  return (
    <span className="help" ref={ref} onClick={(e) => e.preventDefault()}>
      <button type="button" className="help-btn" aria-label="Help" aria-expanded={open} onClick={() => setOpen(!open)}>?</button>
      {open && <span className="help-text" role="note" ref={bubble}>{text}</span>}
    </span>
  )
}

/** A popup over the page; tapping outside it (or Escape) closes it. */
export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', esc)
    return () => document.removeEventListener('keydown', esc)
  }, [onClose])
  return (
    <div className="sheet-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title}>
        <header className="sheet-head">
          <h2>{title}</h2>
          <button type="button" className="icon-btn" aria-label="Close" onClick={onClose}>×</button>
        </header>
        {children}
      </div>
    </div>
  )
}

export function Section({ title, children, actions, help, className = '' }: {
  title: string; children: ReactNode; actions?: ReactNode; help?: string; className?: string
}) {
  return (
    <section className={`section ${className}`}>
      <header className="section-head">
        <h2>{title}{help && <Help text={help} />}</h2>
        {actions}
      </header>
      {children}
    </section>
  )
}
