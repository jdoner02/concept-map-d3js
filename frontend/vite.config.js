import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite config tuned for CI/E2E stability
export default defineConfig({
  plugins: [react()],
  // Auto-detect GitHub Pages project base when building in CI
  // For jdoner02/concept-map-d3js, base becomes "/concept-map-d3js/"
  base: process.env.GITHUB_REPOSITORY ? `/${process.env.GITHUB_REPOSITORY.split('/')[1]}/` : '/',
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    proxy: {
      // Forward API calls to the Spring Boot backend during local dev
      '/api': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
        // Keep path as-is
        rewrite: (path) => path,
      },
    },
  },
  preview: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
        rewrite: (path) => path,
      },
    },
  },
})
