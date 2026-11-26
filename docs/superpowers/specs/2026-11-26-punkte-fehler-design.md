# Punkte verbinden, Fehler finden, neue Stempel

Wunsch des Vaters am Abend des 2026-11-26. Er hat ausdrücklich gesagt: umsetzen und direkt veröffentlichen, Rückfragen nur falls nötig (es gab keine). (E) = meine Entscheidung, bitte prüfen.

## Ansatz

Wie bisher im bestehenden Aufbau: neue Modi in der Modus-Registry (Gruppen „Malen“ bzw. „Spielen“), eigene Bildschirme, Bilder als selbst gezeichnete SVGs. Rasterbilder (Generator) für „Fehler finden“ wurden verworfen: Unterschiede ließen sich dort nur mit sichtbaren Flicken einbauen.

## 1. Malmodus „Punkte verbinden“ (Gruppe Malen)

- 5 eigene Vorlagen (E): Stern, Haus, Fisch, Ente, Rakete. Je 10–22 Punkte, Zahlen 1…n lückenlos, jede einmal. Kleine Zusatzlinien (z. B. Auge, Fenster) sind schon vorgezeichnet.
- Verbinden: Finger auf die Punkte nacheinander ziehen oder tippen. Berührt der Finger den nächsten Punkt, entsteht eine gerade Linie vom letzten Punkt dorthin. Falsche Punkte werden ignoriert (kein Fehler-Ton). (E) Nach 8 s ohne Fortschritt pulsiert der nächste Punkt als Hilfe.
- Nach dem letzten Punkt schließt sich das Bild, es regnet Lametta. Danach zwei große Knöpfe: Pinsel = „ausmalen“, Haus = zurück ins Menü.
- Ausmalen öffnet den normalen Malbildschirm mit dem fertigen Umriss als Ausmalvorlage (Eimer füllt die Flächen). Die Umrisse liegen als versteckte Vorlagen in `public/templates/punkte/` (wie das alte Einhorn), damit gespeicherte Bilder sie wieder laden.

## 2. Spiel „Fehler finden“ (Gruppe Spielen)

- Zwei gleich große Bilder nebeneinander. Im rechten Bild sind 5 Unterschiede (Farbe anders, etwas fehlt, etwas ist dazugekommen).
- 5 eigene Bilder (E): Garten mit Haus, Strand, Weltraum, Bauernhof, Kinderzimmer.
- Markieren: mit dem Finger im rechten Bild einkreisen. Ein Unterschied zählt, wenn seine Mitte innerhalb des Kreises liegt (der Kreis muss nicht ganz geschlossen sein). Getroffene Unterschiede bekommen in beiden Bildern einen dauerhaften Kreis. Daneben gezogene Kreise verblassen.
- Oben zeigen 5 Kästchen, wie viele schon gefunden sind.
- Alle 5 gefunden: Lametta, dann „Nochmal“ (nächstes Bild) oder zurück.
- Hilfe-Knopf (Glühbirne) (E): erscheint nach 30 s. Er lässt die noch nicht gefundenen Unterschiede blinkend eingekreist erscheinen.
- Ein Spieler, keine Gegnerwahl. Nutzungszeit zählt wie bei den anderen Spielen.

## 3. Stempel

- Der Stempel (Sterne, Herzen, Punkte) bekommt Blüten, Sonnen und Wolken dazu. Sie funktionieren auch mit Glitzer.

## Lametta

- Glänzende, schmale Streifen in Gold, Silber und Farben, die schaukelnd herabfallen. Sie unterscheiden sich vom Konfetti der Brettspiele.
