import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [tailwindcss(), react()],
  server: {
    host: true, // 👈 ensures Vite binds to 0.0.0.0
    allowedHosts: [
      '.ngrok-free.app',   // allow ngrok free domains
      'localhost'
    ]
  }
})
