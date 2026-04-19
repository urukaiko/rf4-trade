import { browser } from '$app/environment';

const BASE_RETRY_MS = 1_000;
const MAX_RETRY_MS = 30_000;
const MAX_RECONNECT_ATTEMPTS = 20;

export type StreamStatus = 'connected' | 'reconnecting' | 'disconnected';

type TradeUpdateCallback = (payload: unknown, type: string) => void;

/**
 * Svelte 5 rune-based composable for SSE trade stream.
 *
 * Connects to `/api/trades/stream` and forwards parsed events to `onTradeUpdate`.
 * Handles exponential backoff on error, auto-reconnect, and SSR-safe cleanup.
 *
 * @param enabled  - Whether to establish the SSE connection (e.g. `activeTab === 'search'`)
 * @param onTradeUpdate - Called with `(payload, eventType)` for each SSE message
 * @param onExhausted - Called when max reconnect attempts are reached (optional)
 * @returns `{ status }` — reactive stream connection status
 */
export function useTradeStream(
  enabled: boolean,
  onTradeUpdate: TradeUpdateCallback,
  onExhausted?: () => void,
): { status: StreamStatus; cleanup: () => void } {
  let cleanupFn: () => void = () => {};
  let status = $state<StreamStatus>('connected');

  $effect(() => {
    if (!browser || !enabled) {
      return;
    }

    let eventSource: EventSource | null = null;
    let retryMs = BASE_RETRY_MS;
    let reconnectAttempts = 0;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let destroyed = false;

    function connect() {
      if (destroyed) return;

      eventSource = new EventSource('/api/trades/stream', { withCredentials: true });

      eventSource.onmessage = (event) => {
        // Fallback for events without explicit `event:` field
        try {
          const data = JSON.parse(event.data);
          const type = (data as { type?: string }).type ?? 'unknown';
          const payload = (data as { payload?: unknown }).payload ?? data;
          onTradeUpdate(payload, type);
        } catch {
          // Malformed JSON — skip silently
        }
      };

      eventSource.addEventListener('trade:created', (event) => {
        try {
          const data = JSON.parse(event.data);
          onTradeUpdate(data.payload ?? data, 'trade:created');
        } catch {
          // skip
        }
      });

      eventSource.addEventListener('trade:updated', (event) => {
        try {
          const data = JSON.parse(event.data);
          onTradeUpdate(data.payload ?? data, 'trade:updated');
        } catch {
          // skip
        }
      });

      eventSource.addEventListener('trade:closed', (event) => {
        try {
          const data = JSON.parse(event.data);
          onTradeUpdate(data.payload ?? data, 'trade:closed');
        } catch {
          // skip
        }
      });

      eventSource.onerror = () => {
        if (destroyed) return;

        eventSource?.close();
        eventSource = null;

        if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
          status = 'disconnected';
          onExhausted?.();
          return;
        }

        status = 'reconnecting';
        reconnectTimer = setTimeout(() => {
          reconnectAttempts++;
          retryMs = Math.min(retryMs * 2, MAX_RETRY_MS);
          const jitter = Math.random() * 500;
          retryMs = Math.min(retryMs + jitter, MAX_RETRY_MS);
          connect();
        }, retryMs);
      };

      eventSource.onopen = () => {
        status = 'connected';
        retryMs = BASE_RETRY_MS;
        reconnectAttempts = 0;
      };
    }

    connect();

    cleanupFn = () => {
      destroyed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      reconnectTimer = null;
      eventSource?.close();
      eventSource = null;
    };

    return cleanupFn;
  });

  return { get status() { return status; }, cleanup: cleanupFn };
}
