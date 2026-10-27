# Lebendige Dorfbewohner

## Was du sehen wirst
- Jedes Dorf hat Bewohner. Ihre Zahl wächst mit dem Dorf: Auf einem Hof leben 2–4 Menschen, in einer Kleinstadt viele Dutzend.
- Jeder Bewohner hat einen Namen, ein Alter, ein Geschlecht, ein Zuhause und einen Beruf, zum Beispiel Bäuerin, Bäcker, Schmied, Wirtin oder Müller. Kinder gehen zur Schule oder spielen, wenn das Dorf groß genug dafür ist.
- **Tagesablauf nach der echten Uhrzeit:**
  - Nachts schlafen alle, in den Fenstern ist Licht.
  - Morgens gehen die Leute aus dem Haus zur Arbeit: auf das Feld, in die Backstube oder in die Werkstatt.
  - Mittags gibt es eine Pause am Brunnen oder auf dem Dorfplatz.
  - Am Abend gehen viele ins Gasthaus oder auf den Markt, die Kinder spielen auf der Wiese.
  - Spätabends gehen alle nach Hause.
- **Gespräche:** Wenn sich zwei Bewohner begegnen, bleiben sie kurz stehen und drehen sich zueinander. Über ihnen erscheint eine kleine gezeichnete Sprechblase mit einem Symbol, zum Beispiel Brot, Wetter oder ein Herz.
- **Natürliche Bewegung:** Die Bewohner laufen über die Wege statt quer durch Häuser. Arme und Beine schwingen beim Gehen, und jeder hat ein leicht anderes Tempo. Kinder laufen schneller und hüpfen auch mal. Ältere gehen langsam, manche mit Stock. Auf dem Feld wird gehackt und geerntet.
- **Aussehen:** Die Figuren haben natürliche Proportionen und werden scharf und in hoher Auflösung gezeichnet, im handgezeichneten Tinten- und Aquarellstil der Karte. Verschiedene Kleidung, Haarfarben und Hüte. Kinder sind kleiner. Mit jeder Zoomstufe sieht man mehr Details.
- **Kennenlernen:** Ein Klick auf eine Figur öffnet ein kleines Kärtchen, zum Beispiel: „Greta Hollmann, 34, Bäuerin, wohnt am Brunnenweg – gerade auf dem Feld.“ Alles gibt es auf Deutsch und Englisch.

## Was gleich bleibt
- Alle Spieler sehen dieselben Menschen am selben Ort, auch wenn niemand zuschaut. Es wird nichts gespeichert, alles wird aus dem Samen und der Uhrzeit berechnet.
- Figuren werden nur gezeichnet, wenn ihr Dorf im Bild ist und man weit genug hineingezoomt hat. So bleibt das Spiel flüssig.

## Technische Details
- New `src/game/people.ts` (pure, deterministic): `residentsOf(seed, seeds, now)` derives residents from houses returned by `structureAt` (house tile + hash → name from de/en-neutral name pools, sex, age, birth tied to the building's birth time, job from nearby workplace kinds). `scheduleAt(person, now)` → activity + target tile from local time; `positionAt(person, now)` walks a deterministic route over path/street tiles (BFS on the town's path grid, cached per town per minute) with smoothing like `smoothRoad`. Conversations: residents at the same meeting point in the same time slot are paired by hash, so they meet at exactly the same moment on every client.
- `src/game/render.ts`: `drawPerson(c, p, pose, t)` with a jointed skeleton (hip/knee/shoulder angles from a walk-cycle phase), age-scaled proportions, clothing/hair palettes, idle, work and talk poses, and speech bubbles. Level of detail by zoom: a dot, then a simple figure, then the full figure. Figures are depth-sorted together with buildings.
- `src/components/Game.tsx`: clicking a figure picks the nearest one and shows an info card. Strings go in `i18n.ts` (jobs, activities, card labels).
- Tests in `src/game/people.test.ts`: the same seed and time always give the same residents, nobody walks at night, and children have no adult job.
- AGENTS.md: a new rule that residents are a pure function of seed, buildings and time.
