import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const proxy = {
  '/api/data-go': {
    target: 'https://data.go.th',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api\/data-go/, '/api/3/action'),
  },
  '/api/open-meteo': {
    target: 'https://api.open-meteo.com',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api\/open-meteo/, ''),
  },
  '/api/nasa-power': {
    target: 'https://power.larc.nasa.gov',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api\/nasa-power/, '/api'),
  },
}

export default defineConfig({
  plugins: [react()],
  server: { proxy },
  preview: { proxy },
})
