# Plan 2 – Elternbereich und Tageskontingent

> Inline in der Nacht 2026-11-25 ausgeführt; **[Nacht-Entscheidung]** = vorläufig, wird dem Vater vorgelegt.

**Goal:** PIN-geschützter Elternbereich (Profile anlegen/bearbeiten/löschen, Standardkontingent, Hinweise, heutiges Kontingent, Papierkorb, Bilder löschen, Export, PIN ändern), tägliche Kontingent-Abfrage, Zeitregler, Kontingent-Zähler mit Hinweisen und „Für heute ist Schluss“.

**Spec:** `docs/superpowers/specs/2026-11-24-mal-app-design.md` (5.1–5.3, 5.8–5.10)

## Global Constraints
- Kein DB-Schemawechsel: alles Neue im vorhandenen `settings`-Store (Schlüssel/Wert).
- PIN: 4 Ziffern, gespeichert als SHA-256 mit Salz; „PIN vergessen“ → Rechenaufgabe 7 × 8.
- Zeitregler: Stunden 0–23 (1er), Minuten 0–55 (5er), langes Drücken + Ziehen.
- Kontingent zählt nur, solange eine Malfläche sichtbar ist; verbrauchte Zeit wird alle 5 s gespeichert.
- Kinderbereiche ohne Text.

## Review Focus
1. App am nächsten Tag geöffnet → neue Abfrage, gestriger Verbrauch zählt nicht.
2. App während des Malens geschlossen und neu geöffnet → verbrauchte Zeit bleibt erhalten.
3. Kontingent läuft mitten im Strich ab → Bild wird gespeichert, dann Schluss-Bildschirm.
4. Kind tippt im Schluss-Zustand auf sein Profil → nur Galerie, kein Weitermalen.
5. Falsche PIN → kein Zugang, kein Hinweis auf die richtige.

## Tasks
1. Reine Logik + Tests: `quota/quota.ts` (`dayKey`, `remainingSec`, `crossedWarnings`), `parent/pin.ts` (`hashPin`, `verifyPin`), `ui/time-wheel.ts` (`wheelValue`).
2. Speicher + Tests: `storage/settings.ts`, `storage/quota-store.ts` (Tageskontingent, Verbrauch, letzte Abfrage), `deleteProfile`, `deletePicture` (→ Papierkorb), `restoreFromTrash`, `deleteTrashEntry`.
3. UI: PIN-Eingabe/-Einrichtung, Elternbereich, Profil bearbeiten (inkl. Bild aus der App-Galerie), Zeitregler, Tagesabfrage, Kontingent-Zähler im Malbildschirm mit Sanduhr-Hinweis, Schluss-Bildschirm, Mond-Markierung, Galerie nur ansehen.
4. E2E: Einrichtung + Elternbereich, Tagesabfrage, Kontingent-Ablauf (Test-Minute über `window.__MAL_MINUTE_MS`).
