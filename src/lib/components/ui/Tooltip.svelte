<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    text: string;
    side?: 'top' | 'bottom' | 'left' | 'right';
    delay?: number;
    children: Snippet;
    class?: string;
  }

  let { text, side = 'top', delay = 500, children, class: className = '' }: Props = $props();
  let visible = $state(false);
  let timer: ReturnType<typeof setTimeout> | null = null;

  function show() {
    timer = setTimeout(() => { visible = true; }, delay);
  }

  function hide() {
    if (timer) clearTimeout(timer);
    visible = false;
  }

  const sideClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };
</script>

<div class="relative inline-block {className}" role="tooltip" onmouseenter={show} onmouseleave={hide}>
  {@render children()}
  {#if visible}
    <div
      role="tooltip"
      class="absolute z-50 whitespace-nowrap rounded-md bg-popover px-3 py-1.5 text-xs text-popover-foreground shadow-md animate-in fade-in {sideClasses[side]}"
    >
      {text}
    </div>
  {/if}
</div>
