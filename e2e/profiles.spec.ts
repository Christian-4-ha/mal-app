import { test, expect } from '@playwright/test';

test('Profil anlegen und auswählen', async ({ page }) => {
  await page.goto('/mal-app/');
  await page.getByTestId('profile-add').click();
  await page.getByLabel('Name').fill('Lena');
  await page.getByRole('button', { name: 'Fertig' }).click();
  await expect(page.getByTestId('profile-tile')).toHaveCount(1);
  await page.getByTestId('profile-tile').first().click();
  await expect(page.locator('[data-screen="mode-menu"]')).toBeVisible();
});
