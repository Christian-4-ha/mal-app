import type { StrokePoint, Tool, ToolContext } from './types';
import { icons } from '../ui/icons';

// Formen in einem Feld von -1..1
const SHAPES: Record<string, Path2D | null> = { star: null, heart: null, dot: null };

function shape(id: string): Path2D {
  if (SHAPES[id]) return SHAPES[id]!;
  const p = new Path2D();
  if (id === 'star') {
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? 1 : 0.45;
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      if (i === 0) p.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      else p.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    p.closePath();
  } else if (id === 'heart') {
    p.moveTo(0, 0.9);
    p.bezierCurveTo(-1.3, 0, -0.8, -1.1, 0, -0.4);
    p.bezierCurveTo(0.8, -1.1, 1.3, 0, 0, 0.9);
  } else {
    p.arc(0, 0, 0.7, 0, Math.PI * 2);
  }
  SHAPES[id] = p;
  return p;
}

/** Musterstift: setzt Formen im Abstand size * 1.2 entlang des Pfads, leicht zufällig gedreht. */
export function createPattern(): Tool {
  let last: StrokePoint | null = null;
  let carry = 0;
  const stamp = (c: ToolContext, x: number, y: number) => {
    const s = c.size / 2;
    c.ctx.save();
    c.ctx.translate(x, y);
    c.ctx.rotate((Math.random() - 0.5) * 0.8);
    c.ctx.scale(s, s);
    c.ctx.fill(shape(c.variant ?? 'star'));
    c.ctx.restore();
  };
  return {
    id: 'pattern',
    icon: icons.pattern,
    order: 70,
    minSize: 10,
    maxSize: 80,
    defaultSize: 30,
    variants: [
      { id: 'star', icon: icons.star },
      { id: 'heart', icon: icons.heart },
      { id: 'dot', icon: icons.dot },
    ],
    begin(c, p) {
      c.ctx.fillStyle = c.color;
      last = p;
      carry = 0;
      stamp(c, p.x, p.y);
    },
    move(c, p) {
      if (!last) return;
      const gap = c.size * 1.2;
      let dx = p.x - last.x;
      let dy = p.y - last.y;
      let d = Math.hypot(dx, dy);
      let x = last.x;
      let y = last.y;
      while (carry + d >= gap) {
        const step = gap - carry;
        x += (dx / d) * step;
        y += (dy / d) * step;
        stamp(c, x, y);
        dx = p.x - x;
        dy = p.y - y;
        d = Math.hypot(dx, dy);
        carry = 0;
      }
      carry += d;
      last = p;
    },
    end() {
      last = null;
    },
  };
}
