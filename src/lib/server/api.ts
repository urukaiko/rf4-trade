import { json } from '@sveltejs/kit';
import type { ApiErrorResponse } from '$lib/shared/types/trade';

export function apiError(code: string, message: string, status: number = 400) {
  return json(
    { success: false, error: { code, message } } satisfies ApiErrorResponse,
    { status }
  );
}
