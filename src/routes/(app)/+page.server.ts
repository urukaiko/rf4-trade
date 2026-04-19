import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

/** Root of (app) group — redirect to /trade, preserving query params. */
export const load: PageServerLoad = async ({ url }) => {
  const search = url.search;
  throw redirect(302, `/trade${search}`);
};
