/**
 * Unit tests for live SSE filter logic.
 * Tests: timestamp filtering, _isInitial skip, URL param matching.
 *
 * These tests verify the filter logic extracted from +page.svelte's SSE callback.
 */
import { describe, it, expect } from 'vitest';

interface RawTradeEvent {
  id: string;
  sellerId: string;
  seller: { displayName: string };
  offer: { name: string; quantity: number };
  want: { name: string; quantity: number };
  stock: number;
  createdAt: string | Date;
  _isInitial?: boolean;
  offerItemId?: number;
  wantItemId?: number;
}

function matchesFilters(
  raw: { offerItemId?: number; wantItemId?: number },
  offerFilterIds: number[] | null,
  wantFilterIds: number[] | null,
): boolean {
  if (!offerFilterIds && !wantFilterIds) return true;
  if (offerFilterIds && raw.offerItemId && !offerFilterIds.includes(raw.offerItemId)) return false;
  if (wantFilterIds && raw.wantItemId && !wantFilterIds.includes(raw.wantItemId)) return false;
  return true;
}

function shouldAcceptTrade(
  raw: RawTradeEvent,
  liveSearchActive: boolean,
  liveToggleTimestamp: number,
  offerFilterIds: number[] | null,
  wantFilterIds: number[] | null,
): boolean {
  // Filter check
  if (!matchesFilters(raw, offerFilterIds, wantFilterIds)) return false;

  // Live search filter
  if (liveSearchActive) {
    if (raw._isInitial) return false;
    const eventTime = typeof raw.createdAt === 'string' ? Date.parse(raw.createdAt) : raw.createdAt.getTime();
    if (eventTime <= liveToggleTimestamp) return false;
  }

  return true;
}

const baseTrade: RawTradeEvent = {
  id: 'trade-1',
  sellerId: 'seller-1',
  seller: { displayName: 'TestSeller' },
  offer: { name: 'Worm', quantity: 10 },
  want: { name: 'Gold', quantity: 1 },
  stock: 50,
  createdAt: new Date('2025-04-13T12:00:00Z'),
  offerItemId: 1,
  wantItemId: 2,
};

describe('SSE Live Filter', () => {
  describe('matchesFilters', () => {
    it('accepts all when no filters', () => {
      expect(matchesFilters(baseTrade, null, null)).toBe(true);
    });

    it('accepts when offerItemId matches filter', () => {
      expect(matchesFilters(baseTrade, [1, 3], null)).toBe(true);
    });

    it('rejects when offerItemId does not match filter', () => {
      expect(matchesFilters(baseTrade, [5, 6], null)).toBe(false);
    });

    it('accepts when wantItemId matches filter', () => {
      expect(matchesFilters(baseTrade, null, [2])).toBe(true);
    });

    it('requires both filters to match', () => {
      expect(matchesFilters(baseTrade, [1], [2])).toBe(true);
      expect(matchesFilters(baseTrade, [1], [99])).toBe(false);
      expect(matchesFilters(baseTrade, [99], [2])).toBe(false);
    });

    it('passes when offerItemId is missing (cannot filter absent field)', () => {
      const { offerItemId: _, ...noOffer } = baseTrade;
      expect(matchesFilters(noOffer, [1], null)).toBe(true);
    });
  });

  describe('live search active', () => {
    const toggleTime = Date.parse('2025-04-13T11:50:00Z');

    it('accepts trades created after toggle', () => {
      const trade: RawTradeEvent = {
        ...baseTrade,
        createdAt: new Date('2025-04-13T12:00:00Z'),
      };
      expect(shouldAcceptTrade(trade, true, toggleTime, null, null)).toBe(true);
    });

    it('rejects trades created before toggle', () => {
      const trade: RawTradeEvent = {
        ...baseTrade,
        createdAt: new Date('2025-04-13T11:45:00Z'),
      };
      expect(shouldAcceptTrade(trade, true, toggleTime, null, null)).toBe(false);
    });

    it('rejects initial snapshots (_isInitial=true)', () => {
      const trade: RawTradeEvent = {
        ...baseTrade,
        _isInitial: true,
        createdAt: new Date('2025-04-13T12:00:00Z'),
      };
      expect(shouldAcceptTrade(trade, true, toggleTime, null, null)).toBe(false);
    });

    it('accepts initial snapshots when live search is inactive', () => {
      const trade: RawTradeEvent = {
        ...baseTrade,
        _isInitial: true,
        createdAt: new Date('2025-04-13T12:00:00Z'),
      };
      expect(shouldAcceptTrade(trade, false, 0, null, null)).toBe(true);
    });

    it('accepts old trades when live search is inactive', () => {
      const trade: RawTradeEvent = {
        ...baseTrade,
        createdAt: new Date('2025-04-13T11:00:00Z'),
      };
      expect(shouldAcceptTrade(trade, false, toggleTime, null, null)).toBe(true);
    });
  });

  describe('combined: filters + live search', () => {
    const toggleTime = Date.parse('2025-04-13T11:50:00Z');

    it('rejects if filter fails even though timestamp is OK', () => {
      const trade: RawTradeEvent = {
        ...baseTrade,
        createdAt: new Date('2025-04-13T12:00:00Z'),
      };
      expect(shouldAcceptTrade(trade, true, toggleTime, [99], null)).toBe(false);
    });

    it('rejects if timestamp fails even though filter passes', () => {
      const trade: RawTradeEvent = {
        ...baseTrade,
        createdAt: new Date('2025-04-13T11:45:00Z'),
      };
      expect(shouldAcceptTrade(trade, true, toggleTime, [1], null)).toBe(false);
    });

    it('accepts only when both filter and timestamp pass', () => {
      const trade: RawTradeEvent = {
        ...baseTrade,
        createdAt: new Date('2025-04-13T12:00:00Z'),
      };
      expect(shouldAcceptTrade(trade, true, toggleTime, [1], null)).toBe(true);
    });
  });
});
