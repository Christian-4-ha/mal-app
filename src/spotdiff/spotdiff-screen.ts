import type { Screen } from '../app/screen';
import type { Profile } from '../storage/types';
import { navigate } from '../app/router';
import { icons } from '../ui/icons';
import { lametta } from '../ui/lametta';
import { modeMenuScreen } from '../screens/mode-menu';
import { dayOverScreen } from '../screens/day-over';
import { startTimeLimit } from '../quota/time-limit';
import { circledDiffs, type Pt } from './logic';
import { SCENES, sceneSvg, type Scene } from './scenes';

const NS = 'http://www.w3.org/2000/svg';
/** Nach dieser Zeit erscheint der Hilfe-Knopf. */
const HELP_MS = 30000;

/** Kachelbild: das linke Bild verkleinert. */
export function scenePreview(scene: Scene): string {
  return `<svg viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${sceneSvg(scene, 'left')}</svg>`;
}

/** Fehler finden: links das Original, rechts 5 Unterschiede; mit dem Finger einkreisen. */
export function spotDiffScreen(profile: Profile, scene: Scene): Screen {
  const cleanups: (() => void)[] = [];
  return {
    name: 'spotdiff',
    mount(root) {
      root.classList.add('spotdiff-screen');
      root.dataset.scene = scene.id;
      const home = document.createElement('button');
      home.className = 'icon-btn game-home';
      home.dataset.testid = 'home';
      home.setAttribute('aria-label', 'Zurück');
      home.innerHTML = icons.home;
      home.onclick = () => navigate(modeMenuScreen(profile, 'play'));

      // Fortschritt: fünf Kästchen, gefundene bekommen einen Stern
      const progress = document.createElement('div');
      progress.className = 'diff-progress';
      const boxes = scene.diffs.map(() => {
        const b = document.createElement('span');
        b.className = 'diff-box';
        progress.append(b);
        return b;
      });

      const help = document.createElement('button');
      help.className = 'icon-btn diff-help';
      help.dataset.testid = 'diff-help';
      help.setAttribute('aria-label', 'Hilfe');
      help.innerHTML = icons.bulb;
      const helpTimer = window.setTimeout(() => help.classList.add('show'), HELP_MS);
      cleanups.push(() => clearTimeout(helpTimer));

      const panel = (side: 'left' | 'right') => {
        const svg = document.createElementNS(NS, 'svg');
        svg.setAttribute('viewBox', '0 0 800 600');
        svg.setAttribute('class', 'diff-panel');
        svg.dataset.testid = 'diff-' + side;
        svg.innerHTML = sceneSvg(scene, side) + '<g class="marks"></g><path class="diff-stroke" d=""/>';
        return svg;
      };
      const panels = [panel('left'), panel('right')];
      const pair = document.createElement('div');
      pair.className = 'diff-pair';
      pair.append(...panels);
      root.append(progress, pair, home, help);
      cleanups.push(startTimeLimit(profile, root, () => navigate(dayOverScreen(profile))));

      const found: number[] = [];
      root.dataset.found = '0';
      const mark = (i: number, cls: string) => {
        const d = scene.diffs[i];
        for (const p of panels) {
          const c = document.createElementNS(NS, 'circle');
          c.setAttribute('cx', String(d.x));
          c.setAttribute('cy', String(d.y));
          c.setAttribute('r', String(d.r + 6));
          c.setAttribute('class', cls);
          c.dataset.diff = String(i);
          p.querySelector('.marks')!.append(c);
        }
      };

      const win = () => {
        root.dataset.done = 'true';
        clearTimeout(helpTimer);
        help.classList.remove('show');
        lametta(root);
        const t = window.setTimeout(() => {
          if (!root.isConnected) return;
          const over = document.createElement('div');
          over.className = 'dots-done';
          over.dataset.testid = 'diff-done';
          const again = document.createElement('button');
          again.className = 'icon-btn big';
          again.dataset.testid = 'diff-next';
          again.setAttribute('aria-label', 'Nächstes Bild');
          again.innerHTML = icons.replay;
          const next = SCENES[(SCENES.indexOf(scene) + 1) % SCENES.length];
          again.onclick = () => navigate(spotDiffScreen(profile, next));
          const back = document.createElement('button');
          back.className = 'icon-btn big';
          back.dataset.testid = 'diff-home';
          back.setAttribute('aria-label', 'Zurück');
          back.innerHTML = icons.home;
          back.onclick = home.onclick;
          over.append(again, back);
          root.append(over);
        }, 1600);
        cleanups.push(() => clearTimeout(t));
      };

      help.onclick = () => {
        scene.diffs.forEach((_, i) => {
          if (!found.includes(i) && !panels[0].querySelector(`.hint[data-diff="${i}"]`)) mark(i, 'hint');
        });
      };

      // Einkreisen mit dem Finger (in beiden Bildern möglich)
      for (const svg of panels) {
        const strokeEl = svg.querySelector<SVGPathElement>('.diff-stroke')!;
        let pts: Pt[] = [];
        // nur der erste Finger zeichnet (ein aufgelegter Handballen stört nicht)
        let active: number | null = null;
        const toSvg = (e: PointerEvent): Pt | null => {
          const m = svg.getScreenCTM();
          if (!m) return null;
          const p = svg.createSVGPoint();
          p.x = e.clientX;
          p.y = e.clientY;
          const q = p.matrixTransform(m.inverse());
          return { x: q.x, y: q.y };
        };
        const draw = () =>
          strokeEl.setAttribute('d', pts.length ? 'M' + pts.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' L') : '');
        svg.addEventListener('pointerdown', (e) => {
          if (root.dataset.done || active !== null) return;
          active = e.pointerId;
          svg.setPointerCapture?.(e.pointerId);
          strokeEl.classList.remove('fade');
          const p = toSvg(e);
          pts = p ? [p] : [];
          draw();
        });
        svg.addEventListener('pointermove', (e) => {
          if (e.pointerId !== active) return;
          const p = toSvg(e);
          if (p) pts.push(p);
          draw();
        });
        const end = (e: PointerEvent) => {
          if (e.pointerId !== active) return;
          active = null;
          const hits = circledDiffs(pts, scene.diffs, found);
          for (const i of hits) {
            found.push(i);
            panels.forEach((p) => p.querySelector(`.hint[data-diff="${i}"]`)?.remove());
            mark(i, 'found');
            boxes[found.length - 1].classList.add('found');
          }
          root.dataset.found = String(found.length);
          if (hits.length) {
            pts = [];
            draw();
          } else {
            // daneben: Kreis verblasst
            strokeEl.classList.add('fade');
          }
          if (found.length === scene.diffs.length) win();
        };
        svg.addEventListener('pointerup', end);
        svg.addEventListener('pointercancel', end);
      }
    },
    unmount() {
      cleanups.forEach((c) => c());
    },
  };
}
