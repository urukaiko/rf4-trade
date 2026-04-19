import { getDb } from '$lib/server/db';
import * as schema from '$lib/server/db/schema';
import { sql, eq } from 'drizzle-orm';
import { TradeStatus } from '$lib/shared/constants';
import type { Session } from '$lib/server/auth';

const TEST_USER_ID = '00000000-0000-0000-0000-000000000001';
const TEST_PLAYER_ID = '00000000-0000-0000-0000-000000000001';
const TEST_SESSION_ID = '00000000-0000-0000-0000-000000000001';

/** Create a mock session object for API handler calls. */
export function createMockSession(): { session: Session['session']; user: Session['user'] } {
  return {
    session: {
      id: TEST_SESSION_ID,
      userId: TEST_USER_ID,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      token: 'test-token',
      createdAt: new Date(),
      updatedAt: new Date(),
      ipAddress: '127.0.0.1',
      userAgent: 'test-agent',
    },
    user: {
      id: TEST_USER_ID,
      name: 'test-user',
      email: 'test@example.com',
      emailVerified: false,
      username: 'test_user',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };
}

/** Build a fake Request with mock locals for SvelteKit handler testing. */
export function createMockRequest(
  method: string,
  body: object | null = null,
  session?: { session: Session['session']; user: Session['user'] },
): { request: Request; locals: { session: Session['session'] | null; user: Session['user'] | null; playerMissing: boolean; locale: 'ru' | 'en' } } {
  const request = new Request('http://localhost/api/trades', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : null,
  });

  const locals = {
    session: session?.session ?? null,
    user: session?.user ?? null,
    playerMissing: false,
    locale: 'en' as const,
  };

  return { request, locals };
}

/**
 * Truncate all data tables for test isolation.
 *
 * ⚠️  This operates on whatever database DATABASE_URL points to.
 *     In CI this is the test DB (rf4trade_test).
 *     Locally, ensure DATABASE_URL points to the test DB — not the dev DB —
 *     or your dev data will be wiped. See tests/setup/vitest.ts for the warning.
 */
export async function truncateAll(): Promise<void> {
  const db = getDb();
  await db.execute(sql`
    TRUNCATE TABLE trade, player, item, account, verification, session, "user" RESTART IDENTITY CASCADE;
  `);
}

/** Insert minimal fixtures: one bait item so trades can be created. */
export async function seedFixtures(): Promise<{ itemId: number; baitId: number }> {
  const db = getDb();

  const [baitItem] = await db
    .insert(schema.item)
    .values({
      code: 'test_worm',
      category: 'baits',
      subCategory: '',
      translations: {
        en: { name: 'Worm', description: null },
        ru: { name: 'Worm', description: null },
      },
    })
    .returning();

  if (!baitItem) throw new Error('Failed to insert bait item');

  return { itemId: baitItem.id, baitId: baitItem.id };
}

/** Insert a test user + player so trade creation works. */
export async function seedTestUser(): Promise<{ userId: string; playerId: string }> {
  const db = getDb();

  await db
    .insert(schema.user)
    .values({
      id: TEST_USER_ID,
      name: 'test-user',
      email: 'test@example.com',
      username: 'test_user',
      emailVerified: false,
      playerMissing: false,
    })
    .onConflictDoNothing();

  // Try insert player, or fetch existing if conflict
  const [playerRecord] = await db
    .insert(schema.player)
    .values({
      id: TEST_PLAYER_ID,
      userId: TEST_USER_ID,
      displayName: 'Test Player',
    })
    .onConflictDoNothing()
    .returning();

  if (playerRecord) {
    return { userId: TEST_USER_ID, playerId: playerRecord.id };
  }

  // Player already exists — fetch it
  const [existing] = await db
    .select({ id: schema.player.id })
    .from(schema.player)
    .where(eq(schema.player.userId, TEST_USER_ID))
    .limit(1);

  if (!existing) throw new Error('Failed to find or insert player');

  return { userId: TEST_USER_ID, playerId: existing.id };
}

/** Helper to extract JSON from a Response. */
export async function jsonResponse<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}

export { TradeStatus };
