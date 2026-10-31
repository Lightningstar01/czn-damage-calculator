import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// base './' so the built site works from any folder (e.g. GitHub Pages)
export default defineConfig({
  base: './',
  plugins: [react()],
  // Vitest's module cache keeps the import.meta.glob results, so a new characters/*.ts file wouldn't be seen
  test: { fsModuleCache: false },
})
