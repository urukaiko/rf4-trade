<script lang="ts">
  /**
   * Stream connection status indicator.
   * Renders a colored dot + tooltip text with smooth transitions.
   */
  interface Props {
    status: 'connected' | 'reconnecting' | 'disconnected';
  }

  let { status }: Props = $props();

  const config = {
    connected: {
      label: 'Live',
      dotClass: 'bg-success',
    },
    reconnecting: {
      label: 'Reconnecting…',
      dotClass: 'bg-warning',
    },
    disconnected: {
      label: 'Offline — showing cached data',
      dotClass: 'bg-destructive',
    },
  } as const;
</script>

<span
  class="inline-flex items-center gap-1.5 text-xs text-muted-foreground"
  title={config[status].label}
>
  {#if status === 'reconnecting'}
    <!-- Tiny spinning dot for reconnecting state -->
    <span class="inline-block w-2 h-2 relative">
      <svg class="animate-spin w-2 h-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75 text-warning" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </span>
  {:else}
    <span
      class="inline-block w-2 h-2 rounded-full transition-colors duration-200 {config[status].dotClass} {status === 'connected' ? 'animate-pulse' : ''}"
    ></span>
  {/if}
  <span class="hidden sm:inline">{config[status].label}</span>
</span>
