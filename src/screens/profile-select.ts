import type { Screen } from '../app/screen';
import { navigate } from '../app/router';
import { listProfiles } from '../storage/profiles';
import { getDayQuota } from '../storage/quota-store';
import { dayKey } from '../quota/quota';
import { remainingToday } from '../quota/session';
import { requestPin } from '../parent/pin-dialog';
import { renderAvatar } from '../ui/avatar';
import { icons } from '../ui/icons';
import { profileEditScreen } from './profile-create';
import { modeMenuScreen } from './mode-menu';
import { parentAreaScreen } from './parent-area';
import { dailyPromptScreen } from './daily-prompt';
import { galleryScreen } from './gallery';

export function profileSelectScreen(): Screen {
  const cleanups: (() => void)[] = [];
  return {
    name: 'profile-select',
    mount(root) {
      root.classList.add('profile-select');
      const list = document.createElement('div');
      list.className = 'profile-list';
      const parent = document.createElement('button');
      parent.className = 'icon-btn parent-btn';
      parent.dataset.testid = 'parent-open';
      parent.setAttribute('aria-label', 'Elternbereich');
      parent.innerHTML = icons.gear;
      parent.onclick = async () => {
        if (await requestPin()) navigate(parentAreaScreen());
      };
      root.append(list, parent);

      // „+“ führt über die PIN in die Profilanlage
      const add = document.createElement('button');
      add.className = 'profile-tile profile-add';
      add.dataset.testid = 'profile-add';
      add.setAttribute('aria-label', 'Profil hinzufügen');
      add.innerHTML = `<span class="avatar avatar-add">${icons.plus}</span>`;
      add.onclick = async () => {
        if (await requestPin()) navigate(profileEditScreen(null, profileSelectScreen));
      };

      void (async () => {
        const profiles = await listProfiles();
        // Erste Öffnung des Tages: Malzeit für heute abfragen
        if (profiles.length && !(await getDayQuota(dayKey()))) {
          navigate(dailyPromptScreen(profiles));
          return;
        }
        for (const p of profiles) {
          const tile = document.createElement('button');
          tile.className = 'profile-tile';
          tile.dataset.testid = 'profile-tile';
          const av = document.createElement('span');
          cleanups.push(renderAvatar(av, p));
          const name = document.createElement('span');
          name.className = 'profile-name';
          name.textContent = p.name;
          tile.append(av, name);
          const exhausted = (await remainingToday(p)) === 0;
          if (exhausted) {
            // Für heute aufgebraucht: Mond, nur Galerie ansehen
            tile.classList.add('exhausted');
            const moon = document.createElement('span');
            moon.className = 'moon-badge';
            moon.dataset.testid = 'moon-badge';
            moon.innerHTML = icons.moon;
            tile.append(moon);
          }
          tile.onclick = () => navigate(exhausted ? galleryScreen(p, { viewOnly: true }) : modeMenuScreen(p));
          list.append(tile);
        }
        list.append(add);
      })();
    },
    unmount() {
      cleanups.forEach((c) => c());
    },
  };
}
