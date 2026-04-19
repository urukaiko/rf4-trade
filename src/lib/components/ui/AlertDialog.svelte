<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    open: boolean;
    title: string;
    description?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onconfirm: () => void;
    onchange?: (open: boolean) => void;
    children?: Snippet;
  }

  let {
    open,
    title,
    description,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    onconfirm,
    onchange,
    children,
  }: Props = $props();

  function close() {
    onchange?.(false);
  }

  function handleConfirm() {
    onconfirm();
    close();
  }

  $effect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  });
</script>

{#if open}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in"
    onclick={(e) => { if (e.target === e.currentTarget) close(); }}
    onkeydown={(e) => { if (e.key === 'Escape') close(); }}
    role="alertdialog"
    aria-modal="true"
    aria-describedby={description ? 'alert-dialog-desc' : undefined}
    tabindex="-1"
  >
    <div class="relative z-50 w-full max-w-lg rounded-lg border border-border bg-card p-6 shadow-lg animate-in zoom-in-95">
      <h2 class="text-lg font-semibold text-foreground">{title}</h2>
      {#if description}
        <p id="alert-dialog-desc" class="text-sm text-muted-foreground mt-2">{description}</p>
      {/if}
      {#if children}
        <div class="mt-4">{@render children()}</div>
      {/if}
      <div class="flex justify-end gap-2 mt-4">
        <button type="button" class="h-9 px-4 rounded-md border border-input bg-card text-sm hover:bg-accent transition-fast" onclick={close}>
          {cancelLabel}
        </button>
        <button type="button" class="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm hover:bg-primary/90 transition-fast" onclick={handleConfirm}>
          {confirmLabel}
        </button>
      </div>
    </div>
  </div>
{/if}
