/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Project Pages URL: https://sarelmausner-code.github.io/psycho-percent-game/
export default defineConfig({
  base: '/psycho-percent-game/',
  plugins: [react()],
  test: {
    environment: 'node',
  },
})
