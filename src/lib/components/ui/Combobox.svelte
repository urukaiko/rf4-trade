<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Option {
    value: string;
    label: string;
  }

  interface Props {
    options: Option[];
    value: string;
    onchange?: (value: string) => void;
    placeholder?: string;
    label?: string;
    error?: string;
    disabled?: boolean;
    searchable?: boolean;
  }

  let { options, value, onchange, placeholder = 'Select...', label, error, disabled = false, searchable = true }: Props = $props();
  let open = $state(false);
  let search = $state('');

  const filtered = $derived(
    searchable
      ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
      : options
  );

  const selectedLabel = $derived(options.find((o) => o.value === value)?.label ?? '');

  function select(val: string) {
    value = val;
    onchange?.(val);
    open = false;
    search = '';
  }

  function toggle() {
    if (!disabled) {
      open = !open;
      if (open) search = '';
    }
  }

  $effect(() => {
    if (open) {
      const handler = (e: MouseEvent) => {
        if (!(e.target as HTMLElement).closest('[data-combobox]')) { open = false; search = ''; }
      };
      document.addEventListener('click', handler);
      return () => document.removeEventListener('click', handler);
    }
  });
</script>

<div class="relative w-full" data-combobox>
  {#if label}
    <label for="combo-btn-{label}" class="text-sm font-medium text-foreground mb-1.5 block">{label}</label>
  {/if}

  <button
    id="combo-btn-{label}"
    type="button"
    class="flex h-9 w-full items-center justify-between rounded-md border {error ? 'border-destructive' : 'border-input'} bg-transparent px-3 py-2 text-sm shadow-sm transition-fast placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
    onclick={toggle}
    {disabled}
    aria-expanded={open}
  >
    <span class="truncate">{selectedLabel || placeholder}</span>
    <svg class="h-4 w-4 opacity-50" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  </button>

  {#if open}
    <div class="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-md animate-in fade-in">
      {#if searchable}
        <div class="p-2 border-b border-border">
          <input
            bind:value={search}
            placeholder="Search..."
            class="w-full h-8 rounded-md bg-transparent px-2 text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
      {/if}
      <div class="max-h-[200px] overflow-auto p-1">
        {#if filtered.length === 0}
          <p class="py-6 text-center text-sm text-muted-foreground">No results found.</p>
        {:else}
          {#each filtered as option (option.value)}
            <button
              type="button"
              class="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-fast hover:bg-accent hover:text-accent-foreground {option.value === value ? 'bg-accent' : ''}"
              onclick={() => select(option.value)}
            >
              {option.label}
            </button>
          {/each}
        {/if}
      </div>
    </div>
  {/if}

  {#if error}
    <p class="text-sm text-destructive mt-1">{error}</p>
  {/if}
</div>
