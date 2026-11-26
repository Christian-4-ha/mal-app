import type { Tool } from './types';
import { icons } from '../ui/icons';
import { paintStyle } from './glitter';
import { createSmoothLine } from './stroke';

export function createFineliner(): Tool {
  let size = 3;
  const line = createSmoothLine(() => size);
  return {
    id: 'fineliner',
    icon: icons.fineliner,
    order: 30,
    minSize: 1,
    maxSize: 12,
    defaultSize: 3,
    begin(c, p) {
      size = c.size;
      c.ctx.strokeStyle = c.ctx.fillStyle = paintStyle(c);
      line.begin(c.ctx, p);
    },
    move: (c, p) => line.move(c.ctx, p),
    end: (c) => line.end(c.ctx),
  };
}
