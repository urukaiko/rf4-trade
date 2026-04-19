<script lang="ts">
  import type { Snippet } from 'svelte';
  import { onMount } from 'svelte';

  interface Props {
    open: boolean;
    onchange?: (open: boolean) => void;
    children: Snippet;
  }

  let { open, onchange, children }: Props = $props();

  function close() {
    onchange?.(false);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') close();
  }

  $effect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeydown);
      document.body.style.overflow = 'hidden';
    } else {
      document.removeEventListener('keydown', handleKeydown);
      document.body.style.overflow = '';
    }
    return () => {
      document.removeEventListener('keydown', handleKeydown);
      document.body.style.overflow = '';
    };
  });
</script>

{#if open}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in"
    onclick={(e) => { if (e.target === e.currentTarget) close(); }}
    onkeydown={(e) => { if (e.key === 'Escape') close(); }}
    role="dialog"
    aria-modal="true"
    tabindex="-1"
  >
    <div class="relative z-50 w-full max-w-lg rounded-lg border border-border bg-card p-6 shadow-lg animate-in zoom-in-95">
      {@render children()}
    </div>
  </div>
{/if}
