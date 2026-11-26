import type { Picture } from '../storage/types';
import { listPictures } from '../storage/pictures';
import { getTemplateSource } from '../templates';
import { svgToImage } from '../templates/svg-image';

/** Ein Puzzlemotiv: Vorschau für die Kachel und das Bild in voller Größe. */
export interface Motif {
  id: string;
  /** Beschriftung unter der Kachel */
  name: string;
  /** Bildquelle für die Vorschau-Kachel */
  preview: string | Blob;
  load(): Promise<HTMLCanvasElement>;
}

const SAFE_FILE = /^[a-z0-9_-]+(\/[a-z0-9_-]+)*\.(png|jpe?g|webp|svg)$/;
const MAX_W = 1600;

/** Zeichnet Bilder auf weißen Grund (Ausmalbilder und Linien sind sonst durchsichtig). */
function flatten(w: number, h: number, ...layers: CanvasImageSource[]): HTMLCanvasElement {
  const k = Math.min(1, MAX_W / w);
  const c = document.createElement('canvas');
  c.width = Math.round(w * k);
  c.height = Math.round(h * k);
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, c.width, c.height);
  for (const l of layers) ctx.drawImage(l, 0, 0, c.width, c.height);
  return c;
}

const loadImg = (src: string) =>
  new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = () => rej(new Error('Bild fehlt: ' + src));
    i.src = src;
  });

async function templateImage(id: string): Promise<HTMLImageElement | null> {
  const svg = await getTemplateSource().loadSvg(id);
  return svg ? svgToImage(svg) : null;
}

/** Eigene Puzzlebilder aus public/puzzles/catalog.json (Datei oder Ausmal-Vorlage). */
async function catalogMotifs(): Promise<Motif[]> {
  const base = `${import.meta.env.BASE_URL}puzzles/`;
  try {
    const json = (await (await fetch(base + 'catalog.json')).json()) as { images?: unknown[] };
    const source = getTemplateSource();
    const templates = (await Promise.all((await source.listThemes()).map((t) => source.listTemplates(t.id)))).flat();
    const out: Motif[] = [];
    for (const e of json.images ?? []) {
      if (typeof e !== 'object' || !e) continue;
      const { id, file, template, name } = e as { id?: unknown; file?: unknown; template?: unknown; name?: unknown };
      if (typeof id !== 'string') continue;
      const label = typeof name === 'string' ? name : '';
      if (typeof file === 'string' && SAFE_FILE.test(file)) {
        out.push({
          id,
          name: label,
          preview: base + file,
          load: async () => {
            const img = await loadImg(base + file);
            return flatten(img.naturalWidth || img.width, img.naturalHeight || img.height, img);
          },
        });
      } else if (typeof template === 'string') {
        const t = templates.find((x) => x.id === template);
        if (!t) continue;
        out.push({
          id,
          name: label || t.name || '',
          preview: source.previewUrl(t),
          load: async () => {
            const img = (await templateImage(template))!;
            return flatten(img.width, img.height, img);
          },
        });
      }
    }
    return out;
  } catch (e) {
    console.error(e);
    return [];
  }
}

function pictureMotif(p: Picture): Motif {
  return {
    id: 'pic-' + p.id,
    name: 'Mein Bild',
    preview: p.thumb,
    load: async () => {
      const bmp = await createImageBitmap(p.paint);
      const layers: CanvasImageSource[] = [bmp];
      if (p.templateId) {
        const t = await templateImage(p.templateId).catch(() => null);
        if (t) {
          // Vorlage wie auf der Malfläche proportional einpassen
          const lc = document.createElement('canvas');
          lc.width = bmp.width;
          lc.height = bmp.height;
          const k = Math.min(lc.width / t.width, lc.height / t.height);
          lc.getContext('2d')!.drawImage(t, (lc.width - t.width * k) / 2, (lc.height - t.height * k) / 2, t.width * k, t.height * k);
          layers.push(lc);
        }
      }
      const c = flatten(bmp.width, bmp.height, ...layers);
      bmp.close();
      return c;
    },
  };
}

/** Alle Motive: eigene Puzzlebilder, dann die Bilder aus der Galerie des Profils. */
export async function listMotifs(profileId: string): Promise<Motif[]> {
  const [own, pics] = await Promise.all([catalogMotifs(), listPictures(profileId)]);
  return [...own, ...pics.map(pictureMotif)];
}
