import { redirect, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getDb } from '$lib/server/db';
import { player } from '$lib/server/db/schema/players';
import { trade } from '$lib/server/db/schema/trade';
import { item } from '$lib/server/db/schema/items';
import { eq, desc, and } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { TradeStatus } from '$lib/shared/constants';
import { resolveName } from '$lib/shared/utils/i18n';

export interface MyTradeView {
  id: string;
  status: string;
  offer: { name: string; quantity: number };
  want: { name: string; quantity: number };
  stock: number;
  createdAt: Date;
}

const offerItem = alias(item, 'offer_item');
const wantItem = alias(item, 'want_item');

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) {
    throw redirect(302, '/login');
  }

  const db = getDb();

  // Find player record
  const [playerRecord] = await db
    .select()
    .from(player)
    .where(eq(player.userId, locals.user.id))
    .limit(1);

  if (!playerRecord) {
    return { trades: [], userPlayerId: null };
  }

  // Fetch all trades for this player (active and closed)
  const rows = await db
    .select({
      trade,
      offerItem: offerItem,
      wantItem: wantItem,
    })
    .from(trade)
    .innerJoin(offerItem, eq(trade.offerItemId, offerItem.id))
    .innerJoin(wantItem, eq(trade.wantItemId, wantItem.id))
    .where(eq(trade.sellerId, playerRecord.id))
    .orderBy(desc(trade.createdAt));

  const trades: MyTradeView[] = rows.map((row) => ({
    id: row.trade.id,
    status: row.trade.status,
    offer: { name: resolveName(row.offerItem.translations, locals.locale, row.offerItem.code), quantity: Number(row.trade.offerQuantity) },
    want: { name: resolveName(row.wantItem.translations, locals.locale, row.wantItem.code), quantity: Number(row.trade.wantQuantity) },
    stock: row.trade.stock,
    createdAt: row.trade.createdAt,
  }));

  return { trades, userPlayerId: playerRecord.id };
};

export const actions: Actions = {
  closeTrade: async ({ request, locals }) => {
    if (!locals.user) {
      return { error: 'Unauthorized', status: 401 };
    }

    const formData = await request.formData();
    const tradeId = formData.get('tradeId') as string;

    if (!tradeId) {
      return { error: 'Invalid trade ID', status: 400 };
    }

    const db = getDb();

    // Find player record
    const [playerRecord] = await db
      .select()
      .from(player)
      .where(eq(player.userId, locals.user.id))
      .limit(1);

    if (!playerRecord) {
      return { error: 'Player record not found', status: 404 };
    }

    // Verify ownership
    const [existingTrade] = await db
      .select()
      .from(trade)
      .where(and(eq(trade.id, tradeId), eq(trade.sellerId, playerRecord.id)))
      .limit(1);

    if (!existingTrade) {
      return { error: 'Trade not found or you do not have permission', status: 403 };
    }

    // Update trade status (only if still active)
    const [updated] = await db
      .update(trade)
      .set({ status: TradeStatus.CLOSED })
      .where(and(eq(trade.id, tradeId), eq(trade.status, TradeStatus.ACTIVE)))
      .returning({ id: trade.id });

    if (!updated) {
      return { error: 'Trade is not active or already closed', status: 409 };
    }

    return { success: true };
  },
};
