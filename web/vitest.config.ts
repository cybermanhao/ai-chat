/// <reference types="vitest" />

import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/tests/**/*.test.ts', 'src/services/**/*.test.ts', 'src/store/**/*.test.ts'],
    setupFiles: ['src/tests/setup.ts'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/']
    },
    alias: [
      { find: '@', replacement: resolve(__dirname, './src') },
      { find: '@engine', replacement: resolve(__dirname, '../engine') }
    ]
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  }
});
