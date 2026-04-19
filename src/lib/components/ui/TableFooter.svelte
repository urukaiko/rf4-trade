<script lang="ts">
  import type { Snippet } from 'svelte';
  let { class: className = '', children }: { class?: string; children: Snippet } = $props();
</script>

<tfoot class="border-t border-border bg-muted/50 font-medium [&>tr]:last:border-b-0 {className}">
  {@render children()}
</tfoot>
