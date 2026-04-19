<script lang="ts">
  import type { Snippet } from 'svelte';
  let { class: className = '', children }: { class?: string; children: Snippet } = $props();
</script>

<caption class="mt-4 text-sm text-muted-foreground {className}">{@render children()}</caption>
