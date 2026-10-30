// Browser tests (npm run test:e2e): the built site, as the owner plays it: on an Android phone and on desktop.
import { defineConfig, devices } from 'playwright/test'

const PORT = 4173

export default defineConfig({
  testDir: 'e2e',
  testMatch: '*.e2e.ts', // not *.test.ts or *.spec.ts: Vitest would run those too
  outputDir: 'test-results',
  reporter: 'list',
  forbidOnly: !!process.env.CI,
  use: { baseURL: `http://localhost:${PORT}`, screenshot: 'only-on-failure' },
  webServer: { command: `npx vite preview --port ${PORT} --strictPort`, url: `http://localhost:${PORT}` },
  projects: [
    { name: 'phone', use: devices['Pixel 10'] },
    { name: 'desktop', use: { viewport: { width: 1280, height: 900 } } },
  ],
})
