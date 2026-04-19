<script lang="ts">
  import type { Snippet } from 'svelte';
  let { class: className = '', children }: { class?: string; children: Snippet } = $props();
</script>

<tr class="border-b border-border transition-fast hover:bg-muted/50 data-[state=selected]:bg-muted {className}">
  {@render children()}
</tr>
