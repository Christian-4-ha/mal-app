import { sizeFromDrag } from './size-drag';

const HOLD_MS = 300;
const DOT_MAX = 52;

export interface SizeControl {
  el: HTMLElement;
  /** Aktualisiert Anzeige (Größe in CSS-Pixeln, Farbe, Grenzen; min = max = 0 → ausgegraut). */
  set(size: number, color: string, min: number, max: number): void;
}

/** Punkt für die Strichdicke: drücken + halten, dann links = größer, rechts = kleiner. */
export function createSizeControl(onChange: (size: number) => void): SizeControl {
  const el = document.createElement('button');
  el.className = 'size-control';
  el.dataset.testid = 'size';
  el.setAttribute('aria-label', 'Strichdicke');
  const dot = document.createElement('span');
  dot.className = 'size-dot';
  el.append(dot);

  const preview = document.createElement('div');
  preview.className = 'size-preview';
  const pdot = document.createElement('span');
  preview.append(pdot);

  let size = 10;
  let color = '#000';
  let min = 1;
  let max = 10;
  let timer = 0;
  let startX = 0;
  let startSize = 0;
  let active = false;

  const render = () => {
    const d = Math.min(DOT_MAX, Math.max(4, size));
    dot.style.width = dot.style.height = `${d}px`;
    dot.style.background = color;
    pdot.style.width = pdot.style.height = `${size}px`;
    pdot.style.background = color;
    el.setAttribute('aria-disabled', String(max === 0));
  };

  el.addEventListener('pointerdown', (e) => {
    if (max === 0) return;
    el.setPointerCapture(e.pointerId);
    startX = e.clientX;
    startSize = size;
    timer = window.setTimeout(() => {
      active = true;
      document.body.append(preview);
    }, HOLD_MS);
  });
  el.addEventListener('pointermove', (e) => {
    if (!active) return;
    size = sizeFromDrag(startSize, e.clientX - startX, min, max);
    render();
  });
  const finish = () => {
    clearTimeout(timer);
    if (active) {
      active = false;
      preview.remove();
      onChange(size);
    }
  };
  el.addEventListener('pointerup', finish);
  el.addEventListener('pointercancel', finish);

  return {
    el,
    set(s, c, lo, hi) {
      size = s;
      color = c;
      min = lo;
      max = hi;
      render();
    },
  };
}
