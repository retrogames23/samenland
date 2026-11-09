# Waldboden-Pilot (Geländetyp 1) – endgültiger Stand

Status: **Variante A freigegeben (Nutzerentscheidung 2026-11-09)**, im Spiel aktiv.
Variante B (Feinabstimmung mit zusätzlichen Humus-/Moosflecken) **verworfen**: In der
5×5-Kachelung entsteht ein erkennbares Wiederholungsmuster, im Spiel ist der Gewinn gering.

## Dateien
| Datei | Rolle |
|---|---|
| `src/assets/terrain/forest.jpg` | aktive Textur = Variante A (md5 `9860249232d18b67757eae418d6cac2f`) |
| `textur/forest_A_final.jpg` | Kopie von A |
| `textur/forest_ursprung_historisch.jpg` | ursprüngliche Textur, historische Sicherung (nicht löschen) |
| `textur/forest_B_verworfen.jpg` | verworfene Feinabstimmung, nur zur Nachvollziehbarkeit |
| `messwerte_final.txt`, `messwerte_A_B.txt`, `messwerte_pilot.txt` | Ausgaben von `scripts/terrain_qa.py` |
| `scripts/terrain_qa.py` | Prüfwerkzeug (Hinweise, keine Freigabe) |
| `scripts/terrain_shots.py` | Aufnahmeskript für Spielkarten-Vergleiche |

Vergleichsbilder und Spielaufnahmen liegen wegen ihrer Größe nur im ZIP `waldboden_pilot_final.zip`.

## Technik
- 816×816 px JPG, `SPAN.forest = 120` (nature-sprites.ts): 1 Kachel ≈ 120 Texturpixel, Figur ≈ 36 px.
- Renderpfade unverändert: `TEX_OF` → `texture()`/`textureAlt()`, Wald-Tönung in render.ts, Einbacken in Boden-Chunks (gleicher Cache-Schlüssel, nur der Bildinhalt wechselt).
- Erzeugung: KI-Rohbild 1024² → Halbversatz-Überblendung für Nahtlosigkeit → leichte Weichung → Farbangleich an Baumkronen; kein Nachschärfen.

## Messwerte (scripts/terrain_qa.py)
| | Ursprung | **A (final)** | B (verworfen) | Weide-Referenz grass.jpg |
|---|---|---|---|---|
| Naht x/y (Grenze 1,6) | 1,04/1,40 | **1,34/1,36** | 1,43/1,39 | 1,47/1,48 |
| Schärfe (Laplace, 15–40) | 19,9 | **23,7** | 22,1 | 30,3 |
| Makro-Fleckigkeit (≤0,2) | 0,16 | **0,07** | 0,13 | 0,12 |
| größtes Motiv (Figurenhöhen, ≤0,35) | 0,33 | **0,14** | 0,17 | 0,09 |

Aufnahmebedingungen: Testkarte „lab", Testwiek, Wald bei 293:438, ca. 12:20 Uhr, Wetter klar,
Sommer + Herbst, Zoom nah (gemessen 3,78 statt 4,16), normal 2,60, Übersicht 0,63; 1280×900, DPR 1.

## Prüfwerkzeug – bekannte Grenzen
**Ein bestandener automatischer Test ersetzt niemals eine visuelle Freigabe.** Das Werkzeug meldet nur Hinweise.
- Misst nur das Einzelbild, nicht die Darstellung im Spiel (Tönung, Jahreszeit, Licht, Überdeckung durch Bäume).
- Erkennt Wiederholungsmuster nur grob: B bestand alle Grenzwerte und zeigte trotzdem sichtbares 5×5-Raster.
- Nahtwert vergleicht nur Randpixel mit dem Bildmittel; weiche Farbverläufe über die Kante bleiben unerkannt.
- Motivgröße beruht auf einer Kontrastschwelle; kontrastarme große Motive (z. B. Farnflächen) können durchrutschen.
- Grenzwerte sind aus Weide und Waldboden abgeleitet, nicht für Wasser, Wege oder Felder kalibriert.
- Stil (Pixelart-Nähe, „Foto-Look") wird gar nicht gemessen.
- Headless-Aufnahmen laufen ohne GPU; Bildwiederholraten daraus sind nicht aussagekräftig.

## Übertragbare Qualitätsregeln (für weitere Geländetypen)
1. Alte Textur vor jeder Änderung als historische Sicherung ablegen.
2. Bodentexturen sind ruhiges Material ohne eingemalte Einzelpflanzen, Blätter, Steine oder Muscheln; Pflanzen kommen als eigene Sprites.
3. Größtes auffälliges Motiv ≤ 0,35 Figurenhöhen bei der echten SPAN.
4. Naht ≤ 1,6, Schärfe 15–40, Fleckigkeit ≤ 0,2 – nur als Hinweisgrenzen.
5. Pflicht-Sichtprüfung: Einzelbild, 3×3 und 5×5-Kachelung, Spielkarte nah/normal/Übersicht in Sommer und Herbst, gleiche Karte, Uhrzeit und Wetter für vorher/nachher.
6. Mehr Variation nur, wenn sie in der 5×5-Kachelung kein Raster erzeugt und im Spiel sichtbar etwas bringt.
7. Freigabe nur durch den Nutzer anhand der Bilder; nur ein Geländetyp pro Arbeitspaket.

## Vorgemerkt (nicht bearbeitet)
- Wald-Gras-Übergang (harte Kante zwischen Waldboden und Gras) – eigenes späteres Arbeitspaket.
