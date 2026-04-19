<script lang="ts">
  import type { HTMLInputAttributes } from 'svelte/elements';

  interface Props extends HTMLInputAttributes {
    label?: string;
    error?: string;
    hint?: string;
  }

  let {
    label,
    error,
    hint,
    id = `input-${Math.random().toString(36).slice(2, 9)}`,
    value = $bindable(),
    class: className = '',
    ...restProps
  }: Props & { class?: string } = $props();
</script>

<div class="space-y-2">
  {#if label}
    <label for={id} class="text-sm font-medium text-foreground">
      {label}
    </label>
  {/if}

  <input
    {id}
    bind:value
    class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-fast placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 {error ? 'border-destructive' : ''} {className}"
    aria-invalid={error ? 'true' : undefined}
    aria-describedby={error || hint ? `${id}-description` : undefined}
    {...restProps}
  />

  {#if error || hint}
    <p id={`${id}-description`} class="text-sm {error ? 'text-destructive' : 'text-muted-foreground'}">
      {error ?? hint}
    </p>
  {/if}
</div>
