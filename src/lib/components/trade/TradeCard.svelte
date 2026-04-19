<script lang="ts">
  import Button from '$lib/components/ui/Button.svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import CardContent from '$lib/components/ui/CardContent.svelte';
  import type { TradeView } from '$lib/shared/types/trade';
  import { success, error } from '$lib/shared/toast';
  import { copyToClipboard } from '$lib/shared/clipboard';
  import { ArrowRight } from 'lucide-svelte';
  import { createTranslator } from '$lib/i18n';
  import type { Locale } from '$lib/i18n';

  interface Props {
    trade: TradeView;
    isOwnTrade: boolean;
    onclose: (tradeId: string) => void;
    /** When true, triggers a 350ms highlight animation */
    isNew?: boolean;
    /** When true, shows loading state on the close button */
    isClosing?: boolean;
    locale?: Locale;
  }

  let { trade, isOwnTrade, onclose, isNew = false, isClosing = false, locale = 'en' }: Props = $props();

  const t = createTranslator(() => locale);

  let highlighted = $state(false);
  let fading = $state(false);

  // Contact replaces card content entirely
  let contactOpen = $state(false);
  let sliderValue = $state<number>(0);

  const ratio = $derived(trade.want.quantity / trade.offer.quantity);
  const sliderMin = $derived(trade.want.quantity);
  const sliderMax = $derived(trade.stock * ratio);
  const sliderStep = $derived(1);
  const impliedOfferQty = $derived(sliderValue / ratio);
  const contactMessage = $derived(
    t('tradeCard.contactMsg')
      .replace('{offerQty}', String(Math.round(impliedOfferQty * 10) / 10))
      .replace('{offerName}', trade.offer.name)
      .replace('{wantQty}', String(sliderValue))
      .replace('{wantName}', trade.want.name)
  );

  $effect(() => {
    if (!isNew) {
      highlighted = false;
      fading = false;
      return;
    }
    highlighted = true;
    fading = true;
    const fadeTimer = setTimeout(() => { fading = false; }, 300);
    const cleanupTimer = setTimeout(() => { highlighted = false; }, 350);
    return () => { clearTimeout(fadeTimer); clearTimeout(cleanupTimer); };
  });

  $effect(() => { sliderValue = trade.want.quantity; });

  function timeAgo(): string {
    const diff = Date.now() - new Date(trade.createdAt).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return t('tradeCard.timeJustNow');
    if (mins < 60) return `${mins}${t('tradeCard.timeMinsAgo')}`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}${t('tradeCard.timeHoursAgo')}`;
    return `${Math.floor(hrs / 24)}${t('tradeCard.timeDaysAgo')}`;
  }

  async function handleCopyNickname() {
    try {
      const ok = await copyToClipboard(trade.seller.displayName);
      if (ok) success(t('tradeCard.nickCopied'));
      else error(t('tradeCard.nickCopyFail'));
    } catch { error(t('tradeCard.nickCopyFail')); }
  }

  async function handleCopyMessage() {
    try {
      const ok = await copyToClipboard(contactMessage);
      if (ok) success(t('tradeCard.msgCopied'));
      else error(t('tradeCard.msgCopyFail'));
    } catch { error(t('tradeCard.msgCopyFail')); }
  }

  function toggleContact() {
    contactOpen = !contactOpen;
    if (contactOpen) sliderValue = trade.want.quantity;
  }
</script>

<Card class="group border-2 border-slate-500 dark:border-slate-600 hover:border-primary/50 hover:shadow-md transition-normal {highlighted ? (fading ? 'ring-2 ring-primary/50 bg-primary/5' : 'ring-2 ring-primary bg-primary/5') : ''}">
  <CardContent class="p-3">

    <!-- Header: Name · Time (inline, left-aligned) -->
    <div class="flex items-center mb-0.5 min-w-0">
      <span class="text-sm font-semibold text-foreground truncate">
        {trade.seller.displayName}
      </span>
      <span class="text-xs text-muted-foreground mx-1.5">·</span>
      <span class="text-xs text-muted-foreground flex-shrink-0">{timeAgo()}</span>
    </div>

    <!-- Stock below name, plain text -->
    {#if trade.stock > 0}
      <span class="text-[10px] text-muted-foreground block mb-2">{t('tradeCard.stock')} {trade.stock}</span>
    {:else}
      <span class="text-[10px] text-destructive block mb-2">{t('tradeCard.soldOut')}</span>
    {/if}

    {#if !contactOpen}
      <!-- ====== DEFAULT VIEW ====== -->

      <!-- Trade Details Row with Images + ArrowRight icon -->
      <div class="bg-muted/50 rounded-lg p-2 mb-2">
        <div class="flex items-center justify-center gap-3">
          <!-- Offer Item -->
          <div class="flex flex-col items-center gap-1.5 min-w-[80px]">
            {#if trade.offer.imageUrl}
              <img src={trade.offer.imageUrl} alt={trade.offer.name} loading="lazy"
                   class="w-16 h-16 rounded object-contain bg-muted p-0.5" />
            {:else}
              <div class="w-16 h-16 rounded bg-muted/80 flex items-center justify-center
                          text-sm text-muted-foreground font-bold">
                {trade.offer.name.slice(0, 2)}
              </div>
            {/if}
            <span class="text-sm font-medium text-primary text-center leading-tight">
              {trade.offer.quantity}×
            </span>
            <span class="text-xs text-muted-foreground text-center truncate w-full">
              {trade.offer.name}
            </span>
          </div>

          <!-- ArrowRight Icon (centered vertically with images) -->
          <div class="flex items-center justify-center h-16">
            <ArrowRight size={22} class="text-muted-foreground shrink-0" aria-hidden="true" />
          </div>

          <!-- Want Item -->
          <div class="flex flex-col items-center gap-1.5 min-w-[80px]">
            {#if trade.want.imageUrl}
              <img src={trade.want.imageUrl} alt={trade.want.name} loading="lazy"
                   class="w-16 h-16 rounded object-contain bg-muted p-0.5" />
            {:else}
              <div class="w-16 h-16 rounded bg-muted/80 flex items-center justify-center
                          text-sm text-muted-foreground font-bold">
                {trade.want.name.slice(0, 2)}
              </div>
            {/if}
            <span class="text-sm font-medium text-success text-center leading-tight">
              {trade.want.quantity}×
            </span>
            <span class="text-xs text-muted-foreground text-center truncate w-full">
              {trade.want.name}
            </span>
          </div>
        </div>
      </div>

      <!-- Action Button -->
      <div class="flex justify-end">
        {#if isOwnTrade}
          <Button variant="destructive" size="default" loading={isClosing}
                  disabled={isClosing} onclick={() => onclose(trade.id)}>
            {t('tradeCard.closeTrade')}
          </Button>
        {:else}
          <Button variant="default" size="default" onclick={toggleContact}>
            {t('tradeCard.contact')}
          </Button>
        {/if}
      </div>

    {:else}
      <!-- ====== CONTACT VIEW (replaces default) ====== -->

      <!-- Slider Row with Images (same border consistency) -->
      <div class="bg-muted/50 rounded-lg p-3 mb-3">
        <div class="flex items-center gap-3">
          <!-- Offer Item -->
          <div class="flex flex-col items-center gap-0 min-w-[70px]">
            {#if trade.offer.imageUrl}
              <img src={trade.offer.imageUrl} alt={trade.offer.name} loading="lazy"
                   class="w-12 h-12 rounded object-contain bg-muted p-1" />
            {:else}
              <div class="w-12 h-12 rounded bg-muted flex items-center justify-center
                          text-xs text-muted-foreground font-bold border border-border">?</div>
            {/if}
            <span class="text-sm font-bold text-primary">{Math.round(impliedOfferQty * 10) / 10}</span>
            <span class="text-[9px] text-muted-foreground text-center truncate w-full px-1">
              {trade.offer.name}
            </span>
          </div>

          <!-- Slider -->
          <div class="flex-1 flex flex-col gap-1">
            <input
              type="range"
              min={sliderMin}
              max={sliderMax}
              step={sliderStep}
              bind:value={sliderValue}
              class="w-full h-2 bg-gray-300 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <div class="flex justify-between text-[9px] text-muted-foreground">
              <span>{sliderMin}</span>
              <span>{Math.round(sliderMax * 10) / 10}</span>
            </div>
          </div>

          <!-- Want Item -->
          <div class="flex flex-col items-center gap-0 min-w-[70px]">
            {#if trade.want.imageUrl}
              <img src={trade.want.imageUrl} alt={trade.want.name} loading="lazy"
                   class="w-12 h-12 rounded object-contain bg-muted p-1" />
            {:else}
              <div class="w-12 h-12 rounded bg-muted flex items-center justify-center
                          text-xs text-muted-foreground font-bold border border-border">?</div>
            {/if}
            <span class="text-sm font-bold text-success">{sliderValue}</span>
            <span class="text-[9px] text-muted-foreground text-center truncate w-full px-1">
              {trade.want.name}
            </span>
          </div>
        </div>
      </div>

      <!-- Action Buttons Row -->
      <div class="grid grid-cols-3 gap-2">
        <Button variant="outline" size="default" onclick={handleCopyNickname}>
          {t('tradeCard.copyNick')}
        </Button>
        <Button variant="outline" size="default" onclick={handleCopyMessage}>
          {t('tradeCard.copyMsg')}
        </Button>
        <Button variant="secondary" size="default" onclick={toggleContact}>
          {t('tradeCard.close')}
        </Button>
      </div>

      <!-- Message Preview -->
      <p class="mt-2 text-[10px] text-muted-foreground italic text-center bg-black/20 p-1.5 rounded">
        "{contactMessage}"
      </p>
    {/if}

  </CardContent>
</Card>