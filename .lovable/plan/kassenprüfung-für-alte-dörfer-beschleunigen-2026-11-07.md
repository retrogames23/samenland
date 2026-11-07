# Kassenprüfung für alte Dörfer beschleunigen

Ziel: Kontoprüfung (bei jedem Bau, Straßenbeschluss, Geschenk, Begegnung) bleibt auch nach Jahren in Millisekunden. Kein Spieler verliert oder gewinnt dabei auch nur einen Taler.

## Block 1 – Sicherheitsnetz zuerst
- Vor jeder Änderung für alle bestehenden Dörfer den aktuellen Kontostand festhalten (Lesen, keine Änderung).
- Nach der Umstellung erneut abfragen: jeder Kontostand muss exakt gleich sein. Sonst wird zurückgerollt.

## Block 2 – Steuerbelege summieren statt Tag für Tag
- Die Tagesschleife in der Steuerfunktion ab dem Steuerschnittpunkt durch eine einzige Summe über die festen Tagesbelege ersetzen.
- Die Tage vor dem Schnittpunkt (alte Berechnung) bleiben unverändert – sie sind abgeschlossen und werden nicht größer.
- Passender Index auf Dorf + Tag, falls noch nicht vorhanden.

## Block 3 – Hochzeiten und Mitgiften entschärfen
- Prüfen, wie die Hochzeitsschleife pro Schritt Käufe zählt; die Kaufzählung einmal vorab laden statt in jedem Schritt neu abfragen.
- Ergebnis muss identisch bleiben (gleiche Anzahl Hochzeiten, gleiche Mitgift).

## Block 4 – Serverabgleich schlanker
- Im Kassenabgleich nicht mehr alle Belege einzeln übertragen, sondern nur noch die Summe bzw. den letzten Tag abfragen.

## Block 5 – Prüfen
- Kontostände vorher/nachher vergleichen (Block 1).
- Zeitmessung der Kontoprüfung für das älteste Dorf vor und nach der Umstellung.
- Bestehende Tests laufen lassen; ein Test, dass die Kasse ohne Einzelbelege dieselbe Summe liefert.

## Technische Details
- Betroffen: DB-Funktionen `village_capped_tax`, `village_weddings`, ggf. `village_balance`; `src/lib/treasury.server.ts` (Zeile ~83 `select("income")` → Aggregat per RPC oder `sum`).
- Neue Funktionen per `CREATE OR REPLACE` in einer Migration, Signaturen unverändert, damit alle Trigger (`purchase_guard`, `gift_guard` usw.) weiter funktionieren.
- Die genaue Schleifenstruktur wird vor dem Umbau aus der zuletzt gültigen Funktionsdefinition in der Datenbank gelesen.
