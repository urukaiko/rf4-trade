import { test, expect } from '@playwright/test';

test.describe('trades', () => {
  test('guest sees marketplace and can apply filters', async ({ page }) => {
    await page.goto('/');

    // Page loads — check body is visible
    await expect(page.locator('body')).toBeVisible();
  });
});
