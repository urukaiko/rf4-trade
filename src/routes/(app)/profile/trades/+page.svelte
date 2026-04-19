<script lang="ts">
  import type { PageData } from './$types';
  import { enhance } from '$app/forms';
  import { Button } from '$lib/components';
  import { TradeStatus } from '$lib/shared/constants';
  import { createTranslator } from '$lib/i18n';

  let { data, form }: { data: PageData; form: Record<string, unknown> | null } = $props();

  const t = createTranslator(() => data.locale);

  // --- Tab state ---
  let activeTab = $state<'active' | 'closed'>('active');

  // --- Filter trades by status ---
  let activeTrades = $derived(data.trades.filter((t) => t.status === TradeStatus.ACTIVE));
  let closedTrades = $derived(data.trades.filter((t) => t.status === TradeStatus.CLOSED));

  // --- Handle form action result ---
  $effect(() => {
    if (form?.success) {
      // Page will reload automatically
    }
  });
</script>

<div class="p-6 max-w-4xl">
  <h1 class="text-2xl font-bold mb-6 text-foreground">{t('myTrades.title')}</h1>

  {#if data.trades.length === 0}
    <p class="text-muted-foreground italic">{t('myTrades.noTrades')}</p>
  {:else}
    <!-- Browser-style tabs matching main page -->
    <div class="flex items-center gap-1 mb-0">
      <button
        class="px-6 py-3 text-sm font-medium border-b-2 transition-colors rounded-t-lg cursor-pointer
               {activeTab === 'active'
                 ? 'border-primary text-primary bg-primary/5'
                 : 'border-transparent text-muted-foreground bg-card hover:text-foreground hover:border-border'}"
        onclick={() => activeTab = 'active'}
      >
        {t('myTrades.tabActive')} ({activeTrades.length})
      </button>
      <button
        class="px-6 py-3 text-sm font-medium border-b-2 transition-colors rounded-t-lg cursor-pointer
               {activeTab === 'closed'
                 ? 'border-primary text-primary bg-primary/5'
                 : 'border-transparent text-muted-foreground bg-card hover:text-foreground hover:border-border'}"
        onclick={() => activeTab = 'closed'}
      >
        {t('myTrades.tabClosed')} ({closedTrades.length})
      </button>
    </div>

    <!-- Tab content with shared background -->
    <div class="bg-card border border-border rounded-b-lg p-6 -mt-px">

    <!-- Active Trades -->
    {#if activeTab === 'active'}
      {#if activeTrades.length === 0}
        <p class="text-muted-foreground italic">{t('myTrades.noActive')}</p>
      {:else}
        <div class="space-y-3">
          {#each activeTrades as trade (trade.id)}
            <div class="p-4 bg-card border border-border rounded-lg shadow-sm">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <p class="text-sm font-medium text-foreground">
                    {t('myTrades.youOffer')}
                    <span class="font-semibold text-primary">{trade.offer.quantity}× {trade.offer.name}</span>
                    {t('myTrades.for')}
                    <span class="font-semibold text-success">{trade.want.quantity}× {trade.want.name}</span>
                  </p>
                  <p class="text-xs text-muted-foreground mt-1">
                    {t('tradeCard.stock')} {trade.stock}
                  </p>
                  <p class="text-xs text-muted-foreground mt-1">
                    {trade.createdAt.toLocaleDateString()} {trade.createdAt.toLocaleTimeString()}
                  </p>
                </div>
                <form method="POST" action="?/closeTrade" use:enhance>
                  <input type="hidden" name="tradeId" value={trade.id} />
                  <Button type="submit" variant="destructive" size="default" class="px-4">
                    {t('tradeCard.closeTrade')}
                  </Button>
                </form>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    {/if}

    <!-- Closed Trades -->
    {#if activeTab === 'closed'}
      {#if closedTrades.length === 0}
        <p class="text-muted-foreground italic">{t('myTrades.noClosed')}</p>
      {:else}
        <div class="space-y-3">
          {#each closedTrades as trade (trade.id)}
            <div class="p-4 bg-muted/50 border border-border rounded-lg shadow-sm opacity-75">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="inline-block px-2 py-0.5 text-xs font-semibold text-muted-foreground bg-muted rounded">
                      {t('myTrades.statusClosed')}
                    </span>
                  </div>
                  <p class="text-sm font-medium text-foreground">
                    {t('myTrades.youOffered')}
                    <span class="font-semibold text-primary">{trade.offer.quantity}× {trade.offer.name}</span>
                    {t('myTrades.for')}
                    <span class="font-semibold text-success">{trade.want.quantity}× {trade.want.name}</span>
                  </p>
                  <p class="text-xs text-muted-foreground mt-1">
                    {t('tradeCard.stock')} {trade.stock}
                  </p>
                  <p class="text-xs text-muted-foreground mt-1">
                    {trade.createdAt.toLocaleDateString()} {trade.createdAt.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    {/if}

    </div>
  {/if}
</div>