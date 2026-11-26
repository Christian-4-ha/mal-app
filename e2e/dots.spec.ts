import { test, expect } from './fixtures';
import { createAndOpenProfile } from './helpers';

test('Punkte verbinden: falsche Reihenfolge zählt nicht, alle richtig → Lametta und Ausmalen', async ({ page }) => {
  await createAndOpenProfile(page);
  await page.getByTestId('tile-paint').click();
  await page.getByTestId('tile-dots').click();
  await expect(page.locator('[data-row="2"] .tile-label')).toHaveText(['Stern', 'Haus', 'Fisch', 'Ente', 'Rakete']);
  await page.getByTestId('tile-dots-stern').click();
  const screen = page.locator('[data-screen="dots"]');
  await expect(screen).toBeVisible();
  const dot = (i: number) => page.getByTestId(`dot-${i}`).locator('.dot-point');
  await dot(1).click();
  await dot(3).click(); // übersprungen: zählt nicht
  await expect(screen).toHaveAttribute('data-reached', '1');
  for (let i = 2; i <= 10; i++) await dot(i).click();
  await expect(screen).toHaveAttribute('data-done', 'true');
  await expect(page.getByTestId('lametta')).toBeAttached();
  await page.getByTestId('dots-color').click();
  await expect(page.locator('[data-screen="paint"]')).toHaveAttribute('data-ready', 'true');
});

test('Punkte verbinden mit einem Fingerzug über mehrere Punkte', async ({ page }) => {
  await createAndOpenProfile(page);
  await page.getByTestId('tile-paint').click();
  await page.getByTestId('tile-dots').click();
  await page.getByTestId('tile-dots-haus').click();
  const center = async (i: number) => {
    const b = (await page.getByTestId(`dot-${i}`).locator('.dot-point').boundingBox())!;
    return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
  };
  const p1 = await center(1);
  await page.mouse.move(p1.x, p1.y);
  await page.mouse.down();
  for (const i of [2, 3]) {
    const p = await center(i);
    await page.mouse.move(p.x, p.y, { steps: 8 });
  }
  await page.mouse.up();
  await expect(page.locator('[data-screen="dots"]')).toHaveAttribute('data-reached', '3');
  await expect(page.locator('.dots-lines line')).toHaveCount(2);
});
