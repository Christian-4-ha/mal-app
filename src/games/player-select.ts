import type { Screen } from '../app/screen';
import type { Profile } from '../storage/types';
import { navigate } from '../app/router';
import { listProfiles } from '../storage/profiles';
import { renderAvatar } from '../ui/avatar';
import { icons } from '../ui/icons';
import { modeMenuScreen } from '../screens/mode-menu';
import { GUEST, gameScreen, type Game, type Player } from './game-screen';

/** Vor dem Spiel: Wer spielt mit? Andere Profile oder Gast. */
export function playerSelectScreen(owner: Profile, game: Game): Screen {
  const cleanups: (() => void)[] = [];
  return {
    name: 'player-select',
    mount(root) {
      root.classList.add('player-select');
      const back = document.createElement('button');
      back.className = 'icon-btn game-home';
      back.setAttribute('aria-label', 'Zurück');
      back.innerHTML = icons.back;
      back.onclick = () => navigate(modeMenuScreen(owner, 'play'));
      // Links ich (groß), in der Mitte „gegen“, rechts die möglichen Mitspieler
      const me = document.createElement('div');
      me.className = 'versus-me';
      me.dataset.testid = 'me';
      const meAv = document.createElement('span');
      cleanups.push(renderAvatar(meAv, owner));
      const meName = document.createElement('span');
      meName.className = 'profile-name';
      meName.textContent = owner.name;
      const gameIcon = document.createElement('span');
      gameIcon.className = 'versus-game';
      gameIcon.innerHTML = game.icon;
      me.append(gameIcon, meAv, meName);
      const vs = document.createElement('span');
      vs.className = 'versus-icon';
      vs.innerHTML = icons.versus;
      const list = document.createElement('div');
      list.className = 'profile-list versus-list';
      root.append(back, me, vs, list);

      const tile = (p: Player, testid: string) => {
        const b = document.createElement('button');
        b.className = 'profile-tile';
        b.dataset.testid = testid;
        const av = document.createElement('span');
        if (p.id === GUEST.id) {
          av.className = 'avatar guest-avatar';
          av.innerHTML = icons.guest;
        } else cleanups.push(renderAvatar(av, p));
        const name = document.createElement('span');
        name.className = 'profile-name';
        name.textContent = p.name;
        b.append(av, name);
        b.onclick = () => navigate(gameScreen(owner, [owner, p], game));
        list.append(b);
      };
      void listProfiles().then((all) => {
        for (const p of all) if (p.id !== owner.id) tile(p, `opponent-${p.name}`);
        tile(GUEST, 'opponent-guest');
      });
    },
    unmount() {
      cleanups.forEach((c) => c());
    },
  };
}
