import type { Screen } from '../app/screen';
import type { Profile } from '../storage/types';
import { navigate } from '../app/router';
import { icons } from '../ui/icons';
import { lametta } from '../ui/lametta';
import { modeMenuScreen } from '../screens/mode-menu';
import { dayOverScreen } from '../screens/day-over';
import { startTimeLimit } from '../quota/time-limit';
import { paintScreen } from '../paint/paint-screen';
import { labelPos, templateIdOf, type DotPicture } from './pictures';

const NS = 'http://www.w3.org/2000/svg';
/** Fangradius um einen Punkt (in Bildkoordinaten 800 × 600). */
const HIT = 34;
/** Ohne Fortschritt pulsiert nach dieser Zeit der nächste Punkt. */
const HINT_MS = 8000;

const el = <K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number>) => {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  return e;
};

/** Kachelbild: Punkte und ganz zart der Umriss. */
export function dotsPreview(pic: DotPicture): string {
  const d = 'M' + pic.points.map(([x, y]) => `${x} ${y}`).join(' L') + ' Z';
  const dots = pic.points.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="14" fill="#5d4037"/>`).join('');
  return `<svg viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="${d}" fill="none" stroke="#bcaaa4" stroke-width="8" stroke-dasharray="4 22" stroke-linecap="round"/>${dots}</svg>`;
}

/** Punkte verbinden: 1, 2, 3 … nacheinander antippen oder mit dem Finger ziehen. */
export function dotsScreen(profile: Profile, pic: DotPicture): Screen {
  const cleanups: (() => void)[] = [];
  return {
    name: 'dots',
    mount(root) {
      root.classList.add('dots-screen');
      root.dataset.picture = pic.id;
      const home = document.createElement('button');
      home.className = 'icon-btn game-home';
      home.dataset.testid = 'home';
      home.setAttribute('aria-label', 'Zurück');
      home.innerHTML = icons.home;
      home.onclick = () => navigate(modeMenuScreen(profile, 'paint'));

      const card = document.createElement('div');
      card.className = 'dots-card';
      const svg = el('svg', { viewBox: '0 0 800 600', class: 'dots-svg' });
      const extra = el('path', { d: pic.extra, class: 'dots-extra' });
      const lines = el('g', { class: 'dots-lines' });
      const rubber = el('line', { class: 'dots-rubber', x1: 0, y1: 0, x2: 0, y2: 0, visibility: 'hidden' });
      const dotsG = el('g', {});
      const n = pic.points.length;
      const dots = pic.points.map(([x, y], i) => {
        const g = el('g', { class: 'dot' + (i === 0 ? ' start' : ''), 'data-testid': `dot-${i + 1}` });
        const [lx, ly] = labelPos(pic, i);
        g.append(
          el('circle', { cx: x, cy: y, r: HIT, class: 'dot-hit' }),
          el('circle', { cx: x, cy: y, r: 10, class: 'dot-point' }),
        );
        const t = el('text', { x: lx, y: ly, class: 'dot-num', 'text-anchor': 'middle' });
        t.textContent = String(i + 1);
        g.append(t);
        dotsG.append(g);
        return g;
      });
      svg.append(extra, lines, rubber, dotsG);
      card.append(svg);
      root.append(card, home);
      cleanups.push(startTimeLimit(profile, root, () => navigate(dayOverScreen(profile))));

      // reached = Anzahl schon erreichter Punkte (der nächste ist pic.points[reached])
      let reached = 0;
      let done = false;
      let hintTimer = 0;
      const armHint = () => {
        clearTimeout(hintTimer);
        dots.forEach((d) => d.classList.remove('hint'));
        if (!done) hintTimer = window.setTimeout(() => dots[reached]?.classList.add('hint'), HINT_MS);
      };
      cleanups.push(() => clearTimeout(hintTimer));
      armHint();

      const line = (a: [number, number], b: [number, number]) =>
        lines.append(el('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1] }));

      const toSvg = (e: PointerEvent): [number, number] | null => {
        const m = svg.getScreenCTM();
        if (!m) return null;
        const p = svg.createSVGPoint();
        p.x = e.clientX;
        p.y = e.clientY;
        const q = p.matrixTransform(m.inverse());
        return [q.x, q.y];
      };

      const finish = () => {
        done = true;
        line(pic.points[n - 1], pic.points[0]);
        rubber.setAttribute('visibility', 'hidden');
        card.classList.add('done');
        root.dataset.done = 'true';
        lametta(root);
        const t = window.setTimeout(() => {
          if (!root.isConnected) return;
          const over = document.createElement('div');
          over.className = 'dots-done';
          over.dataset.testid = 'dots-done';
          const color = document.createElement('button');
          color.className = 'icon-btn big';
          color.dataset.testid = 'dots-color';
          color.setAttribute('aria-label', 'Ausmalen');
          color.innerHTML = icons.brush;
          color.onclick = () => navigate(paintScreen({ profile, modeId: 'coloring', templateId: templateIdOf(pic) }));
          const back = document.createElement('button');
          back.className = 'icon-btn big';
          back.dataset.testid = 'dots-home';
          back.setAttribute('aria-label', 'Zurück');
          back.innerHTML = icons.home;
          back.onclick = home.onclick;
          over.append(color, back);
          root.append(over);
        }, 1600);
        cleanups.push(() => clearTimeout(t));
      };

      const check = (pt: [number, number]) => {
        if (done) return;
        const [x, y] = pic.points[reached];
        if (Math.hypot(pt[0] - x, pt[1] - y) > HIT) return;
        if (reached > 0) line(pic.points[reached - 1], pic.points[reached]);
        dots[reached].classList.add('reached');
        reached++;
        root.dataset.reached = String(reached);
        armHint();
        if (reached === n) finish();
      };

      let active = false;
      const rubberTo = (pt: [number, number]) => {
        if (done || reached === 0) return;
        const [x, y] = pic.points[reached - 1];
        rubber.setAttribute('x1', String(x));
        rubber.setAttribute('y1', String(y));
        rubber.setAttribute('x2', String(pt[0]));
        rubber.setAttribute('y2', String(pt[1]));
        rubber.setAttribute('visibility', 'visible');
      };
      svg.addEventListener('pointerdown', (e) => {
        active = true;
        svg.setPointerCapture?.(e.pointerId);
        const pt = toSvg(e);
        if (pt) check(pt);
      });
      svg.addEventListener('pointermove', (e) => {
        if (!active) return;
        const pt = toSvg(e);
        if (!pt) return;
        check(pt);
        rubberTo(pt);
      });
      const up = () => {
        active = false;
        rubber.setAttribute('visibility', 'hidden');
      };
      svg.addEventListener('pointerup', up);
      svg.addEventListener('pointercancel', up);
    },
    unmount() {
      cleanups.forEach((c) => c());
    },
  };
}
