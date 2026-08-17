import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // Mirror the Vercel rewrites so share links work in dev too. The regex
    // key matches /@username without catching Vite's internal /@vite/ paths.
    proxy: {
      '/c': 'http://localhost:3000',
      '/card': 'http://localhost:3000',
      // Regex keys: /s/ must not swallow /src/*, /@ must not catch /@vite/*.
      '^/s/[A-Za-z0-9_]+$': 'http://localhost:3000',
      '^/@[A-Za-z0-9_]+$': 'http://localhost:3000',
    },
  },
})
