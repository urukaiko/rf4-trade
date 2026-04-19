<script lang="ts">
  import type { Snippet } from 'svelte';

  interface CommandItem {
    id: string;
    label: string;
    shortcut?: string;
    icon?: Snippet;
    onclick: () => void;
  }

  interface Props {
    items: CommandItem[];
    placeholder?: string;
    open: boolean;
    onchange?: (open: boolean) => void;
  }

  let { items, placeholder = 'Type a command or search...', open, onchange }: Props = $props();
  let query = $state('');
  let selectedIndex = $state(0);

  const filtered = $derived(
    items.filter((item) => item.label.toLowerCase().includes(query.toLowerCase()))
  );

  $effect(() => { selectedIndex = 0; });

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedIndex = (selectedIndex + 1) % filtered.length;
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedIndex = (selectedIndex - 1 + filtered.length) % filtered.length;
    } else if (e.key === 'Enter') {
      const item = filtered[selectedIndex];
      if (item) {
        e.preventDefault();
        item.onclick();
        close();
      }
    } else if (e.key === 'Escape') {
      close();
    }
  }

  function close() {
    query = '';
    onchange?.(false);
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
    class="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] bg-black/50 animate-in fade-in"
    onclick={(e) => { if (e.target === e.currentTarget) close(); }}
    onkeydown={(e) => { if (e.key === 'Escape') close(); }}
    role="dialog"
    tabindex="-1"
  >
    <div class="w-full max-w-lg rounded-lg border border-border bg-popover shadow-lg animate-in zoom-in-95">
      <div class="flex items-center border-b border-border px-3">
        <svg class="mr-2 h-4 w-4 shrink-0 opacity-50" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          bind:value={query}
          {placeholder}
          class="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>
      <div class="max-h-[300px] overflow-auto p-2">
        {#if filtered.length === 0}
          <p class="py-6 text-center text-sm text-muted-foreground">No results found.</p>
        {:else}
          {#each filtered as item, i (item.id)}
            <button
              type="button"
              class="flex w-full items-center rounded-sm px-2 py-2 text-sm transition-fast {i === selectedIndex ? 'bg-accent text-accent-foreground' : 'text-foreground hover:bg-accent'}"
              onclick={() => { item.onclick(); close(); }}
            >
              {#if item.icon}
                <span class="mr-2">{@render item.icon()}</span>
              {/if}
              <span class="flex-1 text-left">{item.label}</span>
              {#if item.shortcut}
                <span class="ml-auto text-xs text-muted-foreground">{item.shortcut}</span>
              {/if}
            </button>
          {/each}
        {/if}
      </div>
    </div>
  </div>
{/if}
