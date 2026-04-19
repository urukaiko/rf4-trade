import type { PageServerLoad } from './$types';
import { getDb } from '$lib/server/db';
import { item } from '$lib/server/db/schema/items';
import { trade } from '$lib/server/db/schema/trade';
import { player } from '$lib/server/db/schema/players';
import { eq, and, desc, ne } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { TradeStatus } from '$lib/shared/constants';
import { resolveName } from '$lib/shared/utils/i18n';
import { error } from '@sveltejs/kit';

const offerItem = alias(item, 'offer_item');
const wantItem = alias(item, 'want_item');

export const load: PageServerLoad = async ({ params, locals }) => {
  const db = getDb();
  const tradeId = params.id;

  // Fetch trade with seller and item details
  const [tradeRow] = await db
    .select({
      trade,
      offerItem,
      wantItem,
      seller: player,
    })
    .from(trade)
    .innerJoin(player, eq(trade.sellerId, player.id))
    .innerJoin(offerItem, eq(trade.offerItemId, offerItem.id))
    .innerJoin(wantItem, eq(trade.wantItemId, wantItem.id))
    .where(eq(trade.id, tradeId))
    .limit(1);

  if (!tradeRow) {
    throw error(404, 'Trade not found');
  }

  const t = tradeRow.trade;
  const offer = tradeRow.offerItem;
  const want = tradeRow.wantItem;
  const seller = tradeRow.seller;

  // Fetch seller's other active trades
  const otherTrades = await db
    .select({
      id: trade.id,
      offerItemId: trade.offerItemId,
      offerQuantity: trade.offerQuantity,
      wantItemId: trade.wantItemId,
      wantQuantity: trade.wantQuantity,
      offerItemCode: offerItem.code,
      wantItemCode: wantItem.code,
      offerItemName: offerItem.translations,
      wantItemName: wantItem.translations,
    })
    .from(trade)
    .innerJoin(offerItem, eq(trade.offerItemId, offerItem.id))
    .innerJoin(wantItem, eq(trade.wantItemId, wantItem.id))
    .where(and(eq(trade.sellerId, seller.id), eq(trade.status, TradeStatus.ACTIVE), ne(trade.id, tradeId)))
    .orderBy(desc(trade.createdAt))
    .limit(5);

  // Fetch similar trades (offering or wanting the same items)
  const similarTrades = await db
    .select({
      id: trade.id,
      sellerId: trade.sellerId,
      sellerDisplayName: player.displayName,
      offerItemId: trade.offerItemId,
      offerQuantity: trade.offerQuantity,
      wantItemId: trade.wantItemId,
      wantQuantity: trade.wantQuantity,
      offerItemCode: offerItem.code,
      wantItemCode: wantItem.code,
      offerItemName: offerItem.translations,
      wantItemName: wantItem.translations,
      createdAt: trade.createdAt,
    })
    .from(trade)
    .innerJoin(player, eq(trade.sellerId, player.id))
    .innerJoin(offerItem, eq(trade.offerItemId, offerItem.id))
    .innerJoin(wantItem, eq(trade.wantItemId, wantItem.id))
    .where(
      and(
        eq(trade.status, TradeStatus.ACTIVE),
        ne(trade.id, tradeId),
      ),
    )
    .orderBy(desc(trade.createdAt))
    .limit(10);

  // Calculate implied price ratio
  const offerQty = Number(t.offerQuantity);
  const wantQty = Number(t.wantQuantity);
  const impliedPrice = wantQty > 0 ? offerQty / wantQty : 0;

  const currentUserId = locals.user?.id ?? null;
  const isOwner = currentUserId === seller.userId;

  return {
    trade: {
      id: t.id,
      sellerId: seller.id,
      sellerDisplayName: seller.displayName,
      sellerUserId: seller.userId,
      createdAt: t.createdAt,
      status: t.status,
      offer: {
        id: offer.id,
        code: offer.code,
        name: resolveName(offer.translations, locals.locale, offer.code),
        imageUrl: offer.imageUrl,
        category: offer.category,
        subCategory: offer.subCategory,
        quantity: offerQty,
      },
      want: {
        id: want.id,
        code: want.code,
        name: resolveName(want.translations, locals.locale, want.code),
        imageUrl: want.imageUrl,
        category: want.category,
        subCategory: want.subCategory,
        quantity: wantQty,
      },
      stock: t.stock,
    },
    otherTrades: otherTrades.map((ot) => ({
      id: ot.id,
      offerCode: ot.offerItemCode,
      offerName: resolveName(ot.offerItemName, locals.locale, ot.offerItemCode),
      offerQuantity: Number(ot.offerQuantity),
      wantCode: ot.wantItemCode,
      wantName: resolveName(ot.wantItemName, locals.locale, ot.wantItemCode),
      wantQuantity: Number(ot.wantQuantity),
    })),
    similarTrades: similarTrades.map((st) => ({
      id: st.id,
      sellerDisplayName: st.sellerDisplayName,
      offerCode: st.offerItemCode,
      offerName: resolveName(st.offerItemName, locals.locale, st.offerItemCode),
      offerQuantity: Number(st.offerQuantity),
      wantCode: st.wantItemCode,
      wantName: resolveName(st.wantItemName, locals.locale, st.wantItemCode),
      wantQuantity: Number(st.wantQuantity),
      createdAt: st.createdAt,
    })),
    isOwner,
    locale: locals.locale,
  };
};
