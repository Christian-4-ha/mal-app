import { generatePalette } from './colors';
import { icons } from '../ui/icons';

/**
 * Raster mit ~100 Farben. Zeilen = Farbtöne, Spalten = Helligkeiten, letzte Spalte = Grau.
 * Oben zwei Reiter: normale Farben und Glitzerfarben (gleiche Farben mit Funken).
 */
export function openPalettePopup(
  current: string,
  currentGlitter: boolean,
  onPick: (color: string, glitter: boolean) => void,
): void {
  const rows = generatePalette(); // [helligkeit][farbton], Zeile 10 = Grau
  const backdrop = document.createElement('div');
  backdrop.className = 'popup-backdrop palette-backdrop';
  const pop = document.createElement('div');
  pop.className = 'palette-popup';
  pop.dataset.testid = 'palette';
  const cell = Math.floor(Math.min(60, (window.innerHeight - 150) / 10 - 6, (window.innerWidth - 60) / 11 - 6));
  pop.style.setProperty('--cell', `${Math.max(36, cell)}px`);

  // Reiter: erkennbar ohne Lesen (Farbkleckse bzw. funkelnder Glitzer)
  const tabs = document.createElement('div');
  tabs.className = 'palette-tabs';
  const tab = (id: 'normal' | 'glitter', icon: string, label: string) => {
    const b = document.createElement('button');
    b.className = 'palette-tab tab-' + id;
    b.dataset.testid = 'palette-tab-' + id;
    b.setAttribute('aria-label', label);
    b.innerHTML = `${icon}<span>${label}</span>`;
    b.onclick = (e) => {
      e.stopPropagation();
      show(id === 'glitter');
    };
    tabs.append(b);
    return b;
  };
  const tNormal = tab('normal', icons.paletteNormal, 'Farben');
  const tGlitter = tab('glitter', icons.paletteGlitter, 'Glitzer');

  const grid = document.createElement('div');
  grid.className = 'palette-grid';
  pop.append(tabs, grid);

  const cells: HTMLButtonElement[] = [];
  let glitter = currentGlitter;
  for (let hue = 0; hue < 10; hue++) {
    for (let col = 0; col < 11; col++) {
      const c = col < 10 ? rows[col][hue] : rows[10][hue];
      const b = document.createElement('button');
      b.className = 'palette-cell';
      b.style.backgroundColor = c;
      b.dataset.color = c;
      b.onclick = (e) => {
        e.stopPropagation();
        onPick(c, glitter);
        backdrop.remove();
      };
      cells.push(b);
      grid.append(b);
    }
  }

  function show(g: boolean) {
    glitter = g;
    pop.dataset.tab = g ? 'glitter' : 'normal';
    tNormal.classList.toggle('active', !g);
    tGlitter.classList.toggle('active', g);
    for (const b of cells) {
      b.classList.toggle('glitter', g);
      b.classList.toggle('active', b.dataset.color === current && g === currentGlitter);
    }
  }
  show(currentGlitter);

  pop.onclick = (e) => e.stopPropagation();
  backdrop.onclick = () => backdrop.remove();
  backdrop.append(pop);
  document.body.append(backdrop);
}
