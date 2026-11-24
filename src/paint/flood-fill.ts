type RGBA = [number, number, number, number];

/** Größte Kanalabweichung. */
function diff(d: Uint8ClampedArray, i: number, c: RGBA): number {
  return Math.max(Math.abs(d[i] - c[0]), Math.abs(d[i + 1] - c[1]), Math.abs(d[i + 2] - c[2]), Math.abs(d[i + 3] - c[3]));
}

/**
 * Scanline-Füllung ab (x, y) mit Toleranz gegenüber der Startfarbe.
 * Danach wird ein 1-px-Saum um die Fläche mitgefärbt, sofern er halbtransparent oder der Startfarbe
 * ähnlich ist (Antialiasing-Kanten) – volle Linien bleiben erhalten.
 * Gibt die Anzahl der Pixel der eigentlichen Fläche zurück.
 */
export function floodFill(img: ImageData, x: number, y: number, rgba: RGBA, tolerance = 32): number {
  const { width: w, height: h, data: d } = img;
  x = Math.floor(x);
  y = Math.floor(y);
  if (x < 0 || y < 0 || x >= w || y >= h) return 0;
  const s = (y * w + x) * 4;
  const start: RGBA = [d[s], d[s + 1], d[s + 2], d[s + 3]];
  if (diff(d, s, rgba) === 0) return 0;

  const inRegion = new Uint8Array(w * h);
  const matches = (p: number) => !inRegion[p] && diff(d, p * 4, start) <= tolerance;
  const stack: number[] = [y * w + x];
  let count = 0;

  while (stack.length) {
    const p = stack.pop()!;
    if (!matches(p)) continue;
    const row = Math.floor(p / w);
    let l = p;
    while (l % w > 0 && matches(l - 1)) l--;
    let r = p;
    while (r % w < w - 1 && matches(r + 1)) r++;
    for (let q = l; q <= r; q++) {
      inRegion[q] = 1;
      count++;
      if (row > 0 && matches(q - w)) stack.push(q - w);
      if (row < h - 1 && matches(q + w)) stack.push(q + w);
    }
  }

  // Saum bestimmen, bevor gefärbt wird
  const fringe: number[] = [];
  for (let p = 0; p < w * h; p++) {
    if (inRegion[p]) continue;
    const px = p % w;
    const near =
      (px > 0 && inRegion[p - 1]) ||
      (px < w - 1 && inRegion[p + 1]) ||
      (p >= w && inRegion[p - w]) ||
      (p < w * (h - 1) && inRegion[p + w]);
    if (near && (d[p * 4 + 3] < 255 || diff(d, p * 4, start) <= 128)) fringe.push(p);
  }

  for (let p = 0; p < w * h; p++) if (inRegion[p]) d.set(rgba, p * 4);
  for (const p of fringe) d.set(rgba, p * 4);
  return count;
}
