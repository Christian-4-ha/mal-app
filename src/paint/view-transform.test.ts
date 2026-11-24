import { describe, expect, it } from 'vitest';
import { IDENTITY, pinch, screenToCanvas } from './view-transform';

const bounds = { w: 1000, h: 800 };

describe('view transform', () => {
  it('screenToCanvas invertiert die Transformation', () => {
    const v = { scale: 2, tx: -100, ty: -50 };
    expect(screenToCanvas(v, 100, 50)).toEqual({ x: 100, y: 50 });
    expect(screenToCanvas(IDENTITY, 7, 9)).toEqual({ x: 7, y: 9 });
  });

  it('Spreizen vergrößert um den Fingermittelpunkt', () => {
    const v = pinch(IDENTITY, [{ x: 400, y: 400 }, { x: 600, y: 400 }], [{ x: 300, y: 400 }, { x: 700, y: 400 }], bounds);
    expect(v.scale).toBeCloseTo(2);
    // Punkt unter dem Mittelpunkt bleibt unter dem Mittelpunkt
    const c = screenToCanvas(v, 500, 400);
    expect(c.x).toBeCloseTo(500);
    expect(c.y).toBeCloseTo(400);
  });

  it('pinch begrenzt auf 1..4', () => {
    const big = pinch(IDENTITY, [{ x: 490, y: 400 }, { x: 510, y: 400 }], [{ x: 0, y: 400 }, { x: 1000, y: 400 }], bounds);
    expect(big.scale).toBe(4);
    const small = pinch(IDENTITY, [{ x: 0, y: 400 }, { x: 1000, y: 400 }], [{ x: 490, y: 400 }, { x: 510, y: 400 }], bounds);
    expect(small.scale).toBe(1);
  });

  it('Leinwand verlässt den Bildbereich nicht', () => {
    // Bei scale 1 ist keine Verschiebung möglich
    const v = pinch(IDENTITY, [{ x: 100, y: 100 }, { x: 200, y: 100 }], [{ x: 400, y: 300 }, { x: 500, y: 300 }], bounds);
    expect(v).toEqual({ scale: 1, tx: 0, ty: 0 });
    // Bei scale 2: tx in [-1000, 0]
    const z = { scale: 2, tx: -10, ty: -10 };
    const moved = pinch(z, [{ x: 100, y: 100 }, { x: 200, y: 100 }], [{ x: 600, y: 600 }, { x: 700, y: 600 }], bounds);
    expect(moved.tx).toBe(0);
    expect(moved.ty).toBe(0);
  });
});
