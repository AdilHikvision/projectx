import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // host: true — все интерфейсы (доступ с LAN по IP сервера). Порт 80 на Windows часто нужны права администратора.
  server: {
    host: true,
    port: 80,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5154',
        changeOrigin: true,
      },
      '/hubs': {
        target: 'http://127.0.0.1:5154',
        changeOrigin: true,
        ws: true,
      },
    },
  },
  preview: {
    host: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5154',
        changeOrigin: true,
      },
      '/hubs': {
        target: 'http://127.0.0.1:5154',
        changeOrigin: true,
        ws: true,
      },
    },
  },
})
