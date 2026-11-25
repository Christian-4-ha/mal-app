import { describe, expect, it } from 'vitest';
import {
  c4Drop, c4Line, millCanMove, millMove, millPlace, millRemovable, millRemove, millStart, tttWinner, MILL_DRAW_MOVES,
  type Cell, type MillState,
} from './logic';

describe('Tic-Tac-Toe', () => {
  it('erkennt Reihe, Spalte und Diagonale', () => {
    const b: Cell[] = [0, 1, null, 1, 0, null, null, 1, 0];
    expect(tttWinner(b)).toEqual({ player: 0, line: [0, 4, 8] });
    expect(tttWinner([1, 1, 1, null, 0, 0, null, null, null])?.player).toBe(1);
    expect(tttWinner(Array(9).fill(null))).toBeNull();
  });
});

describe('Vier gewinnt', () => {
  it('Steine fallen nach unten, volle Spalte → -1', () => {
    const b: Cell[] = Array(42).fill(null);
    expect(c4Drop(b, 3, 0)).toBe(5);
    expect(c4Drop(b, 3, 1)).toBe(4);
    for (let i = 0; i < 4; i++) c4Drop(b, 3, 0);
    expect(c4Drop(b, 3, 1)).toBe(-1);
  });

  it('vier waagrecht und diagonal gewinnen, drei nicht', () => {
    const b: Cell[] = Array(42).fill(null);
    for (const c of [0, 1, 2]) c4Drop(b, c, 0);
    expect(c4Line(b, 5, 2)).toBeNull();
    c4Drop(b, 3, 0);
    expect(c4Line(b, 5, 3)).toHaveLength(4);

    const d: Cell[] = Array(42).fill(null);
    // Treppe für Diagonale von unten links nach oben rechts
    c4Drop(d, 0, 1);
    c4Drop(d, 1, 0); c4Drop(d, 1, 1);
    c4Drop(d, 2, 0); c4Drop(d, 2, 0); c4Drop(d, 2, 1);
    c4Drop(d, 3, 0); c4Drop(d, 3, 0); c4Drop(d, 3, 0);
    const r = c4Drop(d, 3, 1);
    expect(c4Line(d, r, 3)).toHaveLength(4);
  });
});

describe('Mühle', () => {
  const play = (s: MillState, places: number[]) => places.reduce((acc, i) => millPlace(acc, i)!, s);

  it('Setzen wechselt den Spieler; besetzter Punkt ist verboten', () => {
    let s = millStart();
    s = millPlace(s, 0)!;
    expect(s.turn).toBe(1);
    expect(millPlace(s, 0)).toBeNull();
  });

  it('Mühle → Stein nehmen, aber nicht aus einer gegnerischen Mühle', () => {
    // 0 setzt 0,1 ; 1 setzt 9,10,11 (Mühle) – dazwischen 0 setzt 23
    let s = play(millStart(), [0, 9, 1, 10, 23, 11]);
    expect(s.phase).toBe('remove');
    expect(s.turn).toBe(1);
    expect(millRemovable(s).sort()).toEqual([0, 1, 23]);
    s = millRemove(s, 23)!;
    expect(s.turn).toBe(0);
    expect(s.phase).toBe('place');
    // Spieler 0 schließt 0,1,2 → Steine aus 1s Mühle sind geschützt, solange es andere gibt
    s = millPlace(s, 2)!;
    expect(s.phase).toBe('remove');
    expect(millRemovable(s).sort((a, b) => a - b)).toEqual([9, 10, 11]); // alle in Mühle → alle erlaubt
  });

  it('Ziehen nur zu Nachbarn, Springen bei 3 Steinen', () => {
    const s: MillState = {
      board: Array(24).fill(null),
      toPlace: [0, 0],
      turn: 0,
      phase: 'move',
      winner: null,
    };
    s.board[0] = 0; s.board[4] = 0; s.board[8] = 0; s.board[20] = 0;
    s.board[21] = 1; s.board[22] = 1; s.board[23] = 1; s.board[13] = 1;
    expect(millCanMove(s, 0, 1)).toBe(true);
    expect(millCanMove(s, 0, 2)).toBe(false);
    const three = { ...s, board: [...s.board] };
    three.board[20] = null;
    expect(millCanMove(three, 0, 2)).toBe(true); // springen
    const moved = millMove(s, 0, 1)!;
    expect(moved.board[1]).toBe(0);
    expect(moved.turn).toBe(1);
  });

  it('wer nur noch 2 Steine hat, verliert', () => {
    const s: MillState = { board: Array(24).fill(null), toPlace: [0, 0], turn: 0, phase: 'remove', winner: null };
    s.board[0] = 0; s.board[1] = 0; s.board[2] = 0;
    s.board[21] = 1; s.board[22] = 1; s.board[13] = 1;
    const r = millRemove(s, 13)!;
    expect(r.winner).toBe(0);
  });

  it('wer nicht mehr ziehen kann, verliert', () => {
    const s: MillState = { board: Array(24).fill(null), toPlace: [0, 1], turn: 1, phase: 'place', winner: null };
    // Spieler 0 hat 4 Steine, alle eingeschlossen, nachdem 1 den letzten Stein setzt
    for (const i of [0, 1, 2, 14]) s.board[i] = 0;
    for (const i of [9, 4, 5, 23]) s.board[i] = 1;
    const r = millPlace(s, 3)!; // kein Nachbar von 0,1,2,14 bleibt frei? 14 hat Nachbarn 13 → frei
    expect(r.winner).toBeNull();
    const blocked = { ...r, board: [...r.board] };
    blocked.board[13] = 1;
    blocked.turn = 1;
    blocked.phase = 'place';
    blocked.toPlace = [0, 1];
    const r2 = millPlace(blocked, 12)!;
    expect(r2.winner).toBe(1);
  });
});

describe('Mühle unentschieden', () => {
  it('endet nach vielen Zügen ohne Mühle', () => {
    let s: MillState = { board: Array(24).fill(null), toPlace: [0, 0], turn: 0, phase: 'move', winner: null };
    s.board[0] = 0; s.board[4] = 0; s.board[8] = 0;
    s.board[21] = 1; s.board[19] = 1; s.board[23] = 1;
    // beide springen hin und her, ohne Mühle
    const hops: [number, number][][] = [[[0, 2], [21, 18]], [[2, 0], [18, 21]]];
    for (let i = 0; i < MILL_DRAW_MOVES / 2; i++) {
      const [[a, b], [c, d]] = hops[i % 2];
      s = millMove(s, a, b)!;
      expect(s.draw).toBe(i * 2 + 1 >= MILL_DRAW_MOVES);
      s = millMove(s, c, d)!;
    }
    expect(s.draw).toBe(true);
    expect(millMove(s, 0, 2)).toBeNull();
  });
});
