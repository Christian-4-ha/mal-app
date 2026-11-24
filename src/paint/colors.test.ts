import { describe, expect, it } from 'vitest';
import { BASIC_COLORS } from './colors';

describe('colors', () => {
  it('genau 14 Grundfarben, alle gültiges Hex', () => {
    expect(BASIC_COLORS).toHaveLength(14);
    BASIC_COLORS.forEach((c) => expect(c).toMatch(/^#[0-9a-f]{6}$/));
    expect(new Set(BASIC_COLORS).size).toBe(14);
  });
});
