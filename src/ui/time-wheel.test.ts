import { describe, expect, it } from 'vitest';
import { wheelValue } from './time-wheel';

describe('wheelValue', () => {
  it('Minuten in 5er-Schritten, nach oben ziehen = mehr', () => {
    expect(wheelValue(30, -40, { min: 0, max: 55, step: 5 })).toBe(35);
    expect(wheelValue(30, 80, { min: 0, max: 55, step: 5 })).toBe(20);
  });
  it('begrenzt auf min/max', () => {
    expect(wheelValue(50, -400, { min: 0, max: 55, step: 5 })).toBe(55);
    expect(wheelValue(1, 400, { min: 0, max: 23, step: 1 })).toBe(0);
  });
});
