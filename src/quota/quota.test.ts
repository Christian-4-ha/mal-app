import { describe, expect, it } from 'vitest';
import { crossedWarnings, dayKey, remainingSec } from './quota';

describe('quota', () => {
  it('dayKey nutzt das lokale Datum', () => {
    expect(dayKey(new Date(2026, 10, 5, 23, 59))).toBe('2026-11-05');
    expect(dayKey(new Date(2026, 10, 6, 0, 1))).toBe('2026-11-06');
  });

  it('remainingSec wird nie negativ', () => {
    expect(remainingSec(30, 0)).toBe(1800);
    expect(remainingSec(30, 1790)).toBe(10);
    expect(remainingSec(30, 5000)).toBe(0);
    expect(remainingSec(0, 0)).toBe(0);
  });

  it('crossedWarnings meldet jeden Hinweis genau beim Unterschreiten', () => {
    expect(crossedWarnings(301, 299, [5, 1])).toEqual([5]);
    expect(crossedWarnings(299, 250, [5, 1])).toEqual([]);
    expect(crossedWarnings(61, 59, [5, 1])).toEqual([1]);
    expect(crossedWarnings(400, 30, [5, 1])).toEqual([5, 1]); // großer Sprung
    expect(crossedWarnings(100, 90, [])).toEqual([]);
  });
});
