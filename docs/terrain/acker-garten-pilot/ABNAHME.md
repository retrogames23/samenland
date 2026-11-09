# Pilot 2 – Abnahme Acker / Garten / Aue (9.11.2026)

## Bedingungen
Testkarte „lab“, Testwiek, 12:00 Spielzeit, Wetter klar, Saison per Testpult. Gepflügte Äcker wurden **nur im Testbrowser** erzwungen (Umleitung von rotation.ts, `fieldLook` → „ploughed“), weil im November kein Acker gepflügt ist. Vorher = neue Texturen per Bildumleitung durch fertile.jpg ersetzt. Kein Spielzustand verändert.

## 1. Codeprüfung – bestanden
- Gepflügt: nur `LOOK_TEX.ploughed = fertileAcker` (render.ts:100).
- Garten: nur `drawAgri` → `fertileGarten` + 50 % dirt (render.ts:2593).
- Aue: `TEX_OF.fertile`, Ebene 2, wildTurf → unverändert fertile.jpg (md5 cc2c2353…).
- Keine weiteren Verwendungen. SPAN 70 wie Original, Saisonrolle „ground“ wie Original, Chunk-Schlüssel enthalten Feldbild/Art – unverändert. Dokumentation im Pilotordner stimmt mit dem Code überein.

## 2./3. Visuell (Einschätzung, keine Freigabe)
- Acker: Furchen und Schollen gut lesbar, Erde wärmer und erdiger als vorher; Feldränder sauber. Keine Kachelgrenzen sichtbar.
- Garten: Beete mit Gemüse gut differenziert, nicht zu dunkel; im Frühling Flechtzäune sichtbar.
- Frühling: plausibel. Winter: Schnee deckt Acker und Garten, Furchen bleiben sichtbar – plausibel.
- Aue: Textur nachweislich unverändert; in den Aufnahmen nicht eigens herausgestellt.

## 4. Regression
775/775 Tests (140 Dateien) bestanden. Zoom nah/normal/Übersicht ohne Fehler.

## Status
| | Technisch | Visuell geprüft | Freigegeben |
|---|---|---|---|
| Acker | bestanden | ja (Sommer/Frühling/Winter) | offen – durch Nutzer |
| Garten | bestanden | ja | offen – durch Nutzer |
| Aue | unverändert | nur per Code | – |

## Offene Punkte
- Zoomstufe vorher/nachher weicht leicht ab (3,38 / 3,61) – Software-Grafik im Testbrowser; Ausschnitt gleich.
- Herbst nicht neu aufgenommen (liegt aus Umsetzung vor, Abendlicht).
- Echter Pflugtermin (Juni/April) im Live-Spiel noch nicht beobachtet.
- Commit „Boden-Texturen neu zugewiesen“ (6426f3d5) ist im Verlauf nachweisbar; GitHub-Spiegelung von hier aus nicht prüfbar.
Das vollständige ZIP liegt unter Dateien (acker_garten_abnahme.zip); im Repo nur die Einzeldateien.
