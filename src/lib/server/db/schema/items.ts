import { pgTable, serial, text, timestamp, uniqueIndex, jsonb } from 'drizzle-orm/pg-core';

export interface ItemTranslations {
  ru: { name: string; description: string | null };
  en: { name: string; description: string | null };
}

export const item = pgTable(
  'item',
  {
    id: serial('id').primaryKey(),
    code: text('code').notNull(),
    category: text('category').notNull(),
    subCategory: text('sub_category').notNull().default(''),
    translations: jsonb('translations').$type<ItemTranslations>().notNull(),
    imageUrl: text('image_url'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [uniqueIndex('item_code_unique').on(table.code)]
);