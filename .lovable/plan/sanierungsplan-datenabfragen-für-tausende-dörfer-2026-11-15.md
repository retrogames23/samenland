# Sanierungsplan: Datenabfragen für Tausende Dörfer

Ziel: Keine Abfrage darf mehr stillschweigend bei 1.000 Zeilen abbrechen oder Daten fremder Karten mitladen. Spielmechanik, Salden und Berechnungen bleiben exakt gleich – es ändert sich nur, *welche* Zeilen geladen werden und dass alle ankommen.

## 1. Tavernenchat je Karte
- Erstabfrage lädt die letzten 300 Nachrichten nur der eigenen Karte (plus eigene Briefe/Flüstern), nicht weltweit.
- Keine automatische Löschung alter Nachrichten (wäre eigene Entscheidung, siehe offene Frage).

## 2. Kartendaten nur für die aktuelle Karte, vollständig
Beim Kartenstart werden Käufe, Begegnungen, Segen, Chartas, Handelsstraßen, Pflanzungen, Wegweiser, Partnerschafts-Abstimmungen/-Werke und Geschenke nur für die Dörfer der aktuellen Karte geladen – in Blöcken, bis alle Zeilen da sind (wie bereits bei Aufgaben und Markt).
- Auch die Nachlade-Stellen (nach Kauf, nach Begegnung, Charta-Prüfung) nutzen dieselbe Abfrage.
- Brieftexte: nur Texte der in den letzten 60 Tagen sichtbaren Briefe.

## 3. Server-Berechnungen absichern
Schatzkammer/Steuer, Bau-Mail und Truhen-Mail laden schon kartenbezogen, aber ohne Blockweise-Laden. Alle bekommen dasselbe vollständige Laden, damit Kassenstände bei 60 aktiven Dörfern nicht falsch werden.

## 4. Absicherung
- Gemeinsame Hilfsfunktion für "alle Zeilen in Blöcken, nach Dorf-Liste gefiltert" (große Dorflisten werden gestückelt).
- Tests: Hilfsfunktion liefert >1.000 Zeilen vollständig; Kassenstand-Tests unverändert grün.
- Volle Testsuite und Build; nichts veröffentlichen.

## Technische Details
- `allRows` aus Game.tsx in `src/lib/fetch-all.ts` auslagern, Variante `allRowsIn(table, col, ids, select)` mit `.range()`-Paginierung, `.order("id")` und ID-Chunks à ~200.
- Betroffen: `Game.tsx` (Z. 653, 731–733, 791–805, 1398, 1437), `Tavern.tsx` Z. 69 (`.or(realm.eq.X,recipient_id.eq.me)`), `treasury.server.ts` Z. 44–51, `api/public/build-mail.ts`, `api/public/chest-mail.ts`.
- Gifts: `.or(from_seed.in.(...),to_seed.in.(...))` bzw. zwei Abfragen zusammengeführt.
- Keine Migration nötig; optional später Indizes auf `seed_id`, falls Abfragen langsam werden.

## Offen
- Soll alter Tavernenchat nach z. B. 90 Tagen automatisch gelöscht werden? Nicht Teil dieses Plans.
