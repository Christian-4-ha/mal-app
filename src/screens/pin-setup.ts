import type { Screen } from '../app/screen';
import { navigate } from '../app/router';
import { setupPin } from '../parent/pin-dialog';
import { profileSelectScreen } from './profile-select';

/**
 * Allererster Start (bzw. erster Start nach dem Update ohne PIN): Eltern legen die PIN fest,
 * bevor irgendetwas anderes geht. So kann sich ein Kind nicht selbst eine PIN geben.
 */
export function pinSetupScreen(): Screen {
  return {
    name: 'pin-setup',
    mount(root) {
      root.classList.add('parent-form');
      root.innerHTML = `
        <h1>Willkommen bei der Mal-App</h1>
        <p class="hint">Für Eltern: Bitte zuerst eine 4-stellige Eltern-PIN festlegen.<br>
        Sie schützt das Anlegen von Profilen, die Malzeit und den Elternbereich.</p>
        <button class="primary" data-testid="pin-setup-start">PIN festlegen</button>`;
      root.querySelector<HTMLButtonElement>('[data-testid="pin-setup-start"]')!.onclick = async () => {
        if (await setupPin()) navigate(profileSelectScreen());
      };
    },
    unmount() {},
  };
}
