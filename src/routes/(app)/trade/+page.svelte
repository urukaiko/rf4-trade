<script lang="ts">
  /**
   * Marketplace page - Browse and create trades.
   * Two tabs: Search (browse active trades) and Create (create new trades).
   */
  import type { PageData } from './$types';
  import { TradeList, CreateTradeForm, TradeFilter, Button } from '$lib/components';
  import { error as showError } from '$lib/shared/toast';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { useTradeStream } from '$lib/client/useTradeStream.svelte';
  import type { TradeView } from '$lib/shared/types/trade';
  import { Search, Plus } from 'lucide-svelte';
  import { createTranslator } from '$lib/i18n';
  import {
    ERR_CLOSE_TRADE, ERR_NETWORK, ERR_STREAM_DISCONNECTED
  } from '$lib/shared/constants/ui';

  let { data }: { data: PageData } = $props();

  const t = createTranslator(() => data.locale);

  // Sync active tab with URL
  const initialTab = $page.url.searchParams.get('tab') ?? 'search';
  let activeTab = $state<'search' | 'create'>(initialTab as 'search' | 'create');
  let hasInitialized = $state(false);

  // Stream enabled flag -- toggled for manual reconnect
  let streamEnabled = $state(true);
  const streamActive = $derived(activeTab === 'search' && streamEnabled);

  // Live trades list updated by SSE stream -- initialized empty, synced via $effect
  let liveTrades = $state<TradeView[]>([]);
  // Track which trades should show the "new" highlight
  let newTradeIds = $state<Set<string>>(new Set());

  // Infinite scroll state
  let isLoadingMore = $state(false);
  let hasMore = $state(false);
  let currentPage = $state(1);

  // Sync state with server data when it changes (e.g., initial load, pagination, reconnect)
  let initialSyncDone = $state(false);
  $effect(() => {
    if (!initialSyncDone) {
      liveTrades = [...data.trades];
      hasMore = data.hasMore;
      initialSyncDone = true;
    } else {
      liveTrades = data.trades;
      hasMore = data.hasMore;
      currentPage = 1;
      newTradeIds.clear();
      newTradeIds = newTradeIds; // trigger reactivity
    }
  });

  // Stream callback uses current liveTrades via closure over $state
  // useTradeStream internally uses $effect so streamActive is read reactively
  // svelte-ignore state_referenced_locally
  const stream = useTradeStream(
    streamActive,
    (payload, type) => {
      // Read current URL filter params from the live store, not captured closure
      const currentUrl = $page.url;
      const offerItemsParam = currentUrl.searchParams.get('offer_items');
      const wantItemsParam = currentUrl.searchParams.get('want_items');
      const offerFilterIds = offerItemsParam ? offerItemsParam.split(',').map(Number) : null;
      const wantFilterIds = wantItemsParam ? wantItemsParam.split(',').map(Number) : null;

      function matchesFilters(raw: { offerItemId?: number; wantItemId?: number }): boolean {
        if (!offerFilterIds && !wantFilterIds) return true;
        if (offerFilterIds && raw.wantItemId && !offerFilterIds.includes(raw.wantItemId)) return false;
        if (wantFilterIds && raw.offerItemId && !wantFilterIds.includes(raw.offerItemId)) return false;
        return true;
      }

      if (type === 'trade:created') {
        const raw = payload as { id: string; sellerId: string; seller: { displayName: string }; offer: { name: string; quantity: number }; want: { name: string; quantity: number }; stock: number; createdAt: string | Date; _isInitial?: boolean; offerItemId?: number; wantItemId?: number };
        // Skip if doesn't match active filters
        if (!matchesFilters(raw)) return;
        // Normalize createdAt from ISO string to Date (SSE sends serialized JSON)
        const trade: TradeView = {
          id: raw.id,
          sellerId: raw.sellerId,
          seller: raw.seller,
          offer: raw.offer,
          want: raw.want,
          stock: raw.stock,
          createdAt: typeof raw.createdAt === 'string' ? new Date(raw.createdAt) : raw.createdAt,
        };
        // Prepend, avoiding duplicates by ID
        if (!liveTrades.some((t) => t.id === trade.id)) {
          liveTrades = [trade, ...liveTrades];
          // Only highlight if NOT from initial snapshot (reconnect/tab switch)
          if (!raw._isInitial) {
            newTradeIds.add(trade.id);
            newTradeIds = newTradeIds; // trigger reactivity
          }
        }
      } else if (type === 'trade:updated') {
        const raw = payload as { id: string; sellerId: string; seller: { displayName: string }; offer: { name: string; quantity: number }; want: { name: string; quantity: number }; stock: number; createdAt: string | Date };
        const updated: TradeView = {
          ...raw,
          createdAt: typeof raw.createdAt === 'string' ? new Date(raw.createdAt) : raw.createdAt,
        };
        liveTrades = liveTrades.map((t) => (t.id === updated.id ? updated : t));
      } else if (type === 'trade:closed') {
        const closed = payload as { id: string };
        liveTrades = liveTrades.filter((t) => t.id !== closed.id);
        newTradeIds.delete(closed.id);
        newTradeIds = newTradeIds; // trigger reactivity
      }
    },
    () => {
      showError(ERR_STREAM_DISCONNECTED);
    },
  );

  async function handleLoadMore() {
    if (isLoadingMore || !hasMore) return;

    isLoadingMore = true;
    try {
      const nextPage = currentPage + 1;
      const url = new URL($page.url);
      url.searchParams.set('page', String(nextPage));

      const response = await fetch(url.toString(), {
        headers: { Accept: 'text/html' },
      });

      if (!response.ok) return;

      const html = await response.text();

      // Extract trades from the page script tag (SvelteKit data)
      const match = html.match(/__sveltekit_data__\s*=\s*(\{.*?\});/s);
      if (match?.[1]) {
        try {
          const parsed = JSON.parse(match[1]);
          const newTrades = parsed?.nodes?.[1]?.data?.trades ?? [];
          const newHasMore = parsed?.nodes?.[1]?.data?.hasMore ?? false;

          if (newTrades.length > 0) {
            // Append only unique trades
            const existingIds = new Set(liveTrades.map((t) => t.id));
            const uniqueNew = newTrades.filter((t: TradeView) => !existingIds.has(t.id));
            liveTrades = [...liveTrades, ...uniqueNew];
            hasMore = newHasMore;
            currentPage = nextPage;
          }
        } catch {
          // JSON parse error -- skip
        }
      }
    } finally {
      isLoadingMore = false;
    }
  }

  function handleCreateFirstTrade() {
    if (data.user) {
      activeTab = 'create';
    } else {
      goto('/login');
    }
  }

  $effect(() => {
    const currentTab = $page.url.searchParams.get('tab') ?? 'search';

    // If URL already matches active tab, nothing to do
    if (currentTab === activeTab) {
      if (!hasInitialized) hasInitialized = true;
      return;
    }

    // Don't redirect during initial hydration
    if (!hasInitialized) return;

    // Sync URL to match active tab — preserve pathname and other query params
    const current = new URL($page.url);
    if (activeTab === 'create') {
      current.searchParams.set('tab', 'create');
    } else {
      current.searchParams.set('tab', 'search');
    }
    goto(current.toString(), { replaceState: true, noScroll: true, keepFocus: true });
  });

  // Track closing trades to prevent double-clicks
  let closingTradeIds = $state<Set<string>>(new Set());

  async function handleCloseTrade(tradeId: string) {
    // Prevent double-click
    if (closingTradeIds.has(tradeId)) return;

    closingTradeIds.add(tradeId);
    closingTradeIds = closingTradeIds; // trigger reactivity

    try {
      const response = await fetch('/api/trades/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tradeId }),
      });

      if (response.ok) {
        // Optimistically remove from UI immediately
        liveTrades = liveTrades.filter((t) => t.id !== tradeId);
        newTradeIds.delete(tradeId);
        newTradeIds = newTradeIds; // trigger reactivity
      } else {
        const error = await response.json();
        showError(error.error ?? ERR_CLOSE_TRADE);
        // Remove from closing set on error so user can retry
        closingTradeIds.delete(tradeId);
        closingTradeIds = closingTradeIds;
      }
    } catch {
      showError(ERR_NETWORK);
      // Remove from closing set on error so user can retry
      closingTradeIds.delete(tradeId);
      closingTradeIds = closingTradeIds;
    } finally {
      // Clean up closing state after request completes
      closingTradeIds.delete(tradeId);
      closingTradeIds = closingTradeIds;
    }
  }
</script>

<div class="px-4 sm:px-6 py-6 max-w-6xl mx-auto w-full box-border">
  <!-- Unified Tab Bar (browser-tab style) -->
  <div class="flex items-center gap-1 mb-0">
    <!-- Search Tab -->
    <button
      class="px-6 py-3 text-sm font-medium border-b-2 transition-colors rounded-t-lg cursor-pointer flex items-center gap-2
             {activeTab === 'search'
               ? 'border-primary text-primary bg-primary/5'
               : 'border-transparent text-muted-foreground bg-card hover:text-foreground hover:border-border'}"
      onclick={() => activeTab = 'search'}
      aria-label={t('tabs.ariaSearch')}
    >
      <Search size={16} class="shrink-0" /> {t('tabs.search')}
    </button>

    <!-- Create Tab -->
    <button
      class="px-6 py-3 text-sm font-medium border-b-2 transition-colors rounded-t-lg cursor-pointer flex items-center gap-2
             {activeTab === 'create'
               ? 'border-primary text-primary bg-primary/5'
               : 'border-transparent text-muted-foreground bg-card hover:text-foreground hover:border-border'}"
      onclick={() => activeTab = 'create'}
      aria-label={t('tabs.ariaCreate')}
    >
      <Plus size={16} class="shrink-0" /> {t('tabs.create')}
    </button>
  </div>

  <!-- Content Area — shared background, consistent padding -->
  <div class="bg-card border border-border rounded-b-lg p-6 -mt-px w-full min-h-[600px] overflow-hidden">

    {#if activeTab === 'search'}
      <div class="w-full">
        <TradeFilter itemsByCategory={data.itemsByCategory} locale={data.locale} />

        <div class="mt-6 w-full">
          {#if liveTrades.length === 0}
            <!-- Empty state -->
            <div class="flex flex-col items-center justify-center py-16 text-center" role="status" aria-busy="false">
              <span class="text-6xl mb-4">🐟</span>
              <h2 class="text-xl font-semibold text-foreground mb-2">{t('trade.emptyTitle')}</h2>
              <p aria-live="polite" class="text-sm text-muted-foreground mb-6">{t('trade.emptyText')}</p>
              <Button
                variant="default"
                size="lg"
                onclick={handleCreateFirstTrade}
                aria-label={t('trade.ariaCreateFirst')}
              >
                {t('trade.btnCreateFirst')}
              </Button>
            </div>
          {:else}
            <TradeList
              trades={liveTrades}
              userPlayerId={data.userPlayerId}
              onclose={handleCloseTrade}
              newTradeIds={newTradeIds}
              closingTradeIds={closingTradeIds}
              hasMore={hasMore}
              onLoadMore={handleLoadMore}
              isLoadingMore={isLoadingMore}
              locale={data.locale}
            />
          {/if}
        </div>
      </div>
    {/if}

    {#if activeTab === 'create'}
      <div class="w-full">
        <CreateTradeForm itemsByCategory={data.itemsByCategory} user={data.user} locale={data.locale} />
      </div>
    {/if}

  </div>
</div>