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
  } else if (id === 'flower') {
    // fünf runde Blütenblätter
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
      const [px, py] = T(Math.cos(a) * 0.55, Math.sin(a) * 0.55);
      p.moveTo(px + 0.42 * s, py);
      p.arc(px, py, 0.42 * s, 0, Math.PI * 2);
    }
  } else if (id === 'sun') {
    // Kreis mit acht spitzen Strahlen
    p.moveTo(...T(0.5, 0));
    p.arc(x, y, 0.5 * s, 0, Math.PI * 2);
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      const w = 0.16;
      p.moveTo(...T(Math.cos(a - w) * 0.55, Math.sin(a - w) * 0.55));
      p.lineTo(...T(Math.cos(a) * 1, Math.sin(a) * 1));
      p.lineTo(...T(Math.cos(a + w) * 0.55, Math.sin(a + w) * 0.55));
      p.closePath();
    }
  } else if (id === 'cloud') {
    // drei Bäusche auf flachem Boden
    for (const [cx, cy, r] of [[-0.48, 0.12, 0.36], [0, -0.12, 0.5], [0.48, 0.12, 0.36]]) {
      const [px, py] = T(cx, cy);
      p.moveTo(px + r * s, py);
      p.arc(px, py, r * s, 0, Math.PI * 2);
    }
    p.moveTo(...T(-0.48, 0.1));
    p.lineTo(...T(0.48, 0.1));
    p.lineTo(...T(0.48, 0.48));
    p.lineTo(...T(-0.48, 0.48));
    p.closePath();
  } else {
    p.arc(x, y, 0.7 * s, 0, Math.PI * 2);
  }
  return p;
}

/** Gelbe (bei gelber Farbe orange) Blütenmitte. */
function flowerCenter(c: ToolContext, x: number, y: number, s: number) {
  const prev = c.ctx.fillStyle;
  const n = parseInt(c.color.slice(1, 7), 16);
  const yellowish = (n >> 16) > 200 && ((n >> 8) & 255) > 170 && (n & 255) < 130;
  c.ctx.fillStyle = yellowish ? '#fb8c00' : '#ffd54f';
  c.ctx.beginPath();
  c.ctx.arc(x, y, 0.3 * s, 0, Math.PI * 2);
  c.ctx.fill();
  c.ctx.fillStyle = prev;
}

/** Musterstift: setzt Formen im Abstand size * 1.2 entlang des Pfads, leicht zufällig gedreht. */
export function createPattern(): Tool {
  let last: StrokePoint | null = null;
  let carry = 0;
  const stamp = (c: ToolContext, x: number, y: number) => {
    const id = c.variant ?? 'star';
    c.ctx.fill(shapePath(id, x, y, c.size / 2, (Math.random() - 0.5) * 0.8));
    if (id === 'flower') flowerCenter(c, x, y, c.size / 2);
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
      { id: 'flower', icon: icons.flower },
      { id: 'sun', icon: icons.sunStamp },
      { id: 'cloud', icon: icons.cloud },
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
