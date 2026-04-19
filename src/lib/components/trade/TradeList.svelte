<script lang="ts">
  import TradeCard from './TradeCard.svelte';
  import type { TradeView } from '$lib/shared/types/trade';
  import { createTranslator } from '$lib/i18n';
  import type { Locale } from '$lib/i18n';

  interface Props {
    trades: TradeView[];
    userPlayerId: string | null;
    onclose: (tradeId: string) => void;
    hasMore?: boolean;
    onLoadMore?: () => void;
    isLoadingMore?: boolean;
    /** Set of trade IDs that should show the "new" highlight */
    newTradeIds?: Set<string>;
    /** Set of trade IDs that are currently being closed */
    closingTradeIds?: Set<string>;
    locale?: Locale;
  }

  let { trades, userPlayerId, onclose, hasMore = false, onLoadMore, isLoadingMore = false, newTradeIds = new Set(), closingTradeIds = new Set(), locale = 'en' }: Props = $props();

  const t = createTranslator(() => locale);

  function handleTrigger(node: HTMLElement): { destroy: () => void } {
    if (!onLoadMore || !hasMore) return { destroy: () => {} };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && hasMore && !isLoadingMore) {
          onLoadMore();
        }
      },
      { rootMargin: '200px' },
    );

    observer.observe(node);

    return { destroy: () => observer.disconnect() };
  }
</script>

{#if trades.length > 0}
  <div class="space-y-3">
    {#each trades as t (t.id)}
      <TradeCard
        trade={t}
        isOwnTrade={userPlayerId !== null && t.sellerId === userPlayerId}
        onclose={onclose}
        isNew={newTradeIds.has(t.id)}
        isClosing={closingTradeIds.has(t.id)}
        {locale}
      />
    {/each}
  </div>

  {#if hasMore}
    <div use:handleTrigger class="h-4 flex items-center justify-center py-4">
      {#if isLoadingMore}
        <p aria-live="polite" class="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          {t('trade.loadingMore')}
        </p>
      {/if}
    </div>
  {/if}
{/if}