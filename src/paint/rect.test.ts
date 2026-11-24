import { describe, expect, it } from 'vitest';
import { clampRect, growRect } from './rect';

describe('rect', () => {
  it('growRect umschließt Punkte mit Rand', () => {
    let r = growRect(null, 10, 20, 5);
    expect(r).toEqual({ x: 5, y: 15, w: 10, h: 10 });
    r = growRect(r, 30, 10, 5);
    expect(r).toEqual({ x: 5, y: 5, w: 30, h: 20 });
  });

  it('clampRect schneidet auf die Leinwand zu und rundet nach außen', () => {
    expect(clampRect({ x: -3.5, y: 2.2, w: 10, h: 500 }, 100, 50)).toEqual({ x: 0, y: 2, w: 7, h: 48 });
  });

  it('clampRect liefert null bei leerer Schnittmenge', () => {
    expect(clampRect({ x: 200, y: 0, w: 10, h: 10 }, 100, 50)).toBeNull();
  });
});
