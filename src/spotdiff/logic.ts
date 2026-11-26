// Fehler finden: Wann gilt ein Unterschied als eingekreist?

export interface Pt {
  x: number;
  y: number;
}

export interface DiffSpot {
  x: number;
  y: number;
  /** Radius des Unterschieds (Bildkoordinaten 800 × 600) */
  r: number;
}

/** Größte Fläche eines Kreises, der noch zählt (damit nicht das halbe Bild eingekreist werden kann). */
const MAX_AREA = 200 * 200;

function inside(p: Pt, poly: Pt[]): boolean {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i];
    const b = poly[j];
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) hit = !hit;
  }
  return hit;
}

function area(poly: Pt[]): number {
  let s = 0;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) s += (poly[j].x + poly[i].x) * (poly[j].y - poly[i].y);
  return Math.abs(s / 2);
}

/**
 * Indizes der Unterschiede, deren Mitte im (automatisch geschlossenen) Fingerkreis liegt.
 * Schon gefundene, zu kleine (Strich, Tippen) und riesige Kreise zählen nicht.
 */
export function circledDiffs(stroke: Pt[], diffs: DiffSpot[], found: number[]): number[] {
  if (stroke.length < 6) return [];
  const a = area(stroke);
  if (a < 400 || a > MAX_AREA) return [];
  return diffs.map((d, i) => (!found.includes(i) && inside(d, stroke) ? i : -1)).filter((i) => i >= 0);
}
