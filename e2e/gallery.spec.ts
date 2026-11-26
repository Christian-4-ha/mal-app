import { test, expect } from './fixtures';
import { centerAlpha, createAndOpenProfile, drawStroke, openFreePaint } from './helpers';

test('Leere Galerie zeigt leeren Bilderrahmen', async ({ page }) => {
  await createAndOpenProfile(page);
  await page.getByTestId('tile-gallery').click();
  await expect(page.getByTestId('gallery-empty')).toBeVisible();
});

test('Malen, zurück, Galerie zeigt Bild; Weitermalen öffnet es', async ({ page }) => {
  await createAndOpenProfile(page);
  await openFreePaint(page);
  await drawStroke(page);
  await page.getByTestId('home').click();
  await page.getByTestId('group-back').click();
  await page.getByTestId('tile-gallery').click();
  await expect(page.getByTestId('gallery-item')).toHaveCount(1);
  await page.getByTestId('gallery-item').click();
  await expect(page.locator('[data-screen="paint"]')).toBeVisible();
  await expect.poll(() => centerAlpha(page)).toBeGreaterThan(0);
});

test('Leere Fläche wird beim Zurückgehen nicht gespeichert', async ({ page }) => {
  await createAndOpenProfile(page);
  await openFreePaint(page);
  await page.getByTestId('home').click();
  await page.getByTestId('group-back').click();
  await page.getByTestId('tile-gallery').click();
  await expect(page.getByTestId('gallery-empty')).toBeVisible();
});

test('Mehrfaches schnelles Speichern erzeugt nur einen Eintrag', async ({ page }) => {
  await createAndOpenProfile(page);
  await openFreePaint(page);
  await drawStroke(page);
  const save = page.getByTestId('save');
  await Promise.all([save.click(), save.click(), save.click()]);
  await drawStroke(page, 40);
  await save.click();
  await page.getByTestId('home').click();
  await page.getByTestId('group-back').click();
  await page.getByTestId('tile-gallery').click();
  await expect(page.getByTestId('gallery-item')).toHaveCount(1);
});

test('Hintergrund speichert', async ({ page }) => {
  await createAndOpenProfile(page);
  await openFreePaint(page);
  await drawStroke(page);
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(page.getByTestId('save')).toHaveAttribute('data-state', 'saved');
  await page.reload();
  await page.getByTestId('profile-tile').first().click();
  await page.getByTestId('tile-gallery').click();
  await expect(page.getByTestId('gallery-item')).toHaveCount(1);
});
