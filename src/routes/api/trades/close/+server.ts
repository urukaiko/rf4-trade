import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { player } from '$lib/server/db/schema/players';
import { trade } from '$lib/server/db/schema/trade';
import { eq, and } from 'drizzle-orm';
import { TradeStatus } from '$lib/shared/constants';
import { apiError } from '$lib/server/api';

export const POST: RequestHandler = async ({ locals, request }) => {
  if (!locals.session) {
    return apiError('UNAUTHORIZED', 'Authentication required', 401);
  }

  const body = await request.json();
  const { tradeId } = body as Record<string, unknown>;

  if (typeof tradeId !== 'string') {
    return apiError('INVALID_TRADE_ID', 'Trade ID must be a string', 400);
  }

  if (!locals.user) {
    return apiError('UNAUTHORIZED', 'Authentication required', 401);
  }

  const db = getDb();

  // Find the player record for the current user
  const [playerRecord] = await db
    .select()
    .from(player)
    .where(eq(player.userId, locals.user.id))
    .limit(1);

  if (!playerRecord) {
    return apiError('PLAYER_NOT_FOUND', 'Player record not found', 404);
  }

  // Find the trade and verify ownership
  const [existingTrade] = await db
    .select()
    .from(trade)
    .where(and(eq(trade.id, tradeId), eq(trade.sellerId, playerRecord.id)))
    .limit(1);

  if (!existingTrade) {
    return apiError('TRADE_NOT_FOUND', 'Trade not found or you do not have permission to close it', 403);
  }

  // Update trade status to 'closed' (atomic: only if still active)
  const result = await db
    .update(trade)
    .set({ status: TradeStatus.CLOSED })
    .where(and(eq(trade.id, tradeId), eq(trade.status, TradeStatus.ACTIVE)))
    .returning();

  if (result.length === 0) {
    return apiError('TRADE_ALREADY_CLOSED', 'Trade is not active or has already been closed', 409);
  }

  const [updatedTrade] = result;

  return json({ success: true, message: 'Trade closed successfully', trade: updatedTrade });
};
