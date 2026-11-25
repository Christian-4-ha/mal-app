// Wandelt Generator-Bilder (PNG/JPG) in saubere Ausmal-Vorlagen (SVG, 4:3) um.
// Aufruf: node scripts/convert-templates.mjs <quellordner> <thema> [datei=id ...]
// Ohne Namenszuordnung wird der Dateiname klein geschrieben übernommen.
import Jimp from 'jimp';
import potrace from 'potrace';
import { readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, parse } from 'node:path';

const [src, theme, ...pairs] = process.argv.slice(2);
if (!src || !theme) throw new Error('Aufruf: convert-templates.mjs <quellordner> <thema> [datei=id]');
const W = 1600;
const H = 1200;
const names = Object.fromEntries(pairs.map((p) => p.split('=')));
const out = join('public/templates', theme);
mkdirSync(out, { recursive: true });

const trace = (buf) =>
  new Promise((res, rej) =>
    potrace.trace(buf, { threshold: 128, turdSize: 12, optTolerance: 0.4, color: '#000', background: 'transparent' }, (e, svg) =>
      e ? rej(e) : res(svg),
    ),
  );

for (const file of readdirSync(src).filter((f) => /\.(png|jpe?g)$/i.test(f))) {
  const id = names[file] ?? parse(file).name.toLowerCase().replace(/[^a-z0-9_-]/g, '');
  const img = await Jimp.read(join(src, file));
  img.contain(W, H).greyscale();
  // auf weißem Grund, schwarz-weiß
  const bg = new Jimp(W, H, 0xffffffff);
  bg.composite(img, 0, 0);
  const d = bg.bitmap.data;
  const ink = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) {
    const a = d[i * 4 + 3] / 255;
    const v = d[i * 4] * a + 255 * (1 - a);
    ink[i] = v < 150 ? 1 : 0;
  }
  // Linien um 1 px verdicken: dünne Linien werden kräftiger, kleine Lücken schließen sich
  const thick = new Uint8Array(ink);
  for (let y = 1; y < H - 1; y++)
    for (let x = 1; x < W - 1; x++) {
      const i = y * W + x;
      if (!ink[i] && (ink[i - 1] || ink[i + 1] || ink[i - W] || ink[i + W])) thick[i] = 1;
    }
  for (let i = 0; i < W * H; i++) {
    const v = thick[i] ? 0 : 255;
    d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = v;
    d[i * 4 + 3] = 255;
  }
  const svg = (await trace(await bg.getBufferAsync(Jimp.MIME_PNG)))
    .replace(/width="\d+"/, 'width="800"')
    .replace(/height="\d+"/, 'height="600"');
  writeFileSync(join(out, id + '.svg'), svg);
  console.log(`${file} → ${theme}/${id}.svg (${Math.round(svg.length / 1024)} KB)`);
}
