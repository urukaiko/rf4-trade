import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { getDb } from '$lib/server/db';
import { trade } from '$lib/server/db/schema/trade';
import { player } from '$lib/server/db/schema/players';
import { item } from '$lib/server/db/schema/items';
import { eq, desc } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { TradeStatus } from '$lib/shared/constants';
import type { TradeView } from '$lib/shared/types/trade';
import { resolveName } from '$lib/shared/utils/i18n';
import { subscribe, unsubscribe } from '$lib/server/trade-listener';

const SSE_HEADERS = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache',
  Connection: 'keep-alive',
  'X-Accel-Buffering': 'no',
};

/**
 * Track active connections per session for rate-limiting.
 * Key: session.id, Value: AbortController
 */
const activeConnections = new Map<string, AbortController>();

const offerItem = alias(item, 'offer_item');
const wantItem = alias(item, 'want_item');

/** Build a TradeView from a raw trade row with joined data. */
function toTradeView(
  row: {
    trade: typeof trade.$inferSelect;
    offerItem: typeof item.$inferSelect;
    wantItem: typeof item.$inferSelect;
    seller: typeof player.$inferSelect;
  },
  locale: 'ru' | 'en',
): TradeView & { offerItemId?: number; wantItemId?: number } {
  return {
    id: row.trade.id,
    sellerId: row.seller.id,
    seller: { displayName: row.seller.displayName },
    offer: { name: resolveName(row.offerItem.translations, locale, row.offerItem.code), quantity: Number(row.trade.offerQuantity), code: row.offerItem.code, imageUrl: row.offerItem.imageUrl },
    want: { name: resolveName(row.wantItem.translations, locale, row.wantItem.code), quantity: Number(row.trade.wantQuantity), code: row.wantItem.code, imageUrl: row.wantItem.imageUrl },
    stock: row.trade.stock,
    createdAt: row.trade.createdAt,
    offerItemId: row.trade.offerItemId,
    wantItemId: row.trade.wantItemId,
  };
}

/** Fetch all active trades. */
async function fetchActiveTrades(locale: 'ru' | 'en'): Promise<
  Array<{
    tradeView: TradeView;
    updatedAt: Date;
    status: string;
  }>
> {
  const db = getDb();

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
    .where(eq(trade.status, TradeStatus.ACTIVE))
    .orderBy(desc(trade.updatedAt))
    .limit(50);

  return rows.map((row) => ({
    tradeView: toTradeView(row, locale),
    updatedAt: row.trade.updatedAt,
    status: row.trade.status,
  }));
}

/** Fetch a single trade by ID for targeted update. */
async function fetchTradeById(
  tradeId: string,
  locale: 'ru' | 'en',
): Promise<{ tradeView: TradeView; updatedAt: Date; status: string } | null> {
  const db = getDb();

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
    .where(eq(trade.id, tradeId))
    .limit(1);

  if (rows.length === 0) return null;

  const row = rows[0]!;
  return {
    tradeView: toTradeView(row, locale),
    updatedAt: row.trade.updatedAt,
    status: row.trade.status,
  };
}

type SSEEvent =
  | { type: 'trade:created' | 'trade:updated'; payload: TradeView }
  | { type: 'trade:closed'; payload: { id: string } };

/** Determine the change type between old and new trade snapshots. */
function detectChanges(
  oldMap: Map<string, { updatedAt: Date; status: string }>,
  newMap: Map<string, { tradeView: TradeView; updatedAt: Date; status: string }>,
): SSEEvent[] {
  const changes: SSEEvent[] = [];

  for (const [id, next] of newMap) {
    const prev = oldMap.get(id);
    if (!prev) {
      changes.push({ type: 'trade:created', payload: next.tradeView });
    } else if (next.updatedAt > prev.updatedAt) {
      changes.push({ type: 'trade:updated', payload: next.tradeView });
    }
  }

  // Trades that were in oldMap but not in newMap have been closed
  for (const [id] of oldMap) {
    if (!newMap.has(id)) {
      changes.push({ type: 'trade:closed', payload: { id } });
    }
  }

  return changes;
}

function encodeSSE(data: object, event?: string): string {
  let message = '';
  if (event) message += `event: ${event}\n`;
  message += `data: ${JSON.stringify(data)}\n\n`;
  return message;
}

export const GET: RequestHandler = async ({ locals, request }) => {
  const { session, user, locale } = locals;

  // Auth gate: reject unauthenticated in production, allow in dev for testing
  const isProduction = env.NODE_ENV === 'production';
  if (!session || !user) {
    if (isProduction) {
      return new Response('Unauthorized', { status: 401 });
    }
  }

  // Rate-limit: one connection per session
  const sessionId = session?.id ?? 'guest';
  const existing = activeConnections.get(sessionId);
  if (existing) {
    existing.abort();
    activeConnections.delete(sessionId);
  }

  const abortController = new AbortController();
  activeConnections.set(sessionId, abortController);

  request.signal.addEventListener('abort', () => {
    abortController.abort();
    activeConnections.delete(sessionId);
  });

  const stream = new ReadableStream({
    start: (streamController) => {
      let closed = false;
      let lastKnown = new Map<string, { updatedAt: Date; status: string }>();

      function safeClose() {
        if (closed) return;
        closed = true;
        try { streamController.close(); } catch { /* already closed */ }
      }

      // Initial snapshot — embed isInitial in payload so client can skip highlight
      (async () => {
        try {
          const initial = await fetchActiveTrades(locale);
          for (const entry of initial) {
            lastKnown.set(entry.tradeView.id, {
              updatedAt: entry.updatedAt,
              status: entry.status,
            });
            const payload = { ...entry.tradeView, _isInitial: true };
            streamController.enqueue(
              encodeSSE({ type: 'trade:created', payload }, 'trade:created'),
            );
          }
        } catch {
          safeClose();
          return;
        }

        // Subscribe to pg_notify via LISTEN
        const onChange = async (tradeId: string) => {
          if (closed || abortController.signal.aborted) return;

          try {
            const updatedEntry = await fetchTradeById(tradeId, locale);

            if (!updatedEntry) {
              // Trade was deleted or no longer accessible
              if (lastKnown.has(tradeId)) {
                lastKnown.delete(tradeId);
                streamController.enqueue(
                  encodeSSE({ type: 'trade:closed', payload: { id: tradeId } }, 'trade:closed'),
                );
              }
              return;
            }

            const prev = lastKnown.get(tradeId);
            if (!prev) {
              // New trade created
              lastKnown.set(updatedEntry.tradeView.id, {
                updatedAt: updatedEntry.updatedAt,
                status: updatedEntry.status,
              });
              streamController.enqueue(
                encodeSSE({ type: 'trade:created', payload: updatedEntry.tradeView }, 'trade:created'),
              );
            } else if (updatedEntry.status !== TradeStatus.ACTIVE || updatedEntry.updatedAt > prev.updatedAt) {
              if (updatedEntry.status !== TradeStatus.ACTIVE) {
                // Trade closed
                lastKnown.delete(tradeId);
                streamController.enqueue(
                  encodeSSE({ type: 'trade:closed', payload: { id: tradeId } }, 'trade:closed'),
                );
              } else {
                // Trade updated
                lastKnown.set(updatedEntry.tradeView.id, {
                  updatedAt: updatedEntry.updatedAt,
                  status: updatedEntry.status,
                });
                streamController.enqueue(
                  encodeSSE({ type: 'trade:updated', payload: updatedEntry.tradeView }, 'trade:updated'),
                );
              }
            }
          } catch {
            // On error, do a full resync to stay consistent
            try {
              const full = await fetchActiveTrades(locale);
              const newMap = new Map(full.map((e) => [e.tradeView.id, e]));
              const changes = detectChanges(lastKnown, newMap);
              for (const change of changes) {
                streamController.enqueue(encodeSSE(change.payload, change.type));
              }
              lastKnown = newMap;
            } catch {
              // Ignore nested errors
            }
          }
        };

        subscribe(onChange);

        // Cleanup on abort/close
        const cleanup = () => {
          unsubscribe(onChange);
        };

        abortController.signal.addEventListener('abort', cleanup, { once: true });
      })();
    },
    cancel() {
      activeConnections.delete(sessionId);
    },
  });

  return new Response(stream, { headers: SSE_HEADERS });
};
