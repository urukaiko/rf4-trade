<script lang="ts">
  import { authClient } from '$lib/client/auth';
  import { goto } from '$app/navigation';
  import { AuthMode, type AuthModeType } from '$lib/shared/constants/auth';
  import { Button, Input } from '$lib/components';
  import { browser } from '$app/environment';
  import { createTranslator } from '$lib/i18n';

  // Ensure dark mode is active immediately on mount (fixes white flash during client nav)
  if (browser) {
    document.documentElement.classList.add('dark');
  }

  let mode = $state<AuthModeType>(AuthMode.LOGIN);
  let email = $state('');
  let gameNickname = $state('');
  let password = $state('');
  let confirmPassword = $state('');
  let error = $state<string | null>(null);
  let loading = $state(false);
  
  // Default to Russian for SSR, will be updated on mount if needed
  let currentLocale = $state<'ru' | 'en'>('ru');
  const t = createTranslator(() => currentLocale);

  // Update locale on mount (client-side only)
  if (browser) {
    const cookieLocale = document.cookie.split(';').find(c => c.trim().startsWith('locale='))?.split('=')[1];
    if (cookieLocale === 'ru' || cookieLocale === 'en') {
      currentLocale = cookieLocale;
    }
  }

  function validateGameNickname(): string | null {
    if (mode === AuthMode.REGISTER && (!gameNickname || gameNickname.trim().length === 0)) {
      return t('auth.errNicknameRequired');
    }
    if (mode === AuthMode.REGISTER && gameNickname.trim().length > 50) {
      return t('auth.errNicknameTooLong');
    }
    return null;
  }

  function validatePasswordsMatch(): string | null {
    if (mode === AuthMode.REGISTER && password !== confirmPassword) {
      return t('auth.errPasswordsNotMatch');
    }
    return null;
  }

  async function handleSubmit() {
    error = null;

    const nicknameErr = validateGameNickname();
    if (nicknameErr) { error = nicknameErr; return; }

    const passwordErr = validatePasswordsMatch();
    if (passwordErr) { error = passwordErr; return; }

    loading = true;

    try {
      if (mode === AuthMode.REGISTER) {
        const { error: err } = await authClient.signUp.email({
          email,
          password,
          name: gameNickname.trim(),
        });
        if (err) {
          error = err.message ?? t('auth.registerBtn') + ' failed';
          loading = false;
        } else {
          await waitForSession();
          await goto('/trade', { replaceState: true });
        }
      } else {
        const isEmail = email.includes('@');
        if (isEmail) {
          const { error: err } = await authClient.signIn.email({
            email,
            password,
          });
          if (err) {
            error = err.message ?? t('auth.loginBtn') + ' failed';
            loading = false;
          } else {
            await waitForSession();
            await goto('/trade', { replaceState: true });
          }
        } else {
          error = t('auth.errInvalidEmail');
          loading = false;
        }
      }
    } catch (e) {
      error = e instanceof Error ? e.message : 'An unexpected error occurred';
      loading = false;
    }
  }

  /**
   * Wait for session cookie to propagate.
   * Polls authClient.getSession() with max 3 retries (100ms interval).
   */
  async function waitForSession(): Promise<void> {
    const maxRetries = 3;
    const retryDelay = 100;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const { data } = await authClient.getSession();
      if (data?.session) return;
      if (attempt < maxRetries - 1) {
        await new Promise(r => setTimeout(r, retryDelay));
      }
    }
  }
</script>

<!-- UnoCSS extraction hint for nested Input component dark variants -->
<span class="hidden bg-muted dark:bg-muted bg-muted dark:bg-card border-border dark:border-border text-foreground dark:text-foreground text-foreground dark:text-foreground border-destructive/30 dark:border-destructive/30 text-destructive dark:text-destructive bg-destructive/10 dark:bg-destructive/10 text-destructive dark:text-destructive text-muted-foreground dark:text-muted-foreground text-muted-foreground dark:text-muted-foreground text-primary dark:text-primary"></span>

<div class="flex items-center justify-center min-h-screen bg-background">
  <div class="w-full max-w-md mx-auto p-6 bg-card rounded-lg shadow overflow-hidden">
    <h1 class="text-xl font-bold text-center mb-4 text-foreground">
      {mode === AuthMode.LOGIN ? t('auth.login') : t('auth.register')}
    </h1>

    {#if error}
      <p class="mb-3 p-2 text-sm text-destructive bg-destructive/10 rounded">{error}</p>
    {/if}

    <form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
      {#if mode === AuthMode.REGISTER}
        <Input
          id="gameNickname"
          type="text"
          bind:value={gameNickname}
          label={t('auth.rf4Name')}
          required
          minlength="1"
          maxlength="50"
          placeholder={t('auth.rf4NamePlaceholder')}
          class="mb-3"
        />
      {/if}

      <Input
        id="email"
        type={mode === AuthMode.LOGIN ? 'text' : 'email'}
        bind:value={email}
        label={t('auth.email')}
        required
        class="mb-3"
      />

      <Input
        id="password"
        type="password"
        bind:value={password}
        label={t('auth.password')}
        required
        minlength={8}
        class="mb-3"
      />

      {#if mode === AuthMode.REGISTER}
        <Input
          id="confirmPassword"
          type="password"
          bind:value={confirmPassword}
          label={t('auth.confirmPassword')}
          required
          minlength={8}
          class="mb-4"
        />
      {/if}

      <div class="pt-2">
        <Button
          type="submit"
          variant="default"
          size="lg"
          class="w-full"
          disabled={loading}
          loading={loading}
        >
          {mode === AuthMode.LOGIN ? t('auth.loginBtn') : t('auth.registerBtn')}
        </Button>
      </div>
    </form>

    <p class="mt-4 text-sm text-center text-muted-foreground">
      {mode === AuthMode.LOGIN
        ? t('auth.noAccount')
        : t('auth.hasAccount')}
      <Button
        variant="link"
        class="ml-1 text-primary hover:no-underline p-0 h-auto"
        onclick={() => { mode = mode === AuthMode.LOGIN ? AuthMode.REGISTER : AuthMode.LOGIN; error = null; confirmPassword = ''; }}
      >
        {mode === AuthMode.LOGIN ? t('auth.registerBtn') : t('auth.loginBtn')}
      </Button>
    </p>
  </div>
</div>