import type { Screen } from '../app/screen';
import type { Profile } from '../storage/types';
import { navigate } from '../app/router';
import { icons } from '../ui/icons';
import { galleryScreen } from './gallery';
import { profileSelectScreen } from './profile-select';

/** „Für heute ist Schluss“: schlafender Mond, Wege zur Galerie (nur ansehen) und zur Profilauswahl. */
export function dayOverScreen(profile: Profile): Screen {
  return {
    name: 'day-over',
    mount(root) {
      root.classList.add('day-over');
      root.innerHTML = `<div class="moon">${icons.moon}</div><div class="day-over-actions"></div>`;
      const actions = root.querySelector('.day-over-actions')!;
      const gal = document.createElement('button');
      gal.className = 'tile';
      gal.dataset.testid = 'day-over-gallery';
      gal.innerHTML = icons.gallery;
      gal.onclick = () => navigate(galleryScreen(profile, { viewOnly: true }));
      const home = document.createElement('button');
      home.className = 'tile';
      home.dataset.testid = 'day-over-home';
      home.innerHTML = icons.home;
      home.onclick = () => navigate(profileSelectScreen());
      actions.append(gal, home);
    },
    unmount() {},
  };
}
