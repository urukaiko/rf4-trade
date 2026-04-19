<script lang="ts">
  import ItemSelector from './ItemSelector.svelte';
  import TradeSummary from './TradeSummary.svelte';
  import { success as showSuccess, error as showError } from '$lib/shared/toast';
  import { invalidateAll } from '$app/navigation';
  import type { CatalogItem } from '$lib/shared/types/item';
  import { TradeFormState } from '$lib/shared/state/trade-form.svelte.ts';
  import { TriangleAlert } from 'lucide-svelte';
  import { createTranslator } from '$lib/i18n';
  import {
    ERR_CREATE_NETWORK
  } from '$lib/shared/constants/ui';

  interface User {
    id: string;
    email: string;
    username?: string | null | undefined;
  }

  interface Props {
    itemsByCategory: Record<string, CatalogItem[]>;
    user: User | null;
    locale?: 'ru' | 'en';
  }

  let { itemsByCategory, user, locale = 'en' }: Props = $props();

  const t = createTranslator(() => locale);

  const formState = new TradeFormState();
  formState.maxSelections = 1;

  let searchQuery = $state('');
  let message = $state<string | null>(null);
  let submitError = $state<string | null>(null);
  let loading = $state(false);

  function shortName(name: string): string {
    return name.split('_').map((w) => w[0]?.toUpperCase()).join('');
  }

  /** Look up item code by ID from the catalog. */
  function getItemCode(itemId: number): string | null {
    for (const items of Object.values(itemsByCategory)) {
      const found = items.find((i) => i.id === itemId);
      if (found) return found.code;
    }
    return null;
  }

  /** Sync want input type when want item selection changes. */
  let lastWantCode = $state<string | null>(null);

  $effect(() => {
    const wantId = formState.selectedWant[0];
    const code = wantId != null ? getItemCode(wantId) : null;
    if (code !== lastWantCode) {
      lastWantCode = code;
      formState.updateWantInputType(code);
      if (code === 'premium') {
        formState.snapToPremium();
      }
    }
  });

  // Duplicate detection reactive
  const duplicateDetected = $derived(
    formState.selectedHave.length > 0 &&
    formState.selectedWant.length > 0 &&
    formState.selectedHave.some((h) => formState.selectedWant.includes(h))
  );

  async function handleSubmit() {
    message = null;
    submitError = null;

    // Check for duplicate item selection
    const haveSet = new Set(formState.selectedHave);
    const wantSet = new Set(formState.selectedWant);
    const intersection = [...haveSet].filter((x) => wantSet.has(x));
    if (intersection.length > 0) {
      submitError = t('createForm.errDuplicateItem');
      showError(submitError);
      return;
    }

    if (formState.selectedHave.length === 0 || formState.selectedWant.length === 0) {
      submitError = t('createForm.errSelectItems');
      return;
    }

    if (formState.stock < 1 || formState.offerQuantity < 1 || formState.wantQuantity < 0.5) {
      submitError = t('createForm.errQtyMin');
      return;
    }

    if (formState.offerQuantity > formState.stock) {
      submitError = t('createForm.errQtyStock');
      return;
    }

    // Enforce premium options
    const wantId = formState.selectedWant[0];
    const wantCode = wantId != null ? getItemCode(wantId) : null;
    if (wantCode === 'gold') {
      if (!Number.isInteger(Number(formState.wantQuantity)) || formState.wantQuantity < 1) {
        submitError = t('createForm.errQtyWholeNumber');
        return;
      }
    }
    if (wantCode === 'premium') {
      const qty = formState.wantQuantity;
      if (!Number.isInteger(qty) || qty < 1 || qty > 365) {
        submitError = t('createForm.errPremiumDuration');
        return;
      }
    }

    loading = true;
    try {
      const haveId = formState.selectedHave[0];

      const response = await fetch('/api/trades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offerItemId: haveId,
          offerQuantity: formState.offerQuantity,
          wantItemId: wantId,
          wantQuantity: formState.wantQuantity,
          stock: formState.stock,
        }),
      });

      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        submitError = body.error ?? t('createForm.errCreate');
        showError(submitError);
      } else {
        message = t('createForm.msgCreated');
        showSuccess(message);
        formState.reset();
        await invalidateAll();
      }
    } catch {
      submitError = ERR_CREATE_NETWORK;
      showError(submitError);
    } finally {
      loading = false;
    }
  }
</script>

<div class="bg-card border border-border rounded-lg p-4 shadow-sm w-full max-w-full overflow-hidden">
  {#if user}
    <h2 class="text-lg font-semibold mb-3 text-foreground">{t('createForm.title')}</h2>

    <!-- Search Input -->
    <input
      type="text"
      bind:value={searchQuery}
      placeholder={t('createForm.searchPlaceholder')}
      class="w-full max-w-full box-border mb-4 h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-fast placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    />

    <!-- Item Selector -->
    <ItemSelector
      itemsByCategory={itemsByCategory}
      {formState}
      {searchQuery}
      shortNameFn={shortName}
      {locale}
    />

    <!-- Trade Summary -->
    {#if duplicateDetected}
      <div class="mb-3 p-2 bg-destructive/10 border border-destructive/30 rounded text-sm text-destructive flex items-center gap-2">
        <TriangleAlert size={16} class="shrink-0" aria-hidden="true" />
        <span>{t('createForm.errDuplicateItem')}</span>
      </div>
    {/if}
    <TradeSummary
      {formState}
      itemsByCategory={itemsByCategory}
      {loading}
      {message}
      {submitError}
      onsubmit={handleSubmit}
      {locale}
    />
  {:else}
    <div class="text-center py-8">
      <p class="text-muted-foreground mb-3">{t('createForm.loginPrompt')}</p>
      <a href="/login" class="text-primary underline hover:text-primary/80 text-sm">
        {t('createForm.btnGoLogin')}
      </a>
    </div>
  {/if}
</div>