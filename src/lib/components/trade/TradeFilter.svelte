<script lang="ts">
  import ItemSelector from './ItemSelector.svelte';
  import type { CatalogItem } from '$lib/shared/types/item';
  import { TradeFormState } from '$lib/shared/state/trade-form.svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { createTranslator } from '$lib/i18n';

  interface Props {
    itemsByCategory: Record<string, CatalogItem[]>;
    locale?: 'ru' | 'en';
  }

  let { itemsByCategory, locale = 'en' }: Props = $props();

  const t = createTranslator(() => locale);

  const filterState = new TradeFormState();
  filterState.maxSelections = Infinity;

  let searchQuery = $state('');

  function shortName(name: string): string {
    return name.split('_').map((w) => w[0]?.toUpperCase()).join('');
  }

  // Debounced URL sync
  let timeout: ReturnType<typeof setTimeout>;
  $effect(() => {
    const offerItems = filterState.selectedHave.join(',');
    const wantItems = filterState.selectedWant.join(',');

    clearTimeout(timeout);
    timeout = setTimeout(() => {
      const currentUrl = new URL($page.url);
      const params = currentUrl.searchParams;
      params.set('tab', 'search');

      if (offerItems) params.set('offer_items', offerItems);
      else params.delete('offer_items');

      if (wantItems) params.set('want_items', wantItems);
      else params.delete('want_items');

      const newQuery = params.toString();
      const newUrl = newQuery ? `/trade?${newQuery}` : '/trade?tab=search';
      goto(newUrl, { replaceState: true });
    }, 300);

    return () => clearTimeout(timeout);
  });
</script>

<div class="bg-card border border-border rounded-lg p-4 shadow-sm space-y-4 overflow-hidden">
  <h2 class="text-lg font-semibold text-foreground">{t('filter.title')}</h2>

  <!-- Search Input -->
  <input
    type="text"
    bind:value={searchQuery}
    placeholder={t('filter.placeholder')}
    aria-label={t('filter.ariaLabel')}
    class="w-full max-w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring box-border"
  />

  <!-- Item Selector (multi-select for filtering) -->
  <ItemSelector
    itemsByCategory={itemsByCategory}
    formState={filterState}
    {searchQuery}
    shortNameFn={shortName}
    {locale}
  />
</div>