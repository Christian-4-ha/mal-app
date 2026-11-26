import { describe, expect, it } from 'vitest';
import { SCENES } from './scenes';

describe('Fehler-finden-Bilder', () => {
  it('fünf Bilder mit je fünf sichtbaren, getrennten Unterschieden', () => {
    expect(SCENES).toHaveLength(5);
    for (const s of SCENES) {
      expect(s.diffs).toHaveLength(5);
      s.diffs.forEach((d, i) => {
        expect(d.left, `${s.id} ${i}`).not.toBe(d.right);
        expect(d.x - d.r).toBeGreaterThan(-10);
        expect(d.x + d.r).toBeLessThan(810);
        expect(d.y - d.r).toBeGreaterThan(-10);
        expect(d.y + d.r).toBeLessThan(610);
        s.diffs.forEach((e, j) => {
          if (j > i) expect(Math.hypot(d.x - e.x, d.y - e.y), `${s.id} ${i}/${j}`).toBeGreaterThan(d.r + e.r - 10);
        });
      });
    }
  });
});
