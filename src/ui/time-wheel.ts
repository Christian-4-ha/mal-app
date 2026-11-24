export interface WheelRange {
  min: number;
  max: number;
  step: number;
}

const PX_PER_STEP = 40;

/** Wert aus vertikaler Ziehbewegung: nach oben (dy < 0) = mehr; in Schritten, begrenzt. */
export function wheelValue(start: number, dy: number, r: WheelRange): number {
  const steps = Math.round(-dy / PX_PER_STEP);
  return Math.min(r.max, Math.max(r.min, start + steps * r.step));
}
