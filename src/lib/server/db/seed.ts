// Seed script — inserts item catalog data from static image files.
// Supports nested structure: static/images/items/<category>/<subCategory>/<filename>.png
// Flat fallback: static/images/items/<category>/<filename>.png → subCategory = ''
// Run with: bun run db:seed
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { eq } from 'drizzle-orm';
import { readdirSync, statSync, readFileSync } from 'node:fs';
import { join, extname, basename } from 'node:path';

declare const process: { env: Record<string, string | undefined>; cwd: () => string; exit: (code: number) => never };
declare const Bun: { file: (path: string) => { exists: () => boolean } };

const SUPPORTED_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp']);

interface TranslationMap {
  [code: string]: { en: string; ru: string };
}

interface ItemTranslations {
  en: { name: string; description: string | null };
  ru: { name: string; description: string | null };
}

interface SeededItem {
  code: string;
  category: string;
  subCategory: string;
  imageUrl: string;
  translations: ItemTranslations;
}

/**
 * Load translations.json from items root.
 * Returns empty map if missing or malformed (logs warning).
 */
function loadTranslations(itemsRoot: string): TranslationMap {
  const jsonPath = join(itemsRoot, 'translations.json');
  try {
    const raw = readFileSync(jsonPath, 'utf-8');
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      console.warn('translations.json malformed — expected Record<string, {en, ru}>');
      return {};
    }
    return parsed as TranslationMap;
  } catch {
    // File missing or invalid JSON — fallback to auto-generated names
    return {};
  }
}

function titleCase(str: string): string {
  return str
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Build translations for a single item.
 * Priority: translations.json → titleCase fallback.
 */
function resolveTranslations(
  code: string,
  translations: TranslationMap,
): ItemTranslations {
  const mapped = translations[code];
  if (mapped) {
    return {
      en: { name: mapped.en, description: null },
      ru: { name: mapped.ru, description: null },
    };
  }
  const prettyName = titleCase(code);
  return {
    en: { name: prettyName, description: null },
    ru: { name: prettyName, description: null },
  };
}

/**
 * Recursively scan itemsRoot for images.
 * Supports:
 *   <category>/<subCategory>/<file>.png  → subCategory set
 *   <category>/<file>.png                → subCategory = ''
 */
function scanAllItems(
  itemsRoot: string,
  translations: TranslationMap,
): SeededItem[] {
  const items: SeededItem[] = [];

  if (!Bun.file(itemsRoot).exists()) {
    console.warn(`Root folder not found: ${itemsRoot}`);
    return items;
  }

  const categories = readdirSync(itemsRoot);
  for (const category of categories) {
    const catPath = join(itemsRoot, category);
    const catStat = statSync(catPath);
    if (!catStat.isDirectory()) continue;

    const children = readdirSync(catPath);
    for (const child of children) {
      const childPath = join(catPath, child);
      const childStat = statSync(childPath);

      if (childStat.isDirectory()) {
        // Nested: <category>/<subCategory>/<files>
        const subCategory = child;
        const files = readdirSync(childPath);
        for (const file of files) {
          const ext = extname(file).toLowerCase();
          if (!SUPPORTED_EXTENSIONS.has(ext)) continue;

          const code = basename(file, ext);
          items.push({
            code,
            category,
            subCategory,
            imageUrl: `/images/items/${category}/${subCategory}/${file}`,
            translations: resolveTranslations(code, translations),
          });
        }
      } else {
        // Flat: <category>/<file>.png
        const ext = extname(child).toLowerCase();
        if (!SUPPORTED_EXTENSIONS.has(ext)) continue;

        const code = basename(child, ext);
        items.push({
          code,
          category,
          subCategory: '',
          imageUrl: `/images/items/${category}/${child}`,
          translations: resolveTranslations(code, translations),
        });
      }
    }
  }

  return items;
}

async function seed() {
  console.log('Seeding item catalog from images...');

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  const client = postgres(databaseUrl);
  const db = drizzle(client, { schema });

  try {
    const itemsRoot = join(process.cwd(), 'static', 'images', 'items');
    const translations = loadTranslations(itemsRoot);
    const items = scanAllItems(itemsRoot, translations);

    if (items.length === 0) {
      console.log('No images found. Nothing to seed.');
      return;
    }

    // Group by category for FK-safe truncation
    const categories = new Map<string, SeededItem[]>();
    for (const item of items) {
      const existing = categories.get(item.category) ?? [];
      existing.push(item);
      categories.set(item.category, existing);
    }

    let totalInserted = 0;

    for (const [category, catItems] of categories) {
      console.log(`Processing ${catItems.length} items for category: ${category}`);

      // Try clearing existing items; skip if FK-constrained
      try {
        await db.delete(schema.item).where(eq(schema.item.category, category));
        console.log(`  Cleared existing ${category} items`);
      } catch {
        console.log(`  Skipped clear (FK constraint active) — upserting items`);
      }

      // Upsert items
      for (const item of catItems) {
        await db
          .insert(schema.item)
          .values(item)
          .onConflictDoUpdate({
            target: schema.item.code,
            set: {
              category: item.category,
              subCategory: item.subCategory,
              translations: item.translations,
              imageUrl: item.imageUrl,
            },
          });
        totalInserted++;
      }

      console.log(`  Upserted ${catItems.length} items`);
    }

    const dbCount = await db.$count(schema.item);
    console.log(`Seed complete. Total items: ${dbCount} (${totalInserted} upserted this run)`);
  } finally {
    await client.end();
  }
}

seed()
  .then(() => {
    console.log('Done.');
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
