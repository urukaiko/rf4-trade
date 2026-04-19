/**
 * i18n utility for SvelteKit
 * Provides $t() function to get translated strings by key
 */

import ru from './locales/ru.json';
import en from './locales/en.json';

type Locale = 'ru' | 'en';
type TranslationKeys = typeof ru;

const translations: Record<Locale, TranslationKeys> = { ru, en };

/**
 * Get a translated string by dot-notation key.
 * Example: t('nav.brand', 'ru') → 'RF4 Торговля'
 * 
 * @param key - Dot-notation path (e.g., 'nav.brand', 'auth.login')
 * @param locale - Current locale ('ru' | 'en')
 * @returns Translated string or fallback key if not found
 */
export function t(key: string, locale: Locale = 'ru'): string {
  const keys = key.split('.');
  let result: unknown = translations[locale];

  for (const k of keys) {
    if (result && typeof result === 'object' && k in result) {
      result = (result as Record<string, unknown>)[k];
    } else {
      // Fallback: return the key itself if translation not found
      console.warn(`[i18n] Missing translation for key: "${key}" in locale: ${locale}`);
      return key;
    }
  }

  return typeof result === 'string' ? result : key;
}

/**
 * Create a reactive translation function bound to a specific locale.
 * Usage in Svelte components:
 * 
 * ```svelte
 * <script>
 *   import { createTranslator } from '$lib/i18n';
 *   const t = createTranslator(() => data.locale);
 * </script>
 * 
 * <h1>{t('nav.brand')}</h1>
 * ```
 */
export function createTranslator(getLocale: () => Locale) {
  return (key: string): string => t(key, getLocale());
}

export type { Locale };
export { ru, en };