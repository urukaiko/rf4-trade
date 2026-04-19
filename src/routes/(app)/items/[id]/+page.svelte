<script lang="ts">
  import type { PageData } from './$types';
  import Card from '$lib/components/ui/Card.svelte';
  import CardHeader from '$lib/components/ui/CardHeader.svelte';
  import CardTitle from '$lib/components/ui/CardTitle.svelte';
  import CardContent from '$lib/components/ui/CardContent.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Separator from '$lib/components/ui/Separator.svelte';

  let { data }: { data: PageData } = $props();

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

  <!-- Item Header -->
  <Card>
    <CardHeader>
      <div class="flex items-center gap-4">
        {#if data.item.imageUrl}
          <img src={data.item.imageUrl} alt={data.item.name} class="h-16 w-16 rounded-lg object-cover bg-muted" />
        {:else}
          <div class="h-16 w-16 rounded-lg bg-muted flex items-center justify-center text-muted-foreground text-lg">
            {data.item.code.slice(0, 4)}
          </div>
        {/if}
        <div>
          <CardTitle>{data.item.name}</CardTitle>
          <p class="text-sm text-muted-foreground">{data.item.category}{#if data.item.subCategory} / {data.item.subCategory}{/if}</p>
        </div>
      </div>
    </CardHeader>
  </Card>

  <!-- Trades offering this item -->
  <Card>
    <CardHeader>
      <CardTitle class="text-base">Active Offers ({data.tradesOffering.length})</CardTitle>
      <p class="text-sm text-muted-foreground">Players offering {data.item.name} in exchange for other items</p>
    </CardHeader>
    <CardContent>
      {#if data.tradesOffering.length === 0}
        <p class="text-sm text-muted-foreground text-center py-6">No active offers for this item</p>
      {:else}
        <div class="space-y-2">
          {#each data.tradesOffering as t (t.id)}
            <a href="/trade/{t.id}" class="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-fast">
              <div>
                <p class="text-sm text-foreground">
                  {data.item.name} × {t.offerQuantity} → {t.wantName} × {t.wantQuantity}
                </p>
                <p class="text-xs text-muted-foreground">by {t.sellerDisplayName} · {timeAgo(t.createdAt)}</p>
              </div>
              {#if t.stock > 0}
                <Badge variant="success" class="shrink-0">Stock: {t.stock}</Badge>
              {:else}
                <Badge variant="destructive" class="shrink-0">Out</Badge>
              {/if}
            </a>
          {/each}
        </div>
      {/if}
    </CardContent>
  </Card>

  <!-- Trades wanting this item -->
  <Card>
    <CardHeader>
      <CardTitle class="text-base">Wanted By ({data.tradesWanting.length})</CardTitle>
      <p class="text-sm text-muted-foreground">Players looking for {data.item.name}</p>
    </CardHeader>
    <CardContent>
      {#if data.tradesWanting.length === 0}
        <p class="text-sm text-muted-foreground text-center py-6">No one is looking for this item</p>
      {:else}
        <div class="space-y-2">
          {#each data.tradesWanting as t (t.id)}
            <a href="/trade/{t.id}" class="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-fast">
              <div>
                <p class="text-sm text-foreground">
                  {t.offerName} × {t.offerQuantity} → {data.item.name} × {t.wantQuantity}
                </p>
                <p class="text-xs text-muted-foreground">by {t.sellerDisplayName} · {timeAgo(t.createdAt)}</p>
              </div>
              {#if t.stock > 0}
                <Badge variant="success" class="shrink-0">Stock: {t.stock}</Badge>
              {:else}
                <Badge variant="destructive" class="shrink-0">Out</Badge>
              {/if}
            </a>
          {/each}
        </div>
      {/if}
    </CardContent>
  </Card>
</div>
