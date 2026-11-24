import { test, expect } from '@playwright/test';
import { centerAlpha, createAndOpenProfile, drawStroke, openFreePaint } from './helpers';

test('Strich malen und rückgängig machen', async ({ page }) => {
  await createAndOpenProfile(page);
  await openFreePaint(page);
  const undo = page.getByTestId('undo');
  await expect(undo).toHaveAttribute('aria-disabled', 'true');
  await drawStroke(page);
  await expect(undo).toHaveAttribute('aria-disabled', 'false');
  expect(await centerAlpha(page)).toBeGreaterThan(0);
  await undo.click();
  await expect(undo).toHaveAttribute('aria-disabled', 'true');
  expect(await centerAlpha(page)).toBe(0);
});

test('Leeren ist rückgängig machbar', async ({ page }) => {
  await createAndOpenProfile(page);
  await openFreePaint(page);
  await drawStroke(page);
  await page.getByTestId('clear').click();
  expect(await centerAlpha(page)).toBe(0);
  await page.getByTestId('undo').click();
  expect(await centerAlpha(page)).toBeGreaterThan(0);
});

test('Werkzeuge und Farben stehen rechts', async ({ page }) => {
  await createAndOpenProfile(page);
  await openFreePaint(page);
  const area = (await page.locator('.paint-area').boundingBox())!;
  const tools = (await page.locator('.tool-column').boundingBox())!;
  const colors = (await page.locator('.color-column').boundingBox())!;
  expect(colors.x).toBeGreaterThanOrEqual(area.x + area.width - 1);
  expect(tools.x).toBeGreaterThan(colors.x); // Werkzeuge ganz außen
  await expect(page.locator('.tool-column [data-tool]')).toHaveCount(9);
});

test('Langes Drücken auf den Musterstift öffnet die Varianten', async ({ page }) => {
  await createAndOpenProfile(page);
  await openFreePaint(page);
  const box = (await page.getByTestId('tool-pattern').boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(600);
  await page.mouse.up();
  const pop = page.getByTestId('variant-popup');
  await expect(pop).toBeVisible();
  await pop.locator('[data-variant="heart"]').click();
  await expect(pop).toBeHidden();
  await expect(page.getByTestId('tool-pattern')).toHaveClass(/active/);
});

test('Eimer füllt die Fläche', async ({ page }) => {
  await createAndOpenProfile(page);
  await openFreePaint(page);
  await page.getByTestId('tool-bucket').click();
  await expect(page.getByTestId('size')).toHaveAttribute('aria-disabled', 'true');
  const box = (await page.locator('.paint-area').boundingBox())!;
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  expect(await centerAlpha(page)).toBe(255);
});
