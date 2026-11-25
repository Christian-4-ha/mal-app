import type { Rect } from './rect';

/** Affine Matrix wie bei CanvasRenderingContext2D.setTransform(a, b, c, d, e, f). */
export type Mat = [number, number, number, number, number, number];

/**
 * Spiegelungen für ein Mandala mit n Achsen durch (cx, cy): n Drehungen, jede zusätzlich gespiegelt
 * (2n Matrizen, die erste ist die Identität). Bei 1 Achse ist die Achse senkrecht (links ↔ rechts).
 */
export function symmetryMatrices(n: number, cx: number, cy: number): Mat[] {
  const out: Mat[] = [];
  for (const mirror of [false, true]) {
    for (let k = 0; k < n; k++) {
      const a = (2 * Math.PI * k) / n;
      const cos = Math.cos(a);
      const sin = Math.sin(a);
      const s = mirror ? -1 : 1;
      // M = T(c) · R(a) · S(s, 1) · T(-c)
      const ma = cos * s;
      const mb = sin * s;
      const mc = -sin;
      const md = cos;
      out.push([ma, mb, mc, md, cx - ma * cx - mc * cy, cy - mb * cx - md * cy]);
    }
  }
  return out;
}

export function applyMat(m: Mat, x: number, y: number): { x: number; y: number } {
  return { x: m[0] * x + m[2] * y + m[4], y: m[1] * x + m[3] * y + m[5] };
}

/** Achsenparalleles Rechteck, das das transformierte Rechteck umschließt. */
export function matBounds(m: Mat, r: Rect): Rect {
  const pts = [
    applyMat(m, r.x, r.y),
    applyMat(m, r.x + r.w, r.y),
    applyMat(m, r.x, r.y + r.h),
    applyMat(m, r.x + r.w, r.y + r.h),
  ];
  const x0 = Math.floor(Math.min(...pts.map((p) => p.x)));
  const y0 = Math.floor(Math.min(...pts.map((p) => p.y)));
  const x1 = Math.ceil(Math.max(...pts.map((p) => p.x)));
  const y1 = Math.ceil(Math.max(...pts.map((p) => p.y)));
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

export function unionRect(a: Rect | null, b: Rect): Rect {
  if (!a) return { ...b };
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  return { x, y, w: Math.max(a.x + a.w, b.x + b.w) - x, h: Math.max(a.y + a.h, b.y + b.h) - y };
}

/** Achsenzahl eines Mandala-Modus („mandala-3“ → 3), sonst 0. */
export function mandalaAxes(modeId: string): number {
  const m = /^mandala-([1-5])$/.exec(modeId);
  return m ? Number(m[1]) : 0;
}
