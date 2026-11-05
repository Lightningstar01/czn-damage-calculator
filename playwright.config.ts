// Browser tests (npm run test:e2e): the built site, as the owner plays it: on an Android phone and on desktop.
import { defineConfig, devices } from 'playwright/test'

const PORT = 4173
// Served from a folder, as GitHub Pages does (lightningstar01.github.io/czn-damage-calculator/): a path that only works at / fails here
const PATH = '/czn-damage-calculator/'

export default defineConfig({
  testDir: 'e2e',
  testMatch: '*.e2e.ts', // not *.test.ts or *.spec.ts: Vitest would run those too
  outputDir: 'test-results',
  reporter: 'list',
  forbidOnly: !!process.env.CI,
  // en-US: numbers and dates read the same on every PC (the owner's and GitHub's)
  use: { baseURL: `http://localhost:${PORT}${PATH}`, locale: 'en-US', screenshot: 'only-on-failure' },
  webServer: { command: `npx vite preview --port ${PORT} --strictPort --base ${PATH}`, url: `http://localhost:${PORT}${PATH}` },
  projects: [
    { name: 'phone', use: devices['Pixel 10'] },
    { name: 'desktop', use: { viewport: { width: 1280, height: 900 } } },
  ],
})
