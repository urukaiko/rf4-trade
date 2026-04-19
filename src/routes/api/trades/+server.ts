import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { player } from '$lib/server/db/schema/players';
import { trade } from '$lib/server/db/schema/trade';
import { eq } from 'drizzle-orm';
import { safeParse } from 'valibot';
import { CreateTradeInputSchema } from '$lib/shared/validation/trade';
import { apiError } from '$lib/server/api';

export const POST: RequestHandler = async ({ locals, request }) => {
  if (!locals.session) {
    return apiError('UNAUTHORIZED', 'Authentication required', 401);
  }

  const body = await request.json();

  // Validate input with Valibot
  const result = safeParse(CreateTradeInputSchema, body);
  if (!result.success) {
    return apiError('VALIDATION_FAILED', result.issues.map((i) => i.message).join(', '), 400);
  }

  const { offerItemId, offerQuantity, wantItemId, wantQuantity, stock } = result.output;

  // Default stock to offerQuantity if not provided
  const stockValue = stock ?? offerQuantity;

  if (offerItemId === wantItemId) {
    return apiError('INVALID_TRADE', 'Cannot trade an item for itself', 400);
  }

  if (!locals.user) {
    return apiError('UNAUTHORIZED', 'Authentication required', 401);
  }

  const db = getDb();

  const [playerRecord] = await db
    .select()
    .from(player)
    .where(eq(player.userId, locals.user.id))
    .limit(1);

  if (!playerRecord) {
    return apiError('PLAYER_NOT_FOUND', 'Player record not found', 404);
  }

  const [newTrade] = await db
    .insert(trade)
    .values({
      sellerId: playerRecord.id,
      offerItemId: offerItemId,
      offerQuantity: String(offerQuantity),
      wantItemId: wantItemId,
      wantQuantity: String(wantQuantity),
      stock: stockValue,
    })
    .returning();

  if (!newTrade) {
    return apiError('INTERNAL_ERROR', 'Failed to create trade', 500);
  }

  // Convert numeric strings to numbers (Drizzle numeric returns string from postgres-js)
  const sanitized = {
    ...newTrade,
    offerQuantity: Number(newTrade.offerQuantity),
    wantQuantity: Number(newTrade.wantQuantity),
  };

  return json(sanitized, { status: 201 });
};
