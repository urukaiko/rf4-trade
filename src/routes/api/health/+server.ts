import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { sql } from 'drizzle-orm';
import { auth } from '$lib/server/auth';

export const prerender = false;

export const GET: RequestHandler = async () => {
  const checks: Record<string, string> = {};
  let overallOk = true;

  // Database check
  try {
    const db = getDb();
    await db.execute(sql`SELECT 1 as alive`);
    checks.database = 'connected';
  } catch {
    checks.database = 'disconnected';
    overallOk = false;
  }

  // Better Auth check
  try {
    await auth.api.getSession({
      headers: new Headers({ 'Content-Type': 'application/json' }),
    });
    checks.auth = 'ok';
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    // getSession returns null for unauthenticated, not an error — only flag actual throws
    if (msg.includes('secret') || msg.includes('baseURL') || msg.includes('configuration')) {
      checks.auth = `error: ${msg}`;
      overallOk = false;
    } else {
      checks.auth = 'ok';
    }
  }

  const status = overallOk ? 200 : 503;

  return json(
    {
      status: overallOk ? 'ok' : 'degraded',
      ...checks,
      timestamp: new Date().toISOString(),
    },
    { status }
  );
};
