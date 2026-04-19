<script lang="ts">
  /**
   * Skeleton loader for trade cards.
   * Shows 3 pulsing placeholder blocks while data loads.
   */
  interface Props {
    count?: number;
  }

  let { count = 3 }: Props = $props();
</script>

<div class="space-y-3" aria-busy="true" aria-label="Loading trades">
  {#each Array(count) as _}
    <div class="p-4 border border-border rounded-lg shadow-sm bg-card">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0 flex-1 space-y-3">
          <div class="h-4 bg-muted rounded animate-pulse w-3/4"></div>
          <div class="h-3 bg-muted rounded animate-pulse w-1/2"></div>
          <div class="h-3 bg-muted rounded animate-pulse w-1/3"></div>
        </div>
        <div class="shrink-0 flex flex-col gap-2">
          <div class="h-8 w-24 bg-muted rounded animate-pulse"></div>
          <div class="h-8 w-24 bg-muted rounded animate-pulse"></div>
        </div>
      </div>
    </div>
  {/each}
</div>
