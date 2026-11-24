import { test, expect } from '@playwright/test';
import { createAndOpenProfile, drawStroke, enterPin, openFreePaint } from './helpers';

test('Beim allerersten Start wird zuerst die Eltern-PIN festgelegt', async ({ page }) => {
  await page.goto('/mal-app/');
  await expect(page.locator('[data-screen="pin-setup"]')).toBeVisible();
  await expect(page.getByTestId('profile-add')).toHaveCount(0);
});

test('Bearbeiten überschreibt gerade geänderte Hinweise nicht', async ({ page }) => {
  await createAndOpenProfile(page);
  await page.getByRole('button', { name: 'Zurück' }).click();
  await page.getByTestId('parent-open').click();
  await enterPin(page);
  await expect(page.locator('.warn-chip')).toHaveCount(2);
  await page.locator('.chip-add').click();
  await expect(page.locator('.warn-chip')).toHaveCount(3);
  await page.getByRole('button', { name: 'Bearbeiten' }).click();
  await page.getByRole('button', { name: 'Fertig' }).click();
  await expect(page.locator('[data-screen="parent-area"]')).toBeVisible();
  await expect(page.locator('.warn-chip')).toHaveCount(3);
});

test.describe('Ablauf mit Speicherfehler', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => ((window as unknown as { __MAL_MINUTE_MS: number }).__MAL_MINUTE_MS = 200));
  });

  test('Malfläche wird gesperrt, nach erfolgreichem Speichern kommt der Mond', async ({ page }) => {
    await createAndOpenProfile(page);
    await openFreePaint(page);
    await drawStroke(page);
    await page.evaluate(() => {
      const w = window as unknown as { __put: unknown };
      w.__put = IDBObjectStore.prototype.put;
      IDBObjectStore.prototype.put = function () {
        throw new DOMException('voll', 'QuotaExceededError');
      };
    });
    await expect(page.getByTestId('quota-lock')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-screen="paint"]')).toHaveAttribute('data-ready', 'false');
    await page.evaluate(() => {
      IDBObjectStore.prototype.put = (window as unknown as { __put: typeof IDBObjectStore.prototype.put }).__put;
    });
    await expect(page.locator('[data-screen="day-over"]')).toBeVisible({ timeout: 10000 });
  });
});
