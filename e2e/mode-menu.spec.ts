import { test, expect } from '@playwright/test';

test('Galerie steht oben links vor Freies Malen', async ({ page }) => {
  await page.goto('/mal-app/');
  await page.getByTestId('profile-add').click();
  await page.getByLabel('Name').fill('Mia');
  await page.getByRole('button', { name: 'Fertig' }).click();
  await page.getByTestId('profile-tile').first().click();
  const tiles = page.locator('[data-screen="mode-menu"] [data-tile]');
  await expect(tiles).toHaveCount(2);
  await expect(tiles.nth(0)).toHaveAttribute('data-tile', 'gallery');
  await expect(tiles.nth(1)).toHaveAttribute('data-tile', 'free-paint');
});
