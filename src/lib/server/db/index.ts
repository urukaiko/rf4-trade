// Drizzle ORM PostgreSQL client — lazy initialization to avoid build-time errors
import { drizzle } from 'drizzle-orm/postgres-js';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '$env/dynamic/private';

import * as schema from './schema';

const POOL_MAX_CONNECTIONS = 10;
const POOL_IDLE_TIMEOUT_SECONDS = 20;

let _db: PostgresJsDatabase<typeof schema> | undefined;

export function getDb() {
  if (!_db) {
    if (!env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is required');
    }

    const client = postgres(env.DATABASE_URL, {
      max: POOL_MAX_CONNECTIONS,
      idle_timeout: POOL_IDLE_TIMEOUT_SECONDS,
    });

    _db = drizzle(client, { schema });
  }

  return _db;
}

// Re-export schema types for convenience
export { schema };
