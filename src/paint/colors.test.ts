import { describe, expect, it } from 'vitest';
import { BASIC_COLORS, generatePalette, hslToHex } from './colors';

describe('colors', () => {
  it('genau 14 Grundfarben, alle gültiges Hex', () => {
    expect(BASIC_COLORS).toHaveLength(14);
    BASIC_COLORS.forEach((c) => expect(c).toMatch(/^#[0-9a-f]{6}$/));
    expect(new Set(BASIC_COLORS).size).toBe(14);
  });

  it('Palette hat 110 eindeutige Farben in 11 Zeilen à 10', () => {
    const rows = generatePalette();
    expect(rows).toHaveLength(11);
    rows.forEach((r) => expect(r).toHaveLength(10));
    const all = rows.flat();
    expect(new Set(all).size).toBe(110);
    all.forEach((c) => expect(c).toMatch(/^#[0-9a-f]{6}$/));
  });

  it('letzte Zeile läuft von Weiß bis Schwarz', () => {
    const grey = generatePalette()[10];
    expect(grey[0]).toBe('#ffffff');
    expect(grey[9]).toBe('#000000');
  });

  it('hslToHex', () => {
    expect(hslToHex(0, 100, 50)).toBe('#ff0000');
    expect(hslToHex(120, 100, 25)).toBe('#008000');
    expect(hslToHex(240, 100, 50)).toBe('#0000ff');
  });
});
