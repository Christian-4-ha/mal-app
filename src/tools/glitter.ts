// Glitzerfarben wie Glitzerkleber: Grundfarbe mit hellen Funken, die fest im Bild stehen.
import type { ToolContext } from './types';

type RGB = [number, number, number];

const hexToRgba = (hex: string) => {
  const n = parseInt(hex.slice(1, 7), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 255];
};

/** Fester Zufallswert je 4×4-Block (gleiche Stelle = gleicher Funke, auch über Striche hinweg). */
function hash(bx: number, by: number): number {
  let h = (Math.imul(bx, 374761393) + Math.imul(by, 668265263)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** Anteil der 4×4-Blöcke mit Funke. */
const DENSITY = 0.11;

/** Stärke des Funkens an (x, y): 1 in der Blockmitte, 0,5 am Kreuz, sonst 0. */
function sparkle(x: number, y: number): { k: number; h: number } {
  const h = hash(x >> 2, y >> 2);
  if (h >= DENSITY) return { k: 0, h };
  const lx = x & 3;
  const ly = y & 3;
  const cx = lx === 1 || lx === 2;
  const cy = ly === 1 || ly === 2;
  return { k: cx && cy ? 1 : cx || cy ? 0.45 : 0, h };
}

/** Glitzer-Farbe an Leinwandpunkt (x, y): leicht schimmernde Grundfarbe mit hellen Funken. */
export function glitterRGB(base: RGB, x: number, y: number): RGB {
  const { k, h } = sparkle(x, y);
  if (k > 0) {
    // Funke: weiß oder hellgelb
    const tint = h < DENSITY / 2 ? [255, 255, 255] : [255, 248, 170];
    return [0, 1, 2].map((i) => Math.round(tint[i] * k * 0.9 + base[i] * (1 - k * 0.9))) as RGB;
  }
  // Schimmer je Block: Grundfarbe um bis zu ±9 % heller/dunkler
  const f = 0.91 + hash((x >> 2) + 7919, (y >> 2) + 104729) * 0.18;
  return base.map((v) => Math.min(255, Math.round(v * f))) as RGB;
}

interface Pixels {
  width: number;
  height: number;
  data: Uint8ClampedArray;
}

/** Eimer mit Glitzer: alle Pixel, die sich gegenüber `before` geändert haben, bekommen Glitzer (Deckkraft bleibt). */
export function sparkleImage(img: Pixels, before: Uint8ClampedArray, color: string): void {
  const base = hexToRgba(color).slice(0, 3) as RGB;
  const d = img.data;
  for (let y = 0; y < img.height; y++)
    for (let x = 0; x < img.width; x++) {
      const i = (y * img.width + x) * 4;
      if (d[i] === before[i] && d[i + 1] === before[i + 1] && d[i + 2] === before[i + 2] && d[i + 3] === before[i + 3])
        continue;
      const [r, g, b] = glitterRGB(base, x, y);
      d[i] = r;
      d[i + 1] = g;
      d[i + 2] = b;
    }
}

/** Setzt Funken auf sichtbare Pixel (z. B. Musterkacheln), ohne die übrige Struktur zu ändern. */
export function addSparkles(img: Pixels): void {
  const d = img.data;
  for (let y = 0; y < img.height; y++)
    for (let x = 0; x < img.width; x++) {
      const i = (y * img.width + x) * 4;
      if (!d[i + 3] || sparkle(x, y).k === 0) continue;
      const [r, g, b] = glitterRGB([d[i], d[i + 1], d[i + 2]], x, y);
      d[i] = r;
      d[i + 1] = g;
      d[i + 2] = b;
      d[i + 3] = Math.max(d[i + 3], 230);
    }
}

const TILE = 64;
const tiles = new Map<string, HTMLCanvasElement>();

/** 64×64-Kachel mit Glitzer in einer Farbe (Funken passen nahtlos an die Nachbarkacheln). */
export function glitterTile(color: string): HTMLCanvasElement {
  const hit = tiles.get(color);
  if (hit) return hit;
  const c = document.createElement('canvas');
  c.width = c.height = TILE;
  const ctx = c.getContext('2d')!;
  const img = ctx.createImageData(TILE, TILE);
  const base = hexToRgba(color).slice(0, 3) as RGB;
  for (let y = 0; y < TILE; y++)
    for (let x = 0; x < TILE; x++) {
      const i = (y * TILE + x) * 4;
      img.data.set([...glitterRGB(base, x, y), 255], i);
    }
  ctx.putImageData(img, 0, 0);
  tiles.set(color, c);
  return c;
}

/**
 * Füll-/Strichfarbe eines Werkzeugs: Glitzer-Muster oder einfache Farbe.
 * Das Muster liegt fest an der Leinwand, damit sich die Funken bei neuen Strichen nicht verschieben.
 */
export function paintStyle(c: ToolContext): string | CanvasPattern {
  if (!c.glitter) return c.color;
  return c.ctx.createPattern(glitterTile(c.color), 'repeat') ?? c.color;
}
