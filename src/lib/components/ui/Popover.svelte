<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    trigger: Snippet<[{ open: () => void; close: () => void }]>;
    children: Snippet;
    align?: 'start' | 'end' | 'center';
    side?: 'top' | 'bottom';
  }

  let { trigger, children, align = 'center', side = 'bottom' }: Props = $props();
  let open = $state(false);

  function openPopover() { open = true; }
  function closePopover() { open = false; }

  const alignClasses = { start: 'left-0', end: 'right-0', center: 'left-1/2 -translate-x-1/2' };
  const sideClasses = {
    top: 'bottom-full mb-2',
    bottom: 'top-full mt-2',
  };

  $effect(() => {
    if (open) {
      const handler = (e: MouseEvent) => {
        if (!(e.target as HTMLElement).closest('[data-popover-trigger]')) closePopover();
      };
      document.addEventListener('click', handler);
      return () => document.removeEventListener('click', handler);
    }
  });
</script>

<div class="relative inline-block" data-popover-trigger>
  {@render trigger({ open: openPopover, close: closePopover })}

  {#if open}
    <div
      class="absolute z-50 w-72 rounded-md border border-border bg-popover p-4 shadow-md animate-in fade-in {sideClasses[side]} {alignClasses[align]}"
      role="dialog"
    >
      {@render children()}
    </div>
  {/if}
</div>
