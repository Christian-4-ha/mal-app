import { generatePalette } from './colors';

/**
 * Raster mit ~100 Farben. Zeilen = Farbtöne, Spalten = Helligkeiten, letzte Spalte = Grau.
 * Quer angeordnet, damit es auch auf dem niedrigen Fire-Bildschirm (≈ 600 px) passt.
 */
export function openPalettePopup(current: string, onPick: (color: string) => void): void {
  const rows = generatePalette(); // [helligkeit][farbton], Zeile 10 = Grau
  const backdrop = document.createElement('div');
  backdrop.className = 'popup-backdrop palette-backdrop';
  const pop = document.createElement('div');
  pop.className = 'palette-popup';
  pop.dataset.testid = 'palette';
  const cell = Math.floor(Math.min(64, (window.innerHeight - 60) / 10 - 6, (window.innerWidth - 60) / 11 - 6));
  pop.style.setProperty('--cell', `${Math.max(40, cell)}px`);

  for (let hue = 0; hue < 10; hue++) {
    for (let col = 0; col < 11; col++) {
      const c = col < 10 ? rows[col][hue] : rows[10][hue];
      const b = document.createElement('button');
      b.className = 'palette-cell' + (c === current ? ' active' : '');
      b.style.background = c;
      b.dataset.color = c;
      b.onclick = (e) => {
        e.stopPropagation();
        onPick(c);
        backdrop.remove();
      };
      pop.append(b);
    }
  }
  pop.onclick = (e) => e.stopPropagation();
  backdrop.onclick = () => backdrop.remove();
  backdrop.append(pop);
  document.body.append(backdrop);
}
