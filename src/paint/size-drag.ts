/** Strichdicke aus horizontaler Ziehbewegung: links größer, rechts kleiner, exponentiell (je weiter, desto stärker). */
export function sizeFromDrag(start: number, dx: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, start * 2 ** (-dx / 120)));
}
