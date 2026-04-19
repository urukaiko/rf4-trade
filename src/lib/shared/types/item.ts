// Item DTO types — inferred from Drizzle schema to prevent drift.
import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import type { item, ItemTranslations } from '$lib/server/db/schema/items';

export type Item = InferSelectModel<typeof item>;
export type ItemInsert = InferInsertModel<typeof item>;
export type { ItemTranslations };

export type CatalogItem = Pick<Item, 'id' | 'code' | 'category' | 'subCategory' | 'translations' | 'imageUrl'>;
