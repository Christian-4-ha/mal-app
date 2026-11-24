import { beforeEach, describe, expect, it } from 'vitest';
import { listModes, registerMode, resetModesForTest, type Mode } from './registry';
import { createTileRow } from '../ui/tile-row';

const m = (id: string, order: number): Mode => ({
  id,
  icon: '',
  order,
  open: () => ({ name: id, mount() {}, unmount() {} }),
});

describe('mode registry', () => {
  beforeEach(resetModesForTest);

  it('Galerie steht immer zuerst', () => {
    registerMode(m('free-paint', 10));
    registerMode({ ...m('gallery', 99), pinnedFirst: true });
    expect(listModes().map((x) => x.id)).toEqual(['gallery', 'free-paint']);
  });

  it('sortiert nach order', () => {
    registerMode(m('b', 20));
    registerMode(m('a', 10));
    expect(listModes().map((x) => x.id)).toEqual(['a', 'b']);
  });

  it('doppelte id wirft', () => {
    registerMode(m('a', 1));
    expect(() => registerMode(m('a', 2))).toThrow();
  });
});

describe('createTileRow', () => {
  it('erzeugt je Eintrag eine Kachel mit Tap-Handler', () => {
    let tapped = '';
    const items = Array.from({ length: 12 }, (_, i) => ({ id: 'k' + i, icon: '<svg></svg>', onTap: () => (tapped = 'k' + i) }));
    const row = createTileRow(items);
    const tiles = row.querySelectorAll<HTMLButtonElement>('[data-tile]');
    expect(tiles).toHaveLength(12);
    tiles[3].click();
    expect(tapped).toBe('k3');
    expect(row.classList.contains('tile-row')).toBe(true);
  });
});
