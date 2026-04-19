<script lang="ts">
  import type { Snippet } from 'svelte';

  type Variant = 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';

  interface Props {
    variant?: Variant;
    class?: string;
    children: Snippet;
  }

  let { variant = 'default', class: className = '', children }: Props = $props();

  const variantClasses: Record<Variant, string> = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/80',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/80',
    outline: 'border border-input text-foreground',
    success: 'bg-success text-success-foreground hover:bg-success/80',
    warning: 'bg-warning text-warning-foreground hover:bg-warning/80',
  };
</script>

<div class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors {variantClasses[variant]} {className}">
  {@render children()}
</div>
