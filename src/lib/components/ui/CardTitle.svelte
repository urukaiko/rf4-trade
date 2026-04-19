<script lang="ts">
  import type { Snippet } from 'svelte';
  let { class: className = '', children }: { class?: string; children: Snippet } = $props();
</script>

<div class="text-2xl font-semibold leading-none tracking-tight {className}">
  {@render children()}
</div>
