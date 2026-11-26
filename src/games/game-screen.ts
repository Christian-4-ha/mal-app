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
/** Steinfarben zur Wahl vor dem Spiel. */
export const GAME_COLORS = ['#e53935', '#fbc02d', '#1e88e5', '#43a047', '#8e24aa', '#ec407a'] as const;

export interface GameApi {
  readonly turn: P;
  /** Gewählte Farbe des Spielers. */
  color(p: P): string;
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
function playerAvatar(player: Player, cleanups: (() => void)[]): HTMLElement {
  const av = document.createElement('span');
  if (player.id === GUEST.id) {
    av.className = 'avatar guest-avatar';
    av.innerHTML = icons.guest;
  } else cleanups.push(renderAvatar(av, player));
  return av;
}

function badge(player: Player, p: P, cleanups: (() => void)[]): HTMLElement {
  const b = document.createElement('div');
  b.className = 'player-badge';
  b.dataset.testid = `player-${p}`;
  const av = playerAvatar(player, cleanups);
  const stone = document.createElement('span');
  stone.className = 'player-stone';
  const info = document.createElement('span');
  info.className = 'player-info';
  b.append(av, stone, info);
  return b;
}

/** Konfetti ohne Bibliothek. */
function confetti(host: HTMLElement): void {
  const colors = [...GAME_COLORS, '#fb8c00'];
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

/**
 * Vor dem Spiel: Jeder Spieler tippt auf seiner Seite eine Farbe an („einloggen“).
 * Die Farbe des anderen ist gesperrt; haben beide gewählt, geht es los.
 */
function colorPick(
  host: HTMLElement,
  players: [Player, Player],
  game: Game,
  cleanups: (() => void)[],
  done: (colors: [string, string]) => void,
): void {
  const pick = document.createElement('div');
  pick.className = 'color-pick';
  pick.dataset.testid = 'color-pick';
  const chosen: (string | null)[] = [null, null];
  const sides = ([0, 1] as P[]).map((p) => {
    const side = document.createElement('div');
    side.className = 'pick-side';
    side.dataset.testid = `pick-${p}`;
    const av = playerAvatar(players[p], cleanups);
    const grid = document.createElement('div');
    grid.className = 'pick-colors';
    GAME_COLORS.forEach((c, i) => {
      const b = document.createElement('button');
      b.className = 'pick-color';
      b.dataset.testid = `color-${p}-${i}`;
      b.dataset.color = c;
      b.style.background = c;
      b.setAttribute('aria-label', 'Farbe');
      b.onclick = () => {
        if (chosen[1 - p] === c || chosen[0] && chosen[1]) return;
        chosen[p] = c;
        update();
        if (chosen[0] && chosen[1]) {
          const t = window.setTimeout(() => host.isConnected && done([chosen[0]!, chosen[1]!]), 600);
          cleanups.push(() => clearTimeout(t));
        }
      };
      grid.append(b);
    });
    side.append(av, grid);
    return side;
  });
  const mid = document.createElement('div');
  mid.className = 'pick-mid';
  mid.innerHTML = `<span class="pick-game">${game.icon}</span><span class="pick-vs">${icons.versus}</span>`;
  pick.append(sides[0], mid, sides[1]);
  const update = () =>
    sides.forEach((side, p) => {
      side.classList.toggle('ready', !!chosen[p]);
      if (chosen[p]) side.style.setProperty('--pc', chosen[p]);
      side.querySelectorAll<HTMLButtonElement>('.pick-color').forEach((b) => {
        b.classList.toggle('chosen', b.dataset.color === chosen[p]);
        const taken = b.dataset.color === chosen[1 - p];
        b.classList.toggle('taken', taken);
        b.setAttribute('aria-disabled', String(taken));
      });
    });
  host.append(pick);
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
      home.onclick = () => navigate(modeMenuScreen(owner, 'play'));
      const badges = [badge(players[0], 0, cleanups), badge(players[1], 1, cleanups)];
      const board = document.createElement('div');
      board.className = 'game-board';
      root.append(home, badges[0], board, badges[1]);

      let round = first;
      let colors: [string, string] = [GAME_COLORS[0], GAME_COLORS[1]];
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
          color: (p) => colors[p],
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

      const begin = (c: [string, string]) => {
        colors = c;
        root.querySelector('.color-pick')?.remove();
        badges.forEach((b, i) => b.style.setProperty('--pc', c[i]));
        root.classList.remove('picking');
        start(round);
      };
      root.classList.add('picking');
      colorPick(root, players, game, cleanups, begin);
      cleanups.push(() => stopGame());
      cleanups.push(startTimeLimit(owner, root, () => navigate(dayOverScreen(owner))));
    },
    unmount() {
      cleanups.forEach((c) => c());
    },
  };
}
