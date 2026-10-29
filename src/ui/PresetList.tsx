// Preset effects for the active build, as switches: the character's own (with partner, fragment sets, library cards),
// or the teammates' ally buffs and enemy debuffs.
import { PRESETS } from '../data/presets'
import { buffType, findCharacter, findPartner, presetBuffValue, presetStates, stateLabel, type PresetState } from '../engine/buffs'
import { useCharacter } from '../store/store'
import type { Build, Effect } from '../engine/types'
import { pct } from './format'
import { buffPill, conditionPills, Pills, statPill, type Pill } from './BuffChips'
import { SwitchControl } from './inputs'

function effectPills(e: Effect, onStatsScreen: boolean, build: Build): Pill[] {
  if (e.kind === 'Stat') {
    return [statPill(e.stat, e.value),
      ...(e.target && e.target !== 'self' ? [{ text: e.target === 'allies' ? 'all allies' : 'on the enemy', group: 'const' as const }] : []),
      ...(e.hint ? [{ text: e.hint, group: 'const' as const }] : []),
      ...(onStatsScreen ? [{ text: 'on the stats screen: not added', group: 'const' as const }] : [])]
  }
  // attackBonus / minAttack: the value already follows the stats-screen Attack (or Defense)
  const v = presetBuffValue(e, build)
  const ab = e.attackBonus
  const stat = e.thresholdStat ?? 'Attack'
  const byAttack = !!ab || e.minAttack !== undefined
  const shown = byAttack ? `${e.value.trim().startsWith('+') ? '+' : ''}${pct(v.value)}` : e.value
  const bonus: Pill[] = [
    ...(e.minAttack !== undefined ? [{ group: 'const' as const, text: `needs ${e.minAttack} ${stat}` }] : []),
    ...(ab ? [{ group: 'const' as const, text: ab.every
      ? `${ab.value} per ${ab.every} ${stat} above ${ab.above}${ab.max ? ` (max ${ab.max})` : ''}`
      : v.bonus ? `${stat} ${ab.orEqual ? `${ab.above}+` : `above ${ab.above}`}`
      : `${ab.value} more ${ab.orEqual ? 'from' : 'above'} ${ab.above} ${stat}` }] : []),
  ]
  return [buffPill(shown, e.type ?? buffType(e.value)), ...conditionPills(e), ...bonus]
}

/** team: list the teammates' effects instead of the character's own. */
export function PresetList({ kind, team = false }: { kind: 'Stat' | 'Buff'; team?: boolean }) {
  const { name, build, updateBuild } = useCharacter()!
  // Manifest Ego effects above the build's (or teammate's) level are hidden (they can't be on in-game either)
  const states = presetStates(PRESETS, name, build)
    .filter((s) => s.effect.kind === kind && !s.egoLocked && (s.teammate !== undefined) === team)
  if (!states.length) {
    return <p className="muted">{team
      ? `${build.team.filter((t) => t.character).map((t) => t.character).join(' and ')} give no ${kind === 'Stat' ? 'stat boosts' : 'buffs'} yet (or none of their cards are picked).`
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
  const { build } = useCharacter()!
  const e = s.effect
  const ch = findCharacter(PRESETS, s.teammateName ?? mainName)
  const partner = findPartner(PRESETS, partnerName)
  // Per-play counter buffs are on/off only: their stacks are set on each play
  const counted = e.kind === 'Buff' && !!e.counter
  return (
    <li className={`row ${s.stacks > 0 ? '' : 'off'}`}>
      <div className="row-main">
        <div className="row-title">{e.name} <span className="tag">{stateLabel(s)}</span></div>
        <Pills pills={effectPills(e, s.onStatsScreen, build)} />
        {s.classBlocked && (
          <div className="row-warn">Class-limited: {partner?.name} is {partner?.class}, {ch?.name} is {ch?.class}</div>
        )}
      </div>
      {!s.onStatsScreen && <SwitchControl label={e.name} value={sw === undefined ? true : counted ? sw !== false && sw !== 0 : sw}
        disabled={s.classBlocked} defaultStacks={e.defaultStacks}
        maxStacks={e.kind === 'Buff' && !counted ? e.maxStacks : undefined}
        onChange={onChange} />}
    </li>
  )
}
