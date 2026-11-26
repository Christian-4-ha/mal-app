import { describe, expect, it } from 'vitest';
import { circledDiffs } from './logic';

const ring = (cx: number, cy: number, r: number, open = 0) =>
  Array.from({ length: 40 - open }, (_, i) => {
    const a = (i / 40) * Math.PI * 2;
    return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r };
  });

const diffs = [
  { x: 100, y: 100, r: 40 },
  { x: 400, y: 300, r: 40 },
  { x: 650, y: 450, r: 40 },
];

describe('circledDiffs', () => {
  it('ein Kreis um einen Unterschied trifft genau diesen', () => {
    expect(circledDiffs(ring(400, 300, 60), diffs, [])).toEqual([1]);
  });

  it('auch ein nicht ganz geschlossener Kreis zählt', () => {
    expect(circledDiffs(ring(100, 100, 55, 8), diffs, [])).toEqual([0]);
  });

  it('daneben eingekreist zählt nicht, schon gefundene zählen nicht doppelt', () => {
    expect(circledDiffs(ring(250, 450, 60), diffs, [])).toEqual([]);
    expect(circledDiffs(ring(400, 300, 60), diffs, [1])).toEqual([]);
  });

  it('ein riesiger Kreis über das halbe Bild zählt nicht (kein Schummeln)', () => {
    expect(circledDiffs(ring(400, 300, 380), diffs, [])).toEqual([]);
  });

  it('ein Strich oder Tippen ist kein Einkreisen', () => {
    expect(circledDiffs([{ x: 390, y: 300 }, { x: 410, y: 300 }], diffs, [])).toEqual([]);
  });
});
