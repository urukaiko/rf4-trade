import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { player } from '$lib/server/db/schema/players';
import { trade } from '$lib/server/db/schema/trade';
import { item } from '$lib/server/db/schema/items';
import { eq, desc, inArray, and, count } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { TradeStatus } from '$lib/shared/constants';
import { resolveName } from '$lib/shared/utils/i18n';
import { safeParse } from 'valibot';
import { CreateTradeInputSchema } from '$lib/shared/validation/trade';
import { apiError } from '$lib/server/api';

// ────────────────────────────────────────────────────────────
// GET /api/trades — Paginated trade listing (JSON)
// Query params: page, offer_items, want_items
// ────────────────────────────────────────────────────────────
export const GET: RequestHandler = async ({ locals, url }) => {
  const db = getDb();

  // Pagination
  const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
  const limit = 50;
  const offset = (page - 1) * limit;

  // Filter params (same logic as +page.server.ts)
  const offerItemsParam = url.searchParams.get('offer_items');
  const wantItemsParam = url.searchParams.get('want_items');
  const offerItemIds = offerItemsParam ? offerItemsParam.split(',').map(Number) : null;
  const wantItemIds = wantItemsParam ? wantItemsParam.split(',').map(Number) : null;

  const conditions = [eq(trade.status, TradeStatus.ACTIVE)];

  if (offerItemIds && offerItemIds.length > 0) {
    conditions.push(inArray(trade.wantItemId, offerItemIds));
  }

  if (wantItemIds && wantItemIds.length > 0) {
    conditions.push(inArray(trade.offerItemId, wantItemIds));
  }

  const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0];

  // Aliases for joined item tables
  const offerItem = alias(item, 'offer_item');
  const wantItem = alias(item, 'want_item');

  // Total count for pagination
  const countResult = await db
    .select({ total: count() })
    .from(trade)
    .where(whereClause);
  const total = countResult[0]?.total ?? 0;

  // Paginated rows
  const rows = await db
    .select({
      trade,
      offerItem: offerItem,
      wantItem: wantItem,
      seller: player,
    })
    .from(trade)
    .innerJoin(player, eq(trade.sellerId, player.id))
    .innerJoin(offerItem, eq(trade.offerItemId, offerItem.id))
    .innerJoin(wantItem, eq(trade.wantItemId, wantItem.id))
    .where(whereClause)
    .orderBy(desc(trade.createdAt))
    .limit(limit)
    .offset(offset);

  const locale = (locals.locale as string) || 'en';

  const mappedTrades = rows.map((row) => ({
    id: row.trade.id,
    sellerId: row.seller.id,
    seller: { displayName: row.seller.displayName },
    offer: {
      name: resolveName(row.offerItem.translations, locale, row.offerItem.code),
      quantity: Number(row.trade.offerQuantity),
      code: row.offerItem.code,
      imageUrl: row.offerItem.imageUrl,
    },
    want: {
      name: resolveName(row.wantItem.translations, locale, row.wantItem.code),
      quantity: Number(row.trade.wantQuantity),
      code: row.wantItem.code,
      imageUrl: row.wantItem.imageUrl,
    },
    stock: row.trade.stock,
    createdAt: row.trade.createdAt,
  }));

  return json({
    trades: mappedTrades,
    hasMore: total > page * limit,
  });
};

// ────────────────────────────────────────────────────────────
// POST /api/trades — Create a new trade
// ────────────────────────────────────────────────────────────
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