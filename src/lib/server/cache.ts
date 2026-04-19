/**
 * In-memory cache with TTL.
 * Invalidated by trade-listener on every trade change.
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const TTL_MS = 60_000; // 60 seconds

const cache = new Map<string, CacheEntry<unknown>>();

export function get<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

export function set<T>(key: string, data: T): void {
  cache.set(key, { data, expiresAt: Date.now() + TTL_MS });
}

export function invalidate(key?: string): void {
  if (key) {
    cache.delete(key);
  } else {
    cache.clear();
  }
}

export function size(): number {
  return cache.size;
}
