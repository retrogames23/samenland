# Pilotprojekt 2 – Abschluss (09.11.2026)

## Status
| Boden | Datei | Technisch | Visuell | Entscheidung |
|---|---|---|---|---|
| Gepflügter Acker | `src/assets/terrain/fertile_acker.jpg` (MD5 614d8f89de8575325e77a6685aa73579) | freigegeben | freigegeben | **endgültig freigegeben** durch den Nutzer |
| Garten | `src/assets/terrain/fertile_garten.jpg` (MD5 8578a44a80e435d391dc049608e58bca) | freigegeben | freigegeben | **endgültig freigegeben** durch den Nutzer |
| Fruchtbare Aue | `src/assets/terrain/fertile.jpg` (MD5 cc2c2353400dc2825fa36255e0dffb0d) | geprüft | geprüft | **geprüfter historischer Bestand** – keine neue Freigabe, unverändert |

## Dokumentierte Auffälligkeit (ohne Korrektur)
Aue: größtes Motiv 0,38 Figurenhöhen, Grenzwert 0,35 (eingemalte Farne/Blätter).
Naht 1,13/1,42, Schärfe 21,0, Fleckigkeit 0,13 liegen im Rahmen. Bewusst nicht korrigiert;
eine spätere Überarbeitung wäre ein eigenes Arbeitspaket.

## Umsetzung (Code)
Siehe `code_diff.patch`: `nature-sprites.ts` (zwei Texturen, SPAN 70), `render.ts`
(`LOOK_TEX.ploughed = "fertileAcker"`, Gartenfüllung `fertileGarten`), Regel in
`src/assets/sprites/AGENTS.md`. Keine Änderung an Mechanik, Erträgen, Steuern, Gelände.

## Prüfung
Typecheck fehlerfrei, 775/775 Tests. Aufnahmen 12:00 Uhr, Sommer, klar; Nah/Normal/Übersicht;
Stichprobe Frühling/Winter. Vergleichsaufnahmen erst nach vollständig gebackenen Chunks.

## Offen
- Acker zur echten Pflugzeit im laufenden Spiel noch nicht beobachtet (Aufnahmen mit erzwungenem Pflugstatus im Testbrowser).
