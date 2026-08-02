import { defineConfig } from 'vite'
import { readFileSync } from 'node:fs'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// App version — single source of truth is installer/VERSION.txt (falls back to
// package.json, then a literal). Exposed to the app as the global __APP_VERSION__.
function readAppVersion(): string {
  try {
    return readFileSync(new URL('../installer/VERSION.txt', import.meta.url), 'utf8').trim()
  } catch {
    try {
      return JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')).version
    } catch {
      return '0.0.0'
    }
  }
}

// DEV instance: backend runs on :5057, Vite dev server serves the SPA on :5056
// (boss-facing URL stays http://192.168.88.143:5056). All API/websocket traffic
// is proxied to the backend so the app calls the same origin it was served from.
const BACKEND = 'http://127.0.0.1:5057'
const apiProxy = {
  '/api': { target: BACKEND, changeOrigin: true },
  '/hubs': { target: BACKEND, changeOrigin: true, ws: true },
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    __APP_VERSION__: JSON.stringify(readAppVersion()),
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('@microsoft/signalr')) return 'signalr'
          if (id.includes('leaflet')) return 'leaflet'
          if (id.includes('qrcode')) return 'qrcode'
          if (id.includes('react-router')) return 'router'
          if (id.includes('i18next')) return 'i18n'
          if (id.includes('/react-dom/') || id.includes('/react/') || id.includes('scheduler')) return 'react'
          return 'vendor'
        },
      },
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5056,
    strictPort: true,
    allowedHosts: ['192.168.88.143', 'localhost'],
    proxy: apiProxy,
  },
  preview: {
    host: true,
    proxy: apiProxy,
  },
})
