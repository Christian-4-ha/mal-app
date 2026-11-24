import type { Screen } from '../app/screen';
import { navigate } from '../app/router';
import { listProfiles } from '../storage/profiles';
import { renderAvatar } from '../ui/avatar';
import { icons } from '../ui/icons';
import { profileCreateScreen } from './profile-create';
import { modeMenuScreen } from './mode-menu';

export function profileSelectScreen(): Screen {
  const cleanups: (() => void)[] = [];
  return {
    name: 'profile-select',
    mount(root) {
      root.classList.add('profile-select');
      const list = document.createElement('div');
      list.className = 'profile-list';
      root.append(list);

      const add = document.createElement('button');
      add.className = 'profile-tile profile-add';
      add.dataset.testid = 'profile-add';
      add.setAttribute('aria-label', 'Profil hinzufügen');
      add.innerHTML = `<span class="avatar avatar-add">${icons.plus}</span>`;
      add.onclick = () => navigate(profileCreateScreen());

      listProfiles().then((profiles) => {
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
          tile.onclick = () => navigate(modeMenuScreen(p));
          list.append(tile);
        }
        list.append(add);
      });
    },
    unmount() {
      cleanups.forEach((c) => c());
    },
  };
}
