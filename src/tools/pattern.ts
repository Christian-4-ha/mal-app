import type { StrokePoint, Tool, ToolContext } from './types';
import { icons } from '../ui/icons';
import { paintStyle } from './glitter';

/**
 * Form an Stelle (x, y) mit Radius s und Drehung rot, direkt in Leinwandkoordinaten
 * (ohne Kontext-Transformation, damit Glitzer-Muster nicht mitskaliert werden).
 */
function shapePath(id: string, x: number, y: number, s: number, rot: number): Path2D {
  const cos = Math.cos(rot) * s;
  const sin = Math.sin(rot) * s;
  const T = (px: number, py: number): [number, number] => [x + px * cos - py * sin, y + px * sin + py * cos];
  const p = new Path2D();
  if (id === 'star') {
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? 1 : 0.45;
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const [px, py] = T(Math.cos(a) * r, Math.sin(a) * r);
      if (i === 0) p.moveTo(px, py);
      else p.lineTo(px, py);
    }
    p.closePath();
  } else if (id === 'heart') {
    p.moveTo(...T(0, 0.9));
    p.bezierCurveTo(...T(-1.3, 0), ...T(-0.8, -1.1), ...T(0, -0.4));
    p.bezierCurveTo(...T(0.8, -1.1), ...T(1.3, 0), ...T(0, 0.9));
  } else {
    p.arc(x, y, 0.7 * s, 0, Math.PI * 2);
  }
  return p;
}

/** Musterstift: setzt Formen im Abstand size * 1.2 entlang des Pfads, leicht zufällig gedreht. */
export function createPattern(): Tool {
  let last: StrokePoint | null = null;
  let carry = 0;
  const stamp = (c: ToolContext, x: number, y: number) => {
    c.ctx.fill(shapePath(c.variant ?? 'star', x, y, c.size / 2, (Math.random() - 0.5) * 0.8));
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
      c.ctx.fillStyle = paintStyle(c);
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
