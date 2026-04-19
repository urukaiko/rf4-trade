/** Mock for $env/dynamic/private — exposes process.env as SvelteKit does in prod. */
export const env = process.env as Record<string, string | undefined>;
