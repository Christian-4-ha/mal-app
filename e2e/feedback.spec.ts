import { test, expect } from './fixtures';
import { createAndOpenProfile, drawStroke, openFreePaint } from './helpers';

test('Größen-Punkt steht direkt unter dem Regenbogen, vor den Farben', async ({ page }) => {
  await createAndOpenProfile(page);
  await openFreePaint(page);
  const rainbow = (await page.getByTestId('rainbow').boundingBox())!;
  const size = (await page.getByTestId('size').boundingBox())!;
  const firstSwatch = (await page.locator('.color-column .swatch[data-color]').first().boundingBox())!;
  expect(size.y).toBeGreaterThan(rainbow.y);
  expect(size.y).toBeLessThan(firstSwatch.y);
});

test('Nach dem Speichern erscheint eine sichtbare Bestätigung', async ({ page }) => {
  await createAndOpenProfile(page);
  await openFreePaint(page);
  await drawStroke(page);
  await page.getByTestId('save').click();
  await expect(page.getByTestId('save-toast')).toBeVisible();
  await expect(page.getByTestId('save-toast')).toBeHidden({ timeout: 4000 });
});
