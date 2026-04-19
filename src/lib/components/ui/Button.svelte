<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLButtonAttributes } from 'svelte/elements';

  type Variant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  type Size = 'sm' | 'default' | 'lg' | 'icon';

  interface Props extends HTMLButtonAttributes {
    variant?: Variant;
    size?: Size;
    loading?: boolean;
    children: Snippet;
  }

  let {
    variant = 'default',
    size = 'default',
    loading = false,
    disabled = false,
    children,
    onclick,
    type = 'button',
    class: className = '',
    ...restProps
  }: Props & { class?: string } = $props();

  const baseClasses =
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-normal cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50';

  const variantClasses: Record<Variant, string> = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 dark:bg-destructive dark:text-destructive-foreground dark:hover:bg-destructive/90',
    outline: 'border border-border bg-card hover:bg-accent hover:text-accent-foreground dark:border-border dark:bg-card dark:text-foreground dark:hover:bg-accent',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 dark:bg-muted dark:text-foreground dark:hover:bg-muted/80',
    ghost: 'hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent dark:text-foreground',
    link: 'text-primary underline-offset-4 hover:underline dark:text-primary',
  };

  const sizeClasses: Record<Size, string> = {
    sm: 'h-8 rounded-md px-3 text-xs',
    default: 'h-10 px-4 py-2 text-sm',
    lg: 'h-11 rounded-md px-8 text-base',
    icon: 'h-10 w-10',
  };
</script>

<button
  {type}
  {disabled}
  {onclick}
  class="{baseClasses} {variantClasses[variant]} {sizeClasses[size]} {className}"
  aria-busy={loading || undefined}
  {...restProps}
>
  {#if loading}
    <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  {/if}
  {@render children()}
</button>
