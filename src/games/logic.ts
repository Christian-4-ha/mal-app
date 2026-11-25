// Reine Spielregeln (ohne Oberfläche) für Tic-Tac-Toe, Vier gewinnt und Mühle.

export type P = 0 | 1;
export type Cell = P | null;

// --- Tic-Tac-Toe ---
const TTT_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

/** Gewinnerlinie oder null. */
export function tttWinner(b: Cell[]): { player: P; line: number[] } | null {
  for (const l of TTT_LINES) {
    const v = b[l[0]];
    if (v !== null && v === b[l[1]] && v === b[l[2]]) return { player: v, line: l };
  }
  return null;
}

// --- Vier gewinnt (7 Spalten × 6 Reihen, Index = reihe * 7 + spalte, Reihe 0 oben) ---
export const C4_COLS = 7;
export const C4_ROWS = 6;

/** Lässt einen Stein in die Spalte fallen; liefert die Reihe oder -1, wenn die Spalte voll ist. */
export function c4Drop(b: Cell[], col: number, p: P): number {
  for (let r = C4_ROWS - 1; r >= 0; r--) {
    if (b[r * C4_COLS + col] === null) {
      b[r * C4_COLS + col] = p;
      return r;
    }
  }
  return -1;
}

/** Vier (oder mehr) in einer Reihe durch das Feld (r, c), sonst null. */
export function c4Line(b: Cell[], r: number, c: number): number[] | null {
  const p = b[r * C4_COLS + c];
  if (p === null) return null;
  for (const [dr, dc] of [[0, 1], [1, 0], [1, 1], [1, -1]]) {
    const cells = [r * C4_COLS + c];
    for (const s of [1, -1]) {
      let rr = r + dr * s;
      let cc = c + dc * s;
      while (rr >= 0 && rr < C4_ROWS && cc >= 0 && cc < C4_COLS && b[rr * C4_COLS + cc] === p) {
        cells.push(rr * C4_COLS + cc);
        rr += dr * s;
        cc += dc * s;
      }
    }
    if (cells.length >= 4) return cells;
  }
  return null;
}

// --- Mühle ---
/** Lage der 24 Punkte auf einem 7×7-Raster. */
export const MILL_POS: [number, number][] = [
  [0, 0], [3, 0], [6, 0],
  [1, 1], [3, 1], [5, 1],
  [2, 2], [3, 2], [4, 2],
  [0, 3], [1, 3], [2, 3], [4, 3], [5, 3], [6, 3],
  [2, 4], [3, 4], [4, 4],
  [1, 5], [3, 5], [5, 5],
  [0, 6], [3, 6], [6, 6],
];
export const MILLS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], [9, 10, 11], [12, 13, 14], [15, 16, 17], [18, 19, 20], [21, 22, 23],
  [0, 9, 21], [3, 10, 18], [6, 11, 15], [1, 4, 7], [16, 19, 22], [8, 12, 17], [5, 13, 20], [2, 14, 23],
];
export const MILL_ADJ: number[][] = Array.from({ length: 24 }, () => []);
for (const [a, b, c] of MILLS) {
  MILL_ADJ[a].push(b);
  MILL_ADJ[b].push(a, c);
  MILL_ADJ[c].push(b);
}

export interface MillState {
  board: Cell[];
  toPlace: [number, number];
  turn: P;
  /** remove: der Spieler am Zug hat eine Mühle und nimmt einen Stein. */
  phase: 'place' | 'move' | 'remove';
  winner: P | null;
}

export function millStart(first: P = 0): MillState {
  return { board: Array(24).fill(null), toPlace: [9, 9], turn: first, phase: 'place', winner: null };
}

const count = (s: MillState, p: P) => s.board.filter((v) => v === p).length;
export const millCanFly = (s: MillState, p: P) => s.toPlace[p] === 0 && count(s, p) === 3;
export const inMill = (b: Cell[], i: number) =>
  b[i] !== null && MILLS.some((m) => m.includes(i) && m.every((j) => b[j] === b[i]));

/** Darf p von from nach to ziehen? */
export function millCanMove(s: MillState, from: number, to: number): boolean {
  const p = s.turn;
  if (s.phase !== 'move' || s.board[from] !== p || s.board[to] !== null) return false;
  return millCanFly(s, p) || MILL_ADJ[from].includes(to);
}

/** Steine des Gegners, die genommen werden dürfen (nicht aus Mühlen, außer alle stehen in Mühlen). */
export function millRemovable(s: MillState): number[] {
  const o = (1 - s.turn) as P;
  const all = s.board.flatMap((v, i) => (v === o ? [i] : []));
  const free = all.filter((i) => !inMill(s.board, i));
  return free.length ? free : all;
}

function hasMove(s: MillState, p: P): boolean {
  if (s.toPlace[p] > 0) return true;
  if (millCanFly(s, p)) return s.board.includes(null);
  return s.board.some((v, i) => v === p && MILL_ADJ[i].some((j) => s.board[j] === null));
}

function endTurn(s: MillState): MillState {
  const next = (1 - s.turn) as P;
  const n: MillState = { ...s, turn: next, phase: s.toPlace[next] > 0 ? 'place' : 'move' };
  if (count(n, next) + n.toPlace[next] < 3 || !hasMove(n, next)) n.winner = s.turn;
  return n;
}

function afterLanding(s: MillState, at: number): MillState {
  return inMill(s.board, at) ? { ...s, phase: 'remove' } : endTurn(s);
}

/** Setzt einen Stein; null, wenn nicht erlaubt. */
export function millPlace(s: MillState, i: number): MillState | null {
  if (s.winner !== null || s.phase !== 'place' || s.board[i] !== null) return null;
  const board = [...s.board];
  board[i] = s.turn;
  const toPlace: [number, number] = [...s.toPlace];
  toPlace[s.turn]--;
  return afterLanding({ ...s, board, toPlace }, i);
}

export function millMove(s: MillState, from: number, to: number): MillState | null {
  if (s.winner !== null || !millCanMove(s, from, to)) return null;
  const board = [...s.board];
  board[to] = board[from];
  board[from] = null;
  return afterLanding({ ...s, board }, to);
}

export function millRemove(s: MillState, i: number): MillState | null {
  if (s.winner !== null || s.phase !== 'remove' || !millRemovable(s).includes(i)) return null;
  const board = [...s.board];
  board[i] = null;
  return endTurn({ ...s, board });
}
