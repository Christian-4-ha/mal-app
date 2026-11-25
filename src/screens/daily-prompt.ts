import type { Screen } from '../app/screen';
import type { Profile } from '../storage/types';
import { navigate } from '../app/router';
import { setDayQuota } from '../storage/quota-store';
import { dayKey } from '../quota/quota';
import { requestPin } from '../parent/pin-dialog';
import { createTimePicker } from '../ui/number-wheel';
import { renderAvatar } from '../ui/avatar';
import { profileSelectScreen } from './profile-select';

/**
 * Erste Öffnung des Tages: Nutzungszeit heute für alle Kinder, mit Standardwerten vorausgefüllt.
 * „Standard übernehmen“ geht ohne PIN, „Ändern“ nur mit PIN.
 */
export function dailyPromptScreen(profiles: Profile[]): Screen {
  const cleanups: (() => void)[] = [];
  return {
    name: 'daily-prompt',
    mount(root) {
      root.classList.add('parent-form');
      root.innerHTML = `<h1>Nutzungszeit heute</h1><div class="quota-list"></div><div class="row"><button class="primary" data-testid="quota-accept">Standard übernehmen</button><button class="file-btn" data-testid="quota-change">Ändern 🔒</button></div>`;
      const list = root.querySelector<HTMLElement>('.quota-list')!;
      const values = new Map(profiles.map((p) => [p.id, p.defaultQuotaMin]));
      const renderList = (editable: boolean) => {
        list.replaceChildren();
        for (const p of profiles) {
          const row = document.createElement('div');
          row.className = 'quota-row';
          const av = document.createElement('span');
          av.classList.add('small');
          cleanups.push(renderAvatar(av, p));
          const name = document.createElement('span');
          name.textContent = p.name;
          row.append(av, name);
          if (editable) {
            row.append(createTimePicker(values.get(p.id)!, (m) => values.set(p.id, m), `quota-${p.name}`));
          } else {
            const t = document.createElement('span');
            const m = values.get(p.id)!;
            t.textContent = `${Math.floor(m / 60)} Std ${m % 60} Min`;
            row.append(t);
          }
          list.append(row);
        }
      };
      renderList(false);
      const accept = root.querySelector<HTMLButtonElement>('[data-testid="quota-accept"]')!;
      const change = root.querySelector<HTMLButtonElement>('[data-testid="quota-change"]')!;
      accept.onclick = async () => {
        await setDayQuota(dayKey(), Object.fromEntries(values));
        navigate(profileSelectScreen());
      };
      change.onclick = async () => {
        if (!(await requestPin())) return;
        renderList(true);
        change.hidden = true;
        accept.textContent = 'Übernehmen';
      };
    },
    unmount() {
      cleanups.forEach((c) => c());
    },
  };
}
