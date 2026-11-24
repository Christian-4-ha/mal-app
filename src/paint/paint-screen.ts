import type { Screen } from '../app/screen';
import type { Picture, Profile } from '../storage/types';
import { navigate } from '../app/router';
import { icons } from '../ui/icons';
import { listTools } from '../tools/registry';
import type { Tool, ToolContext, StrokePoint } from '../tools/types';
import { BASIC_COLORS } from './colors';
import { createHistory } from './history';
import { createPaintSurface, type PaintSurface } from './paint-surface';
import { createPointerRouter, type RouterEvent } from './pointer-router';
import { createSizeControl } from './size-control';
import { IDENTITY, pinch, screenToCanvas, type Pt } from './view-transform';
import { modeMenuScreen } from '../screens/mode-menu';
import { openVariantPopup } from './variant-popup';

export interface PaintScreenOptions {
  profile: Profile;
  modeId: string;
  picture?: Picture;
}

function iconButton(icon: string, label: string, testid: string): HTMLButtonElement {
  const b = document.createElement('button');
  b.className = 'icon-btn';
  b.innerHTML = icon;
  b.setAttribute('aria-label', label);
  b.dataset.testid = testid;
  return b;
}

export function paintScreen(opts: PaintScreenOptions): Screen {
  const cleanups: (() => void)[] = [];

  return {
    name: 'paint',
    mount(root) {
      root.classList.add('paint-screen');
      const area = document.createElement('div');
      area.className = 'paint-area';
      const colorCol = document.createElement('div');
      colorCol.className = 'color-column';
      const toolCol = document.createElement('div');
      toolCol.className = 'tool-column';
      root.append(area, colorCol, toolCol);

      const surface: PaintSurface = createPaintSurface(area);
      const pctx = surface.paint.getContext('2d')!;
      const octx = surface.overlay.getContext('2d')!;
      const history = createHistory<ImageData>(20);

      // --- Zustand ---
      const tools = listTools();
      let tool: Tool = tools[0];
      let color = BASIC_COLORS[0];
      const sizes = new Map<string, number>(tools.map((t) => [t.id, t.defaultSize]));
      const variants = new Map<string, string | null>(tools.map((t) => [t.id, t.variants?.[0]?.id ?? null]));
      let zoom = false;

      // --- Untere Knopfleiste ---
      const bar = document.createElement('div');
      bar.className = 'paint-bar';
      const home = iconButton(icons.home, 'Zurück', 'home');
      const undo = iconButton(icons.undo, 'Rückgängig', 'undo');
      const clear = iconButton(icons.clear, 'Leeren', 'clear');
      const zoomBtn = iconButton(icons.zoom, 'Zoom', 'zoom');
      bar.append(home, undo, clear, zoomBtn);
      area.append(bar);

      const updateUndo = () => undo.setAttribute('aria-disabled', String(!history.canUndo()));
      const changed = () => {
        updateUndo();
        root.dispatchEvent(new CustomEvent('paint-change'));
      };

      home.onclick = () => navigate(modeMenuScreen(opts.profile));
      undo.onclick = () => {
        const s = history.undo();
        if (s) {
          surface.restore(s);
          changed();
        }
      };
      clear.onclick = () => {
        history.push(surface.snapshot());
        surface.clear();
        changed();
      };
      zoomBtn.onclick = () => {
        zoom = !zoom;
        zoomBtn.classList.toggle('active', zoom);
        if (!zoom) surface.setView(IDENTITY);
      };

      // --- Farben ---
      const rainbow = iconButton(icons.rainbow, 'Mehr Farben', 'rainbow');
      rainbow.classList.add('swatch-btn');
      const custom = document.createElement('button');
      custom.className = 'swatch custom';
      custom.dataset.testid = 'custom-color';
      custom.hidden = true;
      colorCol.append(rainbow, custom);
      const swatches: HTMLButtonElement[] = [];
      const addSwatch = (c: string, el = document.createElement('button')) => {
        el.classList.add('swatch');
        el.style.background = c;
        el.dataset.color = c;
        el.onclick = () => selectColor(c);
        swatches.push(el);
        return el;
      };
      for (const c of BASIC_COLORS) colorCol.append(addSwatch(c));
      const sizeCtl = createSizeControl((s) => {
        sizes.set(tool.id, s);
      });
      colorCol.append(sizeCtl.el);

      // --- Werkzeuge ---
      const toolButtons = new Map<string, HTMLButtonElement>();
      for (const t of tools) {
        const b = document.createElement('button');
        b.className = 'tool-btn';
        b.dataset.tool = t.id;
        b.dataset.testid = 'tool-' + t.id;
        b.setAttribute('aria-label', t.id);
        b.innerHTML = t.icon;
        if (t.variants) {
          const badge = document.createElement('span');
          badge.className = 'variant-badge';
          b.append(badge);
        }
        let held = false;
        let holdTimer = 0;
        b.onpointerdown = () => {
          held = false;
          if (!t.variants) return;
          holdTimer = window.setTimeout(() => {
            held = true;
            selectTool(t);
            openVariantPopup(b, t.variants!, variants.get(t.id) ?? null, color, (id) => {
              variants.set(t.id, id);
              refresh();
            });
          }, 400);
        };
        b.onpointerup = b.onpointerleave = b.onpointercancel = () => clearTimeout(holdTimer);
        b.onclick = () => {
          if (!held) selectTool(t);
        };
        toolButtons.set(t.id, b);
        toolCol.append(b);
      }

      const refresh = () => {
        for (const [id, b] of toolButtons) {
          b.classList.toggle('active', id === tool.id);
          const badge = b.querySelector('.variant-badge');
          const v = tools.find((x) => x.id === id)?.variants?.find((x) => x.id === variants.get(id));
          if (badge && v) badge.innerHTML = v.icon;
        }
        for (const s of swatches) s.classList.toggle('active', s.dataset.color === color);
        toolCol.style.color = color;
        sizeCtl.set(sizes.get(tool.id) ?? tool.defaultSize, color, tool.minSize, tool.maxSize);
      };
      function selectTool(t: Tool) {
        tool = t;
        refresh();
      }
      function selectColor(c: string) {
        color = c;
        refresh();
      }
      refresh();

      // --- Malen ---
      const route = createPointerRouter(() => zoom);
      let prevPts: [Pt, Pt] | null = null;
      let drawing = false;
      let strokeCtx: ToolContext | null = null;

      const toCanvas = (x: number, y: number, e: PointerEvent): StrokePoint => {
        const c = screenToCanvas(surface.view(), x, y);
        return {
          x: c.x * surface.ratio,
          y: c.y * surface.ratio,
          pressure: e.pointerType === 'pen' ? e.pressure || 0.5 : 0.5,
          t: e.timeStamp,
        };
      };

      const handle = (kind: RouterEvent['kind'], e: PointerEvent) => {
        const r = surface.viewport.getBoundingClientRect();
        const x = e.clientX - r.left;
        const y = e.clientY - r.top;
        const type = (e.pointerType || 'mouse') as RouterEvent['type'];
        const a = route({ kind, id: e.pointerId, type, x, y });
        switch (a.do) {
          case 'strokeStart': {
            history.push(surface.snapshot());
            const useOverlay = tool.overlayAlpha !== undefined;
            if (useOverlay) surface.overlay.style.opacity = String(tool.overlayAlpha);
            strokeCtx = {
              ctx: useOverlay ? octx : pctx,
              color,
              size: (sizes.get(tool.id) ?? tool.defaultSize) * surface.ratio,
              variant: variants.get(tool.id) ?? null,
            };
            drawing = true;
            tool.begin(strokeCtx, toCanvas(x, y, e));
            break;
          }
          case 'strokeMove': {
            if (!drawing || !strokeCtx) break;
            const events = e.getCoalescedEvents?.() ?? [];
            for (const ce of events.length ? events : [e]) {
              tool.move(strokeCtx, toCanvas(ce.clientX - r.left, ce.clientY - r.top, ce));
            }
            break;
          }
          case 'strokeEnd':
          case 'strokeAbort': {
            if (!drawing || !strokeCtx) break;
            tool.end(strokeCtx);
            if (tool.overlayAlpha !== undefined) surface.commitOverlay(tool.overlayAlpha);
            drawing = false;
            strokeCtx = null;
            if (a.do === 'strokeAbort') {
              const s = history.undo();
              if (s) surface.restore(s);
              updateUndo();
            } else {
              changed();
            }
            break;
          }
          case 'gesture':
            if (prevPts) surface.setView(pinch(surface.view(), prevPts, a.points, surface.bounds));
            prevPts = a.points;
            break;
          case 'gestureEnd':
            prevPts = null;
            break;
        }
      };

      const vp = surface.viewport;
      const onDown = (e: PointerEvent) => {
        vp.setPointerCapture?.(e.pointerId);
        handle('down', e);
      };
      const onMove = (e: PointerEvent) => handle('move', e);
      const onUp = (e: PointerEvent) => handle('up', e);
      const onCancel = (e: PointerEvent) => handle('cancel', e);
      vp.addEventListener('pointerdown', onDown);
      vp.addEventListener('pointermove', onMove);
      vp.addEventListener('pointerup', onUp);
      vp.addEventListener('pointercancel', onCancel);
      cleanups.push(() => {
        if (drawing && strokeCtx) tool.end(strokeCtx); // z. B. Sprüh-Timer stoppen
        vp.removeEventListener('pointerdown', onDown);
        vp.removeEventListener('pointermove', onMove);
        vp.removeEventListener('pointerup', onUp);
        vp.removeEventListener('pointercancel', onCancel);
      });

      updateUndo();
      if (opts.picture) surface.loadImage(opts.picture.paint).catch((e) => console.error(e));
    },
    unmount() {
      cleanups.forEach((c) => c());
    },
  };
}
