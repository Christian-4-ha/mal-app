import { expect, type Page } from '@playwright/test';

export async function createAndOpenProfile(page: Page, name = 'Lena'): Promise<void> {
  await page.goto('/mal-app/');
  await page.getByTestId('profile-add').click();
  await page.getByLabel('Name').fill(name);
  await page.getByRole('button', { name: 'Fertig' }).click();
  await page.getByTestId('profile-tile').first().click();
  await expect(page.locator('[data-screen="mode-menu"]')).toBeVisible();
}

export async function openFreePaint(page: Page): Promise<void> {
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
