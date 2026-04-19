// Vite configuration for SvelteKit + UnoCSS
import { sveltekit } from '@sveltejs/kit/vite';
import UnoCSS from '@unocss/svelte-scoped/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    UnoCSS(),
    sveltekit(),
  ],

  server: {
    // Allow Docker to reach the dev server
    host: '0.0.0.0',
    port: 5173,
    strictPort: false,
    // Watch all files for hot-reload in development
    watch: {
      // Enable polling on Windows for reliable file change detection
      usePolling: true,
      interval: 300,
    },
    hmr: {
      protocol: 'ws',
      port: 5173,
    },
  },
});
