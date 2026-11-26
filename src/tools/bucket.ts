import type { Tool } from './types';
import { icons } from '../ui/icons';
import { dilateMask, floodMask, floodRegion, paintMask } from '../paint/flood-fill';
import { paintGlitter } from './glitter';

export function hexToRgba(hex: string): [number, number, number, number] {
  const n = parseInt(hex.slice(1, 7), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 255];
}

/** Eimer: füllt eine umrandete Fläche. Hat keine Größe. */
export function createBucket(): Tool {
  return {
    id: 'bucket',
    icon: icons.bucket,
    order: 50,
    minSize: 0,
    maxSize: 0,
    defaultSize: 0,
    begin(c, p) {
      const { width, height } = c.ctx.canvas;
      const rgba = hexToRgba(c.color);
      const paint = (img: ImageData, mask: Uint8Array) =>
        c.glitter ? paintGlitter(img, mask, c.color) : paintMask(img, mask, rgba);
      if (c.boundary) {
        // Ausmalen: genau eine Fläche der Vorlage; auf einer Linie getippt → nichts
        const region = floodRegion(c.boundary, p.x, p.y);
        if (!region) return;
        const img = c.ctx.getImageData(0, 0, width, height);
        paint(img, dilateMask(region, width, height, 2));
        c.ctx.putImageData(img, 0, 0);
        return;
      }
      const img = c.ctx.getImageData(0, 0, width, height);
      // Flächen aller (gespiegelten) Punkte auf dem Ausgangsbild bestimmen, dann in einem Durchgang malen
      let mask: Uint8Array | null = null;
      for (const q of c.points ?? [p]) {
        const r = floodMask(img, q.x, q.y);
        if (!r) continue;
        if (!mask) mask = r.mask;
        else for (let i = 0; i < mask.length; i++) mask[i] |= r.mask[i];
      }
      if (!mask) return;
      paint(img, mask);
      c.ctx.putImageData(img, 0, 0);
    },
    move() {},
    end() {},
  };
}
