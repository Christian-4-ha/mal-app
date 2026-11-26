import { expect, type Page } from '@playwright/test';

export const PIN = '1234';

export async function enterPin(page: Page, pin = PIN): Promise<void> {
  for (const d of pin) await page.getByTestId('pin-key-' + d).click();
}

/** Erster Zugang: PIN wird festgelegt (zweimal eingeben). */
export async function setupPinFlow(page: Page, pin = PIN): Promise<void> {
  await enterPin(page, pin);
  await expect(page.getByText('PIN wiederholen')).toBeVisible();
  await enterPin(page, pin);
}

/** Erster Start: PIN festlegen, dann über „+“ (mit PIN) zum Formular „Neues Profil“. */
export async function firstStartToNewProfile(page: Page): Promise<void> {
  await page.getByTestId('pin-setup-start').click();
  await setupPinFlow(page);
  await page.getByTestId('profile-add').click();
  await enterPin(page);
}

export async function createAndOpenProfile(page: Page, name = 'Lena'): Promise<void> {
  await page.goto('/mal-app/');
  await firstStartToNewProfile(page);
  await page.getByLabel('Name').fill(name);
  await page.getByRole('button', { name: 'Fertig' }).click();
  await page.getByTestId('profile-tile').first().click();
  await expect(page.locator('[data-screen="mode-menu"]')).toBeVisible();
}

export async function openFreePaint(page: Page): Promise<void> {
  await page.getByTestId('tile-paint').click();
  await page.getByTestId('tile-free-paint').click();
  await expect(page.locator('[data-screen="paint"] canvas[data-layer="paint"]')).toBeVisible();
}

/** Zeichnet einen waagrechten Strich in der Mitte der Malfläche. */
export async function drawStroke(page: Page, dy = 0): Promise<void> {
  const box = (await page.locator('.paint-area').boundingBox())!;
  const y = box.y + box.height / 2 + dy;
  await page.mouse.move(box.x + box.width * 0.3, y);
  await page.mouse.down();
  for (let i = 1; i <= 10; i++) await page.mouse.move(box.x + box.width * (0.3 + i * 0.04), y);
  await page.mouse.up();
}

/** Alpha-Wert des Malebenen-Pixels in der Mitte der Malfläche. */
export async function centerAlpha(page: Page): Promise<number> {
  return page.evaluate(() => {
    const c = document.querySelector<HTMLCanvasElement>('canvas[data-layer="paint"]')!;
    const ctx = c.getContext('2d')!;
    return ctx.getImageData(Math.floor(c.width / 2), Math.floor(c.height / 2), 1, 1).data[3];
  });
}
