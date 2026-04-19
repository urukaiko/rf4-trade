<script lang="ts">
  type Orientation = 'horizontal' | 'vertical';

  interface Props {
    orientation?: Orientation;
    decorative?: boolean;
    class?: string;
  }

  let { orientation = 'horizontal', decorative = true, class: className = '' }: Props = $props();
</script>

{#if orientation === 'horizontal'}
  <div
    role={decorative ? 'none' : 'separator'}
    aria-orientation={decorative ? undefined : 'horizontal'}
    class="shrink-0 h-px w-full bg-border {className}"
  ></div>
{:else}
  <div
    role={decorative ? 'none' : 'separator'}
    aria-orientation={decorative ? undefined : 'vertical'}
    class="shrink-0 w-px h-full bg-border {className}"
  ></div>
{/if}
