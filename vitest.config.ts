import { svelte } from '@sveltejs/vite-plugin-svelte';
import { svelteTesting } from '@testing-library/svelte/vite';
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  plugins: [
    svelte({
      hot: false,
      configFile: './svelte.config.js',
    }),
    svelteTesting(),
  ],
  resolve: {
    conditions: ['browser'],
    alias: {
      $lib: path.resolve('./src/lib'),
      '$env/dynamic/private': path.resolve('./tests/mocks/env-dynamic-private.ts'),
    },
  },
  test: {
    globals: false,
    include: ['src/**/__tests__/**/*.test.{js,ts}'],
    testTimeout: 5000,
    environment: 'happy-dom',
    setupFiles: ['./tests/setup/vitest.ts'],
  },
});
