<script lang="ts">
  import type { Snippet } from 'svelte';

  type Side = 'left' | 'right' | 'top' | 'bottom';

  interface Props {
    open: boolean;
    side?: Side;
    onchange?: (open: boolean) => void;
    children: Snippet;
  }

  let { open, side = 'right', onchange, children }: Props = $props();

  function close() {
    onchange?.(false);
  }

  const sideClasses: Record<Side, string> = {
    left: 'left-0 top-0 h-full w-80 border-r',
    right: 'right-0 top-0 h-full w-80 border-l',
    top: 'top-0 left-0 w-full h-80 border-b',
    bottom: 'bottom-0 left-0 w-full h-80 border-t',
  };

  const slideClasses: Record<Side, string> = {
    left: '-translate-x-full',
    right: 'translate-x-full',
    top: '-translate-y-full',
    bottom: 'translate-y-full',
  };

  $effect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  });
</script>

{#if open}
  <div
    class="fixed inset-0 z-50 bg-black/50 animate-in fade-in"
    onclick={(e) => { if (e.target === e.currentTarget) close(); }}
    onkeydown={(e) => { if (e.key === 'Escape') close(); }}
    role="dialog"
    aria-modal="true"
    tabindex="-1"
  >
    <div
      class="fixed z-50 border-border bg-card shadow-lg transition-transform duration-300 ease-in-out {sideClasses[side]} {open ? '' : slideClasses[side]}"
      role="dialog"
      aria-modal="true"
    >
      {@render children()}
    </div>
  </div>
{/if}
