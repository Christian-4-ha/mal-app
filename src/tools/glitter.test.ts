import { describe, expect, it } from 'vitest';
import { addSparkles, glitterRGB, paintGlitter } from './glitter';

const img = (w: number, h: number) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) });

describe('glitterRGB', () => {
  it('ist an derselben Stelle immer gleich (Funken stehen fest)', () => {
    expect(glitterRGB([200, 30, 30], 17, 9)).toEqual(glitterRGB([200, 30, 30], 17, 9));
  });

  it('hat in einer Fläche helle Funken und sonst die Grundfarbe in Nähe', () => {
    let bright = 0;
    for (let y = 0; y < 64; y++)
      for (let x = 0; x < 64; x++) {
        const [r, g, b] = glitterRGB([200, 30, 30], x, y);
        if (g > 150 && b > 120) bright++;
        else expect(Math.abs(r - 200)).toBeLessThan(40);
      }
    expect(bright).toBeGreaterThan(64 * 64 * 0.02);
    expect(bright).toBeLessThan(64 * 64 * 0.25);
  });
});

describe('paintGlitter', () => {
  it('malt Glitzer nur in die Maske, auch über die gleiche Grundfarbe', () => {
    const a = img(32, 32);
    for (let i = 0; i < 32 * 32; i++) a.data.set([200, 30, 30, 255], i * 4); // schon rot
    const mask = new Uint8Array(32 * 32);
    for (let y = 0; y < 32; y++) for (let x = 0; x < 16; x++) mask[y * 32 + x] = 1;
    paintGlitter(a, mask, '#c81e1e');
    for (let y = 0; y < 32; y++) expect([...a.data.slice((y * 32 + 20) * 4, (y * 32 + 20) * 4 + 4)]).toEqual([200, 30, 30, 255]);
    const left = new Set<string>();
    for (let y = 0; y < 32; y++) for (let x = 0; x < 16; x++) left.add(a.data.slice((y * 32 + x) * 4, (y * 32 + x) * 4 + 4).join());
    expect(left.size).toBeGreaterThan(2);
    expect(a.data[3]).toBe(255);
  });
});

describe('addSparkles', () => {
  it('hellt einzelne sichtbare Pixel auf, durchsichtige bleiben durchsichtig', () => {
    const a = img(64, 64);
    for (let i = 0; i < 64 * 32; i++) a.data.set([30, 60, 200, 255], i * 4); // obere Hälfte blau
    addSparkles(a);
    let bright = 0;
    for (let i = 0; i < 64 * 32; i++) if (a.data[i * 4] > 150) bright++;
    expect(bright).toBeGreaterThan(0);
    for (let i = 64 * 32; i < 64 * 64; i++) expect(a.data[i * 4 + 3]).toBe(0);
  });
});
