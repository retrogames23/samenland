# Pilot 3 – Wald-Gras-Übergang: Abschluss (Produktion)

Stand: 2026-11-09. Status: im regulären Spiel aktiv.

## Änderungen
- `src/game/forest-edge.ts` (forestShape): Rauschen gröber (Frequenz 0,9/2,4 statt 2,6/6,1) → wenige große Zungen und Buchten statt feiner Zacken; Grasbuchten dürfen bis Rautenabstand 0,74 in den alten Rand schneiden; Mindestradius 0,72 schützt alle Baumfüße (≤ 0,69); neben Wasser/Sand/Fels bleibt der Rand ≤ 0,98 (auch für Nachbarstrahlen).
- `src/game/lab-ctl.ts`: `PROD_EDGE` (Kern 0,75, Korn 6, v2) und `forestEdge()` – Testkarten-Schalter hat Vorrang, sonst Produktion.
- `src/game/render.ts`: Bodengeometrie nutzt `forestEdge()` statt `labEdge()`.

## Rückfall (Sicherheitsschalter)
`localStorage.setItem("samenland:forest-edge","off")` + Neuladen zeigt die alte harte Kontur. Global: `PROD_EDGE` in lab-ctl.ts durch `null`-Rückgabe ersetzen.

## Prüfung
- Waldgeometrie-Tests (14) und vollständige Suite bestanden.
- Aufnahmen: 6 Szenen × Sommer/Winter × Zoom 2,4/4,5, bisher vs. Produktion, mit Kamera-Sprungnachweis (`__labCam` = true) und Bake-Nachweis – siehe `aufnahmeprotokoll_abschluss.tsv`.
- Leistung: Mehraufwand nur beim einmaligen Backen eines Bodenstücks (wie Iteration 2), pro Bild nichts.
- Unverändert: andere Bodentypen, Bäume, Gebäude, Texturen, Jahreszeiten, Spiellogik.
