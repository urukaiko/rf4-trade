<script lang="ts">
  import type { CatalogItem } from '$lib/shared/types/item';
  import { resolveName } from '$lib/shared/utils/i18n';

  interface Props {
    items: CatalogItem[];
    selectedIds: number[];
    ontoggle: (itemId: number) => void;
    shortNameFn?: (name: string) => string | undefined;
    maxSelections?: number;
    locale?: 'ru' | 'en';
  }

  let { items, selectedIds, ontoggle, shortNameFn, maxSelections = Infinity, locale = 'en' }: Props = $props();

  const isSingle = $derived(maxSelections === 1);

  function defaultShortName(name: string): string {
    return name.split('_').map((w) => w[0]?.toUpperCase()).join('');
  }

  const shortName = $derived(shortNameFn ?? defaultShortName);

  function isSelected(itemId: number): boolean {
    return selectedIds.includes(itemId);
  }
</script>

<div class="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-1 p-1" role="group" aria-label="Item selection grid">
  {#each items as item}
    {@const sel = isSelected(item.id)}
    {@const itemName = resolveName(item.translations, locale, item.code)}
    <button
      title={itemName}
      aria-label={itemName}
      class="aspect-square w-full flex items-center justify-center border-2 rounded text-xs font-medium transition-colors overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring {sel ? 'border-primary bg-primary/10 text-primary dark:bg-primary/15 dark:text-primary-foreground' : 'bg-muted text-muted-foreground dark:bg-muted/80 border-border hover:border-muted-foreground'}"
      onclick={() => ontoggle(item.id)}
      role="checkbox"
      aria-checked={sel}
    >
      {#if item.imageUrl}
        <img
          src={item.imageUrl}
          alt={itemName}
          class="w-full h-full object-contain rounded"
          loading="lazy"
        />
      {:else}
        <span class="truncate px-0.5">{shortName(itemName)}</span>
      {/if}
    </button>
  {/each}
</div>