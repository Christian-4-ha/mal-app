import { describe, expect, it } from 'vitest';
import { navigate, setRoot } from './router';
import type { Screen } from './screen';

const screen = (name: string, unmount: Screen['unmount'] = () => undefined): Screen => ({
  name,
  mount() {},
  unmount,
});

describe('router', () => {
  it('bleibt auf dem Bildschirm, wenn unmount false liefert (z. B. Speichern fehlgeschlagen)', async () => {
    const root = document.createElement('div');
    setRoot(root);
    await navigate(screen('paint', () => false));
    expect(await navigate(screen('menu'))).toBe(false);
    expect(root.querySelector('[data-screen]')!.getAttribute('data-screen')).toBe('paint');
  });

  it('wechselt normal, wenn unmount nichts zurückgibt', async () => {
    const root = document.createElement('div');
    setRoot(root);
    await navigate(screen('a'));
    expect(await navigate(screen('b'))).toBe(true);
    expect(root.querySelector('[data-screen]')!.getAttribute('data-screen')).toBe('b');
  });
});
