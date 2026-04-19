<script lang="ts">
  import ItemGrid from './ItemGrid.svelte';
  import type { CatalogItem } from '$lib/shared/types/item';
  import type { TradeFormState } from '$lib/shared/state/trade-form.svelte';
  import { resolveName, resolveCategoryName, ensureCategoriesLoaded, getCategories, subscribeCategories } from '$lib/shared/utils/i18n';
  import { createTranslator } from '$lib/i18n';
  import { onMount } from 'svelte';

  interface Props {
    itemsByCategory: Record<string, CatalogItem[]>;
    formState: TradeFormState;
    searchQuery: string;
    shortNameFn?: (name: string) => string;
    locale?: 'ru' | 'en';
  }

  let {
    itemsByCategory,
    formState,
    searchQuery,
    shortNameFn,
    locale = 'en',
  }: Props = $props();

  const t = createTranslator(() => locale);

  const categories = $derived(Object.keys(itemsByCategory ?? {}));
  const maxSelections = $derived(formState.maxSelections);

  // 🔄 Track if categories are loaded
  let categoriesLoaded = $state(false);
  let catVersion = $state(0);

  onMount(async () => {
    // Subscribe to changes
    const unsub = subscribeCategories(() => {
      catVersion++;
    });

    // Check if already loaded (from SSR cache)
    const existing = getCategories();
    if (Object.keys(existing).length > 0) {
      categoriesLoaded = true;
    }

    // Ensure loaded (will trigger callback if needed)
    await ensureCategoriesLoaded();
    categoriesLoaded = true;

    return unsub;
  });

  // Establish reactive dependency
  void catVersion;

  function getSubGroups(items: CatalogItem[]): { subCategory: string; items: CatalogItem[] }[] {
    const map = new Map<string, CatalogItem[]>();
    for (const item of items) {
      const sub = item.subCategory ?? '';
      const group = map.get(sub) ?? [];
      group.push(item);
      map.set(sub, group);
    }
    return [...map.entries()]
      .sort(([a], [b]) => {
        if (a === '') return -1;
        if (b === '') return 1;
        return a.localeCompare(b);
      })
      .map(([subCategory, items]) => ({ subCategory, items }));
  }

  function matchesSearch(item: CatalogItem): boolean {
    if (!searchQuery) return true;
    const name = resolveName(item.translations, locale, item.code);
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  }
</script>

<!-- Show skeleton/loading until categories are loaded to prevent flicker -->
{#if !categoriesLoaded}
  <div class="grid grid-cols-2 gap-6">
    <div class="flex flex-col min-w-0">
      <div class="flex items-center justify-between mb-2">
        <h3 class="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
          {t('itemSelector.have')}
        </h3>
        <span class="text-xs font-medium px-2 py-0.5 rounded bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground">
          0 {t('itemSelector.selected')}
        </span>
      </div>
      <div class="space-y-1 animate-pulse">
        {#each Array(3) as _}
          <div class="h-10 bg-muted rounded"></div>
        {/each}
      </div>
    </div>
    <div class="flex flex-col min-w-0">
      <div class="flex items-center justify-between mb-2">
        <h3 class="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
          {t('itemSelector.want')}
        </h3>
        <span class="text-xs font-medium px-2 py-0.5 rounded bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground">
          0 {t('itemSelector.selected')}
        </span>
      </div>
      <div class="space-y-1 animate-pulse">
        {#each Array(3) as _}
          <div class="h-10 bg-muted rounded"></div>
        {/each}
      </div>
    </div>
  </div>
{:else}
<div class="grid grid-cols-2 gap-6">
  <!-- I Have Column -->
  <div class="flex flex-col min-w-0">
    <div class="flex items-center justify-between mb-2">
      <h3 class="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
        {t('itemSelector.have')}
      </h3>
      <span class="text-xs font-medium px-2 py-0.5 rounded bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground">
        {formState.selectedHave.length} {t('itemSelector.selected')}
      </span>
    </div>

    {#if categories.length === 0}
      <p class="text-sm text-muted-foreground py-4 text-center">{t('itemSelector.noItems')}</p>
    {:else}
      <div class="space-y-1">
        {#each categories as category}
          {@const allItems = (itemsByCategory ?? {})[category] ?? []}
          {@const filteredItems = searchQuery ? allItems.filter(matchesSearch) : allItems}
          {@const subGroups = getSubGroups(filteredItems)}

          {#if subGroups.length > 0}
            <div>
              <button
                class="w-full text-left px-3 py-2 text-sm font-semibold rounded bg-secondary text-secondary-foreground hover:bg-muted transition-colors uppercase tracking-wide focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onclick={() => formState.toggleCategory('have', category)}
              >
                <span class="flex items-center justify-between">
                  {resolveCategoryName(category, locale)}
                  <span class="text-xs text-muted-foreground">{formState.expandedHave === category ? '▼' : '▶'}</span>
                </span>
              </button>

              {#if formState.expandedHave === category}
                {#each subGroups as group}
                  {#if group.subCategory}
                    <div class="ml-1 mt-2 mb-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {resolveCategoryName(group.subCategory, locale)}
                    </div>
                  {/if}

                  <ItemGrid
                    items={group.items}
                    selectedIds={formState.selectedHave}
                    ontoggle={formState.toggleHave.bind(formState)}
                    {...(shortNameFn ? { shortNameFn } : {})}
                    {maxSelections}
                    {locale}
                  />
                {/each}
              {/if}
            </div>
          {/if}
        {/each}
      </div>
    {/if}
  </div>

  <!-- I WANT Column -->
  <div class="flex flex-col min-w-0">
    <div class="flex items-center justify-between mb-2">
      <h3 class="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
        {t('itemSelector.want')}
      </h3>
      <span class="text-xs font-medium px-2 py-0.5 rounded bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground">
        {formState.selectedWant.length} {t('itemSelector.selected')}
      </span>
    </div>

    {#if categories.length === 0}
      <p class="text-sm text-muted-foreground py-4 text-center">{t('itemSelector.noItems')}</p>
    {:else}
      <div class="space-y-1">
        {#each categories as category}
          {@const allItems = (itemsByCategory ?? {})[category] ?? []}
          {@const filteredItems = searchQuery ? allItems.filter(matchesSearch) : allItems}
          {@const subGroups = getSubGroups(filteredItems)}

          {#if subGroups.length > 0}
            <div>
              <button
                class="w-full text-left px-3 py-2 text-sm font-semibold rounded bg-secondary text-secondary-foreground hover:bg-muted transition-colors uppercase tracking-wide focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onclick={() => formState.toggleCategory('want', category)}
              >
                <span class="flex items-center justify-between">
                  {resolveCategoryName(category, locale)}
                  <span class="text-xs text-muted-foreground">{formState.expandedWant === category ? '▼' : '▶'}</span>
                </span>
              </button>

              {#if formState.expandedWant === category}
                {#each subGroups as group}
                  {#if group.subCategory}
                    <div class="ml-1 mt-2 mb-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {resolveCategoryName(group.subCategory, locale)}
                    </div>
                  {/if}

                  <ItemGrid
                    items={group.items}
                    selectedIds={formState.selectedWant}
                    ontoggle={formState.toggleWant.bind(formState)}
                    {...(shortNameFn ? { shortNameFn } : {})}
                    {maxSelections}
                    {locale}
                  />
                {/each}
              {/if}
            </div>
          {/if}
        {/each}
      </div>
    {/if}
  </div>
</div>
{/if}