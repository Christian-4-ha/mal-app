import { describe, expect, it } from 'vitest';
import { applyMat, mandalaAxes, matBounds, symmetryMatrices } from './symmetry';

const close = (a: { x: number; y: number }, b: { x: number; y: number }) => {
  expect(a.x).toBeCloseTo(b.x, 6);
  expect(a.y).toBeCloseTo(b.y, 6);
};

describe('symmetryMatrices', () => {
  it('1 Achse: Original und Links-rechts-Spiegelung um die Mitte', () => {
    const ms = symmetryMatrices(1, 100, 50);
    expect(ms).toHaveLength(2);
    close(applyMat(ms[0], 30, 20), { x: 30, y: 20 });
    close(applyMat(ms[1], 30, 20), { x: 170, y: 20 });
  });

  it('n Achsen: 2n Kopien, alle gleich weit von der Mitte, alle verschieden', () => {
    for (const n of [2, 3, 4, 5]) {
      const ms = symmetryMatrices(n, 0, 0);
      expect(ms).toHaveLength(2 * n);
      const pts = ms.map((m) => applyMat(m, 10, 3));
      for (const p of pts) expect(Math.hypot(p.x, p.y)).toBeCloseTo(Math.hypot(10, 3), 6);
      const keys = new Set(pts.map((p) => `${p.x.toFixed(3)},${p.y.toFixed(3)}`));
      expect(keys.size).toBe(2 * n);
    }
  });

  it('der Mittelpunkt bleibt fest', () => {
    for (const m of symmetryMatrices(5, 400, 300)) close(applyMat(m, 400, 300), { x: 400, y: 300 });
  });

  it('matBounds umschließt das gespiegelte Rechteck', () => {
    const [, mirror] = symmetryMatrices(1, 100, 0);
    expect(matBounds(mirror, { x: 10, y: 5, w: 20, h: 8 })).toEqual({ x: 170, y: 5, w: 20, h: 8 });
  });
});

describe('mandalaAxes', () => {
  it('liest die Achsenzahl aus der Modus-ID', () => {
    expect(mandalaAxes('mandala-3')).toBe(3);
    expect(mandalaAxes('free-paint')).toBe(0);
    expect(mandalaAxes('mandala-9')).toBe(0);
  });
});

describe('invertMat', () => {
  it('hebt jede Spiegelmatrix auf', async () => {
    const { invertMat } = await import('./symmetry');
    for (const m of symmetryMatrices(3, 400, 300)) {
      const p = applyMat(m, 123, 45);
      close(applyMat(invertMat(m), p.x, p.y), { x: 123, y: 45 });
    }
  });
});
