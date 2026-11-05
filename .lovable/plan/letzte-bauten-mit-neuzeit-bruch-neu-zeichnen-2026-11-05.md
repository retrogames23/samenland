# Letzte Bauten mit Neuzeit-Bruch neu zeichnen

Sechs Gebäude bekommen neue Bilder im Stil um 1500, passend zu Kirche, Dom und Backhaus (gleiche Isometrie, Licht von links oben, gleiche Größenordnung). Jedes bekommt eine Nachtversion mit leuchtenden Fenstern.

1. **Spritzenhaus** – offener Fachwerkschuppen der Feuerordnung: Ledereimer, Feuerhaken, Sturmleitern, Wasserbottich. Kein Schlauchturm.
2. **Wachstube** – kleines Torwachthaus aus Backstein mit Hellebardenständer, Schlagbaum und Laterne.
3. **Spital** – gotisches Heilig-Geist-Spital: Backsteinhalle mit Spitzbogenfenstern, Dachreiter, kleiner Kräutergarten.
4. **Schule** – schlichte Küsterschule an der Kirchhofmauer, Fachwerk, kleine Bleiglasfenster.
5. **Ratsarchiv** – gotisches Backstein-Archivhaus mit Treppengiebel und schmalen Fenstern.
6. **Stadtturm** – wehrhafter gotischer Ratsturm: Wachstube unten, Glockengeschoss oben, Helm.

Spielregeln, Preise, Stufen und Texte bleiben unverändert – nur die Bilder wechseln.

## Technisch
- Generierung per Bildbearbeitung mit `cohesive/church.webp` als Stilvorlage, Magenta-Hintergrund.
- Verarbeitung wie bei Dom & Co.: Alpha-Zuschnitt, Saumentfernung, längste Kante 480, WebP q88 unter `sprites/cohesive/` (+ `cohesive/night/`, gleicher Zuschnitt).
- `building-sprites.ts`: Importe für firehouse, guardhouse, infirmary, school, library, belfry umstellen, `crop` auf echte Maße; `width`/`base` behalten, damit die Größe auf der Karte gleich bleibt (bei Bedarf nachjustieren, damit nichts in Nachbarkacheln ragt).
- Alte Sprites und Nachtlayer löschen, sofern nirgends sonst importiert.
- Tests laufen lassen, Bilder vor dem Einbinden sichten.
