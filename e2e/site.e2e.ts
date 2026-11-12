// The real site in a browser: does what's on screen reach the engine and come back? The math itself: tests/engine/.
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, test as base, type Page } from 'playwright/test'
import { STORAGE_KEY } from '../src/store/storageKey.ts'
import { loadSaveOnce, overflowPx } from './shared.ts'

const SAVE_FILE = resolve(import.meta.dirname, '../tests/fixtures/save-v1.json') // an old save: Mei Lin with one Strike
const MY_BUFF = 'Emblem of an Exceptional Entity' // in the save, counts on every card
const PRESET_BUFF = 'Basic Card Proficiency' // Mei Lin's 5-1: only on her Strike from the picker, not the save's old one
const CARD = "Flame Dragon's Jewel"
const DATA = resolve(import.meta.dirname, '../src/data')
/** A character without src/data/characters/<slug>.ts, so not reviewed yet (none once every character is). */
const UNREVIEWED: string | undefined = readdirSync(resolve(DATA, 'prydwen'))
  .filter((f) => f.endsWith('.json') && f !== '_meta.json' && !existsSync(resolve(DATA, 'characters', f.replace(/\.json$/, '.ts'))))
  .map((f) => JSON.parse(readFileSync(resolve(DATA, 'prydwen', f), 'utf8')).name)[0]

// Every test also fails on a console error or a crash in the page
const test = base.extend<{ problems: string[] }>({
  problems: [async ({ page }, use) => {
    const problems: string[] = []
    page.on('console', (m) => { if (m.type() === 'error') problems.push(m.text()) })
    page.on('pageerror', (e) => problems.push(e.message))
    await use(problems)
    expect(problems).toEqual([])
  }, { auto: true }],
})

async function openWithSave(page: Page) {
  await loadSaveOnce(page, readFileSync(SAVE_FILE, 'utf8'))
  await page.goto('./')
}

const tabButton = (page: Page, name: string) => page.getByRole('navigation').getByRole('button', { name, exact: true })

/** Results is a tab on the phone and always beside the other tabs on desktop. */
async function total(page: Page, label: 'Non-crit' | 'Expected' = 'Expected'): Promise<number> {
  const tab = tabButton(page, 'Results')
  await expect(page.getByRole('navigation')).toBeVisible() // isVisible() doesn't wait for the page to render
  if (await tab.isVisible()) await tab.click()
  const text = await page.locator('.totals > div', { hasText: label }).locator('strong').innerText()
  return Number(text.replace(/[^\d.]/g, ''))
}

async function setBuff(page: Page, name: string, on: boolean) {
  await tabButton(page, 'Buffs').click()
  const toggle = page.getByRole('switch', { name, exact: true })
  await toggle.click()
  await expect(toggle).toHaveAttribute('aria-checked', String(on))
}

/** Picks a card on the Cards tab (its base version, or from base: that base's epiphany) and adds one play of it. */
async function addAndPlay(page: Page, name: string, who = 'Mei Lin', base = name) {
  await tabButton(page, 'Cards').click()
  const picker = page.locator('section', { has: page.getByRole('heading', { name: 'Add cards' }) })
  await picker.getByRole('button', { name: base, exact: true }).first().click()
  const confirm = page.getByRole('dialog', { name: `Add ${name}?` })
  if (!await confirm.isVisible()) await picker.getByRole('button', { name, exact: true }).first().click()
  await confirm.getByRole('button', { name: 'Add', exact: true }).click()
  await page.getByRole('button', { name: '+ Play', exact: true }).click()
  const plays = page.getByRole('dialog', { name: 'Add plays' })
  // .last(): the card just added, when the save has an old card of the same name
  await plays.getByRole('button', { name: `Play ${who}'s ${name}`, exact: true }).last().click()
  await plays.getByRole('button', { name: 'Done', exact: true }).click()
}

test('an old backup imports from Settings with its damage', async ({ page }) => {
  await page.goto('./')
  await tabButton(page, 'Settings').click()
  page.on('dialog', (d) => d.accept())
  await page.locator('input[type=file]').setInputFiles(SAVE_FILE)
  await expect(page.getByText('Imported 1 character(s).')).toBeVisible()
  await expect(page.getByRole('combobox', { name: 'Character' })).toHaveValue('Mei Lin')
  // The owner's in-game hit (docs/FORMULA.md)
  expect(await total(page, 'Non-crit')).toBe(500)
  expect(await total(page)).toBe(611)
})

test('every tab opens and fits the screen', async ({ page }, info) => {
  await openWithSave(page)
  const tabs = ['Setup', 'Buffs', 'Cards', 'Settings', ...(info.project.name === 'phone' ? ['Results'] : [])]
  await expect(page.getByRole('navigation').getByRole('button')).toHaveCount(tabs.length)
  for (const name of tabs) {
    await tabButton(page, name).click()
    await expect(tabButton(page, name)).toHaveAttribute('aria-current', 'page')
    // Not .results-pane: on desktop it's always there, whatever the tab shows
    await expect(page.locator('.pane:not(.results-pane) .section').first()).toBeVisible()
    expect(await overflowPx(page), `${name} is wider than the screen`).toBeLessThanOrEqual(0)
  }
})

test('turning my own buff off and on changes the damage', async ({ page }) => {
  await openWithSave(page)
  const before = await total(page)
  await setBuff(page, MY_BUFF, false)
  expect(await total(page)).toBeLessThan(before)
  await setBuff(page, MY_BUFF, true)
  expect(await total(page)).toBe(before)
})

test('turning a preset buff off and on changes the damage', async ({ page }) => {
  await openWithSave(page)
  await addAndPlay(page, 'Strike')
  const before = await total(page)
  await setBuff(page, PRESET_BUFF, false)
  expect(await total(page)).toBeLessThan(before)
  await setBuff(page, PRESET_BUFF, true)
  expect(await total(page)).toBe(before)
})

test('card pictures load from the site folder', async ({ page }) => {
  await openWithSave(page)
  await tabButton(page, 'Cards').click()
  // A picture that doesn't load is also a console error, which fails the test
  const art = page.locator('img.cf-img').first()
  await expect(art).toBeVisible()
  await expect.poll(() => art.evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth > 0)).toBe(true)
})

test('a play moves up the attack list with the keyboard', async ({ page }) => {
  await openWithSave(page)
  await addAndPlay(page, CARD)
  await tabButton(page, 'Cards').click()
  const plays = page.locator('.rotation .row-title')
  await expect(plays.nth(1)).toContainText(CARD)
  // dnd-kit: Space picks the play up, arrows move it, Space drops it
  await page.getByRole('button', { name: 'Move play 2', exact: true }).focus()
  await page.keyboard.press('Space')
  // dnd-kit listens for the arrows a moment after the pick-up: press until play 1 makes room (moves down, a positive y)
  const first = page.locator('.rotation > li').first()
  await expect(async () => {
    await page.keyboard.press('ArrowUp')
    expect(await first.getAttribute('style')).toMatch(/translate3d\([-\d.]+px, [1-9]/)
  }).toPass()
  await page.keyboard.press('Space')
  await expect(plays.nth(0)).toContainText(CARD)
  await expect(plays.nth(1)).toContainText('Strike')
})

test('a card added to the deck and played adds damage', async ({ page }) => {
  await openWithSave(page)
  const before = await total(page)
  await addAndPlay(page, CARD)
  expect(await total(page)).toBeGreaterThan(before)
  await expect(page.locator('.plays .play')).toHaveCount(2)
  await expect(page.locator('.plays .play').nth(1)).toContainText(CARD)
})

test("a copied build's own buffs are its own: switching one off leaves the first build as it was", async ({ page }) => {
  await openWithSave(page)
  const before = await total(page)
  await tabButton(page, 'Setup').click()
  const builds = page.getByRole('tablist', { name: 'Builds' }).getByRole('tab')
  const count = await builds.count()
  const open = (await builds.evaluateAll((tabs) => tabs.findIndex((t) => t.getAttribute('aria-selected') === 'true')))
  const build = page.locator('section', { has: page.getByRole('heading', { name: /^Build/ }) })
  await build.getByRole('button', { name: 'Duplicate', exact: true }).click()
  await expect(builds).toHaveCount(count + 1) // the copy is added last and opened
  await setBuff(page, MY_BUFF, false)
  expect(await total(page)).toBeLessThan(before)
  await builds.nth(open).click()
  expect(await total(page)).toBe(before)
  await tabButton(page, 'Buffs').click()
  await expect(page.getByRole('switch', { name: MY_BUFF, exact: true })).toHaveAttribute('aria-checked', 'true')
})

test("the weapon's rarity adds its flat Attack", async ({ page }) => {
  await openWithSave(page)
  const before = await total(page, 'Non-crit')
  await tabButton(page, 'Setup').click()
  const weapon = page.getByRole('combobox', { name: 'Weapon', exact: true })
  await weapon.selectOption('Unique')
  expect(await total(page, 'Non-crit')).toBeGreaterThan(before)
  await tabButton(page, 'Setup').click()
  await weapon.selectOption('')
  expect(await total(page, 'Non-crit')).toBe(before)
})

test('the fight sets the enemy, and another saved fight can be picked', async ({ page }) => {
  await openWithSave(page)
  expect(await total(page, 'Non-crit')).toBe(500)
  await tabButton(page, 'Setup').click()
  const fight = page.locator('section', { has: page.getByRole('heading', { name: /^Fight/ }) }) // the heading's name includes its help button
  await fight.getByRole('button', { name: 'Duplicate', exact: true }).click()
  await fight.getByLabel('DEF multiplier').fill('0.774') // twice the save's 0.387
  await fight.getByLabel('DEF multiplier').blur()
  expect(Math.abs(await total(page, 'Non-crit') - 1000)).toBeLessThanOrEqual(1)
  await tabButton(page, 'Setup').click()
  await fight.getByRole('combobox', { name: 'Fight', exact: true }).selectOption({ index: 0 })
  expect(await total(page, 'Non-crit')).toBe(500)
})

test('Target Ravaged is switched per play', async ({ page }) => {
  await openWithSave(page)
  await addAndPlay(page, 'Strike')
  const before = await total(page)
  const toggle = page.getByRole('switch', { name: 'Target Ravaged', exact: true })
  // On the phone, going to Results closes the play; on desktop it stays open
  const openPlay = async () => {
    await tabButton(page, 'Cards').click()
    const play = page.locator('.row-main[aria-expanded]').last()
    if (await play.getAttribute('aria-expanded') === 'false') await play.click()
  }
  await openPlay()
  await toggle.click()
  await expect(toggle).toHaveAttribute('aria-checked', 'true')
  expect(await total(page)).toBeGreaterThan(before) // Marianne's damage to Ravaged enemies
  await openPlay()
  await toggle.click()
  expect(await total(page)).toBe(before)
})

test("a character's starting counter shows only on plays that can set it", async ({ page }) => {
  await openWithSave(page)
  await page.getByRole('combobox', { name: 'Character' }).selectOption('Amir')
  await addAndPlay(page, 'Rapier', 'Amir')
  await expect(page.locator('.rotation')).toContainText('Rapier')
  await expect(page.locator('.rotation')).not.toContainText('In Metallization state')
  await addAndPlay(page, 'Metal Pierce I', 'Amir', 'Metal Pierce')
  await expect(page.locator('.rotation')).toContainText('In Metallization state 1')
})

test("Maribell's Shield owned is typed in per play, and its Fixed damage follows it", async ({ page }) => {
  await openWithSave(page)
  await page.getByRole('combobox', { name: 'Character' }).selectOption('Maribell')
  await addAndPlay(page, 'Shelter Strike', 'Maribell')
  await page.locator('.rotation').getByRole('button', { name: /Shelter Strike/ }).click()
  await page.locator('.rotation').getByLabel('Shield owned', { exact: true }).fill('400')
  await page.locator('.rotation').getByLabel('Shield owned', { exact: true }).blur()
  await expect(page.locator('.rotation')).toContainText('Shield owned 400')
  await expect(page.getByRole('tablist', { name: 'Builds' })).toContainText('400')
})

test("Maribell's Flat damage gets its own chip in the formula", async ({ page }) => {
  await openWithSave(page)
  await page.getByRole('combobox', { name: 'Character' }).selectOption('Maribell')
  await addAndPlay(page, 'Resolute Blitz IV', 'Maribell', 'Resolute Blitz')
  await page.locator('.rotation').getByRole('button', { name: /Resolute Blitz IV/ }).click()
  await page.locator('.rotation').getByLabel('Shield owned', { exact: true }).fill('400')
  await page.locator('.rotation').getByLabel('Shield owned', { exact: true }).blur()
  await total(page)
  const results = page.locator('.play', { hasText: 'Resolute Blitz IV' }).first()
  await expect(results.locator('.chip', { hasText: 'Flat' }).first()).toContainText('+120')
})

test("Shelter Strike's formula shows E1's +50% apart from the card's Fixed %", async ({ page }) => {
  await openWithSave(page)
  await page.getByRole('combobox', { name: 'Character' }).selectOption('Maribell')
  await addAndPlay(page, 'Shelter Strike', 'Maribell')
  await page.locator('.rotation').getByRole('button', { name: /Shelter Strike/ }).click()
  await page.locator('.rotation').getByLabel('Shield owned', { exact: true }).fill('400')
  await page.locator('.rotation').getByLabel('Shield owned', { exact: true }).blur()
  await tabButton(page, 'Setup').click()
  await page.getByRole('combobox', { name: 'Level', exact: true }).selectOption('1')
  expect(await total(page, 'Non-crit')).toBe(600)
  const results = page.locator('.play', { hasText: 'Shelter Strike' }).first()
  await expect(results.locator('.chip', { hasText: 'Fixed' })).toContainText('100%')
  await expect(results.locator('.chip', { hasText: 'Base' })).toContainText('+50%')
})

test('a Potential node switched off takes its buff away', async ({ page }) => {
  await openWithSave(page)
  await addAndPlay(page, 'Strike')
  const before = await total(page)
  await tabButton(page, 'Setup').click()
  const node = page.getByRole('switch', { name: 'Potential 5-1 Basic Card Proficiency', exact: true })
  await node.click()
  expect(await total(page)).toBeLessThan(before)
  await tabButton(page, 'Buffs').click()
  await expect(page.getByRole('switch', { name: PRESET_BUFF, exact: true })).toHaveCount(0)
  await tabButton(page, 'Setup').click()
  await node.click()
  expect(await total(page)).toBe(before)
})

test('characters not reviewed yet say so', async ({ page }) => {
  test.skip(!UNREVIEWED, 'every character is reviewed')
  await openWithSave(page)
  const badge = page.locator('.not-reviewed')
  await expect(badge).toHaveCount(0)
  await page.getByRole('combobox', { name: 'Character' }).selectOption(UNREVIEWED!)
  await expect(badge).toHaveText('Not reviewed')
})

test('changes are still there after a reload', async ({ page }) => {
  await openWithSave(page)
  const before = await total(page)
  await setBuff(page, MY_BUFF, false)
  const changed = await total(page)
  expect(changed).not.toBe(before)
  await page.reload()
  expect(await total(page)).toBe(changed)
  await tabButton(page, 'Buffs').click()
  await expect(page.getByRole('switch', { name: MY_BUFF, exact: true })).toHaveAttribute('aria-checked', 'false')
})

test('a stored save that cannot be opened is kept until the owner starts fresh', async ({ page }) => {
  const broken = '{"version":10,"characters":{"Mei Lin":'
  await loadSaveOnce(page, broken)
  await page.goto('./')
  const stored = () => page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)
  const warning = page.getByRole('alert')
  await expect(warning).toContainText("couldn't be opened")
  await page.getByRole('combobox', { name: 'Character' }).selectOption('Mei Lin')
  await expect(page.getByRole('tablist', { name: 'Builds' })).toBeVisible()
  expect(await stored()).toBe(broken)
  await page.reload()
  await expect(warning).toBeVisible()
  expect(await stored()).toBe(broken)

  page.once('dialog', (d) => d.accept())
  await warning.getByRole('button', { name: 'Start fresh' }).click()
  await expect(warning).toBeHidden()
  await expect.poll(stored).not.toBe(broken)
  expect(JSON.parse((await stored())!).characters).toEqual({})
})

test('Export backup downloads the save', async ({ page }) => {
  await openWithSave(page)
  await tabButton(page, 'Settings').click()
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export backup' }).click()
  const file = await (await download).path()
  expect(Object.keys(JSON.parse(readFileSync(file, 'utf8')).characters)).toContain('Mei Lin')
})

test('a warning shows when the browser refuses to save', async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => { throw new DOMException('full', 'QuotaExceededError') }
  })
  await page.goto('./')
  await expect(page.getByRole('alert')).toContainText("isn't saving your changes")
})

test('a tab stops saving once another tab saved, so it does not overwrite the newer data', async ({ page, context }) => {
  await openWithSave(page)
  await total(page)
  const stored = () => page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)
  const other = await context.newPage()
  await other.goto('./')
  await setBuff(other, MY_BUFF, false)
  const newer = await stored()
  await expect(page.getByRole('alert')).toContainText('changed in another tab')
  await tabButton(page, 'Cards').click()
  await setBuff(page, PRESET_BUFF, false)
  expect(await stored()).toBe(newer)
  await page.getByRole('alert').getByRole('button', { name: 'Reload' }).click()
  await expect(page.getByRole('alert')).toBeHidden()
  await tabButton(page, 'Buffs').click()
  await expect(page.getByRole('switch', { name: MY_BUFF, exact: true })).toHaveAttribute('aria-checked', 'false')
})

test('Delete all data can be undone from the Settings tab', async ({ page }) => {
  await openWithSave(page)
  const before = await total(page)
  await tabButton(page, 'Settings').click()
  page.once('dialog', (d) => d.accept())
  await page.getByRole('button', { name: 'Delete all data' }).click()
  await expect(page.getByText(/Undo copy: your data from before deleting all data/)).toBeVisible()
  page.once('dialog', (d) => d.accept())
  await page.getByRole('button', { name: 'Restore the undo copy' }).click()
  await expect.poll(() => total(page)).toBe(before)
})
