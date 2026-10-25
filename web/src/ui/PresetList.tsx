// The character's and partner's preset effects for the active build, as switches.
import { PRESETS } from '../data/presets'
import { findCharacter, findPartner, presetKey, presetStates } from '../engine/buffs'
import { useCharacter } from '../store/store'
import { SwitchControl } from './inputs'

export function PresetList({ kind }: { kind: 'Stat' | 'Buff' }) {
  const { name, build, updateBuild } = useCharacter()!
  const states = presetStates(PRESETS, name, build).filter((s) => s.effect.kind === kind)
  if (!states.length) return <p className="muted">No {kind === 'Stat' ? 'stat' : 'buff'} presets for this character{build.partner ? ' or partner' : ''}.</p>
  const ch = findCharacter(PRESETS, name)
  const partner = findPartner(PRESETS, build.partner)
  return (
    <ul className="rows">
      {states.map((s) => {
        const e = s.effect
        const key = presetKey(s.owner, e)
        const sw = build.presetSwitches[key]
        const detail = e.kind === 'Stat'
          ? `${e.stat} ${e.value}`
          : `${e.value} · ${e.appliesTo}${e.hitScope === 'First hit only' ? ' · first hit' : ''}${e.condition === 'Ravaged only' ? ' · Ravaged only' : ''}`
        return (
          <li key={key} className={`row ${s.stacks > 0 ? '' : 'off'}`}>
            <div className="row-main">
              <div className="row-title">{e.name} <span className="tag">{s.owner}</span></div>
              <div className="row-sub">{detail}</div>
              {s.classBlocked && (
                <div className="row-warn">Class-limited: {partner?.name} is {partner?.class}, {ch?.name} is {ch?.class}</div>
              )}
              {e.notes && <div className="row-note">{e.notes}</div>}
            </div>
            <SwitchControl label={e.name} value={sw === undefined ? true : sw} disabled={s.classBlocked}
              defaultStacks={e.defaultStacks} maxStacks={e.kind === 'Buff' ? e.maxStacks : undefined}
              onChange={(v) => updateBuild((b) => { b.presetSwitches[key] = v })} />
          </li>
        )
      })}
    </ul>
  )
}
