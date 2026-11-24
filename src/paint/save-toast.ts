import { icons } from '../ui/icons';

/** Kurze, textlose Bestätigung: Bilderrahmen mit grünem Haken, blendet nach ~1,5 s aus. */
export function showSaveToast(host: HTMLElement): void {
  host.querySelector('.save-toast')?.remove();
  const t = document.createElement('div');
  t.className = 'save-toast';
  t.dataset.testid = 'save-toast';
  t.innerHTML = `${icons.save}<span class="save-check">${icons.check}</span>`;
  host.append(t);
  setTimeout(() => t.remove(), 1600);
}
