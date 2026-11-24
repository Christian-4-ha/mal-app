import { test, expect } from '@playwright/test';

test('App startet und zeigt Wurzel', async ({ page }) => {
  await page.goto('/mal-app/');
  await expect(page.locator('#app')).toBeVisible();
  await expect(page.locator('[data-screen]')).toHaveCount(1);
});
