import { test, expect, type Page } from './fixtures';
import { createAndOpenProfile } from './helpers';

const GARDEN = [
  [215, 400],
  [690, 110],
  [600, 200],
  [260, 530],
  [380, 150],
];

/** Zieht mit der Maus einen Kreis um (x, y) (Bildkoordinaten 800 × 600) im rechten Bild. */
async function circle(page: Page, x: number, y: number, r = 70, side = 'right') {
  const box = (await page.getByTestId('diff-' + side).boundingBox())!;
  const k = box.width / 800;
  const at = (a: number) => ({ x: box.x + (x + Math.cos(a) * r) * k, y: box.y + (y + Math.sin(a) * r) * k });
  const s = at(0);
  await page.mouse.move(s.x, s.y);
  await page.mouse.down();
  for (let i = 1; i <= 24; i++) {
    const p = at((i / 24) * Math.PI * 2);
    await page.mouse.move(p.x, p.y);
  }
  await page.mouse.up();
}

async function openGarden(page: Page) {
  await createAndOpenProfile(page);
  await page.getByTestId('tile-play').click();
  await page.getByTestId('tile-spotdiff').click();
  await expect(page.locator('[data-row="2"] .tile-label')).toHaveText(['Garten', 'Strand', 'Weltraum', 'Bauernhof', 'Kinderzimmer']);
  await page.getByTestId('tile-diff-garten').click();
  await expect(page.locator('[data-screen="spotdiff"]')).toBeVisible();
}

test('Fehler finden: Einkreisen markiert, daneben zählt nicht, alle fünf → Lametta', async ({ page }) => {
  await openGarden(page);
  const screen = page.locator('[data-screen="spotdiff"]');
  await circle(page, 480, 330); // kein Unterschied
  await expect(screen).toHaveAttribute('data-found', '0');
  await circle(page, GARDEN[0][0], GARDEN[0][1]);
  await expect(screen).toHaveAttribute('data-found', '1');
  await expect(page.locator('.diff-box.found')).toHaveCount(1);
  await expect(page.getByTestId('diff-left').locator('.marks .found')).toHaveCount(1);
  for (const [x, y] of GARDEN.slice(1)) await circle(page, x, y, 60, 'left');
  await expect(screen).toHaveAttribute('data-found', '5');
  await expect(page.getByTestId('lametta')).toBeAttached();
  await page.getByTestId('diff-next').click();
  await expect(page.locator('[data-screen="spotdiff"]')).toHaveAttribute('data-scene', 'strand');
});

test('Hilfe zeigt die noch nicht gefundenen Unterschiede', async ({ page }) => {
  await openGarden(page);
  await circle(page, GARDEN[2][0], GARDEN[2][1], 50);
  await expect(page.locator('[data-screen="spotdiff"]')).toHaveAttribute('data-found', '1');
  await expect(page.getByTestId('diff-help')).not.toHaveClass(/show/);
  await page.getByTestId('diff-help').evaluate((b: HTMLButtonElement) => b.click());
  await expect(page.getByTestId('diff-right').locator('.marks .hint')).toHaveCount(4);
});
