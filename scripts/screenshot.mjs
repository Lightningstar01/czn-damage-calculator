// Screenshots of the website, so Claude can look at the design (phone and desktop, every tab).
// Starts the Vite dev server, loads a save into the page's storage, taps each tab and saves PNGs.
//
//   node scripts/screenshot.mjs                         # every tab, phone + desktop -> screenshots/
//   node scripts/screenshot.mjs --tab Buffs --phone     # one tab, phone only
//   node scripts/screenshot.mjs --tab Results --tap "Strike"   # tap the first element with that text before the shot
//   node scripts/screenshot.mjs --save my-backup.json   # another save (a backup from the Settings tab)
//
// Default save: tests/fixtures/save-v1.json. Each tab gives <viewport>-<tab>.png (the first screen, as seen) and
// <viewport>-<tab>-full-N.png (the whole scrolled page in parts of 2 screens, tab bar hidden).
import { mkdir, readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { createServer } from 'vite'
import { loadSaveOnce, overflowPx } from '../e2e/shared.ts'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const TABS = ['Setup', 'Buffs', 'Cards', 'Results', 'Settings']
const VIEWPORTS = {
  phone: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  desktop: { viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 },
}

function parseArgs(argv) {
  const opts = { tabs: [], taps: [], save: 'tests/fixtures/save-v1.json', out: 'screenshots', viewports: [] }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--tab') opts.tabs.push(argv[++i])
    else if (a === '--tap') opts.taps.push(argv[++i])
    else if (a === '--save') opts.save = argv[++i]
    else if (a === '--out') opts.out = argv[++i]
    else if (a === '--phone' || a === '--desktop') opts.viewports.push(a.slice(2))
    else throw new Error(`Unknown option ${a}`)
  }
  if (!opts.tabs.length) opts.tabs = TABS
  if (!opts.viewports.length) opts.viewports = Object.keys(VIEWPORTS)
  return opts
}

const opts = parseArgs(process.argv.slice(2))
const save = await readFile(resolve(ROOT, opts.save), 'utf8')
const outDir = resolve(ROOT, opts.out)
await mkdir(outDir, { recursive: true })

const server = await createServer({ root: ROOT, logLevel: 'error', server: { port: 0, strictPort: false } })
await server.listen()
const url = server.resolvedUrls.local[0]
const browser = await chromium.launch()
const problems = []
try {
  for (const vp of opts.viewports) {
    const context = await browser.newContext(VIEWPORTS[vp])
    await loadSaveOnce(context, save)
    const page = await context.newPage()
    page.on('console', (m) => { if (m.type() === 'error') problems.push(`${vp}: console: ${m.text()}`) })
    page.on('pageerror', (e) => problems.push(`${vp}: page error: ${e.message}`))
    await page.goto(url)
    await page.waitForSelector('.tabbar, nav')
    for (const tab of opts.tabs) {
      const button = page.locator('.tabbar button', { hasText: tab })
      if (!(await button.count()) || !(await button.first().isVisible())) {
        // Desktop shows Results beside the other tabs, without a tab button
        if (tab !== 'Results') problems.push(`${vp}: no ${tab} tab button`)
        continue
      }
      await button.first().click()
      for (const text of opts.taps) {
        const target = page.getByText(text, { exact: false }).first()
        if (await target.count()) await target.click()
        else console.log(`${vp} ${tab}: nothing to tap with text "${text}"`) // not a site problem: not every tab has it
      }
      await page.waitForTimeout(150)
      // <vp>-<tab>.png: the first screen as it looks; -full-N.png: the whole page in parts of 2 screens (small enough to
      // read), without the fixed tab bar on top of it
      const file = resolve(outDir, `${vp}-${tab.toLowerCase()}.png`)
      await page.screenshot({ path: file })
      const hide = await page.addStyleTag({ content: '.tabbar { display: none !important; }' })
      const { width, height } = VIEWPORTS[vp].viewport
      const total = await page.evaluate(() => document.documentElement.scrollHeight)
      for (let y = 0, n = 1; y < total; y += height * 2, n++) {
        await page.screenshot({ path: file.replace(/\.png$/, `-full-${n}.png`), fullPage: true,
          clip: { x: 0, y, width, height: Math.min(height * 2, total - y) } })
      }
      await hide.evaluate((el) => el.remove())
      // Horizontal scrolling on the phone is a layout bug
      const overflow = await overflowPx(page)
      if (overflow > 0) problems.push(`${vp} ${tab}: page is ${overflow}px wider than the screen`)
      console.log(file)
    }
    await context.close()
  }
} finally {
  await browser.close()
  await server.close()
}
if (problems.length) {
  console.log(`\nProblems:\n${problems.join('\n')}`)
  process.exitCode = 1
}
