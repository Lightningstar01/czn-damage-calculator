/** 0.453 -> "45.3%" */
export function pct(v: number, digits = 1): string {
  return `${trim((v * 100).toFixed(digits))}%`
}

/** 1272.28 -> "1,272" */
export function num(v: number, digits = 0): string {
  return v.toLocaleString(undefined, { maximumFractionDigits: digits, minimumFractionDigits: 0 })
}

/** Multiplier: 1.42 -> "×1.42" */
export function times(v: number): string {
  return `×${trim(v.toFixed(3))}`
}

/** +0.213 -> "+21.3%" */
export function signedPct(v: number): string {
  return `${v >= 0 ? '+' : ''}${pct(v)}`
}

function trim(s: string): string {
  return s.includes('.') ? s.replace(/0+$/, '').replace(/\.$/, '') : s
}
