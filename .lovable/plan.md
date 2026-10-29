# Freie Jagd & Tierwelt

## Ziel
Rehe und Wildschweine leben frei im Umland der Jagdhütte, nie auf Dächern oder Wegen. Der Jäger zieht los, pirscht sich an, erlegt ein Tier und trägt es sichtbar heim.

## Was sich für den Spieler ändert
1. **Wild im Umland:** Rund um jede Jagdhütte (Umkreis ca. 6–10 Kacheln) leben 2–3 Tiere auf freien Wald-, Lichtungs- und Wiesenkacheln. Gebäude, Baustellen, Straßen, Felder, Weiden und Wasser sind tabu.
2. **Natürliche Bewegung:** Die Tiere ziehen gemächlich von Kachel zu Kachel (nur über freie Kacheln), bleiben stehen, grasen (Reh) oder wühlen (Wildschwein). Nachts ziehen sie sich zurück.
3. **Pirsch:** In jedem Jagdzyklus (ca. 11 Minuten) bricht der Jäger an der Hütte auf und geht querfeldein zu einem der Tiere. Kurz davor kniet er in Deckung und zielt.
4. **Schuss & Flucht:** Ein Bolzen fliegt, das Reh bricht zusammen. Die anderen Tiere fliehen ins Unterholz und tauchen später wieder auf.
5. **Heimtragen:** Der Jäger schultert das Reh (vorhandenes Sprite) und trägt es zurück zur Hütte.
6. Auf Waldkacheln fern von Hütten bleibt das bisherige freie Wild wie gehabt, darf aber ebenfalls nur auf unbebauten Naturkacheln stehen.

Alles wird wie bisher rein aus Hüttenposition und Weltuhr abgeleitet – alle Spieler sehen dieselbe Jagd, nichts wird gespeichert.

## Technische Details
- Neues reines Modul `src/game/wildlife.ts`:
  - `freeTile(x, y, seeds, now)`: Terrain forest/meadow/clearing, keine Struktur (`structureAt`), keine Straße, kein Wasser.
  - `huntGrounds(lodge)`: deterministische Liste freier Kacheln im Umkreis (Hash auf Hütten-Seed), gecacht mit Seed-Positionen + createdAt.
  - `herdAt(lodge, now)`: pro Tier Weg aus Kachelstationen (Hash pro Zeitfenster), interpoliert; Zustand walk/graze/root/flee.
  - `huntPhase(lodge, now)`: Phasen idle → aufbrechen → pirschen → knien/zielen → Schuss → Beute aufheben → heimtragen; Ziel = nächstes Reh zum Pirschbeginn.
- `render.ts`: `drawHunt` an der Hütte entfällt; Tiere und Jäger werden auf ihren Weltkacheln mit Tiefensortierung gezeichnet (wie Dorfbewohner/Schafe), damit sie nicht über Dächern erscheinen. `drawWild` erhält denselben Bodencheck.
- Bestehende Sprites (deer-walk, deer-graze, boar-walk, hunter mit Beute) werden weiterverwendet; keine neuen Grafiken.
- Tests `wildlife.test.ts`: Tiere stehen nie auf bebauten/Straßen/Wasser-Kacheln über viele Zeitpunkte; gleiche Eingabe → gleiche Positionen; Jäger startet und endet an der Hütte.
