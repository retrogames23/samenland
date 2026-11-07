# Figurenkabinett komplett und Figuren aus einem Guss

## Ziel
1. Im Figurenkabinett gibt es für jede Figur eine eigene Reihe. Nebeneinander stehen alle Situationen, in denen sie im Spiel vorkommt: Stehen, Gehen, Arbeit, Last tragen, Löscheimer, Regen/Wind, Frost, Nacht mit Laterne, Fest.
2. Jede Figur sieht in jeder Situation gleich aus: gleiche Kleidung, Farben, Proportionen und Blickrichtung, historisch passend zu Norddeutschland um 1500.

## Teil 1: Kabinett komplettieren

**Neuer Aufbau**
- Eine Reihe pro Figur (z. B. „Schmied“, „Bäuerin“, „Schulze 40“, „Herold“, „Fürstlicher Bote“). Spalten sind die Situationen. Gibt es eine Situation für diese Figur im Spiel nicht, bleibt das Feld leer und ist als „kommt nicht vor“ markiert.
- Oben bleiben die Gruppen-Knöpfe (Schulzen, Hofstaat, Männer, Frauen, Kinder, Tiere). Dazu kommt ein Umschalter Tag / Nacht und Wetter (trocken, Regen, Sturm, Schnee).
- Ein Klick auf ein Feld öffnet wie bisher die große Ansicht mit Zoom und Pfeiltasten. Die Pfeile springen jetzt innerhalb der Reihe durch die Situationen.

**Was jetzt fehlt und dazukommt**
- Fürstlicher Bote zu Pferd: im Trab, wartend mit Siegelglanz, nachts mit Sattellaterne, wegreitend.
- Arbeitsbilder: Schmied am Amboss mit Funken, Mähen mit Sense und Sichel, Angeln, Bauen, Steinmetz, Holzfällen, Kräuter sammeln, Schulze im Gespräch.
- Lasten: Sack, Fass, Ballen, Kiste, Holz.
- Löscheimer: tragen und Wasser schleudern.
- Wetter: Lehnen gegen den Wind, Frostatem.
- Nacht: Wanderer und Schulze mit Hornlaterne.
- Feste und Sonderfiguren: Braut und Bräutigam im Zug, Sternsinger, Narren, Laternenumzug, Räuber, Wandergesellen, Händler mit Karren.
- Tiere ebenso in Reihen: Gehen, Weiden/Wühlen, Schlafen.

Wichtig: Das Kabinett ruft dieselben Zeichenwege auf wie das Spiel. Was dort richtig aussieht, sieht auch im Spiel richtig aus.

## Teil 2: Figuren konsolidieren

**Schritt A – Bestandsliste.** Mit dem neuen Kabinett jede Reihe durchgehen und notieren, welche Bilder noch alte Kleidung, falsche Blickrichtung oder andere Proportionen haben. Bekannt sind schon:
- Schmied beim Hämmern: kurze Hose, Schnallenschürze.
- Bäuerin beim Mähen: Ausschnitt und Mieder.
- Bauarbeiterin, Holzfällerin, Steinmetzin bei der Arbeit: alte Kleidung.
- Angler und Anglerin: moderne Angel.
- Beide Schulzen-Bilder: Weste bzw. Schankmaid-Mieder.
- Räuber (Pilger-Look), Fürstin (italienischer Kopfschmuck), Reitbote (Waldläufer-Umhang), Kleinkind (antike Tunika).
- Hofgärtner (Zink-Gießkanne), Stallknecht (Stahlgabel, Mütze).

**Schritt B – Eine Vorlage pro Figur.** Für jede Figur wird das schon gelungene Gehbild zur verbindlichen Vorlage: Kleidung, Farben, Kopfbedeckung, Größe. Alle anderen Bilder dieser Figur werden von dieser Vorlage aus neu gezeichnet, nicht frei neu erfunden.

**Schritt C – Neu zeichnen in Gruppen**, jeweils mit Prüfung im Kabinett vor der nächsten Gruppe:
1. Arbeitsbilder der Handwerker und Bauern (am häufigsten zu sehen).
2. Beide Schulzen in allen Altersstufen (Stehen, Reden, Gehen).
3. Räuber, Reitbote, Fürstin, Kleinkind, Gärtner, Stallknecht.
4. Fest- und Sonderfiguren.

**Feste Regeln für jedes neue Bild**
- Dreiviertelprofil nach rechts, Licht von links oben, gleiche Strichart.
- Gleiche Körpergröße und Fußlinie wie die Gehfigur.
- Werkzeug und Kleidung nach Norddeutschland um 1500 (Holzschaffel statt Gießkanne, Knüpfel und Meißel statt Spitzhacke, Wollkittel und Beinlinge statt Hose).
- Arbeitszyklen mit sauberen, gleichmäßigen Bildern, kein Springen zwischen Bildern.
- Keine Werkzeuge, die am Saum abgeschnitten werden.

## Technische Details
- `labEntries` in `render.ts` wird zu einer Liste von Figuren mit Situationen: `{ figure, group, situations: { stand, walk, work, carry, bucket, lantern, ... } }`. Jede Situation ruft die echte Spielfunktion auf (Figurenzeichnung mit erzwungener Pose: `working`, `carry`, `bucket`, Nacht, Wetter), statt eigene Lab-Kopien zu haben.
- Dafür bekommt die Figurenzeichnung einen kleinen Pose-Override (nur im Kabinett genutzt), damit Wetter/Nacht ohne die echte Uhr gesetzt werden können.
- `drawHerald` wird als Kabinett-Eintrag mit festen Phasen aufgenommen.
- `FigureLab.tsx`: Rasteransicht Reihe × Spalte, Tag/Nacht- und Wetter-Umschalter, Navigation in der Reihe.
- Neue Bilder ersetzen die alten Dateien unter `src/assets/sprites/folk` bzw. `court` mit gleichen Rastermaßen, damit `JOB_WORK` und die Rahmenzahlen gleich bleiben.
- Eine Regel in `src/assets/sprites/AGENTS.md`: Jede Figur hat ein Vorlagen-Gehbild, alle anderen Bilder richten sich danach; neue Situationen müssen im Kabinett auftauchen.
- Spiel-Logik, Tests und Werte bleiben unverändert; es ändert sich nur das Aussehen.

## Reihenfolge
1. Kabinett umbauen und alle Situationen samt fürstlichem Boten einbinden.
2. Gemeinsam durchschauen, Liste bestätigen.
3. Neuzeichnen in den Gruppen 1–4, nach jeder Gruppe kurze Sichtprüfung.
