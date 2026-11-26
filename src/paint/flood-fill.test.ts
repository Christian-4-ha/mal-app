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

import { fillMask, floodRegion } from './flood-fill';

describe('floodRegion / fillMask (Vorlagenlinien als Grenze)', () => {
  it('Maske umfasst nur das Innere des Rahmens', () => {
    const lines = imageWithSquareOutline();
    const mask = floodRegion(lines as ImageData, 10, 10)!;
    expect(mask[10 * 20 + 10]).toBe(1);
    expect(mask[1 * 20 + 1]).toBe(0);
    expect(mask[5 * 20 + 10]).toBe(0); // Linie selbst
  });

  it('Start auf einer Linie liefert null', () => {
    expect(floodRegion(imageWithSquareOutline() as ImageData, 5, 5)).toBeNull();
  });

  it('fillMask färbt Maske plus Rand unter der Linie', () => {
    const mask = floodRegion(imageWithSquareOutline() as ImageData, 10, 10)!;
    const paint = blank(20, 20);
    fillMask(paint as ImageData, mask, [0, 255, 0, 255], 2);
    expect(px(paint, 10, 10)).toEqual([0, 255, 0, 255]);
    expect(px(paint, 5, 10)).toEqual([0, 255, 0, 255]); // unter der Linie (1 px)
    expect(px(paint, 4, 10)).toEqual([0, 255, 0, 255]); // 2 px Dilatation
    expect(px(paint, 3, 10)).toEqual([0, 0, 0, 0]);
  });
});

import { floodMask } from './flood-fill';

describe('floodMask (Glitzer-Flächen neu füllen)', () => {
  it('nimmt kleine eingeschlossene Funken mit (auch am Bildrand), große Linien nicht', () => {
    const img = blank(40, 40);
    for (let i = 0; i < 40 * 40; i++) img.data.set([200, 30, 30, 255], i * 4);
    // Funke (2×2 weiß) mitten in der Fläche
    for (const [x, y] of [[10, 10], [11, 10], [10, 11], [11, 11]]) set(img, x, y, [255, 255, 255, 255]);
    set(img, 0, 20, [255, 255, 255, 255]); // Funke am linken Rand
    // senkrechte schwarze Linie über das ganze Bild (trennt links/rechts)
    for (let y = 0; y < 40; y++) set(img, 30, y, [0, 0, 0, 255]);
    const { mask } = floodMask(img as ImageData, 5, 5)!;
    expect(mask[10 * 40 + 10]).toBe(1); // Funke gehört zur Fläche
    expect(mask[20 * 40 + 0]).toBe(1); // auch am Rand
    expect(mask[5 * 40 + 30]).toBe(0); // Linie nicht
    expect(mask[5 * 40 + 35]).toBe(0); // andere Seite nicht
  });

  it('liefert die Fläche auch, wenn sie schon genau die Füllfarbe hat', () => {
    const img = blank(4, 4);
    const r = floodMask(img as ImageData, 1, 1)!;
    expect(r.count).toBe(16);
  });
});
