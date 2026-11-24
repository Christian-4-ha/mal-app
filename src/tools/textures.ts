/** Prozedural erzeugte 64×64-Texturkacheln je Farbe und Oberfläche (gecacht). */
const SIZE = 64;
const cache = new Map<string, HTMLCanvasElement>();

// Fester Zufall, damit Kacheln stabil aussehen
function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 2 ** 32;
  };
}

export function textureTile(color: string, variant: string): HTMLCanvasElement {
  const key = color + '|' + variant;
  const hit = cache.get(key);
  if (hit) return hit;
  const c = document.createElement('canvas');
  c.width = c.height = SIZE;
  const ctx = c.getContext('2d')!;
  const r = rng(variant.length * 97 + 7);
  ctx.fillStyle = color;

  if (variant === 'crayon') {
    // Wachsmalstift: dichte Körnung mit Lücken
    for (let i = 0; i < 1400; i++) {
      ctx.globalAlpha = 0.5 + r() * 0.5;
      ctx.fillRect(r() * SIZE, r() * SIZE, 1 + r() * 2, 1 + r());
    }
  } else if (variant === 'chalk') {
    // Kreide: lockere, helle Körnung
    ctx.globalAlpha = 0.35;
    ctx.fillRect(0, 0, SIZE, SIZE);
    for (let i = 0; i < 500; i++) {
      ctx.globalAlpha = 0.4 + r() * 0.6;
      ctx.fillRect(r() * SIZE, r() * SIZE, 1 + r() * 3, 1);
    }
  } else if (variant === 'fabric') {
    // Stoff: Kreuzgewebe
    ctx.fillRect(0, 0, SIZE, SIZE);
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = '#fff';
    for (let i = 0; i < SIZE; i += 4) {
      ctx.fillRect(i, 0, 1, SIZE);
      ctx.fillRect(0, i + 2, SIZE, 1);
    }
  } else {
    // Glitzer: Grundfarbe mit hellen Funken
    ctx.fillRect(0, 0, SIZE, SIZE);
    for (let i = 0; i < 70; i++) {
      ctx.globalAlpha = 0.5 + r() * 0.5;
      ctx.fillStyle = r() > 0.5 ? '#ffffff' : '#fff59d';
      const s = 1 + r() * 2;
      ctx.fillRect(r() * SIZE, r() * SIZE, s, s);
    }
  }
  cache.set(key, c);
  return c;
}
