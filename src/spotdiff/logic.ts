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

/**
 * Umlaufzahl des (automatisch geschlossenen) Fingerwegs um p: ≠ 0 heißt eingekreist,
 * auch wenn das Kind zweimal herumfährt.
 */
function winding(p: Pt, poly: Pt[]): number {
  let wn = 0;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const side = (b.x - a.x) * (p.y - a.y) - (p.x - a.x) * (b.y - a.y);
    if (a.y <= p.y) {
      if (b.y > p.y && side > 0) wn++;
    } else if (b.y <= p.y && side < 0) wn--;
  }
  return wn;
}

/**
 * Indizes der Unterschiede, deren Mitte vom Fingerweg umrundet wird.
 * Nicht gezählt: schon gefundene, Striche/Tippen (zu klein) und Kreise, die viel größer als der
 * Unterschied sind (kein Einkreisen des halben Bildes).
 */
export function circledDiffs(stroke: Pt[], diffs: DiffSpot[], found: number[]): number[] {
  if (stroke.length < 6) return [];
  const xs = stroke.map((p) => p.x);
  const ys = stroke.map((p) => p.y);
  const size = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
  if (Math.min(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) < 20) return [];
  return diffs
    .map((d, i) => (!found.includes(i) && size <= Math.max(5 * d.r, 260) && winding(d, stroke) !== 0 ? i : -1))
    .filter((i) => i >= 0);
}
