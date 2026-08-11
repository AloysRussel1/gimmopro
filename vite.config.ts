/// <reference types="vitest" />

import legacy from '@vitejs/plugin-legacy'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    legacy()
  ],
  server: {
    // Fixé sur 127.0.0.1 (pas juste "localhost", qui peut résoudre en IPv6
    // et écouter uniquement sur ::1 selon la config réseau) -- le backend
    // Django local tourne aussi sur 127.0.0.1:8000 (voir .env.local), et les
    // cookies d'authentification (SameSite) exigent que frontend et backend
    // soient vus par le navigateur sous le MÊME hôte en dev. Ouvrir
    // http://127.0.0.1:5173 (pas http://localhost:5173) en local.
    host: '127.0.0.1',
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
  }
})
