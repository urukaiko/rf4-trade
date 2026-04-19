<script lang="ts">
  import Button from '$lib/components/ui/Button.svelte';
  import type { CatalogItem } from '$lib/shared/types/item';
  import type { TradeFormState } from '$lib/shared/state/trade-form.svelte.ts';
  import { resolveName } from '$lib/shared/utils/i18n';
  import { TriangleAlert } from 'lucide-svelte';
  import { createTranslator } from '$lib/i18n';

  interface Props {
    formState: TradeFormState;
    itemsByCategory: Record<string, CatalogItem[]>;
    loading: boolean;
    message: string | null;
    submitError: string | null;
    onsubmit: () => void;
    locale?: 'ru' | 'en';
  }

  let {
    formState,
    itemsByCategory,
    loading,
    message,
    submitError,
    onsubmit,
    locale = 'en',
  }: Props = $props();

  const t = createTranslator(() => locale);

  function getItemName(itemId: number): string {
    for (const items of Object.values(itemsByCategory ?? {})) {
      const found = items.find((i) => i.id === itemId);
      if (found) return resolveName(found.translations, locale, found.code);
    }
    return 'Unknown';
  }

  function getItemCode(itemId: number): string | null {
    for (const items of Object.values(itemsByCategory ?? {})) {
      const found = items.find((i) => i.id === itemId);
      if (found) return found.code;
    }
    return null;
  }

  /** Dynamic label for want quantity based on selected want item. */
  function getWantLabel(): string {
    const wantId = formState.selectedWant[0];
    const code = wantId != null ? getItemCode(wantId) : null;
    if (code === 'gold') return t('summary.labelGoldQty');
    if (code === 'premium') return t('summary.labelPremium');
    return t('summary.labelWantQty');
  }
  /** Dynamic label for offer quantity based on selected have item. */
  function getOfferLabel(): string {
    const haveId = formState.selectedHave[0];
    const code = haveId != null ? getItemCode(haveId) : null;
    if (code === 'gold') return t('summary.labelGoldQty');
    if (code === 'premium') return t('summary.labelPremium');
    return t('summary.labelOfferQty');
  }
</script>

<div class="mt-6 p-4 bg-muted/30 border border-border rounded-lg">
  <h3 class="text-base font-semibold mb-3 text-foreground">{t('summary.title')}</h3>

  {#if message}
    <p aria-live="polite" class="mb-3 p-2 text-sm text-success bg-success/10 rounded">{message}</p>
  {/if}
  {#if submitError}
    <p aria-live="assertive" role="alert" class="mb-3 p-2 text-sm text-destructive bg-destructive/10 rounded">{submitError}</p>
  {/if}

  {#if formState.selectedHave.length === 0 && formState.selectedWant.length === 0}
    <p class="text-sm text-muted-foreground italic">{t('summary.empty')}</p>
  {:else}
    <div class="space-y-3">
      <!-- Selected Items Display -->
      <div class="flex flex-wrap gap-2 text-sm">
        {#if formState.selectedHave.length > 0}
          <div class="flex items-center gap-1">
            <span class="font-medium text-muted-foreground">{t('summary.offer')}</span>
            <span class="text-primary">{formState.selectedHave.map((id) => getItemName(id)).join(', ')}</span>
          </div>
        {/if}
        {#if formState.selectedWant.length > 0}
          <div class="flex items-center gap-1">
            <span class="font-medium text-muted-foreground">{t('summary.want')}</span>
            <span class="text-success">{formState.selectedWant.map((id) => getItemName(id)).join(', ')}</span>
          </div>
        {/if}
      </div>

      <!-- Quantity Inputs -->
      <div class="grid grid-cols-3 gap-4">
        <div>
          <label for="stock-input" class="block text-xs font-medium text-muted-foreground mb-1">
            {t('summary.labelStock')}
          </label>
          <input
            id="stock-input"
            type="number"
            min="1"
            bind:value={formState.stock}
            class="w-full max-w-full box-border h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-fast placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div>
          <label for="offer-quantity-input" class="block text-xs font-medium text-muted-foreground mb-1">
            {getOfferLabel()}
          </label>
          <input
            id="offer-quantity-input"
            type="number"
            min="1"
            bind:value={formState.offerQuantity}
            class="w-full max-w-full box-border h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-fast placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div>
          <label for="want-quantity-input" class="block text-xs font-medium text-muted-foreground mb-1">
            {getWantLabel()}
          </label>
          {#if formState.premiumOptions}
            <input
              id="want-quantity-input"
              type="number"
              min="1"
              step="1"
              bind:value={formState.wantQuantity}
              class="w-full max-w-full box-border h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-fast placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Days (1-365)"
            />
          {:else}
            <input
              id="want-quantity-input"
              type="number"
              min="1"
              step="1"
              bind:value={formState.wantQuantity}
              class="w-full max-w-full box-border h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-fast placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          {/if}
        </div>
      </div>
    </div>
  {/if}

  <!-- Disabled state warning -->
  {#if formState.selectedHave.length === 0 || formState.selectedWant.length === 0}
    <div class="flex items-center gap-2 mb-3 p-2 bg-warning/10 border border-warning/30 rounded mt-3">
      <TriangleAlert size={16} class="shrink-0 text-warning" aria-hidden="true" />
      <span class="text-sm text-warning">{t('createForm.errSelectItems')}</span>
    </div>
  {/if}

  <!-- Submit Button -->
  <Button
    variant="default"
    size="lg"
    class="w-full mt-4 {formState.selectedHave.length === 0 || formState.selectedWant.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}"
    onclick={onsubmit}
    disabled={loading || formState.selectedHave.length === 0 || formState.selectedWant.length === 0}
    loading={loading}
  >
    {t('summary.btnCreate')}
  </Button>
</div>