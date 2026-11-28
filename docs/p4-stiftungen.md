# P4 Stiftungen – Migration 0165 (Wirtschaftsumbau)

Stand: 28.11.2026 (Statusberichtigung, Paket M des Masterplans v7.0). Grundlage der Umsetzung: Masterplan v6.7
(Abschnitt 4.1, Entscheidungen D2, D6, D10a, D11) und der Implementierungsauftrag Entwurf 2. **Status: gemergt (PR #73),
Migrationen 0165–0167 eingespielt und geprüft, veröffentlicht laut Stephan, nirgends aktiv.**

## Ebenenstatus

| Ebene | Stand | Beleg |
|---|---|---|
| Code in `main` | **gemergt** | PR #73, Merge-Commit `83a839d` (28.11.2026, 00:09 UTC) |
| Datenbank | **0165, 0166 und die Lovable-Begleitmigration 0167 eingespielt** | P4-Installationsbericht vom 28.11.2026: Datenbank `postgres`, OID 5, PostgreSQL 17.11; Live-IDs 167 / 168 / 169; 0165 mit SHA-256 `9b5fc4d0fa1ba375cdc6af3e687dca7538c7041080da7876dae565cc4bd88851` (gleich der Datei in `main`) |
| Vorher-Prüfung | **bestanden, 10 von 10** | 28.11.2026, 00:25:12 UTC; die vier Bestandsfunktionen entsprachen dem Stand vor 0165 |
| Nachher-Prüfung | **bestanden, 23 von 23** | vier gepatchte Bestandsfunktionen exakt wie erwartet, 13 neue Funktionskörper bytegenau, acht weitere geprüfte Bestandsfunktionen unverändert |
| Bestand | **unverändert in den dokumentierten Kennzahlen** | 211 Seeds, Käufe, Steuerbelege, Rohstoff-Ledger, Kassenstände, Kontorpreise; `stift_stages` leer, keine Stiftungs-Kaufzeile |
| Published (Lovable) | **veröffentlicht laut Stephan** (28.11.2026, nach dem Installationsbericht) | Angabe von Stephan; das Hosting liefert keine Deployment-SHA |
| Aktivierung | **nur `lab`, und erst nach dem Einspielen von 0169 durch Lovable** (P4 Schritt 2b, `docs/p4-lab-aktivierung.md`): `stift_since('lab')` = 28.11.2026. `europe`, `us-west`, `us-east`, `asia` und alle Überlaufkarten bleiben auf 04.01.2100; `stiftSince()` im Client ebenso | Bis Lovables Nachher-Prüfung zu 0169 vorliegt, gilt live der Stand des Installationsberichts (alle fünf Welten 04.01.2100). Öffentlich: eigene Migration mit eigener Freigabe (P6 / D7) |
| Supabase-Typen | **neu erzeugt** | Lovable-Commit `5bda94e` |

In den öffentlichen Welten kann kein Dorf stiften; der Client fragt dort vor dem Schalter nichts ab.

**0165–0167 nicht erneut einspielen und nicht erneut prüfen.** `docs/sql/0165/02_nachher.sql` und `03_fingerprints.sql`
laufen nicht noch einmal; ihre Ergebnisse liegen im Installationsbericht vor.

### Zwei Einschränkungen des Installationsberichts (unverändert zu erhalten)

- **Berechtigungsbefund `sandbox_exec`:** Die interne Rolle `sandbox_exec` besitzt durch Default-Grants **SELECT und
  INSERT auf `stift_stages`** und **BYPASSRLS = true**. Der Bericht weist das als zusätzlichen internen Grant aus. Die
  Migration 0165 vergibt dieses Recht nicht selbst. **Nicht eigenmächtig ändern;** der Befund ist für die
  Sicherheitsprüfung vorgemerkt (Masterplan v7.0, Abschnitte 3.4 und 9).
- **Methode:** Die SQL-Blöcke der Prüfung wurden einzeln lesend ausgeführt, nicht innerhalb einer einzigen durchgehenden
  READ-ONLY-Transaktion. Die Prüfungen und Bestandskennzahlen sind damit einzeln belegt, nicht als ein gemeinsamer
  Zeitpunkt.

Die 21 Regeltests (K1–K9, S1–S5, H-G1–H-G7) in der PostgreSQL-Testdatenbank sind ein eigener Nachweis und nicht mit den
23 Live-Nachprüfungen gleichzusetzen: Die Tests zeigen die Regeln (PostgreSQL 16), die Nachprüfung zeigt die Installation
in der echten Datenbank (PostgreSQL 17.11).

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

## Ablauf (Schritte 1 bis 5 erledigt am 28.11.2026)

1. Merge des PR. 2. `01_vorher.sql` und `03_fingerprints.sql` in der echten Datenbank, Ergebnis mit DB-ID und Zeit ablegen.
3. Einspielen von 0165 und 0166 über Lovable. 4. `02_nachher.sql` und `03_fingerprints.sql`, Ergebnis ablegen.
5. Publish. Danach bleibt alles inaktiv, bis ein Datum für `lab` gesetzt wird (eigener kleiner PR).

Erledigt: Merge (PR #73), Vorher-Prüfung 10/10, Einspielen (Live-IDs 167–169), Nachher-Prüfung 23/23, Publish laut Stephan.
Lab-Aktivierung (Schritt 2b): von Stephan am 28.11.2026 freigegeben; PR mit Migration 0169, Begleitmigration 0170 und
Prüfpaket liegt vor (`docs/p4-lab-aktivierung.md`). Einspielen, Prüfen und Spielabnahme durch Lovable stehen aus.

## Offene Abnahmepunkte (durch Tests nicht ersetzbar)

- Regulärer Ablauf mit einem echten Lab-Dorf: A3–A11 offen, bis in Testau ein Gemeindebau regulär fertig ist
  (`docs/p4-abnahmeprotokoll.md`).
- Sichtprüfung der Stiftungskarte auf Desktop und Mobil: am 28.11.2026 bestanden (A1, A2, A12; Protokoll wie oben).
- Bewertung des Berechtigungsbefunds `sandbox_exec` in der Sicherheitsprüfung.

Erledigt: Vorher- und Nachher-Prüfung in der echten Datenbank mit Live-ID und Hash; neu erzeugte Supabase-Typen.

## Masterplan

Der Stand von P4 steht verbindlich im Masterplan Wirtschaftsumbau v7.0, Abschnitt 3.4 (Nachweismatrix). Der frühere
„Vorschlag für den Masterplan-Nachtrag“ dieses Dokuments ist dort eingearbeitet und entfällt.
