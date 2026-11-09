# Pilot 2: Ackerkrume, Garten, fruchtbare Niederung – Vergleichsstand

Status: **nur Vergleich, nichts im Spiel geändert.** `src/assets/terrain/fertile.jpg` ist unverändert
(md5 `cc2c2353400dc2825fa36255e0dffb0d`, identisch mit `textur/fertile_original_historisch.jpg`).
Freigabe entscheidet der Nutzer.

## Git-Ausgangslage
- Branch `edit/edt-3921d8ae-9a8c-45e7-b86f-b4e5f1192ae9`, Ausgangs-Commit `99ac4223bde70d08ba3f2bcd891b193f85dc1d93`
  (2026-11-09 01:41 UTC, „Waldboden-Pilot-Dokumentation"), Arbeitsverzeichnis sauber.
- Lokale Remotes sind nur Lovable-interne Speicher. Ein GitHub-Remote ist in der Sandbox **nicht sichtbar**;
  eine GitHub-Synchronisierung lässt sich von hier nicht nachweisen. Commits legt Lovable automatisch nach dem Arbeitsschritt an.

## Technische Analyse (Code-Nachweis)
| Verwendung | Stelle | Was darüber liegt |
|---|---|---|
| Gelände `fertile` (Flussaue) | world.ts:270 (`rv < 3.5 && h < 0.55`); render.ts `TEX_OF`, Ebene 2 in Pass 1 | `wildTurf` Grashalme (render.ts:2400); keine textureAlt/Makroflecken (nur Ebenen 3–5) |
| Garten | render.ts:2593 `drawAgri` | 50 % `dirt.jpg` darüber; Beetrücken (Striche) + Kohl/Lauch/Bohnen-Sprites |
| Acker „gepflügt" | render.ts:100 `LOOK_TEX.ploughed` | Furchen + Schollen (agriDetail) |
| Acker grün/reif/Stoppel/Brache | `crops`/`wheat`/`grass` | **nutzen fertile.jpg nicht** |
| Touch-Ersatzfüllung Garten | render.ts:3725 | nimmt `dirt`, nicht fertile |

- `SPAN.fertile = 70` (nature-sprites.ts) – kleinste Wiederholung aller Naturböden, daher Raster in 5×5 besonders sichtbar.
- Eingemalt in der Originaltextur: dichtes grünes Blatt-/Farnwerk (Mittelfarbe [48,64,21] = überwiegend grün). Separat gezeichnet: Grashalme, Gemüse, Furchen, Schollen.
- Gemeinsame Datei: jede Änderung an `fertile.jpg` trifft **gleichzeitig** Aue, Gartenuntergrund und gepflügte Äcker. Andere Geländearten sind nicht betroffen.
- Chunk-Caching: Aue wird in Boden-Chunks eingebacken, Felder/Gärten in Flach-Chunks; Schlüssel hängen nicht vom Bildinhalt ab → Bildtausch ändert kein Cacheverhalten.

## Varianten (KI-Rohbild → 816² nahtlos per Halbversatz → Farb-/Schärfeabgleich)
| | Mittelfarbe | Naht x/y | Schärfe | Fleckigkeit | Motiv (Figurenhöhen) |
|---|---|---|---|---|---|
| Original | 48/64/21 (grün) | 1,13/1,42 | 21,0 | 0,13 | **0,38 (zu groß)** |
| A Ackerkrume | 77/60/43 | 1,28/1,35 | 19,7 | 0,09 | 0,24 |
| B Gartenboden | 56/40/28 | 1,48/1,32 | 16,1 | 0,09 | 0,19 |
| C Niederung | 60/58/31 | 1,40/1,35 | 21,5 | 0,11 | 0,14 |
Grenzen (Hinweise): Naht ≤ 1,6, Schärfe 15–40, Fleckigkeit ≤ 0,2, Motiv ≤ 0,35. Rohfassungen von B (Schärfe 5,8) und C (Fleckigkeit 0,25) fielen durch und wurden nachgeschärft/ausgeglichen.

## Befund aus den Spielaufnahmen
- Jede Variante wurde im Spiel **für alle drei Verwendungen gleichzeitig** getestet (Bild per Aufnahmeskript umgeleitet, keine Projektdatei getauscht).
- Aue: Mit jeder braunen Variante wirkt die Flussaue wie eine kahle Erdfläche zwischen Wald und Gras. Die Aue braucht einen bewachsenen Boden; reine Erde passt dort nicht.
- Garten und gepflügter Acker: Die neuen Erden lassen Beete und Furchen klarer lesen; der Unterschied ist bei Normalzoom klein, im Nahzoom deutlich.
- 5×5: Original zeigt ein deutliches Raster; alle drei Varianten ruhig.

## Empfehlung
Drei getrennte Texturen sind sinnvoll, weil eine gemeinsame Datei Aue und Acker nicht zugleich richtig darstellen kann:
`ploughed` → Ackerkrume (A), Garten-Untergrund → Gartenboden (B), Gelände `fertile` → bewachsene Niederung
(C oder das Original bleibt vorerst). Dafür nötig (erst nach Freigabe): zwei neue `Tex`-Schlüssel in nature-sprites.ts
mit eigener SPAN, Zuordnung in render.ts `LOOK_TEX.ploughed` und `drawAgri` Garten. Keine Logik, keine Steuer, keine Felder betroffen.

## Bekannte Einschränkungen
- Kamera nach dem Ziehen nicht pixelgenau gleich (Dorf-Original leicht verschoben); Zoom „nah" misst 3,5–3,9 statt 4,16.
- Testkarten-Hinweis „Eigenes Dorf pflanzen" überdeckt einen Bildteil.
- Headless ohne GPU; Bildraten nicht aussagekräftig. Frühling/Winter nicht geprüft.

## Ergänzte Qualitätsregeln
8. Vor einer Texturänderung alle Verwendungen der Datei im Code auflisten; eine Datei, die mehrere Böden bedient, wird pro Verwendung im Spiel geprüft.
9. Spielvergleiche per Bild-Umleitung im Aufnahmeskript (`scripts/terrain_shots_fertile.py`), nie durch Austausch der aktiven Datei.
10. Mittelfarbe gegen die bisherige Rolle prüfen (grüne Aue ≠ braune Erde) – Messwerte erkennen keine Rollenfehler.

Dateien: `textur/` (Original + drei Varianten), `messwerte_*.txt`, `seamless.py`, `tune.py`. Bilder und Spielaufnahmen nur im ZIP.
