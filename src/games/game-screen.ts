import type { Screen } from '../app/screen';
import type { Profile } from '../storage/types';
import { navigate } from '../app/router';
import { renderAvatar } from '../ui/avatar';
import { icons } from '../ui/icons';
import { modeMenuScreen } from '../screens/mode-menu';
import { dayOverScreen } from '../screens/day-over';
import { startTimeLimit } from '../quota/time-limit';
import type { P } from './logic';

/** Mitspieler: ein Profil oder der Gast (nur für diese Runde). */
export interface Player {
  id: string;
  name: string;
  avatar: Blob | null;
}

export const GUEST: Player = { id: 'guest', name: 'Gast', avatar: null };
export const PLAYER_COLORS = ['#e53935', '#fbc02d'] as const;

export interface GameApi {
  readonly turn: P;
  setTurn(p: P): void;
  /** Kleine Zusatzanzeige unter dem Spieler (z. B. Steine zum Setzen bei Mühle). */
  setInfo(p: P, html: string): void;
  /** Spielende: Gewinner oder null (unentschieden). */
  finish(winner: P | null): void;
}

export interface Game {
  id: string;
  icon: string;
  /** Baut das Spielfeld in board auf; first beginnt. Liefert Aufräumfunktion. */
  mount(board: HTMLElement, api: GameApi, first: P): () => void;
}

/** Spieler-Abzeichen mit Avatar und Steinfarbe. */
function badge(player: Player, p: P, cleanups: (() => void)[]): HTMLElement {
  const b = document.createElement('div');
  b.className = 'player-badge';
  b.dataset.testid = `player-${p}`;
  b.style.setProperty('--pc', PLAYER_COLORS[p]);
  const av = document.createElement('span');
  if (player.id === GUEST.id) {
    av.className = 'avatar guest-avatar';
    av.innerHTML = icons.guest;
  } else cleanups.push(renderAvatar(av, player));
  const stone = document.createElement('span');
  stone.className = 'player-stone';
  const info = document.createElement('span');
  info.className = 'player-info';
  b.append(av, stone, info);
  return b;
}

/** Konfetti ohne Bibliothek. */
function confetti(host: HTMLElement): void {
  const colors = ['#e53935', '#fbc02d', '#43a047', '#1e88e5', '#8e24aa', '#fb8c00'];
  for (let i = 0; i < 60; i++) {
    const c = document.createElement('span');
    c.className = 'confetti';
    c.style.left = `${Math.random() * 100}%`;
    c.style.background = colors[i % colors.length];
    c.style.animationDelay = `${Math.random() * 0.8}s`;
    c.style.transform = `rotate(${Math.random() * 360}deg)`;
    host.append(c);
  }
}

/** Gemeinsamer Rahmen für Zwei-Spieler-Spiele an einem iPad. Zeit zählt für owner. */
export function gameScreen(owner: Profile, players: [Player, Player], game: Game, first: P = 0): Screen {
  const cleanups: (() => void)[] = [];
  let stopGame = () => {};
  return {
    name: 'game',
    mount(root) {
      root.classList.add('game-screen');
      root.dataset.game = game.id;
      const home = document.createElement('button');
      home.className = 'icon-btn game-home';
      home.setAttribute('aria-label', 'Zurück');
      home.dataset.testid = 'home';
      home.innerHTML = icons.home;
      home.onclick = () => navigate(modeMenuScreen(owner));
      const badges = [badge(players[0], 0, cleanups), badge(players[1], 1, cleanups)];
      const board = document.createElement('div');
      board.className = 'game-board';
      root.append(home, badges[0], board, badges[1]);

      let round = first;
      const start = (f: P) => {
        stopGame();
        root.querySelector('.game-over')?.remove();
        board.replaceChildren();
        board.className = `game-board board-${game.id}`;
        let turn: P = f;
        const show = () => badges.forEach((b, i) => b.classList.toggle('turn', i === turn));
        const api: GameApi = {
          get turn() {
            return turn;
          },
          setTurn(p) {
            turn = p;
            show();
          },
          setInfo(p, html) {
            badges[p].querySelector('.player-info')!.innerHTML = html;
          },
          finish(winner) {
            badges.forEach((b) => b.classList.remove('turn'));
            setTimeout(() => showOver(winner), 700);
          },
        };
        show();
        stopGame = game.mount(board, api, f);
      };

      const showOver = (winner: P | null) => {
        if (!root.isConnected) return;
        const over = document.createElement('div');
        over.className = 'game-over';
        over.dataset.testid = 'game-over';
        over.dataset.winner = winner === null ? 'none' : String(winner);
        const who = document.createElement('div');
        who.className = 'winner';
        for (const p of winner === null ? [0, 1] : [winner]) who.append(badges[p].firstElementChild!.cloneNode(true));
        const again = document.createElement('button');
        again.className = 'icon-btn big';
        again.dataset.testid = 'game-replay';
        again.setAttribute('aria-label', 'Nochmal');
        again.innerHTML = icons.replay;
        again.onclick = () => {
          round = (1 - round) as P; // abwechselnd beginnen
          start(round);
        };
        const back = home.cloneNode(true) as HTMLButtonElement;
        back.onclick = home.onclick;
        back.dataset.testid = 'game-over-home';
        over.append(who, again, back);
        if (winner !== null) confetti(over);
        root.append(over);
      };

      start(round);
      cleanups.push(() => stopGame());
      cleanups.push(startTimeLimit(owner, root, () => navigate(dayOverScreen(owner))));
    },
    unmount() {
      cleanups.forEach((c) => c());
    },
  };
}
