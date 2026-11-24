import { describe, expect, it } from 'vitest';
import { floodFill } from './flood-fill';
import { magicHue } from '../tools/magic';

type Img = { width: number; height: number; data: Uint8ClampedArray };

function blank(w: number, h: number): Img {
  return { width: w, height: h, data: new Uint8ClampedArray(w * h * 4) };
}
function set(img: Img, x: number, y: number, rgba: number[]) {
  img.data.set(rgba, (y * img.width + x) * 4);
}
function px(img: Img, x: number, y: number): number[] {
  const i = (y * img.width + x) * 4;
  return [...img.data.slice(i, i + 4)];
}
/** Schwarzer Rahmen von 5 bis 14 in einem 20×20-Bild. */
function imageWithSquareOutline(): Img {
  const img = blank(20, 20);
  for (let i = 5; i <= 14; i++) {
    set(img, i, 5, [0, 0, 0, 255]);
    set(img, i, 14, [0, 0, 0, 255]);
    set(img, 5, i, [0, 0, 0, 255]);
    set(img, 14, i, [0, 0, 0, 255]);
  }
  return img;
}

describe('floodFill', () => {
  it('füllt geschlossene Fläche, nicht darüber hinaus', () => {
    const img = imageWithSquareOutline();
    const n = floodFill(img as ImageData, 10, 10, [255, 0, 0, 255]);
    expect(px(img, 10, 10)).toEqual([255, 0, 0, 255]);
    expect(px(img, 6, 6)).toEqual([255, 0, 0, 255]);
    expect(px(img, 1, 1)).toEqual([0, 0, 0, 0]);
    expect(n).toBe(64);
  });

  it('färbt den angrenzenden Kantenpixel mit ein (kein heller Saum)', () => {
    const img = imageWithSquareOutline();
    set(img, 9, 6, [0, 0, 0, 140]); // halbtransparenter Kantenpixel innen an der Linie – über Toleranz
    floodFill(img as ImageData, 10, 10, [255, 0, 0, 255]);
    expect(px(img, 9, 6)).toEqual([255, 0, 0, 255]);
    expect(px(img, 9, 5)).toEqual([0, 0, 0, 255]); // eigentliche Linie bleibt
  });

  it('Füllen auf gleiche Farbe gibt 0 zurück und ändert nichts', () => {
    const img = blank(4, 4);
    expect(floodFill(img as ImageData, 1, 1, [0, 0, 0, 0])).toBe(0);
  });

  it('Toleranz überbrückt Grautöne nahe der Startfarbe', () => {
    const img = blank(5, 1);
    set(img, 2, 0, [0, 0, 0, 20]); // fast transparent
    floodFill(img as ImageData, 0, 0, [0, 0, 255, 255]);
    expect(px(img, 4, 0)).toEqual([0, 0, 255, 255]);
  });

  it('Startpunkt außerhalb gibt 0 zurück', () => {
    expect(floodFill(blank(3, 3) as ImageData, 5, 5, [1, 2, 3, 255])).toBe(0);
  });
});

describe('magicHue', () => {
  it('läuft zyklisch', () => {
    expect(magicHue(0)).toBe(0);
    expect(magicHue(1440)).toBe(0);
    expect(magicHue(400)).toBe(100);
  });
});
