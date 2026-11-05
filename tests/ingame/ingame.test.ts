// Measured in-game results are tests; the ones still to run are todos. docs/in-game-tests.md must match the same list: after changing
// checks.ts, rewrite it with `npx vitest run -u tests/ingame`.
import { describe, expect, it } from 'vitest'
import { CHECKS, type InGameCheck } from './checks'

const round = (n: number) => Math.round(n * 100) / 100

function todoEntry(c: InGameCheck): string {
  return [
    `### ${c.id}`, '',
    `**Question:** ${c.question}`, '',
    `**Setup:** ${c.setup}`, '',
    '**Steps:**', ...c.steps.map((s, i) => `${i + 1}. ${s}`), '',
    `**Send:** ${c.record.join('; ')}.`, '',
    ...(c.closes ? [`Closes: ${c.closes}`, ''] : []),
  ].join('\n')
}

function measuredRows(c: InGameCheck): string[] {
  const m = c.measured!
  return m.values.map((v) => `| ${c.id} | ${v.label} | ${v.inGame} | ${round(v.calculator())} | ${m.date}${m.gameVersion ? `, game ${m.gameVersion}` : ''} (${m.source}) | ${m.answer} |`)
}

function document(): string {
  const todo = CHECKS.filter((c) => !c.measured)
  const done = CHECKS.filter((c) => c.measured)
  return [
    '# In-game tests',
    '',
    'Made from `tests/ingame/checks.ts`; change it there, not here, then run `npx vitest run -u tests/ingame`.',
    '',
    `${todo.length} to run, ${done.length} measured. Send the numbers under **Send** with the game version; they then become tests here and close the question.`,
    'Use non-crit hits unless the test is about crits, and note anything else that was on.',
    '',
    '## To run',
    '',
    ...todo.map(todoEntry),
    '## Measured',
    '',
    'Each row is checked against the calculator on every test run.',
    '',
    '| Test | Value | In game | Calculator | When | Result |',
    '| --- | --- | --- | --- | --- | --- |',
    ...done.flatMap(measuredRows),
    '',
  ].join('\n')
}

describe('in-game results', () => {
  for (const c of CHECKS) {
    if (!c.measured) {
      it.todo(`${c.id}: ${c.question}`)
      continue
    }
    for (const v of c.measured.values) {
      it(`${c.id}: ${v.label}`, () => {
        expect(Math.abs(v.calculator() - v.inGame)).toBeLessThanOrEqual(v.tolerance)
      })
    }
  }

  it('ids are unique', () => {
    expect(new Set(CHECKS.map((c) => c.id)).size).toBe(CHECKS.length)
  })

  it('docs/in-game-tests.md is up to date', async () => {
    await expect(document()).toMatchFileSnapshot('../../docs/in-game-tests.md')
  })
})
