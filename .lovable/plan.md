# Pacing über 2 Jahre: Von der Hütte zur Metropole

## Was du sehen wirst

Jedes Dorf durchläuft sechs Stufen. Am Anfang geht es schnell, danach immer langsamer, aber es hört nie ganz auf. Auch nach einem Jahr kommt noch Neues dazu.

| Alter | Stufe | Was entsteht |
| :--- | :--- | :--- |
| 0–24 Std. | Der Ursprung | Lagerfeuer, Brunnen, 1–2 Hütten, kleiner Gemüsegarten. Die ersten Dinge erscheinen schon nach Minuten. |
| Tag 2–7 | Der Weiler | Bauernhäuser, Zäune, Hühner, erste Feldwege, kleine Scheunen |
| Woche 2 bis Monat 3 | Das Dorf | Dorfplatz, Schenke, Kapelle, Wassermühle am Fluss, mehr Felder |
| Monat 3–6 | Die Kleinstadt | Marktplatz mit Buden, gepflasterte Hauptstraße, Fischerhafen am Wasser, Handwerker |
| Monat 6–12 | Die Handelsstadt | Eigene Viertel (Handwerk, Wohnen, Markt), Kirche mit Turm, Rathaus, Brücken, Alleen, dichte Häuserreihen |
| ab Jahr 2 | Die Metropole | Manufakturen, Dampfmaschinen, Schienen zu Nachbarstädten, weite Vororte, dichte Altstadt |

- **Wachstumskurve:** Die Fläche wächst am Anfang schnell und später langsamer. Mit der Zeit wird die Stadt vor allem dichter: Hütten werden zu Bauernhäusern, Bauernhäuser zu Stadthäusern und Felder im Inneren zu Gassen. Nach zwei Jahren ist eine Stadt etwa 40–45 Felder groß, heute wären es rechnerisch über 60.
- **Ortslage zählt:** Wassermühle, Hafen und Brücken entstehen nur dort, wo Fluss oder Küste in der Nähe sind. Ohne Wasser kommen andere Gebäude, zum Beispiel ein zweiter Markt oder eine Windmühle. Schienen gibt es nur zwischen Städten, die beide mindestens das Industriezeitalter erreicht haben.
- **Handelsbonus bleibt:** Verbundene Dörfer werden schneller älter und erreichen die Stufen früher, so wie jetzt schon.

## Jahreszeiten nach echtem Kalender
- **Winter (Dez–Feb):** Schnee auf Dächern, Wiesen und Bäumen, das Wasser ist dunkler und die Felder liegen brach.
- **Frühling (Mär–Mai):** blühende Wiesen und helle, frische Grüntöne, Obstbäume blühen.
- **Sommer (Jun–Aug):** wie heute, die Felder werden reif.
- **Herbst (Sep–Nov):** Laubwälder in Gelb, Orange und Rot, Felder abgeerntet, Heuhaufen.
- Die Übergänge laufen über etwa zwei Wochen weich ineinander. Alle Spieler sehen dieselbe Jahreszeit.
- Die Jahreszeit richtet sich nach der Nordhalbkugel. Eine Jahreszeit für die Südhalbkugel ist nicht vorgesehen.

## Neue Bilder im bisherigen detaillierten Stil
Lagerfeuer, Hütte, Hühnerstall mit Zaun, Kapelle, Wassermühle, Fischerhafen mit Steg, Marktbuden, Rathaus, Manufaktur, Dampfmaschinenhalle, Bahnhof, Vorort-Haus. Dazu Schienen und Alleebäume als Bodenbilder.

## Hinweis zu den Beispieldörfern
Weil die Stufen neu verteilt werden, rutschen die vorhandenen Dörfer eine Stufe tiefer. Moosbach ist zum Beispiel nach 20 Tagen dann ein Dorf und keine Kleinstadt mehr. Das ist so gewollt.

## Technische Details
- `src/game/world.ts`: `STAGES` becomes 6 entries (0, 24 h, 168 h, 2160 h, 4380 h, 8760 h); `stageOf` reads from that table. The new `radiusOf(h)` is a log/sqrt blend capped near 45 tiles at 17 520 h, and `birthAt` is its exact inverse. The building tables per stage get new kinds (`campfire`, `hut`, `coop`, `fence`, `chapel`, `watermill`, `harbor`, `stall`, `townhall`, `manufactory`, `steamworks`, `station`, `suburb`, `rail`, `avenue`). Placement depends on terrain: `watermill` and `harbor` need water within 3 tiles. Densification is a deterministic rebuild by tile age (hut → farmhouse → townhouse). Districts come from the hash plus the angle sector around the centre. Everything stays a pure function of seed and time (AGENTS.md rule).
- Rails are derived in `links()` once both towns are at stage 5 or higher, reusing `smoothRoad` points and rendered as a separate ground layer.
- New `src/game/season.ts`: `seasonAt(now)` returns weights for winter, spring, summer and autumn from the UTC calendar date, with smooth crossfades. It is a pure function and is unit-tested.
- Rendering:
  - Snow and autumn are cached recoloured copies of the sprite images (offscreen canvas, built once per season and kind). For snow, a white overlay is applied to the upper surfaces.
  - Terrain textures are tinted per season.
  - The overview map gets one cached version per season.
- `src/game/i18n.ts`: names for the six stages, the new buildings and the seasons (de/en).
- Tests: stage thresholds, monotonic radius, the 2-year radius cap, rails only between stage-5 towns, harbor only near water, and season boundaries.
- Images are generated as small WebP files like the existing sprites.
