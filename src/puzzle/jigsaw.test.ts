import { describe, expect, it } from 'vitest';
import { PIECE_COUNTS, makeEdges, shouldSnap } from './jigsaw';

describe('makeEdges', () => {
  it('Rand ist gerade, Nachbarn passen zusammen (Nase ↔ Loch)', () => {
    const cols = 5;
    const rows = 4;
    const e = makeEdges(cols, rows);
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) {
        const p = e[r * cols + c];
        if (r === 0) expect(p.top).toBe(0);
        if (r === rows - 1) expect(p.bottom).toBe(0);
        if (c === 0) expect(p.left).toBe(0);
        if (c === cols - 1) expect(p.right).toBe(0);
        if (c < cols - 1) {
          expect(Math.abs(p.right)).toBe(1);
          expect(p.right).toBe(-e[r * cols + c + 1].left);
        }
        if (r < rows - 1) {
          expect(Math.abs(p.bottom)).toBe(1);
          expect(p.bottom).toBe(-e[(r + 1) * cols + c].top);
        }
      }
  });
});

describe('Teilezahlen', () => {
  it('Raster ergibt genau die Teilezahl, ungefähr im Querformat', () => {
    for (const p of PIECE_COUNTS) {
      expect(p.cols * p.rows).toBe(p.count);
      expect(p.cols / p.rows).toBeGreaterThanOrEqual(1.2);
      expect(p.cols / p.rows).toBeLessThanOrEqual(1.5);
    }
  });
});

describe('shouldSnap', () => {
  it('rastet nur nahe am Ziel ein', () => {
    expect(shouldSnap(5, 5, 100)).toBe(true);
    expect(shouldSnap(40, 0, 100)).toBe(false);
  });
});
