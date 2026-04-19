<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    for?: string;
    children: Snippet;
    class?: string;
  }

  let { for: htmlfor, children, class: className = '' }: Props = $props();
</script>

<label
  for={htmlfor}
  class="text-sm font-medium leading-none text-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-70 {className}"
>
  {@render children()}
</label>
