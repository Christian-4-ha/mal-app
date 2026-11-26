import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { DOT_PICTURES, labelPos, templateIdOf, templateSvg } from './pictures';

describe('Punkte-Vorlagen', () => {
  it('fünf Bilder mit 10–22 Punkten, alle auf dem Blatt und verschieden', () => {
    expect(DOT_PICTURES).toHaveLength(5);
    for (const pic of DOT_PICTURES) {
      expect(pic.points.length).toBeGreaterThanOrEqual(10);
      expect(pic.points.length).toBeLessThanOrEqual(22);
      for (const [x, y] of pic.points) {
        expect(x).toBeGreaterThan(30);
        expect(x).toBeLessThan(770);
        expect(y).toBeGreaterThan(30);
        expect(y).toBeLessThan(570);
      }
      const keys = new Set(pic.points.map((p) => p.join()));
      expect(keys.size).toBe(pic.points.length);
    }
  });

  it('Punkte liegen weit genug auseinander und Zahlen nicht auf fremden Punkten', () => {
    for (const pic of DOT_PICTURES)
      pic.points.forEach(([x, y], i) => {
        const [lx, ly] = labelPos(pic, i);
        pic.points.forEach(([qx, qy], j) => {
          if (i === j) return;
          expect(Math.hypot(x - qx, y - qy), `${pic.id} ${i + 1}/${j + 1}`).toBeGreaterThan(38);
          expect(Math.hypot(lx - qx, ly - 8 - qy), `${pic.id} Zahl ${i + 1} bei Punkt ${j + 1}`).toBeGreaterThan(18);
        });
      });
  });

  it('Ausmalvorlagen im Ordner public/templates/punkte passen zu den Daten', () => {
    for (const pic of DOT_PICTURES) {
      const file = readFileSync(`public/templates/punkte/${pic.id}.svg`, 'utf8');
      expect(file).toBe(templateSvg(pic));
    }
    const catalog = JSON.parse(readFileSync('public/templates/catalog.json', 'utf8'));
    for (const pic of DOT_PICTURES)
      expect(catalog.templates).toContainEqual(
        expect.objectContaining({ id: templateIdOf(pic), theme: 'punkte', file: `punkte/${pic.id}.svg`, hidden: true }),
      );
  });
});
