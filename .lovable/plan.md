# Schritt 4: Sondergebäude der Gemeinschaft

Drei neue kaufbare Gebäude im Bau-Menü. Jedes hat eigenes Bild mit Nachtlicht, sichtbare Bewohner bei der Arbeit, Texte in allen 8 Sprachen und einen Eintrag in der Chronik. Bestehende Gebäude, Preise und Aufgaben bleiben unverändert.

## Block 1: Gemeindebackhaus (ab Dorf, 260 Taler)
- Freistehendes Backhaus mit Lehmkuppel-Ofen am Dorfplatz; Nachbarinnen mit Teigtrögen und Brotschiebern, Rauch an Backtagen.
- Wirkung: Die Haushalte brauchen weniger Feuerholz (der Holzbedarf in der Vorratskammer sinkt sichtbar). Der Getreideverbrauch sinkt um 10 %, weil gemeinsam gebacken wird. Dazu kommen +5 Gesundheit für den Zusammenhalt.
- Verbindung zur Allmende-Frage „Backtag“: Steht das Backhaus, stellen sich die Nachbarn dort an, nicht mehr an der Bäckerei. Bei Zustimmung entfällt der Preis von 10 Talern.

## Block 2: Gesellenherberge (ab Dorf, 420 Taler)
- Fachwerkherberge mit Zunftschild; Gesellen mit Charlottenhut und Stenz kommen über die Straßen an und übernachten hier.
- Wirkung: Gekaufte Bauten entstehen 15 % schneller (zusätzlich zu Holzfällerlager und Zunftrang). Wandergesellen kehren häufiger ein.
- „Neue Techniken“ sichtbar: Wenn ein Geselle in der Herberge ist, arbeitet er tagsüber mit auf einer Baustelle oder in der passenden Werkstatt. Eine kurze Zeile in der Chronik nennt das Tal, aus dem er kommt, und seinen Kniff (+5 Wohlstand, solange er da ist).

## Block 3: Beginenhof (ab Kleinstadt, 900 Taler)
- Ummauerter Hof mit kleinen Häusern, Kapelle, Kräutergarten, Brauhaus, Krankenstube und Webstube. Beginen sind sichtbar: Sie weben, brauen, pflegen und arbeiten im Kräutergarten.
- Wirkung: +15 Wohlstand und +10 Gesundheit. Kranke werden schneller gesund: Die Krankheitsdauer sinkt, und weniger Bewohner fallen aus.
- Die Beginen gehen als Pflegerinnen zu Kranken ins Haus, man sieht sie in den Gassen.

## Reihenfolge
1, 2, 3, jeweils mit Tests für Preise, Freischaltung und Boni.

## Technische Details
- Die Artikel kommen zu ITEMS/SPECIAL_KIND (economy.ts/world.ts), zu den Standortregeln in specialSites und zu den Jobzuordnungen in people.ts. Die Preise und Freischalt-Ären werden mit einer Migration im DB-`purchase_guard` gespiegelt.
- Backhaus: Die Holz- und Getreideregel steht in goods.ts (`larderOf`). Die Verbrauchsminderung ist nur Anzeige und Versorgung. Erst wird geprüft, ob Getreide in Steuern oder Haushaltskapazität einfließt; falls ja, kommt die DB-Spiegelung hinzu.
- Herberge: Sie kommt als Faktor in `specialBuild` (world.ts), rein abgeleitet. Häufigere Einkehr und Mitarbeit werden in wander.ts/people.ts aus Straße, Tag und Seed-ID berechnet und nicht gespeichert.
- Beginenhof: Er ändert `sickTaxRate` und die Krankheitsableitung in prosperity.ts/people.ts. Weil das Steuern beeinflusst, muss die DB-Funktion (`village_balance`-Kette) identisch mitgezogen werden, und zwar erst ab Kaufzeitpunkt, damit alte Guthaben unverändert bleiben.
- Neue Bilder sind 480px-WebP plus Nachtebene unter sprites/cohesive, im Stil der bestehenden Gebäude.
- Neue Regeln kommen in src/game/AGENTS.md, Preise in das Gebäude-Memo.
