# Doppelstädte: Regeln für zusammenwachsende Spielerstädte

Bisher erkennt das Spiel nur, wann sich die Ränder zweier Städte berühren. Dann zeigt es ein Band „A ∞ B“ und den Hinweis „Zwillingsstadt mit …“. Dieser Plan legt fest, was danach passiert, und zwar in drei Stufen: Optik, Wirtschaft und Zusammenarbeit der Spieler.

## Grundregeln
- Zwei Städte verschmelzen, wenn sich ihre Ränder berühren. Das passiert für alle Spieler zur selben Zeit und muss nicht gespeichert werden.
- Jede Stadt behält ihren Namen, ihren Besitzer, ihre Kasse und ihre Charta. Niemand verliert etwas.
- Gebäude wachsen nie in die andere Stadt hinein. Die Grenze liegt in der Mitte zwischen den beiden Stadtkernen.
- Wächst eine dritte Stadt dazu, entsteht ein Städtebund. Dafür gelten dieselben Regeln für jedes Paar.

## 1. Sichtbares Zusammenwachsen
- **Gemeinsame Hauptstraße:** Die Handelsstraße zwischen beiden Städten wird gepflastert und von Häusern gesäumt.
- **Doppeltor:** An der Grenze steht ein Stadttor mit den Farben beider Städte. Ein Klick darauf zeigt Infos zur Doppelstadt.
- **Stadtgrenze:** Ein Grenzstein oder Brunnenplatz an der Grenze. Das Band „A ∞ B“ bleibt als Beschriftung.
- **Gemeinsamer Markttag:** Einmal pro Woche, nach der gemeinsamen Weltuhr, stehen Marktstände am Tor. Dort sind dann mehr Menschen unterwegs.

## 2. Wirtschaft
- **Doppelstadt-Bonus:** Beide Städte bekommen zusätzlich +10 % Wachstum. Die bestehende Obergrenze für Handelsboni gilt weiter.
- **Geteilte Gebäude:** Brunnen, Heiler, Schule und Kirche der einen Stadt zählen in der Nachbarstadt halb mit. Ein Heiler hilft dann zum Beispiel auch den Nachbarn.
- **Kurze Wege:** Waren werden direkt von Werkstatt zu Werkstatt getragen und nicht mehr über die Landstraße gefahren. Man sieht dann Träger statt Fuhrwerke.
- **Taler bleiben getrennt:** Jede Stadt erhält weiter 1 Taler pro eigenem Bürger.

## 3. Zusammenarbeit der Spieler
- **Bund besiegeln:** Beim ersten Zusammenwachsen öffnet sich für beide Spieler ein Pergament. Jeder wählt einen Bund:
  - **Handelsbund:** +10 % zusätzlicher Handelsbonus
  - **Schutzbund:** Gesundheit und Vitalität steigen leicht
  - **Kulturbund:** Feste und Begegnungen bringen mehr
  Wählen beide denselben Bund, gilt er. Wählen sie verschiedene, wird erneut gefragt, und das Pergament zeigt die Wahl des anderen. Wer 7 Tage nicht antwortet, übernimmt die Wahl des Partners.
- **Gemeinsames Bauwerk:** Wenn der Bund steht, kann eine Doppelstadt-Brücke, ein Markthaus oder ein Turm gebaut werden. Beide Spieler zahlen je die Hälfte, egal in welcher Reihenfolge. Die Baustelle beginnt erst, wenn beide Anteile bezahlt sind.
- **Zwillingsfest:** Einmal im Monat an einem festen Tag (Weltuhr). Wenn beide Spieler an diesem Tag ihren Dorfsegen geben, erhalten beide einen doppelten Segen.
- **Herrenlose Städte:** Für Beispiel-Dörfer ohne Spieler stimmt das Spiel selbst ab. So können Spieler auch mit ihnen einen Bund schließen.

## Reihenfolge
1. Regeln und Grenze in der Spiellogik, dazu Tests
2. Tor, Straße, Grenzstein und Markttag sichtbar machen
3. Wirtschaftsboni und geteilte Gebäude
4. Bund-Pergament mit Abstimmung
5. Gemeinsames Bauwerk und Zwillingsfest
6. Texte auf Deutsch und Englisch, Inspektor-Anzeige, Abschlusstest im Browser

## Technische Details
- `world.ts`: `twinPairs(seeds, now)` sowie `twinSince(link)` (berechnet aus den Wachstumskurven, wann sich die Radien berühren) und `border(link)` als Mittellinie. Die Platzierung von Gebäuden lässt alles jenseits der Grenze aus. `effAge` multipliziert pauschal mit dem Zwillingsfaktor plus dem Bund-Faktor, begrenzt durch die vorhandene Obergrenze.
- Geteilte Gebäude: `sharedServices(seed)` liest die Strukturen des Partners innerhalb der Grenzlinie und nutzt sie in der Vitalität (`people.ts`) mit dem Gewicht 0,5.
- Markttag und Fest werden aus der Realm-Uhr in `time.ts` abgeleitet (Wochentag oder Tag im Monat plus Hash des Paares).
- Datenbank: Tabelle `twin_pacts` (seed_a, seed_b, Wahl a/b, Zeitpunkt der Einigung) und `twin_works` (pact, Art, bezahlt_a, bezahlt_b). RLS: nur die Besitzer der beteiligten Städte dürfen ihre eigene Seite schreiben. Ein DB-Trigger prüft die Kosten und zieht sie von der Kasse ab, wie bei Käufen. Die Einigung setzt ein Trigger, wenn beide Wahlen übereinstimmen. Die automatische Annahme nach 7 Tagen und die Wahl der Beispiel-Dörfer werden rein abgeleitet: für Beispiel-Dörfer per Hash, sonst die Wahl des Partners.
- Das Bund-Pergament läuft über die vorhandene Entscheidungs-Warteschlange (Popup, Wachssiegel).
- Tests: Grenze, Bonusobergrenze, Teilung der Gebäude, Ableitung der Einigung, Kostenschutz.
