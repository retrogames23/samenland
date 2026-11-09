# Pilot 3 – Wald-Gras-Übergang: Abschluss (Produktion)

Stand: 2026-11-09. Status: im regulären Spiel aktiv.

## Änderungen
- `src/game/forest-edge.ts` (forestShape): Rauschen gröber (Frequenz 0,9/2,4 statt 2,6/6,1) → wenige große Zungen und Buchten statt feiner Zacken; Grasbuchten dürfen bis Rautenabstand 0,74 in den alten Rand schneiden; Mindestradius 0,72 schützt alle Baumfüße (≤ 0,69); neben Wasser/Sand/Fels bleibt der Rand ≤ 0,98 (auch für Nachbarstrahlen).
- `src/game/lab-ctl.ts`: `PROD_EDGE` (Kern 0,75, Korn 6, v2) und `forestEdge()` – Testkarten-Schalter hat Vorrang, sonst Produktion.
- `src/game/render.ts`: Bodengeometrie nutzt `forestEdge()` statt `labEdge()`.

## Rückfall (Sicherheitsschalter)
`localStorage.setItem("samenland:forest-edge","off")` + Neuladen zeigt die alte harte Kontur. Global: `PROD_EDGE` in lab-ctl.ts durch `null`-Rückgabe ersetzen.

## Prüfung
- Waldgeometrie-Tests (14) bestanden. Die vollständige Suite lief nach der letzten Wasserrand-Korrektur zunächst nicht erneut; Nachlauf am 2026-11-09 17:30 UTC: 142 Testdateien, 789/789 Tests bestanden, 0 Fehler.
- Aufnahmen: 6 Szenen × Sommer/Winter × Zoom 2,4/4,5, bisher vs. Produktion, mit Kamera-Sprungnachweis (`__labCam` = true) und Bake-Nachweis – siehe `aufnahmeprotokoll_abschluss.tsv`.
- Leistung: Mehraufwand nur beim einmaligen Backen eines Bodenstücks (wie Iteration 2), pro Bild nichts.
- Unverändert: andere Bodentypen, Bäume, Gebäude, Texturen, Jahreszeiten, Spiellogik.

## Nachkorrektur Aufnahme
- `summer_3_zunge_schmal_z2.4_P_produktion.png` zeigte Testwiek (Kamera auf Zoom 2,60 zurückgesprungen). Neu aufgenommen: Kamera 300:411, Zoom 2,40 im HUD bestätigt, 6 fallbackfreie Frames, Bildausschnitt deckungsgleich mit `_0_bisher`.

## Versionsstand
- Commit der Produktionsüberführung: `39d0eacfab09aa7d46219a209f7278f4b2d1f651`. Die Live-Seite enthielt am 2026-11-09 17:34 UTC den neuen Waldrand noch nicht (nicht veröffentlicht). GitHub-Ankunft aus der Arbeitsumgebung nicht nachweisbar.
