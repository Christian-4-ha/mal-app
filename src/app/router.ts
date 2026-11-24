import type { Screen } from './screen';

let current: Screen | null = null;
let root: HTMLElement | null = null;
let chain: Promise<unknown> = Promise.resolve();

export function setRoot(el: HTMLElement): void {
  root = el;
  current = null;
}

/**
 * Wechselt den Bildschirm; wartet auf unmount des alten (z. B. Autosave).
 * Liefert unmount `false`, bleibt der alte Bildschirm stehen und das Ergebnis ist `false`.
 */
export function navigate(screen: Screen): Promise<boolean> {
  const next = chain.then(async () => {
    if (!root) throw new Error('Router ohne Wurzel');
    if (current) {
      try {
        if ((await current.unmount()) === false) return false;
      } catch (e) {
        console.error(e);
      }
    }
    root.replaceChildren();
    const host = document.createElement('div');
    host.className = 'screen';
    host.dataset.screen = screen.name;
    root.append(host);
    current = screen;
    screen.mount(host);
    return true;
  });
  chain = next.catch(() => undefined);
  return next;
}
