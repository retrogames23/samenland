# Pilot 3 – Wald-Gras-Übergang, Iteration 2: geometrische Korrektur

Stand: 2026-11-09. Ausgangsstand lokal `862f1d2f`. Nur Testkarte (`lab`), Schalter `edge: { core: 0.75, grain: 2.5, v2: true }`.
Keine Übernahme in die reguläre Karte, keine Freigabe.

## Ursache der Mängel von Prototyp 1
1. Die Prototyp-Flächen (`forestExtra`) wurden **zusätzlich** gezeichnet; danach füllte `drawGround` weiterhin den alten Isokonturpfad `layers[6]`. Die harte Kante blieb daher vollständig sichtbar.
2. Saumflecken waren eigenständige Sechsecke ohne geometrische Verbindung zum Kern → braune Tupfer.

## Technische Lösung
`forestShape()` in `src/game/forest-edge.ts`, eingesetzt in `groundGeom` (render.ts): bei `v2` **ersetzt** die neue Fläche `layers[6]`, der alte Konturpfad wird für Wald nicht mehr gezeichnet.

- Jede Waldkachel liefert ein sternförmiges Polygon um ihren Mittelpunkt (48 Richtungen, Radius in Rautenmaß).
- Richtung Waldnachbar: Radius ≥ 1,06 → Überlappung, eine zusammenhängende Fläche ohne Innenkanten.
- Richtung Gras/Wiese/Acker/Hügel: Radius = 0,83 … 1,28 aus weltgebundenem Rauschen am Kachelrand (zwei Oktaven, 2,6 und 6,1 je Kachel) → 2–4 Ausläufer je Kante mit Grasbuchten dazwischen.
- Richtung Wasser/Sand/Fels: Radius ≤ 0,98, zusätzlich Strahlprüfung entlang jeder Richtung; kein Ausläufer auf unzulässigem Boden.
- Zweifache Kreisglättung der Radien: keine Spitzen, keine geraden Rautenfacetten.
- Mindestradius Kern + 0,05 = 0,80 > 0,69 (äußerster Baumfuß) → alle Bäume auf Waldboden.
- Jedes Stück wächst aus dem Mittelpunkt seiner Kachel → **isolierte Saumflecken sind konstruktiv ausgeschlossen**.
- Harte Kante wie bisher (kein Alpha, keine Weichzeichnung, kein Halo); Textur `forest.jpg` unverändert, weltgebunden.

## Tests (`src/game/forest-shape.test.ts`, 7 neu)
Baumfüße in der Fläche · Einzelkachel behält Waldboden · jedes Stück enthält seinen Kachelmittelpunkt (keine Inseln) · gesamte Polygonfläche (0,5-px-Raster) frei von Wasser/Sand/Fels · Rand variiert (Spannweite > 0,12, ≥ 3 Ausläufer) · deterministisch über Chunk-Grenzen · ohne Wald keine Fläche.
Gesamtlauf: **142 Dateien, 789 Tests bestanden** (siehe `testergebnis.txt`).

## Aufnahmen
126 Aufnahmen: 6 Szenen × 3 Varianten (bisher / Prototyp 1 B / Iteration 2) × Sommer 1,0/2,4/4,5, Herbst 2,4/4,5, Winter 2,4/4,5. 12:00 Berlin, klar.
Alle 126 mit Bake-Nachweis (≥ 3 fallbackfreie Frames); 24 erste Versuche ohne Nachweis (Parallellast) wurden einzeln wiederholt.

## Befund
- **Einzelkachel/Insel:** dunkler, unregelmäßiger Waldboden unter allen Bäumen – bestanden.
- **Schmale Zunge:** durchgehend, Ausläufer sichtbar – bestanden.
- **Gerader/unregelmäßiger Saum:** Kante ist zusammenhängend und gelappt, keine Tupfer mehr. Großräumig folgt sie aber weiterhin der alten Kachellinie; die Ausläufer reichen nur bis ~0,3 Kachel und sind bei Zoom 2,4 dezent.
- **Wald-Gras-Wasser:** kein Waldboden auf Wasser/Sand – bestanden.
- **Übersicht 1,0:** keine zusätzliche Struktur.
- **Winter:** keine Rauten mehr. Der sichtbare graue Streifen unterhalb von Szene 4/5 ist der Schlagschatten der Hügelkante (Layer 5, `rgba(40,34,14,0.26)`), nicht der Waldrand; er ist in allen drei Varianten gleich.
- Bekannter Aufnahmefehler: Prototyp 1, Szene 1, Sommer 2,4 zeigt Testwiek (Kamerasprung vor Kartenladen); betrifft nur die Vergleichsspalte.

## Leistung (einmalig beim Backen eines Bodenstücks, unter Last gemessen)
Siehe `leistung.txt`: Iteration 2 ca. 0,05–15 ms je 18×18-Bereich (Prototyp 1: 0,04–64 ms, erste Messung inkl. Aufwärmen). Pro Bild kein Zusatzaufwand. Werte sind wegen Parallellast nur Größenordnungen.

## Einschätzung
**Teilweise bestanden.** Geometrie korrekt (eine Fläche, Kern gesichert, keine Tupfer/Rauten, keine Überlagerung). Offen: Die makroskopische Form des Saums bleibt nahe an der alten Linie. Größere Reichweite würde das nicht lösen, sondern nur die Waldfläche vergrößern. Alternative statt weiterer Parameter: das Rauschen nicht pro Kachelrand, sondern als großräumiges Saumfeld (Frequenz ~0,3 je Kachel) zusätzlich nach innen wirken lassen, sodass auch Grasbuchten in den Wald hineinschneiden dürfen – dafür müsste die Kernregel nur für baumtragende Punkte statt für die ganze Kachel gelten.
