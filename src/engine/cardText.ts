// Card text as the game shows it for a build. Card texts in characters/<slug>.ts can hold tokens:
//   {100%}        a base %, shown raised by the card's potential and Card % buffs (Strike: 132%)
//   {E1:text}     only from Manifest Ego level 1; {E3:6|4} shows 6 from E3, 4 below
//   {P3-1:text}   only while Potential node 3-1 is switched on (Setup tab; missing switches count as on)
// Lines left empty by a token are dropped.

export interface CardTextContext {
  egoLevel: number
  nodeOn: (node: string) => boolean
  /** The shown fraction for a base fraction (1 = 100%). */
  pct: (base: number) => number
}

const TOKEN = /\{([^{}]*)\}/g

export function renderCardText(text: string, ctx: CardTextContext): string {
  const out = text.replace(TOKEN, (whole, body: string) => {
    const pct = /^(\d+(?:\.\d+)?)%$/.exec(body)
    if (pct) return `${Math.round(ctx.pct(Number(pct[1]) / 100) * 100)}%`
    const cond = /^(E|P)([\d-]+):(.*)$/s.exec(body)
    if (!cond) return whole
    const [, kind, key, rest] = cond
    const [then, otherwise = ''] = rest.split('|')
    const on = kind === 'E' ? ctx.egoLevel >= Number(key) : ctx.nodeOn(key)
    return on ? then : otherwise
  })
  return out.split('\n').map((l) => l.trim()).filter(Boolean).join('\n')
}

/** Potential nodes a text depends on ('3-1'). */
export function textNodes(text: string): string[] {
  return [...text.matchAll(/\{P([\d-]+):/g)].map((m) => m[1])
}
