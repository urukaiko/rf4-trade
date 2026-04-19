import { test, expect } from '@playwright/test';

test.describe('route redirects', () => {
  test('root / redirects to login for unauthenticated user', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });

  test('authenticated user redirected from / to /trade', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[id="email"]', 'test@example.com');
    await page.fill('input[id="password"]', 'Test1234!');
    await page.click('button[type="submit"]');

    // Wait for redirect to /trade
    await expect(page).toHaveURL(/\/trade/, { timeout: 10000 });

    // Root should now redirect to /trade
    await page.goto('/');
    await expect(page).toHaveURL(/\/trade/, { timeout: 10000 });
  });

  test('/trade?tab=create preserves query params', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[id="email"]', 'test@example.com');
    await page.fill('input[id="password"]', 'Test1234!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/trade/, { timeout: 10000 });

    // Navigate with tab param
    await page.goto('/trade?tab=create');
    await expect(page).toHaveURL(/\/trade\?tab=create/, { timeout: 10000 });
  });

  test('/trade?tab=search preserves query params', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[id="email"]', 'test@example.com');
    await page.fill('input[id="password"]', 'Test1234!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/trade/, { timeout: 10000 });

    // Navigate with search tab
    await page.goto('/trade?tab=search');
    await expect(page).toHaveURL(/\/trade\?tab=search/, { timeout: 10000 });
  });

  test('top navbar has brand, nav links, language switcher', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[id="email"]', 'test@example.com');
    await page.fill('input[id="password"]', 'Test1234!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/trade/, { timeout: 10000 });

    // Brand link visible
    const brandLink = page.locator('header a[href="/trade"]').first();
    await expect(brandLink).toBeVisible();
    await expect(brandLink).toHaveAttribute('href', '/trade');

    // Market and Profile links in desktop nav
    await expect(page.getByRole('link', { name: 'Market' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Profile' })).toBeVisible();

    // Language switcher (RU and EN buttons)
    await expect(page.getByRole('button', { name: 'RU' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'EN' })).toBeVisible();

    // Logout button
    await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible();
  });

  test('browser-tab style Search/Create tabs visible', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[id="email"]', 'test@example.com');
    await page.fill('input[id="password"]', 'Test1234!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/trade/, { timeout: 10000 });

    // Tab buttons visible
    await expect(page.getByRole('button', { name: /Search/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Create/i })).toBeVisible();
  });

  test('TradeCard contact flow works', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[id="email"]', 'test@example.com');
    await page.fill('input[id="password"]', 'Test1234!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/trade/, { timeout: 10000 });

    // Wait for trades to load
    await page.waitForTimeout(2000);

    // If there are trade cards, click Contact
    const contactBtn = page.locator('button', { hasText: 'Contact' }).first();
    if (await contactBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await contactBtn.click();
      // Contact panel should show — look for Copy Nick button
      await expect(page.getByRole('button', { name: 'Copy Nick' })).toBeVisible({ timeout: 3000 });
    }
  });
});
