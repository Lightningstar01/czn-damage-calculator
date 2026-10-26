// The character's, partner's and memory fragment sets' preset effects for the active build, as switches.
import { PRESETS } from '../data/presets'
import { findCharacter, findPartner, presetKey, presetStates } from '../engine/buffs'
import { useCharacter } from '../store/store'
import type { Effect } from '../engine/types'
import { SwitchControl } from './inputs'

const TRIGGER_TEXT = { self: 'when this card is played', afterSelf: 'each card played from this one on', always: 'each card played' }

function detailText(e: Effect): string {
  if (e.kind === 'Stat') return `${e.stat} ${e.value}`
  if (e.kind === 'Stacks') {
    return `+${e.amount} ${e.counter} ${TRIGGER_TEXT[e.trigger]}${e.on && e.on !== 'ALL' ? ` (${e.on})` : ''}${e.damagingOnly ? ', if it deals damage' : ''}`
  }
  return `${e.value}${e.type ? ` ${e.type}` : ''} · ${e.appliesTo}${e.hitScope === 'First hit only' ? ' · first hit' : ''}`
    + `${e.condition === 'Ravaged only' ? ' · Ravaged only' : ''}`
    + `${e.counter ? ` · per ${e.counter} stack${e.maxStacks ? ` (max ${e.maxStacks})` : ''}, counted along the rotation${e.consumePerHit ? ', one used per hit' : ''}` : ''}`
}

export function PresetList({ kind }: { kind: 'Stat' | 'Buff' }) {
  const { name, cs, build, updateBuild } = useCharacter()!
  // Manifest Ego effects above the build's level are hidden (they can't be on in-game either)
  // The Buffs tab also lists the Stacks effects that fill rotation counters
  const states = presetStates(PRESETS, name, build, cs.cards)
    .filter((s) => (s.effect.kind === kind || (kind === 'Buff' && s.effect.kind === 'Stacks')) && !s.egoLocked)
  if (!states.length) return <p className="muted">No {kind === 'Stat' ? 'stat' : 'buff'} presets for this character, partner or fragment sets.</p>
  const ch = findCharacter(PRESETS, name)
  const partner = findPartner(PRESETS, build.partner)
  return (
    <ul className="rows">
      {states.map((s) => {
        const e = s.effect
        const key = presetKey(s.owner, e)
        const sw = build.presetSwitches[key]
        const detail = detailText(e)
        // Rotation-counted buffs and Stacks effects are on/off only
        const counted = e.kind === 'Stacks' || (e.kind === 'Buff' && !!e.counter)
        return (
          <li key={key} className={`row ${s.stacks > 0 ? '' : 'off'}`}>
            <div className="row-main">
              <div className="row-title">{e.name} <span className="tag">{s.owner}</span></div>
              <div className="row-sub">{detail}</div>
              {s.classBlocked && (
                <div className="row-warn">Class-limited: {partner?.name} is {partner?.class}, {ch?.name} is {ch?.class}</div>
              )}
              {s.onStatsScreen && <div className="row-note">Already on the stats screen: not added again</div>}
              {e.notes && <div className="row-note">{e.notes}</div>}
            </div>
            {!s.onStatsScreen && <SwitchControl label={e.name} value={sw === undefined ? true : counted ? sw !== false && sw !== 0 : sw}
              disabled={s.classBlocked} defaultStacks={e.kind === 'Stacks' ? 1 : e.defaultStacks}
              maxStacks={e.kind === 'Buff' && !counted ? e.maxStacks : undefined}
              onChange={(v) => updateBuild((b) => { b.presetSwitches[key] = v })} />}
          </li>
        )
      })}
    </ul>
  )
}
