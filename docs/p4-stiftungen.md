# P4 Stiftungen – Migration 0165 (Wirtschaftsumbau)

Stand: 27.11.2026. Grundlage: Masterplan v6.7 (Abschnitt 4.1, Entscheidungen D2, D6, D10a, D11) und der
Implementierungsauftrag Entwurf 2. **Status: implementiert auf dem Branch `claude/p4-stiftungen`, nicht gemergt, nicht
eingespielt, nirgends aktiv.**

## Ebenenstatus

| Ebene | Stand |
|---|---|
| Repository (Branch, PR) | Code, Migration 0165/0166, Tests, Texte, Prüfpaket |
| `main` | unverändert |
| Datenbank (lab und öffentlich) | **nichts eingespielt** |
| Published (Lovable) | unverändert |
| Aktivierung | **keine.** `stift_since()` / `stiftSince()` = 04.01.2100 für `lab` und öffentlich. Ein echtes Datum ist eine eigene Migration mit eigener Freigabe (Stufe 2 Lab, Stufe 3 öffentlich / D7) |

Auch nach Merge, Einspielen und Publish kann kein Dorf stiften; der Client fragt vor dem Schalter nichts ab.

## Regeln und wo sie stehen

| Regel | Datenbank (0165) | TypeScript |
|---|---|---|
| Bau = Spital- oder Waagekomplex, stiftbar ab Stufe 1 | `stift_open` (Marker `spital1` / `waage1`) | `stiftOpenLock` |
| Öffnen kostenlos, Preis fest = 4 × letzte gebuchte Tagessteuer | `stift_open` (`tax_receipts`) | `stiftPrice` |
| Eine offene Stufe je Bau | `stift_open`, Index `stift_stages_one_open` | `stiftOpenLock` |
| Mindestens 7 Tage zwischen zwei Öffnungen am selben Bau | `stift_open` | `STIFT_PAUSE_DAYS` |
| Neue Stufe nur bei höchstens 14 Tagen Rest | `stift_open` | `STIFT_OPEN_REST_DAYS` |
| Einzahlen: ≥ 1 Mark, ≤ Rest, ≤ Kasse, endgültig, nur per Spieleraktion | `stift_deposit` → `purchase_guard` → `stift_row_price` → `wedding_money_check` | Karte (Betragsfeld) |
| Stiften: 30 Holz + 20 Stein, Lager über 40/30, Rest zum Kontorpreis im selben Aufruf | `stift_close` | `stiftPlan` |
| Baustellen-Vorrang (D2) | `stift_vorrang`, geprüft in `stift_open`, `stift_row_price`, `stift_close` | `stiftVorrang` |
| Reservierung (D6) | `stift_reserved`, `stift_free_quota` | `stiftReserved`, `stiftFreeQuota` |
| Stiftungszeit additiv, Ende je Abschlusszeile, 28-Tage-Grenze | `stift_close`, `stift_stages.until_at`, `stift_until_at`, `stift_endowed_at`, Trigger `stift_stages_keep`, CHECK `stift_stages_until` | `stiftungszeit.ts`: `stiftExtend`, `stiftSpans`, `stiftUntil`, `stiftEndowed` |
| Wirkung Waage: Kontorpreise zusätzlich ×0,85 | `resource_kontor_at` (gepatcht) | `waageFactor`, `kontorFactor` |
| Wirkung Spital: Krankheitsrisiko zusätzlich ×0,85 | – (Krankheit rechnet nur TypeScript) | `sickness.ts` |
| Offene Tage zuerst; bei „pending“ Abbruch ohne Buchung | `stift_close` → `resource_refresh_try` | `retryOnPending` |
| Keine Anrechnung als Gebäudekauf, Erlass, Gemeinwerk, Chronik | `quest_guard`, `princely_task_met` (gepatcht) | `countsAsBuilding`, `chronicle.ts` |

**Stiftungszeit (Auftrag 2.1):** `Ende_neu = max(Abschluss, Ende_alt) + 14 Tage`, in Zeitpunkten. Der Abschlusszeitpunkt
wird auf Millisekunden gerundet gespeichert (Marker `created_at` = `stift_stages.done_at`), damit TypeScript aus den
Markerzeilen exakt dasselbe Ende rechnet. Für einen früheren Zeitpunkt gilt das damals gebuchte Ende; ein späterer
Abschluss verändert keinen früheren Zeitpunkt und keinen Steuerbeleg.

## Bezeichner

- Tabelle `stift_stages (seed_id, bau, nr, price, paid, opened_at, funded_at, done_at, until_at, kontor, wood_store, stone_store)`.
- Kaufzeilen: Einzahlung `stift:<bau>:<n>:r<m>`, Kontoranteil `stift:<bau>:<n>:k`, Marker `stift:<bau>:<n>` (0 Mark).
  Keine passt auf das Gemeindebau-Muster `(spital|waage)[1-9][0-9]*…`.
- Client-RPCs (alle mit `_client`, in `client-rpc-registry.ts`): `stift_open(_seed,_bau,_client)`,
  `stift_deposit(_seed,_bau,_n,_amount,_client)`, `stift_close(_seed,_bau,_max,_client)`,
  `stift_overview(_seed,_client)` (rein lesend).
- Intern: `stift_since`, `stift_enter`, `stift_row_price`, `stift_until_at`, `stift_endowed_at`, `stift_vorrang`,
  `stift_reserved`, `stift_free_quota`, `stift_stages_keep`. Server-Setting `samenland.stift`.
- Ledger: `resource_ledger` mit den vorhandenen Arten `kontor` / `civic`, `ref` = `stift:<bau>:<n>:k|q|s`.

## Festlegungen bei der Umsetzung (bitte im Review bestätigen)

1. **Bestätigter Kontorbetrag bindet:** `stift_close` bekommt den im Dialog gezeigten Betrag (`_max`). Wäre der Preis
   inzwischen höher, bricht der Abschluss mit „price changed“ ab, ohne Buchung.
2. **Vorrang und Abschluss:** Der Vorrang sperrt nur den Kontoranteil. Ein Abschluss, der ganz aus dem Lager bedient
   wird, bleibt während einer unbezahlten Gemeindebaustelle möglich (Regel 4.1: „sperrt Öffnen, Einzahlen und den
   Kontoranteil des Abschlusses“).
3. **Reservierung gilt für das Kontingent,** wie im Auftrag beschrieben. Das Lager über der Rücklage ist nicht eigens
   reserviert; in der Materialphase zieht die Baustelle es ohnehin täglich zuerst ab.
4. **„pending“:** `stift_close` bricht bei „pending“ immer ab, auch ohne Kontoranteil (Auftrag 3.1).
5. **Ohne gebuchte Tagessteuer** (Preis unter 1 Mark) lässt sich keine Stufe öffnen.
6. **Doppelte Einzahlung:** Der Client schickt die Nummer der Einzahlung mit; dieselbe Nummer bucht nur einmal.
7. **Keine neue Serverfunktion:** Die Kasse rechnet die Datenbank (`village_balance`), die Steuer liest die
   Markerzeilen über `sickness.ts`. `treasury.server.ts`, `resources.server.ts`, `resources.functions.ts` bleiben unverändert.
8. **`src/integrations/supabase/types.ts` nicht von Hand geändert** (generierte Datei); der Client nutzt wie
   `useCivic.ts` einen schmalen untypisierten Zugang, bis die Typen nach dem Einspielen neu erzeugt sind.
9. **Kein Anleitungstext:** Die Anleitung beschreibt Gemeindebauten bisher nicht.

## Migration 0165 und Begleitmigration 0166

- `0165_stiftungen_p4.sql`: prüft zuerst die Live-Definitionen von `purchase_guard`, `resource_kontor_at`,
  `quest_guard`, `princely_task_met` (erwartete Stellen, erwartete Häufigkeit). Fehlt etwas, bricht sie mit
  `P4 0165: …` ab, **bevor** irgendetwas geändert ist. Erneutes Einspielen ändert nichts.
- `0166_begleitmigration_0166.sql`: byte-genau `SELECT 1;`.
- SHA-256 der Dateien: siehe `docs/sql/0165/03_fingerprints.sql` (der Test vergleicht sie mit den Dateien).

## Prüfpaket `docs/sql/0165/` (rein lesend, jede Datei `BEGIN TRANSACTION READ ONLY … ROLLBACK`)

| Datei | Wann | Erwartet |
|---|---|---|
| `01_vorher.sql` | unmittelbar vor 0165 | alle Zeilen „pruefung“ `ok = true`; Hinweise zu den Fingerabdrücken; Block BESTAND notieren |
| `02_nachher.sql` | unmittelbar nach 0165 + 0166 | alle Zeilen „pruefung“ `ok = true`; BESTAND Zeile für Zeile wie vorher |
| `03_fingerprints.sql` | vorher und nachher | Fingerabdrücke, Tabellenstruktur, Rechte fürs Protokoll |
| `04_funktionstexte.sql` | nur bei Abweichung | vollständige Funktionstexte |

`stiftung.pg.test.ts` (K9) führt alle vier Dateien gegen eine Testdatenbank aus, vor und nach der Migration.

## Ablauf nach dem Review (jede Stufe mit eigener Freigabe von Stephan)

1. Merge des PR. 2. `01_vorher.sql` und `03_fingerprints.sql` in der echten Datenbank, Ergebnis mit DB-ID und Zeit ablegen.
3. Einspielen von 0165 und 0166 über Lovable. 4. `02_nachher.sql` und `03_fingerprints.sql`, Ergebnis ablegen.
5. Publish. Danach bleibt alles inaktiv, bis ein Datum für `lab` gesetzt wird (eigener kleiner PR).

## Offene Abnahmepunkte (durch Tests nicht ersetzbar)

- Vorher- und Nachher-Prüfung in der echten Datenbank mit DB-ID und Hash.
- Regulärer Ablauf mit einem echten Lab-Dorf (erst nach der Lab-Aktivierung möglich).
- Sichtprüfung der Stiftungskarte auf Desktop und Mobil (bisher nur Komponententest, kein Browser).
- Neu erzeugte Supabase-Typen nach dem Einspielen.

## Vorschlag für den Masterplan-Nachtrag

- 3.x / 11.2 Schritt 2: „P4 implementiert (PR, Migration 0165/0166), nicht gemergt, nicht eingespielt, nicht aktiv.“
- 4.1: Status der P4-Tabelle von „nicht implementiert“ auf „implementiert, nicht aktiv“; die neun Festlegungen oben.
- 12: Die 21 Prüfpunkte sind in der Testdatenbank ausgeführt (Tabelle im PR); offen bleiben die vier Punkte oben.
- D7 bleibt offen; Lab-Aktivierung als eigener Schritt.
