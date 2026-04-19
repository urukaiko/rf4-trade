import type { ItemTranslations } from '$lib/server/db/schema/items';

type CategoryTranslations = Record<string, { ru: string; en: string }>;

// 📦 Обычный кэш (без $state!)
let cachedCategories: CategoryTranslations | null = null;
let loadPromise: Promise<CategoryTranslations> | null = null;

// 🔄 Callbacks for reactive updates in Svelte components
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach(fn => fn());
}

/**
 * Subscribe to category updates (for Svelte reactivity)
 * Returns unsubscribe function
 */
export function subscribeCategories(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

/**
 * Load categories.json from static folder.
 */
async function loadCategoryTranslations(): Promise<CategoryTranslations> {
  if (cachedCategories) return cachedCategories;
  
  if (loadPromise) return loadPromise;
  
  loadPromise = (async () => {
    try {
      const isServer = typeof window === 'undefined';
      let data: CategoryTranslations;
      
      if (isServer) {
        const { readFileSync } = await import('node:fs');
        const { join } = await import('node:path');
        const filePath = join(process.cwd(), 'static', 'images', 'items', 'categories.json');
        const raw = readFileSync(filePath, 'utf-8');
        data = JSON.parse(raw);
      } else {
        const response = await fetch('/images/items/categories.json');
        if (!response.ok) throw new Error('Failed to load categories');
        data = await response.json();
      }
      
      cachedCategories = data;
      
      // Notify all subscribed components
      notifyListeners();
      
      return data;
    } catch (err) {
      console.warn('[i18n] Failed to load categories.json, using empty fallback', err);
      return {};
    }
  })();
  
  return loadPromise;
}

/**
 * Get categories (non-reactive by itself)
 */
export function getCategories(): CategoryTranslations {
  return cachedCategories ?? {};
}

/**
 * Preload categories on server startup
 */
export async function preloadCategories(): Promise<void> {
  await loadCategoryTranslations();
}

/**
 * Ensure categories are loaded on client
 */
export async function ensureCategoriesLoaded(): Promise<void> {
  await loadCategoryTranslations();
}

export function resolveName(
  translations: ItemTranslations | null | undefined,
  locale: 'ru' | 'en',
  fallbackCode?: string,
): string {
  if (!translations) return fallbackCode ?? 'Unknown';

  const loc = translations[locale];
  if (loc?.name) return loc.name;

  const en = translations['en'];
  if (en?.name) return en.name;

  return fallbackCode ?? 'Unknown';
}

/**
 * Resolve category/subcategory name with i18n support.
 */
export function resolveCategoryName(
  category: string,
  locale: 'ru' | 'en',
): string {
  const translations = getCategories();
  
  const mapped = translations[category];
  
  if (mapped?.[locale]) return mapped[locale];
  if (mapped?.en) return mapped.en;
  
  return titleCase(category);
}

export function titleCase(str: string): string {
  return str
    .split(/[_\s-]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}