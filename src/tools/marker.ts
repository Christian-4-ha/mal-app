import type { Tool } from './types';
import { icons } from '../ui/icons';
import { createSmoothLine } from './stroke';

export function createMarker(): Tool {
  let size = 12;
  const line = createSmoothLine(() => size);
  return {
    id: 'marker',
    icon: icons.marker,
    order: 20,
    minSize: 4,
    maxSize: 60,
    defaultSize: 12,
    overlayAlpha: 0.8,
    begin(c, p) {
      size = c.size;
      c.ctx.strokeStyle = c.ctx.fillStyle = c.color;
      line.begin(c.ctx, p);
    },
    move: (c, p) => line.move(c.ctx, p),
    end: (c) => line.end(c.ctx),
  };
}
