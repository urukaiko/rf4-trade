import { redirect, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getDb } from '$lib/server/db';
import { player } from '$lib/server/db/schema/players';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) {
    throw redirect(302, '/login');
  }

  const db = getDb();
  const [playerRecord] = await db
    .select()
    .from(player)
    .where(eq(player.userId, locals.user.id))
    .limit(1);

  // If player already exists, redirect to profile
  if (playerRecord) {
    throw redirect(302, '/profile');
  }

  return {
    user: locals.user,
  };
};

export const actions: Actions = {
  create: async ({ request, locals }) => {
    if (!locals.user) {
      return { error: 'Unauthorized' };
    }

    const formData = await request.formData();
    const displayName = formData.get('displayName') as string;

    if (!displayName || displayName.trim().length < 3 || displayName.trim().length > 50) {
      return { error: 'Display name must be 3-50 characters' };
    }

    // Allow Cyrillic, Latin, spaces, hyphens
    if (!/^[\p{L}\p{N} \-]+$/u.test(displayName.trim())) {
      return { error: 'Display name can only contain letters, numbers, spaces, and hyphens' };
    }

    const db = getDb();

    try {
      await db
        .insert(player)
        .values({
          userId: locals.user.id,
          displayName: displayName.trim(),
        });
    } catch (err) {
      if (err instanceof Error && 'code' in err && (err as any).code === '23505') {
        return { error: 'Display name already taken' };
      }
      return { error: 'Failed to create profile' };
    }

    throw redirect(302, '/profile');
  },
};
