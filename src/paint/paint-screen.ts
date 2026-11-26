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
import { openPalettePopup } from './palette-popup';
import { createSaveController } from './save-controller';
import { createPicture, overwritePicture } from '../storage/pictures';
import { clampRect, growRect, type Rect } from './rect';
import { strokeWidthOnCanvas } from './size-drag';
import { showSaveToast } from './save-toast';
import { getTemplateSource } from '../templates';
import { svgToImage } from '../templates/svg-image';
import { startTimeLimit } from '../quota/time-limit';
import { applyMat, invertMat, mandalaAxes, matBounds, symmetryMatrices, unionRect } from './symmetry';
import { dayOverScreen } from '../screens/day-over';

export interface PaintScreenOptions {
  profile: Profile;
  modeId: string;
  picture?: Picture;
  /** Ausmalen: Vorlage (bei picture wird dessen templateId genutzt). */
  templateId?: string;
}

/** Rückgängig-Eintrag: nur der veränderte Ausschnitt vor der Änderung. */
interface UndoEntry {
  rect: Rect;
  data: ImageData;
}

const UNDO_MAX_STEPS = 20;
const UNDO_MAX_BYTES = 60 * 1024 * 1024; // altes iPad: Speicher schonen
const IDLE_SAVE_MS = 4000;

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
  let leave: () => Promise<boolean> = async () => true;

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

      const templateId = opts.templateId ?? opts.picture?.templateId ?? null;
      const surface: PaintSurface = createPaintSurface(area);
      // Bis Vorlage und Bild geladen sind, ist Malen gesperrt (sonst landet ein Strich unter dem Bild)
      let ready = false;
      root.dataset.ready = 'false';
      const pctx = surface.paint.getContext('2d')!;
      const octx = surface.overlay.getContext('2d')!;
      const W = surface.paint.width;
      const H = surface.paint.height;
      // Kopie der Malebene vom Strichbeginn (GPU-Kopie statt getImageData der ganzen Fläche)
      const base = document.createElement('canvas');
      base.width = W;
      base.height = H;
      const bctx = base.getContext('2d', { willReadFrequently: true })!;
      // Mandala: Strich entsteht auf einer Hilfsebene und wird 2n-fach gespiegelt übertragen
      const axes = mandalaAxes(opts.modeId);
      const mirrors = axes ? symmetryMatrices(axes, W / 2, H / 2) : null;
      const scratch = mirrors ? document.createElement('canvas') : null;
      if (scratch) {
        scratch.width = W;
        scratch.height = H;
        drawGuides(surface.addGuides(), axes);
      }
      const sctx = scratch?.getContext('2d') ?? null;
      let dirty: Rect | null = null;
      let frame = 0;
      const history = createHistory<UndoEntry>(UNDO_MAX_STEPS, {
        maxBytes: UNDO_MAX_BYTES,
        sizeOf: (e) => e.data.data.length,
      });

      // --- Zustand ---
      const tools = listTools();
      let tool: Tool = tools[0];
      let color = BASIC_COLORS[0];
      let glitter = false;
      const sizes = new Map<string, number>(tools.map((t) => [t.id, t.defaultSize]));
      const variants = new Map<string, string | null>(tools.map((t) => [t.id, t.variants?.[0]?.id ?? null]));
      let zoom = false;

      // --- Untere Knopfleiste ---
      const bar = document.createElement('div');
      bar.className = 'paint-bar';
      const home = iconButton(icons.home, 'Zurück', 'home');
      const undo = iconButton(icons.undo, 'Rückgängig', 'undo');
      const clear = iconButton(icons.clear, 'Leeren', 'clear');
      const saveBtn = iconButton(icons.save, 'Speichern', 'save');
      const zoomBtn = iconButton(icons.zoom, 'Zoom', 'zoom');
      bar.append(home, undo, clear, saveBtn, zoomBtn);
      area.append(bar);

      // --- Speichern ---
      const saver = createSaveController({
        profileId: opts.profile.id,
        modeId: opts.modeId,
        templateId,
        existing: opts.picture ?? null,
        getBlobs: () => surface.toBlobs(),
        isBlank: () => surface.isBlank(),
        store: { createPicture, overwritePicture },
      });
      let idleTimer = 0;
      const doSave = async () => {
        clearTimeout(idleTimer);
        const r = await saver.save();
        if (r === 'error') {
          saveBtn.innerHTML = icons.saveError;
          saveBtn.dataset.state = 'error';
        } else if (r === 'saved') {
          saveBtn.innerHTML = icons.save;
          saveBtn.dataset.state = 'saved';
          saveBtn.classList.remove('saved-anim');
          void saveBtn.offsetWidth; // Animation neu starten
          saveBtn.classList.add('saved-anim');
        }
        return r;
      };
      // Sichtbare Bestätigung beim bewussten Speichern (Feedback)
      saveBtn.onclick = async () => {
        if ((await doSave()) !== 'error') showSaveToast(area);
      };

      const updateUndo = () => undo.setAttribute('aria-disabled', String(!history.canUndo()));
      const changed = () => {
        updateUndo();
        saver.markDirty();
        // Automatisch speichern, sobald eine kurze Pause entsteht (schützt bei Absturz/Beenden der App)
        clearTimeout(idleTimer);
        idleTimer = window.setTimeout(() => void doSave(), IDLE_SAVE_MS);
      };

      home.onclick = () => navigate(modeMenuScreen(opts.profile, 'paint'));
      undo.onclick = () => {
        const e = history.undo();
        if (e) {
          pctx.putImageData(e.data, e.rect.x, e.rect.y);
          changed();
        }
      };
      clear.onclick = () => {
        history.push({ rect: { x: 0, y: 0, w: W, h: H }, data: pctx.getImageData(0, 0, W, H) });
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
      const sizeCtl = createSizeControl((s) => {
        sizes.set(tool.id, s);
      });
      // Regenbogen und Größen-Punkt stehen fest oben; darunter scrollen eigene Farbe und Grundfarben
      const fixed = document.createElement('div');
      fixed.className = 'color-fixed';
      const sep = document.createElement('span');
      sep.className = 'color-sep';
      fixed.append(rainbow, sizeCtl.el, sep);
      const scroll = document.createElement('div');
      scroll.className = 'color-scroll';
      colorCol.append(fixed, scroll);
      scroll.append(custom);
      const swatches: HTMLButtonElement[] = [];
      const addSwatch = (c: string) => {
        const el = document.createElement('button');
        el.classList.add('swatch');
        el.style.background = c;
        el.dataset.color = c;
        el.onclick = () => selectColor(c, false);
        swatches.push(el);
        return el;
      };
      for (const c of BASIC_COLORS) scroll.append(addSwatch(c));
      // Zuletzt frei gewählte Farbe (nur in diesem Malbildschirm)
      rainbow.onclick = () =>
        openPalettePopup(color, glitter, (c, g) => {
          custom.hidden = false;
          custom.style.backgroundColor = c;
          custom.dataset.color = c;
          custom.classList.toggle('glitter', g);
          custom.onclick = () => selectColor(c, g);
          if (!swatches.includes(custom)) swatches.push(custom);
          selectColor(c, g);
        });

      // --- Werkzeuge ---
      const toolButtons = new Map<string, HTMLButtonElement>();
      for (const t of tools) {
        const b = document.createElement('button');
        b.className = 'tool-btn';
        b.dataset.tool = t.id;
        b.dataset.testid = 'tool-' + t.id;
        b.setAttribute('aria-label', t.id);
        b.innerHTML = t.icon;
        const openVariants = () => {
          selectTool(t);
          openVariantPopup(b, t.variants!, variants.get(t.id) ?? null, color, (id) => {
            variants.set(t.id, id);
            refresh();
          });
        };
        let wrap: HTMLElement = b;
        if (t.variants) {
          // Feld zeigt das gewählte Motiv; daneben ein großer Wechsel-Knopf (zwei Pfeile)
          wrap = document.createElement('div');
          wrap.className = 'tool-wrap';
          const sw = document.createElement('button');
          sw.className = 'variant-switch';
          sw.dataset.testid = 'variant-switch-' + t.id;
          sw.setAttribute('aria-label', 'Wechseln');
          sw.innerHTML = icons.swap;
          sw.onclick = (e) => {
            e.stopPropagation();
            openVariants();
          };
          wrap.append(b, sw);
        }
        let held = false;
        let holdTimer = 0;
        b.onpointerdown = () => {
          held = false;
          if (!t.variants) return;
          holdTimer = window.setTimeout(() => {
            held = true;
            openVariants();
          }, 400);
        };
        b.onpointerup = b.onpointerleave = b.onpointercancel = () => clearTimeout(holdTimer);
        b.onclick = () => {
          if (!held) selectTool(t);
        };
        toolButtons.set(t.id, b);
        toolCol.append(wrap);
      }

      const refresh = () => {
        for (const [id, b] of toolButtons) {
          b.classList.toggle('active', id === tool.id);
          const v = tools.find((x) => x.id === id)?.variants?.find((x) => x.id === variants.get(id));
          if (v && b.dataset.variant !== v.id) {
            b.innerHTML = v.icon;
            b.dataset.variant = v.id;
          }
        }
        for (const s of swatches)
          s.classList.toggle('active', s.dataset.color === color && s.classList.contains('glitter') === glitter);
        toolCol.style.color = color;
        sizeCtl.set(sizes.get(tool.id) ?? tool.defaultSize, color, tool.minSize, tool.maxSize);
      };
      function selectTool(t: Tool) {
        tool = t;
        refresh();
      }
      function selectColor(c: string, g: boolean) {
        color = c;
        glitter = g;
        refresh();
      }
      refresh();

      // --- Malen ---
      const route = createPointerRouter(() => zoom);
      let prevPts: [Pt, Pt] | null = null;
      let strokeCtx: ToolContext | null = null;
      let bbox: Rect | null = null;
      let pad = 0;

      const toCanvas = (x: number, y: number, e: PointerEvent): StrokePoint => {
        const c = screenToCanvas(surface.view(), x, y);
        return {
          x: c.x * surface.ratio,
          y: c.y * surface.ratio,
          pressure: e.pointerType === 'pen' ? e.pressure || 0.5 : 0.5,
          t: e.timeStamp,
        };
      };

      // Werkzeug des laufenden Strichs (ein Werkzeugwechsel mitten im Strich ändert ihn nicht)
      let strokeTool: Tool = tool;
      // Mandala: Bereich der Hilfsebene, der sich seit dem letzten Bild geändert hat
      let seg: Rect | null = null;
      let lastPt: StrokePoint | null = null;

      const startStroke = (p: StrokePoint) => {
        strokeTool = tool;
        bctx.clearRect(0, 0, W, H);
        bctx.drawImage(surface.paint, 0, 0);
        const useOverlay = tool.overlayAlpha !== undefined && !mirrors;
        if (useOverlay) surface.overlay.style.opacity = String(tool.overlayAlpha);
        strokeCtx = {
          ctx: useOverlay ? octx : pctx,
          color,
          glitter,
          size: strokeWidthOnCanvas(sizes.get(tool.id) ?? tool.defaultSize, surface.ratio, surface.view().scale),
          variant: variants.get(tool.id) ?? null,
          boundary: surface.templateData(),
        };
        // Rand großzügig: weiche Pinselkante, Sprühradius, gedrehte Musterformen
        pad = strokeCtx.size * 1.5 + 4;
        bbox = tool.maxSize === 0 ? { x: 0, y: 0, w: W, h: H } : growRect(null, p.x, p.y, pad);
        if (mirrors && tool.maxSize === 0) {
          // Eimer: alle gespiegelten Punkte in einem Durchgang füllen
          strokeCtx.points = mirrors.map((m) => applyMat(m, p.x, p.y));
          tool.begin(strokeCtx, p);
          return;
        }
        if (mirrors && sctx) {
          sctx.clearRect(0, 0, W, H);
          strokeCtx.ctx = sctx;
          strokeCtx.maskOnly = tool.id === 'eraser';
          dirty = null;
          lastPt = p;
          seg = growRect(null, p.x, p.y, pad);
          tool.begin(strokeCtx, p);
          scheduleCompose();
          return;
        }
        tool.begin(strokeCtx, p);
      };

      /** Baut einen Bereich der Malebene neu auf: Stand vom Strichbeginn + alle Spiegelkopien. */
      const recompose = (R: Rect) => {
        if (!mirrors || !scratch) return;
        pctx.clearRect(R.x, R.y, R.w, R.h);
        pctx.drawImage(base, R.x, R.y, R.w, R.h, R.x, R.y, R.w, R.h);
        pctx.save();
        pctx.beginPath();
        pctx.rect(R.x, R.y, R.w, R.h);
        pctx.clip();
        pctx.globalAlpha = strokeTool.overlayAlpha ?? 1;
        pctx.globalCompositeOperation = strokeTool.id === 'eraser' ? 'destination-out' : 'source-over';
        for (const m of mirrors) {
          // nur der Teil der Hilfsebene, der in R landet
          const src = clampRect(matBounds(invertMat(m), R), W, H);
          if (!src) continue;
          pctx.setTransform(...m);
          pctx.drawImage(scratch, src.x, src.y, src.w, src.h, src.x, src.y, src.w, src.h);
        }
        pctx.restore();
      };

      /** Mandala: nur die seit dem letzten Bild geänderten Bereiche (bzw. alles bei full) neu aufbauen. */
      const compose = (full = false) => {
        cancelAnimationFrame(frame);
        frame = 0;
        if (!mirrors || !bbox) return;
        const src = clampRect(full ? bbox : seg ?? bbox, W, H);
        seg = lastPt ? growRect(null, lastPt.x, lastPt.y, pad) : null;
        if (!src) return;
        const regions = mirrors.map((m) => clampRect(matBounds(m, src), W, H)).filter((r): r is Rect => !!r);
        for (const R of regions) {
          dirty = unionRect(dirty, R);
          recompose(R);
        }
      };
      const scheduleCompose = () => {
        if (!frame) frame = requestAnimationFrame(() => compose());
      };

      /** Beendet den laufenden Strich; abort = Strich verwerfen (Zwei-Finger-Geste). */
      const finishStroke = (abort: boolean) => {
        if (!strokeCtx) return;
        const tool = strokeTool;
        tool.end(strokeCtx);
        const mandalaStroke = strokeCtx.ctx === sctx;
        if (mandalaStroke) compose(true);
        else if (tool.overlayAlpha !== undefined) surface.commitOverlay(tool.overlayAlpha);
        strokeCtx = null;
        const rect = mandalaStroke ? dirty && clampRect(dirty, W, H) : bbox && clampRect(bbox, W, H);
        dirty = null;
        bbox = null;
        if (!rect) return;
        if (abort) {
          pctx.clearRect(rect.x, rect.y, rect.w, rect.h);
          pctx.drawImage(base, rect.x, rect.y, rect.w, rect.h, rect.x, rect.y, rect.w, rect.h);
        } else {
          history.push({ rect, data: bctx.getImageData(rect.x, rect.y, rect.w, rect.h) });
          changed();
        }
      };

      const handle = (kind: RouterEvent['kind'], e: PointerEvent) => {
        const r = surface.viewport.getBoundingClientRect();
        const x = e.clientX - r.left;
        const y = e.clientY - r.top;
        const type = (e.pointerType || 'mouse') as RouterEvent['type'];
        if (!ready) return;
        const a = route({ kind, id: e.pointerId, type, x, y });
        switch (a.do) {
          case 'strokeStart':
            startStroke(toCanvas(x, y, e));
            break;
          case 'strokeMove': {
            if (!strokeCtx) break;
            const events = e.getCoalescedEvents?.() ?? [];
            for (const ce of events.length ? events : [e]) {
              const p = toCanvas(ce.clientX - r.left, ce.clientY - r.top, ce);
              if (bbox) bbox = growRect(bbox, p.x, p.y, pad);
              if (strokeCtx.ctx === sctx) {
                seg = growRect(seg, p.x, p.y, pad);
                lastPt = p;
              }
              strokeTool.move(strokeCtx, p);
            }
            if (strokeCtx.ctx === sctx) scheduleCompose();
            break;
          }
          case 'strokeEnd':
            finishStroke(false);
            break;
          case 'strokeAbort':
            finishStroke(true);
            break;
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

      // In den Hintergrund / Seite wird verlassen: laufenden Strich abschließen und speichern
      const saveNow = () => {
        finishStroke(false);
        void doSave();
      };
      const onVisibility = () => {
        if (document.visibilityState === 'hidden') saveNow();
      };
      document.addEventListener('visibilitychange', onVisibility);
      window.addEventListener('pagehide', saveNow);

      cleanups.push(() => {
        cancelAnimationFrame(frame);
        clearTimeout(idleTimer);
        document.removeEventListener('visibilitychange', onVisibility);
        window.removeEventListener('pagehide', saveNow);
        vp.removeEventListener('pointerdown', onDown);
        vp.removeEventListener('pointermove', onMove);
        vp.removeEventListener('pointerup', onUp);
        vp.removeEventListener('pointercancel', onCancel);
      });

      // --- Tageskontingent: Hinweise (Sanduhr) und Ende ---
      const stopQuota = startTimeLimit(opts.profile, area, async () => {
          // Sofort sperren; erst nach erfolgreichem Speichern zum Mond (bei Fehler alle 3 s erneut)
          finishStroke(false);
          ready = false;
          root.dataset.ready = 'false';
          const lock = document.createElement('div');
          lock.className = 'quota-lock';
          lock.dataset.testid = 'quota-lock';
          lock.innerHTML = icons.moon;
          area.append(lock);
          while ((await doSave()) === 'error') {
            if (!root.isConnected) return;
            await new Promise((r) => setTimeout(r, 3000));
          }
          navigate(dayOverScreen(opts.profile));
      });
      cleanups.push(stopQuota);

      // Verlassen: speichern; schlägt das fehl, bleibt die Malfläche offen (nichts geht verloren)
      leave = async () => {
        finishStroke(false);
        return (await doSave()) !== 'error';
      };

      updateUndo();
      void (async () => {
        try {
          if (templateId) {
            const svg = await getTemplateSource().loadSvg(templateId);
            if (svg) surface.setTemplate(await svgToImage(svg));
          }
          if (opts.picture) await surface.loadImage(opts.picture.paint);
        } catch (e) {
          console.error(e); // Bild öffnet trotzdem, notfalls ohne Linien
        }
        ready = true;
        root.dataset.ready = 'true';
      })();
    },
    async unmount() {
      if (!(await leave())) return false;
      cleanups.forEach((c) => c());
      return true;
    },
  };
}

/** Dünne gestrichelte Achsen durch die Bildmitte (nur Anzeige). */
function drawGuides(c: HTMLCanvasElement, n: number): void {
  const g = c.getContext('2d')!;
  const cx = c.width / 2;
  const cy = c.height / 2;
  const r = Math.hypot(cx, cy);
  g.clearRect(0, 0, c.width, c.height);
  g.strokeStyle = 'rgba(120, 144, 156, .45)';
  g.lineWidth = Math.max(1, c.width / 800);
  g.setLineDash([12, 10]);
  for (let k = 0; k < n; k++) {
    const a = Math.PI / 2 + (Math.PI * k) / n;
    g.beginPath();
    g.moveTo(cx - Math.cos(a) * r, cy - Math.sin(a) * r);
    g.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    g.stroke();
  }
}
