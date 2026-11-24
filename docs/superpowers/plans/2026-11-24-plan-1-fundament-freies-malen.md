# Plan 1 – Fundament und Freies Malen

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eine installierbare Offline-Web-App mit Profilauswahl, Modus-Menü, Galerie und vollständigem Modus „Freies Malen“ (alle Werkzeuge, Farben, Strichdicke, Rückgängig, Zoom, Speichern), gehostet auf GitHub Pages.

**Architecture:** Vite + TypeScript ohne UI-Framework; jeder Bildschirm ist ein `Screen`-Objekt mit `mount/unmount`. Modi und Werkzeuge sind Module, die sich an je einer Registry anmelden. Reine Logik (Zoom-Mathematik, Zeigerverwaltung, Flood-Fill, Paletten, Speicher) liegt in eigenen Dateien und ist mit Vitest getestet; Abläufe prüft Playwright in Chromium und WebKit.

**Tech Stack:** Node LTS, Vite, TypeScript (strict), vite-plugin-pwa, idb, Vitest + fake-indexeddb + jsdom, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-24-mal-app-design.md`

**Gesamtaufteilung (drei Pläne, jeder liefert lauffähige Software):**
- **Plan 1 (dieser):** Fundament, Profile (vorläufig ohne PIN), Modus-Menü, Freies Malen, Galerie, Deployment.
- **Plan 2:** Elternbereich mit PIN, Profile bearbeiten/löschen (inkl. Profilbild aus der App-Galerie), Tageskontingent, Zeitregler, Hinweise, Schluss-Bildschirm samt Galerie-Sperre fürs Weitermalen und Mond-Markierung in der Profilauswahl, Papierkorb-Ansicht, Bilder löschen, Export, Installationshinweis.
- **Plan 3:** Ausmalen mit Vorlagenquelle, Katalog, Probevorlagen und 5 × 8 Vorlagen.

## Global Constraints

- Läuft in Safari (iPadOS 17–18) und Silk (Fire HD 11) als zum Home-Bildschirm hinzugefügte PWA; komplett offline nach dem ersten Laden.
- Keine Texte in Kinderbereichen; Touch-Ziele mindestens 64 × 64 CSS-px mit mindestens 12 px Abstand.
- Querformat; im Hochformat ein bildliches „Bitte drehen“-Overlay.
- Nur eigene Assets (Icons als eigene SVG), keine fremd lizenzierten Inhalte, keine Emoji als UI-Symbole (rendern auf Fire und iPad unterschiedlich).
- Keine Netzwerkaufrufe zur Laufzeit außer dem Laden der App selbst.
- Rückgängig: maximal 20 Schritte. Zoom: Faktor 1 bis 4. Canvas-Pixeldichte: `min(devicePixelRatio, 2)`.
- Repository heißt `mal-app`, öffentlich; Vite `base: '/mal-app/'`.
- Bezeichner im Code englisch, UI-Texte (nur Eltern-Bereiche) deutsch.

## Review Focus

1. **App wird mitten im Malen geschlossen oder in den Hintergrund geschickt** → beim `visibilitychange` auf `hidden` wird gespeichert; nach Neustart ist das Bild in der Galerie. (Test in Task 9)
2. **Altes Bild öffnen, leeren, zurück** → Original liegt im Papierkorb-Speicher, Galerie zeigt die neue Fassung; nichts ist endgültig weg. (Test in Task 2)
3. **Handballen / zweiter Finger bei ausgeschaltetem Zoom** → keine Streulinien, nur der erste Zeiger malt. (Test in Task 5)
4. **Speichern schlägt fehl (Speicher voll)** → sichtbares Fehlersymbol am Speichern-Knopf, Bild bleibt auf der Malfläche, `dirty` bleibt `true`. (Test in Task 9)
5. **Mehrfaches schnelles Tippen auf Speichern** → genau ein Galerie-Eintrag. (Test in Task 9)

---

### Task 0: Voraussetzungen und Repository

**Files:**
- Create: `.gitignore`

- [ ] **Step 1: Node LTS installieren (falls `node --version` fehlschlägt)**

Run: `winget install OpenJS.NodeJS.LTS` und Terminal neu öffnen.
Expected: `node --version` zeigt v22 oder neuer, `npm --version` funktioniert.

- [ ] **Step 2: Git-Repository anlegen**

Run: `git init -b main` im Projektordner. `.gitignore` mit `node_modules/`, `dist/`, `test-results/`, `playwright-report/`, `.vite/`.

- [ ] **Step 3: Commit der Spezifikation und Pläne**

```bash
git add .gitignore docs/
git commit -m "docs: Design und Plan 1 der Mal-App"
```

---

### Task 1: Projektgerüst, PWA und Testumgebung

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`, `playwright.config.ts`, `index.html`, `src/main.ts`, `src/styles.css`, `public/icon.svg`, `pwa-assets.config.ts`, `.github/workflows/deploy.yml`
- Test: `e2e/smoke.spec.ts`

**Interfaces:**
- Produces: `npm run dev`, `npm run build`, `npm test` (Vitest), `npm run e2e` (Playwright, startet `vite preview`). Element `<div id="app">` als Wurzel.

- [ ] **Step 1: Abhängigkeiten installieren**

Run: `npm init -y` und dann `npm i idb` sowie `npm i -D vite typescript vite-plugin-pwa @vite-pwa/assets-generator vitest jsdom fake-indexeddb @playwright/test` und `npx playwright install chromium webkit`.

- [ ] **Step 2: Konfiguration**

- `tsconfig.json`: `strict: true`, `target: ES2020`, `lib: [ES2020, DOM, DOM.Iterable]`, `moduleResolution: bundler`.
- `vite.config.ts`: `base: '/mal-app/'`; `VitePWA({ registerType: 'prompt', injectRegister: false, workbox: { globPatterns: ['**/*.{js,css,html,svg,png,json}'] }, manifest: { name: 'Malen', short_name: 'Malen', display: 'fullscreen', orientation: 'landscape', background_color: '#ffffff', theme_color: '#ffffff', start_url: '/mal-app/', scope: '/mal-app/' } })`. Icons aus `public/icon.svg` über `@vite-pwa/assets-generator` (Preset `minimal-2023`, erzeugt auch `apple-touch-icon`).
- `registerType: 'prompt'` + in `src/main.ts` `registerSW({ onNeedRefresh() {} })`: Neue Version wird geladen, aber erst beim nächsten Start aktiv (Spec 7.1 „nie mitten im Malen“).
- `index.html`: `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no">`, `apple-mobile-web-app-capable=yes`, `<div id="app">`.
- `src/styles.css`: `touch-action: none; user-select: none; -webkit-user-select: none; -webkit-touch-callout: none; overscroll-behavior: none` auf `html, body`; Hochformat-Overlay per `@media (orientation: portrait)`.
- `vitest.config.ts`: `environment: 'jsdom'`, `setupFiles: ['fake-indexeddb/auto']`, `include: ['src/**/*.test.ts']`.
- `playwright.config.ts`: Projekte `chromium` und `webkit` mit `viewport: {width: 1180, height: 820}`, `hasTouch: true`; `webServer: { command: 'npm run build && npm run preview -- --port 4173', url: 'http://localhost:4173/mal-app/' }`.

- [ ] **Step 3: Smoke-Test schreiben**

```ts
test('App startet und zeigt Wurzel', async ({ page }) => {
  await page.goto('/mal-app/');
  await expect(page.locator('#app')).toBeVisible();
  await expect(page.locator('[data-screen]')).toHaveCount(1);
});
```

- [ ] **Step 4: `src/main.ts` setzt vorerst `<div data-screen="boot">` in `#app`; `navigator.storage?.persist?.()` aufrufen (Fehler ignorieren).**

- [ ] **Step 5: Tests laufen lassen**

Run: `npm run e2e`
Expected: PASS in chromium und webkit.

- [ ] **Step 6: Deploy-Workflow**

`.github/workflows/deploy.yml`: bei Push auf `main` → `npm ci`, `npm test`, `npm run build`, `actions/upload-pages-artifact` mit `dist`, `actions/deploy-pages`.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: Projektgerüst mit PWA, Tests und Pages-Deployment"
```

---

### Task 2: Speicher (Profile, Bilder, Papierkorb)

**Files:**
- Create: `src/storage/types.ts`, `src/storage/db.ts`, `src/storage/profiles.ts`, `src/storage/pictures.ts`
- Test: `src/storage/profiles.test.ts`, `src/storage/pictures.test.ts`

**Interfaces:**
- Produces:
```ts
// types.ts
export interface Profile { id: string; name: string; avatar: Blob | null; defaultQuotaMin: number; warningsMin: number[]; createdAt: number }
export interface Picture { id: string; profileId: string; modeId: string; templateId: string | null; paint: Blob; thumb: Blob; width: number; height: number; createdAt: number; updatedAt: number }
export interface TrashEntry { id: string; picture: Picture; trashedAt: number; reason: 'overwritten' | 'deleted' }
// db.ts
export function openDb(name?: string): Promise<IDBPDatabase<MalDB>>   // Stores: profiles, pictures (Index byProfile), trash, settings
// profiles.ts
export function listProfiles(): Promise<Profile[]>                       // sortiert nach createdAt
export function createProfile(name: string, avatar: Blob | null): Promise<Profile>   // defaultQuotaMin 30, warningsMin [5, 1]
export function updateProfile(p: Profile): Promise<void>
// pictures.ts
export function createPicture(input: Omit<Picture, 'id'|'createdAt'|'updatedAt'>, now?: number): Promise<Picture>
export function overwritePicture(id: string, data: Pick<Picture,'paint'|'thumb'|'width'|'height'>, opts: { keepPrevious: boolean }, now?: number): Promise<Picture>
export function listPictures(profileId: string): Promise<Picture[]>       // neueste updatedAt zuerst
export function getPicture(id: string): Promise<Picture | undefined>
export function listTrash(): Promise<TrashEntry[]>
export function purgeTrash(now?: number): Promise<number>                // löscht Einträge älter als 30 Tage, gibt Anzahl zurück
```
IDs per `crypto.randomUUID()`. `overwritePicture` mit `keepPrevious: true` legt die alte Fassung in derselben Transaktion als `TrashEntry` (`reason: 'overwritten'`) ab.

- [ ] **Step 1: Tests schreiben**

```ts
it('neues Profil hat Standardwerte', async () => {
  const p = await createProfile('Lena', null);
  expect(p.defaultQuotaMin).toBe(30);
  expect(p.warningsMin).toEqual([5, 1]);
  expect((await listProfiles()).map(x => x.name)).toEqual(['Lena']);
});
it('Überschreiben mit keepPrevious legt Original in den Papierkorb', async () => {
  const pic = await createPicture(sample('A'), 1000);
  await overwritePicture(pic.id, data('B'), { keepPrevious: true }, 2000);
  expect(await textOf((await getPicture(pic.id))!.paint)).toBe('B');
  const trash = await listTrash();
  expect(trash).toHaveLength(1);
  expect(await textOf(trash[0].picture.paint)).toBe('A');
  expect(trash[0].reason).toBe('overwritten');
});
it('Überschreiben ohne keepPrevious legt nichts in den Papierkorb', ...);
it('purgeTrash entfernt nur Einträge älter als 30 Tage', async () => {
  // Einträge mit trashedAt = now - 31 Tage und now - 29 Tage → purge liefert 1, einer bleibt
});
it('listPictures liefert nur Bilder des Profils, neueste zuerst', ...);
```
Jeder Test öffnet eine frische DB (`openDb('test-' + crypto.randomUUID())`, Modul-Setter `useDb(db)` in `db.ts` für Tests).

- [ ] **Step 2: Tests laufen lassen → FAIL (Module fehlen)**

Run: `npx vitest run src/storage`

- [ ] **Step 3: Implementieren**

- [ ] **Step 4: Tests laufen lassen → PASS**

- [ ] **Step 5: `purgeTrash()` beim App-Start in `src/main.ts` aufrufen. Commit.**

```bash
git commit -am "feat: Speicher für Profile, Bilder und Papierkorb"
```

---

### Task 3: Bildschirm-Router, Profilauswahl, Profil anlegen (vorläufig)

**Files:**
- Create: `src/app/screen.ts`, `src/app/router.ts`, `src/ui/icons.ts`, `src/ui/avatar.ts`, `src/screens/profile-select.ts`, `src/screens/profile-create.ts`
- Test: `src/ui/avatar.test.ts`, `e2e/profiles.spec.ts`

**Interfaces:**
- Produces:
```ts
export interface Screen { readonly name: string; mount(root: HTMLElement): void; unmount(): Promise<void> | void }
export function navigate(screen: Screen): Promise<void>     // wartet auf unmount des alten (wichtig: Autosave), setzt data-screen=name
export const icons: Record<string, string>                   // SVG-Strings; Schlüssel u. a. home, undo, clear, save, zoom, gallery, freePaint, plus, rainbow, Werkzeug-IDs
export function squareAvatar(file: Blob, size?: number): Promise<Blob>   // mittiger quadratischer Ausschnitt, 256 px, JPEG 0.85
export function cropRect(w: number, h: number): { sx: number; sy: number; s: number }  // reine Mathematik für squareAvatar
export function profileSelectScreen(): Screen
export function profileCreateScreen(): Screen
```
- Profilauswahl: große runde Avatar-Kacheln (Name klein darunter), „+“-Kachel → `profileCreateScreen`. Tipp auf Profil → `modeMenuScreen(profile)` (Task 4; bis dahin Platzhalter).
- Profil anlegen (vorläufig, wird in Plan 2 hinter PIN gelegt): Textfeld Name, zwei Knöpfe „Kamera“ (`<input type=file accept="image/*" capture="user">`) und „Fotos“ (`accept="image/*"` ohne capture), Vorschau, „Fertig“. Ohne Bild: farbiger Kreis mit Initiale.

- [ ] **Step 1: Test für `cropRect`**

```ts
expect(cropRect(400, 300)).toEqual({ sx: 50, sy: 0, s: 300 });
expect(cropRect(300, 400)).toEqual({ sx: 0, sy: 50, s: 300 });
```

- [ ] **Step 2: FAIL prüfen, implementieren, PASS prüfen** (`npx vitest run src/ui`)

- [ ] **Step 3: E2E-Test**

```ts
test('Profil anlegen und auswählen', async ({ page }) => {
  await page.goto('/mal-app/');
  await page.getByTestId('profile-add').click();
  await page.getByLabel('Name').fill('Lena');
  await page.getByRole('button', { name: 'Fertig' }).click();
  await expect(page.getByTestId('profile-tile')).toHaveCount(1);
  await page.getByTestId('profile-tile').first().click();
  await expect(page.locator('[data-screen="mode-menu"]')).toBeVisible();
});
```

- [ ] **Step 4: Implementieren; `npm run e2e` → PASS. Commit.**

```bash
git commit -am "feat: Profilauswahl und Profil anlegen"
```

---

### Task 4: Modus-Registry und Modus-Menü mit wischbaren Reihen

**Files:**
- Create: `src/modes/registry.ts`, `src/modes/index.ts`, `src/ui/tile-row.ts`, `src/screens/mode-menu.ts`
- Test: `src/modes/registry.test.ts`, `e2e/mode-menu.spec.ts`

**Interfaces:**
- Consumes: `Screen`, `navigate`, `Profile`, `icons`.
- Produces:
```ts
export interface AppContext { profile: Profile }
export interface Mode { id: string; icon: string; order: number; pinnedFirst?: boolean; open(ctx: AppContext): Screen }
export function registerMode(m: Mode): void      // doppelte id → Error
export function listModes(): Mode[]              // pinnedFirst zuerst, dann nach order
export function createTileRow(items: { id: string; icon: string; onTap(): void }[], opts?: { size?: number }): HTMLElement
export function modeMenuScreen(profile: Profile): Screen
```
- `src/modes/index.ts` ist die **eine Stelle**, an der Modi registriert werden (`gallery` mit `pinnedFirst: true`, `free-paint` mit `order: 10`).
- `createTileRow`: horizontales Scrollen per `overflow-x: auto; scroll-snap-type: x mandatory`, Scrollleiste ausgeblendet, `touch-action: pan-x` auf der Reihe. Kachelbreite so gewählt, dass bei Überlauf die letzte sichtbare Kachel halb angeschnitten ist: sichtbare Kachelzahl = `floor(Breite / (Kachel + Abstand)) - 0.5`, daraus Kachelgröße berechnen (min 140 px).
- Modus-Menü: oben links Zurück zur Profilauswahl und kleiner Avatar; darunter Reihe 1 mit den Modi.

- [ ] **Step 1: Tests**

```ts
it('Galerie steht immer zuerst', () => {
  registerMode(m('free-paint', 10)); registerMode({ ...m('gallery', 99), pinnedFirst: true });
  expect(listModes().map(x => x.id)).toEqual(['gallery', 'free-paint']);
});
it('doppelte id wirft', () => { registerMode(m('a', 1)); expect(() => registerMode(m('a', 2))).toThrow(); });
```
E2E: Mit 12 Test-Kacheln (Hilfsseite nicht nötig – `createTileRow` direkt in einem Vitest-DOM-Test): `row.scrollWidth > row.clientWidth`.

- [ ] **Step 2: FAIL → implementieren → PASS. Commit.**

```bash
git commit -am "feat: Modus-Registry und Modus-Menü"
```

---

### Task 5: Mal-Kern (reine Logik)

**Files:**
- Create: `src/paint/view-transform.ts`, `src/paint/pointer-router.ts`, `src/paint/history.ts`, `src/paint/size-drag.ts`
- Test: je `*.test.ts` daneben

**Interfaces:**
- Produces:
```ts
// view-transform.ts – Abbildung Bildschirm ↔ Leinwand
export interface View { scale: number; tx: number; ty: number }          // scale ∈ [1, 4]
export const IDENTITY: View
export function screenToCanvas(v: View, x: number, y: number): { x: number; y: number }
export function pinch(v: View, prev: [Pt, Pt], next: [Pt, Pt], bounds: { w: number; h: number }): View
//   skaliert um den Mittelpunkt der Finger, verschiebt um dessen Bewegung, begrenzt scale auf [1,4]
//   und tx/ty so, dass die Leinwand den Bildbereich nie verlässt
// pointer-router.ts – wer darf malen?
export type RouterEvent = { kind: 'down'|'move'|'up'|'cancel'; id: number; type: 'touch'|'pen'|'mouse'; x: number; y: number }
export type RouterAction = { do: 'strokeStart'|'strokeMove'|'strokeEnd'|'strokeAbort'; x: number; y: number }
                         | { do: 'gesture'; points: [Pt, Pt] } | { do: 'gestureEnd' } | { do: 'none' }
export function createPointerRouter(getZoomEnabled: () => boolean): (e: RouterEvent) => RouterAction
// history.ts
export interface History<T> { push(s: T): void; undo(): T | undefined; canUndo(): boolean; clear(): void }
export function createHistory<T>(limit = 20): History<T>
// size-drag.ts
export function sizeFromDrag(start: number, dx: number, min: number, max: number): number
//   = clamp(start * 2 ** (-dx / 120), min, max)  → links (dx<0) größer, rechts kleiner, stufenlos, je weiter desto stärker
```
Regeln des Pointer-Routers:
- Erster Zeiger → `strokeStart`; seine Bewegungen → `strokeMove`; sein `up` → `strokeEnd`.
- Zoom **aus**: alle weiteren Zeiger → `none`.
- Zoom **an**: zweiter Zeiger während eines Strichs → `strokeAbort`, danach Bewegungen beider Zeiger → `gesture`; Geste endet erst, wenn **alle** Zeiger oben sind (`gestureEnd`); bis dahin kein neuer Strich.
- Ist ein `pen`-Zeiger aktiv, werden `touch`-Zeiger ignoriert (Handballen).
- `cancel` des malenden Zeigers → `strokeEnd` (Strich bleibt).

- [ ] **Step 1: Tests schreiben**

```ts
it('Zoom aus: zweiter Finger malt nicht', () => {
  const r = createPointerRouter(() => false);
  expect(r(ev('down', 1)).do).toBe('strokeStart');
  expect(r(ev('down', 2)).do).toBe('none');
  expect(r(ev('move', 2)).do).toBe('none');
  expect(r(ev('move', 1)).do).toBe('strokeMove');
});
it('Zoom an: zweiter Finger bricht Strich ab und startet Geste', () => {
  const r = createPointerRouter(() => true);
  r(ev('down', 1));
  expect(r(ev('down', 2)).do).toBe('strokeAbort');
  expect(r(ev('move', 1)).do).toBe('gesture');
  r(ev('up', 1));
  expect(r(ev('down', 3)).do).toBe('none');           // Geste läuft noch
  r(ev('up', 2)); r(ev('up', 3));
  expect(r(ev('down', 4)).do).toBe('strokeStart');
});
it('Stift aktiv: Touch ignoriert', ...);
it('pinch begrenzt auf 1..4', () => { /* gespreizte Finger ×10 → scale 4 */ });
it('screenToCanvas invertiert die Transformation', () => {
  const v = { scale: 2, tx: -100, ty: -50 };
  expect(screenToCanvas(v, 100, 50)).toEqual({ x: 100, y: 50 });
});
it('History hält maximal 20 Zustände', () => { /* 25 push → 20× undo liefert Werte, 21. undefined */ });
it('sizeFromDrag: links größer, rechts kleiner, begrenzt', () => {
  expect(sizeFromDrag(10, -120, 1, 80)).toBe(20);
  expect(sizeFromDrag(10, 120, 1, 80)).toBe(5);
  expect(sizeFromDrag(10, -2000, 1, 80)).toBe(80);
});
```

- [ ] **Step 2: FAIL → implementieren → PASS** (`npx vitest run src/paint`). Commit.

```bash
git commit -am "feat: Mal-Kern mit Zoom, Zeiger-Router, Verlauf und Größenregel"
```

---

### Task 6: Malbildschirm mit Grundwerkzeugen, Farben, Strichdicke, Zoom

**Files:**
- Create: `src/tools/types.ts`, `src/tools/registry.ts`, `src/tools/index.ts`, `src/tools/brush.ts`, `src/tools/marker.ts`, `src/tools/fineliner.ts`, `src/tools/eraser.ts`, `src/paint/colors.ts`, `src/paint/size-control.ts`, `src/paint/paint-surface.ts`, `src/paint/paint-screen.ts`, `src/modes/free-paint/index.ts`
- Test: `src/paint/colors.test.ts`, `src/tools/registry.test.ts`, `e2e/paint.spec.ts`

**Interfaces:**
- Consumes: Task 5 komplett, `Screen`, `navigate`, `registerMode`.
- Produces:
```ts
// tools/types.ts
export interface StrokePoint { x: number; y: number; pressure: number; t: number }   // Leinwand-Koordinaten
export interface ToolContext { ctx: CanvasRenderingContext2D; color: string; size: number; variant: string | null }
export interface ToolVariant { id: string; icon: string }
export interface Tool {
  id: string; icon: string; order: number;
  minSize: number; maxSize: number; defaultSize: number;
  variants?: ToolVariant[];
  begin(c: ToolContext, p: StrokePoint): void; move(c: ToolContext, p: StrokePoint): void; end(c: ToolContext): void;
}
export function registerTool(t: Tool): void; export function listTools(): Tool[]   // nach order
// paint/colors.ts
export const BASIC_COLORS: string[]   // genau diese 14: '#e53935','#fb8c00','#fdd835','#7cb342','#2e7d32','#00acc1','#1e88e5','#3949ab','#8e24aa','#ec407a','#8d6e63','#ffffff','#9e9e9e','#212121'
// paint/paint-surface.ts
export interface PaintSurface {
  readonly paint: HTMLCanvasElement;                // Malebene in Leinwandpixeln
  setView(v: View): void; view(): View;
  snapshot(): ImageData; restore(s: ImageData): void;
  clear(): void; isBlank(): boolean;
  loadImage(b: Blob): Promise<void>;                // skaliert proportional eingepasst
  toBlobs(): Promise<{ paint: Blob; thumb: Blob; width: number; height: number }>; // PNG; thumb max 320 px Breite
}
export function createPaintSurface(host: HTMLElement): PaintSurface   // Leinwandgröße = Host-Größe × min(dpr, 2), bei Erstellung fest
// paint/paint-screen.ts
export interface PaintScreenOptions { profile: Profile; modeId: string; picture?: Picture }
export function paintScreen(opts: PaintScreenOptions): Screen
```
Layout (Spec 5.5): rechts zwei Spalten – außen Werkzeuge, innen Farben; oben in der Farbspalte Regenbogen-Knopf (öffnet Task 8, vorerst ohne Funktion), darunter Platz für „letzte freie Farbe“, darunter `BASIC_COLORS`, unten der Größen-Punkt. Unten links: Zurück (⌂), Rückgängig, Leeren, Speichern (Task 9), Zoom-Lupe. Spalten scrollen vertikal, falls die Höhe nicht reicht.
- Werkzeug-Werte: Pinsel `min 4 / max 80 / default 18`, Filzstift `4/60/12`, Fineliner `1/12/3`, Radierer `6/100/30`.
- Pinsel: `quadraticCurveTo` zwischen Mittelpunkten, Breite `size * clamp(1 - speed/3, 0.6, 1)`, `globalAlpha 0.85`, `lineCap round`. Filzstift: konstante Breite, `globalAlpha 0.8` pro Strich (Strich zuerst auf Zwischenebene, beim `end` auf Malebene → gleichmäßig in sich, durchscheinend an Überschneidungen mit anderen Strichen). Fineliner: konstante Breite, deckend. Radierer: `globalCompositeOperation = 'destination-out'`.
- Größen-Punkt: `size-control.ts`, Drücken+Halten 300 ms → vergrößerte Vorschau in aktueller Farbe, horizontale Bewegung über `sizeFromDrag`. Größe wird pro Werkzeug gemerkt.
- Rückgängig: vor jedem `strokeStart` und vor `clear` → `history.push(surface.snapshot())`; `strokeAbort` → `surface.restore(history.undo()!)` (Snapshot vom Strichbeginn, damit ist er auch aus dem Verlauf entfernt).
- Zoom-Lupe: Schalter; aktiv hervorgehoben; Ausschalten → `setView(IDENTITY)`.
- Darstellung: Malebene per CSS `transform: translate(tx,ty) scale(s)` mit `transform-origin: 0 0` (kein Neuzeichnen beim Zoomen).

- [ ] **Step 1: Tests**

```ts
it('genau 14 Grundfarben, alle gültiges Hex', () => {
  expect(BASIC_COLORS).toHaveLength(14);
  BASIC_COLORS.forEach(c => expect(c).toMatch(/^#[0-9a-f]{6}$/));
});
it('Werkzeuge nach order sortiert, doppelte id wirft', ...);
```
E2E (`paint.spec.ts`): Profil anlegen → „Freies Malen“ → Strich per `page.mouse` über die Malfläche → `canUndo`-Knopf aktiv (`aria-disabled="false"`) → Rückgängig → Knopf wieder inaktiv. Zweiter Test: Pixel unter dem Strich nicht transparent (über `page.evaluate` auf `canvas[data-layer=paint]`, `getImageData`).

- [ ] **Step 2: FAIL → implementieren → PASS** (`npm test && npm run e2e`).

- [ ] **Step 3: Manuell im Browser (`npm run dev`, Gerätemodus Tablet) prüfen: Linien glatt, Größen-Punkt reagiert wie beschrieben. Commit.**

```bash
git commit -am "feat: Malbildschirm mit Pinsel, Filzstift, Fineliner, Radierer, Farben, Größe und Zoom"
```

---

### Task 7: Weitere Werkzeuge und Varianten

**Files:**
- Create: `src/paint/flood-fill.ts`, `src/tools/spray.ts`, `src/tools/bucket.ts`, `src/tools/magic.ts`, `src/tools/pattern.ts`, `src/tools/texture.ts`, `src/tools/textures/*.ts` (prozedural erzeugte Muster), `src/paint/variant-popup.ts`
- Modify: `src/tools/index.ts` (Registrierung), `src/paint/paint-screen.ts` (Varianten per Long-Press)
- Test: `src/paint/flood-fill.test.ts`, `src/tools/magic.test.ts`

**Interfaces:**
- Consumes: `Tool`, `ToolContext`, `registerTool`.
- Produces:
```ts
export function floodFill(img: ImageData, x: number, y: number, rgba: [number, number, number, number], tolerance = 32): number
//   Scanline-Füllung, vergleicht mit Startfarbe (inkl. Alpha); füllt zusätzlich 1 px Rand in die Kante (gegen Antialiasing-Saum); gibt Anzahl gefüllter Pixel zurück
export function magicHue(distance: number): number    // = (distance / 4) % 360
```
- Sprühdose `8/120/40`: pro `move` und per `setInterval(16ms)` solange gedrückt `size * 0.6` zufällige Punkte im Kreis, gleichverteilt (`r = size/2 * sqrt(random)`), Punktgröße 1–2 px.
- Eimer: `begin` → `getImageData` → `floodFill` → `putImageData`; keine Größe (Größen-Punkt ausgegraut).
- Zauberstift `4/60/14`: wie Filzstift deckend, Farbe `hsl(magicHue(zurückgelegteStrecke), 90%, 55%)`, Segment für Segment.
- Musterstift `10/80/30`, Varianten `star`, `heart`, `dot`: setzt Form im Abstand `size * 1.2` entlang des Pfads, leicht zufällig gedreht.
- Texturstift `6/80/24`, Varianten `crayon`, `chalk`, `fabric`, `glitter`: Strich als `strokeStyle = ctx.createPattern(textur, 'repeat')`, Textur pro Farbe und Variante prozedural auf 64×64-Kachel erzeugt und gecacht.
- Varianten: Long-Press 400 ms auf ein Werkzeug mit `variants` → `variant-popup.ts` mit großen Bildknöpfen; gewählte Variante wird pro Werkzeug gemerkt, Werkzeugsymbol zeigt sie.

- [ ] **Step 1: Tests**

```ts
it('füllt geschlossene Fläche, nicht darüber hinaus', () => {
  const img = imageWithSquareOutline(20, 20);   // schwarzer Rahmen bei 5..14
  const n = floodFill(img, 10, 10, [255, 0, 0, 255]);
  expect(px(img, 10, 10)).toEqual([255, 0, 0, 255]);
  expect(px(img, 1, 1)).toEqual([0, 0, 0, 0]);
  expect(n).toBeGreaterThan(50);
});
it('Füllen auf gleiche Farbe gibt 0 zurück und ändert nichts', ...);
it('Toleranz überbrückt Antialiasing-Grautöne nahe Startfarbe', ...);
it('magicHue läuft zyklisch', () => { expect(magicHue(0)).toBe(0); expect(magicHue(1440)).toBe(0); expect(magicHue(400)).toBe(100); });
```

- [ ] **Step 2: FAIL → implementieren → PASS.**

- [ ] **Step 3: Manuell prüfen: jedes Werkzeug auf weißem Grund, Eimer in eine mit Fineliner gezeichnete Fläche, Varianten-Popup. Commit.**

```bash
git commit -am "feat: Sprühdose, Eimer, Zauberstift, Musterstift, Texturstift mit Varianten"
```

---

### Task 8: Regenbogen-Farbpalette

**Files:**
- Create: `src/paint/palette-popup.ts`
- Modify: `src/paint/colors.ts`, `src/paint/paint-screen.ts`
- Test: `src/paint/colors.test.ts`

**Interfaces:**
- Produces:
```ts
export function generatePalette(): string[][]   // 11 Zeilen à 10: Zeilen 0–9 = Helligkeit 90%→18% (gleichmäßig), Spalten = Farbtöne 0,36,…,324 bei Sättigung 85%; Zeile 10 = Grau von #ffffff bis #000000
export function hslToHex(h: number, s: number, l: number): string
```
- Popup: Raster großer Felder (min 56 px), Tipp wählt Farbe und schließt; Tipp außerhalb schließt. Gewählte Farbe erscheint als „letzte freie Farbe“-Tupfer unter dem Regenbogen (nur im aktuellen Malbildschirm; dauerhaftes Merken ist nicht gefordert).

- [ ] **Step 1: Tests**

```ts
it('Palette hat 110 eindeutige Farben', () => {
  const all = generatePalette().flat();
  expect(all).toHaveLength(110);
  expect(new Set(all).size).toBe(110);
});
it('hslToHex', () => { expect(hslToHex(0, 100, 50)).toBe('#ff0000'); expect(hslToHex(120, 100, 25)).toBe('#008000'); });
```

- [ ] **Step 2: FAIL → implementieren → PASS. Commit.**

```bash
git commit -am "feat: Regenbogen-Palette mit 110 Farben"
```

---

### Task 9: Speichern, Autosave, Galerie, Weitermalen

**Files:**
- Create: `src/paint/save-controller.ts`, `src/modes/gallery/index.ts`, `src/screens/gallery.ts`
- Modify: `src/paint/paint-screen.ts`, `src/modes/index.ts`
- Test: `src/paint/save-controller.test.ts`, `e2e/gallery.spec.ts`

**Interfaces:**
- Consumes: `createPicture`, `overwritePicture`, `listPictures`, `getPicture`, `PaintSurface.toBlobs/isBlank`.
- Produces:
```ts
export interface SaveController {
  markDirty(): void; readonly dirty: boolean; readonly pictureId: string | null;
  save(): Promise<'saved' | 'skipped' | 'error'>;
}
export function createSaveController(deps: {
  profileId: string; modeId: string; templateId: string | null;
  existing: Picture | null;
  getBlobs(): Promise<{ paint: Blob; thumb: Blob; width: number; height: number }>;
  isBlank(): boolean;
  store: { createPicture: typeof createPicture; overwritePicture: typeof overwritePicture };
}): SaveController
export function galleryScreen(profile: Profile): Screen
```
Regeln (Spec 5.5, 5.8):
- `save()` bei `!dirty` → `'skipped'`. Bei `dirty && isBlank() && pictureId === null` → `'skipped'` (leere neue Fläche nie speichern).
- Erstes Speichern ohne `existing` → `createPicture`; danach `overwritePicture(id, …, { keepPrevious: false })`.
- Mit `existing`: das **erste** Überschreiben in dieser Sitzung mit `keepPrevious: true` (Original in den Papierkorb), weitere mit `false`.
- Gleichzeitige Aufrufe werden zu einem zusammengefasst (laufendes Promise wiederverwenden; danach erneut speichern, falls inzwischen `markDirty`).
- Fehler → `'error'`, `dirty` bleibt `true`; Speichern-Knopf zeigt Fehlersymbol bis zum nächsten erfolgreichen Speichern.
- Autosave: in `unmount()` des Malbildschirms (Router wartet darauf) und bei `document.visibilitychange` → `hidden`.
- Speichern-Knopf: kurze Animation „Bild fliegt in den Rahmen“ bei `'saved'`.
- Galerie: nur Bilder des Profils als Raster (Vorschaubilder, neueste zuerst), Tipp öffnet `paintScreen({ profile, modeId: pic.modeId, picture: pic })`; kein Löschen. Leere Galerie: großes Symbol eines leeren Bilderrahmens.

- [ ] **Step 1: Tests (mit Fake-Store)**

```ts
it('neue leere Fläche wird nicht gespeichert', async () => { /* markDirty, isBlank=true → 'skipped', createPicture nie aufgerufen */ });
it('zweimal speichern erzeugt einen Eintrag und überschreibt ohne Papierkorb', ...);
it('vorhandenes Bild: nur erstes Überschreiben mit keepPrevious', async () => {
  // existing gesetzt; markDirty; save; markDirty; save → Aufrufe: keepPrevious true, dann false
});
it('parallele save()-Aufrufe → genau ein createPicture', async () => {
  c.markDirty(); await Promise.all([c.save(), c.save(), c.save()]);
  expect(store.createPicture).toHaveBeenCalledTimes(1);
});
it('Fehler beim Speichern → error, dirty bleibt true', ...);
```
E2E (`gallery.spec.ts`):
```ts
test('Malen, zurück, Galerie zeigt Bild; Weitermalen öffnet es', async ({ page }) => { /* Strich → ⌂ → Galerie → 1 Vorschaubild → antippen → Malbildschirm mit nicht leerer Leinwand */ });
test('Hintergrund speichert', async ({ page }) => {
  // Strich → page.evaluate: Object.defineProperty(document,'visibilityState',{value:'hidden'}); dispatch visibilitychange
  // → page.reload() → Profil → Galerie → 1 Vorschaubild
});
```

- [ ] **Step 2: FAIL → implementieren → PASS** (`npm test && npm run e2e`).

- [ ] **Step 3: Commit**

```bash
git commit -am "feat: Speichern mit Autosave und Papierkorb-Schutz, Galerie mit Weitermalen"
```

---

### Task 10: Veröffentlichen und auf beiden Tablets prüfen

**Files:**
- Create: `docs/installation.md` (Anleitung zum Hinzufügen zum Home-Bildschirm auf iPad und Fire, deutsch, mit Schritten)

- [ ] **Step 1: Vater legt auf github.com ein öffentliches Repository `mal-app` an und aktiviert unter Settings → Pages die Quelle „GitHub Actions“.**

- [ ] **Step 2: Push**

```bash
git remote add origin https://github.com/<konto>/mal-app.git
git push -u origin main
```
Expected: Workflow grün; App unter `https://<konto>.github.io/mal-app/` erreichbar.

- [ ] **Step 3: Gerätetest (Vater, nach `docs/installation.md`)** – auf iPad (Safari → Teilen → Zum Home-Bildschirm) und Fire HD 11 (Silk → Menü → Zum Startbildschirm hinzufügen):
  - App startet vom Icon im Vollbild, Querformat.
  - Flugmodus an → App startet weiterhin.
  - Profil mit Kamera-Foto anlegen.
  - Jedes Werkzeug ausprobieren, Größen-Punkt, Palette, Zoom an/aus, Handballen beim Malen auflegen.
  - Speichern, App schließen, neu öffnen → Bild in Galerie, Weitermalen.

Expected: Alle Punkte funktionieren; Abweichungen als Fehler notieren und über superpowers:systematic-debugging beheben.

- [ ] **Step 4: Commit der Anleitung**

```bash
git add docs/installation.md && git commit -m "docs: Installationsanleitung für iPad und Fire" && git push
```
