# Geländetexturen – zusammengeführte Qualitätsregeln (Pilot 1 + 2)

## Projektstatus
| Pilot | Geländetyp | Stand |
|---|---|---|
| 1 | Waldboden | abgeschlossen (Variante A, `docs/terrain/waldboden-pilot/`) |
| 2 | Acker / Garten | abgeschlossen (`docs/terrain/acker-garten-pilot/ABSCHLUSS.md`); Aue = geprüfter historischer Bestand |
| 3 | offen | Auswahl Gebirge/Fels oder Wald-Gras-Übergang steht aus |

## Gemeinsame Regeln
1. Alte Textur vor jeder Änderung als historische Sicherung ablegen; Originale bleiben unverändert.
2. Bodentexturen sind ruhiges Material ohne eingemalte Einzelpflanzen, Blätter, Steine; Pflanzen kommen als eigene Sprites.
3. Hinweisgrenzen (scripts/terrain_qa.py): Motiv ≤ 0,35 Figurenhöhen bei echter SPAN, Naht ≤ 1,6, Schärfe 15–40, Fleckigkeit ≤ 0,2. Messwerte sind Hinweise, nie Freigabe; jede Messung nennt den echten Dateipfad und MD5.
4. Sichtprüfung: Einzelbild, 3×3, 5×5, Spielkarte nah/normal/Übersicht; vorher/nachher mit gleicher Kamera, Zoom, Uhrzeit (12:00), Jahreszeit, Wetter.
5. Aufnahmen erst, wenn alle sichtbaren Chunks gebacken sind (Chunk-Zähler stabil, kein grüner Platzhalter).
6. Ein Geländetyp pro Arbeitspaket; Freigabe nur durch den Nutzer anhand der Bilder.
7. Keine Änderung an Mechanik, Erträgen, Steuern oder Geländegenerierung.

## Besonderheiten
- **Pilot 1 Waldboden:** mehr Variation nur, wenn die 5×5-Kachelung kein Raster zeigt und im Spiel sichtbar etwas bringt (Variante B deshalb verworfen). Prüfung Sommer + Herbst.
- **Pilot 2 Acker/Garten:** eine Ausgangstextur wurde in getrennte Texturen je Verwendung aufgeteilt (Acker, Garten, Aue), gleiche SPAN 70 und gleiche saisonale Behandlung. Zustände, die im aktuellen Kalender nicht vorkommen (Pflügen), dürfen im Testbrowser erzwungen werden – das wird als Einschränkung vermerkt. Stichprobe Frühling + Winter.
- **Bestand mit Auffälligkeit:** Eine bewusst behaltene Textur (Aue, Motiv 0,38) wird als „geprüfter historischer Bestand" geführt, nicht als neu freigegeben.
