// The real site in a browser: does what's on screen reach the engine and come back? The math itself: tests/engine/.
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, test as base, type Page } from 'playwright/test'
import { STORAGE_KEY } from '../src/store/storageKey.ts'
import { loadSaveOnce, overflowPx } from './shared.ts'

const SAVE_FILE = resolve(import.meta.dirname, '../tests/fixtures/save-v1.json') // an old save: Mei Lin with one Strike
const MY_BUFF = 'Emblem of an Exceptional Entity' // in the save, counts on every card
const PRESET_BUFF = 'Basic Card Proficiency' // Mei Lin's 5-1: only on her Strike from the picker, not the save's old one
const CARD = "Flame Dragon's Jewel"

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
  await page.goto('/')
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

/** Picks a card on the Cards tab (its base version, if it has epiphanies) and adds one play of it. */
async function addAndPlay(page: Page, name: string) {
  await tabButton(page, 'Cards').click()
  const picker = page.locator('section', { has: page.getByRole('heading', { name: 'Add cards' }) })
  await picker.getByRole('button', { name, exact: true }).first().click()
  const confirm = page.getByRole('dialog', { name: `Add ${name}?` })
  if (!await confirm.isVisible()) await picker.getByRole('button', { name, exact: true }).first().click()
  await confirm.getByRole('button', { name: 'Add', exact: true }).click()
  await page.getByRole('button', { name: '+ Play', exact: true }).click()
  const plays = page.getByRole('dialog', { name: 'Add plays' })
  // .last(): the card just added, when the save has an old card of the same name
  await plays.getByRole('button', { name: `Play Mei Lin's ${name}`, exact: true }).last().click()
  await plays.getByRole('button', { name: 'Done', exact: true }).click()
}

test('an old backup imports from Settings with its damage', async ({ page }) => {
  await page.goto('/')
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

test('a card added to the deck and played adds damage', async ({ page }) => {
  await openWithSave(page)
  const before = await total(page)
  await addAndPlay(page, CARD)
  expect(await total(page)).toBeGreaterThan(before)
  await expect(page.locator('.plays .play')).toHaveCount(2)
  await expect(page.locator('.plays .play').nth(1)).toContainText(CARD)
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
  await page.goto('/')
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
  await page.goto('/')
  await expect(page.getByRole('alert')).toContainText("isn't saving your changes")
})
