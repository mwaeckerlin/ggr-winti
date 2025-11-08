import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Ensure WASM assets inside dependencies are served with correct MIME type
  assetsInclude: ['**/*.wasm'],
  optimizeDeps: {
    // Exclude bzip2-wasm so its internal dynamic URL to the wasm file is preserved at runtime
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
