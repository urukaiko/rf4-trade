import '@testing-library/jest-dom/vitest';
import { beforeAll, afterAll } from 'vitest';
import { truncateAll } from './helpers';
import { seedTestCatalog } from './seed-test';

// ── Database isolation: set test DB URL before any DB code runs ───────────
// When running `bun run test`, the package.json script sets DATABASE_URL
// to the test database. If running vitest directly, we set it here.
if (!process.env.DATABASE_URL?.includes('_test')) {
  process.env.DATABASE_URL = process.env.DATABASE_URL_TEST ||
    'postgresql://rf4user:rf4pass@localhost:5432/rf4trade_test';
}

// ── Database isolation check ──────────────────────────────────────────────
const dbUrl = process.env.DATABASE_URL ?? '';

if (!dbUrl.startsWith('postgresql://')) {
  console.error(
    '\n❌ ERROR: Invalid DATABASE_URL for tests. Must start with postgresql://\n',
  );
  process.exit(1);
}

if (
  dbUrl.includes('rf4trade') &&
  !dbUrl.includes('rf4trade_test') &&
  !dbUrl.includes('_test')
) {
  console.error(
    '\n⚠️  WARNING: DATABASE_URL points to the DEV database, not a test database.\n' +
    'Running tests via `bun run test` uses the test DB automatically.\n' +
    'If you ran vitest directly, set DATABASE_URL to a test database:\n\n' +
    '  DATABASE_URL="postgresql://rf4user:rf4pass@localhost:5432/rf4trade_test"\n\n' +
    'To set up the test database: bun run test:setup\n',
  );
  process.exit(1);
}

// ── Global test lifecycle: truncate + seed before ALL tests ───────────────
// This runs once before the first test in any suite. Each individual test
// suite (describe block) also calls truncateAll + seedFixtures + seedTestUser
// in its own beforeAll/afterAll for isolation.
//
// The global seed ensures the item catalog has baseline data even if a test
// suite forgets to seed its own items.

beforeAll(async () => {
  await truncateAll();
  await seedTestCatalog();
});

afterAll(async () => {
  // Clean up after tests — leaves test DB in a known-empty state.
  // Does NOT affect dev DB (if you followed the warning above).
  await truncateAll();
});
