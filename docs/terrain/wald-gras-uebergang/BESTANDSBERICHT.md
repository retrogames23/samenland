# Pilotprojekt 3 – Wald-Gras-Übergang: Bestandsaufnahme

Stand: 09.11.2026. Reine Analyse – **keine** Änderung an Code, Texturen, Sprites oder Renderlogik.
Der freigegebene Waldboden (Pilot 1, `forest.jpg` Variante A) bleibt unberührt.

## 1. Aufnahmebedingungen

| Parameter | Wert |
|---|---|
| Karte | Testkarte „lab“ (Testwiek / Testau) |
| Uhrzeit | 12:00 Spielzeit (Europe/Berlin), Systemuhr fest auf 2026-11-09 11:00 UTC |
| Wetter | klar (`samenland-lab-ctl.weather = "clear"`) |
| Jahreszeiten | Sommer, Herbst (`samenland-lab-ctl.season`) |
| Zoom (gemessen) | Übersicht 0,7 · Mittel 1,5 · Normal 2,4 (Wert je Bild in `aufnahmen.tsv`) – eine echte Nahstufe ≥ 4 wurde **nicht** erreicht |
| Kamera | Ausgangsansicht über Kachel 296:440, dann Mauszoom auf die jeweilige Stelle (Bildpunkt in `scripts_aufnahme.py`, Tabelle `S`) |
| Chunk-Prüfung | Aufnahme erst, wenn die Chunk-Zahl im Lab-HUD 8 × 0,5 s unverändert ist, danach weitere 1,5 s |
| Renderer | Headless Chromium mit SwiftShader (≈1–5 fps) |

## 2. Codeanalyse

**Abgrenzung (world.ts `terrain`)**: Wald entsteht aus `fbm(x/25, y/25, 5) > 0.58`. Das ist ein reiner Kachelwert ohne Übergangsstufe.

**Schichten (render.ts `LAYER`)**: Die Schichten sind übereinander gestapelt: sand 1 < fertile 2 < meadow 3 < grass 4 < hill 5 < **forest 6** < mountain 7.

**Kontur (render.ts `groundGeom`)**:
- Für jede Schicht wird das Feld „Schicht ≥ L“ berechnet. Dabei zählt die eigene Kachel 4-fach, die Nachbarn mit Gewicht 1 bzw. 0,5.
- Dazu kommt ein leichtes Rauschen ±0,11.
- Wo das Feld den Wert 0,5 kreuzt, entsteht eine interpolierte Kontur (Marching Squares) als ein `Path2D`.

**Schnittkante (render.ts `drawGround`)**:
- Die Schnittkante entsteht durch `c.fill(path)` mit der Waldtextur, voll deckend über Gras und Hügel.
- Die Kante ist nur kantengeglättet, es gibt keinen Saum.

**Übergangsgrafiken**:
- Für Wald gibt es keine Übergangsgrafiken.
- Vorbilder im selben Code: Uferband `shoreLines` (Sandstriche), Hügelrand `rim` (Clip + Versatz), Wegränder in `drawFlatChunks`.

**Kachel oder Fläche**:
- Die Kontur wird pro Zelle aus 2 × 2 Kacheln berechnet und pro Chunk zu einem Pfad zusammengefasst.
- Die Kontur verläuft schräg durch die Kacheln.

**Unregelmäßige Ränder**: Das Rauschen wellt die Linie, aber die Härte der Kante ist überall gleich.

**Kleine Inseln, Zungen und Streifen**:
- Eine einzelne Waldkachel ergibt ein Feld von etwa 0,4. Liegt das Rauschen nicht über +0,1, wird *kein* Waldboden gemalt.
- Ein Streifen von 1 Kachel Breite liegt bei etwa 0,5–0,6 und wird stark verschmälert.
- `natureAt` setzt aber auf jede `forest`-Kachel 1–2 Bäume. **Bäume stehen dann auf Gras.**

**Chunks und Cache**:
- 16 × 16-Chunks (`CH`), Geometrie mit 1 Kachel Überhang. Dadurch passen die Konturen an den Chunk-Grenzen nahtlos zusammen.
- Gebacken wird 1 Chunk pro Frame. Der Fallback ist eine einfarbige Raute `#7a8a50`, und zwar nur vorübergehend.

**Winter**:
- forest und grass haben beide die Rolle „ground“ und werden gleich eingefärbt. Die Helligkeitskante bleibt, bis die Schneedecke greift.
- Bei geschlossener Schneedecke wird die Kante weicher, verschwindet aber nicht.

**Zoom**:
- Ab Zoom 1,6 wird mit doppelter Auflösung gebacken (q = 2). Die Vektorkante ist dann am schärfsten.
- Die Übersicht (< 0,45) nutzt eigene Stadt-Bitmaps, der Boden kommt dort ebenfalls aus den Chunks.

**Andere Geländetypen**:
- **Alle** Schichtgrenzen nutzen dieselbe Schleife `L = 1..7`.
- Jede Änderung muss deshalb strikt auf `L === 6` begrenzt sein, sonst verändern sich auch Ufer, Aue und Gebirgsfuß.

## 3. Assetübersicht (nur vorhanden, nichts neu)

| Asset | Größe / SPAN | Eignung für Übergang |
|---|---|---|
| `terrain/forest.jpg` (Variante A, freigegeben) | 816², SPAN 120 | Humusseite – unverändert |
| `terrain/grass.jpg` | 816², SPAN 150 | Grasseite |
| `terrain/meadow.jpg` | 816², SPAN 140 | Grasseite (Blumenwiese) |
| `terrain/dirt.jpg` | SPAN 56 | nur als dunkler Akzent denkbar – Gefahr dunkler Saum |
| `wildTurfPaths` (prozedurale Halmbüschel) | 1–2 px hoch | Gras, das in den Humus hineinwächst |
| `cohesive/bush.webp` | 9 px | Strauchmantel des Waldrands (sparsam) |
| `oak`/`fir`/`birch.webp` | 13–24 px | bleiben unverändert |

## 4. Die fünf Grenzsituationen

| Nr. | Situation | Befund |
|---|---|---|
| 1 | Gerader Waldsaum (Südostrand großer Wald) | Durchgehende, wie geschnittene Linie. Starker Hell-Dunkel-Sprung zwischen Humus und Gras. |
| 2 | Unregelmäßiger Waldrand (mittlerer Waldblock am Fluss) | Gewellter Rand, aber jede Bucht mit gleich harter Kante. Kein Auflockern an Vorsprüngen. |
| 3 | Kleine Waldinsel (östlich, bei Testwiek) | Humusfläche kleiner als die Baumgruppe. Bäume am Rand stehen auf Gras. |
| 4 | Schmale Waldzunge (Ostausläufer großer Wald) | Humus auf einen schmalen Strich verkürzt. Die Spitze ist ohne Boden. |
| 5 | Wald–Gras–Wasser (Wald am Flussufer) | Wald (Schicht 6) liegt über dem Sanduferband. Uferstreifen und Wald grenzen ohne Saum aneinander. |

## 5. Besondere Anforderungen aus dem Auftrag

### 5.1 Keine bloße Weichzeichnung – Eignung eines Dither-/Partikelmusters
Ein weltkoordinatengebundenes Muster ist **geeignet**. Es muss drei Bedingungen erfüllen:
- deterministisch aus `hash(x, y, salt)` bzw. `vnoise` in Kachelkoordinaten, nie aus Bildschirmkoordinaten. So sind gebackene Chunks und Live-Ansicht gleich, und das Muster gleitet beim Schwenken nicht mit.
- Die Partikel sind **Formen**: unregelmäßige Humusflecken und Grasbüschel mit 0,5–2 px Weltgröße. Es sind keine Alphawerte, also kein Verlauf. Die Deckkraft jedes Partikels ist voll.
- Die Dichte nimmt mit dem Abstand zur Kontur ab, dafür wird das schon vorhandene Feld `M(x, y, 6)` als Abstandsmaß genutzt.

### 5.2 Kleine Inseln und schmale Zungen
Pflichtregeln für jede spätere Lösung:
1. **Waldkern bleibt**: Jede `forest`-Kachel bekommt mindestens eine Humus-Kernfläche, auch wenn die geglättete Kontur sie verfehlt. Ein Ansatz: ein Mindestwert für die eigene Kachel, etwa M ≥ 0,55 bei ind = 1, nur für L = 6.
2. **Bäume auf Waldboden**: Die Kernfläche wird aus derselben Kachel abgeleitet wie die Baumpositionen in `natureAt` (cx−5 / cx+6).
3. **Keine isolierten Flecken**: Humuspartikel nur innerhalb von etwa 1 Kachel um eine echte Waldkachel. Graspartikel nur auf der Waldseite der Kontur.
4. **Schmale Streifen bleiben**: Der Kern-Mindestwert gilt auch für Streifen von 1 Kachel Breite.
5. **Dreifachgrenze**: Kein Partikel auf Wasser- oder Sandschicht (≤ 1). Die Uferpfade `shoreLines` bleiben oben.

## 6. Drei technische Varianten

| Kriterium | V1 Kontursaum + Kernsicherung (nur L = 6) | V2 Randbüschel und Unterholz auf `edges` | V3 Alpha-Maske im Offscreen-Puffer |
|---|---|---|---|
| Prinzip | Waldpfad mit Kern-Mindestwert. Danach ein deterministisches Partikelband: Humusflecken nach außen, Grasbüschel nach innen. | Büschel/Sträucher auf Grenzkacheln überdecken die Kante | Rauschmaske blendet Wald weich ins Gras |
| Weichzeichnung? | nein (deckende Formen) | nein | **ja** – widerspricht Auftrag |
| Inseln/Zungen | gelöst durch Kernsicherung | ungelöst (Bäume weiter auf Gras) | ungelöst, eher schlimmer |
| Dreifachgrenze | durch Schichtausschluss ≤ 1 sauber | teils Büschel im Sand | Risiko Überdeckung Ufer |
| Visuelle Qualität | hoch | mittel (Kante zwischen Büscheln sichtbar) | mittel bis hoch, oft matschig |
| Eingriffstiefe | `groundGeom` + `drawGround`, Zweig L = 6 | `natureAt`/`edges` | neuer Puffer + Compositing |
| Performance | nur beim Chunk-Backen, 0 pro Frame | Backen etwas teurer | Backen deutlich teurer |
| Jahreszeiten | übernimmt `seasonKey` der Texturen | Büschelfarbe je Saison nötig | schwierig bei Schnee |
| Wartbarkeit | gut, ein Ort | gut | schlecht |
| Risiko andere Böden | sehr gering bei striktem L = 6 | gering | mittel (Chunk-Nähte) |

## 7. Empfehlung

**Variante 1** (Kontursaum mit Kernsicherung, Partikelband aus Weltkoordinaten, nur Schicht 6). Gründe:
- Sie setzt dort an, wo die Kante entsteht.
- Sie ist die einzige Variante, die das Problem „Bäume auf Gras“ löst.
- Sie ist ohne Weichzeichnung.
- Sie kostet zur Laufzeit nichts.

Sparsame Strauch-Akzente aus V2 können später als eigener Schritt folgen.

### Risiken
- Der Kern-Mindestwert verändert die Waldfläche minimal. Das ist reine Darstellung, `terrain()` und die Spielmechanik bleiben unverändert.
- Eine zu dichte Humus-Sprenkelung wirkt wie ein dunkler Saum. Die Dichte muss deshalb im Boden-Labor abgestimmt werden.
- Wenn die Partikel nicht nach Kachel-Hash vergeben werden, entstehen Chunk-Nähte. Deshalb Partikel nur aus Kachelhash, mit Überhang wie bei der Kontur.
- Die gestapelten Schichten bedeuten, dass Hügel (5) unter Wald liegt. Der Saum muss auch auf Hügelgrund stimmen.

## 8. Vorschlag automatische Regressionstests (später)
1. **Kernsicherung** (vitest, rein): Für jede `forest`-Kachel einer Testregion gilt: Kernwert ≥ 0,5. Dazu ein künstlicher Fall: Einzelkachel und 1-Kachel-Streifen.
2. **Schichtgrenze**: Partikel-Generator liefert für Kacheln mit Schicht ≤ 1 (Wasser, Sand) nie ein Partikel.
3. **Determinismus/Chunk-Naht**: Partikelmenge einer Kachel ist gleich, egal ob sie aus Chunk A oder dem Nachbarchunk B berechnet wird.
4. **Andere Schichten unverändert**: Die Pfade für L ≠ 6 aus `groundGeom` sind vor und nach der Änderung identisch (Snapshot der Punktlisten, kein Bild).
5. **Bild-Regression (manuell ausgelöst)**: Die fünf Szenen dieses Berichts mit `scripts_aufnahme.py` neu aufnehmen. Abweichung außerhalb einer Waldrandmaske < 0,5 %.

## 9. Einschränkungen dieser Aufnahme
- **Herbst-Übersicht unvollständig**: In `autumn_1_saum_gerade_uebersicht_z0.7.png` sind mehrere Chunks noch nicht gebacken (flache Rauten). Das liegt an der Aufnahme, nicht am Spiel. Die Sommer-Übersicht ist vollständig.
- Der Mauszoom glättet die Bewegung und verschiebt dabei den Ankerpunkt. Die Szenen 2–5 zeigen deshalb überlappende Ausschnitte desselben Gebiets. Jede Situation ist darin sichtbar, aber nicht immer in der Bildmitte.
- Es gibt keine echte Nahaufnahme (Zoom ≥ 4). Für die Umsetzung soll sie im Boden-Labor nachgeholt werden.
- SwiftShader rendert sehr langsam. Die Chunk-Prüfung wartet auf eine stabile Zahl, dennoch einzelne Bilder prüfen.
- Die Bildstellen wurden per Mauszoom aus einer Übersicht angesteuert. Die Kachelkoordinate jeder Stelle ist daher nur ungefähr bekannt.
- Winter wurde nicht aufgenommen, die Bewertung dazu stammt aus dem Code.
