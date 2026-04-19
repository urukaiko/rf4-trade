<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    page: number;
    totalPages: number;
    onchange?: (page: number) => void;
    siblings?: number;
  }

  let { page, totalPages, onchange, siblings = 1 }: Props = $props();

  function goTo(p: number) {
    if (p >= 1 && p <= totalPages) onchange?.(p);
  }

  const pages = $derived(() => {
    const range: (number | string)[] = [];
    const start = Math.max(1, page - siblings);
    const end = Math.min(totalPages, page + siblings);

    if (start > 1) {
      range.push(1);
      if (start > 2) range.push('...');
    }
    for (let i = start; i <= end; i++) range.push(i);
    if (end < totalPages) {
      if (end < totalPages - 1) range.push('...');
      range.push(totalPages);
    }
    return range;
  });
</script>

<nav class="flex items-center gap-1" aria-label="Pagination">
  <button
    class="h-8 w-8 rounded-md border border-input bg-card text-sm hover:bg-accent transition-fast disabled:opacity-50"
    disabled={page <= 1}
    onclick={() => goTo(page - 1)}
    aria-label="Previous page"
  >
    ‹
  </button>

  {#each pages() as p}
    {#if typeof p === 'string'}
      <span class="h-8 w-8 flex items-center justify-center text-muted-foreground">…</span>
    {:else}
      <button
        class="h-8 w-8 rounded-md text-sm transition-fast {p === page ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}"
        onclick={() => goTo(p)}
        aria-current={p === page ? 'page' : undefined}
      >
        {p}
      </button>
    {/if}
  {/each}

  <button
    class="h-8 w-8 rounded-md border border-input bg-card text-sm hover:bg-accent transition-fast disabled:opacity-50"
    disabled={page >= totalPages}
    onclick={() => goTo(page + 1)}
    aria-label="Next page"
  >
    ›
  </button>
</nav>
