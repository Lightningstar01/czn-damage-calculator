// "From" select for My stat boosts / My buffs: who gives it (e.g. a teammate's equipment). A label only.
import { FROM_OPTIONS } from '../engine/types'
import { SelectField } from './inputs'

export function FromField({ value, onChange }: { value: string | undefined; onChange: (v: string) => void }) {
  return (
    <SelectField label="From" value={value ?? ''} options={FROM_OPTIONS.map((o) => ({ value: o, label: o || 'This character' }))}
      help="Who gives it, as a reminder (e.g. a teammate's equipment). It doesn't change the math." onChange={onChange} />
  )
}
