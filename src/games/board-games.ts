import { icons } from '../ui/icons';
import { PLAYER_COLORS, type Game } from './game-screen';
import {
  C4_COLS, C4_ROWS, MILL_POS, c4Drop, c4Line, millCanMove, millMove, millPlace, millRemovable,
  millRemove, millStart, tttWinner, type Cell, type MillState, type P,
} from './logic';

const mark = (p: P) =>
  p === 0
    ? `<svg viewBox="0 0 64 64"><path d="M14 14 L50 50 M50 14 L14 50" stroke="${PLAYER_COLORS[0]}" stroke-width="10" stroke-linecap="round"/></svg>`
    : `<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="19" fill="none" stroke="${PLAYER_COLORS[1]}" stroke-width="10"/></svg>`;

export const ticTacToe: Game = {
  id: 'tictactoe',
  icon: icons.tictactoe,
  mount(board, api) {
    const cells: Cell[] = Array(9).fill(null);
    let over = false;
    const btns = cells.map((_, i) => {
      const b = document.createElement('button');
      b.className = 'ttt-cell';
      b.dataset.testid = `ttt-cell-${i}`;
      b.onclick = () => {
        if (over || cells[i] !== null) return;
        const p = api.turn;
        cells[i] = p;
        b.innerHTML = mark(p);
        b.dataset.p = String(p);
        const w = tttWinner(cells);
        if (w) {
          over = true;
          w.line.forEach((j) => btns[j].classList.add('win'));
          api.finish(w.player);
        } else if (cells.every((c) => c !== null)) {
          over = true;
          api.finish(null);
        } else api.setTurn((1 - p) as P);
      };
      board.append(b);
      return b;
    });
    return () => {};
  },
};

export const connectFour: Game = {
  id: 'connect4',
  icon: icons.connect4,
  mount(board, api) {
    const cells: Cell[] = Array(C4_COLS * C4_ROWS).fill(null);
    let over = false;
    const holes: HTMLElement[] = [];
    for (let c = 0; c < C4_COLS; c++) {
      const col = document.createElement('button');
      col.className = 'c4-col';
      col.dataset.testid = `c4-col-${c}`;
      for (let r = 0; r < C4_ROWS; r++) {
        const h = document.createElement('span');
        h.className = 'c4-hole';
        holes[r * C4_COLS + c] = h;
        col.append(h);
      }
      col.onclick = () => {
        if (over) return;
        const p = api.turn;
        const r = c4Drop(cells, c, p);
        if (r < 0) return;
        const h = holes[r * C4_COLS + c];
        const stone = document.createElement('span');
        stone.className = 'c4-stone';
        stone.style.background = PLAYER_COLORS[p];
        stone.style.setProperty('--drop', String(r + 1));
        h.append(stone);
        h.dataset.p = String(p);
        const line = c4Line(cells, r, c);
        if (line) {
          over = true;
          line.forEach((i) => holes[i].classList.add('win'));
          api.finish(p);
        } else if (cells.every((x) => x !== null)) {
          over = true;
          api.finish(null);
        } else api.setTurn((1 - p) as P);
      };
      board.append(col);
    }
    return () => {};
  },
};

export const muehle: Game = {
  id: 'muehle',
  icon: icons.muehle,
  mount(board, api, first) {
    let s: MillState = millStart(first);
    let selected: number | null = null;
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '-1 -1 8 8');
    svg.classList.add('mill-svg');
    const lines = document.createElementNS(ns, 'path');
    lines.setAttribute(
      'd',
      'M0 0H6V6H0Z M1 1H5V5H1Z M2 2H4V4H2Z M3 0V2 M3 4V6 M0 3H2 M4 3H6',
    );
    lines.setAttribute('class', 'mill-lines');
    svg.append(lines);
    const pts = MILL_POS.map(([x, y], i) => {
      const g = document.createElementNS(ns, 'g');
      g.setAttribute('class', 'mill-pt');
      g.dataset.testid = `mill-pt-${i}`;
      const hit = document.createElementNS(ns, 'circle');
      hit.setAttribute('cx', String(x));
      hit.setAttribute('cy', String(y));
      hit.setAttribute('r', '0.45');
      hit.setAttribute('class', 'mill-hit');
      const stone = document.createElementNS(ns, 'circle');
      stone.setAttribute('cx', String(x));
      stone.setAttribute('cy', String(y));
      stone.setAttribute('r', '0.32');
      stone.setAttribute('class', 'mill-stone');
      g.append(hit, stone);
      g.addEventListener('click', () => tap(i));
      svg.append(g);
      return g;
    });
    board.append(svg);

    const stonesLeft = (n: number, p: P) =>
      Array.from({ length: n }, () => `<i style="background:${PLAYER_COLORS[p]}"></i>`).join('');

    const render = () => {
      const removable = s.phase === 'remove' ? millRemovable(s) : [];
      pts.forEach((g, i) => {
        const v = s.board[i];
        g.dataset.p = v === null ? '' : String(v);
        const stone = g.lastElementChild as SVGCircleElement;
        const target = selected !== null && s.phase === 'move' && millCanMove(s, selected, i);
        // leerer Punkt: kleiner Punkt (grün, wenn man dorthin ziehen darf); Stein: groß in Spielerfarbe
        stone.setAttribute('r', v !== null ? '0.32' : target ? '0.2' : '0.13');
        stone.style.fill = v !== null ? PLAYER_COLORS[v] : target ? '#43a047' : '#5d4037';
        g.classList.toggle('selected', selected === i);
        g.classList.toggle('removable', removable.includes(i));
        g.classList.toggle('target', target);
      });
      api.setInfo(0, stonesLeft(s.toPlace[0], 0));
      api.setInfo(1, stonesLeft(s.toPlace[1], 1));
      board.dataset.phase = s.phase;
      api.setTurn(s.turn);
    };

    const tap = (i: number) => {
      if (s.winner !== null || s.draw) return;
      let next: MillState | null = null;
      if (s.phase === 'place') next = millPlace(s, i);
      else if (s.phase === 'remove') next = millRemove(s, i);
      else if (s.board[i] === s.turn) {
        selected = selected === i ? null : i;
        return render();
      } else if (selected !== null) {
        next = millMove(s, selected, i);
      }
      if (!next) return;
      s = next;
      selected = null;
      render();
      if (s.winner !== null) api.finish(s.winner);
      else if (s.draw) api.finish(null);
    };
    render();
    return () => {};
  },
};
