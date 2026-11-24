import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Forward /api calls to the PHP dev server (php -S localhost:8000 router.php)
    proxy: {
      '/api': 'http://localhost:8000',
    },
  },
})
