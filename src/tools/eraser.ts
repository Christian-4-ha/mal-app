import type { Tool } from './types';
import { icons } from '../ui/icons';
import { createSmoothLine } from './stroke';

export function createEraser(): Tool {
  let size = 30;
  const line = createSmoothLine(() => size);
  return {
    id: 'eraser',
    icon: icons.eraser,
    order: 90,
    minSize: 6,
    maxSize: 100,
    defaultSize: 30,
    begin(c, p) {
      size = c.size;
      c.ctx.save();
      c.ctx.globalCompositeOperation = 'destination-out';
      c.ctx.strokeStyle = c.ctx.fillStyle = '#000';
      line.begin(c.ctx, p);
    },
    move: (c, p) => line.move(c.ctx, p),
    end(c) {
      line.end(c.ctx);
      c.ctx.restore();
    },
  };
}
