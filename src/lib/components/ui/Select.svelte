<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Option {
    value: string;
    label: string;
    disabled?: boolean;
  }

  interface Props {
    options: Option[];
    value: string;
    onchange?: (value: string) => void;
    placeholder?: string;
    label?: string;
    error?: string;
    disabled?: boolean;
    class?: string;
  }

  let { options, value, onchange, placeholder = 'Select...', label, error, disabled = false, class: className = '' }: Props = $props();
  let open = $state(false);

  function select(val: string) {
    value = val;
    onchange?.(val);
    open = false;
  }

  const selectedLabel = $derived(options.find((o) => o.value === value)?.label ?? placeholder);

  $effect(() => {
    if (open) {
      const handler = (e: MouseEvent) => {
        if (!(e.target as HTMLElement).closest('[data-select]')) open = false;
      };
      document.addEventListener('click', handler);
      return () => document.removeEventListener('click', handler);
    }
  });
</script>

<div class="relative w-full {className}" data-select>
  {#if label}
    <label for="select-btn-{label}" class="text-sm font-medium text-foreground mb-1.5 block">{label}</label>
  {/if}
  <button
    id="select-btn-{label}"
    type="button"
    class="flex h-9 w-full items-center justify-between rounded-md border {error ? 'border-destructive' : 'border-input'} bg-transparent px-3 py-2 text-sm shadow-sm transition-fast placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
    onclick={() => { if (!disabled) open = !open; }}
    {disabled}
    aria-expanded={open}
  >
    <span class="truncate">{selectedLabel}</span>
    <svg class="h-4 w-4 opacity-50" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  </button>

  {#if open}
    <div class="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover p-1 shadow-md animate-in fade-in">
      {#each options as option (option.value)}
        <button
          type="button"
          class="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground {option.value === value ? 'bg-accent' : ''} {option.disabled ? 'opacity-50 pointer-events-none' : ''}"
          onclick={() => select(option.value)}
          disabled={option.disabled}
        >
          {option.label}
        </button>
      {/each}
    </div>
  {/if}

  {#if error}
    <p class="text-sm text-destructive mt-1">{error}</p>
  {/if}
</div>
