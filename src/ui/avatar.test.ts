import { describe, expect, it } from 'vitest';
import { cropRect } from './avatar';

describe('cropRect', () => {
  it('Querformat: mittiger Ausschnitt', () => {
    expect(cropRect(400, 300)).toEqual({ sx: 50, sy: 0, s: 300 });
  });
  it('Hochformat: mittiger Ausschnitt', () => {
    expect(cropRect(300, 400)).toEqual({ sx: 0, sy: 50, s: 300 });
  });
  it('Quadrat bleibt', () => {
    expect(cropRect(200, 200)).toEqual({ sx: 0, sy: 0, s: 200 });
  });
});
