import { describe, it, expect, vi } from 'vitest';
import { apiError } from '$lib/server/api';

describe('apiError', () => {
  it('returns correct shape with default status 400', () => {
    const response = apiError('BAD_INPUT', 'Invalid data');

    expect(response.status).toBe(400);
    expect(response.headers.get('Content-Type')).toMatch(/application\/json/);
  });

  it('returns correct JSON body', async () => {
    const response = apiError('NOT_FOUND', 'Resource missing', 404);
    const body = await response.json();

    expect(body).toEqual({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Resource missing',
      },
    });
  });

  it('supports custom status codes', () => {
    const response = apiError('UNAUTHORIZED', 'Login required', 401);
    expect(response.status).toBe(401);
  });

  it('supports conflict status', () => {
    const response = apiError('CONFLICT', 'Already exists', 409);
    expect(response.status).toBe(409);
  });
});
