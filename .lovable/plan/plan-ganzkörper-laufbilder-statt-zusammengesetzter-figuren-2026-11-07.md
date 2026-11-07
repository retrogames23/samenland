# Plan: Ganzkörper-Laufbilder statt zusammengesetzter Figuren

## Was die Screenshots zeigen

Beide Fehler haben dieselbe Ursache, das Baukastenprinzip:

- Gehende Männerfiguren bestehen aus zwei Teilen. Der Oberkörper stammt aus dem stehenden Bild der Figur und wird am Saum (rote Linie) abgeschnitten. Darunter hängt ein gemeinsames Beinpaar, das für alle Figuren gleich ist (`legs-m`, `-dark`, `-grey`, `-linen`, `-red`).
- Dieses Beinpaar ist stur auf halbe Körperhöhe eingestellt (LEG_RATIO 0.5). Das Bild jeder Figur hat aber eigene Proportionen, eine eigene Blickrichtung und eigene Stoffbreite. Dadurch entstehen immer wieder dieselben Fehler:
  - Die Beine sind zu lang und zu dünn, der Oberkörper wirkt gestaucht (Bauer im Kittel).
  - Hüfte und Saum sind gegeneinander versetzt. Das Hemd endet in einer harten, verwischten Kante.
  - Hände unterhalb des Saums werden mit abgeschnitten. Beim Bauern sind sie verschmiert. Beim Schulzen bleibt um die Hand ein dunkles Rechteck stehen, die geschützte Fläche.
- Jede bisherige Korrektur hat nur einzelne Werte pro Figur nachgestellt (hipX, hemY, keep). Das bleibt Flickwerk, solange zwei unterschiedlich gemalte Körper zusammengeklebt werden.

## Grundsätzliche Lösung

**Jede gehende Figur bekommt ein eigenes Laufbild, auf dem der ganze Körper gemalt ist: vier saubere Phasen, abgeleitet vom Standbild der Figur.** Zusammengesetzt wird nichts mehr. Bei `man-walk`, `hunter-walk`, `child-walk`, `girl-walk` und `toddler-walk` funktioniert das schon, und dort tritt der Fehler nicht auf.

### Schritt 1 – Bestandsaufnahme und Regel
- Alle Figuren auflisten, die noch zusammengesetzt laufen. Laut Tabelle sind das: man, wealthy, farmer, porter, builder, woodcutter, mason, elder, robber, watchman, youth, groom, der Schulze in allen Altersstufen, prince, herald, guard, gardener, Hof-groom und die Feiertagsfiguren, die darauf zurückfallen.
- Die Regel wird in AGENTS.md festgehalten: Neue Figuren laufen nur mit einem Ganzkörper-Laufbild.

### Schritt 2 – Laufbilder erzeugen (nach Häufigkeit im Spiel)
- Für jede Figur: Standbild als Vorlage, vier Phasen (Kontakt, Durchschwung, Kontakt, Durchschwung), Dreiviertelprofil nach rechts, gleiche Kleidung, gleicher Maßstab, gleiche Fußlinie. Die Hände bleiben sichtbar.
- Reihenfolge: 1) Bürger, wohlhabender Bürger, Bauer, Träger, Schulze. 2) Handwerker (Bauarbeiter, Holzfäller, Steinmetz, Wächter, Jugendlicher, Knecht). 3) Hofstaat und Räuber. Frauen und Gewandfiguren laufen schon über eigene Wege und kommen nur dran, wenn das Kabinett dort Fehler zeigt.
- Jedes Sheet wird beim Erstellen automatisch normalisiert: Größe aus den sichtbaren Pixeln, gemeinsame Fußlinie, Mitte auf den Hüftschwerpunkt (wie heute schon bei frameShift), keine Wiederholungsphasen.

### Schritt 3 – Darstellung umstellen
- In `render.ts` und `figure.ts` bekommt das Ganzkörper-Laufbild Vorrang. Der Baukasten mit Saumschnitt, Beinsheets und keep-Kästen bleibt nur als Rückfall für Figuren, die noch nicht umgestellt sind. Das Kabinett markiert solche Figuren sichtbar als „zusammengesetzt“.
- Sobald alle Figuren umgestellt sind, kommen die gemeinsamen Beinsheets und die HIPS-Feinwerte weg.

### Schritt 4 – Wasserdichte Prüfung
- Ein automatischer Test pro Laufbild prüft:
  - genau vier Phasen,
  - dieselbe Fußlinie in allen Phasen (±1 px),
  - eine Gesamthöhe, die höchstens 3 % vom Standbild abweicht,
  - eine Beinlänge zwischen 45 und 55 % der Höhe, gemessen an den sichtbaren Pixeln,
  - keine harte waagerechte Kante im Hüftbereich.
- Das Kabinett zeigt Stand- und Laufbild nebeneinander mit Höhen- und Fußlinie. Jede Reihe wird per Bildschirmfoto abgenommen.

## Technische Details
- Betroffen: `src/game/figure.ts` (drawLegged und keep entfallen künftig), `src/game/render.ts` (HIPS, MAYOR_LEGS, Auswahl des Laufbilds), `src/game/folk-sprites.ts` (Registrierung von WALK_SHEETS) und neue Dateien `src/assets/sprites/folk/*-walk.webp` (480 px, mit Alpha zugeschnitten).
- Beim Schulzen werden alle Altersstufen und beide Geschlechter auf ein gemeinsames Laufbild je Kohorte umgestellt. Damit verschwindet auch das Handkästchen.
- Wirtschaft, Bevölkerung und Spiellogik bleiben unberührt. Es ändert sich nur die Darstellung.
