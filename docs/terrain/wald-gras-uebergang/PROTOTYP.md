# Pilot 3 – Prototyp Variante 1 (Waldkern + Waldsaum), nur Testkarte

Stand: 2026-11-09. Status: **Prototyp, nicht freigegeben.** Reguläre Spielkarten unverändert.

## 1. Ausgangssicherung
- Waldboden `src/assets/terrain/forest.jpg` unverändert (Pilot 1).
- `groundGeom`/`drawGround`: Originalpfad unverändert; der Prototyp ist ein zusätzlicher Zweig, der nur läuft, wenn `labEdge()` einen Wert liefert. `labEdge()` gibt außerhalb der Testkarte (Realm `lab`) immer `null` zurück.
- Andere Geländearten (L ≠ 6) unberührt: der Zusatzpfad wird ausschließlich direkt vor der Waldschicht gefüllt.
- Ausgangsstand: Commit `f9659a62` (lokal sichtbar; Ankunft bei GitHub nicht nachweisbar).

## 2. Umsetzung
- `src/game/forest-edge.ts` (neu, rein): `coreDiamond` (Kernraute je Waldkachel, skaliert mit `core`), `forestExtra` (Kerne + Saumflecken), `fringeOk` (nur Gras, Wiese, Acker/Aue, Hügel).
- Saum: je Waldkachel und angrenzender Gras-Kachel (4er-Nachbarschaft) mehrere unregelmäßige Sechsecke (flach 0,55 für die Bodenperspektive), Lage und Form aus Kachel-Hash → weltgebunden, gleich in jedem Bodenstück und jeder Kamera. ~30 % Lücken als Grasbuchten. Fleck verworfen, sobald eine Ecke über Wasser, Sand oder Fels läge.
- Keine Alphaverläufe, keine Weichzeichnung, kein Halo: Flecken werden mit demselben weltverankerten Waldboden-Muster gefüllt.
- `render.ts`: Geometrie- und Bodenstück-Schlüssel enthalten die Parameter, damit Varianten nie aus altem Zwischenspeicher kommen.
- `lab-ctl.ts`: `labEdge()` / `setLabEdge()`; Einstellung im Testbrowser per `samenland-lab-ctl` → `edge: {core, grain}`.

## 3. Getestete Parameter
| Variante | Kern (Rautenabstand) | Saumkorn (Weltpixel) |
|---|---|---|
| 0_bisher | – | – |
| A_kern085_mittel | 0,85 | 4 |
| B_kern075_fein | 0,75 | 2,5 |
| C_kern090_grob | 0,90 | 6 |

Baumfüße aus `natureAt`: (+6,−1) → 0,50 und (−5,+3) → 0,69; alle drei Kerne umschließen beide.

## 4. Aufnahmen
6 Stellen (Einzelkachel 319:423, Insel 321,5:424, Zunge 300:411, gerader Saum 298:437, unregelmäßiger Saum 288:421, Wald-Gras-Wasser 284:437) × 4 Varianten; Sommer Zoom 1,0/2,4/4,5, Winter 2,4/4,5, Herbst 4,5 = 144 Bilder, 12:00 Berlin, klar, Maus außerhalb der Karte. Alle mit Bake-Nachweis (≥ 3 Frames ohne Ersatzfläche); 5 erste Versuche ohne Nachweis wurden verworfen und wiederholt (siehe `aufnahmeprotokoll_prototyp.tsv`). Hinweis: Die Einzelkachel 298:421 liegt inzwischen unter Testwieks Feldern und wurde durch 319:423 ersetzt; Insel und Einzelkachel liegen daher im selben Bildausschnitt.

## 5. Befunde
- **Kern wirkt:** Einzelkachel, Insel und Zunge haben jetzt sichtbaren Waldboden unter allen Bäumen (vorher: Bäume auf Wiese).
- **Kernform:** Bei 0,85 und 0,90 sind an Einzelkacheln gerade Rautenkanten erkennbar, im Winter als hellgraue Rauten. 0,75 fällt am wenigsten auf.
- **Saum:** Bei Korn 4 und 6 lesen sich die Flecken eher als verstreute braune Tupfer neben dem Waldrand als als zusammenhängende Zungen. Korn 2,5 ist ruhig, aber kaum wahrnehmbar.
- **Zoom 1,0:** Kein sichtbarer Unterschied zwischen den Varianten.
- **Wasser/Sand:** Kein Fleck auf Ufer oder Wasser (Bild 6 und Test).
- **Winter:** Unter Schnee wirkt der Saum kaum; die Kerne sind als graue Flächen erkennbar.

## 6. Tests
- Neu `src/game/forest-edge.test.ts`: 7 Tests (Baumfüße im Kern für 0,75/0,85/0,90; Einzelkachel und einreihiger Streifen behalten Waldboden; Determinismus über Bodenstück-Grenzen; kein Fleck auf Wasser/Sand/Fels; ohne Wald keine Zusatzflächen) – bestanden.
- Bestehende Tests: 775/775 bestanden. Saisonale Darstellung: in Sommer/Herbst/Winter-Aufnahmen geprüft (kein eigener Test).

## 7. Leistung
Nur beim Backen eines Bodenstücks: 0,06–0,5 ms je 16×16-Stück (113–148 Flecken), Messung `perf.txt` (erster Wert enthält Geländeaufwärmung). Keine Arbeit pro Bild, kein zusätzlicher dauerhafter Zwischenpuffer (ein Path2D pro zwischengespeicherter Geometrie).

## 8. Empfehlung
**Variante B (Kern 0,75, feines Korn) als Grundlage**, mit zwei Nacharbeiten vor einer Freigabe: Kernraute an den Ecken abrunden/verwackeln, und Saumflecken zu kleinen Gruppen bündeln (2–4 Flecken je Zunge), damit Zungen statt Tupfer entstehen. Noch keine Übertragung auf die Spielkarte.

## 9. Temporäre Teile (nach der Geländeprüfung entfernen)
- Kamera-Sprungpunkt `window.__labCam(x, y, zoom)` in `src/components/Game.tsx` (useEffect neben `cam`), siehe `KAMERATEST.md`.
- Prototyp-Schalter `labEdge`/`setLabEdge` in `lab-ctl.ts` und die zwei `labEdge`-Stellen in `render.ts` (geomCache-Schlüssel + `forestX`, Bodenstück-Schlüssel).
