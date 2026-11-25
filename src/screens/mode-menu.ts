import type { Screen } from '../app/screen';
import type { Profile } from '../storage/types';
import { navigate } from '../app/router';
import { listModes, type MenuRows, type MenuTile } from '../modes/registry';
import { createTileRow } from '../ui/tile-row';
import { renderAvatar } from '../ui/avatar';
import { icons } from '../ui/icons';
import { profileSelectScreen } from './profile-select';
import { isAdult } from '../storage/types';
import { updateProfile } from '../storage/profiles';

function markActive(row: HTMLElement, id: string) {
  row.querySelectorAll<HTMLElement>('[data-tile]').forEach((t) => t.classList.toggle('active', t.dataset.tile === id));
}

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
      if (isAdult(profile)) {
        // Erwachsene: Nutzungszeit an/aus
        const clock = document.createElement('button');
        clock.className = 'icon-btn time-toggle';
        clock.dataset.testid = 'time-toggle';
        clock.setAttribute('aria-label', 'Nutzungszeit');
        const show = () => {
          clock.innerHTML = profile.unlimited ? icons.clockOff : icons.clockOn;
          clock.dataset.on = String(!profile.unlimited);
        };
        clock.onclick = async () => {
          profile.unlimited = !profile.unlimited;
          show();
          await updateProfile(profile);
        };
        show();
        top.append(clock);
      }

      const slots: Record<2 | 3, HTMLElement | null> = { 2: null, 3: null };
      const rows: MenuRows = {
        setRow(level, items) {
          if (level === 2) rows.setRow(3, null);
          slots[level]?.remove();
          slots[level] = null;
          if (!items) return;
          const tagged: MenuTile[] = items.map((it) => ({
            ...it,
            onTap: () => {
              markActive(row, it.id);
              it.onTap();
            },
          }));
          const row = createTileRow(tagged, { size: level === 2 ? 150 : 190 });
          row.dataset.row = String(level);
          slots[level] = row;
          root.append(row);
        },
      };

      const modeRow = createTileRow(
        listModes().map((m) => ({
          id: m.id,
          icon: m.icon,
          onTap: () => {
            markActive(modeRow, m.id);
            if (m.expand) m.expand({ profile }, rows);
            else if (m.open) {
              rows.setRow(2, null);
              navigate(m.open({ profile }));
            }
          },
        })),
      );
      modeRow.dataset.row = '1';
      root.append(top, modeRow);
    },
    unmount() {
      cleanup();
    },
  };
}
