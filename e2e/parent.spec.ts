import { test, expect } from '@playwright/test';
import { createAndOpenProfile, drawStroke, enterPin, openFreePaint } from './helpers';

test('Elternbereich nur mit richtiger PIN', async ({ page }) => {
  await createAndOpenProfile(page);
  await page.getByRole('button', { name: 'Zurück' }).click();
  await page.getByTestId('parent-open').click();
  await enterPin(page, '9999');
  await expect(page.getByText('Falsche PIN.')).toBeVisible();
  await page.getByRole('button', { name: 'OK' }).click();
  await enterPin(page);
  await expect(page.locator('[data-screen="parent-area"]')).toBeVisible();
  await expect(page.getByTestId('parent-profile')).toHaveCount(1);
});

test('Am nächsten Tag erscheint die Abfrage der Malzeit; Standard übernehmen geht ohne PIN', async ({ page }) => {
  await createAndOpenProfile(page);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  await page.clock.setFixedTime(tomorrow);
  await page.reload();
  await expect(page.locator('[data-screen="daily-prompt"]')).toBeVisible();
  await page.getByTestId('quota-accept').click();
  await expect(page.getByTestId('profile-tile')).toHaveCount(1);
});

test.describe('Kontingent läuft ab', () => {
  test.beforeEach(async ({ page }) => {
    // 1 Minute = 200 ms → 30 Minuten Standard = 6 s
    await page.addInitScript(() => ((window as unknown as { __MAL_MINUTE_MS: number }).__MAL_MINUTE_MS = 200));
  });

  test('Hinweis, Speichern, Schluss-Bildschirm, Mond und nur Galerie', async ({ page }) => {
    await createAndOpenProfile(page);
    await openFreePaint(page);
    await drawStroke(page);
    await expect(page.getByTestId('quota-warning')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('[data-screen="day-over"]')).toBeVisible({ timeout: 10000 });
    await page.getByTestId('day-over-home').click();
    await expect(page.getByTestId('moon-badge')).toBeVisible();
    await page.getByTestId('profile-tile').click();
    await expect(page.locator('[data-screen="gallery"]')).toBeVisible();
    await expect(page.getByTestId('gallery-item')).toHaveCount(1); // Bild wurde beim Ablauf gespeichert
    await page.getByTestId('gallery-item').click();
    await expect(page.getByTestId('lightbox')).toBeVisible();
    await expect(page.locator('[data-screen="paint"]')).toHaveCount(0);
  });
});
