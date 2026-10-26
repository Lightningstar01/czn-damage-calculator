// Setup: build management, partner, Manifest Ego level, memory fragment sets, stats-screen values, stat boosts, enemy.
import { useState } from 'react'
import { PRESETS } from '../data/presets'
import { findCharacter, findFragmentSet, findPartner, fragmentPiecesUsed, parseStatValue } from '../engine/buffs'
import { CATEGORIES, FRAGMENT_SET_PICKS, MAX_EGO_LEVEL, FRAGMENT_SLOTS, STATS, type ScreenStats, type StatName } from '../engine/types'
import { duplicateBuild, newBoost } from '../store/save'
import { useCharacter } from '../store/store'
import { pct } from './format'
import { NumberField, Section, SelectField, SwitchControl, TextField } from './inputs'
import { PresetList } from './PresetList'

export function SetupTab() {
  return (
    <>
      <BuildSection />
      <PartnerSection />
      <EgoSection />
      <FragmentSection />
      <StatsSection />
      <Section title="Stat boosts from presets" help="The character's, partner's and memory fragment sets' stat effects. Switch them off per build to test without them. Fragment set stats are already on the stats screen, so they are listed for reference only.">
        <PresetList kind="Stat" />
      </Section>
      <BoostsSection />
      <EnemySection />
    </>
  )
}

function BuildSection() {
  const { cs, build, updateCs, updateBuild } = useCharacter()!
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  return (
    <Section title="Build">
      <div className="grid2">
        <TextField label="Build name" value={build.name} onChange={(v) => updateBuild((b) => { b.name = v })} />
      </div>
      <div className="btn-row">
        <button className="btn" onClick={() => updateCs((c) => {
          const src = c.builds.find((b) => b.id === c.activeBuild)!
          const copy = duplicateBuild(c, src, `Build ${letters[c.builds.length] ?? c.builds.length + 1}`)
          c.builds.push(copy)
          c.activeBuild = copy.id
        })}>Duplicate</button>
        {cs.builds.length > 1 && (
          <button className="btn danger" onClick={() => {
            if (!confirm(`Delete ${build.name}?`)) return
            updateCs((c) => {
              c.builds = c.builds.filter((b) => b.id !== build.id)
              for (const row of [...c.boosts, ...c.buffs]) delete row.switches[build.id]
              c.activeBuild = c.builds[0].id
            })
          }}>Delete</button>
        )}
      </div>
      <p className="muted">Builds share the card list and rotation. Duplicate a build, then change one thing to compare.</p>
    </Section>
  )
}

/** Manifest Ego (dupes) level per build: unlocks the character's ego effects; the levels' text for reference. */
function EgoSection() {
  const { name, build, updateBuild } = useCharacter()!
  const ch = findCharacter(PRESETS, name)
  if (!ch?.manifestEgo?.length) return null
  const level = build.egoLevel ?? 0
  return (
    <Section title="Manifest Ego" help="The character's dupe level for this build. Effects of higher levels are off. Set another build to a different level to see what a dupe adds.">
      <SelectField label="Level" value={String(level)}
        options={Array.from({ length: MAX_EGO_LEVEL + 1 }, (_, i) => ({
          value: String(i), label: i === 0 ? 'E0 (none)' : `E${i} ${ch.manifestEgo!.find((m) => m.level === i)?.name ?? ''}`,
        }))}
        onChange={(v) => updateBuild((b) => { b.egoLevel = Number(v) })} />
      <ul className="rows">
        {ch.manifestEgo.map((m) => (
          <li key={m.level} className={`row ${m.level <= level ? '' : 'off'}`}>
            <div className="row-main">
              <div className="row-title">E{m.level} {m.name}</div>
              <div className="row-sub pre-line">{m.text}</div>
            </div>
          </li>
        ))}
      </ul>
    </Section>
  )
}

function PartnerSection() {
  const { name, cs, build, updateCs, updateBuild } = useCharacter()!
  const ch = findCharacter(PRESETS, name)
  const partners = PRESETS.partners.filter((p) => cs.showAllPartners || !ch || p.class === ch.class)
    .sort((a, b) => a.class.localeCompare(b.class) || a.name.localeCompare(b.name))
  const p = findPartner(PRESETS, build.partner)
  return (
    <Section title="Partner">
      <SelectField label="Partner" value={build.partner}
        options={[{ value: '', label: 'None' }, ...partners.map((x) => ({ value: x.name, label: cs.showAllPartners ? `${x.name} (${x.class})` : x.name })),
          ...(p && !partners.includes(p) ? [{ value: p.name, label: `${p.name} (${p.class})` }] : [])]}
        onChange={(v) => updateBuild((b) => { b.partner = v })} />
      <label className="check">
        <input type="checkbox" checked={cs.showAllPartners} onChange={(e) => updateCs((c) => { c.showAllPartners = e.target.checked })} />
        Show partners of every class
      </label>
      {p && (
        <p className="muted">
          {p.class} · base HP {p.baseHp} / DEF {p.baseDef} / ATK {p.baseAtk} (already in the stats screen)
          {ch && p.class !== ch.class && <span className="warn"> · Class mismatch: class-limited effects are off</span>}
        </p>
      )}
    </Section>
  )
}

function FragmentSection() {
  const { build, updateBuild } = useCharacter()!
  const picks = Array.from({ length: FRAGMENT_SET_PICKS }, (_, i) => build.fragments?.[i] ?? '')
  const used = fragmentPiecesUsed(PRESETS, build)
  const dupe = picks.find((n, i) => n && picks.indexOf(n) !== i)
  const sets = [...PRESETS.fragmentSets].sort((a, b) => a.pieces - b.pieces || a.name.localeCompare(b.name))
  const options = [{ value: '', label: 'None' }, ...sets.map((f) => ({ value: f.name, label: `${f.name} (${f.pieces}-piece)` }))]
  return (
    <Section title="Memory fragment sets" help={`${FRAGMENT_SLOTS} fragment slots: three 2-piece sets, or one 4-piece and one 2-piece set. Set effects appear in the stat and buff lists with a switch per build.`}>
      {!sets.length && <p className="muted">No fragment sets in the presets yet.</p>}
      <div className="grid2">
        {picks.map((v, i) => (
          <SelectField key={i} label={`Set ${i + 1}`} value={v}
            options={[...options, ...(v && !findFragmentSet(PRESETS, v) ? [{ value: v, label: `${v} (not in presets)` }] : [])]}
            onChange={(name) => updateBuild((b) => {
              b.fragments = [...picks]
              b.fragments[i] = name
            })} />
        ))}
      </div>
      <p className="muted">
        Pieces used: {used} / {FRAGMENT_SLOTS}
        {used > FRAGMENT_SLOTS && <span className="warn"> · Too many pieces for {FRAGMENT_SLOTS} slots</span>}
        {dupe && <span className="warn"> · {dupe} is picked twice (its effects count once)</span>}
      </p>
      {picks.map((n) => findFragmentSet(PRESETS, n)).filter((f, i, all) => f?.notes && all.indexOf(f) === i)
        .map((f) => <p key={f!.name} className="muted">{f!.name}: {f!.notes}</p>)}
    </Section>
  )
}

function StatsSection() {
  const { name, build, updateBuild } = useCharacter()!
  const el = findCharacter(PRESETS, name)?.element
  const set = (k: Exclude<keyof ScreenStats, 'elemDmg'>) => (v: number) => updateBuild((b) => { b.stats[k] = v })
  const s = build.stats
  return (
    <Section title="Stats screen" help="Copy these from the character's detailed stats screen in-game, with this build's partner and memory fragments equipped. They include partner base stats and fragments, but not partner effects or equipment.">
      <div className="grid2">
        <NumberField label="Attack" value={s.attack} onChange={set('attack')} />
        <NumberField label="Defense" value={s.defense} onChange={set('defense')} />
        <NumberField label="Crit Chance" pct value={s.critChance} onChange={set('critChance')} />
        <NumberField label="Crit DMG" pct value={s.critDmg} onChange={set('critDmg')} help="Total multiplier: 188.6% means crit hits deal ×1.886." />
        <NumberField label="Weakness DMG" pct value={s.weaknessDmg} onChange={set('weaknessDmg')} help="Multiplier vs targets weak to your element; base 125%." />
        {el && <NumberField label={`${el} DMG`} pct value={s.elemDmg[el]} onChange={(v) => updateBuild((b) => { b.stats.elemDmg[el] = v })} />}
        <NumberField label="Extra DMG" pct value={s.extraDmg} onChange={set('extraDmg')} help="Applies to Extra Attack cards." />
        <NumberField label="Damage over time" pct value={s.dotDmg} onChange={set('dotDmg')} help="Applies to DoT cards." />
        <NumberField label="Health" value={s.health} onChange={set('health')} help="Not used in damage yet." />
      </div>
    </Section>
  )
}

function BoostsSection() {
  const { cs, build, updateCs } = useCharacter()!
  const [open, setOpen] = useState<string | null>(null)
  return (
    <Section title="My stat boosts" help="Equipment and other stat boosts that aren't on the stats screen. Each one is shared by all builds, with an on/off switch per build. ATK%/DEF% multiply the stats-screen value; flat ATK/DEF is added after."
      actions={<button className="btn small" onClick={() => {
        const b = newBoost(build.id)
        updateCs((c) => { c.boosts.push(b) })
        setOpen(b.id)
      }}>+ Add</button>}>
      {!cs.boosts.length && <p className="muted">None yet. Equipment slot 1 always gives flat ATK.</p>}
      <ul className="rows">
        {cs.boosts.map((x, i) => {
          const upd = (fn: (b: typeof x) => void) => updateCs((c) => fn(c.boosts[i]))
          const v = parseStatValue(x.value)
          return (
            <li key={x.id} className="row col">
              <div className="row-line">
                <button className="row-main link" onClick={() => setOpen(open === x.id ? null : x.id)} aria-expanded={open === x.id}>
                  <div className="row-title">{x.source || 'Unnamed boost'}</div>
                  <div className="row-sub">{x.stat} {x.value.includes('%') ? pct(v) : x.value || '—'} · {x.category}</div>
                </button>
                <SwitchControl label={x.source || 'boost'} value={x.switches[build.id]} onChange={(sw) => upd((b) => { b.switches[build.id] = sw })} />
              </div>
              {open === x.id && (
                <div className="editor grid2">
                  <TextField label="Source" value={x.source} placeholder="e.g. Obsidian Sword" onChange={(s) => upd((b) => { b.source = s })} />
                  <SelectField<StatName> label="Stat" value={x.stat} options={STATS} onChange={(s) => upd((b) => { b.stat = s })} />
                  <TextField label="Value" value={x.value} placeholder="16% or 74" help="Percent stats with %, flat values without." onChange={(s) => upd((b) => { b.value = s })} />
                  <SelectField label="Category" value={x.category} options={CATEGORIES} onChange={(s) => upd((b) => { b.category = s })} />
                  <TextField label="Notes" value={x.notes} onChange={(s) => upd((b) => { b.notes = s })} />
                  <div className="btn-row">
                    <button className="btn danger" onClick={() => updateCs((c) => { c.boosts.splice(i, 1) })}>Delete</button>
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

function EnemySection() {
  const { build, updateBuild } = useCharacter()!
  return (
    <Section title="Enemy">
      <div className="grid2">
        <NumberField label="DEF multiplier" value={build.enemyDefMult} onChange={(v) => updateBuild((b) => { b.enemyDefMult = v })}
          help="1 = none. No known formula yet; back-solve it from an in-game hit (Mei Lin test: about 0.387)." />
        <NumberField label="Damage reduction" pct value={build.enemyDr} onChange={(v) => updateBuild((b) => { b.enemyDr = v })} />
      </div>
    </Section>
  )
}
