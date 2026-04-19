<script lang="ts">
  import type { LayoutData } from './$types';
  import { Toaster } from 'svelte-5-french-toast';
  import { authClient } from '$lib/client/auth';
  import { invalidateAll } from '$app/navigation';
  import { browser } from '$app/environment';
  import { page } from '$app/stores';
  import type { Snippet } from 'svelte';
  import { createTranslator } from '$lib/i18n';
  import { ERR_SESSION_EXPIRED } from '$lib/shared/constants/ui';
  import { User, LogIn } from 'lucide-svelte';

  let { data, children }: { data: LayoutData; children: Snippet } = $props();

  const t = createTranslator(() => data.locale);

  async function handleLogout() {
    try {
      await authClient.signOut();
      await invalidateAll();
      window.location.reload();
    } catch (err) {
      console.error('[logout] Error:', err);
      await invalidateAll();
      window.location.reload();
    }
  }

  function setLocale(lang: 'ru' | 'en') {
    document.cookie = `locale=${lang}; path=/; max-age=31536000; SameSite=Lax`;
    window.location.reload();
  }

  $effect(() => {
    if (!browser || !data.user) return;
    let cancelled = false;
    const interval = setInterval(async () => {
      if (cancelled || document.visibilityState === 'hidden') return;
      const { data: session } = await authClient.getSession();
      if (!session && !cancelled) {
        const { toast } = await import('svelte-5-french-toast');
        toast.error(ERR_SESSION_EXPIRED);
        await invalidateAll();
        window.location.reload();
      }
    }, 5 * 60 * 1000);
    return () => { cancelled = true; clearInterval(interval); };
  });
</script>

<div class="min-h-screen bg-background text-foreground flex flex-col">
  <!-- TOP NAVIGATION BAR -->
  <header class="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
    <div class="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
      <!-- Left: Brand (no fish emoji) -->
      <a href="/trade" class="font-bold text-lg text-foreground no-underline hover:text-primary transition-colors">
        {t('nav.brand')}
      </a>

      <!-- Right: Language + User/Login icon -->
      <div class="flex items-center gap-3">
        <!-- Language Switcher -->
        <div class="flex border border-input rounded overflow-hidden">
          <button
            class="text-xs px-2 py-1 transition-colors cursor-pointer {data.locale === 'ru' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:bg-accent'}"
            onclick={() => setLocale('ru')}
            aria-label={t('nav.ariaSwitchRu')}
          >{t('nav.langRu')}</button>
          <button
            class="text-xs px-2 py-1 border-l border-input transition-colors cursor-pointer {data.locale === 'en' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:bg-accent'}"
            onclick={() => setLocale('en')}
            aria-label={t('nav.ariaSwitchEn')}
          >{t('nav.langEn')}</button>
        </div>

        <!-- User / Login icon -->
        {#if data.user}
          <a
            href="/profile"
            class="flex items-center justify-center h-9 w-9 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
            aria-label={t('nav.profile')}
          >
            <User size={18} />
          </a>
        {:else}
          <a
            href="/login"
            class="flex items-center justify-center h-9 w-9 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
            aria-label={t('nav.login')}
          >
            <LogIn size={18} />
          </a>
        {/if}
      </div>
    </div>

  </header>

  <!-- MAIN CONTENT -->
  <main class="flex-1">
    <div class="max-w-6xl mx-auto p-4 md:p-6">
      {@render children()}
    </div>
  </main>

  <!-- Footer -->
  <footer class="border-t border-border py-4 text-center text-xs text-muted-foreground">
    <p>{t('nav.brand')} &copy; 2026</p>
  </footer>
</div>

<Toaster
  position="top-right"
  toastOptions={{ duration: 3000 }}
  containerStyle="z-index: 9999;"
/>