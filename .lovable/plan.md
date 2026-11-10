# Performance-Audit 1 – Diagnose (keine Fixes)

Ziel: Herausfinden, wo die Spielgrafik tatsächlich Zeit und Speicher kostet, besonders bei Regen und beim Herauszoomen auf Handys. Das Spielverhalten bleibt dabei unverändert.

## Schritte

1. **Architektur lesen**: alle AGENTS.md, Game.tsx-Zeichenschleife (ab ca. Zeile 900), render.ts (draw, drawOverview, drawOverviewTown, overviewKey, groundChunk/drawGroundChunks, groundGeom, drawFlatChunks/bakeFlat/flatCheck/flatTok, alle Caches, frameBakes inkl. Vorausbacken), weather.ts + drawWeather/wxTile, night.ts/beginLit/drawBuildingNight/skyTint, season-art.ts, nature-sprites.ts, people/animals/wander. Bestehende Optimierungen und ihre Kommentare dokumentieren.
2. **Kleine Messhilfe (nur Diagnose)**: eigenes Modul `src/game/perf-probe.ts`, aktiv nur in DEV oder bei `?perf=1` im Lab. Sonst kostet es nichts, weil es nur einen Schalter prüft.
   - Zeitmessung je Bereich: gesamtes draw, Übersicht/Normalansicht, Boden-Chunks, Flach-Chunks, Weltabfragen (structureAt, townTiles, links, roadProgress), Bewohner/Tiere, Straßen/Händler, Wetter, Nacht/Licht, Zusätzliches nach draw.
   - Zähler: geprüfte/sichtbare Tiles, Städte geprüft/gezeichnet, Cache-Treffer und -Fehlgriffe je Cache, neu gebackene Chunks je Frame, Cache-Größen samt geschätztem Speicher, Canvas-Auflösung, DPR.
   - FPS und Frame-Zeit p50/p95 über ein rollierendes Fenster; Ausgabe in die vorhandene Perf-Anzeige und als JSON-Export (`window.__perf`).
3. **Testmatrix mit Playwright und Chromium** auf localhost: 10 Szenarien (Desktop/Mobil × nah/maximale Übersicht × klar/Regen, Panning und Zoomen, Nacht mit vielen Städten). Wetter, Tageszeit und Zoom stelle ich über die vorhandenen Lab-Schalter ein. Dazu zwei Welten, eine kleine und eine große: der Lab-Realm und der volle Europa-Realm. Für Mobil emuliere ich das Pixel 8 Pro (412×915, DPR 2 nach der Begrenzung, Touch) und drossle die CPU per CDP (4×). Zusätzlich zeichne ich Chrome-Traces auf, um JS-Zeit von Raster- und GPU-Zeit zu trennen. Der Bericht kennzeichnet ausdrücklich: **keine Messung auf einem echten Pixel**.
4. **Bericht** (`/mnt/documents/performance-audit-1.md` plus Messdaten-CSV), auf Deutsch:
   - A. Befunde mit Datei, Funktion, Zeile, Wirkung auf CPU/GPU/RAM und Evidenzgrad (gemessen / aus dem Code ableitbar / Hypothese)
   - B. Ranking nach Nutzen und Risiko, getrennt nach CPU, GPU/Canvas und RAM
   - C. höchstens 5 kleine, unabhängige Optimierungen mit Nebenwirkungen, Risiken, Regressionstests und Messmethode
   - D. strategische Einschätzung der Canvas-Architektur, ohne Empfehlung für einen Umbau
   - Abschluss: was nachgewiesen ist und was noch gemessen werden muss, z. B. auf einem echten Gerät

## Grenzen
- Keine Änderungen an Mechanik, Wachstum, Datenbank, Bildqualität oder Weltlogik. Kein Veröffentlichen.
- Einzige Code-Änderung: die abschaltbare Messhilfe und ihre Messpunkte in render.ts/Game.tsx. Messpunkte, die abgeschaltet sind, verändern das Bild und die Abläufe nicht. Nach dem Audit kann die Messhilfe drinbleiben oder auf Wunsch wieder entfernt werden.
- Ein echtes Pixel 8 Pro steht mir nicht zur Verfügung. Die Mobilwerte sind deshalb Emulation und als solche gekennzeichnet.
