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
    // Allow access from other devices (ZeroTier, LAN) in dev
    // Not needed when running inside Docker — ports are mapped via compose
    host: process.env.VITE_HOST || 'localhost',
    port: 5173,
    strictPort: false,
    // Polling is needed on Windows for reliable file change detection
    // via WSL2 / Docker. Not needed on Linux/macOS (wastes CPU).
    watch: {
      usePolling: process.platform === 'win32',
      interval: 300,
    },
  },
});