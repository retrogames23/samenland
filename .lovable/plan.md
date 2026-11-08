# Bauplatz auf dem Handy besser sichtbar machen

Die Pfeiltasten und das Bau-Feld unten bleiben wie sie sind. Was sich ändert, ist nur, wie man den Bauplatz auf der Karte sieht.

## Was heute schiefläuft (laut Screenshot und Code)
- Bei jedem Pfeiltipp rückt die Kamera den Bauplatz genau in die Bildschirmmitte. Auf dem Handy liegt diese Mitte aber halb hinter dem Bau-Feld, deshalb ist die grüne Raute unten abgeschnitten.
- Die Kamera bleibt so nah, wie man zuletzt war (im Bild Zoom 6). Ein großer Hof füllt dann den ganzen Bildschirm, und man erkennt nicht, wohin er im Ort kommt.
- Die Vorschau des Gebäudes ist voll deckend. Häuser davor oder dahinter verschwimmen mit ihr, und man sieht nicht klar, wo die Grundfläche anfängt und endet.

## Änderungen
1. **Bauplatz in den freien Kartenteil rücken:** Beim Platzieren auf dem Handy wird der Bauplatz in die Mitte des sichtbaren Bereichs zwischen oberer Leiste und Bau-Feld gesetzt, nicht in die Bildschirmmitte. Das gilt beim Start und bei jedem Pfeiltipp.
2. **Passender Abstand:** Ist man beim Start des Platzierens sehr nah dran, zoomt die Kamera sanft so weit heraus, dass Gebäude und ein Ring Nachbarhäuser ins Bild passen. Weiter wegzoomen geht wie gewohnt.
3. **Klare Vorschau:**
   - Das Gebäude erscheint leicht durchscheinend, mit sanftem Pulsieren.
   - Die Grundfläche bekommt einen kräftigen Rand: grün, wenn man hier bauen kann, rot, wenn nicht.
   - Häuser, die vor dem Bauplatz stehen, werden während des Platzierens durchsichtiger, damit sie die Fläche nicht verdecken.
4. Am Computer bleibt alles wie bisher (Maus, keine Pfeiltasten).

## Technische Details
- `Game.tsx`: Die Funktion, die die Kamera auf den Bauplatz rückt, verschiebt beim Platzieren am Handy das Ziel nach oben, um die halbe Höhe des Bau-Felds (gemessen über ref/`getBoundingClientRect`, umgerechnet über den Zoom). Beim Einstieg wird der Zoom auf einen Höchstwert für das Platzieren begrenzt (nur `target.zoom`, Grenzen aus `camera.ts` bleiben).
- `render.ts`: Die Vorschau wird mit `globalAlpha` ca. 0,6 plus leichtem Pulsieren gezeichnet. Der Rand der Grundfläche wird mit `ghostOk` gefärbt. Gebäude auf Kacheln südlich bzw. vor dem Bauplatz bekommen im Tiefendurchlauf einen gesenkten Alpha-Wert, solange `ghost` gesetzt ist. Das ist reine Darstellung, nichts wird gespeichert, und an der Spielmechanik ändert sich nichts.
- Prüfung: Playwright im Handyformat (390×710) für einen großen Hof (Beginenhof) und ein kleines Gebäude. Screenshots vor und nach Pfeiltipps.
