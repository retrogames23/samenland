# Samenland: handgezeichneter Look, abwechslungsreiche Gebäude, kleiner Start

## 1. Handgezeichnete Anmutung statt Pixel-Art
- Kein Pixel-Raster mehr: Die Karte wird in voller Bildschirmschärfe gezeichnet, mit weichen Kanten.
- Tinten-Umrisse: Gebäude, Bäume und Wege bekommen leicht zittrige, dunkelbraune Linien, wie mit Feder gezeichnet. Die Linien wackeln fest pro Objekt, nicht bei jedem Bild.
- Aquarell-Flächen: Wiesen, Wasser und Felder in gedämpften Farben, mit sanften Flecken und leichten Farbverläufen statt harter Kacheln. Kachelkanten werden ausgeblendet.
- Papier-Wirkung: eine feine, warme Papierstruktur über der ganzen Karte, Ränder leicht vergilbt.
- Details mit Strichen: Dachziegel als Schraffur, Felder als Furchenlinien, Wasser mit kleinen Wellen-Strichen, runde, wolkige Baumkronen.
- Schrift: Pixel-Schrift wird durch eine handschriftliche Schrift ersetzt (z. B. „Caveat“ für Überschriften, „Nunito“ bleibt für Text). Dorfnamen wie auf einer alten Karte beschriftet.

## 2. Abwechslungsreiche Gebäude, die mit dem Dorf mitwachsen
Jedes Dorf durchläuft Entwicklungsstufen. Mit jeder Stufe kommen neue Gebäudearten dazu, alte bleiben bestehen.

| Stufe | Alter (ca.) | Was entsteht |
|---|---|---|
| Hof | erste Stunden | ein Bauernhaus, eine Scheune, ein Brunnen, ein Feldweg |
| Weiler | ab 1 Tag | weitere Bauernhäuser, Ställe, Gemüsegärten, Zäune, Felder, Heuhaufen |
| Dorf | ab 5 Tagen | Kirche oder Kapelle, Windmühle, Bäckerei, Gasthaus, Dorfplatz, Kopfsteinwege |
| Kleinstadt | ab 20 Tagen | Fachwerk-Reihenhäuser, Markt, Schmiede, Werkstätten, Lagerhaus |
| Industrie | ab 60 Tagen | Fabrik mit rauchendem Schornstein, Sägewerk, Ziegelei, gepflasterte Straßen |

- Jede Gebäudeart hat eine eigene Form: Scheune mit Satteldach und großem Tor, Kirche mit Turm, Mühle mit drehenden Flügeln, Fabrik mit Sheddach und Schlot.
- Innerhalb einer Art variieren Größe, Dachfarbe und Ausrichtung leicht.
- Lage nach Sinn: Höfe und Felder am Rand, Kirche und Markt in der Mitte, Industrie an Flüssen oder am Rand.
- Wege wachsen natürlich: Statt eines festen Gitters gehen geschwungene Feldwege vom Brunnen aus. Später werden daraus Straßen.

## 3. Sehr kleiner Start
- Ein neuer Samen beginnt mit einem einzelnen Hof: Bauernhaus, Scheune und ein Stück Feld, etwa 2–3 Felder groß.
- Das Wachstum verläuft deutlich langsamer. Nach einem Tag gibt es eine Handvoll Gebäude, nach einer Woche ein kleines Dorf. Erst nach Monaten ist es eine Stadt, die an Nachbarn heranreicht.
- Die drei Beispieldörfer zeigen dadurch automatisch drei Stufen: Kleeheim (2 Tage) als Weiler, Lindenau (6 Tage) als Dorf, Moosbach (20 Tage) als beginnende Kleinstadt.

## Technische Details
- `src/game/world.ts`: `stageOf(ageHours)` und `radiusOf` neu, mit langsamerer Kurve. `structureAt` wählt Gebäudearten aus einer Tabelle pro Stufe, gewichtet nach Abstand zum Zentrum, Gelände (Wasser in der Nähe → Mühle oder Industrie) und Hash. Geschwungene Wege über ein deterministisches Wegenetz (radiale Pfade mit Rausch-Versatz) statt Modulo-Gitter. Alles bleibt eine reine Funktion von Samen und Zeit (AGENTS.md-Regel).
- `src/game/render.ts`: Rendering mit voller DPR, Umschalten von `image-rendering: pixelated` auf Glättung. Je Gebäudeart eine eigene Zeichenfunktion (`drawBarn`, `drawFarmhouse`, `drawChurch`, `drawMill`, `drawFactory` …). Helfer `inkPath` für Linien mit Hash-Versatz und `wash` für Aquarell-Flächen. Papierstruktur als einmal erzeugtes Rauschmuster, als Pattern überlagert. Bei starkem Herauszoomen vereinfachte Formen, damit es flüssig bleibt.
- `src/components/Game.tsx` und `__root.tsx`: `PX = 1` mit devicePixelRatio, Schrift Caveat, kleine Anpassungen in der Oberfläche.
- AGENTS.md: Die Render-Regel wird von „Pixel-Raster“ auf „handgezeichnet, volle Auflösung“ geändert.
