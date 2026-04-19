<script lang="ts">
  import type { Snippet } from 'svelte';

  interface AccordionItem {
    id: string;
    label: string;
    content: Snippet;
    disabled?: boolean;
  }

  interface Props {
    items: AccordionItem[];
    openItems?: string[];
    multiple?: boolean;
  }

  let { items, openItems = [], multiple = false }: Props = $props();
  let openState = $state<string[]>([]);
  let initialized = $state(false);

  $effect(() => {
    if (!initialized) {
      openState = [...openItems];
      initialized = true;
    }
  });

  function toggle(id: string) {
    const item = items.find((i) => i.id === id);
    if (item?.disabled) return;

    if (multiple) {
      openState = openState.includes(id)
        ? openState.filter((i) => i !== id)
        : [...openState, id];
    } else {
      openState = openState.includes(id) ? [] : [id];
    }
  }

  function isOpen(id: string): boolean {
    return openState.includes(id);
  }
</script>

<div class="w-full">
  {#each items as item (item.id)}
    <div class="border-b border-border">
      <button
        class="flex w-full items-center justify-between py-4 px-1 text-sm font-medium text-foreground hover:text-muted-foreground transition-fast disabled:opacity-50 disabled:pointer-events-none"
        onclick={() => toggle(item.id)}
        aria-expanded={isOpen(item.id)}
      >
        {item.label}
        <svg
          class="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 {isOpen(item.id) ? 'rotate-180' : ''}"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {#if isOpen(item.id)}
        <div class="pb-4 px-1">
          {@render item.content()}
        </div>
      {/if}
    </div>
  {/each}
</div>
