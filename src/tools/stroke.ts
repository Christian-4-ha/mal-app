import type { StrokePoint } from './types';

/**
 * Geglättete Linie: Segmente laufen von Mittelpunkt zu Mittelpunkt mit dem echten Punkt als Kontrollpunkt.
 * `width` liefert die Breite je Segment (für geschwindigkeitsabhängige Pinsel).
 */
export function createSmoothLine(width: (prev: StrokePoint, next: StrokePoint) => number) {
  let last: StrokePoint | null = null;
  let lastMid: { x: number; y: number } | null = null;
  return {
    begin(ctx: CanvasRenderingContext2D, p: StrokePoint) {
      last = p;
      lastMid = { x: p.x, y: p.y };
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      // Punkt beim reinen Antippen
      ctx.beginPath();
      ctx.arc(p.x, p.y, width(p, p) / 2, 0, Math.PI * 2);
      ctx.fill();
    },
    move(ctx: CanvasRenderingContext2D, p: StrokePoint) {
      if (!last || !lastMid) return;
      const mid = { x: (last.x + p.x) / 2, y: (last.y + p.y) / 2 };
      ctx.lineWidth = width(last, p);
      ctx.beginPath();
      ctx.moveTo(lastMid.x, lastMid.y);
      ctx.quadraticCurveTo(last.x, last.y, mid.x, mid.y);
      ctx.stroke();
      last = p;
      lastMid = mid;
    },
    end(ctx: CanvasRenderingContext2D) {
      if (last && lastMid) {
        ctx.beginPath();
        ctx.moveTo(lastMid.x, lastMid.y);
        ctx.lineTo(last.x, last.y);
        ctx.stroke();
      }
      last = lastMid = null;
    },
  };
}
