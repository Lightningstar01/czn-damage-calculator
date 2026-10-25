// Buffs: Morale / Vulnerable / Weakness debuff stacks, preset buffs, and the owner's own buffs.
import { useState } from 'react'
import { buffType } from '../engine/buffs'
import { CATEGORIES, type BuffType, type Condition, type HitScope } from '../engine/types'
import { newBuff } from '../store/save'
import { useCharacter, useStore } from '../store/store'
import { pct } from './format'
import { Help, NumberField, Section, SelectField, Stepper, SwitchControl, TextField } from './inputs'
import { PresetList } from './PresetList'

export function BuffsTab() {
  return (
    <>
      <StacksSection />
      <Section title="Buffs from presets" help="The character's and partner's buffs. Class-limited partner buffs only work when the partner's class matches the character's.">
        <PresetList kind="Buff" />
      </Section>
      <MyBuffsSection />
    </>
  )
}

function StacksSection() {
  const { data: { settings } } = useStore()
  const { build, updateBuild } = useCharacter()!
  const rows: { key: 'morale' | 'vulnerable' | 'weaknessDebuff'; label: string; help: string; max?: number }[] = [
    { key: 'morale', label: 'Morale', max: settings.moraleMax, help: `+${pct(settings.moralePerStack, 0)} additive per stack on every card, max ${settings.moraleMax} stacks.` },
    { key: 'vulnerable', label: 'Vulnerable (on target)', help: `Damage ×${1 + settings.vulnerable} on the first N hits of the rotation; one stack is used up per hit.` },
    { key: 'weaknessDebuff', label: 'Weakness debuff (on you)', help: `Damage ×${1 - settings.weaknessDebuff} on the first N hits of the rotation; one stack is used up per hit.` },
  ]
  return (
    <Section title="Stacks">
      <ul className="rows">
        {rows.map((r) => (
          <li key={r.key} className="row">
            <div className="row-main"><div className="row-title">{r.label}<Help text={r.help} /></div></div>
            <Stepper label={r.label} value={build[r.key]} max={r.max} onChange={(v) => updateBuild((b) => { b[r.key] = v })} />
          </li>
        ))}
      </ul>
    </Section>
  )
}

function MyBuffsSection() {
  const { cs, build, updateCs } = useCharacter()!
  const [open, setOpen] = useState<string | null>(null)
  const targets = ['ALL', ...new Set(cs.cards.flatMap((c) => [c.name, ...c.tags.split(',').map((t) => t.trim())]).values())].filter(Boolean)
  return (
    <Section title="My buffs" help="Buffs from memory fragments, equipment, other characters, etc. Type the text as shown in-game: '+30%' is additive, '30%' (no +) is multiplicative, 'Weakness Attack' makes Weakness DMG apply."
      actions={<button className="btn small" onClick={() => {
        const b = newBuff(build.id)
        updateCs((c) => { c.buffs.push(b) })
        setOpen(b.id)
      }}>+ Add</button>}>
      {!cs.buffs.length && <p className="muted">None yet.</p>}
      <ul className="rows">
        {cs.buffs.map((x, i) => {
          const upd = (fn: (b: typeof x) => void) => updateCs((c) => fn(c.buffs[i]))
          const type = buffType(x.value, x.typeOverride)
          return (
            <li key={x.id} className="row col">
              <div className="row-line">
                <button className="row-main link" onClick={() => setOpen(open === x.id ? null : x.id)} aria-expanded={open === x.id}>
                  <div className="row-title">{x.source || 'Unnamed buff'}</div>
                  <div className="row-sub">
                    <span className={`type-${type.split(' ')[0].toLowerCase()}`}>{x.value || '—'} {type}</span>
                    {' · '}{x.appliesTo || '(applies to nothing)'}
                    {x.hitScope === 'First hit only' && ' · first hit'}{x.condition === 'Ravaged only' && ' · Ravaged only'}
                  </div>
                </button>
                <SwitchControl label={x.source || 'buff'} value={x.switches[build.id]} maxStacks={x.maxStacks}
                  onChange={(sw) => upd((b) => { b.switches[build.id] = sw })} />
              </div>
              {open === x.id && (
                <div className="editor grid2">
                  <TextField label="Source" value={x.source} placeholder="e.g. Seth's Scarab" onChange={(s) => upd((b) => { b.source = s })} />
                  <TextField label="Buff text" value={x.value} placeholder="+30% or 30%" onChange={(s) => upd((b) => { b.value = s })} />
                  <SelectField<BuffType | ''> label="Type" value={x.typeOverride}
                    options={[{ value: '', label: `Auto (${buffType(x.value)})` }, 'Additive', 'Multiplicative', 'Weakness Attack']}
                    onChange={(s) => upd((b) => { b.typeOverride = s })} />
                  <TextField label="Applies to" value={x.appliesTo} list={targets} help="ALL, a card name, or one card tag."
                    onChange={(s) => upd((b) => { b.appliesTo = s })} />
                  <SelectField<HitScope> label="Hit scope" value={x.hitScope} options={['All hits', 'First hit only']} onChange={(s) => upd((b) => { b.hitScope = s })} />
                  <SelectField<Condition> label="Condition" value={x.condition} options={['Always', 'Ravaged only']} onChange={(s) => upd((b) => { b.condition = s })} />
                  <NumberField label="Max stacks" value={x.maxStacks ?? 0} min={0} help="0 = no limit. Above 1, the switch gets a stack counter."
                    onChange={(v) => upd((b) => { b.maxStacks = v > 0 ? Math.floor(v) : null })} />
                  <SelectField label="Category" value={x.category} options={CATEGORIES} onChange={(s) => upd((b) => { b.category = s })} />
                  <TextField label="Notes" value={x.notes} onChange={(s) => upd((b) => { b.notes = s })} />
                  <div className="btn-row">
                    <button className="btn danger" onClick={() => updateCs((c) => { c.buffs.splice(i, 1) })}>Delete</button>
                  </div>
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </Section>
  )
}
