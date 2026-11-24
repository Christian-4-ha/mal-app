import type { Tool } from './types';
import { icons } from '../ui/icons';
import { floodFill } from '../paint/flood-fill';

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
      const img = c.ctx.getImageData(0, 0, width, height);
      if (floodFill(img, p.x, p.y, hexToRgba(c.color)) > 0) c.ctx.putImageData(img, 0, 0);
    },
    move() {},
    end() {},
  };
}
