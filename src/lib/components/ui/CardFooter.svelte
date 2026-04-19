<script lang="ts">
  import type { Snippet } from 'svelte';
  let { class: className = '', children }: { class?: string; children: Snippet } = $props();
</script>

<div class="flex items-center p-6 pt-0 {className}">
  {@render children()}
</div>
