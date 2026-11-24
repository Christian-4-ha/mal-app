import type { Screen } from './screen';

let current: Screen | null = null;
let root: HTMLElement | null = null;
let chain: Promise<void> = Promise.resolve();

export function setRoot(el: HTMLElement): void {
  root = el;
}

/** Wechselt den Bildschirm; wartet auf unmount des alten (z. B. Autosave). */
export function navigate(screen: Screen): Promise<void> {
  chain = chain.then(async () => {
    if (!root) throw new Error('Router ohne Wurzel');
    if (current) {
      try {
        await current.unmount();
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
  });
  return chain;
}
