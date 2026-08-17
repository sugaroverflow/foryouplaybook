import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // Mirror the Vercel rewrites so share links work in dev too.
    proxy: {
      '/c': 'http://localhost:3000',
      '/card': 'http://localhost:3000',
    },
  },
})
