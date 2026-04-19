<script lang="ts">
  import { page } from '$app/stores';
  import { Button } from '$lib/components';

  let retryCount = $state(0);
</script>

<div class="min-h-screen flex items-center justify-center bg-background p-4">
  <div class="max-w-md w-full bg-card rounded-lg shadow-lg p-6 border border-border">
    <div class="text-center">
      <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-destructive/10 mb-4">
        <span class="text-2xl" aria-hidden="true">⚠️</span>
      </div>

      <h1 class="text-lg font-semibold text-foreground mb-2">
        Something went wrong
      </h1>

      <p class="text-sm text-muted-foreground mb-6">
        {$page.error?.message ?? 'An unexpected error occurred'}
      </p>

      <div class="flex gap-3 justify-center">
        <Button variant="secondary" onclick={() => window.history.back()}>
          Go Back
        </Button>
        <Button
          onclick={() => { retryCount++; throw $page.error; }}
        >
          Try Again ({retryCount})
        </Button>
      </div>

      {#if import.meta.env.DEV}
        <details class="mt-4 text-left">
          <summary class="text-xs font-mono text-destructive cursor-pointer">
            Stack Trace (dev only)
          </summary>
          <pre class="mt-2 text-xs bg-muted text-muted-foreground p-3 rounded overflow-auto max-h-48">
            {($page.error as Error | undefined)?.stack}
          </pre>
        </details>
      {/if}
    </div>
  </div>
</div>
