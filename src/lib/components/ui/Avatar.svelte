<script lang="ts">
  interface Props {
    src?: string;
    alt?: string;
    fallback: string;
    size?: 'sm' | 'md' | 'lg';
    class?: string;
  }

  let { src, alt = '', fallback, size = 'md', class: className = '' }: Props = $props();

  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
  };
</script>

<div class="relative flex shrink-0 overflow-hidden rounded-full {sizeClasses[size]} {className}">
  {#if src}
    <img
      {src}
      {alt}
      class="aspect-square h-full w-full object-cover"
      onerror={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
    />
  {:else}
    <div class="flex h-full w-full items-center justify-center bg-muted text-muted-foreground font-medium">
      {fallback}
    </div>
  {/if}
</div>
