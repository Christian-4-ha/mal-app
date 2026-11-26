import type { StrokePoint, Tool, ToolContext } from './types';
import { icons } from '../ui/icons';
import { paintStyle } from './glitter';

/** Sprühdose: Punktwolke, wird dichter, je länger man an einer Stelle bleibt. */
export function createSpray(): Tool {
  let timer = 0;
  let at: StrokePoint | null = null;
  const puff = (c: ToolContext) => {
    if (!at) return;
    const r = c.size / 2;
    const n = Math.max(4, Math.round(c.size * 0.6));
    const dot = Math.max(1, c.size / 40);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const d = r * Math.sqrt(Math.random());
      c.ctx.fillRect(at.x + Math.cos(a) * d, at.y + Math.sin(a) * d, dot + Math.random(), dot + Math.random());
    }
  };
  return {
    id: 'spray',
    icon: icons.spray,
    order: 40,
    minSize: 8,
    maxSize: 120,
    defaultSize: 40,
    begin(c, p) {
      at = p;
      c.ctx.fillStyle = paintStyle(c);
      puff(c);
      timer = window.setInterval(() => puff(c), 16);
    },
    move(c, p) {
      // Zwischenpunkte entlang der Strecke, damit bei schnellen Bewegungen keine Lücken entstehen
      const from = at ?? p;
      const d = Math.hypot(p.x - from.x, p.y - from.y);
      const steps = Math.max(1, Math.ceil(d / (c.size / 4)));
      for (let i = 1; i <= steps; i++) {
        at = { ...p, x: from.x + ((p.x - from.x) * i) / steps, y: from.y + ((p.y - from.y) * i) / steps };
        puff(c);
      }
    },
    end() {
      clearInterval(timer);
      at = null;
    },
  };
}
