<script lang="ts">
  import type { Snippet } from 'svelte';
  import '../app.css';
  let { children }: { children: Snippet } = $props();
</script>

<svelte:boundary onerror={(error) => console.error('[root-boundary]', error)}>
  {@render children()}
</svelte:boundary>
