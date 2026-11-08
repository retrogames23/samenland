# Patrizierhaus als mehrstöckiger Schaukasten (Puppenhaus-Querschnitt)

## Ziel
Ein Blick mit der Lupe in ein Patrizier-/Kaufmannshaus zeigt einen senkrechten Schnitt durch das ganze Treppengiebelhaus – passend zum Kartenbild, in drei Baustilen (Ebene/Fachwerk-Backstein, Hügelland/Bruchstein, Küste/Backstein-Treppengiebel).

## Aufbau des Hauses (Norddeutschland um 1500)
```text
  /\        Speicherböden (2 Etagen): Säcke, Ballen, Kranwinde am Giebel
 /  \
|----|      Obergeschoss: Kemnade (Schlafkammer, Himmelbett/Butzen, Truhe)
|----|      Dornse (beheizte Stube, Kachelofen, Tisch, Zinngeschirr)
|____|      Hohe Diele: Tor zur Gasse, Kontor (Pult, Waage, Geldkiste), offener Herd
```
Nachbarhäuser links und rechts nur angeschnitten (Reihenbebauung), Gasse mit Pflaster davor – kein Rasen, kein Wald.

## Wer ist wo
- **Kemnade (oben):** Schlafende und Kranke, Kleinkinder im Kinderbett.
- **Dornse (Mitte):** Mahlzeiten am Tisch, Altenteiler am Kachelofen.
- **Diele (unten):** Kochen am Herd; tagsüber zusätzlich ein Kaufmann/eine Kauffrau am Kontorpult, wenn er/sie laut Tagesablauf zu Hause ist.
- Wer auf der Karte unterwegs ist, fehlt wie bisher (Kriterium 3).

## Darstellung
- Hochformat-Bild (ca. 1024×1536) je Baustil; das Fenster zeigt es so hoch wie möglich, auf dem Handy mit sanftem senkrechtem Ziehen/Scrollen zwischen den Etagen.
- Nachts leuchten Kerzen/Ofen je Etage, sonst gleiche Abdunklung wie in den anderen Stuben.
- Vorhandene Figuren und ihre Bewegungen (Löffel, Kelle, Atmen) werden wiederverwendet; neu ist nur eine Figur „am Pult schreibend“ (zwei Haltungen, Feder zum Buch).

## Schritte
1. Drei neue Hochformat-Bilder erzeugen (je Baustil, mit Kartenbild als Vorlage), auf alle 5 Kriterien prüfen; die bisherigen falschen Patrizier-Bilder ersetzen.
2. Pult-Figur (Mann/Frau) in zwei Haltungen malen.
3. Platzzuordnung pro Etage im Schaukasten ergänzen; Bauernhaus, Hütte, Handwerker bleiben unverändert.
4. Hochformat-Anzeige mit Etagen-Scrollen im Schaukasten-Fenster.
5. Texte in 8 Sprachen (Etagennamen, Hinweise), Tests für die Etagenzuordnung, Sichtprüfung im Browser (Handy-Format).

## Technische Details
- `Stube.tsx`: Raumdaten bekommen eigene Slot-Koordinaten und Seitenverhältnis je Hausart (`ROOMS.patrician` mit `layout: "tall"`); Canvas-Höhe folgt dem Bild, Container mit `overflow-y: auto`.
- `stube.ts`: neue Slot-Art `desk` (1 Platz, nur 8–17 Uhr Realm-Zeit, Erwachsener des Hauses); `STUBE_SLOTS` je Hausart statt global, Standard unverändert.
- Neue Sprites unter `src/assets/sprites/stube/` als WebP; alte `patrician-room*.webp`/PNG entfernen.
- `lang/stube.ts`: Etagennamen (Diele, Dornse, Kemnade, Speicher) in 8 Sprachen.
- `stube.test.ts`: Schläfer → oben, Esser → Mitte, Pult nur tagsüber.
