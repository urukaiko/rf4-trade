import { createAuthClient } from 'better-auth/svelte';
import { usernameClient } from 'better-auth/client/plugins';

export const authClient = createAuthClient({
  baseURL: typeof window !== 'undefined' ? window.location.origin : (import.meta.env.VITE_BETTER_AUTH_URL ?? 'http://localhost:5173'),
  plugins: [usernameClient()],
});
