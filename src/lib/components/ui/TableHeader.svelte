<script lang="ts">
  import type { Snippet } from 'svelte';
  let { class: className = '', children }: { class?: string; children: Snippet } = $props();
</script>

<thead class="[&_tr]:border-b {className}">{@render children()}</thead>
