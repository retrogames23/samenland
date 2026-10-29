# Nachbarschaftsleben: Wochenmärkte und Botenbriefe

## 1. Wochenmarkt am Treffpunkt (Samstag)
- Jeden Samstag (Weltuhr der Karte) zwischen 9 und 17 Uhr treffen sich Händler zweier verbundener Dörfer.
- Treffpunkt: das Torhaus bei Zwillingsstädten, sonst die Mitte der Handelsstraße. Dort stehen 2–4 gemalte Marktstände mit Waren aus beiden Vorratskammern (z. B. Fisch von der Küste, Erz aus den Bergen).
- Aus jedem Dorf ziehen morgens 2–3 Händler mit Kiepe oder Karren zum Markt und kehren abends heim. Am Markt stehen Käufer und plaudern (Sprechblasen).
- Nutzen: An Markttagen gibt der Handelsbonus beider Dörfer zusätzlich +5 % für diesen Tag, und der Knopf „Markttag halten“ bringt dann 20 statt 15 Taler.
- Klickst du einen Stand an, siehst du, wer dort handelt und was angeboten wird. In der Dörfer-Liste steht „Nächster Wochenmarkt mit X: Samstag“.
- Der bisherige zufällige Markttag pro Dorfpaar entfällt. Alle verbundenen Dörfer treffen sich einheitlich am Samstag, das ist leichter zu merken.

## 2. Botenbriefe (Gruß per berittenem Boten)
- In der Dörfer-Liste und in der Ansicht des Dorfschulzen gibt es den Knopf „Boten schicken“. Du schreibst dort einen kurzen Gruß (max. 140 Zeichen).
- Ein berittener Bote (neues gemaltes Pferd mit Reiter) reitet sichtbar über die Straßen. Die Reisezeit hängt von der Entfernung ab (etwa 10 Minuten bis 2 Stunden).
- Bei der Ankunft taucht der Brief in der Chronik des Nachbarn auf. Schaut der Nachbar gerade zu, erscheint ein Pergament mit Siegel: „Ein Bote aus X bringt Kunde“, mit Antwortknopf.
- Regeln: höchstens 3 Briefe pro Tag und Dorf. Wer dich in der Taverne blockiert hat, bekommt keinen Brief von dir. Ein Brief kostet nichts.
- Ein Gästebuch im Dorf-Pergament zeigt die letzten 20 erhaltenen Briefe.

## Neue Bilder
- Berittener Bote (Laufzyklus mit 4 Bildern, vorne und hinten, auch nachts).
- Marktstand mit Markise (2 Varianten, Tag und Nacht).
- Händlerin und Händler mit Kiepe.

## Technische Details
- Markt rein abgeleitet: `marketDay` wird auf den Samstag nach `worldWeekday` (time.ts) umgestellt. Der Markt-Ort kommt aus `twinGateAt` bzw. der Straßenmitte (world.ts). Die Händler-Wege entstehen in people.ts/wander.ts als neue WalkerKind „trader“, Stände in render.ts. Gespeichert wird nichts.
- Der Bonus kommt in `speedParts` (als Handelsanteil, Deckel von 35 % bleibt). `market_guard` vergibt 20 Taler, wenn heute Samstag ist und das Dorf eine Handelsverbindung hat. Diese Verbindung wird im Spiel ermittelt, deshalb vertraut die Datenbank hier dem Spiel, wie schon bei der Aufgabe „10 Bürger“.
- Neue Tabelle `letters` (from_seed, to_seed, user_id, body, created_at) mit RLS: lesen dürfen Absender und Empfänger, schreiben nur der Besitzer. Der Trigger `letter_guard` prüft Länge 1–140, höchstens 3 pro Tag, kein Brief an sich selbst und Blockierungen aus chat_blocks.
- Die Ankunftszeit wird aus Entfernung und created_at berechnet, nicht gespeichert. Der Bote ist ein neuer WalkerKind „rider“ in wander.ts. Die Chronik bekommt das Ereignis „letter“, das Game.tsx bei Ankunft zeigt. Live-Updates kommen über Realtime auf `letters`.
- abandon_village löscht auch letters.
- i18n DE/EN für alle Texte. Tests: Samstagsmarkt, Ankunftszeit, Briefgrenze (3/Tag).
