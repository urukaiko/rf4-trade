<script lang="ts">
  import { page } from '$app/stores';
</script>

<div class="min-h-screen flex items-center justify-center bg-background">
  <div class="text-center p-8">
    <h1 class="text-4xl font-bold text-foreground mb-2">{$page.status}</h1>
    <p class="text-muted-foreground mb-4">{$page.error?.message ?? 'An unexpected error occurred.'}</p>
    <a href="/trade" class="text-primary hover:underline">Return to home</a>
  </div>
</div>
