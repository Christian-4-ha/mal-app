import type { StrokePoint, Tool } from './types';
import { icons } from '../ui/icons';

export function magicHue(distance: number): number {
  return (distance / 4) % 360;
}

/** Zauberstift: Farbe läuft beim Malen durch den Regenbogen (gewählte Farbe wird ignoriert). */
export function createMagic(): Tool {
  let last: StrokePoint | null = null;
  let travelled = 0;
  return {
    id: 'magic',
    icon: icons.magic,
    order: 60,
    minSize: 4,
    maxSize: 60,
    defaultSize: 14,
    begin(c, p) {
      last = p;
      travelled = 0;
      c.ctx.lineCap = 'round';
      c.ctx.lineJoin = 'round';
      c.ctx.lineWidth = c.size;
      c.ctx.fillStyle = `hsl(0, 90%, 55%)`;
      c.ctx.beginPath();
      c.ctx.arc(p.x, p.y, c.size / 2, 0, Math.PI * 2);
      c.ctx.fill();
    },
    move(c, p) {
      if (!last) return;
      // in kleine Stücke teilen, damit der Farbverlauf auch bei schnellen Bewegungen fließend bleibt
      const d = Math.hypot(p.x - last.x, p.y - last.y);
      const steps = Math.max(1, Math.ceil(d / 6));
      for (let i = 1; i <= steps; i++) {
        const x0 = last.x + ((p.x - last.x) * (i - 1)) / steps;
        const y0 = last.y + ((p.y - last.y) * (i - 1)) / steps;
        const x1 = last.x + ((p.x - last.x) * i) / steps;
        const y1 = last.y + ((p.y - last.y) * i) / steps;
        travelled += d / steps;
        c.ctx.strokeStyle = `hsl(${magicHue(travelled)}, 90%, 55%)`;
        c.ctx.beginPath();
        c.ctx.moveTo(x0, y0);
        c.ctx.lineTo(x1, y1);
        c.ctx.stroke();
      }
      last = p;
    },
    end() {
      last = null;
    },
  };
}
