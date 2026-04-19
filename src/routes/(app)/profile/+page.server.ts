import { redirect, fail, type Actions } from '@sveltejs/kit';
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

  // If player record missing, redirect to fix page
  if (!playerRecord) {
    throw redirect(302, '/profile/fix');
  }

  return {
    user: locals.user,
    player: playerRecord,
  };
};

export const actions: Actions = {
  updateDisplayName: async ({ request, locals }) => {
    if (!locals.user) {
      return fail(401, { error: 'Unauthorized' });
    }

    const formData = await request.formData();
    const displayName = formData.get('displayName') as string;

    if (!displayName || displayName.trim().length < 1 || displayName.trim().length > 50) {
      return fail(400, { error: 'Game nickname must be 1-50 characters' });
    }

    const db = getDb();

    try {
      const result = await db
        .update(player)
        .set({ displayName: displayName.trim() })
        .where(eq(player.userId, locals.user.id));

      // If no rows updated, player doesn't exist — redirect to fix
      if (!result || result.count === 0) {
        throw redirect(302, '/profile/fix');
      }
    } catch (err) {
      if (err instanceof Error && 'code' in err && (err as any).code === '23505') {
        return fail(400, { error: 'Display name already taken' });
      }
      return fail(500, { error: 'Failed to update display name' });
    }

    return { success: true };
  },
};