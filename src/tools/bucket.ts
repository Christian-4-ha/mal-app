import type { Tool } from './types';
import { icons } from '../ui/icons';
import { fillMask, floodFill, floodRegion } from '../paint/flood-fill';

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
      if (c.boundary) {
        // Ausmalen: genau eine Fläche der Vorlage; auf einer Linie getippt → nichts
        const mask = floodRegion(c.boundary, p.x, p.y);
        if (!mask) return;
        const img = c.ctx.getImageData(0, 0, width, height);
        fillMask(img, mask, hexToRgba(c.color));
        c.ctx.putImageData(img, 0, 0);
        return;
      }
      const img = c.ctx.getImageData(0, 0, width, height);
      let filled = 0;
      // ein Lese- und Schreibvorgang für alle (gespiegelten) Punkte
      for (const q of c.points ?? [p]) filled += floodFill(img, q.x, q.y, hexToRgba(c.color));
      if (filled > 0) c.ctx.putImageData(img, 0, 0);
    },
    move() {},
    end() {},
  };
}
