# Hochzeitspaket – Stand nach der Nachbesserung

Branch `claude/hochzeitspaket` · Basis `f6b31ce` · Migrationen `0159_hochzeitspaket`, `0160_hochzeit_anker` (Paket A2), `0161_hochzeit_vollstaendigkeit` (Paket B), `0162_hochzeit_integritaet_rechte` (Paket C) (nicht eingespielt)

Betrieb (Einspielreihenfolge, Vorabprüfung, Aktivierung, Vorwärts-Korrektur, PostgREST-Lücke): [`hochzeitspaket-betrieb.md`](hochzeitspaket-betrieb.md).

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

## Paket A2 – Anker-Fortsetzung (Migration 0160, nicht eingespielt)

**Anlass:** Freigabeprüfung O1, T15. Ein späterer Kauf von Gesellenherberge oder Holzfällerlager oder ein später gesiegelter Handwerks-Freibrief verkürzt rückwirkend die Bauzeit von Dom- und Universitätsschritten (`world.ts` `buildWith` prüft kein Kaufdatum). Unter der einheitlichen Regel verschob das bereits gebuchte Hochzeiten.

**Regel:** Gebuchte Belege sind die Historie und werden nie neu berechnet.
- **Anker:** Jeder Beleg speichert `next_at`, den nächsten Termin, wie der Server ihn beim Buchen berechnet hat. Der Beleg mit dem höchsten Index ist der Anker; Hochzeit und Anker stehen in **einer** Zeile.
- **Fortsetzung:** Der Server rechnet ab dem Anker weiter (`weddingCalendarFrom`): erster neuer Beleg bei `next_at`, Index +1, danach derselbe Schritt der unveränderten Regel.
- **Alter Teil (vor *T*, Version 1):** Die Legacy-Regel zählt nur Käufe bis zum jeweiligen Zeitpunkt und ist damit stabil. Diese Belege werden weiter Feld für Feld verglichen, ebenso der erste Termin ab *T*.
- **Neuer Teil (ab *T*, Version 2):** nur strukturell geprüft — Anker vorhanden, Index lückenlos, jeder Beleg beginnt genau bei `next_at` des vorigen.
- **Ohne Belege:** Kalender ab Gründung (Index 0, Tag 2); die erste Buchung setzt den Anker. Lab: erster Beleg ab dem Umschaltzeitpunkt.

**Klassifizierung** (`planReceipts`, lesend auch `wedding_anchor_inventory()`): `ohne_belege` · `alt_rekonstruierbar` · `verankert` · `widerspruechlich` · `quarantaene`.

**Quarantäne** (`wedding_quarantine`): Abweichende Altbelege (`legacy_divergent`), Belege ab *T* ohne Anker (`unanchored`) oder eine gebrochene Kette (`chain_break`) werden nie repariert, nachgebucht oder erfunden.
- Das Dorf wird einmal protokolliert (nur mit `apply`).
- Danach verweigert die Datenbank jeden Beleg des Dorfes. Kassen-Sync und Hochzeitsantwort stoppen fail-closed; der Sweep listet das Dorf und macht mit dem nächsten weiter.
- Aufheben nur von Hand mit Begründung (`wedding_quarantine_release`). Der Datensatz bleibt erhalten; Löschen ist nur zusammen mit dem Dorf möglich.

**Buchung:** nur über `wedding_receipts_book(_seed, _rows)`.
- Ein Aufruf ist eine Transaktion mit Sperre je Dorf; die Zeilen müssen eine Kette bilden.
- Eine identische Wiederholung ist wirkungslos; eine abweichende Zeile wird verweigert (ein paralleler Lauf war schneller).
- Der Wächter prüft dasselbe auch bei direkten Inserts.

**Unverändert:**
- Hochzeitsregel (Golden Master `hochzeit-regel-golden.test.ts`);
- Geldfunktionen (`village_wedding_list`, Kassenweg, `village_weddings`, `encounter_guard`);
- O1/O2.

**Grenzen:**
- Anzeige und Prognose im Client rechnen weiter ab Gründung. Für Dörfer, die nach *T* einen der drei Faktoren nachkaufen, kann die Anzeige vergangener Hochzeiten von den Belegen abweichen. Geld und Wächter folgen den Belegen.
- Neue Server-Version erst nach 0160 ausliefern: Sie liest `next_at` und bucht über `wedding_receipts_book`.

## Paket B – Vollständigkeit, Reihenfolge, Pending (Migration 0161, nicht eingespielt)

**Ziel:** Keine Kassen- oder Ressourcenbuchung läuft mit einem unvollständigen Stand der Hochzeitsabrechnung.

**O1 – Vollständigkeitsnachweis** (`wedding_settlement`)
- Felder:
  - `settled_through` (einschließlich): bis dahin hat der Server abgerechnet;
  - `quiet_until` (ausschließlich): `next_at` des Ankers, also unveränderlich (A2);
  - `anchor_index`.
- Geschrieben nur von `wedding_settle`, in derselben Transaktion wie die Belege, und nur, wenn die Kette den Nachweis trägt (`next_at` des höchsten Belegs > `settled_through`).
- `wedding_settled_at(seed, t)`: wahr, wenn `t ≤ settled_through` oder `t < quiet_until`, **und** der Nachweis zum heutigen höchsten Beleg passt.
  - Fehlt der Nachweis, widerspricht er dem Beleg oder ist er nicht prüfbar, gilt das Dorf als **nicht** vollständig; ebenso bei Quarantäne.
  - Vor dem Umschaltzeitpunkt und vor dem ersten möglichen Hochzeitstermin (Gründung + 2 Tage) ist immer vollständig.

**E2 – Geldprüfung** (`wedding_money_check`, in allen fünf Wächtern und in der Kontor-Prüfung von `purchase_material`)

| gebuchte Kasse | Abrechnung | Ergebnis |
|---|---|---|
| ≥ Preis | beliebig | erlaubt (geprüfter unterer Grenzwert) |
| < Preis | nicht vollständig | `wedding settlement pending` |
| < Preis | vollständig | `not enough money` |

- Gilt für die Ereignisquellen, die `paket-b.pg.test.ts` abdeckt, und für die vier Truhengrenzen mit exaktem Grenzfall.
- Ein Strukturtest schlägt fehl, sobald der Kassenweg eine neue Ereignisquelle bekommt.

**Ressourcen** (`resource_refresh_try` → `current` · `booked` · `inactive` · `pending`)
- `pending`, wenn eine offene Gemeindebau-Stufe zu buchen wäre (ihr Kontor liest die Kasse) und die Abrechnung nicht vollständig ist. Dann wird **nichts** gebucht.
- `resource_refresh_at` löst bei `pending` einen Fehler aus und kehrt nie mehr still zurück.
- `purchase_material` bricht vor jeder Verwendung des Bestands ab. Damit ist der bekannte Kontor-Fall behoben (vorher Aufschlag 20, Material [5,5]).
- `civic_raise_budget` prüft das Ergebnis ausdrücklich, `resource_overview` meldet `pending`.

**O2 – Reihenfolge** (`settleBeforeSpend`, `calculateTreasury`)
1. Umschaltzeitpunkt prüfen.
2. Hochzeiten buchen.
3. Nachweis schreiben.
4. Ressourcen, Steuertage, Kasse.
5. Bei Pending abbrechen, ohne Teilbuchung.

- Gilt für Kassen-Sync, alle Begegnungsantworten und Nothilfe.
- `chest-mail` schreibt nur einen nachgewiesen vollständigen Kassenstand in einen Brief.

**Client**
- `retryOnPending`: Nur bei einer Pending-Antwort wird einmal synchronisiert und höchstens einmal wiederholt. Bei Timeout oder anderem Fehler gibt es keine Wiederholung.
- Gilt für Kauf, Gemeindebau-Rate, Kontor-Limit, Geschenk, Gemeinschaftswerk, Umsetzen, Begegnung und Nothilfe.
- Eigener Text (`src/game/lang/settlement.ts`); im Ressourcenbalken eine Sanduhr.

**Grenzen**
- Lab: Ein Lab-Dorf ohne Beleg ab *T* kann keinen Nachweis haben, bis seine erste Hochzeit ab *T* gebucht ist. Bis dahin gilt die Untergrenze oder Pending.
- Europe: Ein höchster Altbeleg ohne `next_at` (von vor A2) trägt keinen Nachweis. Deshalb A2/B mindestens 20 Tage (`WED_MAX`) vor *T* ausliefern und den Sweep laufen lassen.

**Abschluss Paket B (drei Punkte)**
- **Ratsbuch-Annahme:**
  - Eine bezahlte Antwort (z. B. `journeyman:host` 30) ist eine Geldbuchung, über den Preis der Begegnung im Kassenweg.
  - `acceptRatsbuch` rechnet deshalb vorher ab (`settleBeforeSpendById`; vor *T* ohne Laden der Welt).
  - Bei Pending speichert die Anweisung nichts: keine Begegnung, keine geschlossene Anfrage (`ratsbuch_close` ist ein AFTER-Trigger), keine neue Anfrage aus `ratsbuch_refresh`.
  - Freie Antwort und Ablehnung buchen weder Geld noch Ressourcen.
- **Gleicher Zeitstempel:**
  - SQL und TypeScript sortieren gleich: Zeit, dann Klasse (Steuer 0, Mitgift 1, Gutschrift 2, Ausgabe 3, Überfall 4), dann Schlüssel.
  - Innerhalb einer Klasse ist die Reihenfolge ohne Wirkung: Gekappte Gutschriften, Ausgaben und Überfälle sind jeweils vertauschbar. Die Sortierung der Schlüssel spielt deshalb keine Rolle.
  - Zwischen den Klassen wirkt die Reihenfolge an der Obergrenze; sie ist auf beiden Seiten gleich festgelegt.
  - Kein neuer Tie-Breaker nötig; getestet für alle vier Truhengrenzen.
- **Alte Clients:**
  - Ab `CLIENT_GATE_LEAD` (7 Tage) vor *T* beantworten `settleTreasury`, `decideEncounter` und `callNothilfe` einen Aufruf ohne `CLIENT_PROTOCOL` mit einer Umleitung, die die Seite neu lädt.
  - Jeder alte Client ruft vor jeder Geldaktion eine dieser Funktionen auf (`prepareSpend`), dazu minütlich.
  - Mit dem Platzhalter 2100 greift das nie.

**Voraussetzung für Paket C (Aktivierung)**
1. 0160 und 0161 sind eingespielt; Server und Client mit `CLIENT_PROTOCOL = 2` sind ausgeliefert.
2. Die Auslieferung mit dem echten *T* (TS-Konstante und `wedding_switch_since` gemeinsam) ist mindestens 20 Tage vor *T* live: `WED_MAX` für verankerte Belege, darin enthalten die 7 Tage des Gates.
3. Vor *T* sind Sweep und Inventar sauber.
4. Kein Schritt setzt den Nachweis voraus, dass keine alten Tabs mehr offen sind. Das Gate lädt sie neu.

**Verbleibende Grenzen**
- Ein alter Tab aus einem veralteten Browser-Cache, der nach *T* öffnet und klickt, bevor seine erste Synchronisierung zurück ist, kann während des erzwungenen Neuladens kurz den alten Text zeigen.
- Gebucht wird dabei nie etwas Falsches.

## Paket C – Integrität, Rechte, Client-Wege (Migration 0162, nicht eingespielt)

- **H7 (Variante 2):** Einzelne Belege sind unveränderlich, auch für `service_role`.
  - `UPDATE` verweigert weiterhin der Wächter.
  - `DELETE` einzelner Belege und `TRUNCATE` verweigern zwei neue Trigger (`wedding receipts are kept`), auch für den Tabelleneigentümer.
  - Rechte nur noch `SELECT`; geschrieben wird ausschließlich über `wedding_receipts_book` / `wedding_settle`.
- **CASCADE bleibt:** Wird ein Dorf gelöscht (`abandon_village`, `purge_user_data`), gehen Belege, Nachweis und Quarantäne-Datensatz mit verloren. Das ist bewusst so und dokumentiert; ein Archiv gibt es nicht.
- **Rechte:** vollständiges Audit vorher/nachher (Tabellen, Sichten, Sequenzen, jede Funktionssignatur; PUBLIC, anon, authenticated, service_role, wirksam mit RLS).
  - Entzogen, je mit Aufrufweg begründet: `village_weddings` (nur noch service_role), `claim_visit` (nicht mehr anon/PUBLIC).
- **Alte Clients:** `civic_raise_budget_v2` / `resource_overview_v2` mit Protokollnummer. Die alten Signaturen leiten bis *T*−7 Tage weiter, danach `client outdated`. Alle direkten Client-Wege stehen in `src/lib/client-rpc-registry.ts`.
- **Vorabprüfung:** `wedding_activation_inventory()` und `docs/sql/hochzeit_vorabpruefung.sql` (nur lesend).

## Ausführung (erst nach Freigabe)

1. Prüfpaket nach Masterplan 3.2 erstellen (`01_vorher.sql`, `02_nachher.sql`, `03_fingerprints.sql`, `04_funktionstexte.sql`), lesend; Begleitmigration einplanen. **Noch nicht erstellt.**
2. Vorher lesend prüfen: Die Live-Definition von `village_wedding_list` muss dem Text aus 0107 entsprechen, denn 0159 ersetzt sie.
3. 0159, 0160, 0161, 0162 einspielen (Reihenfolge und Zeitfenster: `hochzeitspaket-betrieb.md`). Danach lesend: `select * from public.wedding_receipt_inventory() where fehlt + weicht_ab + luecken + doppelt + falsche_version > 0;`
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
- ~~**H7** Schutz vor `DELETE`/`TRUNCATE`~~ — umgesetzt in Paket C (Variante 2). Offen bleibt nur die Aufbewahrung bei Dorf-Löschung (CASCADE).
