import type { Mode } from '../registry';
import { icons } from '../../ui/icons';
import { navigate } from '../../app/router';
import { paintScreen } from '../../paint/paint-screen';

/** Kachel-Symbol: Kreis mit n Spiegelachsen. */
export function axesIcon(n: number): string {
  const lines = Array.from({ length: n }, (_, k) => {
    const a = Math.PI / 2 + (Math.PI * k) / n;
    const dx = Math.cos(a) * 26;
    const dy = Math.sin(a) * 26;
    return `<path d="M${32 - dx} ${32 - dy} L${32 + dx} ${32 + dy}" stroke="#8e24aa" stroke-width="4"/>`;
  }).join('');
  const dots = Array.from({ length: 2 * n }, (_, k) => {
    const a = Math.PI / 2 + (Math.PI * (k + 0.5)) / n;
    return `<circle cx="${32 + Math.cos(a) * 17}" cy="${32 + Math.sin(a) * 17}" r="4.5" fill="#ffb300"/>`;
  }).join('');
  return `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" fill="none" stroke-linecap="round"><circle cx="32" cy="32" r="27" fill="#fff3e0" stroke="#8e24aa" stroke-width="3"/>${lines}${dots}</svg>`;
}

/** Mandala: Reihe 2 = Anzahl der Spiegelachsen (1–5), Tipp → Malfläche mit Spiegelung. */
export const mandalaMode: Mode = {
  id: 'mandala',
  icon: icons.mandala,
  order: 25,
  expand({ profile }, rows) {
    rows.setRow(
      2,
      [1, 2, 3, 4, 5].map((n) => ({
        id: `axes-${n}`,
        icon: axesIcon(n),
        onTap: () => navigate(paintScreen({ profile, modeId: `mandala-${n}` })),
      })),
    );
  },
};
