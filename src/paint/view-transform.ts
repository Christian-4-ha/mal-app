export interface Pt {
  x: number;
  y: number;
}

/** Bildschirm = Leinwand * scale + t (in CSS-Pixeln der Malfläche). */
export interface View {
  scale: number;
  tx: number;
  ty: number;
}

export const IDENTITY: View = Object.freeze({ scale: 1, tx: 0, ty: 0 });
export const MIN_SCALE = 1;
export const MAX_SCALE = 4;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const mid = (a: Pt, b: Pt): Pt => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);

export function screenToCanvas(v: View, x: number, y: number): Pt {
  return { x: (x - v.tx) / v.scale, y: (y - v.ty) / v.scale };
}

/** Skaliert um den Fingermittelpunkt, verschiebt um dessen Bewegung, hält die Leinwand im Bildbereich. */
export function pinch(v: View, prev: [Pt, Pt], next: [Pt, Pt], bounds: { w: number; h: number }): View {
  const c0 = mid(prev[0], prev[1]);
  const c1 = mid(next[0], next[1]);
  const d0 = dist(prev[0], prev[1]);
  const k = d0 > 0 ? dist(next[0], next[1]) / d0 : 1;
  const scale = clamp(v.scale * k, MIN_SCALE, MAX_SCALE);
  const p = screenToCanvas(v, c0.x, c0.y);
  const tx = clamp(c1.x - p.x * scale, bounds.w - bounds.w * scale, 0);
  const ty = clamp(c1.y - p.y * scale, bounds.h - bounds.h * scale, 0);
  return { scale, tx: tx + 0, ty: ty + 0 }; // +0 normalisiert -0
}
