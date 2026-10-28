// A card drawn like the game's: art, cost, name, type, and the card text with the build's numbers over the art.
import { useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { PRESETS } from '../data/presets'
import { activeBuffs, findCharacter } from '../engine/buffs'
import { shownPct } from '../engine/calc'
import { renderCardText } from '../engine/cardText'
import { presetCard } from '../engine/deck'
import { ELEMENTS, type Card, type CardPreset, type Teammate } from '../engine/types'
import { useCharacter, useStore } from '../store/store'
import { pct } from './format'

/** The picture's URL: art copied by the import is served from the site (public/cards); a full URL is used as is. */
function artUrl(image: string): string {
  return /^https?:/.test(image) ? image : `${import.meta.env.BASE_URL}${image}`
}

/** A card's text for the active build: its card upgrade potentials, Manifest Ego level and Potential nodes (Setup tab).
 * A teammate's cards: their Ego level, base % (their potentials aren't entered). */
export function useCardText(teammate?: Teammate): (p: CardPreset) => string {
  const { name, cs, build } = useCharacter()!
  const { data: { settings } } = useStore()
  const ch = findCharacter(PRESETS, teammate?.character ?? name)
  const buffs = useMemo(() => activeBuffs(PRESETS, name, cs, build, settings), [name, cs, build, settings])
  return (p) => teammate
    ? renderCardText(p.text, { egoLevel: teammate.egoLevel ?? 0, nodeOn: () => true, pct: (base) => base })
    : renderCardText(p.text, {
      egoLevel: build.egoLevel ?? 0,
      nodeOn: (node) => build.potentialNodes?.[node] !== false,
      pct: (base, fixed) => shownPct(base, presetCard(p, ch?.element ?? ELEMENTS[0], p.id), build, ch, buffs, settings, fixed),
    })
}

/** A custom card (from an older save): its numbers instead of card text. */
export function customText(c: Card): string {
  const amount = c.scaling === 'Fixed' ? `${c.pct} Fixed Damage` : `${pct(c.pct, 2)}${c.scaling === 'DEF' ? ' Defense-Based' : ''} Damage`
  return `${amount}${c.hits > 1 ? ` × ${c.hits}` : ''}${c.tags ? `\n[${c.tags}]` : ''}`
}

const costLabel = (cost: number | null | undefined, tags = '') =>
  cost != null ? String(cost) : /\bX-cost\b/.test(tags) ? 'X' : ''

/** The type line, as in the game: Basic Attack / Basic Skill for basic cards, Ego Skill for Ego skills. */
function typeLabel(type: string | undefined, tags: string): string {
  const list = tags.split(',').map((t) => t.trim())
  if (list.includes('Ego Skill')) return 'Ego Skill'
  return list.includes('Basic') ? `Basic ${type}` : type ?? ''
}

const TYPE_ICON: Record<string, string> = { Attack: '⚔', Skill: '△', Upgrade: 'ϟ' }

// Numbers cyan and [tags] gold, like the game's card text (owner, 2026-10-27)
const TOKEN = /(\[[^\]\n]*\])|(\d+(?:\.\d+)?)/g
function richText(text: string): ReactNode[] {
  const out: ReactNode[] = []
  let last = 0
  for (const m of text.matchAll(TOKEN)) {
    if (m.index > last) out.push(text.slice(last, m.index))
    out.push(<span key={m.index} className={m[1] ? 'cf-tag' : 'cf-num'}>{m[0]}</span>)
    last = m.index + m[0].length
  }
  out.push(text.slice(last))
  return out
}

/** Shrinks the text (CSS --fit) until it fits its box, like the game's cards. */
function useFitText(text: string | undefined) {
  const box = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const el = box.current
    const inner = el?.firstElementChild as HTMLElement | null
    if (!el || !inner) return
    const fit = () => {
      let scale = 1
      el.style.setProperty('--fit', '1')
      while (scale > 0.45 && inner.offsetHeight > el.clientHeight) {
        scale -= 0.05
        el.style.setProperty('--fit', String(scale))
      }
    }
    fit()
    const watch = new ResizeObserver(fit)
    watch.observe(el)
    return () => watch.disconnect()
  }, [text])
  return box
}

/** Drawn like the in-game card: art filling the card, the element's strip on the left, cost / name / type at the top and the
 * text over the art at the bottom. size 'tile' (grid), 'mini' (no text) or 'big' (popup); every size scales with its width.
 * note: a grey caption under the card. Tapping calls onClick. */
export function CardFace({ preset, card, text, note, size = 'tile', badges, onClick, label }: {
  preset?: CardPreset; card?: Card; text?: string; note?: string; size?: 'tile' | 'mini' | 'big'; badges?: ReactNode; onClick?: () => void
  label?: string
}) {
  const [broken, setBroken] = useState(false)
  const shown = size === 'mini' ? undefined : text
  const fitBox = useFitText(shown)
  const name = preset?.name ?? card?.name ?? ''
  const type = preset?.cardType ?? card?.cardType
  const tags = preset?.tags ?? card?.tags ?? ''
  const element = (preset?.element ?? card?.element ?? '').toLowerCase()
  const cost = costLabel(preset ? preset.cost : card?.cost, tags)
  const rarity = (preset?.rarity ?? 'custom').toLowerCase()
  const body = (
    <>
      <div className={`cf-card cf-el-${element}`}>
        {preset?.image && !broken
          ? <img className="cf-img" src={artUrl(preset.image)} alt="" loading="lazy" onError={() => setBroken(true)} />
          : <div className="cf-img cf-noart" />}
        <span className="cf-strip" />
        <div className="cf-head">
          <span className="cf-cost">{cost}</span>
          <span className="cf-title">
            <span className="cf-name">{name}</span>
            {size !== 'mini' && type && (
              <span className="cf-type"><span className={`cf-icon cf-icon-${type.toLowerCase()}`}>{TYPE_ICON[type]}</span>{typeLabel(type, tags)}</span>
            )}
          </span>
        </div>
        {badges && <span className="cf-badges">{badges}</span>}
        {shown && <div className="cf-textbox" ref={fitBox}><div className="cf-text card-text">{richText(shown)}</div></div>}
      </div>
      {note && <div className="cf-note">{note}</div>}
    </>
  )
  const cls = `card-face cf-${size} cf-r-${rarity}`
  return onClick
    ? <button type="button" className={cls} onClick={onClick} aria-label={label ?? name}>{body}</button>
    : <div className={cls}>{body}</div>
}
