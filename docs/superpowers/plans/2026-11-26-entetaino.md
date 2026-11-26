# EnteTaino Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Feedbackrunde 3 umsetzen: Name EnteTaino, animiertes Startbild mit Ente, Drei-Kachel-Menü mit Beschriftung, Glitzerfarben, neue Werkzeugsymbole, Spiele mit Gegner- und Farbwahl, Fixes für Tic-Tac-Toe und Vier gewinnt.

**Architecture:** Bestehende Screens und Registries erweitern. Modi bekommen `group` und `label`, das Menü zeigt Gruppen. Die Farbe erhält ein `glitter`-Flag, das über `ToolContext` an die Werkzeuge geht. Die Spiele bekommen eine Farbwahl-Stufe und eine Farbliste statt fester `PLAYER_COLORS`.

**Tech Stack:** Vite, TypeScript strict, Vitest (jsdom), Playwright (chromium + webkit, `--workers=1` für webkit).

**Spec:** docs/superpowers/specs/2026-11-26-entetaino-design.md

## Global Constraints

- Nur iPad mit altem Safari: keine `<button>` als Flex-/Grid-Container für Layout, das davon abhängt. Animationen nur über transform/opacity.
- Name überall „EnteTaino“.
- Jede Menü-Kachel hat eine Beschriftung (`.tile-label`).
- Node: `export PATH="/c/Program Files/nodejs:$PATH"`. WebKit-E2E mit `--workers=1`.
- Commits enden mit `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Arbeit auf Branch `feature/entetaino`, kein Push ohne Freigabe.

## Review Focus

1. Startanimation darf nicht hängen bleiben: Profile müssen auch erscheinen, wenn `animationend` nie feuert (Timeout-Fallback).
2. Glitzer + Mandala/Ausmalen: Glitzer-Eimer innerhalb einer Vorlagenfläche und gespiegelte Glitzerstriche müssen funktionieren.
3. Farbwahl: Beide Spieler dürfen nicht dieselbe Farbe nehmen; „Nochmal“ behält die Farben.
4. Zurück-Navigation: Aus Malen/Spielen kommt man ins passende Untermenü zurück, nicht auf Ebene 1.
5. Vier gewinnt auf WebKit: Löcher haben echte Höhe, Steine sind sichtbar.

---

### Task 1: Name EnteTaino und Startanimation mit Ente

**Files:** Modify `index.html`, `vite.config.ts`, `src/screens/profile-select.ts`, `src/screens/pin-setup.ts`, `src/assets/start-bild.svg` (Gruppen mit Klassen), `src/styles.css`. Create `src/ui/intro.ts`. Test: `e2e/taino.spec.ts`, `e2e/helpers.ts`.

**Interfaces:**
- Produces: `playIntro(root: HTMLElement): Promise<void>` baut das Startbild als Inline-SVG mit gestaffelten Teil-Animationen auf, lässt die Ente hüpfen und resolved nach Ende, beim Antippen sofort oder spätestens nach 7 s Fallback. `introSeen()` / `markIntroSeen()` über `sessionStorage['ente-intro']`.
- Das Startbild wird inline eingefügt (statt CSS-Hintergrund), damit Teile animierbar sind. Die Ente sitzt danach im Bild.

- [ ] Test: Ohne Flag ist `[data-testid=intro]` sichtbar und die Profile sind es nicht. Nach Antippen erscheinen die Profile. Titel und `.brand` sind „EnteTaino“. Helpers setzen per `addInitScript` das Flag, damit andere Tests die Animation überspringen.
- [ ] Umsetzen, Tests laufen lassen, committen.

### Task 2: Menü mit drei Kacheln und Beschriftung

**Files:** Modify `src/modes/registry.ts`, alle `src/modes/*/index.ts`, `src/modes/index.ts`, `src/screens/mode-menu.ts`, `src/ui/tile-row.ts`, `src/ui/icons.ts` (neue Bilder: Galerie, Malen, Spielen), `src/styles.css`, Zurück-Ziele in `paint-screen.ts`, `game-screen.ts`, `player-select.ts`, `puzzle-screen.ts`. Remove `src/modes/games/index.ts` → ersetzt durch einzelne Spielmodi. Test: `e2e/mode-menu.spec.ts`, betroffene Specs.

**Interfaces:**
- `Mode` bekommt `label: string` und `group?: 'paint' | 'play'`. `MenuTile` bekommt `label?: string`. `TileItem.label?` wird als `<span class="tile-label">` unter dem Bild dargestellt.
- `modeMenuScreen(profile, group?: 'paint' | 'play')`. Ebene 1: Galerie (open) und die Gruppenkacheln `tile-paint` („Malen“), `tile-play` („Spielen“). Eine Gruppe ersetzt Ebene 1 durch ihre Modi und einen großen Zurück-Pfeil (`group-back`). Reihen 2/3 bleiben.
- Spielmodi: `tictactoe`, `connect4`, `muehle` (open → Gegnerwahl), `puzzle` (expand → Motive mit Beschriftung). Ausmal-Themen bekommen ihre Namen, Mandala-Achsen „1 Achse“ … „5 Achsen“, Puzzle-Motive ihre Titel (bei Galeriebildern „Mein Bild“).
- Pop-/Hüpf-Animation beim Antippen (`.tile.bounce`), Einblendung neuer Ebenen (`.tile-row.enter`).

- [ ] Test: Ebene 1 hat genau 3 Kacheln mit den Beschriftungen Galerie/Malen/Spielen. Malen zeigt free-paint/coloring/mandala, Spielen zeigt 4 Spiele. Zurück aus dem Malbildschirm landet im Malen-Untermenü.
- [ ] Umsetzen, Specs anpassen, committen.

### Task 3: Farbspalte fixiert, Palette mit Reitern, Glitzerfarben

**Files:** Modify `src/paint/paint-screen.ts`, `src/paint/palette-popup.ts`, `src/tools/types.ts`, `brush.ts`, `marker.ts`, `fineliner.ts`, `spray.ts`, `bucket.ts`, `pattern.ts`, `texture.ts`, `src/tools/textures.ts`, `src/styles.css`. Create `src/tools/glitter.ts` (+ test).

**Interfaces:**
- `ToolContext.glitter?: boolean`.
- `glitter.ts`: `glitterTile(color): HTMLCanvasElement` (64×64, Grundfarbe + weiße und hellgelbe Funken), `paintStyle(c: ToolContext): string | CanvasPattern` und `sparkleImage(img: ImageData, before: Uint8ClampedArray, color: string)`. Letzteres ersetzt geänderte Pixel durch Pixel des Glitzer-Tiles an `(x % 64, y % 64)`. Es wird vom Eimer genutzt, auch bei Ausmalen und Mandala.
- Stempel (pattern): Bei Glitzer füllt er die Grundfarbe und setzt danach Funkelpunkte, die auf die Form beschnitten sind.
- `openPalettePopup(current, glitter, onPick(color, glitter))` mit Reitern `palette-tab-normal` und `palette-tab-glitter`. Die Glitzer-Zellen haben die Klasse `glitter`.
- Farbspalte: `.color-fixed` (Regenbogen, Größe, weiße Trennlinie) und `.color-scroll` (eigene Farbe und Grundfarben).

- [ ] Unit-Test `glitter.test.ts`: `sparkleImage` lässt unveränderte Pixel unberührt. Geänderte Pixel bekommen Funken, und mindestens ein Pixel ist heller als die Grundfarbe.
- [ ] E2E: Reiter wechseln, eine Glitzerfarbe wählen und malen. Ergebnis: Im Strich gibt es Pixel unterschiedlicher Farbe. Regenbogen und Größe bleiben beim Scrollen der Farben stehen (`.color-fixed` liegt außerhalb des Scrollbereichs).
- [ ] Umsetzen, committen.

### Task 4: Werkzeugsymbole und Muster

**Files:** Modify `src/ui/icons.ts`, `src/paint/paint-screen.ts` (Varianten-Knopf), `src/tools/textures.ts`, `src/tools/texture.ts`, `src/styles.css`.

**Interfaces:**
- Neues Eimer-Symbol (kippender Eimer mit Klecks).
- Werkzeuge mit Varianten zeigen das aktuelle Variantensymbol groß im Werkzeugfeld (statt des Werkzeugsymbols). Daneben sitzt ein runder Wechsel-Knopf (`variant-switch-<tool>`, etwa 44 px, Kreispfeile), der das Varianten-Popup öffnet. Langes Drücken bleibt erhalten.
- Texturen deutlicher: Wachsmal mit groben Streifen und Lücken, Kreide hell und körnig mit deutlichen Lücken, Stoff mit kräftigem Karo. Die Glitzer-Variante entfällt.

- [ ] E2E: Ein Tipp auf `variant-switch-pattern` öffnet das Popup. Nach der Wahl „heart“ zeigt das Werkzeugfeld das Herz.
- [ ] Umsetzen, committen.

### Task 5: Gegnerwahl, Farbe einloggen, Tic-Tac-Toe- und Vier-gewinnt-Fix

**Files:** Modify `src/games/player-select.ts`, `src/games/game-screen.ts`, `src/games/board-games.ts`, `src/styles.css`, `e2e/games.spec.ts`.

**Interfaces:**
- `GAME_COLORS` mit 6 Farben. `gameScreen(owner, players, game, first?, colors?: [string, string])`. Fehlen die Farben, zeigt der Bildschirm erst die Farbwahl: zwei Seiten mit Avatar und den Testids `color-0-<i>` und `color-1-<i>`. Die Farbe des Gegners ist gesperrt. Haben beide gewählt, startet das Spiel. „Nochmal“ behält die Farben.
- `GameApi.color(p): string`. Die Spiele nutzen `api.color` statt `PLAYER_COLORS`.
- Gegnerwahl: links das eigene Profil groß (`me`), in der Mitte das „gegen“-Symbol, rechts die Kandidaten. Die Testids `opponent-*` bleiben.
- Tic-Tac-Toe: Raster `grid-template: repeat(3, minmax(0, 1fr)) / repeat(3, minmax(0, 1fr))`, Zellen fest, das SVG absolut positioniert.
- Vier gewinnt: Spalten sind `div` mit `data-testid=c4-col-<c>`, Klick per `pointerup`. Die Löcher bekommen eine feste Höhe per Grid statt Flex in Buttons.

- [ ] E2E: Farbwahl vor dem Spiel. Die gesperrte Farbe lässt sich nicht wählen. Bei Tic-Tac-Toe bleiben die Zellgrößen nach einem Zug gleich (gemessen). Bei Vier gewinnt hat ein Stein eine Höhe größer 20 px und die gewählte Farbe.
- [ ] Umsetzen, committen.

### Task 6: Prüfen

- [ ] Build, Unit-Tests, E2E chromium und webkit.
- [ ] Sichtprüfung im Browser: Intro, Menü, Palette, Spiele.
- [ ] Abschluss-Review durch frischen Prüfer, dann die Fixes.
