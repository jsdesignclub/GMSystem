import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/GMSystem/',
  plugins: [react()],
  server: {
    host: true,
  },
})
