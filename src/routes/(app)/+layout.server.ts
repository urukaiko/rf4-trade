import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url }) => {
  // Redirect users with missing player record to fix page
  if (locals.playerMissing && url.pathname !== '/profile/fix') {
    throw redirect(302, '/profile/fix');
  }

  return { user: locals.user, locale: locals.locale };
};
