/** Strichdicke aus horizontaler Ziehbewegung: links größer, rechts kleiner, exponentiell (je weiter, desto stärker). */
export function sizeFromDrag(start: number, dx: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, start * 2 ** (-dx / 120)));
}

/** Strichdicke in Leinwandpixeln: bleibt beim Zoomen auf dem Bildschirm gleich dick. */
export function strokeWidthOnCanvas(size: number, ratio: number, scale: number): number {
  return (size * ratio) / scale;
}
