import { test, expect } from './fixtures';
import { createAndOpenProfile, openFreePaint } from './helpers';

test('Menü zeigt drei beschriftete Kacheln: Galerie, Malen, Spielen', async ({ page }) => {
  await createAndOpenProfile(page, 'Mia');
  const tiles = page.locator('[data-row="1"] [data-tile]');
  await expect(tiles).toHaveCount(3);
  await expect(tiles.nth(0)).toHaveAttribute('data-tile', 'gallery');
  await expect(tiles.nth(1)).toHaveAttribute('data-tile', 'paint');
  await expect(tiles.nth(2)).toHaveAttribute('data-tile', 'play');
  await expect(page.locator('[data-row="1"] .tile-label')).toHaveText(['Galerie', 'Malen', 'Spielen']);
});

test('Malen und Spielen zeigen ihre Modi, Zurück führt in die Gruppe', async ({ page }) => {
  await createAndOpenProfile(page, 'Mia');
  await page.getByTestId('tile-paint').click();
  await expect(page.locator('[data-row="1"] .tile-label')).toHaveText(['Freies Malen', 'Ausmalen', 'Mandala', 'Punkte verbinden']);
  await page.getByTestId('tile-coloring').click();
  await expect(page.locator('[data-row="2"] .tile-label').first()).toHaveText('Fabelwesen');
  await page.getByTestId('group-back').click();
  await page.getByTestId('tile-play').click();
  await expect(page.locator('[data-row="1"] .tile-label')).toHaveText(['Tic-Tac-Toe', 'Vier gewinnt', 'Mühle', 'Puzzle', 'Fehler finden']);
  await page.getByTestId('group-back').click();
  await openFreePaint(page);
  await page.getByTestId('home').click();
  await expect(page.locator('[data-screen="mode-menu"]')).toHaveAttribute('data-group', 'paint');
});
