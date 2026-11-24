import type { Screen } from '../app/screen';
import type { Profile } from '../storage/types';
import { navigate } from '../app/router';
import { listPictures } from '../storage/pictures';
import { icons } from '../ui/icons';
import { paintScreen } from '../paint/paint-screen';
import { modeMenuScreen } from './mode-menu';
import { profileSelectScreen } from './profile-select';

/**
 * Bilder des Profils, neueste zuerst. Antippen → weitermalen. Kein Löschen für Kinder.
 * viewOnly (Kontingent aufgebraucht): Antippen zeigt das Bild nur groß an.
 */
export function galleryScreen(profile: Profile, opts: { viewOnly?: boolean } = {}): Screen {
  const urls: string[] = [];
  return {
    name: 'gallery',
    mount(root) {
      root.classList.add('gallery');
      const back = document.createElement('button');
      back.className = 'icon-btn gallery-back';
      back.setAttribute('aria-label', 'Zurück');
      back.innerHTML = icons.back;
      back.onclick = () => navigate(opts.viewOnly ? profileSelectScreen() : modeMenuScreen(profile));
      const grid = document.createElement('div');
      grid.className = 'gallery-grid';
      root.append(back, grid);

      listPictures(profile.id).then((pics) => {
        if (pics.length === 0) {
          const empty = document.createElement('div');
          empty.className = 'gallery-empty';
          empty.dataset.testid = 'gallery-empty';
          empty.innerHTML = icons.frameEmpty;
          grid.append(empty);
          return;
        }
        for (const pic of pics) {
          const b = document.createElement('button');
          b.className = 'gallery-item';
          b.dataset.testid = 'gallery-item';
          const url = URL.createObjectURL(pic.thumb);
          urls.push(url);
          const img = document.createElement('img');
          img.src = url;
          img.alt = '';
          b.append(img);
          b.onclick = () => {
            if (!opts.viewOnly) return void navigate(paintScreen({ profile, modeId: pic.modeId, picture: pic }));
            const big = document.createElement('div');
            big.className = 'lightbox';
            big.dataset.testid = 'lightbox';
            big.innerHTML = `<img src="${url}" alt="">`;
            big.onclick = () => big.remove();
            root.append(big);
          };
          grid.append(b);
        }
      });
    },
    unmount() {
      urls.forEach((u) => URL.revokeObjectURL(u));
    },
  };
}
