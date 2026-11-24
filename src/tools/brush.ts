import type { Tool } from './types';
import { icons } from '../ui/icons';
import { createSmoothLine } from './stroke';

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function createBrush(): Tool {
  let size = 18;
  const line = createSmoothLine((a, b) => {
    const dt = Math.max(1, b.t - a.t);
    const speed = Math.hypot(b.x - a.x, b.y - a.y) / dt; // Leinwandpixel pro ms
    return size * clamp(1 - speed / 3, 0.6, 1);
  });
  return {
    id: 'brush',
    icon: icons.brush,
    order: 10,
    minSize: 4,
    maxSize: 80,
    defaultSize: 18,
    overlayAlpha: 0.85,
    begin(c, p) {
      size = c.size;
      c.ctx.strokeStyle = c.ctx.fillStyle = c.color;
      c.ctx.shadowColor = c.color;
      c.ctx.shadowBlur = c.size * 0.35; // weicher Rand
      line.begin(c.ctx, p);
    },
    move: (c, p) => line.move(c.ctx, p),
    end(c) {
      line.end(c.ctx);
      c.ctx.shadowBlur = 0;
    },
  };
}
