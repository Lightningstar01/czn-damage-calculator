// Card text as the game shows it for a build. Card texts in characters/<slug>.ts can hold tokens:
//   {100%}        a base %, shown raised by the card's potential and Card % buffs (Strike: 132%)
//   {F40%}        a Fixed damage %, raised only with the potentialFixed setting
//   {F100%+50%}   a base % raised as above, plus a part added after the raise (a Base % buff, like Maribell's E1): what the damage does
//   {120%@id}     a base % of another card preset, raised by that card's buffs (the Extra Attack on Renoa's Dirge Bullet)
//   {E1:text}     only from Manifest Ego level 1; {E3:6|4} shows 6 from E3, 4 below
//   {P3-1:text}   only while Potential node 3-1 is switched on (Setup tab; missing switches count as on)
// Lines left empty by a token are dropped.

export interface CardTextContext {
  egoLevel: number
  nodeOn: (node: string) => boolean
  /** The shown fraction for a base fraction (1 = 100%); fixed: a Fixed damage %; of: the id of the card preset it belongs to, if not this one. */
  pct: (base: number, fixed: boolean, of?: string) => number
}

const TOKEN = /\{([^{}]*)\}/g

/** A fraction to a whole % (0.896 -> 0.9), half up (Unconfirmed; in-game test card-pct-rounding). An exact .5 comes out of float math a hair to either side (125% x 1.02), so it's nudged first. */
export const wholePct = (v: number) => Math.round(v * 100 + 1e-9) / 100

export function renderCardText(text: string, ctx: CardTextContext): string {
  // Innermost tokens first, so a condition can hold % tokens: 'Heal {P3-1:{70%}|{100%}}'
  let out = text
  for (let prev = ''; prev !== out;) {
    prev = out
    out = replaceTokens(out, ctx)
  }
  return out.split('\n').map((l) => l.trim()).filter(Boolean).join('\n')
}

function replaceTokens(text: string, ctx: CardTextContext): string {
  return text.replace(TOKEN, (whole, body: string) => {
    const pct = /^(F?)(\d+(?:\.\d+)?)%(?:\+(\d+(?:\.\d+)?)%)?(?:@(.+))?$/.exec(body)
    if (pct) return `${Math.round(wholePct(ctx.pct(Number(pct[2]) / 100, !!pct[1], pct[4]) + Number(pct[3] ?? 0) / 100) * 100)}%`
    const cond = /^(E|P)([\d-]+):(.*)$/s.exec(body)
    if (!cond) return whole
    const [, kind, key, rest] = cond
    const [then, otherwise = ''] = rest.split('|')
    const on = kind === 'E' ? ctx.egoLevel >= Number(key) : ctx.nodeOn(key)
    return on ? then : otherwise
  })
}

/** Potential nodes a text depends on ('3-1'). */
export function textNodes(text: string): string[] {
  return [...text.matchAll(/\{P([\d-]+):/g)].map((m) => m[1])
}
