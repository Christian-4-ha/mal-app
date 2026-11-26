import { test, expect, type Page } from './fixtures';
import { createAndOpenProfile } from './helpers';

async function startGame(page: Page, game: string) {
  await createAndOpenProfile(page);
  await page.getByTestId('tile-games').click();
  await page.locator(`[data-row="2"] [data-tile="${game}"]`).click();
  await page.getByTestId('opponent-guest').click();
  await expect(page.locator(`[data-screen="game"][data-game="${game}"]`)).toBeVisible();
}

test('Tic-Tac-Toe gegen Gast: drei in einer Reihe gewinnt', async ({ page }) => {
  await startGame(page, 'tictactoe');
  await expect(page.getByTestId('player-0')).toHaveClass(/turn/);
  for (const i of [0, 3, 1, 4, 2]) await page.getByTestId(`ttt-cell-${i}`).click();
  await expect(page.getByTestId('game-over')).toHaveAttribute('data-winner', '0');
  // Nochmal: jetzt beginnt Spieler 2
  await page.getByTestId('game-replay').click();
  await expect(page.getByTestId('game-over')).toHaveCount(0);
  await expect(page.getByTestId('player-1')).toHaveClass(/turn/);
});

test('Vier gewinnt: vier übereinander gewinnt', async ({ page }) => {
  await startGame(page, 'connect4');
  for (const c of [0, 1, 0, 1, 0, 1, 0]) await page.getByTestId(`c4-col-${c}`).click();
  await expect(page.getByTestId('game-over')).toHaveAttribute('data-winner', '0');
});

test('Mühle: nach einer Mühle wird ein Stein genommen', async ({ page }) => {
  await startGame(page, 'muehle');
  for (const i of [0, 9, 1, 10, 2]) await page.getByTestId(`mill-pt-${i}`).click();
  await expect(page.locator('.board-muehle')).toHaveAttribute('data-phase', 'remove');
  await page.getByTestId('mill-pt-9').click();
  await expect(page.getByTestId('mill-pt-9')).toHaveAttribute('data-p', '');
  await expect(page.locator('.board-muehle')).toHaveAttribute('data-phase', 'place');
  await expect(page.getByTestId('player-1')).toHaveClass(/turn/);
});

test('Puzzle mit 6 Teilen lässt sich zusammensetzen', async ({ page }) => {
  await createAndOpenProfile(page);
  await page.getByTestId('tile-games').click();
  await page.locator('[data-row="2"] [data-tile="puzzle"]').click();
  await page.locator('[data-row="3"] [data-tile]').first().click();
  await page.getByTestId('pieces-6').click();
  const pieces = page.getByTestId('puzzle-piece');
  await expect(pieces).toHaveCount(6);
  const table = (await page.locator('.puzzle-table').boundingBox())!;
  for (let n = 0; n < 6; n++) {
    // oberstes loses Teil zuerst, damit kein anderes darüber liegt
    const info = await page.evaluate(() => {
      const els = [...document.querySelectorAll<HTMLCanvasElement>('.puzzle-piece:not(.placed)')];
      els.sort((a, b) => Number(b.style.zIndex) - Number(a.style.zIndex));
      const el = els[0];
      const r = el.getBoundingClientRect();
      const [hx, hy] = el.dataset.home!.split(',').map(Number);
      return { cx: r.left + r.width / 2, cy: r.top + r.height / 2, tx: hx + r.width / 2, ty: hy + r.height / 2 };
    });
    await page.mouse.move(info.cx, info.cy);
    await page.mouse.down();
    await page.mouse.move(table.x + info.tx + 4, table.y + info.ty + 3, { steps: 5 });
    await page.mouse.up();
  }
  await expect(page.locator('.puzzle-piece.placed')).toHaveCount(6);
  await expect(page.getByTestId('puzzle-done')).toBeVisible();
});
