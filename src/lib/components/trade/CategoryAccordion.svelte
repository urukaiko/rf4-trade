<script lang="ts">
  import ItemGrid from './ItemGrid.svelte';
  import type { CatalogItem } from '$lib/shared/types/item';
  import { resolveName } from '$lib/shared/utils/i18n';

  interface Props {
    category: string;
    items: CatalogItem[];
    isExpanded: boolean;
    selectedIds: number[];
    ontoggleexpand: () => void;
    onitemtoggle: (itemId: number) => void;
    searchQuery?: string;
    shortNameFn?: (name: string) => string;
    maxSelections?: number;
    locale?: 'ru' | 'en';
  }

  let { category, items, isExpanded, selectedIds, ontoggleexpand, onitemtoggle, searchQuery = '', shortNameFn, maxSelections, locale = 'en' }: Props = $props();

  function matchesSearch(itemId: number): boolean {
    if (!searchQuery) return true;
    const item = items.find((i) => i.id === itemId);
    if (!item) return false;
    const name = resolveName(item.translations, locale, item.code);
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  }

  const visibleItems = $derived(searchQuery ? items.filter((i) => matchesSearch(i.id)) : items);
</script>

{#if visibleItems.length > 0}
  <div>
    <button
      aria-expanded={isExpanded}
      aria-controls={`category-panel-${category}`}
      class="w-full text-left px-3 py-2 text-sm font-medium rounded bg-muted hover:bg-muted/80 text-foreground transition-colors flex items-center justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      onclick={ontoggleexpand}
    >
      <span>{category}</span>
      <span class="text-xs text-muted-foreground" aria-hidden="true">{isExpanded ? '▼' : '▶'}</span>
    </button>
    {#if isExpanded}
      <div id={`category-panel-${category}`} role="region">
        <ItemGrid
          items={visibleItems}
          selectedIds={selectedIds}
          ontoggle={onitemtoggle}
          {...(shortNameFn ? { shortNameFn } : {})}
          {...(maxSelections !== undefined ? { maxSelections } : {})}
          {locale}
        />
      </div>
    {/if}
  </div>
{/if}
