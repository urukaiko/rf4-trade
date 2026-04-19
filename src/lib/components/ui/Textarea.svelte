<script lang="ts">
  import type { HTMLTextareaAttributes } from 'svelte/elements';

  interface Props extends HTMLTextareaAttributes {
    label?: string;
    error?: string;
    hint?: string;
  }

  let {
    label,
    error,
    hint,
    id = `textarea-${Math.random().toString(36).slice(2, 9)}`,
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

  <textarea
    {id}
    bind:value
    class="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-fast placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 {error ? 'border-destructive' : ''} {className}"
    aria-invalid={error ? 'true' : undefined}
    aria-describedby={error || hint ? `${id}-description` : undefined}
    {...restProps}
  ></textarea>

  {#if error || hint}
    <p id={`${id}-description`} class="text-sm {error ? 'text-destructive' : 'text-muted-foreground'}">
      {error ?? hint}
    </p>
  {/if}
</div>
