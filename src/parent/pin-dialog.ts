import { getSetting, setSetting } from '../storage/settings';
import { hashPin, isValidPin, verifyPin, type StoredPin } from './pin';

const PIN_KEY = 'pin';

export const hasPin = async () => (await getSetting<StoredPin>(PIN_KEY)) !== undefined;

/** Zahlenfeld-Dialog; liefert die eingegebene PIN oder null bei Abbruch. */
function askDigits(title: string, opts: { forgot?: () => void } = {}): Promise<string | null> {
  return new Promise((resolve) => {
    const back = document.createElement('div');
    back.className = 'pin-backdrop';
    back.dataset.testid = 'pin-dialog';
    back.innerHTML = `<div class="pin-box"><h2></h2><div class="pin-dots"></div><div class="pin-msg" aria-live="polite"></div><div class="pin-keys"></div><div class="pin-actions"></div></div>`;
    back.querySelector('h2')!.textContent = title;
    const dots = back.querySelector<HTMLElement>('.pin-dots')!;
    const keys = back.querySelector<HTMLElement>('.pin-keys')!;
    const actions = back.querySelector<HTMLElement>('.pin-actions')!;
    let value = '';
    const render = () => (dots.textContent = '●'.repeat(value.length) + '○'.repeat(4 - value.length));
    const done = (v: string | null) => {
      back.remove();
      resolve(v);
    };
    for (const k of ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫']) {
      const b = document.createElement('button');
      b.textContent = k;
      if (!k) b.disabled = true;
      b.dataset.testid = k === '⌫' ? 'pin-back' : `pin-key-${k}`;
      b.onclick = () => {
        if (k === '⌫') value = value.slice(0, -1);
        else if (value.length < 4) value += k;
        render();
        if (value.length === 4) setTimeout(() => done(value), 120);
      };
      keys.append(b);
    }
    const cancel = document.createElement('button');
    cancel.textContent = 'Abbrechen';
    cancel.dataset.testid = 'pin-cancel';
    cancel.onclick = () => done(null);
    actions.append(cancel);
    if (opts.forgot) {
      const f = document.createElement('button');
      f.textContent = 'PIN vergessen';
      f.dataset.testid = 'pin-forgot';
      f.onclick = () => {
        back.remove();
        resolve(null);
        opts.forgot!();
      };
      actions.append(f);
    }
    render();
    document.body.append(back);
  });
}

function message(text: string): Promise<void> {
  return new Promise((resolve) => {
    const back = document.createElement('div');
    back.className = 'pin-backdrop';
    back.innerHTML = `<div class="pin-box"><p></p><button class="primary">OK</button></div>`;
    back.querySelector('p')!.textContent = text;
    back.querySelector('button')!.onclick = () => {
      back.remove();
      resolve();
    };
    document.body.append(back);
  });
}

/** Neue PIN festlegen (zweimal eingeben). */
export async function setupPin(): Promise<boolean> {
  for (;;) {
    const a = await askDigits('Eltern-PIN festlegen (4 Ziffern)');
    if (a === null) return false;
    const b = await askDigits('PIN wiederholen');
    if (b === null) return false;
    if (a === b && isValidPin(a)) {
      await setSetting(PIN_KEY, await hashPin(a));
      return true;
    }
    await message('Die beiden Eingaben stimmen nicht überein. Bitte noch einmal.');
  }
}

/** Rechenaufgabe, die Kindergartenkinder nicht lösen; danach neue PIN. */
async function forgotPin(): Promise<boolean> {
  const answer = window.prompt('PIN vergessen? Wie viel ist 7 × 8?');
  if (answer?.trim() !== '56') {
    if (answer !== null) await message('Leider falsch.');
    return false;
  }
  return setupPin();
}

/**
 * Fragt die Eltern-PIN ab. Gibt es noch keine, wird sie jetzt festgelegt (erster Zugang zum Elternbereich).
 * Liefert true bei Erfolg.
 */
export async function requestPin(): Promise<boolean> {
  const stored = await getSetting<StoredPin>(PIN_KEY);
  if (!stored) return setupPin();
  let forgotten: Promise<boolean> | null = null;
  for (;;) {
    const pin = await askDigits('Eltern-PIN', { forgot: () => (forgotten = forgotPin()) });
    if (pin === null) return forgotten ? await forgotten : false;
    if (await verifyPin(pin, stored)) return true;
    await message('Falsche PIN.');
  }
}
