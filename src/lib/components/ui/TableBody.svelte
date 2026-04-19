<script lang="ts">
  import type { Snippet } from 'svelte';
  let { class: className = '', children }: { class?: string; children: Snippet } = $props();
</script>

<tbody class="[&_tr:last-child]:border-0 {className}">{@render children()}</tbody>
