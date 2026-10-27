# Komplementärer Handel und Warenströme

## Ziel
Handel zwischen Dörfern soll sichtbar sein und sich lohnen, wenn die Dörfer **verschieden** sind. Ein Bergdorf und ein Bauerndorf ergänzen sich, zwei Bauerndörfer viel weniger. Wie bisher wird nichts gespeichert. Alles folgt aus der Lage der Dörfer, ihrem Alter und der Uhrzeit, deshalb sehen alle Spieler dasselbe.

## Was die Spieler sehen
1. **Jedes Dorf hat Waren zum Verkaufen und Waren, die ihm fehlen.** Das hängt von der Landschaft ab:

| Charakter | Verkauft | Braucht |
|---|---|---|
| Ackerland | Getreide, Wolle | Holz, Erz |
| Bergland | Stein, Erz/Eisen | Getreide, Fisch |
| Küste | Fisch, Salz | Holz, Getreide |
| Wald | Holz, Wild/Leder | Salz, Stein |

   Ab den späteren Stufen kommen veredelte Waren hinzu: Tuch aus der Tuchhalle, Eisenwaren aus dem Hammerwerk und Bier aus dem Gasthaus.
2. **Der Bonus richtet sich danach, wie gut die Dörfer zusammenpassen.** Zum heutigen Straßenbonus (+10 bis 25 %) kommt ein Faktor dazu, der zählt, wie viele Waren das eine Dorf liefert, die dem anderen fehlen. Bei gleichem Charakter sinkt der Bonus auf etwa 60 %, bei perfekter Ergänzung steigt er auf etwa 150 %. Nach oben bleibt er gedeckelt, damit das Spiel über zwei Jahre im Takt bleibt.
3. **Händler fahren mit Fuhrwerken über die Straßen.** Auf jeder fertigen Straße pendeln Ochsenkarren oder Kiepenträger. Ihre Ladung kann man erkennen, zum Beispiel Holzstämme, Säcke, Fässer oder Steine. Wie viele fahren, hängt von der Größe beider Dörfer ab. Ihre Fahrzeiten folgen der gemeinsamen Weltuhr, nachts ruhen sie. Wo eine Straße über Wasser führt, fährt ein kleiner Lastkahn.
4. **Waren kommen im Dorf an.** Die Händler fahren zum Marktplatz oder zum Kontor. Dort laden einheimische Träger um, die schon heute im Dorf Waren tragen, und bringen die fremden Waren zu den passenden Gebäuden: Erz zur Schmiede, Getreide zur Mühle, Holz zur Baustelle.
5. **Infos zum Handel:** Ein Klick auf ein Dorf zeigt neu „Exportiert / Importiert / Handelspartner“ samt Bonus pro Partner. Ein Klick auf einen Händler zeigt seine Ladung, woher er kommt und wohin er fährt. Ist ein Dorf noch nicht an einen passenden Partner angebunden, steht dort ein Hinweis: „Euch fehlt Holz. Ein Walddorf im Nordosten könnte liefern.“
6. **Spätere Stufen:** Ab Stufe 5 stärkt das Hansekontor die Fernhandelsstraßen eines Dorfs um weitere Prozente. Die Händler-Charta hebt die Grenze für den Bonus an.

## Was gleich bleibt
- Es gibt keine Lagerbestände, keine Preise und keinen Server-Takt. Auch die Datenbank ändert sich nicht.
- Das Wachstum ist weiterhin eine reine Rechnung. Das effektive Alter steigt nur mit dem neuen Faktor, und das deterministisch.
- Die Straßenwahl (erste Straße frei wählbar, alle weiteren automatisch) bleibt unverändert.

## Technische Details
- `world.ts`: neue Funktion `tradeProfile(seed, age)` → `{ exports: Good[], imports: Good[] }` aus `characterOf` und der Stufe. Neue Funktion `complement(a, b, now)` → 0.6..1.5. `bonusOf` bekommt die Ergänzung als Faktor, verwendet in `speedOf` **und** `effAge` (müssen identisch bleiben). Eine harte Obergrenze verhindert, dass das Tempo davonläuft. Die Caches hängen an den Seed-Daten wie bisher.
- `people.ts` oder neues `traders.ts`: Händler als reine Funktion von (Link, Stunde, Index). Die Position entlang `link.tiles` ergibt sich als Uhr-Zyklus aus `time.ts` (Europe/Berlin), die Ladung aus den Exporten des Startdorfs. Beim Umladen bekommen bestehende Träger als `Haul`-Ziel den Markt bzw. das Kontor.
- `Good` wird erweitert um `ore | fish | salt | wool | cloth | ironware | beer`. Die Ladungen werden als kleine Sprites gemalt, der Karren als neues Sprite im gleichen Stil (realistisch-isometrisch).
- `render.ts`: Händler zeichnen, mit Tiefensortierung wie bei den Dorfbewohnern. Auf Wasserkacheln wird ein Kahn gezeichnet.
- `Game.tsx`/Inspektor: Handelsbereich und Händler-Info. Alle Texte stehen in `i18n.ts` (de/en).
- Tests: Die Werte für die Ergänzung (gleicher Charakter 0.6, perfekte Ergänzung 1.5), dieselben Händlerpositionen unabhängig von der Zeitzone, und `speedOf`/`effAge` müssen zusammenpassen.

## Reihenfolge
1. Handelsprofil und Bonus mit Ergänzung, dazu die Tests.
2. Händler auf den Straßen, mit Sprites.
3. Umladen auf die Dorfträger.
4. Handelsinfos im Inspektor und Hinweise.
5. Kontor-Bonus und Abstimmung mit der Händler-Charta.
