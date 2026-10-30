// Used by the browser tests and scripts/screenshot.mjs (which Node runs directly, so erasable TypeScript only).
import type { BrowserContext, Page } from 'playwright'
import { STORAGE_KEY } from '../src/store/storageKey.ts'

/** Puts a save in the browser's storage. Only on the first load, so a reload shows what the site saved. */
export async function loadSaveOnce(target: Page | BrowserContext, save: string) {
  await target.addInitScript(([key, text]) => {
    if (!sessionStorage.getItem('save-loaded')) {
      localStorage.setItem(key, text)
      sessionStorage.setItem('save-loaded', '1')
    }
  }, [STORAGE_KEY, save])
}

/**
 * How many px the page is wider than the screen. Not window.innerWidth: on a phone it grows with the content,
 * so it would always say 0.
 */
export function overflowPx(page: Page): Promise<number> {
  return page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
}
