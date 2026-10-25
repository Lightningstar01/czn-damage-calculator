import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// base './' so the built site works from any folder (e.g. GitHub Pages)
export default defineConfig({
  base: './',
  plugins: [react()],
})
