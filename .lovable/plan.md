# Nachtlicht-Optik angleichen (Bild 1 statt Bild 2)

## Befund
Die von Hand nachgezeichneten Masken aus allen vier Runden (34 Gebäude, z. B. herberge, patrician-Varianten, steinhaus, villa, school, townhall …) füllen jede Scheibe mit einer gleichmäßigen, hellen Fläche in einheitlicher Farbe. Dadurch wirken die Fenster wie aufgeklebte beige Schilder (Bild 2). Die älteren, stimmigen Masken (z. B. Gasthaus, Bild 1) sind wärmer bernsteinfarben und lassen Sprossen, Bleiverglasung und Rahmen aus dem Tagesbild durchscheinen.

## Vorgehen
- Für jede der 34 betroffenen Masken bleibt die Fensterform genau wie sie ist (Positionen stimmen).
- Nur die Lichtwirkung innerhalb der Form wird neu berechnet:
  - Farbe wärmer bernstein wie beim Gasthaus.
  - Helligkeit pro Pixel nach dem Tagesbild: dunkle Glasstellen leuchten, Sprossen, Bleiruten und Rahmen bleiben dunkel und sichtbar.
  - Leichter Verlauf: zur Fenstermitte heller, zum Rand weicher, keine harte Kante.
- Je Gebäude ein Vorher/Nachher-Kontrollbild prüfen; bei Ausreißern einzeln nachregeln.
- Tagesbilder, Fensterformen, Größen und Rendering bleiben unverändert. Das Spritzenhaus bleibt dunkel.
- Fingerabdrücke der geänderten Masken aktualisieren und auf „open“ zurücksetzen (nicht freigeben).
- Nur den Nachtmasken-Test ausführen, danach ein Übersichtsbild aller 34 Gebäude im Nachtmodus zur Abnahme.

## Technische Details
- Betroffen sind die Masken mit der Signatur Farbe (255,198,117) und Alpha 216, also genau die Masken aus den Runden 1 bis 4.
- Neue Alpha-Berechnung: Formmaske × (normierte Dunkelheit des Tagespixels innerhalb jedes Fensters) × weicher Innenverlauf; Farbe ca. (255,176,80), Spitzenalpha wie beim Gasthaus.
