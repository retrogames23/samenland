# Plan: Brücken-Culling und schnellere Übersichtskarte

Ziel: Die zwei gemessenen Engpässe beheben, ohne Spielmechanik, Simulation oder Aussehen zu ändern. Wegenetz-Berechnung und Fluten bleiben unberührt.

## Block 1 – Brücken nur im Bildausschnitt prüfen
- Heute: Die Brückenschleife fragt für jede Wasserquerung aller ~163 Straßen erst `structureAt()` ab und prüft erst danach, ob die Brücke im Bild liegt.
- Neu: Zuerst die Bildschirmprüfung der beiden Brückenköpfe (A/B) – die teure Bauzustandsprüfung läuft nur noch für sichtbare Querungen. Zusätzlich ganze Straßen per vorhandenem `roadBox(l)` überspringen, wenn sie den Ausschnitt nicht berühren.
- Ergebnis: identische Brücken auf dem Bildschirm, statt ~93 nur noch 0–3 Abfragen pro Frame.

## Block 2 – Übersichtskarte (herausgezoomt) zwischenspeichern
- Heute: `drawOverview` fragt bei jedem Frame für jede sichtbare Stadt jede Kachel neu über `structureAt()` ab (~120.000 Abfragen).
- Neu: Pro Stadt wird das Gebäudebild der Übersicht einmal in eine kleine Offscreen-Leinwand gemalt und wiederverwendet. Neu gemalt wird nur, wenn sich die Stadt sichtbar ändert: Kachelradius, Anzahl Bauten/Käufe, Jahreszeit (Felderfarbe), Zoomstufe (`step`) oder nach einem groben Zeittakt (z. B. 30 s, damit Baustellen weiterwandern).
- Gleiche Sprites, gleiche Reihenfolge, gleiche Maßstäbe – nur die Abfragen entfallen. Nacht-Tönung, Wetter, Namen und Fürstenhof bleiben wie bisher live.
- Speicherschutz: Zwischenspeicher begrenzt (älteste Städte fliegen raus), Pixelgröße gedeckelt, auf Touch-Geräten DPR ≤ 2 wie bisher.

## Block 3 – Prüfen
- Neuer Test: Brückenschleife liefert für einen Bildausschnitt dieselben Brücken wie vorher (Vergleich alt/neu).
- Neuer Test: Cache-Schlüssel ändert sich bei Wachstum/Jahreszeit und bleibt sonst gleich.
- Synthetische Bun-Messung (60 Hansestädte, 5 Jahre) vorher/nachher, getrennt berichtet von einem Browser-Screenshot-Vergleich der Übersicht (Playwright, mobiles Profil 390×710, DPR 2).
- Volle Testsuite, Typecheck, Build.

## Technische Details
- Dateien: `src/game/render.ts` (Brückenschleife ~Z. 3639, `drawOverview` ~Z. 1807), ggf. kleines Hilfsmodul `src/game/overview-cache.ts`.
- Cache-Schlüssel je Stadt: `id | ceil(R) | step | bought.length | season | floor(now/30000)`.
- Regel in `src/game/AGENTS.md`: Übersichts-Cache ist reine Darstellung, nie Grundlage für Mechanik.
- Nicht Teil des Plans: A*-Kaltstart, `townOf()`-Minutentakt, Wegenetz, Fluten.
