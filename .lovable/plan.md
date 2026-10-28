# Lebendige Nachbarschaft ohne Konkurrenz

Ziel: Junge Dörfer holen spürbar auf, Nachbarn begegnen sich sichtbar, und es entstehen gemeinsame Geschichten. Es gibt weiterhin keinen Druck, kein Verlieren und kein Abwerben. Alles bleibt für alle Spieler gleich, weil es aus Samen und Weltuhr berechnet wird.

Wir bauen in vier Blöcken. Jeder Block ist für sich spielbar und wird getestet, bevor der nächste beginnt.

## Block 1: Junge Dörfer wachsen schneller (Wachstumskurve)
- Das Wachstum folgt einer S-Kurve: Ein junges Dorf startet schnell, ein Dorf mittleren Alters wächst gleichmäßig, eine alte Stadt geht in eine würdige Reifephase über (mehr Pracht, weniger neue Häuser).
- Mentorbonus: Ein junges Dorf in der Nähe einer älteren Stadt wächst etwas schneller, z. B. durch Wissen, Werkzeuge oder Siedler. Dadurch profitiert die alte Stadt davon, dass der Nachbar aufblüht.
- Das Ziel von etwa zwei Jahren bis zur Metropole bleibt. Wer spät einsteigt, schließt in etwa 12 bis 15 Monaten auf die Reifestufe der Älteren auf.
- Die Chronik meldet es, wenn der Mentor hilft.

## Block 2: Menschen zwischen den Dörfern
- **Wandergesellen:** Handwerker ziehen sichtbar auf der Straße von Dorf zu Dorf, bleiben einige Tage und ziehen dann weiter. Ein Gesellen-Besuch gibt einen kleinen Bonus auf das jeweilige Handwerk.
- **Fern-Hochzeiten:** Hochzeiten zwischen Bewohnern benachbarter Dörfer. Es gibt einen sichtbaren Brautzug über die Straße, die Mitgift geht an beide Kassen, und die Verwandtschaft über Dorfgrenzen hinweg erscheint im Inspektor.
- **Umzug aus Gründen statt Abwerbung:** Gelegentlich zieht eine Familie um, zum Beispiel wegen einer Hochzeit, wegen Arbeit in einem Handwerk, das es nur dort gibt, oder nach einem Brand. Das Herkunftsdorf verliert dabei nichts dauerhaft, denn das Haus wird von Nachrückern wieder bezogen.
- **Boten:** Sichtbare Boten bringen Grüße und Ereignisse ins Nachbardorf. Die Nachrichten erscheinen in der Chronik.

## Block 3: Echte Gesten unter Nachbarn
Damit wird der automatische Handel persönlicher, wieder ohne Pflicht:
- **Geschenke:** Ein Spieler schickt einem Nachbarn Taler oder eine Warenlieferung, und ein Karren fährt sichtbar los. Pro Tag ist ein Geschenk möglich, die Datenbank prüft das.
- **Hilfe nach Katastrophen:** Nach einem Brand, einer Flut oder einem Überfall können Nachbarn Hilfe schicken. Der Wiederaufbau geht dann schneller, und die Hilfe steht in beiden Chroniken.
- **Dankesbriefe:** Der Empfänger kann einen kurzen, vorgefertigten Dank zurückschicken, der auf Pergament erscheint.

## Block 4: Gemeinsame Werke auf halber Strecke
- Zwischen zwei Dörfern, die durch eine Straße verbunden sind, können Gemeinschaftsprojekte entstehen: Brücke, Gasthaus am Weg, Kloster und Markt-Kreuzung.
- Beide Dörfer zahlen je die Hälfte, ähnlich wie bei den Zwillingsstadt-Werken. Die Baustelle ist sichtbar, und die Arbeiter kommen aus beiden Orten.
- Jedes fertige Werk gibt beiden Dörfern einen Bonus: Die Brücke beschleunigt den Handel, das Gasthaus zieht mehr Wandergesellen an, das Kloster stärkt die Gesundheit, und der Markt erhöht den Wohlstand.
- Die Fertigstellung wird mit einem Pergament samt Illustration gefeiert.

## Technische Details
- Block 1: Eine neue Pace-Kurve für `effAge` in world.ts (S-Kurve plus Mentor-Faktor aus Nachbarn, die älter sind und innerhalb der Handelsreichweite liegen). Die Tests werden auf die Zielmarken aktualisiert; die Testkarte prüft den Verlauf vom Dorf bis zur Metropole.
- Block 2: Neues Modul `src/game/wanderers.ts` (Kalender aus Samenpaar und UTC-Tag, rein und ohne Speicher). Fern-Hochzeiten erweitern weddings.ts und people.ts. Die DB-Mitgift wird für beide Dörfer gespiegelt. Bewegung auf Straßen über motion.ts, neue gemalte Sprites für Geselle und Bote.
- Block 3: Neue Tabelle `gifts` (from_seed, to_seed, kind, amount, created_at) mit RLS auf auth.uid(), einem Trigger für das Tageslimit und einer Kassenprüfung. Die Tabelle fließt in `village_balance` ein, die Karren-Animation wird aus den Geschenk-Zeilen abgeleitet.
- Block 4: Tabellen nach dem Muster von `twin_works` (Stimmen und Hälfte-Zahlung über einen DB-Guard). Der Bauplatz wird in world.ts aus dem Straßenmittelpunkt abgeleitet, Sprites mit Tag- und Nachtvariante.
- Alle Texte zweisprachig in i18n.ts. Die Chronik und die Live-Feiern werden pro Block erweitert.
