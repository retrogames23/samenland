# Bestandsaufnahme aller Geländetypen (Referenz: Weide)

Nur Analyse und Dokumentation, keine Änderung an Texturen, Sprites oder Renderlogik.

## Umfang
1. Alle im Code vorhandenen Geländetypen erfassen: Wald/Waldboden, Küste/Strand, Fels/Gebirge, Hügel, Acker (Weizen, Feldfrüchte, fruchtbarer Boden), Wiese, Weide (Referenz, nur gelistet), Gärten/Beete, Wege/Pflaster/Bohlen, Ufer- und Übergangszonen, Wasser, Schnee/Winterwege sowie weitere Typen, die sich aus dem Code ergeben.
2. Für jeden Typ in sechs Spalten: Grundtextur, zusätzliche Texturlagen, Vegetations-Sprites, sonstige Bodenobjekte, saisonale Veränderungen, Rendering/Caching (Funktion + Datei).
3. Gemeinsame Abhängigkeiten: `texture`/`textureAlt`/`texSample` (nature-sprites.ts), `VEG`-Konfiguration, wildTurf-Pfade, Übergangs-/Randfunktionen, Saisonfärbung, Chunk-Cache – je mit Liste der betroffenen Geländetypen.
4. Gestalterischer Zustand je Typ: Abgleich mit den Weide-Kriterien (keine eingemalten Pflanzen, Maßstab, Wiederholung, Nähte, Schärfe, flach aufgelegte Sprites). Dazu je Typ eine Nahaufnahme der Grundtextur und ein Ausschnitt im normalen Spielzoom, damit die Einschätzung auf Bildern beruht.
5. Priorisierte Reihenfolge nach visueller Bedeutung und Ausmaß der Probleme, mit Begründung.

## Lieferung
- Bericht `gelaende_bestandsaufnahme.md` und Kontaktbogen der Texturen und Szenenausschnitte als ZIP in Files.
- Kurzfassung mit Priorisierung im Chat.
- Prüfwerkzeug und Ergänzung des Regelwerks erst ab dem ersten freigegebenen Geländetyp; jetzt nur als Vorschlag im Bericht.

## Technische Details
- Quellen: src/game/render.ts, nature-sprites.ts, world.ts (Terrain-Klassen), seasons/winter code, src/assets/terrain/* (12 Texturen), Vegetations-Sprites.
- Screenshots per Playwright aus Boden-Labor/Spielkarte unter /tmp, kein Projektcode geändert.
