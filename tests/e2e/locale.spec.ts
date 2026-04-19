import { test, expect } from '@playwright/test';

test.describe('locale switcher', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('toggles between RU and EN and updates active state', async ({ page }) => {
    await page.goto('/login');

    // Verify locale switcher exists
    const ruButton = page.locator('button:has-text("RU")');
    const enButton = page.locator('button:has-text("EN")');
    await expect(ruButton).toBeVisible();
    await expect(enButton).toBeVisible();

    // EN should be active by default (brand bg)
    await expect(enButton).toHaveClass(/bg-brand-600/);
    await expect(ruButton).not.toHaveClass(/bg-brand-600/);

    // Click RU
    await ruButton.click();

    // Page reloads — wait for it
    await page.waitForLoadState('networkidle');

    // RU should now be active
    await expect(ruButton).toHaveClass(/bg-brand-600/);
    await expect(enButton).not.toHaveClass(/bg-brand-600/);

    // Click EN
    await enButton.click();
    await page.waitForLoadState('networkidle');

    // EN should be active again
    await expect(enButton).toHaveClass(/bg-brand-600/);
    await expect(ruButton).not.toHaveClass(/bg-brand-600/);
  });
});
