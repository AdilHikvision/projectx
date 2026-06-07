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

const apiProxy = {
  '/api': { target: 'http://127.0.0.1:5154', changeOrigin: true },
  '/hubs': { target: 'http://127.0.0.1:5154', changeOrigin: true, ws: true },
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
        // Split large third-party libs into their own cacheable chunks so the
        // main bundle stays small and rarely-used libs (maps, qr) load on demand.
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('@microsoft/signalr')) return 'signalr'
          if (id.includes('leaflet')) return 'leaflet' // also matches react-leaflet
          if (id.includes('qrcode')) return 'qrcode'
          if (id.includes('react-router')) return 'router'
          if (id.includes('i18next')) return 'i18n'
          if (id.includes('/react-dom/') || id.includes('/react/') || id.includes('scheduler')) return 'react'
          return 'vendor'
        },
      },
    },
  },
  // host: true — все интерфейсы (доступ с LAN по IP сервера). Порт 80 на Windows часто нужны права администратора.
  server: {
    host: true,
    port: 5173,
    strictPort: false,
    proxy: apiProxy,
  },
  preview: {
    host: true,
    proxy: apiProxy,
  },
})
