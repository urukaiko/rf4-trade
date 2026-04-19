<script lang="ts">
  import type { PageData } from './$types';
  import Button from '$lib/components/ui/Button.svelte';

  let { data, form }: { data: PageData; form: Record<string, unknown> | null } = $props();

  let displayName = $state('');
  let error = $state<string | null>(null);

  $effect(() => {
    if (form && 'error' in form && form.error) {
      error = form.error as string;
    }
  });
</script>

<div class="p-6 max-w-lg">
  <h1 class="text-2xl font-bold mb-4 text-foreground">Complete Your Profile</h1>
  <p class="mb-6 text-muted-foreground">You need to set up your in-game display name before you can access the app.</p>

  {#if error}
    <p class="mb-4 p-3 text-sm text-destructive bg-destructive/10 rounded">{error}</p>
  {/if}

  <form method="POST" action="?/create" class="bg-card border border-border rounded-lg p-6 shadow-sm">
    <label for="displayName" class="block mb-2 text-sm font-medium text-foreground">In-Game Display Name</label>
    <p class="mb-4 text-xs text-muted-foreground">This is how other players will see you. Choose wisely!</p>
    <input
      id="displayName"
      name="displayName"
      type="text"
      bind:value={displayName}
      required
      minlength="3"
      maxlength="50"
      placeholder="e.g. AlexTheTrader"
      class="w-full mb-4 px-3 py-2 border border-input bg-card text-foreground rounded focus:outline-none focus:ring-2 focus:ring-ring"
    />
    <Button type="submit" variant="default" class="w-full">
      Create Profile
    </Button>
  </form>
</div>
