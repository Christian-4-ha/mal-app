import { test, expect } from './fixtures';
import { createAndOpenProfile, drawStroke, openFreePaint } from './helpers';

test('Speichern beim Zurückgehen schlägt fehl → Malbildschirm bleibt, Fehlersymbol', async ({ page }) => {
  await createAndOpenProfile(page);
  await openFreePaint(page);
  await drawStroke(page);
  await page.evaluate(() => {
    IDBObjectStore.prototype.put = function () {
      throw new DOMException('voll', 'QuotaExceededError');
    };
  });
  await page.getByTestId('home').click();
  await expect(page.getByTestId('save')).toHaveAttribute('data-state', 'error');
  await expect(page.locator('[data-screen="paint"]')).toBeVisible();
});

test('Automatisches Speichern einige Sekunden nach dem letzten Strich', async ({ page }) => {
  await createAndOpenProfile(page);
  await openFreePaint(page);
  await drawStroke(page);
  await expect(page.getByTestId('save')).toHaveAttribute('data-state', 'saved', { timeout: 8000 });
  await page.reload();
  await page.getByTestId('profile-tile').first().click();
  await page.getByTestId('tile-gallery').click();
  await expect(page.getByTestId('gallery-item')).toHaveCount(1);
});
