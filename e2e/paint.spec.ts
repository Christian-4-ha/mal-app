import { test, expect } from './fixtures';
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

test('Regenbogen öffnet Palette, gewählte Farbe erscheint als eigener Tupfer', async ({ page }) => {
  await createAndOpenProfile(page);
  await openFreePaint(page);
  await expect(page.getByTestId('custom-color')).toBeHidden();
  await page.getByTestId('rainbow').click();
  const cells = page.getByTestId('palette').locator('.palette-cell');
  await expect(cells).toHaveCount(110);
  const picked = await cells.nth(25).getAttribute('data-color');
  await cells.nth(25).click();
  await expect(page.getByTestId('palette')).toBeHidden();
  const custom = page.getByTestId('custom-color');
  await expect(custom).toBeVisible();
  await expect(custom).toHaveAttribute('data-color', picked!);
  await expect(custom).toHaveClass(/active/);
});

test('Glitzer-Reiter: Glitzerfarbe malt Funken in den Strich', async ({ page }) => {
  await createAndOpenProfile(page);
  await openFreePaint(page);
  await page.getByTestId('tool-marker').click();
  await page.getByTestId('rainbow').click();
  await page.getByTestId('palette-tab-glitter').click();
  await expect(page.getByTestId('palette')).toHaveAttribute('data-tab', 'glitter');
  const cells = page.getByTestId('palette').locator('.palette-cell.glitter');
  await expect(cells).toHaveCount(110);
  await cells.nth(46).click();
  await expect(page.getByTestId('custom-color')).toHaveClass(/glitter/);
  await drawStroke(page);
  // Im Strich gibt es viele verschiedene Farbtöne (Funken + Schimmer), nicht nur eine Farbe
  const shades = await page.evaluate(() => {
    const c = document.querySelector<HTMLCanvasElement>('canvas[data-layer="paint"]')!;
    const d = c.getContext('2d')!.getImageData(Math.floor(c.width * 0.4), Math.floor(c.height / 2) - 4, 200, 8).data;
    const set = new Set<string>();
    for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 200) set.add(`${d[i]},${d[i + 1]},${d[i + 2]}`);
    return set.size;
  });
  expect(shades).toBeGreaterThan(5);
});

test('Regenbogen und Größe bleiben stehen, wenn die Farben scrollen', async ({ page }) => {
  await createAndOpenProfile(page);
  await openFreePaint(page);
  const before = (await page.getByTestId('rainbow').boundingBox())!.y;
  await page.locator('.color-scroll').evaluate((el) => (el.scrollTop = 400));
  expect((await page.getByTestId('rainbow').boundingBox())!.y).toBe(before);
  await expect(page.locator('.color-fixed [data-testid="size"]')).toBeVisible();
});

test('Wechsel-Knopf am Stempel öffnet die Auswahl, das Feld zeigt danach das Herz', async ({ page }) => {
  await createAndOpenProfile(page);
  await openFreePaint(page);
  const sw = page.getByTestId('variant-switch-pattern');
  const box = (await sw.boundingBox())!;
  expect(box.width).toBeGreaterThanOrEqual(40);
  await sw.click();
  const pop = page.getByTestId('variant-popup');
  await expect(pop).toBeVisible();
  await pop.locator('[data-variant="heart"]').click();
  await expect(page.getByTestId('tool-pattern')).toHaveAttribute('data-variant', 'heart');
  await expect(page.getByTestId('tool-pattern')).toHaveClass(/active/);
  // Muster-Werkzeug: deutliche Muster zur Wahl
  await page.getByTestId('variant-switch-texture').click();
  await expect(page.getByTestId('variant-popup').locator('[data-variant]')).toHaveCount(5);
});
