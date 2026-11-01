// Results for the active build: totals, final stats, then each play with its formula strip.
import { useState } from 'react'
import type { Play, Triggered } from '../engine/calc'
import { activeFight } from '../store/save'
import { useCharacter, useStore } from '../store/store'
import { num, pct } from './format'
import { FormulaStrip, LEGEND } from './FormulaStrip'
import { Section } from './inputs'

export function ResultsTab() {
  const { build, results } = useCharacter()!
  const { data } = useStore()
  const fight = activeFight(data)
  const [key, setKey] = useState(false)
  const r = results.get(build.id)
  if (!r) return null
  const s = r.stats
  return (
    <>
      <Section title={`${build.name} results`}>
        {r.warnings.map((w) => <p key={w} className="row-warn">{w}</p>)}
        <div className="totals">
          <div><span className="muted">Non-crit</span><strong>{num(r.nonCrit)}</strong></div>
          <div className="main"><span className="muted">Expected</span><strong>{num(r.expected)}</strong></div>
          <div><span className="muted">All-crit</span><strong>{num(r.crit)}</strong></div>
        </div>
        {r.byCharacter.length > 1 && (
          <ul className="by-character">
            {r.byCharacter.map((c) => (
              <li key={c.name}>
                <span>{c.name}</span>
                <span><b>{num(c.expected)}</b> <span className="muted small">expected · {r.expected ? pct(c.expected / r.expected, 0) : '0%'}</span></span>
              </li>
            ))}
          </ul>
        )}
        <div className="final-stats">
          <span>ATK <b>{num(s.atk.value, 1)}</b></span>
          <span>DEF <b>{num(s.def.value, 1)}</b></span>
          <span>Crit <b>{pct(s.critRate.value)}</b> / <b>{pct(s.critDmg.value)}</b></span>
          <span>Weakness <b>{pct(s.weaknessDmg.value)}</b></span>
          <span>Element <b>+{pct(s.elemDmg.value)}</b></span>
          {s.extraDmg.value !== 0 && <span>Extra <b>+{pct(s.extraDmg.value)}</b></span>}
          {s.dotDmg.value !== 0 && <span>DoT <b>+{pct(s.dotDmg.value)}</b></span>}
        </div>
        <p className="muted small">Fight: {fight.name || 'Unnamed fight'} (DEF ×{fight.enemies[0].defMult}, reduction {pct(fight.enemies[0].dr)})</p>
      </Section>
      <Section title="Attack list" help="One row per play of this build's attack list, the teammates' too (with their saved build's stats and buffs). Every buff that's on counts (snapshot); the play's Vulnerable, Weakness debuff, Ravaged target and per-play stacks (Ember, Mark...) show under the card, and the hits it sets off (Mark, Coordinated Attacks) under its formula, included in its total. The formula shows hit 1; tap “hits” to see every hit (first-hit buffs can change them). Tap any chip to see where it comes from."
        actions={r.plays.length > 0 && (
          <button className="btn small" onClick={() => setKey(!key)} aria-expanded={key}>{key ? 'Hide colors' : 'Colors'}</button>
        )}>
        {!r.plays.length && <p className="muted">Add cards to this build's attack list on the Cards tab.</p>}
        {key && (
          <ul className="legend">
            {LEGEND.map((l) => <li key={l.group}><span className={`swatch g-${l.group}`} />{l.label}</li>)}
          </ul>
        )}
        <ol className="plays">
          {r.plays.map((p) => <PlayRow key={p.index} play={p} />)}
        </ol>
      </Section>
    </>
  )
}

/** A hit the play set off (Selena's Mark...): its total, tap for its formula. */
function TriggeredRow({ t }: { t: Triggered }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="triggered">
      <button className="link small" onClick={() => setOpen(!open)} aria-expanded={open}>
        + {t.by}'s {t.card.name}{t.chance !== 1 ? ` (${pct(t.chance, 0)} ${t.onCrit ? 'crit ' : ''}chance)` : ''}: <b>{num(t.expected)}</b> expected
      </button>
      {open && t.hits[0] && <FormulaStrip hit={t.hits[0]} card={t.card} />}
    </div>
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
        <span className="play-name">{card.name || 'Unnamed card'}{play.by && <span className="tag">{play.by}</span>}</span>
        <span className="play-nums">
          <strong>{num(play.expected)}</strong>
          <span className="play-nums-label">expected · {num(play.nonCrit)} non-crit</span>
        </span>
      </div>
      {(play.counters.length > 0 || play.vulnerable || play.weaknessDebuff || play.ravaged) && (
        <div className="muted small">
          {[...(play.vulnerable ? ['Vulnerable'] : []), ...(play.weaknessDebuff ? ['Weakness debuff'] : []), ...(play.ravaged ? ['Target Ravaged'] : []),
            ...play.counters.map((c) => `${c.name} ${c.stacks}`)].join(' · ')}
        </div>
      )}
      {play.noBuild && <div className="muted small">{play.by} has no saved build linked (Setup › Team): no damage of their own.</div>}
      {hits.length > 0 && <FormulaStrip hit={hits[0]} card={card} />}
      {play.triggered.map((t, i) => <TriggeredRow key={i} t={t} />)}
      {play.followUp && (
        <div className="muted small">
          + {play.followUp.from}: Fixed {pct(play.followUp.share)} of this play's damage = <b>{num(play.followUp.expected)}</b> expected
          ({num(play.followUp.nonCrit)} non-crit), included above
        </div>
      )}
      {hits.length > 1 && (
        <button className="link small" onClick={() => setOpen(!open)} aria-expanded={open}>
          {open ? 'Hide hits' : `${hits.length} hits${varies ? ' (they differ)' : ', all the same'}`}
        </button>
      )}
      {open && (
        <ol className="hits">
          {hits.map((h) => (
            <li key={h.hitNo}>
              <div className="muted small">Hit {h.hitNo} (hit {h.globalHit} of the list)</div>
              <FormulaStrip hit={h} card={card} showCrit={false} />
            </li>
          ))}
        </ol>
      )}
    </li>
  )
}
