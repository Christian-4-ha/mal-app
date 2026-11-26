import type { Screen } from '../app/screen';
import type { Profile } from '../storage/types';
import { navigate } from '../app/router';
import { listModes, type MenuGroup, type MenuRows, type MenuTile } from '../modes/registry';
import { createTileRow } from '../ui/tile-row';
import { renderAvatar } from '../ui/avatar';
import { icons } from '../ui/icons';
import { profileSelectScreen } from './profile-select';
import { isAdult } from '../storage/types';
import { updateProfile } from '../storage/profiles';

/** Die beiden Gruppen-Kacheln der obersten Ebene (neben der Galerie). */
const GROUPS: { id: MenuGroup; label: string; icon: string }[] = [
  { id: 'paint', label: 'Malen', icon: icons.menuPaint },
  { id: 'play', label: 'Spielen', icon: icons.menuPlay },
];

/** Kurz hüpfen lassen, bevor der Bildschirm wechselt (sichtbares Feedback für Kinder). */
const BOUNCE_MS = 220;

function markActive(row: HTMLElement, id: string) {
  row.querySelectorAll<HTMLElement>('[data-tile]').forEach((t) => t.classList.toggle('active', t.dataset.tile === id));
}

function bounce(row: HTMLElement, id: string) {
  const t = row.querySelector<HTMLElement>(`[data-tile="${id}"]`);
  if (!t) return;
  t.classList.remove('bounce');
  void t.offsetWidth; // Animation neu starten
  t.classList.add('bounce');
}

/** Menü: oben Galerie / Malen / Spielen; eine Gruppe ersetzt diese Ebene durch ihre Modi. */
export function modeMenuScreen(profile: Profile, group: MenuGroup | null = null): Screen {
  let cleanup = () => undefined as void;
  // Eine Navigation wartet kurz (Hüpfen); solange sind weitere Tipps gesperrt
  let pending = 0;
  return {
    name: 'mode-menu',
    mount(root) {
      root.classList.add('mode-menu');
      root.dataset.group = group ?? 'top';
      const top = document.createElement('div');
      top.className = 'menu-top';
      const back = document.createElement('button');
      back.className = 'icon-btn' + (group ? ' group-back' : '');
      back.dataset.testid = group ? 'group-back' : 'menu-back';
      back.setAttribute('aria-label', 'Zurück');
      back.innerHTML = icons.back;
      back.onclick = () => {
        if (pending) return;
        void navigate(group ? modeMenuScreen(profile) : profileSelectScreen());
      };
      const av = document.createElement('span');
      av.classList.add('small');
      cleanup = renderAvatar(av, profile);
      const go = (next: () => Screen) => {
        if (pending) return;
        pending = window.setTimeout(() => {
          pending = 0;
          if (root.isConnected) void navigate(next());
        }, BOUNCE_MS);
      };
      top.append(back, av);
      if (group) {
        const g = GROUPS.find((x) => x.id === group)!;
        const title = document.createElement('span');
        title.className = 'menu-title';
        title.innerHTML = `<span class="menu-title-img">${g.icon}</span>${g.label}`;
        top.append(title);
      }
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
          root.classList.toggle('expanded', !!slots[2] || (level === 2 && !!items));
          if (!items) return;
          const tagged: MenuTile[] = items.map((it) => ({
            ...it,
            onTap: () => {
              if (pending) return;
              markActive(row, it.id);
              bounce(row, it.id);
              it.onTap();
            },
          }));
          const row = createTileRow(tagged, { size: level === 2 ? 150 : 170 });
          row.dataset.row = String(level);
          row.classList.add('enter');
          slots[level] = row;
          root.append(row);
        },
      };

      const tiles: MenuTile[] = listModes(group).map((m) => ({
        id: m.id,
        icon: m.icon,
        label: m.label,
        onTap: () => {
          if (pending) return;
          markActive(modeRow, m.id);
          bounce(modeRow, m.id);
          if (m.expand) m.expand({ profile }, rows);
          else if (m.open) {
            rows.setRow(2, null);
            const open = m.open;
            go(() => open({ profile }));
          }
        },
      }));
      if (!group)
        for (const g of GROUPS)
          tiles.push({
            id: g.id,
            icon: g.icon,
            label: g.label,
            onTap: () => {
              if (pending) return;
              bounce(modeRow, g.id);
              go(() => modeMenuScreen(profile, g.id));
            },
          });
      const modeRow = createTileRow(tiles, { size: group ? 200 : 250 });
      modeRow.dataset.row = '1';
      modeRow.classList.add('enter');
      root.append(top, modeRow);
    },
    unmount() {
      clearTimeout(pending);
      pending = 0;
      cleanup();
    },
  };
}
