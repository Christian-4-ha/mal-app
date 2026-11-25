import type { Screen } from '../app/screen';
import type { Profile } from '../storage/types';
import { navigate } from '../app/router';
import { icons } from '../ui/icons';
import { modeMenuScreen } from '../screens/mode-menu';
import { dayOverScreen } from '../screens/day-over';
import { startTimeLimit } from '../quota/time-limit';
import { PIECE_COUNTS, makeEdges, piecePath, shouldSnap } from './jigsaw';
import type { Motif } from './motifs';

interface Piece {
  el: HTMLCanvasElement;
  /** richtige Position (linke obere Ecke der Leinwand) in CSS-Pixeln */
  hx: number;
  hy: number;
  x: number;
  y: number;
  placed: boolean;
}

/** Kachel-Symbol für eine Teilezahl: kleines Raster mit Zahl. */
function countIcon(cols: number, rows: number, count: number): string {
  const w = 52 / cols;
  const h = 36 / rows;
  let cells = '';
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      cells += `<rect x="${6 + c * w}" y="${6 + r * h}" width="${w}" height="${h}" fill="${(r + c) % 2 ? '#a5d6a7' : '#81c784'}" stroke="#2e7d32" stroke-width="0.8"/>`;
  return `<svg viewBox="0 0 64 64" aria-hidden="true">${cells}<text x="32" y="60" text-anchor="middle" font-size="14" font-weight="700" fill="#2e7d32">${count}</text></svg>`;
}

function button(icon: string, label: string, testid: string, cls = 'icon-btn'): HTMLButtonElement {
  const b = document.createElement('button');
  b.className = cls;
  b.innerHTML = icon;
  b.setAttribute('aria-label', label);
  b.dataset.testid = testid;
  return b;
}

export function puzzleScreen(profile: Profile, motif: Motif): Screen {
  const cleanups: (() => void)[] = [];
  return {
    name: 'puzzle',
    mount(root) {
      root.classList.add('puzzle-screen');
      const home = button(icons.home, 'Zurück', 'home', 'icon-btn game-home');
      home.onclick = () => navigate(modeMenuScreen(profile));
      const table = document.createElement('div');
      table.className = 'puzzle-table';
      root.append(table, home);
      cleanups.push(startTimeLimit(profile, root, () => navigate(dayOverScreen(profile))));

      let image: HTMLCanvasElement | null = null;
      const imageReady = motif.load().then(
        (c) => (image = c),
        (e) => console.error('Puzzlebild', e),
      );

      let pending = false;
      const chooseCount = () => {
        table.replaceChildren();
        root.dataset.state = 'choose';
        const pick = document.createElement('div');
        pick.className = 'count-pick';
        for (const pc of PIECE_COUNTS) {
          const b = button(countIcon(pc.cols, pc.rows, pc.count), `${pc.count} Teile`, `pieces-${pc.count}`, 'tile');
          b.onclick = async () => {
            if (pending) return; // doppeltes Tippen baut nicht zweimal
            pending = true;
            await imageReady;
            pending = false;
            if (image && root.isConnected && root.dataset.state === 'choose') build(pc.cols, pc.rows);
          };
          pick.append(b);
        }
        table.append(pick);
      };

      const build = (cols: number, rows: number) => {
        cleanupPlay();
        table.replaceChildren();
        root.dataset.state = 'play';
        const img = image!;
        const W = table.clientWidth;
        const H = table.clientHeight;
        // Brett links (Platz für den Zurück-Knopf oben), Teile liegen rechts daneben
        const k = Math.min((W * 0.56) / img.width, (H * 0.8) / img.height);
        const bw = img.width * k;
        const bh = img.height * k;
        const bx = W * 0.03;
        const by = Math.max(100, (H - bh) / 2);
        const boardEl = document.createElement('div');
        boardEl.className = 'puzzle-board';
        Object.assign(boardEl.style, { left: `${bx}px`, top: `${by}px`, width: `${bw}px`, height: `${bh}px` });
        const ghost = document.createElement('canvas');
        ghost.width = img.width;
        ghost.height = img.height;
        ghost.getContext('2d')!.drawImage(img, 0, 0);
        ghost.className = 'puzzle-ghost';
        boardEl.append(ghost);
        table.append(boardEl);

        const pw = bw / cols;
        const ph = bh / rows;
        const tab = Math.min(pw, ph) * 0.24;
        const m = tab + 2; // Rand um den Körper für Nasen und Kontur
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const edges = makeEdges(cols, rows);
        const pieces: Piece[] = [];
        let z = 10;

        for (let r = 0; r < rows; r++)
          for (let c = 0; c < cols; c++) {
            const el = document.createElement('canvas');
            const cw = pw + 2 * m;
            const ch = ph + 2 * m;
            el.width = Math.ceil(cw * dpr);
            el.height = Math.ceil(ch * dpr);
            el.style.width = `${cw}px`;
            el.style.height = `${ch}px`;
            el.className = 'puzzle-piece';
            el.dataset.testid = 'puzzle-piece';
            el.dataset.home = `${Math.round(bx + c * pw - m)},${Math.round(by + r * ph - m)}`;
            const ctx = el.getContext('2d')!;
            ctx.scale(dpr, dpr);
            piecePath(ctx, m, m, pw, ph, edges[r * cols + c], tab);
            ctx.save();
            ctx.clip();
            // Bildausschnitt: Bild in Brettgröße, so verschoben, dass Teil (r, c) im Körper liegt
            ctx.drawImage(img, m - c * pw, m - r * ph, bw, bh);
            ctx.restore();
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = 'rgba(0,0,0,.35)';
            ctx.stroke();
            const hx = bx + c * pw - m;
            const hy = by + r * ph - m;
            pieces.push({ el, hx, hy, x: 0, y: 0, placed: false });
            table.append(el);
          }

        // Teile rund ums Brett verteilen (links, rechts, unten), zufällige Reihenfolge
        const spots: [number, number][] = [];
        const cw = pw + 2 * m;
        const ch = ph + 2 * m;
        const free = (x0: number, x1: number, y0: number, y1: number) => {
          for (let i = 0; i < pieces.length; i++)
            spots.push([x0 + Math.random() * Math.max(0, x1 - x0 - cw), y0 + Math.random() * Math.max(0, y1 - y0 - ch)]);
        };
        free(Math.min(bx + bw + 10, W - cw), W, 0, H);
        const order = pieces.map((_, i) => i).sort(() => Math.random() - 0.5);
        pieces.forEach((p, i) => {
          const [x, y] = spots[order[i]];
          move(p, Math.min(Math.max(0, x), W - cw * 0.5), Math.min(Math.max(0, y), H - ch * 0.5));
          p.el.style.zIndex = String(z++);
        });

        function move(p: Piece, x: number, y: number) {
          p.x = x;
          p.y = y;
          p.el.style.transform = `translate(${x}px, ${y}px)`;
        }

        // Treffertest über die Pixel: Nasen-Ränder sind durchsichtig und gehören nicht zum Teil
        const hit = (x: number, y: number): Piece | null => {
          const loose = pieces.filter((p) => !p.placed).sort((a, b) => Number(b.el.style.zIndex) - Number(a.el.style.zIndex));
          for (const p of loose) {
            const lx = x - p.x;
            const ly = y - p.y;
            if (lx < 0 || ly < 0 || lx >= cw || ly >= ch) continue;
            const a = p.el.getContext('2d')!.getImageData(Math.floor(lx * dpr), Math.floor(ly * dpr), 1, 1).data[3];
            if (a > 0) return p;
          }
          return null;
        };

        let drag: { p: Piece; dx: number; dy: number; id: number } | null = null;
        const local = (e: PointerEvent) => {
          const r = table.getBoundingClientRect();
          return [e.clientX - r.left, e.clientY - r.top] as const;
        };
        const onDown = (e: PointerEvent) => {
          if (drag) return;
          const [x, y] = local(e);
          const p = hit(x, y);
          if (!p) return;
          drag = { p, dx: x - p.x, dy: y - p.y, id: e.pointerId };
          p.el.style.zIndex = String(z++);
          p.el.classList.add('dragging');
          table.setPointerCapture?.(e.pointerId);
        };
        const onMove = (e: PointerEvent) => {
          if (!drag || e.pointerId !== drag.id) return;
          const [x, y] = local(e);
          move(drag.p, x - drag.dx, y - drag.dy);
        };
        const onUp = (e: PointerEvent) => {
          if (!drag || e.pointerId !== drag.id) return;
          const p = drag.p;
          drag = null;
          p.el.classList.remove('dragging');
          if (shouldSnap(p.x - p.hx, p.y - p.hy, pw)) {
            move(p, p.hx, p.hy);
            p.placed = true;
            p.el.classList.add('placed');
            p.el.style.zIndex = '1';
            if (pieces.every((q) => q.placed)) done();
          } else if (p.x + m < 100 && p.y + m < 100) {
            // nicht unter dem Zurück-Knopf liegen lassen
            move(p, p.x, 100 - m);
          }
        };
        table.addEventListener('pointerdown', onDown);
        table.addEventListener('pointermove', onMove);
        table.addEventListener('pointerup', onUp);
        table.addEventListener('pointercancel', onUp);
        cleanupPlay = () => {
          table.removeEventListener('pointerdown', onDown);
          table.removeEventListener('pointermove', onMove);
          table.removeEventListener('pointerup', onUp);
          table.removeEventListener('pointercancel', onUp);
        };
      };
      let cleanupPlay = () => {};

      const done = () => {
        cleanupPlay();
        root.dataset.state = 'done';
        const over = document.createElement('div');
        over.className = 'game-over puzzle-done';
        over.dataset.testid = 'puzzle-done';
        const ok = document.createElement('span');
        ok.className = 'done-check';
        ok.innerHTML = icons.check;
        const again = button(icons.replay, 'Nochmal', 'puzzle-replay', 'icon-btn big');
        again.onclick = () => {
          over.remove();
          chooseCount();
        };
        const back = button(icons.home, 'Zurück', 'game-over-home');
        back.onclick = () => navigate(modeMenuScreen(profile));
        over.append(ok, again, back);
        const colors = ['#e53935', '#fbc02d', '#43a047', '#1e88e5', '#8e24aa'];
        for (let i = 0; i < 50; i++) {
          const c = document.createElement('span');
          c.className = 'confetti';
          c.style.left = `${Math.random() * 100}%`;
          c.style.background = colors[i % colors.length];
          c.style.animationDelay = `${Math.random() * 0.8}s`;
          over.append(c);
        }
        setTimeout(() => root.isConnected && root.append(over), 400);
      };

      chooseCount();
      cleanups.push(() => cleanupPlay());
    },
    unmount() {
      cleanups.forEach((c) => c());
    },
  };
}
