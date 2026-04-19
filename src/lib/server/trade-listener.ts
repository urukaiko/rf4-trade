// PostgreSQL LISTEN/NOTIFY subscriber for real-time trade changes.
// Uses a dedicated single-connection postgres client (node-postgres/pg).
import { building } from '$app/environment';
import { Client } from 'pg';
import { invalidate as invalidateCache } from '$lib/server/cache';

declare const process: { env: Record<string, string | undefined> };

type ChangeCallback = (tradeId: string) => void;

let client: Client | null = null;
let listeners = new Set<ChangeCallback>();
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let hasFatalError = false;

function getDatabaseUrl(): string | undefined {
  return process.env.DATABASE_URL;
}

function connect() {
  if (hasFatalError) return;
  const databaseUrl = getDatabaseUrl();
  if (!databaseUrl) {
    console.error('[trade-listener] No DATABASE_URL');
    return;
  }

  const newClient = new Client(databaseUrl);

  newClient.on('notification', (n) => {
    if (n.channel === 'trade_changes') {
      invalidateCache();
      const tradeId = String(n.payload ?? '');
      for (const cb of listeners) {
        cb(tradeId);
      }
    }
  });

  newClient.on('error', (err) => {
    console.error('[trade-listener] Client error:', err.message);
    client = null;
    scheduleReconnect();
  });

  newClient.connect()
    .then(async () => {
      await newClient!.query('LISTEN trade_changes');
      client = newClient;
      console.log('[trade-listener] ✅ LISTEN trade_changes active');
    })
    .catch((err) => {
      console.error('[trade-listener] ❌ Connection failed:', err.message);
      hasFatalError = true;
    });
}

function scheduleReconnect() {
  if (reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    if (listeners.size > 0) {
      hasFatalError = false;
      connect();
    }
  }, 3000);
}

export function subscribe(cb: ChangeCallback): void {
  // Prevent execution during build or in browser
  if (building || typeof window !== 'undefined') return;
  const hadListeners = listeners.size > 0;
  listeners.add(cb);
  if (!hadListeners) {
    connect();
  }
}

export function unsubscribe(cb: ChangeCallback): void {
  if (building || typeof window !== 'undefined') return;
  listeners.delete(cb);
  if (listeners.size === 0) {
    stop();
  }
}

export function stop(): void {
  if (building || typeof window !== 'undefined') return;
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  listeners.clear();
  if (client) {
    client.end().catch(() => {});
    client = null;
  }
}
