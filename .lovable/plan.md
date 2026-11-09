# Pilot: Nachtlicht-Stil an zwei Masken festlegen

## Zuordnung der Bilder

- **Bild 1 (gut):** hohes Fachwerk-Bürgerhaus (townhouse-Familie)
- **Bild 2 (gut):** Wirtshaus (`inn`)
- **Bild 3 (schlecht):** links `grain-patrician-3` (Fachwerk auf Backstein), rechts `grain-patrician-2` (Staffelgiebel mit Fialen)
- **Bild 4 (schlecht):** `beginenhof`

Pilotmasken: **`grain-patrician-2`** (aus Bild 3, die meisten Fenster) und **`beginenhof`** (Bild 4).

## Erster Messbefund

- `inn` (gut): einheitlicher warmer Lichtton (etwa 255/176/80), weiche Alpha-Abstufung innerhalb der Scheiben (Mittelwert ca. 74, nur 6 % voll deckend). Die dunklen Sprossen entstehen durch niedriges Alpha, nicht durch eine dunkle Farbe.
- `grain-patrician-2` / `-3` (schlecht): In der letzten Runde wurde die Textur des Tagesbilds in die Lichtfarbe eingerechnet. Dadurch ist der Ton gedämpft, es gibt viele voll deckende Pixel (ca. 45 %), und das Rautengitter wirkt wie eine Schablone.
- `beginenhof` (schlecht): noch alte Maske mit blassem Cremeton (255/196/110), harten, gezackten Flächen und ohne innere Abstufung.

## Vorgehen

1. **Referenz genau vermessen:** `inn` und `church` jeweils mit Tagesbild auswerten: Farbwerte, Alpha-Histogramm innerhalb der Scheiben, Kontrast Scheibe/Sprosse und Anteil von Kern zu Rand. Daraus ein Lichtprofil ableiten (Farbe, Kern-Alpha, Randabfall, Sprossen-Alpha, leichte Unterschiede von Scheibe zu Scheibe). Die Geometrie der Referenzmasken wird nicht übernommen.
2. **`grain-patrician-2` neu belichten:** Die Fensterflächen der vorhandenen Maske bleiben genau gleich. Innerhalb dieser Flächen wird das Licht neu aufgebaut: ein satter Bernsteinton, ein Alpha-Kern, der zum Laibungsrand hin abfällt, und Sprossen bzw. Maßwerk, die aus den dunklen Linien des Tagesbilds als Alpha-Aussparung entstehen statt als Farbtextur. Jede Scheibe bekommt eine leichte Helligkeitsvariation. Das Licht bleibt in der Scheibe, ohne Halo.
3. **`beginenhof` neu belichten:** Dieselbe Lichtcharakteristik anwenden. Die gezackten Kanten werden innerhalb der bestehenden Fensterumrisse geglättet, ohne Fenster zu verschieben oder zu vergrößern.
4. **Prüfung im echten Rendering:** Für beide Gebäude die isolierte Maske zeigen und das fertige Bild durch den Nacht-Zeichenweg des Spiels mit Abdunklung, Lichtschicht und Flackern. Das Ergebnis direkt neben Bild 1 und 2 sowie neben dem bisherigen Stand legen. Danach im laufenden Spiel einen Screenshot machen, falls die Gebäude dort erreichbar sind.
5. **Sperrdatei:** Nur für diese zwei Keys den Fingerprint aktualisieren und den Status auf `open` setzen.
6. **Test:** nur den gezielten Nachtmasken-Test ausführen.
7. **Abnahmebild:** beide Pilotgebäude, vorher und nachher, neben den guten Referenzen.

## Was unverändert bleibt

Tagesbilder, Fenstergeometrie, Crops und Zuordnung bleiben, ebenso der Render- und Maskencode. Alle anderen Masken, darunter auch `grain-patrician-3`, fasse ich erst an, wenn du die Pilotmasken freigegeben hast.

## Technische Details

- Der Nacht-Layer wird mit `source-over` auf eine eigene Lichtebene gezeichnet (render.ts, `drawBuildingNight`). Die Wirkung hängt deshalb direkt an der RGB- und Alpha-Verteilung der Maske. Eine globale Farb- oder Alpha-Änderung ist nicht vorgesehen.
- Die Sprossen werden pro Pixel aus der Helligkeit des Tagesbilds innerhalb der bestehenden Maskenfläche bestimmt: Ist ein Pixel dunkel, sinkt dort das Alpha. Die Farbe bleibt dabei ein einheitlicher warmer Ton mit sanftem Verlauf zum Kern.
