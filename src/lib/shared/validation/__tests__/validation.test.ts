import { describe, it, expect } from 'vitest';
import { safeParse } from 'valibot';
import { CreateTradeInputSchema } from '$lib/shared/validation/trade';
import { LoginSchema } from '$lib/shared/validation';
import { ItemInsertSchema } from '$lib/shared/validation/item';

describe('CreateTradeInputSchema', () => {
  it('accepts a valid payload', () => {
    const result = safeParse(CreateTradeInputSchema, {
      offerItemId: 1,
      offerQuantity: 5,
      wantItemId: 2,
      wantQuantity: 3,
      stock: 10,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.output).toEqual({
        offerItemId: 1,
        offerQuantity: 5,
        wantItemId: 2,
        wantQuantity: 3,
        stock: 10,
      });
    }
  });

  it('uses defaults for optional fields', () => {
    const result = safeParse(CreateTradeInputSchema, {
      offerItemId: 1,
      wantItemId: 2,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.output.offerQuantity).toBe(1);
      expect(result.output.wantQuantity).toBe(1);
      expect(result.output.stock).toBeUndefined();
    }
  });

  it('rejects missing offerItemId', () => {
    const result = safeParse(CreateTradeInputSchema, {
      wantItemId: 2,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const msg = result.issues.map((i) => i.message).join(', ');
      expect(msg).toMatch(/offerItemId|Offer item/i);
    }
  });

  it('rejects missing wantItemId', () => {
    const result = safeParse(CreateTradeInputSchema, {
      offerItemId: 1,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const msg = result.issues.map((i) => i.message).join(', ');
      expect(msg).toMatch(/wantItemId|Want item/i);
    }
  });

  it('rejects quantity less than 0.5', () => {
    const result = safeParse(CreateTradeInputSchema, {
      offerItemId: 1,
      offerQuantity: 0.3,
      wantItemId: 2,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const msg = result.issues.map((i) => i.message).join(', ');
      expect(msg).toContain('Quantity must be at least 0.5');
    }
  });

  it('accepts 0.5 quantity for gold', () => {
    const result = safeParse(CreateTradeInputSchema, {
      offerItemId: 1,
      offerQuantity: 1,
      wantItemId: 2,
      wantQuantity: 0.5,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.output.wantQuantity).toBe(0.5);
    }
  });

  it('accepts decimal quantities', () => {
    const result = safeParse(CreateTradeInputSchema, {
      offerItemId: 1,
      offerQuantity: 1.5,
      wantItemId: 2,
      wantQuantity: 2.5,
    });

    expect(result.success).toBe(true);
  });
});

describe('LoginSchema', () => {
  it('accepts valid credentials', () => {
    const result = safeParse(LoginSchema, {
      email: 'user@example.com',
      password: 'password123',
    });

    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = safeParse(LoginSchema, {
      email: 'not-an-email',
      password: 'password123',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.issues[0].message).toBe('Invalid email address.');
    }
  });

  it('rejects short password', () => {
    const result = safeParse(LoginSchema, {
      email: 'user@example.com',
      password: 'short',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.issues[0].message).toBe('Minimum 8 characters.');
    }
  });

  it('rejects missing email', () => {
    const result = safeParse(LoginSchema, {
      password: 'password123',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const msg = result.issues[0].message;
      expect(msg).toMatch(/email|Email/i);
    }
  });
});

describe('ItemInsertSchema', () => {
  it('accepts valid item', () => {
    const result = safeParse(ItemInsertSchema, {
      name: 'leech',
      category: 'bait',
    });

    expect(result.success).toBe(true);
  });

  it('accepts optional description and imageUrl', () => {
    const result = safeParse(ItemInsertSchema, {
      name: 'worm',
      category: 'bait',
      description: 'A common worm',
      imageUrl: 'https://example.com/worm.png',
    });

    expect(result.success).toBe(true);
  });

  it('rejects empty name', () => {
    const result = safeParse(ItemInsertSchema, {
      name: '',
      category: 'bait',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.issues[0].message).toBe('Name cannot be empty.');
    }
  });

  it('rejects missing category', () => {
    const result = safeParse(ItemInsertSchema, {
      name: 'leech',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const msg = result.issues[0].message;
      expect(msg).toMatch(/category|Category/i);
    }
  });

  it('rejects invalid imageUrl', () => {
    const result = safeParse(ItemInsertSchema, {
      name: 'worm',
      category: 'bait',
      imageUrl: 'not-a-url',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.issues[0].message).toBe('Must be a valid URL.');
    }
  });
});
