import { test, expect } from '@playwright/test';
import { setupPinFlow } from './helpers';

test('Galerie steht oben links vor Freies Malen', async ({ page }) => {
  await page.goto('/mal-app/');
  await page.getByTestId('profile-add').click();
  await setupPinFlow(page);
  await page.getByLabel('Name').fill('Mia');
  await page.getByRole('button', { name: 'Fertig' }).click();
  await page.getByTestId('profile-tile').first().click();
  const tiles = page.locator('[data-row="1"] [data-tile]');
  await expect(tiles).toHaveCount(3);
  await expect(tiles.nth(0)).toHaveAttribute('data-tile', 'gallery');
  await expect(tiles.nth(1)).toHaveAttribute('data-tile', 'free-paint');
  await expect(tiles.nth(2)).toHaveAttribute('data-tile', 'coloring');
});
