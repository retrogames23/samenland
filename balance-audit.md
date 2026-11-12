# Bewohnergebundene Steuer: Ergebnis und Aktivierungsgrenzen

## Status
**Aktueller Produktionszustand (geprüft am 12.11.2026):** Die Belegabrechnung ist aktiv. Migration `0055_activate_tax_receipts.sql` wurde in der Produktionsdatenbank eingespielt und hat `tax_cutover` gesetzt: ein Datensatz, `at = 2026-10-31 02:43:22 UTC`. In `tax_receipts` lagen zum Prüfzeitpunkt 275 Belege (Tage 1–35). Seit diesem Zeitpunkt stammen neue Steuertage ausschließlich aus Serverbelegen über `residentTax()`; Tage davor bleiben über die Altfunktionen eingefroren. Keine rückwirkende Kürzung.

**Historischer Zustand vor dem Cutover (bis 31.10.2026):** Die Belegabrechnung war vorbereitet, aber nicht aktiviert; `tax_cutover` enthielt damals keinen Eintrag, Kassen liefen über die Altformel. Die folgenden Abschnitte beschreiben die Analyse aus dieser Zeit.

Damals als Voraussetzung genannt und weiterhin offen bzw. gesondert zu bearbeiten: vollständige paginierte Eingaben für große Welten (`loadEconomyInput`, `bookedDays`), Messung des CPU-Budgets auf dem veröffentlichten Laufzeitsystem.

## Reproduzierbare Simulation
Start 1. Januar 2026 UTC, alleinstehender Ort bei 306/420. Versorgung: Jäger Tag 2, Kräuterhütte Tag 5, Fischer Tag 10, Kornspeicher Tag 45, Heiler Tag 100. Keine Charta, Nachbarn, Aufgaben oder aktive Begegnungsausgaben. Einnahmen werden täglich zum selben Gründungszeitpunkt bewertet; Mitgift und Raubverluste sind enthalten. Das ist ein Vergleichsszenario, keine Vorhersage für jeden Ort.

| Tage | Ohne Pflege: Einwohner | Neue Steuern gesamt | Alte Steuern gesamt | Kasse neu inkl. Mitgift/Verlusten | Versorgt: Einwohner | Neue Steuern gesamt | Alte Steuern gesamt | Kasse neu nach Versorgungskäufen |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
|30|65|1148|1412|1416|65|1152|1420|1090|
|90|84|6187|7129|6720|183|9968|8009|9953|
|180|84|14927|16759|15949|298|38011|24957|38199|
|365|60|33524|37964|35626|356|131333|73029|133726|
|730|60|71407|83134|75929|541|445759|176054|454322|

Ungepflegt: Dorfstufe, im Sommer maximal 32 bewohnte Haushalte, im Winter 24. Die Einwohnerbindung reduziert hier Jahressteuern nur um rund 12 %. Gepflegte Orte verdienen erheblich mehr als in der Näherung: +80 % nach einem Jahr. **Die echte Einwohnerbindung beseitigt die Geldschwemme nicht.**

## Mechanische Einschränkungen
Die Bewohnerbasis ist exakt geteilt, aber Krankheitsausfälle bleiben eine statistische Steuerabschätzung aus prosperity.ts, nicht die individuell sichtbare Krankenliste. Hochzeit/Mitgift und Raubverluste behalten ihre vorhandenen Modelle. Tagesabrechnungen sind Momentaufnahmen, keine Integration jeder untertägigen Bevölkerungsänderung. Dies nicht als vollständig identische Individualbesteuerung darstellen.

## Entscheidung zur Kalibrierung
Die zugesagten 1/2/3 Taler pro Bürger und Tag bleiben unverändert. Ohne zusätzliche Regel können passive Einnahmen nicht deutlich fallen: weniger Geld erfordert längere Abrechnungsintervalle, geringere Sätze, einen steuerfreien Anteil oder Ausgaben. Keine dieser Änderungen wurde stillschweigend vorgenommen. Eine mögliche, ausdrücklich zustimmungspflichtige Variante wären dieselben 1/2/3 Taler **pro Woche**: reine Jahressteuer im Vergleich etwa 4789 statt 33524 ungepflegt und 18762 statt 131333 versorgt. Mitgiften, Verluste, frühe Erschwinglichkeit und Preise müssten dabei erneut abgestimmt werden; diese Variante ist noch nicht ausbalanciert.