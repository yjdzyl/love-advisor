import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  base: '/love-advisor/',
  plugins: [vue()],
  resolve: {
    alias: {
      '@': '/src'
    }
  }
})
