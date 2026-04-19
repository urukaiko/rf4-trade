<script lang="ts">
  import type { PageData } from './$types';
  import Button from '$lib/components/ui/Button.svelte';
  import { authClient } from '$lib/client/auth';
  import { invalidateAll } from '$app/navigation';
  import { goto } from '$app/navigation';
  import { createTranslator } from '$lib/i18n';

  let { data, form }: { data: PageData; form: Record<string, unknown> | null } = $props();

  const t = createTranslator(() => data.locale);

  let displayName = $state('');
  let success = $state(false);
  let error = $state<string | null>(null);
  let initialized = $state(false);

  $effect(() => {
    if (!initialized && data.player) {
      displayName = data.player.displayName;
      initialized = true;
    }
    if (form) {
      if (form.success) {
        success = true;
        error = null;
        setTimeout(() => { success = false; }, 3000);
      }
      if (form.error) {
        error = form.error as string;
        success = false;
      }
    }
  });

  async function handleLogout() {
    try {
      await authClient.signOut();
      await invalidateAll();
      goto('/login');
    } catch (err) {
      console.error('[logout] Error:', err);
      await invalidateAll();
      goto('/login');
    }
  }
</script>

<div class="p-6 max-w-lg w-full">
  <h1 class="text-2xl font-bold mb-6 text-foreground">{t('profile.title')}</h1>

  <div class="bg-card border border-border rounded-lg p-4 shadow-sm mb-6">
    <h2 class="text-lg font-semibold mb-3 text-foreground">{t('profile.account')}</h2>
    <div class="space-y-2 text-sm">
      <p>
        <span class="text-muted-foreground">{t('profile.emailLabel')}</span>
        <span class="ml-2 text-foreground">{data.user.email}</span>
      </p>
      <p>
        <span class="text-muted-foreground">{t('profile.usernameLabel')}</span>
        <span class="ml-2 text-foreground">{data.user?.username ?? t('profile.usernamePlaceholder')}</span>
      </p>
    </div>
  </div>

  <div class="bg-card border border-border rounded-lg p-4 shadow-sm mb-6">
    <h2 class="text-lg font-semibold mb-3 text-foreground">{t('profile.trades')}</h2>
    <a
      href="/profile/trades"
      class="inline-flex items-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-normal h-8 px-3 border border-input bg-card text-primary hover:bg-accent hover:text-accent-foreground"
    >
      {t('profile.viewMyTrades')}
    </a>
  </div>

  <div class="bg-card border border-border rounded-lg p-4 shadow-sm">
    <h2 class="text-lg font-semibold mb-3 text-foreground">{t('profile.displayName')}</h2>
    <p class="text-sm text-muted-foreground mb-4">{t('profile.displayNameDesc')}</p>

    {#if success}
      <p class="mb-3 p-2 text-sm text-success bg-success/10 rounded">{t('profile.successUpdated')}</p>
    {/if}
    {#if error}
      <p class="mb-3 p-2 text-sm text-destructive bg-destructive/10 rounded">{error}</p>
    {/if}

    <form method="POST" action="?/updateDisplayName">
      <label for="displayName" class="block mb-2 text-sm font-medium text-foreground">{t('profile.inGameName')}</label>
      <input
        id="displayName"
        name="displayName"
        type="text"
        bind:value={displayName}
        required
        minlength="3"
        maxlength="50"
        class="w-full max-w-full box-border mb-4 px-3 py-2 border border-input bg-card text-foreground rounded focus:outline-none focus:ring-2 focus:ring-ring"
      />
      <Button type="submit" variant="default" class="w-full">
        {t('profile.save')}
      </Button>
    </form>
  </div>

  <!-- Logout -->
  <div class="mt-6">
    <Button variant="destructive" size="default" onclick={handleLogout} class="px-6">
      {t('profile.logout')}
    </Button>
  </div>
</div>