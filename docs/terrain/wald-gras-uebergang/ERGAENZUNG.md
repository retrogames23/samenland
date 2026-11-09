# Pilot 3 Wald-Gras-Übergang – Ergänzung zur Bestandsaufnahme

Stand: 9. November 2026. Keine Änderung an Spielcode, Texturen, Sprites oder Renderlogik.

## 1. Echte Nahaufnahmen (Zoom ≥ 4,0)
Neue Aufnahmen `*_0echtnah.png` für alle fünf Grenzsituationen in Sommer, Herbst und Winter.
Die bisherigen Aufnahmen bei Zoom ≈ 2,4 (`*_1nah.png`) bleiben als Normalzoom-Referenz.
Der tatsächliche Zoom jeder Aufnahme steht in `aufnahmeprotokoll.tsv` (Spalte `z=`, gelesen aus dem Debug-HUD).

## 2. Nachweis vollständig gebackener Chunks
**Befund zur alten Methode:** `settle()` wartete auf eine stabile HUD-Zahl `chunks`. Diese Zahl zählt sichtbare Chunks,
nicht gebackene. Ein Chunk, der dauerhaft im Fallback bleibt, hält die Zahl ebenfalls stabil – der alte Nachweis war unzureichend.

**Tatsächliche Logik (render.ts drawGroundChunks):** Pro Frame wird höchstens ein Boden-Chunk gebacken
(`baked >= 1 || frameBakes >= 1`). Fehlt ein Chunk im `chunkCache`, wird entweder eine andere Qualitätsstufe
oder die einfarbige Fallback-Raute `#7a8a50` gezeichnet. `frameBakes` wird einmal pro Frame auf 0 gesetzt.

**Neuer Nachweis (nur Testinstrumentierung):** Das Aufnahmeskript fängt im Testbrowser das ausgelieferte Skriptpaket ab
und ergänzt zwei Zähler, ohne Produktionsdateien zu ändern:
- `__miss` +1 bei jedem Eintritt in den Fallback-Zweig (betrifft beide Fallbacks: andere Qualität und Raute),
- `__frames` +1 bei jedem Frame-Beginn (`frameBakes = 0`).

Eine Aufnahme gilt nur als abnahmefähig, wenn mindestens **3 vollständige Frames in Folge ohne einen einzigen Fallback** liefen.
Das Protokoll vermerkt `bake_vollstaendig=ja/NEIN` und die Zahl fallbackfreier Frames. Aufnahmen mit `NEIN` sind nicht abnahmefähig.
Hinweis: Die flachen Stadt-Chunks (Wege, Plätze) fallen bei fehlendem Bake auf exakt gleiche Live-Kacheln zurück, nicht auf eine Ersatzfarbe; sie sind für den Bodennachweis unkritisch.

## 3. Winter
Aufnahmen `winter_*_2normal.png` und `winter_*_0echtnah.png`. Befunde:
- **Verzahnung unter Schnee:** Schnee legt sich über Waldboden und Gras gleich; der Hell-Dunkel-Sprung des Sommers verschwindet weitgehend.
  Sichtbar bleibt eine **graue, kontaktschattenartige Linie entlang der Waldkontur**: Die Waldfläche ist unter Schnee etwas grauer als das Gras.
  Das ist der neue saisonale Saum, nach dem gefragt war – klein, aber bei Zoom ≥ 4 erkennbar.
- **Neuer Fund:** In der Winter-Nahaufnahme des geraden Saums erscheint auf der Wiese eine hellere, kachelförmige Raute
  (eine Kachel mit anderer Schneehelligkeit). Sie liegt außerhalb des Waldes und gehört nicht zum Wald-Gras-Übergang; dokumentiert als eigener Prüfpunkt, nicht behoben.
- **Inseln und Zungen:** Unter Schnee sind sie nur noch über die Bäume lesbar; der Waldboden selbst unterscheidet sich kaum.
  Variante 1 muss daher die Schnee-Einfärbung des Waldbodens an die des Grases angleichen oder bewusst als „Waldschatten“ führen – nicht beides gemischt.

## 4. Technische Präzisierung Variante 1

### 4.1 Waldkern und Baumpositionen (natureAt)
Jede Waldkachel setzt bis zu zwei Bäume, relativ zur Kachelmitte (Kachel 32 × 16 px):
- Baum A (nur wenn `hash(x,y,19) > 0,35`): Fuß bei (+6, −1) → Rautenabstand 6/16 + 1/8 = **0,50**.
- Baum B (immer): Fuß bei (−5, +3) → 5/16 + 3/8 = **0,69**.

Rautenabstand 1,0 ist die Kachelkante. Der Fuß von Baum B liegt also bei 69 % zur Kante, dazu kommt die Stamm-/Schattenbreite (~2–3 px).
**Folgerung:** Ein Mindestwert für die Waldkachel genügt nicht. Bei einer Einzelkachel liegt das Mitgliedsfeld heute bei
4/10 = 0,40 ± 0,11 Rauschen, also meist unter 0,5 – es entsteht gar kein Waldboden, beide Bäume stehen auf Gras.
Der Kern muss geometrisch definiert werden: **für jede Waldkachel mindestens die Raute bis Abstand 0,85** (Fuß B 0,69 + Stamm/Schatten),
unabhängig vom geglätteten Feld. Nur außerhalb dieser Kernraute darf die Kontur ausfransen.
Prüfregel für den Regressionstest: Für alle Baumfüße aus natureAt muss der Punkt im Waldpfad liegen (`isPointInPath`), auch für Einzelkacheln, Zungen der Breite 1 und Waldkacheln neben Wasser.

### 4.2 Größe der Übergangspartikel
Maßstab der Welt (Weltpixel bei Zoom 1): Kachel 32 × 16, Figur ≈ 10 px hoch, Busch 9 px, Kiefer 13 px, Birke 15 px, Eiche 24 px breit, Grasbüschel aus wildTurf ≈ 2–4 px.
Die früher genannten **0,5–2 px sind zu klein**: 0,5 px ist bei Normalzoom unter einem Bildschirmpixel und wird zu Rauschen (genau das „Weichzeichner“-Bild, das vermieden werden soll).
Erst bei Zoom ≥ 4 würden sie als Formen lesbar.
Empfehlung statt festem Grenzwert: Partikel in der Größenordnung der vorhandenen Grasbüschel (etwa 2–5 Weltpixel, ¼–½ Figurenhöhe),
gruppiert zu kleinen Zungen und Buchten; die endgültige Größe wird **im Boden-Labor visuell bei Zoom 1, 2,4 und ≥ 4** festgelegt und vom Nutzer freigegeben.

## 5. Aktualisierte Empfehlung Variante 1
1. Waldpfad Schicht 6 = geglättete Kontur ∪ geometrische Kernraute (0,85) je Waldkachel.
2. Außerhalb des Kerns ein deterministisches Saumband aus Weltkoordinaten (Kachelhash, Chunk-Überhang wie heute), Formen statt Alpha.
3. Partikelgröße visuell im Boden-Labor kalibrieren (Abschnitt 4.2).
4. Winter: Schneefarbe von Waldboden und Gras so abgleichen, dass kein grauer Konturstrich entsteht.
5. Kein Partikel auf Wasser/Sand; andere Schichten unberührt.
Zusätzliche Tests: Baumfuß-im-Pfad (4.1), fallbackfreie Aufnahmen (Abschnitt 2).

## 6. Einschränkungen
- Testbrowser ohne Grafikkarte (1–5 Bilder/s); Aufnahmen 12:00 Berlin, klares Wetter, Saison per Admin-Steuerpult erzwungen.
- Liegender Schnee im Winter stammt aus der Wetterberechnung der letzten Tage und kann an anderen Tagen anders aussehen.
- Bildausschnitte sind über Mauszoom angesteuert. **Situationen 1, 2 und 5 sind bei Zoom ≥ 4 getroffen und abnahmefähig.**
  **Situationen 3 (kleine Waldinsel) und 4 (schmale Zunge) wurden bei Zoom ≥ 4 trotz zweier Zielversuche verfehlt** – die Bilder zeigen Wiese, Äcker und Fluss neben dem Ziel. Sie sind vollständig gebacken, aber inhaltlich **nicht abnahmefähig**.
  Ursache: Ohne Kamera-Sprungpunkt driftet die Mausführung bei 1–5 Bildern/s. Abhilfe vorgeschlagen: ein reiner Labor-Kameraparameter (nur Karte „lab“); das wäre eine Codeänderung und wartet auf Freigabe.
- Neben dem Wald fällt in mehreren Aufnahmen (Wiese, Wasser, alle Jahreszeiten) eine einzelne hellere Kachelraute auf – eigener Prüfpunkt außerhalb dieses Piloten.
