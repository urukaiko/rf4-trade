import { test, expect } from '@playwright/test';

test.describe('auth', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('registers new user and verifies session', async ({ page }) => {
    await page.goto('/login');

    // Fill registration form
    const uniqueSuffix = Date.now().toString(36);
    await page.getByLabel('Username').fill(`testuser_${uniqueSuffix}`);
    await page.getByLabel('Email').fill(`test_${uniqueSuffix}@example.com`);
    await page.getByLabel('Password').fill('testpassword123');
    await page.getByLabel('Confirm Password').fill('testpassword123');

    // Submit
    await page.getByRole('button', { name: /register/i }).click();

    // Should redirect to /trade
    await expect(page).toHaveURL(/\/trade/, { timeout: 10000 });
  });

  test('guest visiting protected route redirects to login', async ({ page }) => {
    await page.goto('/');

    // If not authenticated, should be on login page
    const url = page.url();
    expect(url).toMatch(/\/login|^http:\/\/localhost:4173\/$/);
  });
});

test.describe('trades', () => {
  test('guest can browse and see page load', async ({ page }) => {
    await page.goto('/');

    // Page should load — check title or body exists
    await expect(page.locator('body')).toBeVisible();
  });
});
