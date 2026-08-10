import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const proxy = {
  '/api/open-meteo': {
    target: 'https://api.open-meteo.com',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api\/open-meteo/, ''),
  },
  '/api/oae-farmplus': {
    target: 'https://farmgateprice.nabc.go.th',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api\/oae-farmplus/, '/api/v1/public'),
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
