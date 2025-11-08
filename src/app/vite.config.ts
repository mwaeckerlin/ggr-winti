import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['bzip2-wasm']
  },
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
})
