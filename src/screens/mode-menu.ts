import type { Screen } from '../app/screen';
import type { Profile } from '../storage/types';
import { navigate } from '../app/router';
import { listModes } from '../modes/registry';
import { createTileRow } from '../ui/tile-row';
import { renderAvatar } from '../ui/avatar';
import { icons } from '../ui/icons';
import { profileSelectScreen } from './profile-select';

export function modeMenuScreen(profile: Profile): Screen {
  let cleanup = () => undefined as void;
  return {
    name: 'mode-menu',
    mount(root) {
      root.classList.add('mode-menu');
      const top = document.createElement('div');
      top.className = 'menu-top';
      const back = document.createElement('button');
      back.className = 'icon-btn';
      back.setAttribute('aria-label', 'Zurück');
      back.innerHTML = icons.back;
      back.onclick = () => navigate(profileSelectScreen());
      const av = document.createElement('span');
      av.classList.add('small');
      cleanup = renderAvatar(av, profile);
      top.append(back, av);

      const row = createTileRow(
        listModes().map((m) => ({ id: m.id, icon: m.icon, onTap: () => navigate(m.open({ profile })) })),
      );
      root.append(top, row);
    },
    unmount() {
      cleanup();
    },
  };
}
