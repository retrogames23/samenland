# Feiertage Etappe 2: Festtags-Figuren auf der Karte

Was im Fest-Pergament steht, sieht man jetzt auch auf den Straßen. Vier Feste bekommen eigene, echt animierte Figuren, die alle Spieler auf derselben Karte gleich sehen.

## Die vier Szenen

1. **Dreikönig: Sternsinger**
   Drei Kinder in Umhängen, eines trägt einen Stern an der Stange. Sie gehen tagsüber (ca. 10–16 Uhr) von Haustür zu Haustür, bleiben kurz stehen und ziehen weiter. Nachts wieder daheim.
2. **Fastelabend: Narrenläufer**
   Ab dem Nachmittag springen zwei bis vier Bewohner mit Fratzenmaske und Schellenkappe zwischen Platz und Gassen hin und her (statt nur auf dem Platz zu stehen). Das passt zu ihrem schon bestehenden Feierabend-Ablauf.
3. **Pfingsten: Pfingstochse**
   Ein mit Birkengrün und Bändern geschmückter Ochse wird vom Hirten einmal am Vormittag durchs Dorf zum Maibaum geführt und steht danach dort.
4. **Martinstag: Sankt Martin zu Pferd**
   Ein Reiter mit rotem Mantel reitet mittags zur Kirche und hält dort an. Kinder folgen ihm; am Abend Laternen (kleine Lichter, die nachts leuchten).

Alles erscheint nur, wenn das Dorf groß genug ist (Kirche oder Kapelle für Martin, Kinder im Ort für die Sternsinger). Neue Bewohner-Sprüche zu den Figuren in allen 8 Sprachen.

## Was gleich bleibt
Einwohner, Steuern, Wachstum und Begegnungen ändern sich nicht. Nichts wird gespeichert.

## Technische Details
- Figuren entstehen rein aus `feastOn(now)` + Weltuhr + Seed-Hash (neue Datei `src/game/feast-walkers.ts`), keine Datenbank.
- Sternsinger und Narren: Varianten der bestehenden Bewohner-Tagesläufe in `people.ts` (Kinder-/Erwachsenen-Schedules mit Tür-Stationen); Stern, Maske, Schellen und Laternen als Zusätze in `figure.ts`, Kostümfarben im painted-Stil.
- Pfingstochse: Rinder-Laufzyklus aus den vorhandenen Kühen mit Grün-/Band-Überzug; Martin: vorhandenes Ritterpferd-Sprite mit rotem Mantel.
- Zeichnen im Kachel-Tiefenpass (Verdeckungsregel), Martin als Schlüsselfigur zusätzlich mit Pergament-Silhouette.
- Sprüche in `lang/banter-feast.ts`; neuer Test `feast-walkers.test.ts` (Figuren nur am richtigen Tag/zur richtigen Stunde, gleiche Positionen bei gleichem Zeitpunkt).
- Prüfung per Screenshot je Fest mit simulierter Uhrzeit.
