import { test, expect } from '@playwright/test';

test.describe('guest', () => {
  test('visits home page', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
  });

  test('redirects to login from protected routes when unauthenticated', async ({ page }) => {
    await page.goto('/profile');
    // Should redirect to login
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });
});
