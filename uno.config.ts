// UnoCSS configuration — scoped mode for Svelte
import {
  defineConfig,
  presetAttributify,
  presetUno,
} from 'unocss';

export default defineConfig({
  content: {
    filesystem: ['src/**/*.{html,js,svelte,ts}'],
  },
  presets: [
    presetUno({
      dark: 'class',
    }),
    presetAttributify(),
  ],
  theme: {
    colors: {
      brand: {
        50: '#eef9ff',
        100: '#d8f1ff',
        200: '#b9e6ff',
        300: '#8ad6ff',
        400: '#54c1fe',
        500: '#2fa5f0',
        600: '#1c86d7',
        700: '#176db5',
        800: '#195b95',
        900: '#1a4c7a',
        950: '#11304f',
      },
      danger: {
        50: '#fef2f2',
        100: '#fee2e2',
        200: '#fecaca',
        300: '#fca5a5',
        400: '#f87171',
        500: '#ef4444',
        600: '#dc2626',
        700: '#b91c1c',
        800: '#991b1b',
        900: '#7f1d1d',
        950: '#450a0a',
      },
      success: {
        50: '#f0fdf4',
        100: '#dcfce7',
        200: '#bbf7d0',
        300: '#86efac',
        400: '#4ade80',
        500: '#22c55e',
        600: '#16a34a',
        700: '#15803d',
        800: '#166534',
        900: '#14532d',
        950: '#052e16',
      },
    },
  },
});