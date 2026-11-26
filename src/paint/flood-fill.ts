type RGBA = [number, number, number, number];

/** Größte Kanalabweichung. */
function diff(d: Uint8ClampedArray, i: number, c: RGBA): number {
  return Math.max(Math.abs(d[i] - c[0]), Math.abs(d[i + 1] - c[1]), Math.abs(d[i + 2] - c[2]), Math.abs(d[i + 3] - c[3]));
}

/** Größe, bis zu der eingeschlossene Fremdpixel (Glitzerfunken, Schimmer) zur Fläche zählen. */
const MAX_HOLE = 400;

/**
 * Fläche ab (x, y) mit Toleranz gegenüber der Startfarbe, als Maske (1 = färben).
 * Enthält zusätzlich einen 1-px-Saum (halbtransparente oder der Startfarbe ähnliche Kantenpixel,
 * volle Linien bleiben erhalten) und kleine, ganz von der Fläche umschlossene Löcher
 * (z. B. die Funken einer Glitzerfläche). count = Pixel der eigentlichen Fläche.
 */
export function floodMask(img: ImageData, x: number, y: number, tolerance = 32): { mask: Uint8Array; count: number } | null {
  const { width: w, height: h, data: d } = img;
  x = Math.floor(x);
  y = Math.floor(y);
  if (x < 0 || y < 0 || x >= w || y >= h) return null;
  const s = (y * w + x) * 4;
  const start: RGBA = [d[s], d[s + 1], d[s + 2], d[s + 3]];

  const inRegion = new Uint8Array(w * h);
  const matches = (p: number) => !inRegion[p] && diff(d, p * 4, start) <= tolerance;
  const stack: number[] = [y * w + x];
  let count = 0;
  let x0 = x, x1 = x, y0 = y, y1 = y;
  while (stack.length) {
    const p = stack.pop()!;
    if (!matches(p)) continue;
    const row = Math.floor(p / w);
    if (row < y0) y0 = row;
    if (row > y1) y1 = row;
    let l = p;
    while (l % w > 0 && matches(l - 1)) l--;
    let r = p;
    while (r % w < w - 1 && matches(r + 1)) r++;
    if (l % w < x0) x0 = l % w;
    if (r % w > x1) x1 = r % w;
    for (let q = l; q <= r; q++) {
      inRegion[q] = 1;
      count++;
      if (row > 0 && matches(q - w)) stack.push(q - w);
      if (row < h - 1 && matches(q + w)) stack.push(q + w);
    }
  }

  // Saum (Antialiasing-Kanten)
  const mask = new Uint8Array(inRegion);
  for (let p = 0; p < w * h; p++) {
    if (inRegion[p]) continue;
    const px = p % w;
    const near =
      (px > 0 && inRegion[p - 1]) ||
      (px < w - 1 && inRegion[p + 1]) ||
      (p >= w && inRegion[p - w]) ||
      (p < w * (h - 1) && inRegion[p + w]);
    if (near && (d[p * 4 + 3] < 255 || diff(d, p * 4, start) <= 128)) mask[p] = 1;
  }

  // Kleine Löcher: Gruppen von Pixeln außerhalb der Fläche, die klein sind und ganz in ihr liegen
  // (gesucht nur im Rechteck um die Fläche; wer es verlässt, ist kein Loch)
  const seen = new Uint8Array(w * h);
  const group: number[] = [];
  const todo: number[] = [];
  for (let yy = y0; yy <= y1; yy++)
  for (let xx = x0; xx <= x1; xx++) {
    const p0 = yy * w + xx;
    if (inRegion[p0] || seen[p0]) continue;
    group.length = 0;
    seen[p0] = 1;
    todo.push(p0);
    let border = false;
    let size = 0;
    while (todo.length) {
      const p = todo.pop()!;
      size++;
      if (size <= MAX_HOLE) group.push(p);
      const px = p % w;
      const py = (p - px) / w;
      const visit = (q: number) => {
        const qx = q % w;
        const qy = (q - qx) / w;
        if (qx < x0 || qx > x1 || qy < y0 || qy > y1) {
          border = true; // führt aus der Fläche hinaus: kein Loch
          return;
        }
        if (!inRegion[q] && !seen[q]) {
          seen[q] = 1;
          todo.push(q);
        }
      };
      if (px > 0) visit(p - 1);
      if (px < w - 1) visit(p + 1);
      if (p >= w) visit(p - w);
      if (p < w * (h - 1)) visit(p + w);
    }
    if (!border && size <= MAX_HOLE) for (const p of group) mask[p] = 1;
  }
  return { mask, count };
}

/** Färbt alle Pixel der Maske. */
export function paintMask(target: ImageData, mask: Uint8Array, rgba: RGBA): void {
  const d = target.data;
  for (let p = 0; p < mask.length; p++) if (mask[p]) d.set(rgba, p * 4);
}

/**
 * Scanline-Füllung ab (x, y) mit Toleranz gegenüber der Startfarbe (Fläche siehe floodMask).
 * Gibt die Anzahl der Pixel der eigentlichen Fläche zurück; 0, wenn der Startpunkt schon die Farbe hat.
 */
export function floodFill(img: ImageData, x: number, y: number, rgba: RGBA, tolerance = 32): number {
  const { width: w, height: h, data: d } = img;
  if (x < 0 || y < 0 || x >= w || y >= h) return 0;
  if (diff(d, (Math.floor(y) * w + Math.floor(x)) * 4, rgba) === 0) return 0;
  const r = floodMask(img, x, y, tolerance);
  if (!r) return 0;
  paintMask(img, r.mask, rgba);
  return r.count;
}

/**
 * Fläche einer Vorlage: zusammenhängende Pixel mit geringer Deckkraft (keine Linie) ab (x, y).
 * null, wenn der Startpunkt auf einer Linie oder außerhalb liegt.
 */
export function floodRegion(lines: ImageData, x: number, y: number, alphaLimit = 128): Uint8Array | null {
  const { width: w, height: h, data: d } = lines;
  x = Math.floor(x);
  y = Math.floor(y);
  if (x < 0 || y < 0 || x >= w || y >= h) return null;
  const open = (p: number) => d[p * 4 + 3] <= alphaLimit;
  if (!open(y * w + x)) return null;
  const mask = new Uint8Array(w * h);
  const stack = [y * w + x];
  while (stack.length) {
    const p = stack.pop()!;
    if (mask[p] || !open(p)) continue;
    let l = p;
    while (l % w > 0 && !mask[l - 1] && open(l - 1)) l--;
    let r = p;
    while (r % w < w - 1 && !mask[r + 1] && open(r + 1)) r++;
    const row = Math.floor(p / w);
    for (let q = l; q <= r; q++) {
      mask[q] = 1;
      if (row > 0 && !mask[q - w] && open(q - w)) stack.push(q - w);
      if (row < h - 1 && !mask[q + w] && open(q + w)) stack.push(q + w);
    }
  }
  return mask;
}

/** Maske um n Pixel erweitert (die Ränder liegen unter den Vorlagenlinien). */
export function dilateMask(mask: Uint8Array, w: number, h: number, n = 2): Uint8Array {
  let m = mask;
  for (let i = 0; i < n; i++) {
    const next = new Uint8Array(m);
    for (let p = 0; p < w * h; p++) {
      if (m[p]) continue;
      const px = p % w;
      if ((px > 0 && m[p - 1]) || (px < w - 1 && m[p + 1]) || (p >= w && m[p - w]) || (p < w * (h - 1) && m[p + w])) next[p] = 1;
    }
    m = next;
  }
  return m;
}

/** Färbt die Maske, um `dilate` Pixel erweitert. */
export function fillMask(target: ImageData, mask: Uint8Array, rgba: RGBA, dilate = 2): void {
  paintMask(target, dilateMask(mask, target.width, target.height, dilate), rgba);
}
