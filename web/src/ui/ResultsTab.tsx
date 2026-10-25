// Results for the active build: totals, final stats, then each play with its formula strip.
import { useState } from 'react'
import type { Play } from '../engine/calc'
import { useCharacter } from '../store/store'
import { num, pct } from './format'
import { FormulaStrip, LEGEND } from './FormulaStrip'
import { Section } from './inputs'

export function ResultsTab() {
  const { build, results } = useCharacter()!
  const r = results.get(build.id)
  if (!r) return null
  const s = r.stats
  return (
    <>
      <Section title={`${build.name} results`}>
        <div className="totals">
          <div><span className="muted">Non-crit</span><strong>{num(r.nonCrit)}</strong></div>
          <div className="main"><span className="muted">Expected</span><strong>{num(r.expected)}</strong></div>
          <div><span className="muted">All-crit</span><strong>{num(r.crit)}</strong></div>
        </div>
        <div className="final-stats">
          <span>ATK <b>{num(s.atk.value, 1)}</b></span>
          <span>DEF <b>{num(s.def.value, 1)}</b></span>
          <span>Crit <b>{pct(s.critRate.value)}</b> / <b>{pct(s.critDmg.value)}</b></span>
          <span>Weakness <b>{pct(s.weaknessDmg.value)}</b></span>
          <span>Element <b>+{pct(s.elemDmg.value)}</b></span>
          {s.extraDmg.value !== 0 && <span>Extra <b>+{pct(s.extraDmg.value)}</b></span>}
          {s.dotDmg.value !== 0 && <span>DoT <b>+{pct(s.dotDmg.value)}</b></span>}
        </div>
      </Section>
      <Section title="Rotation" help="One row per play. The formula shows hit 1; tap “hits” to see every hit (first-hit buffs and Vulnerable stacks can change them). Tap any chip to see where it comes from.">
        {!r.plays.length && <p className="muted">Add cards to the rotation on the Cards tab.</p>}
        <ul className="legend">
          {LEGEND.map((l) => <li key={l.group}><span className={`swatch g-${l.group}`} />{l.label}</li>)}
        </ul>
        <ol className="plays">
          {r.plays.map((p) => <PlayRow key={p.index} play={p} />)}
        </ol>
      </Section>
    </>
  )
}

function PlayRow({ play }: { play: Play }) {
  const [open, setOpen] = useState(false)
  const { card, hits } = play
  const varies = hits.some((h) => Math.abs(h.nonCrit - hits[0].nonCrit) > 1e-9)
  return (
    <li className="play">
      <div className="play-head">
        <span className="play-no">{play.index + 1}</span>
        <span className="play-name">{card.name || 'Unnamed card'}</span>
        <span className="play-nums">
          <span title="Non-crit">{num(play.nonCrit)}</span>
          <span className="muted"> / </span>
          <strong title="Expected">{num(play.expected)}</strong>
        </span>
      </div>
      {hits.length > 0 && <FormulaStrip hit={hits[0]} card={card} />}
      {hits.length > 1 && (
        <button className="link small" onClick={() => setOpen(!open)} aria-expanded={open}>
          {open ? 'Hide hits' : `${hits.length} hits${varies ? ' (they differ)' : ', all the same'}`}
        </button>
      )}
      {open && (
        <ol className="hits">
          {hits.map((h) => (
            <li key={h.hitNo}>
              <div className="muted small">Hit {h.hitNo} (rotation hit {h.globalHit})</div>
              <FormulaStrip hit={h} card={card} showCrit={false} />
            </li>
          ))}
        </ol>
      )}
    </li>
  )
}
