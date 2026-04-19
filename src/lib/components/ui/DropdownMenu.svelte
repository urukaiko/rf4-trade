<script lang="ts">
  import type { Snippet } from 'svelte';

  interface DropdownItem {
    label: string;
    value?: string;
    disabled?: boolean;
    destructive?: boolean;
    shortcut?: string;
    separator?: boolean;
    onclick?: () => void;
  }

  interface Props {
    trigger: Snippet<[{ open: () => void; close: () => void }]>;
    items: DropdownItem[];
    align?: 'start' | 'end';
    side?: 'top' | 'bottom';
  }

  let { trigger, items, align = 'start', side = 'bottom' }: Props = $props();
  let open = $state(false);

  function openMenu() { open = true; }
  function closeMenu() { open = false; }

  function handleItem(item: DropdownItem) {
    if (item.disabled) return;
    item.onclick?.();
    closeMenu();
  }

  const alignClasses = { start: 'left-0', end: 'right-0' };
  const sideClasses = {
    top: 'bottom-full mb-1',
    bottom: 'top-full mt-1',
  };

  $effect(() => {
    if (open) {
      const handler = (e: MouseEvent) => {
        if (!(e.target as HTMLElement).closest('[data-dropdown-trigger]')) closeMenu();
      };
      document.addEventListener('click', handler);
      return () => document.removeEventListener('click', handler);
    }
  });
</script>

<div class="relative inline-block" data-dropdown-trigger>
  {@render trigger({ open: openMenu, close: closeMenu })}

  {#if open}
    <div
      class="absolute z-50 min-w-[8rem] rounded-md border border-border bg-popover p-1 shadow-md animate-in fade-in {sideClasses[side]} {alignClasses[align]}"
      role="menu"
    >
      {#each items as item, i (i)}
        {#if item.separator}
          <div class="my-1 h-px bg-border"></div>
        {:else}
          <button
            type="button"
            class="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-fast hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground {item.disabled ? 'opacity-50 pointer-events-none' : ''} {item.destructive ? 'text-destructive' : ''}"
            role="menuitem"
            onclick={() => handleItem(item)}
            disabled={item.disabled}
          >
            <span class="flex-1">{item.label}</span>
            {#if item.shortcut}
              <span class="ml-auto text-xs text-muted-foreground">{item.shortcut}</span>
            {/if}
          </button>
        {/if}
      {/each}
    </div>
  {/if}
</div>
