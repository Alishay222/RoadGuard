import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    // Allow requests from any host (useful for ngrok and remote tunnels)
    // Note: setting this to 'all' relaxes host header checks in the dev server.
    allowedHosts: true,
  },
})

