// Geometrie für Puzzleteile mit Nasen: Raster, Kantenrichtungen, Umrisspfad.

/** Wählbare Teilezahlen mit Raster (Spalten × Reihen, ungefähr 4:3). */
export const PIECE_COUNTS: { count: number; cols: number; rows: number }[] = [
  { count: 6, cols: 3, rows: 2 },
  { count: 12, cols: 4, rows: 3 },
  { count: 20, cols: 5, rows: 4 },
  { count: 35, cols: 7, rows: 5 },
  { count: 48, cols: 8, rows: 6 },
  { count: 70, cols: 10, rows: 7 },
  { count: 108, cols: 12, rows: 9 },
];

/** Richtung der Nase je Kante: +1 nach außen, -1 nach innen, 0 = gerader Rand. */
export interface PieceEdges {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/** Zufällige, zueinander passende Kanten für alle Teile (Index = reihe * cols + spalte). */
export function makeEdges(cols: number, rows: number, rnd: () => number = Math.random): PieceEdges[] {
  // h[r][c]: Kante unter Teil (r, c); v[r][c]: Kante rechts von Teil (r, c); Wert = Richtung für das obere/linke Teil
  const sign = () => (rnd() < 0.5 ? 1 : -1);
  const h = Array.from({ length: rows - 1 }, () => Array.from({ length: cols }, sign));
  const v = Array.from({ length: rows }, () => Array.from({ length: cols - 1 }, sign));
  const out: PieceEdges[] = [];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      out.push({
        top: r === 0 ? 0 : -h[r - 1][c],
        bottom: r === rows - 1 ? 0 : h[r][c],
        left: c === 0 ? 0 : -v[r][c - 1],
        right: c === cols - 1 ? 0 : v[r][c],
      });
  return out;
}

type Ctx = Pick<CanvasRenderingContext2D, 'moveTo' | 'lineTo' | 'bezierCurveTo' | 'closePath' | 'beginPath'>;

/** Eine Kante von (x0,y0) nach (x1,y1), Umlauf im Uhrzeigersinn; s = Nasenrichtung, h = Nasenhöhe. */
function edge(ctx: Ctx, x0: number, y0: number, x1: number, y1: number, s: number, h: number) {
  if (!s) return ctx.lineTo(x1, y1);
  const L = Math.hypot(x1 - x0, y1 - y0);
  const ux = (x1 - x0) / L;
  const uy = (y1 - y0) / L;
  // Normale nach außen bei Umlauf im Uhrzeigersinn (y nach unten)
  const nx = uy;
  const ny = -ux;
  const P = (t: number, k: number) => [x0 + ux * t * L + nx * k * s * h, y0 + uy * t * L + ny * k * s * h] as const;
  ctx.lineTo(...P(0.36, 0));
  ctx.bezierCurveTo(...P(0.4, 0), ...P(0.42, 0.4), ...P(0.38, 0.65));
  ctx.bezierCurveTo(...P(0.33, 1.05), ...P(0.67, 1.05), ...P(0.62, 0.65));
  ctx.bezierCurveTo(...P(0.58, 0.4), ...P(0.6, 0), ...P(0.64, 0));
  ctx.lineTo(x1, y1);
}

/** Umriss eines Teils mit Körper (x, y, w, h); Nasenhöhe tab. */
export function piecePath(ctx: Ctx, x: number, y: number, w: number, h: number, e: PieceEdges, tab: number): void {
  ctx.beginPath();
  ctx.moveTo(x, y);
  edge(ctx, x, y, x + w, y, e.top, tab);
  edge(ctx, x + w, y, x + w, y + h, e.right, tab);
  edge(ctx, x + w, y + h, x, y + h, e.bottom, tab);
  edge(ctx, x, y + h, x, y, e.left, tab);
  ctx.closePath();
}

/** Teil nah genug am richtigen Platz zum Einrasten? */
export const shouldSnap = (dx: number, dy: number, pieceW: number) => Math.hypot(dx, dy) < pieceW * 0.3;
