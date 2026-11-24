import { describe, expect, it } from 'vitest';
import { createHistory } from './history';
import { sizeFromDrag } from './size-drag';

describe('history', () => {
  it('hält maximal 20 Zustände', () => {
    const h = createHistory<number>();
    for (let i = 1; i <= 25; i++) h.push(i);
    const got: number[] = [];
    for (let i = 0; i < 20; i++) got.push(h.undo()!);
    expect(got[0]).toBe(25);
    expect(got[19]).toBe(6);
    expect(h.undo()).toBeUndefined();
    expect(h.canUndo()).toBe(false);
  });

  it('clear leert den Verlauf', () => {
    const h = createHistory<number>(5);
    h.push(1);
    expect(h.canUndo()).toBe(true);
    h.clear();
    expect(h.canUndo()).toBe(false);
  });
});

describe('sizeFromDrag', () => {
  it('links größer, rechts kleiner, begrenzt', () => {
    expect(sizeFromDrag(10, -120, 1, 80)).toBe(20);
    expect(sizeFromDrag(10, 120, 1, 80)).toBe(5);
    expect(sizeFromDrag(10, -2000, 1, 80)).toBe(80);
    expect(sizeFromDrag(10, 2000, 1, 80)).toBe(1);
    expect(sizeFromDrag(10, 0, 1, 80)).toBe(10);
  });
});
