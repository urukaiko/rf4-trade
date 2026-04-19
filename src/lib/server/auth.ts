import { betterAuth } from 'better-auth';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { getRequestEvent } from '$app/server';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { getDb } from '$lib/server/db';
import * as schema from '$lib/server/db/schema';
import { logger } from '$lib/server/logger';
import { eq } from 'drizzle-orm';

interface UserBasic {
  id: string;
  name: string;
}

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.NODE_ENV === 'production'
    ? (process.env.BETTER_AUTH_URL || process.env.ORIGIN)
    : process.env.BETTER_AUTH_URL || 'http://localhost:5173',
  trustedOrigins:
    process.env.NODE_ENV === 'development'
      ? ['*']
      : [process.env.BETTER_AUTH_URL || process.env.ORIGIN || 'http://localhost:3000'],
  cookies: {
    sessionToken: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7,
      sameSite: 'lax',
    },
  },
  database: drizzleAdapter(getDb(), {
    provider: 'pg',
    schema,
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    async sendResetPassword(data) {
      // DEV ONLY: log reset URL instead of sending email
      if (process.env.NODE_ENV === 'development') {
        logger.info('AUTH_PASSWORD_RESET', 'Password reset URL', { url: data.url });
        return;
      }
      // Production: implement actual email sending here
    },
  },
  plugins: [sveltekitCookies(getRequestEvent)],
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          const db = getDb();
          const basicUser = user as unknown as UserBasic;
          let displayName = basicUser.name?.trim() || `Player_${basicUser.id.slice(0, 8)}`;

          for (let attempt = 0; attempt < 3; attempt++) {
            try {
              await db.insert(schema.player).values({
                userId: user.id,
                displayName,
              });
              return;
            } catch (err) {
              const pgErr = err as { code?: string };
              if (pgErr.code === '23505') {
                // Duplicate display name — retry with random suffix
                displayName += `_${Math.random().toString(36).slice(2, 7)}`;
                continue;
              }
              // Other error — log and retry once more
              logger.error('AUTH_PLAYER_CREATE_RETRY', `Player creation attempt ${attempt + 1} failed for user ${user.id}`, err);
            }
          }

          // All retries exhausted — flag user and log
          logger.error('AUTH_PLAYER_CREATE_FAILED', `Player not created after 3 retries for user ${user.id}`, { displayName });
          try {
            await db.update(schema.user).set({ playerMissing: true }).where(eq(schema.user.id, user.id));
          } catch (updateErr) {
            logger.error('AUTH_PLAYER_MISSING_FLAG', `Failed to set playerMissing flag for user ${user.id}`, updateErr);
          }
        },
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;