import { auth } from '$lib/server/auth';
import type { Handle } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { user } from '$lib/server/db/schema/users';
import { eq } from 'drizzle-orm';
import { preloadCategories } from '$lib/shared/utils/i18n';  // ← ДОБАВИТЬ

const PLAYER_MISSING_COOKIE = '__Secure-player-missing';
const LOCALE_COOKIE = 'locale';
const isProd = process.env.NODE_ENV === 'production';

function detectLocale(headers: Headers, cookies: { get: (name: string) => string | undefined }): 'ru' | 'en' {
  // Check cookie first
  const cookieLocale = cookies.get(LOCALE_COOKIE);
  if (cookieLocale === 'ru' || cookieLocale === 'en') {
    return cookieLocale;
  }

  // Parse accept-language header - prioritize Russian
  const acceptLang = headers.get('accept-language');
  if (acceptLang) {
    const langs = acceptLang.split(',').map((l) => l.trim().toLowerCase());
    
    // Check if Russian is present ANYWHERE in the list
    const hasRussian = langs.some((l) => l.startsWith('ru'));
    if (hasRussian) return 'ru';
  }

  return 'ru'; // Default to Russian
}

export const handle: Handle = async ({ event, resolve }) => {
  // 📦 Preload category translations on server start
  await preloadCategories();

  event.locals.locale = detectLocale(event.request.headers, event.cookies);

  try {
    const session = await auth.api.getSession({
      headers: event.request.headers,
    });

    if (session) {
      event.locals.session = session.session;
      event.locals.user = session.user;

      // Check cookie first — skip DB query if already cached
      const cached = event.cookies.get(PLAYER_MISSING_COOKIE);
      if (cached !== undefined) {
        event.locals.playerMissing = cached === '1';
      } else {
        // One-time DB lookup — cache result in cookie
        const [userRecord] = await getDb()
          .select({ playerMissing: user.playerMissing })
          .from(user)
          .where(eq(user.id, session.user.id))
          .limit(1);
        const playerMissing = userRecord?.playerMissing ?? false;
        event.locals.playerMissing = playerMissing;

        event.cookies.set(PLAYER_MISSING_COOKIE, playerMissing ? '1' : '0', {
          httpOnly: true,
          secure: isProd,
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 24 * 7, // 7 days — matches session lifetime
        });
      }
    } else {
      event.locals.session = null;
      event.locals.user = null;
      event.locals.playerMissing = false;
    }
  } catch {
    event.locals.session = null;
    event.locals.user = null;
    event.locals.playerMissing = false;
  }

  return resolve(event);
};