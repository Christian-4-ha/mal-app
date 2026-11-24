export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Erweitert r so, dass der Kreis um (x, y) mit Radius pad darin liegt. */
export function growRect(r: Rect | null, x: number, y: number, pad: number): Rect {
  const x0 = x - pad;
  const y0 = y - pad;
  const x1 = x + pad;
  const y1 = y + pad;
  if (!r) return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  const nx = Math.min(r.x, x0);
  const ny = Math.min(r.y, y0);
  return { x: nx, y: ny, w: Math.max(r.x + r.w, x1) - nx, h: Math.max(r.y + r.h, y1) - ny };
}

/** Schneidet auf die Leinwand zu (ganzzahlig, nach außen gerundet); null bei leerer Schnittmenge. */
export function clampRect(r: Rect, width: number, height: number): Rect | null {
  const x0 = Math.max(0, Math.floor(r.x));
  const y0 = Math.max(0, Math.floor(r.y));
  const x1 = Math.min(width, Math.ceil(r.x + r.w));
  const y1 = Math.min(height, Math.ceil(r.y + r.h));
  if (x1 <= x0 || y1 <= y0) return null;
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}
