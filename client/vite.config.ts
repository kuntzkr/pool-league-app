import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000', // Your Express server address
        changeOrigin: true, // Needed for virtual hosted sites
        secure: false,      // Optional: Set to false if your backend isn't HTTPS (likely in dev)
        // Optionally rewrite path if needed, but often not necessary if backend routes start with /api
        // rewrite: (path) => path.replace(/^\/api/, '')
      },
      '/auth/google': {
         target: 'http://localhost:3000',
         changeOrigin: true,
         secure: false,
      }
      // Note: /auth/google/callback is handled by browser redirects, proxy not directly involved there.
      // Note: /api/auth/logout is covered by the /api proxy rule above.
    }
  }
})