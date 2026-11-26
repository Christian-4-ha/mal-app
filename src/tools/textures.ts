import { addSparkles } from './glitter';

/** Prozedural erzeugte 96×96-Musterkacheln je Farbe und Muster (gecacht). */
const SIZE = 96;
const cache = new Map<string, HTMLCanvasElement>();

// Fester Zufall, damit Kacheln stabil aussehen
function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 2 ** 32;
  };
}

/** Musterkachel mit Glitzerfunken (für Glitzerfarben). */
export function sparkledTile(color: string, variant: string): HTMLCanvasElement {
  const key = color + '|' + variant + '|glitter';
  const hit = cache.get(key);
  if (hit) return hit;
  const c = document.createElement('canvas');
  c.width = c.height = SIZE;
  const ctx = c.getContext('2d')!;
  ctx.drawImage(textureTile(color, variant), 0, 0);
  const img = ctx.getImageData(0, 0, SIZE, SIZE);
  addSparkles(img);
  ctx.putImageData(img, 0, 0);
  cache.set(key, c);
  return c;
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
    // Wachsmalstift: kräftige Farbe mit schrägen, hellen Rillen und Lücken
    ctx.fillRect(0, 0, SIZE, SIZE);
    ctx.globalCompositeOperation = 'destination-out';
    for (let k = -SIZE; k < SIZE * 2; k += 6) {
      ctx.globalAlpha = 0.35 + r() * 0.5;
      ctx.lineWidth = 1.5 + r() * 2;
      ctx.beginPath();
      // diagonal, nahtlos über die Kachelkanten
      ctx.moveTo(k, 0);
      ctx.lineTo(k - SIZE, SIZE);
      ctx.strokeStyle = '#000';
      ctx.stroke();
    }
    for (let i = 0; i < 160; i++) {
      ctx.globalAlpha = 0.9;
      ctx.fillRect(r() * SIZE, r() * SIZE, 2 + r() * 4, 1 + r() * 2);
    }
  } else if (variant === 'chalk') {
    // Kreide: heller, staubig, mit vielen Löchern
    ctx.globalAlpha = 0.75;
    ctx.fillRect(0, 0, SIZE, SIZE);
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, SIZE, SIZE);
    ctx.globalCompositeOperation = 'destination-out';
    ctx.globalAlpha = 1;
    for (let i = 0; i < 900; i++) ctx.fillRect(r() * SIZE, r() * SIZE, 1 + r() * 3, 1 + r() * 2);
  } else if (variant === 'stripes') {
    // Streifen: Farbe mit breiten, schrägen weißen Streifen
    ctx.fillRect(0, 0, SIZE, SIZE);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 9;
    for (let k = -SIZE; k <= SIZE * 2; k += 24) {
      ctx.beginPath();
      ctx.moveTo(k, 0);
      ctx.lineTo(k - SIZE, SIZE);
      ctx.stroke();
    }
  } else if (variant === 'dots') {
    // Punkte: Farbe mit großen weißen Tupfen im Versatz
    ctx.fillRect(0, 0, SIZE, SIZE);
    ctx.fillStyle = '#fff';
    for (let y = 0; y <= SIZE; y += 24)
      for (let x = 0; x <= SIZE; x += 24) {
        const ox = (y / 24) % 2 ? 12 : 0;
        ctx.beginPath();
        ctx.arc(x + ox, y, 6, 0, Math.PI * 2);
        ctx.fill();
      }
  } else {
    // Karo (Stoff): helle Fläche, kräftige Balken quer und längs, feine weiße Fäden
    ctx.globalAlpha = 0.4;
    ctx.fillRect(0, 0, SIZE, SIZE);
    ctx.globalAlpha = 0.65;
    for (let k = 0; k < SIZE; k += 24) {
      ctx.fillRect(0, k, SIZE, 10);
      ctx.fillRect(k, 0, 10, SIZE);
    }
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = '#fff';
    for (let k = 17; k < SIZE; k += 24) {
      ctx.fillRect(0, k, SIZE, 2);
      ctx.fillRect(k, 0, 2, SIZE);
    }
  }
  cache.set(key, c);
  return c;
}
