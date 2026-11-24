# Mal-App für Kinder – Design

Stand: 2026-11-24 · Status: Entwurf zur Freigabe

Markierung: **[Entscheidung Vater]** = vom Auftraggeber so festgelegt.
**[Vorschlag Claude]** = von Claude vorgeschlagen und im Gespräch nicht widersprochen bzw. bestätigt.
**[Builder-Entscheidung]** = bewusst dem Umsetzenden überlassen.

---

## 1. Zweck und Warum

Die Tochter (Kindergartenalter, kann noch nicht lesen) malt abends gern am Tablet. Verfügbare Mal-Apps
haben nur wenige kostenlose Vorlagen, der Rest steckt hinter Kauf oder Abo. Ziel ist eine eigene,
kostenlose, werbefreie Mal-App, die auf den beiden Familien-Tablets läuft und stetig um neue Modi,
Werkzeuge und Vorlagen erweitert werden kann.

**Geräte:**
- Apple iPad, ca. 7 Jahre alt (≈ iPad 7. Gen. / iPadOS 17–18, Safari)
- Amazon Fire HD 11 (Fire OS, Silk-Browser, kein Google Play)

**Erfolg heißt:** Die Tochter wählt selbstständig ihr Profil, malt frei oder malt Vorlagen aus,
speichert Bilder und findet sie in der Galerie wieder – ohne Hilfe, ohne Text lesen zu müssen.
Die Eltern steuern die tägliche Malzeit.

## 2. Ziele, Nicht-Ziele, Anti-Ziele

**Ziele (Version 1)**
- Profilauswahl beim Start (wie bei Netflix), Profile mit Bild.
- Modi „Freies Malen“ und „Ausmalen“, dazu „Galerie“.
- Tägliches Malzeit-Kontingent pro Profil, mit Hinweisen vor Ablauf.
- Mitgelieferte Vektor-Vorlagen, offline, kostenlos.
- Architektur, in der neue Modi, Werkzeuge, Vorlagen und Vorlagenquellen ohne Umbau ergänzt werden.

**Nicht-Ziele (Version 1)**
- „Malen nach Zahlen“ (kommt später; Vorlagenformat soll es aber schon ermöglichen, s. 7.4).
- Online-Bildgenerator per Spracheingabe (später nachrüstbar, s. 7.4).
- Synchronisation zwischen Geräten. **[Entscheidung Vater]** Daten bleiben auf dem Gerät, auf dem sie entstanden sind.
- Native App / App-Store-Veröffentlichung (evtl. später, s. 4).
- Schutz gegen Manipulation der Geräteuhr.

**Anti-Ziele (wäre ein Fehlschlag, auch wenn es technisch funktioniert)**
- Kosten, Abos, Werbung, Tracking, Internetpflicht.
- Das Kind kann Bilder versehentlich endgültig verlieren.
- Bedienung erfordert Lesen.
- Nachbau einer bestehenden App oder Figuren aus Filmen/Serien (eigene, originelle Gestaltung und Vorlagen).

## 3. Rahmenbedingungen

- Läuft im Safari (iPad) und Silk (Fire HD 11), als zum Home-Bildschirm hinzugefügte Web-App (PWA).
- Komplett offline nach dem ersten Laden; keine laufenden Kosten.
- Kindergartenfreundlich: keine Texte in Kinderbereichen, große Ziele (mind. ca. 64 px), Abstand zwischen Knöpfen.
- Texte nur im Elternbereich, Sprache Deutsch.
- Speichergrenzen alter Geräte beachten (iOS-Canvas-Speicher, IndexedDB-Quoten).

## 4. Ansätze

| Ansatz | Beschreibung | Abwägung |
|---|---|---|
| **A) PWA (gewählt)** | Eine TypeScript-Web-App, Canvas zum Malen, IndexedDB als Speicher, Service Worker für Offline. Gehostet auf GitHub Pages (https). | Kostenlos, kein Mac, kein Store, ein Code für beide Geräte. Risiko: Löschen der Browserdaten löscht Bilder → Home-Bildschirm-Installation, `navigator.storage.persist()`, Export im Elternbereich. |
| B) Derselbe Code in App-Hülle (z. B. Capacitor) | APK für Fire, iOS-App via Xcode | Braucht Mac; iOS dauerhaft nur mit 99 €/Jahr-Konto. Kaum Mehrwert jetzt – **bleibt als späterer Weg für App-Store-Veröffentlichung**, ohne Umbau. |
| C) Nativ (Flutter o. ä.) | Neu entwickelt | Dieselben Hürden wie B, viel mehr Aufwand, kein Vorteil. Verworfen. |

**[Entscheidung Vater]** Ansatz A. Spätere Veröffentlichung im App Store ist denkbar → Code und Inhalte so halten,
dass B möglich bleibt (nur eigene Assets, keine fremd lizenzierten Inhalte, keine Abhängigkeit von Browser-Spezialitäten,
die in einer WebView fehlen).

**Hosting [Vorschlag Claude]:** GitHub Pages mit dem vorhandenen kostenlosen GitHub-Konto des Vaters. Dafür muss das Repository **öffentlich** sein, Quellcode und Vorlagen sind also für jeden sichtbar. Alle Nutzerdaten (Profile, Bilder) bleiben lokal auf den Tablets. Ein privates Repository bräuchte ein kostenpflichtiges Konto oder einen anderen Hoster.

## 5. Bildschirme und Abläufe

### 5.1 Profilauswahl (Startbildschirm)
```
  (Bild) (Bild) ( + )
   Lena   Mia    Neu            ⚙ Eltern
```
- **[Entscheidung Vater]** Beim Öffnen erscheint zuerst die Profilauswahl. Profile haben ein Bild.
- Profilbild: aus den eigenen gespeicherten Bildern wählen **oder** mit der Kamera aufnehmen; jederzeit änderbar. **[Entscheidung Vater]**
- Name wird klein unter dem Bild angezeigt (für Eltern; Kind erkennt sich am Bild). **[Vorschlag Claude]**
- „+ Neu“ und „⚙ Eltern“ führen in den PIN-geschützten Elternbereich. **[Vorschlag Claude]**
- Ist das Kontingent eines Profils für heute aufgebraucht, ist das Profil sichtbar markiert (z. B. Mond-Symbol); Antippen öffnet nur die Galerie. **[Vorschlag Claude]**

### 5.2 Tägliche Kontingent-Abfrage
- **[Entscheidung Vater]** Beim ersten Öffnen der App an jedem Tag (lokales Datum) werden die Eltern nach dem heutigen Kontingent gefragt. Jedes Profil hat einen hinterlegten Standardwert (z. B. 0 Std 30 Min).
- **[Vorschlag Claude]** Eine gemeinsame Abfrage für alle Kinderprofile, vorausgefüllt mit den Standardwerten:
  - „Standard übernehmen“ → ohne PIN möglich.
  - „Ändern“ → PIN erforderlich, dann Werte pro Profil per Zeitregler einstellen.
- Gilt nur für den Tag; am nächsten Tag beginnt alles neu.
- Bewusst so gewollt: Tippt das Kind selbst „Standard übernehmen“, gilt einfach der von den Eltern hinterlegte Standard. Die Abfrage ist die Gelegenheit zum Ändern, keine Sperre.

### 5.3 Zeitregler (überall, wo Zeiten eingestellt werden) **[Entscheidung Vater]**
- Anzeige: `[ 0 ] Std  [ 30 ] Min`.
- Langes Drücken auf eine Zahl öffnet eine Auswahl-Rolle; Finger nach oben/unten verschiebt den Wert, Loslassen übernimmt.
- Stunden in 1er-Schritten (0–23), Minuten in 5er-Schritten (0–55).
- Wird verwendet für: Standardkontingent im Profil, Tagesabfrage, Hinweis-Zeitpunkte (dort nur Minuten).

### 5.4 Modus-Bildschirm (nach Profilauswahl)
```
 [Galerie] [Freies Malen] [Ausmalen] [ ... ]      ← Reihe 1: Modi
 [Tiere] [Fahrzeuge] [Dinos] [ ... ]              ← Reihe 2: nur nach Tipp auf „Ausmalen“
 [Bild] [Bild] [Bild] [Bild] [ ... ]              ← Reihe 3: Vorlagen des gewählten Themas
```
- **[Entscheidung Vater]** Galerie fest oben links, gleiche Kachelgröße wie die Modi.
- „Freies Malen“ → direkt zur Malfläche (leer).
- „Ausmalen“ → Reihe 2 mit Themen erscheint; Thema antippen → Reihe 3 mit Vorlagen; Vorlage antippen → Malfläche mit Vorlage.
- **[Entscheidung Vater]** Jede Reihe ist horizontal wischbar, wenn mehr Einträge als Platz da sind.
- **[Vorschlag Claude]** Letzte sichtbare Kachel ragt halb aus dem Rand, damit erkennbar ist, dass man wischen kann.
- Zurück-Knopf zur Profilauswahl (Symbol, oben).

### 5.5 Malfläche (Freies Malen und Ausmalen)
```
 ┌────────────────────────────┬──┬──┐
 │ ⌂                          │🌈│🖌│   ⌂ = zurück zum Modus-Bildschirm
 │                            │◼ │✏️│   🌈 = Farbpalette (≈100 Farben)
 │                            │🔴│🖊│   ◼ = zuletzt gewählte freie Farbe
 │        Malfläche           │🟠│💨│
 │                            │🟡│🪣│
 │                            │..│✨│
 │                            │⚫│⭐│
 │  ↶  🗑  💾  🔍             │ ● │🧽│   ● = Strichdicke, 🔍 = Zoom an/aus
 └────────────────────────────┴──┴──┘
```
- **[Entscheidung Vater]** Werkzeuge und Farben rechts. **[Vorschlag Claude]** Werkzeuge ganz außen am Rand, Farben direkt neben der Malfläche, Strichdicke-Punkt unter den Farben.
- **Farben:** ganz oben ein Regenbogen-Knopf **[Entscheidung Vater]**, der ein Pop-up mit ca. 100 Farben öffnet (**[Vorschlag Claude]** 10 Farbtöne × 10 Helligkeiten + eine Grau-bis-Schwarz-Reihe). Darunter ein Tupfer mit der zuletzt frei gewählten Farbe **[Vorschlag Claude]**, darunter ca. 12–16 feste Grundfarben.
- **Strichdicke [Entscheidung Vater]:** Ein Punkt zeigt die aktuelle Größe. Drücken und halten, dann nach **links ziehen = größer**, nach **rechts ziehen = kleiner**, stufenlos; je weiter gezogen, desto stärker die Änderung. **[Vorschlag Claude]** Beim Halten erscheint eine vergrößerte Vorschau in aktueller Farbe; Dicke wird pro Werkzeug gemerkt.
- **Rückgängig** (↶): immer sichtbar, groß. **[Vorschlag Claude]**
- **Leeren** (🗑): leert die Malfläche, ist rückgängig machbar. **[Vorschlag Claude]**
- **Speichern** (💾, Symbol „Bild wandert in Bilderrahmen“): speichert in die Galerie des Profils. **[Vorschlag Claude]**
  - Neues Bild: erstes Speichern legt Galerie-Eintrag an, weiteres Speichern aktualisiert denselben Eintrag.
  - Aus der Galerie geöffnetes Bild: Speichern aktualisiert dieses Bild.
- **Schutz vor Überschreiben [Vorschlag Claude]:** Wird ein bereits gespeichertes Bild überschrieben, wandert die vorherige Fassung in einen **Papierkorb im Elternbereich** (aufbewahrt 30 Tage, dort wiederherstellbar). Gilt auch für im Elternbereich gelöschte Bilder. So kann ein Kind durch Leeren + Zurück kein Bild endgültig verlieren.
- **Automatisches Speichern** beim Verlassen der Malfläche (⌂), beim Kontingent-Ende und wenn die App in den Hintergrund geht. **[Vorschlag Claude]** (Leere, unveränderte Flächen werden nicht gespeichert.)
- Querformat. **[Vorschlag Claude]**
- **Zoom-Schalter [Entscheidung Vater]:** Ein Lupen-Knopf (neben ↶ 🗑 💾) schaltet Zoom an und aus.
  - **Aus (Standard):** Ganzes Bild sichtbar; nur ein Finger malt, weitere Berührungen werden ignoriert.
  - **An [Vorschlag Claude]:** Mit zwei Fingern vergrößern (1× bis ca. 4×) und verschieben; ein Finger malt weiter wie gewohnt. Der Knopf leuchtet, solange Zoom an ist.
  - Wieder ausschalten springt zurück auf das ganze Bild.
  - Das Koordinatenmodell (Malen, Rückgängig, Eimer, Vorlagen-Ebene) ist von Anfang an auf Zoom ausgelegt.

### 5.6 Werkzeuge (Version 1) **[Entscheidung Vater]**, Verhalten **[Vorschlag Claude]**
| Werkzeug | Verhalten |
|---|---|
| Pinsel | weich, leicht deckend, wird bei schnellen Bewegungen etwas dünner |
| Filzstift | kräftig, gleichmäßig, leicht durchscheinend an Überschneidungen |
| Fineliner | dünn, scharfkantig, für Details |
| Sprühdose | Punktwolke, wird dichter, je länger man an einer Stelle bleibt |
| Eimer | füllt eine umrandete Fläche (Toleranz für Kantenglättung) |
| Zauberstift | Farbe wechselt beim Malen fließend durch den Regenbogen (ignoriert gewählte Farbe) |
| Musterstift | hinterlässt Spur aus Formen (Sterne, Herzen, Punkte) in gewählter Farbe |
| Texturstift | Strich mit Oberfläche (z. B. Wachsmalstift, Kreide, Stoff, Glitzer) in gewählter Farbe |
| Radiergummi | radiert gemalte Farbe |

- Varianten (Form beim Musterstift, Oberfläche beim Texturstift): **[Vorschlag Claude]** langes Drücken auf das Werkzeug öffnet eine kleine Bildauswahl.
- Spätere Ideen (nicht Version 1): Spiegelmalen, Stempel/Sticker, Glitzerstift, Neonstift.

### 5.7 Ausmalen – Besonderheiten **[Vorschlag Claude]**
- Gleiche Malfläche und Werkzeuge wie Freies Malen.
- Die schwarzen Umrisslinien der Vorlage liegen immer obenauf und können weder übermalt noch radiert werden.
- Der Eimer füllt genau eine Fläche der Vorlage (Grenzen = Vorlagenlinien plus bereits Gemaltes wie im freien Modus – **[Builder-Entscheidung]**, ob nur Vorlagenlinien als Grenze zählen; Empfehlung: nur Vorlagenlinien, das ist für Kinder vorhersehbarer).

### 5.8 Galerie **[Vorschlag Claude]**
- Zeigt nur die Bilder des aktuellen Profils, als Raster großer Vorschaubilder, neueste zuerst.
- Bild antippen → öffnet es im ursprünglichen Modus (bei Ausmalen mit Vorlage) zum Weitermalen.
- Kind kann **nichts löschen**; Löschen nur im Elternbereich.
- Auch nach Ablauf des Kontingents anschaubar, aber nicht zum Weitermalen öffnbar.

### 5.9 Kontingent während des Malens
- **[Entscheidung Vater]** Tageskontingent pro Profil.
- **[Vorschlag Claude]** Zeit läuft nur, solange eine Malfläche sichtbar und die App im Vordergrund ist. Verbrauchte Zeit wird laufend gespeichert, damit Schließen/Neuöffnen nichts zurücksetzt.
- **[Entscheidung Vater]** Konfigurierbare Hinweise vor Ablauf: pro Profil eine Liste von Zeitpunkten („5 Min, 1 Min“), beliebig viele oder keine. **[Vorschlag Claude]** Standard: 5 Min und 1 Min.
- Hinweis ohne Text **[Vorschlag Claude]**: kurz eingeblendete Sanduhr mit sichtbarer Restzeit (z. B. kleiner werdender Balken), blockiert das Malen nicht.
- Bei Ablauf **[Entscheidung Vater]**: automatisch speichern, Hinweis, dass nicht mehr gemalt werden kann. **[Vorschlag Claude]** Freundlicher „Für heute ist Schluss“-Bildschirm (Bild, z. B. schlafender Mond), mit Wegen zur Galerie und zur Profilauswahl.
- Kontingent 0 = an diesem Tag kein Malen für dieses Profil.

### 5.10 Elternbereich **[Vorschlag Claude]**
- Geschützt durch 4-stellige PIN, die beim allerersten Start festgelegt wird.
- „PIN vergessen“: Zurücksetzen nach Lösen einer Rechenaufgabe, die Kindergartenkinder nicht lösen (z. B. 7 × 8).
- Funktionen:
  - Profile anlegen, umbenennen, Bild ändern (Galerie oder Kamera), löschen (mit Rückfrage; löscht auch die Bilder).
  - Pro Profil: Standardkontingent, Hinweis-Zeitpunkte.
  - Heutiges Kontingent nachträglich ändern (z. B. Zeit verlängern).
  - Bilder löschen.
  - Galerie exportieren (Bilder als Dateien teilen/herunterladen) als Schutz gegen Datenverlust.
  - PIN ändern.
- Erste-Schritte-Hinweis: App zum Home-Bildschirm hinzufügen (mit Anleitung für iPad und Fire).

## 6. Vorlagen **[Vorschlag Claude, bestätigt]**
- Von Claude erstellte Vektorgrafiken (SVG), einfacher, klarer Strichstil für Kleinkinder; schwarze, geschlossene Umrisse, weiße Flächen.
- Jede ausmalbare Fläche ist ein eigenes, geschlossenes Element mit ID (Grundlage für späteres „Malen nach Zahlen“).
- Start: **5 Themen × 8 Vorlagen**: Tiere, Fahrzeuge, Dinos, Einhörner & Fabelwesen, Meer & Unterwasser.
- Weitere Themen für später: Bauernhof, Märchen & Schlösser, Weltraum, Blumen & Natur, Essen & Süßes, Feste, einfache Mandalas.
- Themen haben ein Symbolbild (für Reihe 2), Vorlagen ein Vorschaubild (für Reihe 3).
- Neue Vorlage = neue SVG-Datei + Eintrag im Katalog (eine Datei, z. B. JSON). Keine Codeänderung nötig.
- Ausschließlich eigene, originelle Motive, keine bekannten Figuren.
- Reihenfolge **[Vorschlag Claude]**: Zuerst 2–3 Probevorlagen, deren Stil der Vater freigibt. Die App kann mit einem ersten Thema lauffähig sein; die übrigen Themen kommen schrittweise über den Katalog dazu. Die Version 1 ist erst mit allen 5 × 8 Vorlagen vollständig.

## 7. Architektur

### 7.1 Technik **[Vorschlag Claude]**
- TypeScript, Vite als Build, PWA mit Service Worker (Precache aller App-Dateien und Vorlagen) und Manifest (Querformat, Vollbild).
- Malen auf Canvas 2D mit Pointer Events (Finger und Stift).
- Speicher: IndexedDB (Profile, Einstellungen, Kontingentstand, Bilder als PNG-Blob + Vorschaubild + Metadaten). `navigator.storage.persist()` anfragen.
- UI-Bibliothek: **[Builder-Entscheidung]**; Empfehlung: schlank (z. B. kein Framework oder Preact), wegen älterer Geräte.
- Deployment: GitHub Pages über GitHub Actions.
- Updates **[Vorschlag Claude]**: neue Version wird im Hintergrund geladen und erst beim nächsten Start aktiv – nie mitten im Malen.
- Eingabe **[Vorschlag Claude]**: für Finger ausgelegt; Stift funktioniert über Pointer Events mit, Druckstärke wird genutzt, wenn vorhanden. Während ein Finger malt, werden weitere Berührungen (Handballen) ignoriert; Ausnahme ist die Zwei-Finger-Geste bei eingeschaltetem Zoom (s. 5.5).
- Zielplattformen: aktuelles iPadOS/Safari des iPads und aktuelle Fire OS/Silk-Version des Fire HD 11; Funktionen, die fehlen könnten (z. B. Teilen von Dateien beim Export), brauchen einen Ausweichweg (Download).

### 7.2 Erweiterbarkeit: Modi **[Entscheidung Vater]**, Umsetzung **[Vorschlag Claude]**
- Jeder Modus ist ein abgeschlossenes Modul mit festem Vertrag (ID, Symbol, Reihenfolge, ob er Zusatzreihen im Menü braucht, Start-Funktion).
- Modi werden an genau einer Stelle registriert; der Modus-Bildschirm baut sich daraus auf.
- Galerie ist technisch ebenfalls ein Eintrag, aber fest an Position 1.

### 7.3 Erweiterbarkeit: Werkzeuge **[Vorschlag Claude]**
- Jedes Werkzeug ist ein Modul mit festem Vertrag (ID, Symbol, optionale Varianten, Reaktion auf Strich-Beginn/-Bewegung/-Ende bzw. Tipp, Größenbereich).
- Registrierung an einer Stelle; die Werkzeugleiste baut sich daraus auf.

### 7.4 Erweiterbarkeit: Vorlagenquellen **[Entscheidung Vater]**
- Der Ausmal-Modus bezieht Themen und Vorlagen über eine austauschbare **Vorlagenquelle** (liefert Themen, Vorlagen je Thema, lädt Vorlage).
- Version 1: nur Quelle „mitgelieferter Katalog“ (offline, kostenlos).
- Später nachrüstbar: Quelle „Online-Generator“ – Spracheingabe (z. B. Diktat über Tastatur-Mikrofon), Aufruf eines Bild-APIs mit Ausmalbild-Anweisung, Schlüssel und Tageslimit im Elternbereich. Generierte Bilder wären Rasterbilder; Eimer arbeitet deshalb rasterbasiert (Flood-Fill auf Linienmaske) und funktioniert für SVG- und Rastervorlagen gleich.
- „Malen nach Zahlen“ kann später als eigener Modus dieselben SVG-Vorlagen mit Flächen-IDs nutzen.

### 7.5 Datenmodell (grob) **[Vorschlag Claude]**
- `Profil`: id, name, bild (Blob), standardKontingentMin, hinweiseMin[], erstellt.
- `Tageskontingent`: datum, profilId, erlaubtMin, verbrauchtSek.
- `Bild`: id, profilId, modusId, vorlageId?, malEbene (PNG-Blob), vorschau (Blob), erstellt, geändert.
- `Einstellungen`: pinHash, letzteTagesabfrage (Datum).
- Bild wird als Malebene ohne Vorlage gespeichert; Vorlage wird beim Öffnen/Anzeigen darübergelegt.

## 8. Dem Builder überlassen
- UI-Bibliothek, Projektstruktur, Teststrategie im Detail (Empfehlung: Unit-Tests für Kontingent-Logik, Datumswechsel, Speicher; manuelle Tests auf beiden Geräten).
- Canvas-Auflösung (Empfehlung: Bildschirmgröße × Pixeldichte, Obergrenze wegen iOS-Speichergrenzen), Anzahl Rückgängig-Schritte (Empfehlung ≈ 20, speicherabhängig).
- Konkrete Grundfarben, Farbraster, Symbole und Illustrationen im kindgerechten Stil.
- Genaues Strichverhalten (Glättung, Druck-/Geschwindigkeitskurven).
- Exportformat der Galerie.
