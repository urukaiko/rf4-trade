import { auth } from '$lib/server/auth';
import type { RequestHandler } from './$types';
import { logger } from '$lib/server/logger';

export const GET: RequestHandler = async ({ request }) => {
  try {
    return await auth.handler(request);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Internal server error';
    logger.error('AUTH_HANDLER_GET', errMsg, error);
    return new Response(JSON.stringify({
      error: errMsg,
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const POST: RequestHandler = async ({ request }) => {
  try {
    return await auth.handler(request);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Internal server error';
    logger.error('AUTH_HANDLER_POST', errMsg, error);
    return new Response(JSON.stringify({
      error: errMsg,
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
