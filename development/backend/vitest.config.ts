import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.test.ts'],
    exclude: ['node_modules/**', 'dist/**'],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
