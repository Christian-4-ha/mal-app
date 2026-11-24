import type { ToolVariant } from '../tools/types';

/** Kleine Bildauswahl neben einem Werkzeug. Tipp außerhalb schließt. */
export function openVariantPopup(
  anchor: HTMLElement,
  variants: ToolVariant[],
  current: string | null,
  color: string,
  onPick: (id: string) => void,
): void {
  const backdrop = document.createElement('div');
  backdrop.className = 'popup-backdrop';
  const pop = document.createElement('div');
  pop.className = 'variant-popup';
  pop.dataset.testid = 'variant-popup';
  pop.style.color = color;
  for (const v of variants) {
    const b = document.createElement('button');
    b.className = 'variant-btn' + (v.id === current ? ' active' : '');
    b.dataset.variant = v.id;
    b.innerHTML = v.icon;
    b.onclick = (e) => {
      e.stopPropagation();
      onPick(v.id);
      backdrop.remove();
    };
    pop.append(b);
  }
  const r = anchor.getBoundingClientRect();
  pop.style.top = `${Math.max(8, Math.min(r.top, window.innerHeight - 90 * variants.length))}px`;
  pop.style.right = `${window.innerWidth - r.left + 10}px`;
  backdrop.onclick = () => backdrop.remove();
  backdrop.append(pop);
  document.body.append(backdrop);
}
