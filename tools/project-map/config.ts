import type { ProjectMapConfig } from './types';

/**
 * Default configuration.
 * 
 * Keep it simple - no file reading, no CLI args.
 * Just values we can change here when needed.
 */
export const config: ProjectMapConfig = {
  // Paths
  rootDir: '.',
  outputFile: 'project-map.txt',
  
  // What to skip
  excludeDirs: new Set([
    '.git',
    '.qwen', 
    '.svelte-kit',
    '.next',
    '.nuxt',
    '.turbo',
    'build',
    'dist',
    'node_modules',
    '.cache',
    'tools',
  ]),
  
  excludeFiles: new Set([
    'bun.lock',
    'project-map.txt',
  ]),
  
  extensions: new Set([
    '.ts', '.tsx', '.js', '.jsx', '.svelte',
    '.mts', '.cts', '.mjs', '.cjs',
  ]),
  
  // Config files that only have unhelpful default exports
  configFileNames: new Set([
    'drizzle.config.ts',
    'playwright.config.ts',
    'svelte.config.js',
    'svelte.config.ts',
    'uno.config.ts',
    'vite.config.js',
    'vite.config.ts',
    'vitest.config.ts',
    'tailwind.config.ts',
    'postcss.config.js',
    'eslint.config.js',
    'webpack.config.js',
    'rollup.config.js',
  ]),
  
  // Display limits
  maxSignatureLength: 70,
  maxMembersDisplay: 5,
  constantsCollapseThreshold: 8,
  svelteGroupThreshold: 5,
};