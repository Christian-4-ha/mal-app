import { describe, expect, it } from 'vitest';
import { parseCatalog } from './catalog';

describe('parseCatalog', () => {
  it('liest Themen und Vorlagen, Themen-Symbol = erste Vorlage', () => {
    const c = parseCatalog({
      themes: [{ id: 'tiere' }, { id: 'meer' }],
      templates: [
        { id: 'katze', theme: 'tiere', file: 'tiere/katze.svg' },
        { id: 'hund', theme: 'tiere', file: 'tiere/hund.svg' },
      ],
    });
    expect(c.themes.map((t) => t.id)).toEqual(['tiere']); // meer hat keine Vorlagen
    expect(c.themes[0].icon).toBe('tiere/katze.svg');
    expect(c.templates.map((t) => t.id)).toEqual(['katze', 'hund']);
  });

  it('verwirft fehlerhafte Einträge und doppelte IDs', () => {
    const c = parseCatalog({
      themes: [{ id: 'tiere' }, { nope: 1 }],
      templates: [
        { id: 'a', theme: 'tiere', file: 'tiere/a.svg' },
        { id: 'a', theme: 'tiere', file: 'tiere/a2.svg' },
        { id: 'b', theme: 'gibtsnicht', file: 'x.svg' },
        { id: 'c', theme: 'tiere' },
        { id: 'd', theme: 'tiere', file: '../boese.svg' },
      ],
    });
    expect(c.templates.map((t) => t.id)).toEqual(['a']);
  });

  it('übersteht Unsinn', () => {
    expect(parseCatalog(null).themes).toEqual([]);
    expect(parseCatalog({ themes: 'x' }).templates).toEqual([]);
  });
});
