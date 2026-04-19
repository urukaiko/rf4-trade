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

  // Find the buyer player record
  const [buyerRecord] = await db
    .select()
    .from(player)
    .where(eq(player.userId, locals.user.id))
    .limit(1);

  if (!buyerRecord) {
    return apiError('PLAYER_NOT_FOUND', 'Player record not found', 404);
  }

  // Find the trade and verify it's active
  const [existingTrade] = await db
    .select()
    .from(trade)
    .where(eq(trade.id, tradeId))
    .limit(1);

  if (!existingTrade) {
    return apiError('TRADE_NOT_FOUND', 'Trade not found', 404);
  }

  if (existingTrade.status !== TradeStatus.ACTIVE) {
    return apiError('TRADE_NOT_ACTIVE', 'Trade is not active', 409);
  }

  if (existingTrade.sellerId === buyerRecord.id) {
    return apiError('CANNOT_ACCEPT_OWN_TRADE', 'You cannot accept your own trade', 400);
  }

  // Check stock available
  if (existingTrade.stock <= 0) {
    return apiError('NO_STOCK', 'Trade has no stock remaining', 409);
  }

  // Decrement stock by 1 (atomic: only if stock > 0)
  const result = await db
    .update(trade)
    .set({ stock: existingTrade.stock - 1 })
    .where(and(eq(trade.id, tradeId), eq(trade.status, TradeStatus.ACTIVE)))
    .returning();

  if (result.length === 0) {
    return apiError('TRADE_UNAVAILABLE', 'Trade is no longer available', 409);
  }

  // TODO: In a full implementation, create a deal/transaction record
  // and notify the seller. For now, decrement stock and return success.

  return json({ success: true, message: 'Trade accepted', trade: result[0] });
};
