# Nachtmasken: zentrale Zuordnung, Prüfung, Prüfansicht, Beginenhof

## Ziel
Fensterlicht bei Nacht soll genau den Fensterscheiben der Tagesbilder folgen. Grobe orange Flächen wie am Beginenhof soll es nicht mehr geben. Die Prüfung läuft dauerhaft mit. Lichtzeiten, Flackern, Wetter und die Art, wie Lichter von davorstehenden Gebäuden verdeckt werden, bleiben unverändert.

## Schritte
1. **Bestand erfassen:** Alle 106 aktiven Nachtbilder werden ihren Tagesbildern zugeordnet. Das gilt auch für Baustile (Korn, Werkstatt, Hafen) und Varianten 2/3. Altdateien in `legacy/night` und `sprites/night` kommen auf eine eigene Liste: genutzt, ungenutzt oder fehlend.
2. **Eine zentrale Paarliste:** Jeder Gebäude- oder Varianteneintrag nennt sein Tagesbild und seine Nachtmaske direkt nebeneinander. Steht dort „bewusst ohne Licht“, ist das ausdrücklich erlaubt. Die bisherige getrennte Nachtliste fällt weg. Variantenwahl, Größe, Ausschnitt und Spiegelung bleiben genau wie bisher.
3. **Automatische Prüfung (als Test, läuft bei jedem Testlauf):**
   - Fehler: Datei fehlt, Maße weichen ab, kein Alphakanal, Maske leer oder deckend, Licht außerhalb der Gebäudesilhouette (kleine Toleranz für weiche Kanten), Maske doppelt oder verwaist.
   - Warnungen: auffällig große, zusammenhängende Lichtflächen. Das sind Kandidaten für Fehler wie am Beginenhof.
   - Fingerabdruck: Jedes Paar bekommt eine Prüfsumme. Ändert sich ein Tagesbild, die Maske aber nicht, schlägt der Test fehl, bis jemand die Maske bewusst geprüft hat.
   - Das Skript prüft nur und verändert keine Bilder.
4. **Rubrik „Nachtmasken“ im Figure-Lab:** Für jedes Paar drei Bilder: Tag, Maske auf dunklem Grund, Tag mit Maske darüber. Dazu Zoom, ein Regler für die Lichtstärke, Name, Variante, Baustil und Bildmaße. Ein Vergleichsmodus zeigt die Baustile nebeneinander. Gezeichnet wird mit derselben Funktion wie im Spiel, also mit gleicher Größe, Lage und Spiegelung.
5. **Beginenhof korrigieren:** Die Maske wird direkt aus den Fensterscheiben des Tagesbilds abgeleitet: dunkle Glasflächen innerhalb der Fenster. Rahmen, Sprossen und Laibungen bleiben dunkel. Nur Fenster, die wirklich leuchten sollen, werden einzeln nachgearbeitet, mit weicher Kante, aber ohne Rechtecke. Ein neues Nachtbild wird nicht erzeugt. Danach folgt ein Vergleich im Figure-Lab und nachts auf der Karte.
6. **Übrigen Bestand sichten:** Ich gehe alle Paare in der Prüfansicht durch und liste die tatsächlichen Auffälligkeiten mit Begründung. Nur diese werden auf dieselbe Weise gezielt nachgebessert. Es gibt keine pauschale Neuzeichnung.
7. **Regel festhalten:** Der Qualitätsstandard aus deinem Dokument kommt in die Projektregeln. Wer ein Tagesbild ändert, muss auch die Maske prüfen.

## Ergebnis für dich
- eine Übersicht aller aktiven Nachtmasken (Datei in Files)
- eine Liste der gefundenen und behobenen Fehler
- Screenshots der Prüfansicht und des Beginenhofs bei Nacht vorher und nachher
- der Nachweis, dass die automatische Prüfung bestanden ist

## Technisches
- `building-sprites.ts`: `nightUrls` geht in den `Sprite`- und Style-/Variant-Einträgen auf (Feld `night` oder `night: null`). `hasNightSprite` und `drawBuildingNight` lesen daraus. `render.ts` (`drawStructureBase` und `beginLit`) bleibt unverändert.
- Neuer Test `src/game/night-masks.test.ts`: liest die WebP-Dateien mit `sharp`/Bilddaten aus Node. Die Silhouette ist der Tages-Alpha > 8, mit 2 px Dilatation. Die Prüfsummen stehen in `night-masks.lock.json`.
- Werkzeug zum Ableiten der Masken unter `scripts/`: Es nimmt Fensterregionen aus dem Tagesbild (Helligkeit/Farbe innerhalb von Hand gesetzter Rechtecke), wird nur für einzelne Dateien von Hand aufgerufen und läuft nie für alle.
- Die Lab-Karte kommt in das bestehende Figure-Lab (Taste P / `?figs`).
