// Buffs: Morale, preset buffs, the teammates' buffs, and the owner's own buffs.
import { useState } from 'react'
import { PRESETS } from '../data/presets'
import { buffReadable, buffType, findCharacter, hasTeam } from '../engine/buffs'
import { buildDeck } from '../engine/deck'
import { BUFF_TYPES, CATEGORIES, type BuffType, type Condition, type HitScope } from '../engine/types'
import { newBuff } from '../store/save'
import { useCharacter, useStore } from '../store/store'
import { pct } from './format'
import { Help, NumberField, Section, SelectField, Stepper, SwitchControl, TextField } from './inputs'
import { FromField } from './FromField'
import { PresetList } from './PresetList'
import { ownBuffPills, Pills } from './BuffChips'

export function BuffsTab() {
  const { build } = useCharacter()!
  return (
    <>
      <StacksSection />
      <Section title="Buffs from presets" help="The character's, partner's, memory fragment sets' and deck cards' buffs. Every buff that's on counts on every play (snapshot). Class-limited partner buffs only work when the partner's class matches the character's. Buffs with per-play stacks (Ember, Spirit of the Aromata) are on/off here: set their stacks on each play (Cards tab).">
        <PresetList kind="Buff" />
      </Section>
      {hasTeam(build) && (
        <Section title="Team buffs" help="Ally buffs and enemy debuffs from the build's teammates (Setup tab): their character, Manifest Ego, partner, fragment sets and picked cards.">
          <PresetList kind="Buff" team />
        </Section>
      )}
      <MyBuffsSection />
    </>
  )
}

function StacksSection() {
  const { data: { settings } } = useStore()
  const { build, updateBuild } = useCharacter()!
  const rows: { key: 'morale'; label: string; help: string; max?: number }[] = [
    { key: 'morale', label: 'Morale', max: settings.moraleMax, help: `+${pct(settings.moralePerStack, 0)} additive per stack on every card, max ${settings.moraleMax} stacks.` },
  ]
  return (
    <Section title="Stacks" help="Vulnerable and the Weakness debuff are switched on per play, on the Cards tab.">
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
  const { name, cs, build, updateCs } = useCharacter()!
  const [open, setOpen] = useState<string | null>(null)
  const deck = buildDeck(findCharacter(PRESETS, name), build).map((i) => i.card)
  const targets = ['ALL', ...new Set(deck.flatMap((c) => [c.name, ...c.tags.split(',').map((t) => t.trim())]))].filter(Boolean)
  return (
    <Section title="My buffs" help="Buffs from memory fragments, equipment, other characters, etc. Type the text as shown in-game: '+30%' is additive, '30%' (no +) is multiplicative, 'Weakness Attack' makes Weakness DMG apply. For crit bonuses that only some cards get, pick Crit Chance / Crit DMG as the type. Card % raises a card's base % like a potential (only on cards with a potential upgrade, entered at base %). Card + adds to a card's base % before the potential, as Potential nodes do. Base % ('+X% base Damage Amount') is added to the card % after the potential. Final ('final Damage Amount') is its own multiplier."
      actions={<button className="btn small" onClick={() => {
        const b = newBuff(build.id)
        updateCs((c) => { c.buffs.push(b) })
        setOpen(b.id)
      }}>+ Add</button>}>
      {!cs.buffs.length && <p className="muted">None yet.</p>}
      <ul className="rows">
        {cs.buffs.map((x, i) => {
          const upd = (fn: (b: typeof x) => void) => updateCs((c) => fn(c.buffs[i]))
          return (
            <li key={x.id} className="row col">
              <div className="row-line">
                <button className="row-main link" onClick={() => setOpen(open === x.id ? null : x.id)} aria-expanded={open === x.id}>
                  <div className="row-title">{x.source || 'Unnamed buff'}</div>
                  <Pills pills={ownBuffPills(x)} />
                </button>
                <SwitchControl label={x.source || 'buff'} value={x.switches[build.id]} maxStacks={x.maxStacks}
                  onChange={(sw) => upd((b) => { b.switches[build.id] = sw })} />
              </div>
              {open === x.id && (
                <div className="editor grid2">
                  <TextField label="Source" value={x.source} placeholder="e.g. Seth's Scarab" onChange={(s) => upd((b) => { b.source = s })} />
                  <TextField label="Buff text" value={x.value} placeholder="+30% or 30%" invalid={!buffReadable(x.value, x.typeOverride)}
                    onChange={(s) => upd((b) => { b.value = s })} />
                  <SelectField<BuffType | ''> label="Type" value={x.typeOverride}
                    options={[{ value: '', label: `Auto (${buffType(x.value)})` }, ...BUFF_TYPES]}
                    onChange={(s) => upd((b) => { b.typeOverride = s })} />
                  <TextField label="Applies to" value={x.appliesTo} list={targets} help="ALL, a card name, or card tags. 'A & B' = all of them, 'A/B' = any of them. Also the element, '1-cost', '2+ cost', '2+ hits', DoT, Extra Attack."
                    onChange={(s) => upd((b) => { b.appliesTo = s })} />
                  <SelectField<HitScope> label="Hit scope" value={x.hitScope} options={['All hits', 'First hit only']} onChange={(s) => upd((b) => { b.hitScope = s })} />
                  <SelectField<Condition> label="Condition" value={x.condition} options={['Always', 'Ravaged only']} onChange={(s) => upd((b) => { b.condition = s })} />
                  <NumberField label="Max stacks" value={x.maxStacks ?? 0} min={0} help="0 = no limit. Above 1, the switch gets a stack counter."
                    onChange={(v) => upd((b) => { b.maxStacks = v > 0 ? Math.floor(v) : null })} />
                  <SelectField label="Category" value={x.category} options={CATEGORIES} onChange={(s) => upd((b) => { b.category = s })} />
                  <FromField value={x.from} onChange={(s) => upd((b) => { b.from = s })} />
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
