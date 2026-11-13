# Funktionskonzept für die zehn Monumente (nur Konzept, keine Umsetzung)

## A. Verifizierter Ist-Zustand (aus dem Code gelesen)

- **Preise und Rang** (economy.ts `MONUMENTS`): Belfried R3 400/500/600/700, Tanzhaus (Theater) R3 500/700/900, Dom (Kathedrale) R4 800–1600 in 5 Stufen, Universität R4 700–1300, Schütting (Börse) R4 700–1300, Klostergarten (Orangerie) R4 500/700/900, Artushof (Oper) R5 1200–2100, Erntehalle/Zunftturm/Leuchtfeuer R3 450/600/750 (nur das eine Monument, das zum Weg des Dorfes passt).
- **Was tatsächlich wirkt:** Nur der Wohlstandsbonus `PRESTIGE_BONUS` (prosperity.ts) für die letzte Stufe, 6 h nach dem Kauf: Belfried +15, Tanzhaus +15, Dom +20, Universität +15, Schütting +20, Klostergarten +10, Artushof +25. Über `civicWealth` fließt er in die Steueranteile. Die drei Weg-Monumente fehlen dort.
- **Deckelung:** Die Steueranteile sind nach Rang begrenzt (`gatedEstateShares`: Kleinstadt höchstens 35 % Gesellen und 5 % Wohlhabende). Mehr Wohlstand bringt dort kaum mehr Steuer, und die Kasse läuft in der Kleinstadt ohnehin voll.
- **Was nur angezeigt wird:** Die Werte Nahrung, Gesundheit und Wohlstand je Monument in `attributes()`. Sie ändern weder die Krankheitsrate (`sickRate` liest nur Kräuterhütte, Heiler, Kultur-Charta und Beginenhof) noch die Zahl der Haushalte (`households.ts` zählt nur bestimmte Nahrungs- und Heilbauten). Feuer (`disasters.ts`) und Raubzüge lesen keine Monumente.
- **Vorstufen:** Ohne Nutzen. Sie bauen nur die Baustelle weiter (`monumentProgress`).
- **Sichtbar heute schon:** Jedes Monument hat eigene Arbeiter (people.ts: Türmer, Kaufleute, Kräuterfrauen usw.) und ein Einweihungsfest.

## B. Leitlinien des Konzepts

- Jedes Monument greift an genau **einem vorhandenen Stellhebel** in der Simulation an: Krankheitsrate, Feuer, Raubzüge, Bautempo, Kornspeicher, Handelsdeckel, Zuzug oder Pflege-Schwelle. Keine neue Geldquelle, keine neuen Systeme.
- Vorstufen bringen einen **kleinen Teilnutzen am selben Hebel**, die letzte Stufe den vollen. So lohnt sich das Ansparen, ohne dass eine Stufe zum Muss wird.
- Der Wohlstandsbonus bleibt, wie er ist. Er wird nicht erhöht, die Weg-Monumente bekommen keinen neuen Steuerbonus. So wächst der Geldüberschuss nicht weiter.
- Alles wird aus den Kaufzeilen und der Uhr abgeleitet und ist auf der Karte zu sehen (Memory-Regel „Was passiert, muss man sehen“).

## C. Konzepttabelle

| Monument (Rang) | Bisher | Neue Funktion (Art) | Wirkung, Größenordnung | Baustufen | Spielstil | Historisch | Technische Ansatzpunkte | Risiken |
|---|---|---|---|---|---|---|---|---|
| **Stadtturm/Belfried** (R3) | +15 Wohlstand, 400–700 | Türmer meldet Feuer und Räuber (Sicherheit) | Brand dauert 25 % kürzer, Raubzug-Fangchance +15 Prozentpunkte | 1–2: nur Feuer −10 %; 3: Feuer −25 %; 4: dazu Räuber | Vorsichtige, Gelegenheitsspieler | Türmer und Sturmglocke auf Stadttürmen sind gut belegt | `disasters.ts` Branddauer `burn`; `caught` in raidPlan | Raubverluste werden in der DB gespiegelt (`village_raids`), also SQL mitändern; mit Spritzenhaus begrenzen |
| **Tanzhaus** (R3) | +15 Wohlstand, 500–900 | Feste ziehen Leute an (Bevölkerung) | +1 neue Familie pro 10 Häuser innerhalb der Pflege-Schwelle (kein neuer Deckel) | 1: Proben (nur sichtbar); 2: halber Effekt; 3: voll | Dorfpfleger, Festefeierer | Tanz- und Hochzeitshäuser gab es in Städten wie Lübeck | `density.ts`/`households.ts` Familien je Haus | Mehr Haushalte heißt mehr Steuer. Nur bis zur bestehenden Obergrenze, sonst vergrößert es den Überschuss |
| **Erntehalle** (R3, Weg Korn) | Nur Anzeige, 450–750 | Kornvorrat und Winter (Versorgung) | Kornspeicher-Grenze +25 %, im Winter Krankheitsrate −0,01 | 1: Speicher +10 %; 2: +25 %; 3: dazu Winterbonus | Ebene, Kornkammer | Zehntscheunen und Kornhäuser | `goods.ts` `grainCap`; `sickRate` | Nur Versorgung, kein Geld |
| **Zunftturm** (R3, Weg Werkbank) | Nur Anzeige, 450–750 | Bauhütte (Bauwesen) | Gekaufte Bauten und Monumente bauen 15 % schneller | 1: 5 %; 2: 10 %; 3: 15 % | Hügel, Baumeister | Bauhütten an Stadttürmen und Domen | `specialBuild` (world.ts), dieselbe Kette wie Herberge und Holzfällerlager | Fertigstellungs-Briefe und Chronik gehen über `specialDone`/`monumentDone`, das bleibt einheitlich |
| **Leuchtfeuer** (R3, Weg Tor zur Welt) | Nur Anzeige, 450–750 | Sichere Wege übers Wasser (Handel) | Handelsdeckel +5 % Wachstum (`tradeCapOf`), dazu Hochwasser-Warnung: überflutete Kacheln trocknen 25 % schneller | 1: Hochwasser; 2: Deckel +3 %; 3: +5 % | Küste, Händler | Seezeichen und Feuerbaken an der Hansestraße (z. B. Travemünde) | `world.ts` `softTrade/tradeCapOf`; `disasters.ts` Flut-Dauer | Nur Wachstum, kein Geld; Obergrenze von 60 % bleibt |
| **Dom/Kathedrale** (R4) | +20 Wohlstand, 800–1600 | Pilgerort (Gesundheit, Pflege) | Zählt als ein Heilbau für die Pflege-Schwelle (`careStage`); Krankheitsrate −0,01 | 1–2: Bauhütte (sichtbar); 3: −0,005; 5: voll + Pflege-Schwelle | Langzeit-Aufbauer | Domkapitel mit Spital und Armenpflege | `world.ts` `CARE_HEALTH`, `sickRate` | Pflege-Schwelle beeinflusst Wachstum; genau prüfen, damit keine Stadt schrumpft |
| **Universität** (R4) | +15 Wohlstand, 700–1300 | Gelehrte und Ärzte (Gesundheit, Handwerk) | Krankheitsrate −0,015; Gesellen auf der Walz +25 % wahrscheinlicher | 2: Krankheit −0,005; 4: voll | Optimierer | Universität Rostock (1419), Greifswald (1456) | `sickRate`; `wander.ts` Gesellen (wie `HERBERGE_WALZ`) | Mit Heiler und Beginenhof zusammen: Untergrenze 0,01 beachten |
| **Schütting/Börse** (R4) | +20 Wohlstand, 700–1300 | Kaufmannsgilde (Handel) | Umweg-Handel über ein Zwischendorf von 75 % auf 85 % | 2: 80 %; 4: 85 % | Netzwerker, Straßenbauer | Schütting in Bremen und Lübeck als Sitz der Kaufleute | `world.ts` `TRANSIT_SHARE`/`hubRoutes` | Nur Wachstum; wirkt sich auf Nachbarn aus, mit Netzwerk-Test prüfen |
| **Klostergarten/Orangerie** (R4) | +10 Wohlstand, 500–900 | Heilkräuter (Gesundheit) | Krankheitsrate −0,01; zählt für die Pflege-Schwelle wie eine Kräuterhütte | 1: −0,005; 3: voll | Ruhige Spieler, Gesundheit | Klostergärten mit Heilkräuterbeeten | `sickRate`; `households.ts` Liste der Heilbauten | Steht neben Dom und Universität im selben Hebel; kleine Werte, Untergrenze beachten |
| **Artushof/Oper** (R5) | +25 Wohlstand, 1200–2100 | Festsaal der Hanse (Kultur, Ehre) | Einmal im Monat ein Bankett für Partnerdörfer: Handelsstraßen zu ihnen +10 % Wachstum, danach Freude im Dorf (wie bei einer Hochzeit) | 2: Feste nur sichtbar; 4: voll | Endspiel, Gemeinschaft | Artushof Danzig, Treffpunkt der Kaufleute | `world.ts` Bonus je Straße; `weddingJoy`-Muster in people.ts | Freude setzt die Krankheitsrate aus; Dauer kurz halten |

## D. Wechselwirkungen und Obergrenzen

- **Krankheitsrate:** Dom, Universität, Klostergarten und Erntehalle senken alle denselben Wert. Die Untergrenze von 0,01 bleibt bestehen, die einzelnen Beiträge bleiben klein (höchstens zusammen −0,045).
- **Haushalte und Steuer:** Nur Tanzhaus, Dom und Klostergarten (über die Pflege-Schwelle) berühren die Zahl der Einwohner. Das ändert die Steuer und muss in `resident-tax.ts` und den Simulationsläufen dasselbe Ergebnis liefern. Alle anderen Vorschläge wirken nur auf Wachstum, Sicherheit oder Versorgung.
- **Datenbank:** Nur der Belfried (Raubzug-Spiegel) braucht eine Änderung in SQL. Alles andere ist reine Ableitung im Spiel.
- **Kein Zwang zum Geldausgeben:** Die Kassen-Obergrenzen bleiben gleich. Monumente sind ein Angebot zum Ansparen, keine Pflicht.

## E. Priorisierung (die ersten drei)

1. **Zunftturm, Erntehalle, Leuchtfeuer als Paket.** Sie sind ab der Kleinstadt verfügbar, genau dort, wo die Simulation die Investitionslücke gezeigt hat, und haben heute gar keine echte Wirkung. Alle drei bekommen gleich starke Hebel, damit kein Weg bevorzugt wird.
2. **Belfried.** Erstes Monument für alle ab der Kleinstadt. Sicherheit ergänzt Spritzenhaus und Feuerordnung. Gut sichtbar (Türmer, Sturmglocke).
3. **Klostergarten.** Am billigsten von den Rang-4-Monumenten, aber mit dem schwächsten Nutzen. Ein kleiner, klarer Gesundheitseffekt schließt die Lücke ohne Geldwirkung.

Danach: Universität und Dom (Gesundheit/Pflege, mit genauer Steuerprüfung), zuletzt Tanzhaus und Artushof.

## F. Nächster Schritt nach Freigabe

Die drei priorisierten Vorschläge in der Wirtschaftssimulation (`src/game/simulation`) messen: Brandschäden, Bautempo, Wachstum und Krankheitsrate. Dabei Steuer und Kasse nachweislich unverändert lassen. Erst danach umsetzen.
