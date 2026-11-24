# Plan 3 – Ausmalen

> Ausgeführt inline (superpowers:executing-plans) in der Nacht 2026-11-25 ohne Rückfragemöglichkeit; Entscheidungen sind als **[Nacht-Entscheidung]** markiert und werden dem Vater morgens vorgelegt.

**Goal:** Modus „Ausmalen“: Themenreihe → Vorlagenreihe → Malfläche mit Vorlage, deren Linien immer obenauf liegen; Eimer füllt genau eine Fläche der Vorlage; Galerie öffnet Ausmalbilder samt Vorlage.

**Spec:** `docs/superpowers/specs/2026-11-24-mal-app-design.md` (5.4, 5.7, 6, 7.4)

## Global Constraints
- Vorlagen: eigene SVG, `viewBox="0 0 800 600"`, nur schwarze Konturen (`fill="none"`, `stroke="#000"`, Breite 6, runde Enden), geschlossene Flächen, weißer Hintergrund = transparent.
- Neue Vorlage = SVG-Datei + Eintrag in `public/templates/catalog.json`, keine Codeänderung.
- Austauschbare Vorlagenquelle (`TemplateSource`), Version 1 nur „Katalog“.
- Offline: Katalog und SVGs werden vom Service Worker vorab geladen (`globPatterns` enthält json/svg).

## Review Focus
1. Vorlage lädt verzögert, Kind malt sofort → Malen ist bis zum Laden gesperrt, nichts landet unter falscher Fläche.
2. Eimer auf eine Vorlagenlinie getippt → nichts passiert (kein Vollflächen-Füllen).
3. Radierer → entfernt nur Farbe, nie Vorlagenlinien.
4. Galerie-Vorschau eines Ausmalbilds zeigt Linien + Farbe.
5. Unbekannte/gelöschte Vorlage beim Weitermalen → Bild öffnet trotzdem (ohne Linien), kein Absturz.

## Tasks
1. **Flood-Fill-Region** (`src/paint/flood-fill.ts`): `floodRegion(img, x, y, tol): Uint8Array | null` (Maske, null bei Start auf Linie / außerhalb), `fillMask(target: ImageData, mask, rgba, dilate = 2)`. Tests: Maske innerhalb Rahmen, null auf Linie, Dilatation um 2 px.
2. **Vorlagenquelle** (`src/templates/`): `types.ts` (Theme, TemplateInfo, TemplateSource), `catalog.ts` mit `parseCatalog(json)` (validiert, verwirft fehlerhafte Einträge, Themen ohne Vorlagen ausgeblendet) + `catalogSource` (fetch `BASE_URL + 'templates/catalog.json'`, cached). Tests für `parseCatalog`.
3. **Modus-Vertrag** um `expand?(ctx, rows: MenuRows)` erweitern; Modus-Menü rendert Reihe 2/3 (`setRow(2|3, items|null)`); Kachel-Icons dürfen `<img>` enthalten. E2E: Ausmalen → Themenreihe → Vorlagenreihe.
4. **Malfläche mit Vorlage**: `PaintSurface` bekommt Linienebene (`setTemplate(img)`, `templateData()`), Vorschaubild enthält Linien; `paintScreen({template})` bzw. `picture.templateId` lädt SVG, sperrt Eingabe bis geladen; `ToolContext.boundary` → Eimer nutzt Vorlagenlinien als Grenze. E2E: Eimer in Fläche füllt, auf Linie nicht; Radierer lässt Linien.
5. **Vorlagen** **[Nacht-Entscheidung: Stil]**: Thema Tiere komplett (8) + je 1 Probevorlage für Fahrzeuge, Dinos, Einhörner & Fabelwesen, Meer. Themen-Symbol = erste Vorlage des Themas.
