import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import { POST as createTrade } from '../+server';
import { POST as closeTrade } from '../close/+server';
import { getDb } from '$lib/server/db';
import { trade as tradeTable } from '$lib/server/db/schema/trade';
import { item as itemTable } from '$lib/server/db/schema/items';
import { eq } from 'drizzle-orm';
import { TradeStatus } from '$lib/shared/constants';
import { createMockRequest, createMockSession, truncateAll, seedFixtures, seedTestUser, jsonResponse } from '../../../../../tests/setup/helpers';
import type { Session } from '$lib/server/auth';

// Skip integration tests if no database
const dbUrl = process.env.DATABASE_URL;
const describeDb = dbUrl ? describe : describe.skip;

describeDb('POST /api/trades', () => {
  beforeAll(async () => {
    await truncateAll();
  });

  beforeEach(async () => {
    await truncateAll();
    await seedFixtures();
    await seedTestUser();
  });

  afterAll(async () => {
    await truncateAll();
  });

  it('returns 201 with valid payload and inserts row', async () => {
    const db = getDb();
    // Add second item so we don't self-trade
    const items = await db.insert(itemTable).values([
      { code: 'leech', category: 'baits', subCategory: '', translations: { en: { name: 'Leech', description: null }, ru: { name: 'Leech', description: null } } },
      { code: 'worm2', category: 'baits', subCategory: '', translations: { en: { name: 'Worm2', description: null }, ru: { name: 'Worm2', description: null } } },
    ]).returning();

    const item2_0 = items[0]!;
    const item2_1 = items[1]!;

    const session = createMockSession();
    const { request, locals } = createMockRequest('POST', {
      offerItemId: item2_0.id,
      offerQuantity: 5,
      wantItemId: item2_1.id,
      wantQuantity: 3,
      stock: 10,
    }, session);

    const authLocals = locals as typeof locals & { session: Session['session']; user: Session['user'] };
    authLocals.session = session.session;
    authLocals.user = session.user;

    const response = await createTrade({ request, locals: authLocals, params: {} } as Parameters<typeof createTrade>[0]);
    const body = await jsonResponse<typeof response>(response);

    expect(response.status).toBe(201);
    expect(body).toHaveProperty('id');
    expect(body).toMatchObject({
      offerItemId: item2_0.id,
      offerQuantity: 5,
      wantItemId: item2_1.id,
      wantQuantity: 3,
      stock: 10,
      status: TradeStatus.ACTIVE,
    });

    const rows = await db.select().from(tradeTable).where(eq(tradeTable.offerItemId, item2_0.id));
    expect(rows).toHaveLength(1);
  });

  it('returns 401 without session', async () => {
    const { request, locals } = createMockRequest('POST', {
      offerItemId: 1,
      wantItemId: 2,
    });

    const response = await createTrade({ request, locals, params: {} } as Parameters<typeof createTrade>[0]);
    expect(response.status).toBe(401);
  });

  it('returns 400 for self-trade (same item)', async () => {
    const session = createMockSession();
    const { request, locals } = createMockRequest('POST', {
      offerItemId: 1,
      wantItemId: 1,
    }, session);

    const authLocals = locals as typeof locals & { session: Session['session']; user: Session['user'] };
    authLocals.session = session.session;
    authLocals.user = session.user;

    const response = await createTrade({ request, locals: authLocals, params: {} } as Parameters<typeof createTrade>[0]);
    expect(response.status).toBe(400);
  });
});

describeDb('POST /api/trades/close', () => {
  beforeAll(async () => {
    await truncateAll();
  });

  beforeEach(async () => {
    await truncateAll();
    await seedFixtures();
    await seedTestUser();
  });

  afterAll(async () => {
    await truncateAll();
  });

  it('returns 401 without session', async () => {
    const { request, locals } = createMockRequest('POST', { tradeId: 'fake-id' });
    const response = await closeTrade({ request, locals, params: {} } as Parameters<typeof closeTrade>[0]);
    expect(response.status).toBe(401);
  });

  it('returns 400 for invalid tradeId type', async () => {
    const session = createMockSession();
    const { request, locals } = createMockRequest('POST', { tradeId: 123 }, session);
    const authLocals = locals as typeof locals & { session: Session['session']; user: Session['user'] };
    authLocals.session = session.session;
    authLocals.user = session.user;
    const response = await closeTrade({ request, locals: authLocals, params: {} } as Parameters<typeof closeTrade>[0]);
    expect(response.status).toBe(400);
  });

  it('closes a trade and updates DB status', async () => {
    const session = createMockSession();
    const db = getDb();

    // Add second item
    const items = await db.insert(itemTable).values([
      { code: 'leech', category: 'baits', subCategory: '', translations: { en: { name: 'Leech', description: null }, ru: { name: 'Leech', description: null } } },
      { code: 'worm2', category: 'baits', subCategory: '', translations: { en: { name: 'Worm2', description: null }, ru: { name: 'Worm2', description: null } } },
    ]).returning();

    const item2_0 = items[0]!;
    const item2_1 = items[1]!;

    const { playerId } = await seedTestUser();
    const [createdTrade] = await db
      .insert(tradeTable)
      .values({
        sellerId: playerId,
        offerItemId: item2_0.id,
        wantItemId: item2_1.id,
      })
      .returning();

    const authLocals = { session: session.session, user: session.user, playerMissing: false, locale: 'en' as const };
    const { request } = createMockRequest('POST', { tradeId: createdTrade!.id }, session);

    const response = await closeTrade({ request, locals: authLocals, params: {} } as Parameters<typeof closeTrade>[0]);
    expect(response.status).toBe(200);

    const [updated] = await db.select().from(tradeTable).where(eq(tradeTable.id, createdTrade!.id));
    expect(updated!.status).toBe(TradeStatus.CLOSED);
  });

  it('rejects double-close with 409', async () => {
    const session = createMockSession();
    const db = getDb();

    const items = await db.insert(itemTable).values([
      { code: 'leech2', category: 'baits', subCategory: '', translations: { en: { name: 'Leech2', description: null }, ru: { name: 'Leech2', description: null } } },
      { code: 'worm3', category: 'baits', subCategory: '', translations: { en: { name: 'Worm3', description: null }, ru: { name: 'Worm3', description: null } } },
    ]).returning();

    const item2_0 = items[0]!;
    const item2_1 = items[1]!;

    const { playerId } = await seedTestUser();
    const [createdTrade] = await db
      .insert(tradeTable)
      .values({
        sellerId: playerId,
        offerItemId: item2_0.id,
        wantItemId: item2_1.id,
      })
      .returning();

    const authLocals = { session: session.session, user: session.user, playerMissing: false, locale: 'en' as const };

    // First close
    const { request: req1 } = createMockRequest('POST', { tradeId: createdTrade!.id }, session);
    const resp1 = await closeTrade({ request: req1, locals: authLocals, params: {} } as Parameters<typeof closeTrade>[0]);
    expect(resp1.status).toBe(200);

    // Second close — should fail
    const { request: req2 } = createMockRequest('POST', { tradeId: createdTrade!.id }, session);
    const resp2 = await closeTrade({ request: req2, locals: authLocals, params: {} } as Parameters<typeof closeTrade>[0]);
    expect(resp2.status).toBe(409);
  });
});
