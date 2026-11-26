# Hochzeitspaket – Stand nach der Nachbesserung

Branch `claude/hochzeitspaket` · Basis `f6b31ce` · Migration `0159_hochzeitspaket` (nicht eingespielt)

**Status: nicht abgenommen, keine Produktionsfreigabe.** Nach Masterplan v6.2, 11.3 ist die Anpassung des Hochzeitsrhythmus bewusst zurückgestellt. Die Zielregel dieses Pakets ist **nicht beschlossen** (siehe „Offene Designfragen“).

## Was das Paket technisch tut

- Es gibt einen Umschaltzeitpunkt *T* je Karte (`weddingSwitchSince` ↔ `wedding_switch_since`). Geprüft wird gegen den Zeitpunkt der Hochzeit. Beide Karten stehen auf dem Platzhalter 2100-01-04.
- **Vor *T*:** alte Regel (Kräuterhütte + Heiler), unverändert in TypeScript und SQL; Belege der Version 1 sind Schatten.
- **Ab *T*:** Nur TypeScript rechnet. Der vertrauenswürdige Server schreibt Belege der Version 2. Die Datenbank liest ab *T* ausschließlich Belege der Version 2 (`village_wedding_list`). Kasse, `village_weddings` und `encounter_guard` folgen ihr.

## Schutzmechanismen

- **Vollständige Belegprüfung (A):** `settleWeddings` liest immer alle Belege und vergleicht jedes Feld mit dem Kalender: Zeitpunkt, Mitgift, Version, `is_grand`, `is_town` (`auditReceipts`). Es gibt keine Abkürzung über Anzahl und höchsten Index mehr.
  - Lücken (auch ein fehlender erster Beleg), geänderte Felder und unerwartete Belege gelten als Abweichung. Dann wird nichts geschrieben und nichts repariert.
  - Geschrieben werden nur Belege nach dem höchsten gebuchten Index. Danach wird der Bestand erneut gelesen und verglichen.
- **Versionsgrenze in PostgreSQL (B):** Der Trigger `wedding_receipts_guard` erzwingt vor *T* Version 1 und ab *T* Version 2. Er verweigert außerdem `UPDATE` und Belege mit Zeitpunkt in der Zukunft.
  - Ein alter Serverstand schreibt für jede Hochzeit Version 1. Nach *T* scheitert deshalb seine ganze Anweisung, er bucht dann gar nichts.
  - `village_wedding_list` nutzt ab *T* nur Version 2. Version 1 dient dort nie als Ersatz.
- **Umschaltfehler fail-closed (C):** Alle Pfade nutzen dieselbe Prüfung: `weddingSwitchState` und `weddingSettlementProblem`.
  - Eine Abweichung gilt als *switchMismatch*, wenn TS und DB verschiedene Daten nennen **und** das frühere bereits erreicht ist. Vorher ist jede mögliche Hochzeit älter als beide Daten; beide Seiten rechnen sie nach der alten Regel.
  - Kassen-Sync: bricht vor jedem Lesen und Schreiben mit `WeddingSettlementError` ab. Das gilt auch bei abweichenden Belegen und wenn die Abfrage des Umschaltdatums fehlschlägt.
  - Hochzeitsantwort: wird abgelehnt.
  - Sweep: hält an (HTTP 409).

## Befunde zur Unveränderlichkeit (unverändert gelassen)

- `UPDATE`: durch den Trigger verweigert.
- `DELETE`: Für `service_role` ist es weiterhin direkt möglich, ebenso über die Dorf-Löschung (`purge_user_data` → `ON DELETE CASCADE`).
- `TRUNCATE`: Für `service_role` möglich; Zeilentrigger greifen dabei nicht.
- Trigger abschalten: Der Tabelleneigentümer kann Trigger abschalten.
- Folge: „Unveränderlich“ gilt nur für den regulären Schreibpfad. Ein gelöschter Beleg nach *T* senkt den Kassenstand rückwirkend. Danach meldet die Prüfung eine Lücke oder bucht den fehlenden Beleg am Ende erneut.

## Ausführung (erst nach Freigabe)

1. Prüfpaket nach Masterplan 3.2 erstellen (`01_vorher.sql`, `02_nachher.sql`, `03_fingerprints.sql`, `04_funktionstexte.sql`), lesend; Begleitmigration einplanen. **Noch nicht erstellt.**
2. Vorher lesend prüfen: Die Live-Definition von `village_wedding_list` muss dem Text aus 0107 entsprechen, denn 0159 ersetzt sie.
3. 0159 einspielen. Danach lesend: `select * from public.wedding_receipt_inventory() where fehlt + weicht_ab + luecken + doppelt + falsche_version > 0;`
4. Sweep: erst Probelauf, dann `apply`, Karte für Karte. Bei `halted` oder `errors` stoppen.
5. Umschaltdatum setzen: in einem PR TS-Konstante und `wedding_switch_since` gemeinsam, mit einem Datum **in der Zukunft**.
   - Begründung: Setzt man *T* früher als bestehende Belege, zählen diese Belege nicht mehr (Version 1 nach *T*) und werden auch nicht mehr berechnet.
   - Vorher prüfen: Kein Beleg darf `occurred_at ≥ T` haben.
   - Zwischen den beiden Deploys darf *T* nicht erreicht werden, sonst stehen Kassen-Sync und Hochzeitsantwort (fail-closed).

## Rücknahme

- **Vor *T*:** Datum zurück auf den Platzhalter; vor *T* sind die Belege nur Schatten.
- **Nach *T*:** keine Rückabwicklung gebuchter Belege; Korrektur nur vorwärts (neue Version ab einem späteren *T₂*).
- **Sweep-Abbruch:** jederzeit gefahrlos; neu starten mit `next` oder von vorn.

## Offene Designfragen (nicht durch Masterplan oder Entscheidung gedeckt)

- **H1 Zielregel:** ob überhaupt angepasst wird, und mit welchen Gebäuden. Vorschlag des Pakets: `gemeinwesenGate` + `careHealthExtra` (Dom, Universität, Klostergarten).
- **H2 Architektur:** Masterplan 11.3 verlangt „TypeScript und SQL werden gemeinsam geändert; Paritätstest“. Das Paket lässt SQL ab *T* nicht mehr rechnen. Das ist nur nötig, wenn Dom und Universität (physische Fertigstellung) zählen.
- **H3** Verhältnis des Hochzeits-Umschaltdatums zu `gemeinwesenSince` und D7.
- **H4** Belege nach *T* verzögern die Mitgift bis zur Abrechnung; dazu die Frage nach einem täglichen Sweep.
- **H5** `encounter_guard` mit oder ohne Prüfung auf `is_grand`.
- **H6** Fail-closed bei abweichenden Belegen *vor T*: Heute blockiert das den Kassen-Sync des betroffenen Dorfes, obwohl vor *T* nur Schattenbelege betroffen sind.
- **H7** Schutz vor `DELETE`/`TRUNCATE` (siehe Befunde).
