const isDev = process.env.NODE_ENV !== 'production';

/**
 * Safe logging for server-side code.
 * - Dev: full detail (message, data, error stack)
 * - Prod: structured { code, message, timestamp } only — no stack traces
 */
export const logger = {
  info(code: string, message: string, data?: unknown) {
    if (isDev) {
      console.log(`[INFO][${code}] ${message}`, data ?? '');
    } else {
      console.log(JSON.stringify({ code, message, timestamp: new Date().toISOString() }));
    }
  },

  error(code: string, message: string, error?: unknown) {
    if (isDev) {
      console.error(`[ERROR][${code}] ${message}`, error ?? '');
    } else {
      console.error(
        JSON.stringify({
          code,
          message,
          timestamp: new Date().toISOString(),
        }),
      );
    }
  },
};
