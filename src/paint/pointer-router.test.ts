import { describe, expect, it } from 'vitest';
import { createPointerRouter, type RouterEvent } from './pointer-router';

const ev = (kind: RouterEvent['kind'], id: number, type: RouterEvent['type'] = 'touch', x = 10, y = 10): RouterEvent => ({
  kind,
  id,
  type,
  x,
  y,
});

describe('pointer router', () => {
  it('Zoom aus: zweiter Finger malt nicht', () => {
    const r = createPointerRouter(() => false);
    expect(r(ev('down', 1)).do).toBe('strokeStart');
    expect(r(ev('down', 2)).do).toBe('none');
    expect(r(ev('move', 2)).do).toBe('none');
    expect(r(ev('move', 1)).do).toBe('strokeMove');
    expect(r(ev('up', 2)).do).toBe('none');
    expect(r(ev('up', 1)).do).toBe('strokeEnd');
  });

  it('Zoom an: zweiter Finger bricht Strich ab und startet Geste', () => {
    const r = createPointerRouter(() => true);
    r(ev('down', 1));
    expect(r(ev('down', 2)).do).toBe('strokeAbort');
    expect(r(ev('move', 1)).do).toBe('gesture');
    expect(r(ev('up', 1)).do).toBe('none');
    expect(r(ev('down', 3)).do).toBe('none'); // Geste läuft noch
    r(ev('up', 2));
    expect(r(ev('up', 3)).do).toBe('gestureEnd');
    expect(r(ev('down', 4)).do).toBe('strokeStart');
  });

  it('Geste liefert die Positionen beider Finger', () => {
    const r = createPointerRouter(() => true);
    r(ev('down', 1, 'touch', 0, 0));
    r(ev('down', 2, 'touch', 100, 0));
    const a = r(ev('move', 2, 'touch', 120, 0));
    expect(a).toEqual({ do: 'gesture', points: [{ x: 0, y: 0 }, { x: 120, y: 0 }] });
  });

  it('Stift aktiv: Touch ignoriert', () => {
    const r = createPointerRouter(() => true);
    expect(r(ev('down', 1, 'pen')).do).toBe('strokeStart');
    expect(r(ev('down', 2, 'touch')).do).toBe('none');
    expect(r(ev('move', 1, 'pen')).do).toBe('strokeMove');
    expect(r(ev('up', 1, 'pen')).do).toBe('strokeEnd');
  });

  it('cancel des malenden Zeigers beendet den Strich', () => {
    const r = createPointerRouter(() => false);
    r(ev('down', 1));
    expect(r(ev('cancel', 1)).do).toBe('strokeEnd');
    expect(r(ev('down', 2)).do).toBe('strokeStart');
  });

  it('Zoom aus: nach Loslassen aller Finger startet ein neuer Strich', () => {
    const r = createPointerRouter(() => false);
    r(ev('down', 1));
    r(ev('down', 2));
    r(ev('up', 1));
    expect(r(ev('down', 3)).do).toBe('none'); // Finger 2 liegt noch (z. B. Handballen)
    r(ev('up', 2));
    expect(r(ev('down', 3)).do).toBe('strokeStart');
  });
});
