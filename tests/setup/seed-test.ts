/**
 * Test-only catalog seed helper.
 *
 * Seeds a minimal set of items into the item table so integration tests
 * can create trades without depending on static/images/items/.
 *
 * This file lives in tests/ — it is NEVER imported by production code.
 *
 * Usage:
 *   await seedTestCatalog();
 *
 * The test database MUST exist before calling this function.
 * Create it once:  CREATE DATABASE rf4trade_test;
 * Then run:       drizzle-kit push  (with DATABASE_URL pointing to test DB)
 */
import { getDb } from '$lib/server/db';
import * as schema from '$lib/server/db/schema';

/** Minimal item set sufficient for all integration trade tests. */
const TEST_ITEMS = [
  {
    code: 'worm',
    category: 'baits',
    subCategory: '',
    translations: {
      en: { name: 'Worm', description: null },
      ru: { name: 'Червь', description: null },
    },
    imageUrl: '/images/items/baits/worm.png',
  },
  {
    code: 'leech',
    category: 'baits',
    subCategory: '',
    translations: {
      en: { name: 'Leech', description: null },
      ru: { name: 'Пиявка', description: null },
    },
    imageUrl: '/images/items/baits/leech.png',
  },
  {
    code: 'maggot',
    category: 'baits',
    subCategory: '',
    translations: {
      en: { name: 'Maggot', description: null },
      ru: { name: 'Опарыш', description: null },
    },
    imageUrl: '/images/items/baits/maggot.png',
  },
  {
    code: 'gold_coin',
    category: 'currency',
    subCategory: '',
    translations: {
      en: { name: 'Gold Coin', description: null },
      ru: { name: 'Золотая монета', description: null },
    },
    imageUrl: '/images/items/currency/gold.png',
  },
  {
    code: 'premium',
    category: 'currency',
    subCategory: '',
    translations: {
      en: { name: 'Premium', description: null },
      ru: { name: 'Премиум', description: null },
    },
    imageUrl: '/images/items/currency/premium.png',
  },
];

/**
 * Insert test items into the item table.
 * Uses onConflictDoNothing so it is safe to call multiple times.
 */
export async function seedTestCatalog(): Promise<void> {
  const db = getDb();

  await db.insert(schema.item).values(TEST_ITEMS).onConflictDoNothing();

  const count = await db.$count(schema.item);
  console.log(`[test-seed] Catalog seeded. Total items in DB: ${count}`);
}
