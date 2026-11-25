import { test, expect, type Page } from '@playwright/test';
import { createAndOpenProfile, enterPin, firstStartToNewProfile } from './helpers';

/** Alpha der Malebene an einer relativen Position (0..1). */
async function alphaAt(page: Page, fx: number, fy: number): Promise<number> {
  return page.evaluate(
    ([fx, fy]) => {
      const c = document.querySelector<HTMLCanvasElement>('canvas[data-layer="paint"]')!;
      return c.getContext('2d')!.getImageData(Math.floor(c.width * fx), Math.floor(c.height * fy), 1, 1).data[3];
    },
    [fx, fy],
  );
}

test('Startseite heißt Taino', async ({ page }) => {
  await createAndOpenProfile(page);
  await expect(page).toHaveTitle('Taino');
  await page.getByRole('button', { name: 'Zurück' }).click();
  await expect(page.locator('.brand')).toHaveText('Taino');
});

test('Mandala mit 1 Achse: ein Strich links erscheint gespiegelt rechts', async ({ page }) => {
  await createAndOpenProfile(page);
  await page.getByTestId('tile-mandala').click();
  await page.locator('[data-row="2"] [data-tile="axes-1"]').click();
  await expect(page.locator('[data-screen="paint"]')).toHaveAttribute('data-ready', 'true');
  const box = (await page.locator('.paint-area').boundingBox())!;
  const y = box.y + box.height * 0.3;
  await page.mouse.move(box.x + box.width * 0.2, y);
  await page.mouse.down();
  for (let i = 1; i <= 6; i++) await page.mouse.move(box.x + box.width * (0.2 + i * 0.02), y);
  await page.mouse.up();
  expect(await alphaAt(page, 0.25, 0.3)).toBeGreaterThan(0);
  expect(await alphaAt(page, 0.75, 0.3)).toBeGreaterThan(0);
  expect(await alphaAt(page, 0.25, 0.7)).toBe(0); // 1 Achse: keine Spiegelung nach unten
});

test('Erwachsenen-Profil: nur mit PIN, Nutzungszeit abschaltbar', async ({ page }) => {
  await page.goto('/mal-app/');
  await firstStartToNewProfile(page);
  await page.getByLabel('Name').fill('Papa');
  await page.getByTestId('kind-adult').click();
  await page.getByRole('button', { name: 'Fertig' }).click();
  await page.getByTestId('profile-tile').first().click();
  await expect(page.getByTestId('pin-dialog')).toBeVisible();
  await enterPin(page);
  await expect(page.locator('[data-screen="mode-menu"]')).toBeVisible();
  const clock = page.getByTestId('time-toggle');
  await expect(clock).toHaveAttribute('data-on', 'true');
  await clock.click();
  await expect(clock).toHaveAttribute('data-on', 'false');
});
