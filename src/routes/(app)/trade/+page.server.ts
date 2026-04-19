import type { PageServerLoad } from './$types';
import { getDb } from '$lib/server/db';
import { item } from '$lib/server/db/schema/items';
import { trade } from '$lib/server/db/schema/trade';
import { player } from '$lib/server/db/schema/players';
import { eq, desc, inArray, and, count } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { TradeStatus } from '$lib/shared/constants';
import type { TradeView } from '$lib/shared/types/trade';
import { resolveName } from '$lib/shared/utils/i18n';

export type ItemByCategory = Record<string, typeof item.$inferSelect[]>;

const offerItem = alias(item, 'offer_item');
const wantItem = alias(item, 'want_item');

export const load: PageServerLoad = async ({ locals, url }) => {
  const db = getDb();

  // Pagination params
  const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
  const limit = 50;
  const offset = (page - 1) * limit;

  // Fetch items (needed for both categories and trade display)
  const allItems = await db.select().from(item);

  // Group items by category
  const itemsByCategory: ItemByCategory = {};
  for (const i of allItems) {
    const cat = itemsByCategory[i.category];
    if (cat) cat.push(i);
    else itemsByCategory[i.category] = [i];
  }

  // Parse filter params for search
  const offerItemsParam = url.searchParams.get('offer_items');
  const wantItemsParam = url.searchParams.get('want_items');
  const offerItemIds = offerItemsParam ? offerItemsParam.split(',').map(Number) : null;
  const wantItemIds = wantItemsParam ? wantItemsParam.split(',').map(Number) : null;

  // Execute independent queries in parallel
  const [tradesResult, playerRecord] = await Promise.all([
    // Fetch active trades with seller and item details (paginated)
    (async () => {
      const conditions = [eq(trade.status, TradeStatus.ACTIVE)];
      
      if (offerItemIds && offerItemIds.length > 0) {
        conditions.push(inArray(trade.wantItemId, offerItemIds));
      }
      
      if (wantItemIds && wantItemIds.length > 0) {
        conditions.push(inArray(trade.offerItemId, wantItemIds));
      }

      const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0];

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

      const mappedTrades = rows.map((row) => ({
        id: row.trade.id,
        sellerId: row.seller.id,
        seller: { displayName: row.seller.displayName },
        offer: { name: resolveName(row.offerItem.translations, locals.locale, row.offerItem.code), quantity: Number(row.trade.offerQuantity), code: row.offerItem.code, imageUrl: row.offerItem.imageUrl },
        want: { name: resolveName(row.wantItem.translations, locals.locale, row.wantItem.code), quantity: Number(row.trade.wantQuantity), code: row.wantItem.code, imageUrl: row.wantItem.imageUrl },
        stock: row.trade.stock,
        createdAt: row.trade.createdAt,
      }));

      return {
        trades: mappedTrades,
        totalTrades: mappedTrades.length,
        hasMore: total > page * limit,
      };
    })(),

    // Lookup current user's player ID (if authenticated)
    locals.user
      ? db
          .select({ id: player.id })
          .from(player)
          .where(eq(player.userId, locals.user.id))
          .limit(1)
          .then(([record]) => record ?? null)
      : Promise.resolve(null),
  ]);

  return {
    itemsByCategory,
    user: locals.user,
    trades: tradesResult.trades,
    totalTrades: tradesResult.totalTrades,
    userPlayerId: playerRecord?.id ?? null,
    locale: locals.locale,
    hasMore: tradesResult.hasMore,
  };
};
