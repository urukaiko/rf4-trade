import {
  pgTable,
  uuid,
  integer,
  numeric,
  timestamp,
  text,
  index,
} from 'drizzle-orm/pg-core';
import { player } from './players';
import { item } from './items';

export const trade = pgTable('trade', {
  id: uuid('id').primaryKey().defaultRandom(),
  sellerId: uuid('seller_id')
    .notNull()
    .references(() => player.id, { onDelete: 'cascade' }),
  offerItemId: integer('offer_item_id')
    .notNull()
    .references(() => item.id, { onDelete: 'restrict' }),
  offerQuantity: numeric('offer_quantity', { precision: 10, scale: 1 }).notNull().default('1'),
  wantItemId: integer('want_item_id')
    .notNull()
    .references(() => item.id, { onDelete: 'restrict' }),
  wantQuantity: numeric('want_quantity', { precision: 10, scale: 1 }).notNull().default('1'),
  stock: integer('stock').notNull().default(1),
  status: text('status').notNull().default('active'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
}, (table) => [
  index('idx_trade_seller_status').on(table.sellerId, table.status),
  index('idx_trade_status_created').on(table.status, table.createdAt),
  index('idx_trade_offer_item').on(table.offerItemId),
  index('idx_trade_want_item').on(table.wantItemId),
]);
