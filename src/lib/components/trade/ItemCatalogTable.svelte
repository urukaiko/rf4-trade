<script lang="ts">
  import type { CatalogItem } from '$lib/shared/types/item';
  import { resolveName } from '$lib/shared/utils/i18n';

  interface Props {
    itemsByCategory: Record<string, CatalogItem[]>;
    locale?: 'ru' | 'en';
  }

  let { itemsByCategory, locale = 'en' }: Props = $props();
</script>

<!-- Item Catalog (always visible) -->
<div class="mt-8">
  <h1 class="text-2xl font-bold mb-4 text-foreground">Item Catalog</h1>

  <table class="w-full border-collapse border border-border">
    <thead>
      <tr class="bg-muted">
        <th class="border border-border px-4 py-2 text-left text-foreground">ID</th>
        <th class="border border-border px-4 py-2 text-left text-foreground">Name</th>
        <th class="border border-border px-4 py-2 text-left text-foreground">Category</th>
      </tr>
    </thead>
    <tbody>
      {#each Object.values(itemsByCategory).flat() as row (row.id)}
        {@const itemName = resolveName(row.translations, locale, row.code)}
        <tr class="bg-card">
          <td class="border border-border px-4 py-2 text-foreground">{row.id}</td>
          <td class="border border-border px-4 py-2 text-foreground">{itemName}</td>
          <td class="border border-border px-4 py-2 text-foreground">{row.category}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
