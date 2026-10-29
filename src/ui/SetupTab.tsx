// Setup: build management, partner, Manifest Ego level, memory fragment sets, team, stats-screen values, stat boosts, enemy.
import { useState } from 'react'
import { PRESETS } from '../data/presets'
import { findCharacter, findFragmentSet, findPartner, fragmentPiecesUsed, hasTeam } from '../engine/buffs'
import { unlockedPotentialEgo } from '../engine/calc'
import { pruneTeamPlays } from '../engine/deck'
import { linkedBuild } from '../engine/team'
import { CATEGORIES, FRAGMENT_SET_PICKS, MAX_EGO_LEVEL, MAX_POTENTIAL_LEVEL, FRAGMENT_SLOTS, NO_BUILD, STATS, TEAM_SIZE, type ScreenStats, type StatName, type Teammate } from '../engine/types'
import { duplicateBuild, newBoost, newTeammate } from '../store/save'
import { FromField } from './FromField'
import { useCharacter, useStore } from '../store/store'
import { pct } from './format'
import { NumberField, Section, SelectField, SwitchControl, TextField, Toggle } from './inputs'
import { textNodes } from '../engine/cardText'
import { PresetList } from './PresetList'
import { Pills, statPill } from './BuffChips'

// The stats screen comes first: it's what changes most often (new gear, levels)
export function SetupTab() {
  const { build } = useCharacter()!
  return (
    <>
      <BuildSection />
      <StatsSection />
      <PartnerSection />
      <EgoSection />
      <PotentialSection />
      <FragmentSection />
      <TeamSection />
      <Section title="Stat boosts from presets" help="The character's, partner's and memory fragment sets' stat effects. Switch them off per build to test without them. Fragment set stats are already on the stats screen, so they are listed for reference only.">
        <PresetList kind="Stat" />
      </Section>
      {hasTeam(build) && (
        <Section title="Team stat boosts" help="Stat boosts the build's teammates give all allies (their character, partner, fragment sets and picked cards).">
          <PresetList kind="Stat" team />
        </Section>
      )}
      <BoostsSection />
      <EnemySection />
    </>
  )
}

function BuildSection() {
  const { cs, build, updateCs, updateBuild } = useCharacter()!
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  return (
    <Section title="Build" help="Builds share the card library; each build has its own team and attack list. Duplicate a build, then change one thing to compare.">
      <div className="inline-row">
        <TextField label="Name" value={build.name} onChange={(v) => updateBuild((b) => { b.name = v })} />
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
    </Section>
  )
}

/** Manifest Ego (dupes) level per build: unlocks the character's ego effects; the levels' text for reference. */
function EgoSection() {
  const { name, build, updateBuild } = useCharacter()!
  const ch = findCharacter(PRESETS, name)
  const [all, setAll] = useState(false)
  if (!ch?.manifestEgo?.length) return null
  const level = build.egoLevel ?? 0
  // The unlocked levels and the next one; the rest behind "Show all"
  const shownLevels = all ? ch.manifestEgo : ch.manifestEgo.filter((m) => m.level <= level + 1)
  const hidden = ch.manifestEgo.length - shownLevels.length
  return (
    <Section title="Manifest Ego" help="The character's dupe level for this build. Effects of higher levels are hidden and off. Set another build to a different level to see what a dupe adds.">
      <SelectField label="Level" value={String(level)}
        options={Array.from({ length: MAX_EGO_LEVEL + 1 }, (_, i) => ({
          value: String(i), label: i === 0 ? 'E0 (none)' : `E${i} ${ch.manifestEgo!.find((m) => m.level === i)?.name ?? ''}`,
        }))}
        onChange={(v) => updateBuild((b) => { b.egoLevel = Number(v) })} />
      <ul className="rows">
        {shownLevels.map((m) => (
          <li key={m.level} className={`row ${m.level <= level ? '' : 'off'}`}>
            <div className="row-main">
              <div className="row-title">E{m.level} {m.name}{m.level > level && <span className="tag">next</span>}</div>
              <div className="row-sub pre-line">{m.text}</div>
            </div>
          </li>
        ))}
      </ul>
      {(hidden > 0 || all) && (
        <button className="link small" onClick={() => setAll(!all)} aria-expanded={all}>
          {all ? 'Show fewer levels' : `Show all ${ch.manifestEgo.length} levels`}
        </button>
      )}
    </Section>
  )
}

/** Basic / Signature Card Upgrade potential levels per build (Manifest Ego can add levels). */
function PotentialSection() {
  const { name, build, updateBuild } = useCharacter()!
  const { data } = useStore()
  const ch = findCharacter(PRESETS, name)
  const egoLevels = unlockedPotentialEgo(ch, build).reduce((n, e) => n + e.levels, 0)
  const per = data.settings.potentialPerLevel
  const levels = Array.from({ length: MAX_POTENTIAL_LEVEL + 1 }, (_, i) => ({ value: String(i), label: `${i} (+${pct(i * per, 0)})` }))
  const field = (label: string, key: 'basicLevel' | 'signatureLevel') => {
    const set = build[key] ?? 0
    return (
      <SelectField label={label} value={String(set)} options={levels}
        help={egoLevels ? `Manifest Ego adds ${egoLevels} levels: total ${set + egoLevels} (+${pct((set + egoLevels) * per, 0)}).` : undefined}
        onChange={(v) => updateBuild((b) => { b[key] = Number(v) })} />
    )
  }
  return (
    <Section title="Potentials" help="Card upgrade levels from the Potential screen: each level raises the card's base damage by 2%. Basic Card Upgrade: Basic cards. Signature Card Upgrade (Prydwen: Unique Card Upgrade): the character's other cards, generated ones too; not Ego skills. Other potentials are in the stats screen.">
      <div className="grid2">
        {field('Basic Card Upgrade', 'basicLevel')}
        {field('Signature Card Upgrade', 'signatureLevel')}
      </div>
      {ch?.potentialEgo?.map((e) => (
        <p key={e.level} className="muted">E{e.level} adds {e.levels} levels to both{(build.egoLevel ?? 0) >= e.level ? ' (on for this build)' : ''}.</p>
      ))}
      <PotentialNodes />
    </Section>
  )
}

/** Switches for the Potential nodes that change a card's text (e.g. 3-1: Strike gains 1 Ember). Missing = on. */
function PotentialNodes() {
  const { name, build, updateBuild } = useCharacter()!
  const ch = findCharacter(PRESETS, name)
  const used = new Set((ch?.cards ?? []).flatMap((c) => textNodes(c.text)))
  const nodes = (ch?.potentials ?? []).filter((p) => used.has(p.node))
  if (!nodes.length) return null
  return (
    <ul className="rows gap-top">
      {nodes.map((p) => {
        const on = build.potentialNodes?.[p.node] !== false
        return (
          <li key={p.node} className={`row ${on ? '' : 'off'}`}>
            <div className="row-main">
              <div className="row-title">{p.node} {p.name}</div>
              <div className="row-sub">{p.text}</div>
            </div>
            <Toggle checked={on} label={`Potential ${p.node} ${p.name}`}
              onChange={(v) => updateBuild((b) => { b.potentialNodes = { ...b.potentialNodes, [p.node]: v } })} />
          </li>
        )
      })}
    </ul>
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
      <SelectField ariaLabel="Partner" value={build.partner}
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

const egoOptions = Array.from({ length: MAX_EGO_LEVEL + 1 }, (_, i) => ({ value: String(i), label: i === 0 ? 'E0 (none)' : `E${i}` }))

/** The build's 2 teammates. Linked to one of their saved builds, they deal damage in the attack list; their ally buffs and enemy
 * debuffs show on the Buffs tab. */
function TeamSection() {
  const { name, build, updateBuild } = useCharacter()!
  const { data } = useStore()
  const slots = Array.from({ length: TEAM_SIZE }, (_, i) => build.team?.[i])
  const upd = (i: number, fn: (t: Teammate) => void) => updateBuild((b) => {
    b.team ??= []
    while (b.team.length <= i) b.team.push(newTeammate())
    fn(b.team[i])
  })
  return (
    <Section title="Team" help="The build's other two characters. Pick one of their saved builds (open the character from the top menu to make one): its Manifest Ego, partner and sets are used, and their cards in the attack list deal damage with its stats and buffs. Only their effects that reach allies or the enemy count for this character (marked in the presets): character and Manifest Ego effects, partner (its Ego skill too), fragment sets and their cards picked on the Cards tab. Their equipment for this character: add it under My stat boosts / My buffs with From set to the teammate.">
      {slots.map((t, i) => {
        const others = slots.filter((x, j) => j !== i && x?.character).map((x) => x!.character)
        const chars = PRESETS.characters.filter((c) => c.name !== name && !others.includes(c.name))
        const saved = t?.character ? data.characters[t.character]?.builds ?? [] : []
        const linked = linkedBuild(data.characters, t)
        return (
          <div key={i} className="team-slot">
            <div className="grid2">
              <SelectField label={`Teammate ${i + 1}`} value={t?.character ?? ''}
                options={[{ value: '', label: 'None' }, ...chars.map((c) => ({ value: c.name, label: c.name }))]}
                onChange={(v) => updateBuild((b) => {
                  b.team ??= []
                  while (b.team.length <= i) b.team.push(newTeammate())
                  Object.assign(b.team[i], { character: v, cards: [] })
                  delete b.team[i].build
                  pruneTeamPlays(undefined, b, i)
                })} />
              {t?.character && (
                <SelectField label="Their build" value={linked ? linked.build.id : NO_BUILD}
                  help={saved.length ? 'Their damage and buffs use this build.' : `${t.character} has no saved build yet: only their buffs count, from the fields below.`}
                  options={[...saved.map((b) => ({ value: b.id, label: b.name })), { value: NO_BUILD, label: 'None (buffs only)' }]}
                  onChange={(v) => upd(i, (x) => { x.build = v })} />
              )}
              {t?.character && !linked && <TeammateFields t={t} onChange={(fn) => upd(i, fn)} />}
            </div>
            {linked && (
              <p className="muted">
                {[`E${linked.build.egoLevel ?? 0}`, linked.build.partner || 'no partner', ...(linked.build.fragments ?? []).filter(Boolean)].join(' · ')}
                {' '}(from {t!.character}'s build; change them there)
              </p>
            )}
            {t?.character && <p className="muted">{t.character}'s cards: Cards tab › Add cards ({t.cards.length} picked).</p>}
          </div>
        )
      })}
    </Section>
  )
}

function TeammateFields({ t, onChange }: { t: Teammate; onChange: (fn: (t: Teammate) => void) => void }) {
  const picks = Array.from({ length: FRAGMENT_SET_PICKS }, (_, i) => t.fragments?.[i] ?? '')
  const partners = [...PRESETS.partners].sort((a, b) => a.class.localeCompare(b.class) || a.name.localeCompare(b.name))
  const sets = [...PRESETS.fragmentSets].sort((a, b) => a.pieces - b.pieces || a.name.localeCompare(b.name))
  return (
    <>
      <SelectField label="Manifest Ego" value={String(t.egoLevel ?? 0)} options={egoOptions} onChange={(v) => onChange((x) => { x.egoLevel = Number(v) })} />
      <SelectField label="Partner" value={t.partner}
        options={[{ value: '', label: 'None' }, ...partners.map((p) => ({ value: p.name, label: `${p.name} (${p.class})` }))]}
        onChange={(v) => onChange((x) => { x.partner = v })} />
      {picks.map((v, i) => (
        <SelectField key={i} label={`Set ${i + 1}`} value={v}
          options={[{ value: '', label: 'None' }, ...sets.map((f) => ({ value: f.name, label: `${f.name} (${f.pieces}-piece)` }))]}
          onChange={(n) => onChange((x) => { x.fragments = [...picks]; x.fragments[i] = n })} />
      ))}
    </>
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
          return (
            <li key={x.id} className="row col">
              <div className="row-line">
                <button className="row-main link" onClick={() => setOpen(open === x.id ? null : x.id)} aria-expanded={open === x.id}>
                  <div className="row-title">{x.source || 'Unnamed boost'}</div>
                  <Pills pills={[statPill(x.stat, x.value || '0'), ...(x.from ? [{ text: `from ${x.from}`, group: 'const' as const }] : [])]} />
                </button>
                <SwitchControl label={x.source || 'boost'} value={x.switches[build.id]} onChange={(sw) => upd((b) => { b.switches[build.id] = sw })} />
              </div>
              {open === x.id && (
                <div className="editor grid2">
                  <TextField label="Source" value={x.source} placeholder="e.g. Obsidian Sword" onChange={(s) => upd((b) => { b.source = s })} />
                  <SelectField<StatName> label="Stat" value={x.stat} options={STATS} onChange={(s) => upd((b) => { b.stat = s })} />
                  <TextField label="Value" value={x.value} placeholder="16% or 74" help="Percent stats with %, flat values without." onChange={(s) => upd((b) => { b.value = s })} />
                  <SelectField label="Category" value={x.category} options={CATEGORIES} onChange={(s) => upd((b) => { b.category = s })} />
                  <FromField value={x.from} onChange={(s) => upd((b) => { b.from = s })} />
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
