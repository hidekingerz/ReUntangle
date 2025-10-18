import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    // Use jsdom environment for React component testing
    environment: 'jsdom',

    // Setup files to run before tests
    setupFiles: ['./vitest.setup.ts'],

    // Global test utilities (like Jest's globals)
    globals: true,

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        '.next/',
        'out/',
        'dist/',
        '**/*.config.*',
        '**/*.setup.*',
        '**/types/**',
      ],
    },

    // Include test files
    include: ['src/**/*.{test,spec}.{ts,tsx}'],

    // Exclude patterns
    exclude: [
      'node_modules',
      '.next',
      'out',
      'dist',
      'build',
    ],
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
