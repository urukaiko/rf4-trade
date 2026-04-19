import type { PageServerLoad } from './$types';
import { getDb } from '$lib/server/db';
import { item } from '$lib/server/db/schema/items';
import { trade } from '$lib/server/db/schema/trade';
import { player } from '$lib/server/db/schema/players';
import { eq, and, desc } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { TradeStatus } from '$lib/shared/constants';
import { resolveName } from '$lib/shared/utils/i18n';
import { error } from '@sveltejs/kit';

const offerItem = alias(item, 'offer_item');
const wantItem = alias(item, 'want_item');

export const load: PageServerLoad = async ({ params, locals }) => {
  const db = getDb();
  const itemId = Number(params.id);

  if (isNaN(itemId)) {
    throw error(400, 'Invalid item ID');
  }

  // Fetch item details
  const [itm] = await db.select().from(item).where(eq(item.id, itemId)).limit(1);

  if (!itm) {
    throw error(404, 'Item not found');
  }

  // Fetch active trades offering this item
  const tradesOffering = await db
    .select({
      id: trade.id,
      sellerId: trade.sellerId,
      sellerDisplayName: player.displayName,
      offerQuantity: trade.offerQuantity,
      wantQuantity: trade.wantQuantity,
      stock: trade.stock,
      wantItemId: trade.wantItemId,
      wantItemCode: wantItem.code,
      wantItemName: wantItem.translations,
      createdAt: trade.createdAt,
    })
    .from(trade)
    .innerJoin(player, eq(trade.sellerId, player.id))
    .innerJoin(wantItem, eq(trade.wantItemId, wantItem.id))
    .where(and(eq(trade.offerItemId, itemId), eq(trade.status, TradeStatus.ACTIVE)))
    .orderBy(desc(trade.createdAt))
    .limit(20);

  // Fetch active trades wanting this item
  const tradesWanting = await db
    .select({
      id: trade.id,
      sellerId: trade.sellerId,
      sellerDisplayName: player.displayName,
      offerQuantity: trade.offerQuantity,
      wantQuantity: trade.wantQuantity,
      stock: trade.stock,
      offerItemId: trade.offerItemId,
      offerItemCode: offerItem.code,
      offerItemName: offerItem.translations,
      createdAt: trade.createdAt,
    })
    .from(trade)
    .innerJoin(player, eq(trade.sellerId, player.id))
    .innerJoin(offerItem, eq(trade.offerItemId, offerItem.id))
    .where(and(eq(trade.wantItemId, itemId), eq(trade.status, TradeStatus.ACTIVE)))
    .orderBy(desc(trade.createdAt))
    .limit(20);

  return {
    item: {
      id: itm.id,
      code: itm.code,
      name: resolveName(itm.translations, locals.locale, itm.code),
      imageUrl: itm.imageUrl,
      category: itm.category,
      subCategory: itm.subCategory,
    },
    stats: null,
    tradesOffering: tradesOffering.map((t) => ({
      id: t.id,
      sellerDisplayName: t.sellerDisplayName,
      offerQuantity: Number(t.offerQuantity),
      wantQuantity: Number(t.wantQuantity),
      stock: t.stock,
      wantCode: t.wantItemCode,
      wantName: resolveName(t.wantItemName, locals.locale, t.wantItemCode),
      createdAt: t.createdAt.toString(),
    })),
    tradesWanting: tradesWanting.map((t) => ({
      id: t.id,
      sellerDisplayName: t.sellerDisplayName,
      offerQuantity: Number(t.offerQuantity),
      wantQuantity: Number(t.wantQuantity),
      stock: t.stock,
      offerCode: t.offerItemCode,
      offerName: resolveName(t.offerItemName, locals.locale, t.offerItemCode),
      createdAt: t.createdAt.toString(),
    })),
    locale: locals.locale,
  };
};
