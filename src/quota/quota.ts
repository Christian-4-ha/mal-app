const pad = (n: number) => String(n).padStart(2, '0');

/** Lokales Datum als Schlüssel, z. B. "2026-11-25" (Tageswechsel um Mitternacht). */
export function dayKey(d = new Date()): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function remainingSec(allowedMin: number, usedSec: number): number {
  return Math.max(0, allowedMin * 60 - usedSec);
}

/** Hinweise (Minuten vor Ende), deren Schwelle zwischen prev und now unterschritten wurde. */
export function crossedWarnings(prevRemainingSec: number, nowRemainingSec: number, warningsMin: number[]): number[] {
  return warningsMin
    .filter((m) => prevRemainingSec > m * 60 && nowRemainingSec <= m * 60)
    .sort((a, b) => b - a);
}
