/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Served from https://jlrigau.github.io/alibi/ on GitHub Pages.
export default defineConfig({
  base: '/alibi/',
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
