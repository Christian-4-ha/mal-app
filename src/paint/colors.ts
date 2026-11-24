export const BASIC_COLORS: string[] = [
  '#e53935', '#fb8c00', '#fdd835', '#7cb342', '#2e7d32', '#00acc1', '#1e88e5',
  '#3949ab', '#8e24aa', '#ec407a', '#8d6e63', '#ffffff', '#9e9e9e', '#212121',
];

const hex2 = (v: number) => Math.round(v * 255).toString(16).padStart(2, '0');

export function hslToHex(h: number, s: number, l: number): string {
  const S = s / 100;
  const L = l / 100;
  const a = S * Math.min(L, 1 - L);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    return L - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  return '#' + hex2(f(0)) + hex2(f(8)) + hex2(f(4));
}

/** 10 Helligkeiten (90 % → 18 %) × 10 Farbtöne (0°, 36°, …, 324°) bei 85 % Sättigung, dazu eine Grau-Zeile. */
export function generatePalette(): string[][] {
  const rows: string[][] = [];
  for (let r = 0; r < 10; r++) {
    const l = 90 - (r * (90 - 18)) / 9;
    rows.push(Array.from({ length: 10 }, (_, c) => hslToHex(c * 36, 85, l)));
  }
  rows.push(Array.from({ length: 10 }, (_, i) => hslToHex(0, 0, 100 - (i * 100) / 9)));
  return rows;
}
