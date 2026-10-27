// Preset effects for the active build, as switches: the character's own (with partner, fragment sets, library cards),
// or the teammates' ally buffs and enemy debuffs.
import { PRESETS } from '../data/presets'
import { findCharacter, findPartner, presetStates, stateLabel, type PresetState } from '../engine/buffs'
import { useCharacter } from '../store/store'
import type { Effect } from '../engine/types'
import { SwitchControl } from './inputs'

const TARGET_TEXT = { self: '', allies: ' · all allies', enemy: ' · on the enemy' }

function detailText(e: Effect): string {
  if (e.kind === 'Stat') return `${e.stat} ${e.value}${TARGET_TEXT[e.target ?? 'self']}`
  return `${e.value}${e.type ? ` ${e.type}` : ''} · ${e.appliesTo}${e.hitScope === 'First hit only' ? ' · first hit' : ''}`
    + `${e.condition === 'Ravaged only' ? ' · Ravaged only' : ''}${TARGET_TEXT[e.target ?? 'self']}`
    + `${e.counter ? ` · per ${e.counter} stack${e.maxStacks ? ` (max ${e.maxStacks})` : ''}, stacks set per play (Cards tab)` : ''}`
}

/** team: list the teammates' effects instead of the character's own. */
export function PresetList({ kind, team = false }: { kind: 'Stat' | 'Buff'; team?: boolean }) {
  const { name, cs, build, updateBuild } = useCharacter()!
  // Manifest Ego effects above the build's (or teammate's) level are hidden (they can't be on in-game either)
  const states = presetStates(PRESETS, name, build, cs.cards)
    .filter((s) => s.effect.kind === kind && !s.egoLocked && (s.teammate !== undefined) === team)
  if (!states.length) {
    return <p className="muted">{team
      ? `No team ${kind === 'Stat' ? 'stat boosts' : 'buffs'} from the build's teammates (pick them on the Setup tab).`
      : `No ${kind === 'Stat' ? 'stat' : 'buff'} presets for this character, partner or fragment sets.`}</p>
  }
  return (
    <ul className="rows">
      {states.map((s) => <PresetRow key={s.key} s={s} sw={build.presetSwitches[s.key]} mainName={name}
        partnerName={s.teammate === undefined ? build.partner : build.team[s.teammate]?.partner ?? ''}
        onChange={(v) => updateBuild((b) => { b.presetSwitches[s.key] = v })} />)}
    </ul>
  )
}

function PresetRow({ s, sw, mainName, partnerName, onChange }: {
  s: PresetState; sw: boolean | number | undefined; mainName: string; partnerName: string; onChange: (v: boolean | number) => void
}) {
  const e = s.effect
  const ch = findCharacter(PRESETS, s.teammateName ?? mainName)
  const partner = findPartner(PRESETS, partnerName)
  // Per-play counter buffs are on/off only: their stacks are set on each play
  const counted = e.kind === 'Buff' && !!e.counter
  return (
    <li className={`row ${s.stacks > 0 ? '' : 'off'}`}>
      <div className="row-main">
        <div className="row-title">{e.name} <span className="tag">{stateLabel(s)}</span></div>
        <div className="row-sub">{detailText(e)}</div>
        {s.classBlocked && (
          <div className="row-warn">Class-limited: {partner?.name} is {partner?.class}, {ch?.name} is {ch?.class}</div>
        )}
        {s.onStatsScreen && <div className="row-note">Already on the stats screen: not added again</div>}
        {e.notes && <div className="row-note">{e.notes}</div>}
      </div>
      {!s.onStatsScreen && <SwitchControl label={e.name} value={sw === undefined ? true : counted ? sw !== false && sw !== 0 : sw}
        disabled={s.classBlocked} defaultStacks={e.defaultStacks}
        maxStacks={e.kind === 'Buff' && !counted ? e.maxStacks : undefined}
        onChange={onChange} />}
    </li>
  )
}
