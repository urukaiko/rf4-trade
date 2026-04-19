import { pgTable, uuid, varchar, integer, timestamp, text, index } from 'drizzle-orm/pg-core';
import { user } from './users';

export const player = pgTable('player', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  displayName: varchar('display_name', { length: 100 }).notNull().unique(),
  // TODO: implement balance feature
  balance: integer('balance').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
}, (table) => [
  index('idx_player_user_id').on(table.userId),
]);
