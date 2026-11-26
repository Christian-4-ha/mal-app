import { test, expect, type Page } from './fixtures';
import { createAndOpenProfile } from './helpers';

async function openFirstTemplate(page: Page) {
  await page.getByTestId('tile-coloring').click();
  const themes = page.locator('[data-row="2"] [data-tile]');
  await expect(themes.first()).toBeVisible();
  await themes.first().click();
  const templates = page.locator('[data-row="3"] [data-tile]');
  await expect(templates.first()).toBeVisible();
  await templates.first().click();
  await expect(page.locator('[data-screen="paint"]')).toHaveAttribute('data-ready', 'true');
}

/** Pixel der Vorlagenebene: Bildschirmposition eines Linienpixels und eines freien Eckpixels. */
async function probe(page: Page) {
  return page.evaluate(() => {
    const c = document.querySelector<HTMLCanvasElement>('canvas[data-layer="template"]')!;
    const d = c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data;
    const r = c.getBoundingClientRect();
    const k = r.width / c.width;
    let line: [number, number] | null = null;
    for (let y = Math.floor(c.height / 2); y < c.height && !line; y++)
      for (let x = 0; x < c.width; x++)
        if (d[(y * c.width + x) * 4 + 3] === 255 && d[(y * c.width + x + 1) * 4 + 3] === 255 && d[(y * c.width + x + 2) * 4 + 3] === 255) {
          line = [x + 1, y];
          break;
        }
    return { line: { x: r.left + line![0] * k, y: r.top + line![1] * k, cx: line![0], cy: line![1] }, corner: { x: r.left + 6, y: r.top + 6 } };
  });
}

const paintAlphaAt = (page: Page, sx: number, sy: number) =>
  page.evaluate(([x, y]) => {
    const c = document.querySelector<HTMLCanvasElement>('canvas[data-layer="paint"]')!;
    const r = c.getBoundingClientRect();
    const px = Math.floor(((x - r.left) * c.width) / r.width);
    const py = Math.floor(((y - r.top) * c.height) / r.height);
    return c.getContext('2d')!.getImageData(px, py, 1, 1).data[3];
  }, [sx, sy]);

test('Ausmalen: Thema → Vorlage → Malfläche mit Linien', async ({ page }) => {
  await createAndOpenProfile(page);
  await openFirstTemplate(page);
  const p = await probe(page);
  expect(p.line).toBeTruthy();
});

test('Eimer füllt die Fläche, aber nicht auf einer Linie getippt', async ({ page }) => {
  await createAndOpenProfile(page);
  await openFirstTemplate(page);
  await page.getByTestId('tool-bucket').click();
  const p = await probe(page);
  await page.mouse.click(p.line.x, p.line.y);
  expect(await paintAlphaAt(page, p.corner.x, p.corner.y)).toBe(0);
  await page.mouse.click(p.corner.x, p.corner.y);
  expect(await paintAlphaAt(page, p.corner.x, p.corner.y)).toBe(255);
});

test('Ausmalbild landet mit Vorlage in der Galerie und öffnet wieder mit Linien', async ({ page }) => {
  await createAndOpenProfile(page);
  await openFirstTemplate(page);
  await page.getByTestId('tool-bucket').click();
  const p = await probe(page);
  await page.mouse.click(p.corner.x, p.corner.y);
  await page.getByTestId('home').click();
  await page.getByTestId('tile-gallery').click();
  await page.getByTestId('gallery-item').click();
  await expect(page.locator('[data-screen="paint"]')).toHaveAttribute('data-ready', 'true');
  expect((await probe(page)).line).toBeTruthy();
});
