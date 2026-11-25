# Taino: Name, Profile, Mandala, Spiele, Puzzle, neue Vorlagen

Freigabe: Der Vater hat am 2026-11-25 abends gesagt: „bitte alle besprochenen Änderungen umsetzen“. Die Antworten auf die Fragen 1–6 stehen im Chat. Mit (E) markierte Punkte habe ich nachts selbst entschieden. Sie stehen im Morgenbericht und müssen noch abgenickt werden.

## Name und Startseite
- Die App heißt **Taino**. Das betrifft Manifest, Seitentitel und Willkommenstext.
- Hinter der Profilauswahl liegt ein buntes Bild mit Kindern, die malen und spielen.
- (E) Das Bild ist vorerst eine selbst gezeichnete SVG-Datei (`public/start-bild.svg`). Der Vater kann es später durch ein Generator-Bild ersetzen; den Text dafür bekommt er im Bericht.

## Profile: Kind oder Erwachsener
- `Profile.kind` ist `'child'` oder `'adult'`. Bestehende Profile gelten als `child`.
- Wer ein Erwachsenen-Profil antippt, muss die PIN eingeben.
- Im Modus-Menü haben Erwachsene einen Schalter für die Nutzungszeit (Uhr an/aus), gespeichert als `Profile.unlimited`. Ist sie aus, startet keine Zeitzählung und es erscheint kein Mond.
- Überall heißt es jetzt „Nutzungszeit“ statt „Malzeit“.
- (E) Die Tagesabfrage listet nur Kinder.
- (E) Für Erwachsene mit eingeschalteter Uhr gilt ihr Standardwert.

## Mandala
- Ein neuer Modus. In Reihe 2 stehen die Kacheln für 1 bis 5 Spiegelachsen.
- Die Malfläche ist die vom freien Malen, mit Spiegelung um die Bildmitte:
  - n Achsen ergeben 2n Kopien (n Drehungen, jede zusätzlich gespiegelt);
  - 1 Achse ist die senkrechte Links-rechts-Spiegelung.
- Technik:
  - Ein Strich entsteht auf einer Hilfsebene; jedes Bild wird die Malebene im betroffenen Bereich aus der Kopie vom Strichbeginn neu aufgebaut, dann werden die 2n Kopien darübergelegt.
  - Der Radierer läuft als Maske mit `destination-out`.
  - Der Eimer füllt an allen 2n gespiegelten Punkten.
- Dünne Hilfslinien zeigen die Achsen; sie werden nicht gespeichert.
- Die Achsenzahl steckt in `modeId` (`mandala-3`). So öffnet die Galerie das Bild wieder mit derselben Spiegelung.

## Spiele (Modus „Spiele“, Reihe 2: Tic-Tac-Toe, Vier gewinnt, Mühle, Puzzle)
- Zwei Spieler an einem iPad.
- Spieler 1 ist das aktive Profil. Spieler 2 wird vor dem Spiel gewählt: eins der anderen Profile oder „Gast“.
- Das Spiel zeigt ohne Text an, wer dran ist: Avatar hervorgehoben, Steinfarbe des Spielers.
- Am Ende kommen ein Gewinner-Avatar, Konfetti und „Nochmal“.
- (E) Die Nutzungszeit zählt nur für das Profil, das das Spiel geöffnet hat.
- Die Spiellogik liegt getrennt von der Oberfläche und ist mit Unit-Tests abgesichert.
- **Mühle:** Setzen (je 9), Ziehen entlang der Linien und Springen bei 3 Steinen.
  - Mühle → einen gegnerischen Stein nehmen, nicht aus einer Mühle, außer alle sind in Mühlen.
  - Verloren hat, wer weniger als 3 Steine hat oder nicht mehr ziehen kann.

## Puzzle
- Motive in Reihe 3:
  - eigene Puzzlebilder aus `public/puzzles/catalog.json`;
  - die Bilder aus der Galerie des Profils.
- (E) Noch gibt es keine eigenen farbigen Puzzlebilder. Bis der Vater welche erzeugt, nimmt der Katalog die Ausmal-Vorlagen.
- Danach kommt die Wahl der Teilezahl: 6, 12, 20, 35, 48, 70 oder 108 Teile (Raster im Seitenverhältnis 4:3).
- (E) Die Teilezahlen weichen leicht von 5/10/16/24/48/60/100 ab, damit die Teile ungefähr quadratisch werden.
- Die Teile haben echte Puzzleformen mit Nasen. Ziehen ist ohne Drehen möglich. In der Nähe des richtigen Platzes rastet ein Teil ein. Ein blasses Vorschaubild liegt auf dem Brett.

## Ausmal-Vorlagen
- Die 6 Generator-Bilder aus `vorlagen-roh/fabelwesen` werden zu Vektorlinien.
- Das Skript `scripts/convert-templates.mjs` (potrace) macht das so:
  1. schwarz-weiß machen;
  2. dünne Linien leicht verdicken;
  3. als SVG im Format 4:3 speichern.
- Sie ersetzen mein altes Einhorn im Thema Fabelwesen.
- (E) Die übrigen alten Vorlagen bleiben, bis Ersatz kommt.
- `vorlagen-roh/` kommt nicht ins Git.
