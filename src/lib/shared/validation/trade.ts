// Trade validation schemas (Valibot)
// Mirrors the Drizzle trade table shape — used for API input validation.
import {
  minValue,
  number,
  object,
  optional,
  picklist,
  pipe,
  string,
  uuid,
} from 'valibot';
import { TradeStatus } from '$lib/shared/constants';

export const TradeInsertSchema = object({
  sellerId: pipe(string('Seller ID is required.'), uuid('Must be a valid UUID.')),
  offerItemId: pipe(number('Offer item ID is required.'), minValue(1, 'Must reference a valid item.')),
  offerQuantity: optional(pipe(number(), minValue(0.5, 'Quantity must be at least 0.5.')), 1),
  wantItemId: pipe(number('Want item ID is required.'), minValue(1, 'Must reference a valid item.')),
  wantQuantity: optional(pipe(number(), minValue(0.5, 'Quantity must be at least 0.5.')), 1),
  status: optional(picklist([TradeStatus.ACTIVE, TradeStatus.CLOSED, TradeStatus.BOOKED], 'Must be a valid trade status.'), TradeStatus.ACTIVE),
});

// Schema for creating trades via API (sellerId derived from session)
export const CreateTradeInputSchema = object({
  offerItemId: pipe(number('Offer item ID is required.'), minValue(1, 'Must reference a valid item.')),
  offerQuantity: optional(pipe(number(), minValue(0.5, 'Quantity must be at least 0.5.')), 1),
  wantItemId: pipe(number('Want item ID is required.'), minValue(1, 'Must reference a valid item.')),
  wantQuantity: optional(pipe(number(), minValue(0.5, 'Quantity must be at least 0.5.')), 1),
  stock: optional(pipe(number(), minValue(1, 'Stock must be at least 1.'))),
});
