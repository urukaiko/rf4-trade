<script lang="ts">
  import type { PageData } from './$types';
  import { goto } from '$app/navigation';
  import Card from '$lib/components/ui/Card.svelte';
  import CardHeader from '$lib/components/ui/CardHeader.svelte';
  import CardTitle from '$lib/components/ui/CardTitle.svelte';
  import CardContent from '$lib/components/ui/CardContent.svelte';
  import CardFooter from '$lib/components/ui/CardFooter.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';
  import Separator from '$lib/components/ui/Separator.svelte';
  import Avatar from '$lib/components/ui/Avatar.svelte';
  import * as toast from '$lib/shared/toast';
  import { ERR_NETWORK } from '$lib/shared/constants/ui';

  let { data }: { data: PageData } = $props();

  let loading = $state(false);

  async function acceptTrade() {
    if (loading) return;
    loading = true;
    try {
      const res = await fetch('/api/trades/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tradeId: data.trade.id }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Trade accepted!');
        goto('/profile/trades');
      } else {
        toast.error(json.error?.message ?? 'Failed to accept trade');
      }
    } catch {
      toast.error(ERR_NETWORK);
    } finally {
      loading = false;
    }
  }

  async function closeTrade() {
    if (loading) return;
    loading = true;
    try {
      const res = await fetch('/api/trades/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tradeId: data.trade.id }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Trade closed');
        goto('/profile/trades');
      } else {
        toast.error(json.error?.message ?? 'Failed to close trade');
      }
    } catch {
      toast.error(ERR_NETWORK);
    } finally {
      loading = false;
    }
  }

  function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  }
</script>

<div class="max-w-4xl mx-auto space-y-6">
  <!-- Back link -->
  <a href="/trade" class="text-sm text-muted-foreground hover:text-foreground transition-fast">← Back to Market</a>

  <!-- Trade Header -->
  <Card>
    <CardHeader>
      <CardTitle class="text-lg">Trade Details</CardTitle>
    </CardHeader>
    <CardContent class="space-y-4">
      <!-- Offer → Want -->
      <div class="flex items-center gap-4 flex-wrap">
        <div class="flex items-center gap-3">
          {#if data.trade.offer.imageUrl}
            <img src={data.trade.offer.imageUrl} alt={data.trade.offer.name} class="h-12 w-12 rounded-md object-cover bg-muted" />
          {:else}
            <div class="h-12 w-12 rounded-md bg-muted flex items-center justify-center text-muted-foreground text-xs">
              {data.trade.offer.code.slice(0, 4)}
            </div>
          {/if}
          <div>
            <p class="font-medium text-foreground">{data.trade.offer.name}</p>
            <p class="text-sm text-muted-foreground">× {data.trade.offer.quantity}</p>
          </div>
        </div>

        <svg class="h-6 w-6 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>

        <div class="flex items-center gap-3">
          {#if data.trade.want.imageUrl}
            <img src={data.trade.want.imageUrl} alt={data.trade.want.name} class="h-12 w-12 rounded-md object-cover bg-muted" />
          {:else}
            <div class="h-12 w-12 rounded-md bg-muted flex items-center justify-center text-muted-foreground text-xs">
              {data.trade.want.code.slice(0, 4)}
            </div>
          {/if}
          <div>
            <p class="font-medium text-foreground">{data.trade.want.name}</p>
            <p class="text-sm text-muted-foreground">× {data.trade.want.quantity}</p>
          </div>
        </div>
      </div>

      <Separator />

      <!-- Seller info -->
      <div class="flex items-center gap-3">
        <Avatar fallback={data.trade.sellerDisplayName.charAt(0)} size="md" />
        <div>
          <p class="font-medium text-foreground">{data.trade.sellerDisplayName}</p>
          <p class="text-xs text-muted-foreground">Posted {timeAgo(data.trade.createdAt.toString())}</p>
        </div>
        {#if data.trade.stock > 0}
          <Badge variant="success" class="ml-auto">Stock: {data.trade.stock}</Badge>
        {:else}
          <Badge variant="destructive" class="ml-auto">Out of stock</Badge>
        {/if}
      </div>
    </CardContent>
    <CardFooter class="gap-2">
      {#if !data.isOwner}
        <Button variant="default" onclick={acceptTrade} loading={loading} disabled={data.trade.stock <= 0 || data.trade.status !== 'ACTIVE'}>
          Accept Trade
        </Button>
      {:else}
        <Button variant="destructive" onclick={closeTrade} loading={loading}>
          Close Trade
        </Button>
      {/if}
      <Button variant="outline" onclick={() => goto('/trade')}>Back</Button>
    </CardFooter>
  </Card>

  <!-- Other trades by this seller -->
  {#if data.otherTrades.length > 0}
    <Card>
      <CardHeader>
        <CardTitle class="text-base">Other trades by {data.trade.sellerDisplayName}</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="space-y-2">
          {#each data.otherTrades as ot (ot.id)}
            <a href="/trade/{ot.id}" class="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-fast">
              <span class="text-sm text-foreground">
                {ot.offerName} × {ot.offerQuantity} → {ot.wantName} × {ot.wantQuantity}
              </span>
            </a>
          {/each}
        </div>
      </CardContent>
    </Card>
  {/if}

  <!-- Similar trades -->
  {#if data.similarTrades.length > 0}
    <Card>
      <CardHeader>
        <CardTitle class="text-base">Similar Trades</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="space-y-2">
          {#each data.similarTrades as st (st.id)}
            <a href="/trade/{st.id}" class="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-fast">
              <div>
                <p class="text-sm text-foreground">
                  {st.offerName} × {st.offerQuantity} → {st.wantName} × {st.wantQuantity}
                </p>
                <p class="text-xs text-muted-foreground">by {st.sellerDisplayName} · {timeAgo(st.createdAt.toString())}</p>
              </div>
            </a>
          {/each}
        </div>
      </CardContent>
    </Card>
  {/if}
</div>
