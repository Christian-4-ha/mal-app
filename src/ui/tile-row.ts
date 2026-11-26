export interface TileItem {
  id: string;
  icon: string;
  label?: string;
  onTap(): void;
}

const GAP = 20;
const BASE = 180;
const MIN = 140;

/**
 * Horizontal wischbare Kachelreihe. Läuft sie über, wird die Kachelgröße so gewählt,
 * dass die letzte sichtbare Kachel halb angeschnitten ist (zeigt: hier geht es weiter).
 */
export function createTileRow(items: TileItem[], opts: { size?: number } = {}): HTMLElement {
  const row = document.createElement('div');
  row.className = 'tile-row';
  for (const item of items) {
    const b = document.createElement('button');
    b.className = 'tile';
    b.dataset.tile = item.id;
    b.dataset.testid = 'tile-' + item.id;
    const pic = document.createElement('span');
    pic.className = 'tile-img';
    pic.innerHTML = item.icon;
    b.append(pic);
    if (item.label) {
      const l = document.createElement('span');
      l.className = 'tile-label';
      l.textContent = item.label;
      b.append(l);
      b.classList.add('labelled');
    }
    b.style.animationDelay = `${row.children.length * 70}ms`;
    b.onclick = () => item.onTap();
    row.append(b);
  }
  const base = opts.size ?? BASE;
  const layout = () => {
    const w = row.clientWidth;
    if (!w) return;
    let size = base;
    const fit = Math.floor((w + GAP) / (base + GAP));
    if (items.length > fit) {
      const visible = Math.max(fit, 2) - 0.5;
      size = Math.max(MIN, (w - GAP * Math.floor(visible)) / visible);
    }
    row.style.setProperty('--tile', `${Math.floor(size)}px`);
  };
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(layout).observe(row);
  return row;
}
