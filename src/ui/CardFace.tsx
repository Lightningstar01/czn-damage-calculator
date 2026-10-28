// A card drawn like the game's: art (Prydwen's picture), cost, name, type, and the card text with the build's numbers.
import { useMemo, useState, type ReactNode } from 'react'
import { PRESETS } from '../data/presets'
import { activeBuffs, findCharacter } from '../engine/buffs'
import { shownPct } from '../engine/calc'
import { renderCardText } from '../engine/cardText'
import { presetCard } from '../engine/deck'
import { ELEMENTS, type Card, type CardPreset, type Teammate } from '../engine/types'
import { useCharacter, useStore } from '../store/store'
import { pct } from './format'

/** The picture's URL: copied art is served from the site (public/cards), the rest from Prydwen's CDN. */
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
      pct: (base) => shownPct(base, presetCard(p, ch?.element ?? ELEMENTS[0], p.id), build, ch, buffs, settings),
    })
}

/** A custom card (from an older save): its numbers instead of card text. */
export function customText(c: Card): string {
  const amount = c.scaling === 'Fixed' ? `${c.pct} Fixed Damage` : `${pct(c.pct, 2)}${c.scaling === 'DEF' ? ' Defense-Based' : ''} Damage`
  return `${amount}${c.hits > 1 ? ` × ${c.hits}` : ''}${c.tags ? `\n[${c.tags}]` : ''}`
}

const costLabel = (cost: number | null | undefined, tags = '') =>
  cost != null ? String(cost) : /\bX-cost\b/.test(tags) ? 'X' : ''

/** size 'tile' (grid, text in small print), 'mini' (art and name only) or 'big' (popup). note: a grey line under the text.
 * Tapping calls onClick. */
export function CardFace({ preset, card, text, note, size = 'tile', badges, onClick, label }: {
  preset?: CardPreset; card?: Card; text?: string; note?: string; size?: 'tile' | 'mini' | 'big'; badges?: ReactNode; onClick?: () => void
  label?: string
}) {
  const [broken, setBroken] = useState(false)
  const name = preset?.name ?? card?.name ?? ''
  const type = preset?.cardType ?? card?.cardType
  const element = preset?.element ?? card?.element
  const cost = costLabel(preset ? preset.cost : card?.cost, preset?.tags ?? card?.tags)
  const rarity = (preset?.rarity ?? 'custom').toLowerCase()
  const body = (
    <>
      <div className="cf-art">
        {preset?.image && !broken
          ? <img src={artUrl(preset.image)} alt="" loading="lazy" onError={() => setBroken(true)} />
          : <div className={`cf-noart el-${(element ?? '').toLowerCase()}`} />}
        {cost && <span className="cf-cost">{cost}</span>}
        {badges && <span className="cf-badges">{badges}</span>}
        <span className="cf-name">{name}</span>
      </div>
      {size !== 'mini' && (
        <div className="cf-body">
          <div className="cf-type">{[type, element].filter(Boolean).join(' · ')}</div>
          {text && <div className="cf-text card-text">{text}</div>}
          {note && <div className="cf-note">{note}</div>}
        </div>
      )}
    </>
  )
  const cls = `card-face cf-${size} cf-r-${rarity}`
  return onClick
    ? <button type="button" className={cls} onClick={onClick} aria-label={label ?? name}>{body}</button>
    : <div className={cls}>{body}</div>
}
