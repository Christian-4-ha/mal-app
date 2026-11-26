import { test, expect } from './fixtures';
import { firstStartToNewProfile } from './helpers';

test('Profil anlegen und auswählen', async ({ page }) => {
  await page.goto('/mal-app/');
  await firstStartToNewProfile(page);
  await page.getByLabel('Name').fill('Lena');
  await page.getByRole('button', { name: 'Fertig' }).click();
  await expect(page.getByTestId('profile-tile')).toHaveCount(1);
  await page.getByTestId('profile-tile').first().click();
  await expect(page.locator('[data-screen="mode-menu"]')).toBeVisible();
});
