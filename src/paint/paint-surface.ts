import { IDENTITY, type View } from './view-transform';
import { encodeCanvas } from './encode';

export interface PaintSurface {
  /** Malebene in Leinwandpixeln. */
  readonly paint: HTMLCanvasElement;
  /** Zwischenebene für Werkzeuge mit overlayAlpha. */
  readonly overlay: HTMLCanvasElement;
  /** Legt eine Ebene für Hilfslinien an (Mandala-Achsen); wird nie gespeichert. */
  addGuides(): HTMLCanvasElement;
  /** Leinwandpixel je CSS-Pixel. */
  readonly ratio: number;
  /** Sichtbarer Bereich in CSS-Pixeln (für Zoom-Grenzen). */
  readonly bounds: { w: number; h: number };
  readonly viewport: HTMLElement;
  setView(v: View): void;
  view(): View;
  snapshot(): ImageData;
  restore(s: ImageData): void;
  clear(): void;
  isBlank(): boolean;
  /** Überträgt die Zwischenebene mit Deckkraft auf die Malebene und leert sie. */
  commitOverlay(alpha: number): void;
  loadImage(b: Blob): Promise<void>;
  /** Vorlagenlinien (liegen immer obenauf, werden nie bemalt/radiert), proportional eingepasst. */
  setTemplate(img: CanvasImageSource & { width: number; height: number }): void;
  /** Pixel der Vorlagenebene (Grenzen für den Eimer) oder null ohne Vorlage. */
  templateData(): ImageData | null;
  toBlobs(): Promise<{ paint: Blob; thumb: Blob; width: number; height: number }>;
}

const THUMB_MAX_W = 320;


/** Leinwandgröße = Host-Größe × min(dpr, 2), bei Erstellung fest. */
export function createPaintSurface(host: HTMLElement): PaintSurface {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const w = Math.max(1, host.clientWidth);
  const h = Math.max(1, host.clientHeight);

  const viewport = document.createElement('div');
  viewport.className = 'paint-viewport';
  const stage = document.createElement('div');
  stage.className = 'paint-stage';
  stage.style.width = `${w}px`;
  stage.style.height = `${h}px`;

  const mk = (layer: string) => {
    const c = document.createElement('canvas');
    c.width = Math.round(w * ratio);
    c.height = Math.round(h * ratio);
    c.dataset.layer = layer;
    stage.append(c);
    return c;
  };
  const paint = mk('paint');
  const overlay = mk('overlay');
  const template = mk('template');
  let templateCache: ImageData | null = null;
  let hasTemplate = false;
  viewport.append(stage);
  host.append(viewport);

  const pctx = paint.getContext('2d', { willReadFrequently: true })!;
  const octx = overlay.getContext('2d')!;
  let view: View = IDENTITY;

  return {
    paint,
    overlay,
    addGuides() {
      const g = mk('guides');
      stage.insertBefore(g, template);
      return g;
    },
    ratio,
    viewport,
    bounds: { w, h },
    setView(v) {
      view = v;
      stage.style.transform = `translate(${v.tx}px, ${v.ty}px) scale(${v.scale})`;
    },
    view: () => view,
    snapshot: () => pctx.getImageData(0, 0, paint.width, paint.height),
    restore: (s) => pctx.putImageData(s, 0, 0),
    clear: () => pctx.clearRect(0, 0, paint.width, paint.height),
    isBlank() {
      const d = pctx.getImageData(0, 0, paint.width, paint.height).data;
      for (let i = 3; i < d.length; i += 4) if (d[i] !== 0) return false;
      return true;
    },
    commitOverlay(alpha) {
      pctx.save();
      pctx.globalAlpha = alpha;
      pctx.drawImage(overlay, 0, 0);
      pctx.restore();
      octx.clearRect(0, 0, overlay.width, overlay.height);
      overlay.style.opacity = '1';
    },
    async loadImage(b) {
      const bmp = await createImageBitmap(b);
      const k = Math.min(paint.width / bmp.width, paint.height / bmp.height);
      const dw = bmp.width * k;
      const dh = bmp.height * k;
      pctx.drawImage(bmp, (paint.width - dw) / 2, (paint.height - dh) / 2, dw, dh);
      bmp.close();
    },
    setTemplate(img) {
      const tctx = template.getContext('2d', { willReadFrequently: true })!;
      tctx.clearRect(0, 0, template.width, template.height);
      const k = Math.min(template.width / img.width, template.height / img.height);
      const dw = img.width * k;
      const dh = img.height * k;
      tctx.drawImage(img, (template.width - dw) / 2, (template.height - dh) / 2, dw, dh);
      hasTemplate = true;
      templateCache = null;
    },
    templateData() {
      if (!hasTemplate) return null;
      templateCache ??= template.getContext('2d', { willReadFrequently: true })!.getImageData(0, 0, template.width, template.height);
      return templateCache;
    },
    async toBlobs() {
      const out = encodeCanvas(paint);
      const k = Math.min(1, THUMB_MAX_W / paint.width);
      const t = document.createElement('canvas');
      t.width = Math.round(paint.width * k);
      t.height = Math.round(paint.height * k);
      const tctx = t.getContext('2d')!;
      tctx.fillStyle = '#fff';
      tctx.fillRect(0, 0, t.width, t.height);
      tctx.drawImage(paint, 0, 0, t.width, t.height);
      if (hasTemplate) tctx.drawImage(template, 0, 0, t.width, t.height);
      return { paint: out, thumb: encodeCanvas(t, 'image/jpeg', 0.8), width: paint.width, height: paint.height };
    },
  };
}
