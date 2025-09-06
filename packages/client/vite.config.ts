import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  preview: {
    allowedHosts: ['aichat.dishyy.com'],
  },
  // server: {
  //   proxy: {
  //     '/api': process.env.VITE_API_URL || 'http://localhost:3000',
  //   },
  // },
})
