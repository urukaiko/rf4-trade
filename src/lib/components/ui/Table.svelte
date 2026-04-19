<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    class?: string;
    children: Snippet;
  }

  let { class: className = '', children }: Props = $props();
</script>

<div class="w-full overflow-auto">
  <table class="w-full caption-bottom text-sm {className}">
    {@render children()}
  </table>
</div>
