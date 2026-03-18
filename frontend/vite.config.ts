import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/static/frontend/',
  plugins: [react()],
  build: {
    outDir: '../staticfiles/frontend',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/main.js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': 'http://127.0.0.1:8000',
      '/accounts': 'http://127.0.0.1:8000',
      '/static/core': 'http://127.0.0.1:8000',
      '/admin': 'http://127.0.0.1:8000',
      '/p/': 'http://127.0.0.1:8000',
      '/join/': 'http://127.0.0.1:8000',
      '^/$': 'http://127.0.0.1:8000',
      '^/documents': 'http://127.0.0.1:8000',
    },
  },
})
