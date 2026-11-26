# EnteTaino – Feedbackrunde 3

Feedback des Vaters nach der ersten Nutzung von Taino. Ziel: kindlicher, übersichtlicher, intuitiver; dazu Fehler in Vier gewinnt und Tic-Tac-Toe beheben. Nur iPad (altes Safari). (E) = meine Entscheidung, bitte prüfen.

## Ansatz

Es gibt nur einen sinnvollen Weg: Der bestehende Aufbau bleibt (Vite, TypeScript, Screens, Modus-Registry, Werkzeug-Registry), und die Änderungen werden darin umgesetzt. Ein Umbau auf ein Framework oder eine Animationsbibliothek bringt dem alten iPad nichts und kostet Ladezeit. Animationen werden reine CSS-Animationen (transform/opacity), weil die auch auf alten iPads flüssig laufen.

## 1. Name und Start

- Name **EnteTaino** überall: Titel, Manifest, Schriftzug, PIN-Willkommen.
- Startbild wird animiert aufgebaut, etwa 4–5 s: Himmel → Sonne → Regenbogen → Wiese → Staffelei/Kinder → Spieltisch (jeweils einblenden und leicht hineinwachsen).
- Danach hüpft eine **Ente** (selbst gezeichnetes SVG im Stil des Bildes) in Sprüngen von links nach rechts durchs Bild. (E) Die Ente bleibt am Ende sitzen und gehört zum Bild.
- Erst nach der Animation erscheinen die Profile. Antippen überspringt die Animation. (E) Sie läuft bei jedem App-Start, nicht beim Zurückkehren aus dem Menü.

## 2. Menü

- Ebene 1: drei große Kacheln in der Mitte: **Galerie**, **Malen**, **Spielen**, mit neuen, kindlichen Bildern (selbst gezeichnete SVGs) und Beschriftung darunter.
- Galerie öffnet direkt. Malen → Kacheln Freies Malen, Ausmalen, Mandala. Spielen → Tic-Tac-Toe, Vier gewinnt, Mühle, Puzzle.
- (E) Die Unterebene ersetzt die drei Kacheln (mit großem Zurück-Pfeil), statt als Reihe darunter zu erscheinen. Das ist übersichtlicher. Tiefere Ebenen (Mandala-Achsen, Ausmal-Themen → Vorlagen, Puzzle-Motive) bleiben Reihen darunter.
- **Jede Kachel bekommt eine Beschriftung**, auch Ausmal-Themen, Mandala-Achsen und Puzzle-Motive.
- Kindlicher Look: runde, bunte Kacheln mit dickem Rand und Schatten, verspielte Schrift. Antippen: Hüpf-/Wackel-Animation, Ebenen gleiten bzw. ploppen herein.

## 3. Malen

- Farbspalte: Regenbogen und Pinselgröße sind oben fixiert. Nur die Farben darunter scrollen. Eine kleine weiße Trennlinie trennt beide Bereiche.
- Farbauswahl (Regenbogen): oben zwei Reiter **„Normal“** und **„Glitzer“**. Der Glitzer-Reiter selbst glitzert (Funkelpunkte und Stern), damit man ihn ohne Lesen erkennt. Darunter steht dieselbe Palette, im Glitzer-Reiter mit Glitzeroptik.
- **Glitzerfarbe = Glitzerkleber:** Grundfarbe mit hellen, weißen bzw. hellgelben Funkelpunkten im Strich. Sie wirkt bei allen Werkzeugen, die Farbe nutzen (Pinsel, Stift, Marker, Spray, Eimer, Stempel, Muster). Zauberstift und Radierer bleiben unverändert. Die Funkelpunkte stehen fest im Bild und bleiben beim Speichern erhalten. (E) Die gewählte Glitzerfarbe erscheint als Glitzer-Swatch oben in der Farbspalte.
- Neues Eimer-Symbol: kippender Farbeimer mit Klecks.
- Stempel-Werkzeug (Herzen/Sterne/Punkte) und Muster-Werkzeug: Das Werkzeug-Feld zeigt das aktuelle Motiv groß im Viereck. Daneben sitzt ein größerer runder Wechsel-Knopf (zwei kreisende Pfeile) statt des kleinen Abzeichens.
- Muster deutlicher machen: kräftigere, gut unterscheidbare Strukturen (Wachsmal grob, Kreide körnig hell, Stoff deutliches Karo). (E) Glitzer verschwindet aus dem Muster-Werkzeug, weil es jetzt eine eigene Farbe ist.

## 4. Spiele

- **Gegnerwahl neu:** Links groß das eigene Profil, in der Mitte ein „gegen“-Bild (z. B. Blitz), rechts zur Auswahl die anderen Profile und Gast.
- **Farbe einloggen** (Tic-Tac-Toe, Vier gewinnt, Mühle): Danach wählt jeder Spieler auf seiner Seite eine Farbe aus etwa 6. Die Farbe des anderen ist gesperrt. Haben beide gewählt, startet das Spiel automatisch. Die Farben gelten für Steine, X/O, Abzeichen und Konfetti. Das Puzzle ist ein Einzelspiel ohne Farbwahl.
- **Tic-Tac-Toe:** Raster mit festen, gleich großen Feldern. Ein gesetztes Zeichen verändert die Größe nicht.
- **Vier gewinnt:** Brett ohne `<button>`-Flex. Ältere iPad-Safaris legen Buttons nicht als Flex-Container aus, dadurch sind die Löcher 0 px hoch. Neu: Div-Raster mit festen Lochgrößen, Tipp auf die Spalte per Pointer-Ereignis. Steine müssen sichtbar fallen.
- **Puzzle:** Die Motivwahl bekommt ausgemalte Kinderbilder. Der Vater erzeugt sie mit dem Generator (Prompt liefere ich), dann werden sie in `public/puzzles/` eingetragen. Bis dahin bleiben die aktuellen Motive.

## Nicht-Ziele

- Keine Fire-Version, kein Framework, keine bewegten Glitzer-Effekte im gespeicherten Bild.

## Für den Umsetzer offen

- Genaue Zeichnung von Ente und Menübildern, Timing der Animationen, genaue Farbauswahl für die Spieler, Glitzer-Dichte.
- Bestehende Tests anpassen (Menü-Reihen, Spielerwahl, Badge-Testids).
