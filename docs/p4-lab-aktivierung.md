# P4 Schritt 2b – Lab-Aktivierung der Stiftungen (Migration 0169)

Stand 28.11.2026. Grundlage: Masterplan Wirtschaftsumbau v7.1, Freigabe Stephan 28.11.2026, 09:05 Uhr.
Regeln und Werte der Stiftungen: `docs/p4-stiftungen.md` (unverändert).

## Was sich ändert

| | vorher (0165) | nachher (0169) |
|---|---|---|
| `stift_since('lab')` (Datenbank) / `stiftSince("lab")` (Client) | 04.01.2100 | **28.11.2026 00:00 UTC** |
| `europe`, `us-west`, `us-east`, `asia` und alle Überlaufkarten (`europe-2` …) | 04.01.2100 | 04.01.2100 (unverändert, abgeschaltet) |

Sonst nichts: keine Regel, kein Stiftungswert, kein Wirtschaftsparameter, keine Tabelle, kein Recht, keine andere
Funktion. 0165–0168 sind nicht angefasst. Keine öffentliche Aktivierung (D7 offen, P6).

- Datenbank: `drizzle/migrations/0169_stiftungen_lab_aktivierung.sql` ersetzt genau `public.stift_since(text)` per
  `CREATE OR REPLACE` (Eigentümer und Rechte bleiben). Vor der Änderung prüft sie den erwarteten Stand und bricht mit
  `P4 0169: …` ab, wenn 0165 fehlt, `lab` auf einem unerwarteten Datum steht oder eine andere Welt nicht auf dem
  Platzhalter steht. Wiederholtes Einspielen ändert nichts.
- Begleitmigration: `0170_begleitmigration_0170.sql` (`SELECT 1;`).
- Client: `src/game/stiftungszeit.ts` – `STIFT_SINCE_LAB`, `stiftSince(realm)`.
- Reihenfolge von Migration und Publish ist unkritisch: die Karte erscheint nur, wenn **beide** Seiten aktiv melden.
  Datenbank vor Client → Karte bleibt bis zum Publish verborgen. Client vor Datenbank → die Übersicht meldet
  `active: false`, Karte bleibt verborgen.
- Nichts wirkt rückwärts: jede Stiftungszeile entsteht nur durch eine Spieleraktion.

## Hashes (drizzle.__drizzle_migrations.hash = SHA-256 der Datei)

| Migration | SHA-256 | `created_at` (Journal `when`) |
|---|---|---|
| 0169_stiftungen_lab_aktivierung | `889ed3397227cdc560cb30c0425959fa796201a2268e287300f76ed11eda6482` | 1795857739857 |
| 0170_begleitmigration_0170 | `17db4fd369edb9244b9f91d9aeed145c3d04ad8ba6e95d06247f07a63527d11a` | 1795857740857 |

Fingerabdruck `md5(pg_get_functiondef('public.stift_since(text)'::regprocedure))`: vorher
`e40b14b32120a70fc281ece9cd273cc4`, nachher `a2d1c129d2f91efa3abb5737525a580f`. Die Fingerabdrücke der 16 übrigen
P4-Funktionen stehen in `docs/sql/0169/02_nachher.sql` und müssen unverändert sein. Sie wurden lokal unter
PostgreSQL 16 ermittelt; live läuft 17.11. Weicht dort eine Zeile „unverändert: …“ ab, während `stift_since` und alle
Schalterzeilen stimmen, ist das zunächst ein Versionsunterschied der Ausgabe, kein Befund der Migration – dann den
Wert notieren und melden, nichts reparieren.

## Prüfpaket (nur lesend, `BEGIN TRANSACTION READ ONLY` … `ROLLBACK`)

- `docs/sql/0169/01_vorher.sql` – vor dem Einspielen: 6 Prüfungen, alle `ok = true`; kein Schalter aktiv.
- `docs/sql/0169/02_nachher.sql` – nach dem Einspielen: 23 Prüfungen, alle `ok = true`; genau ein Schalter aktiv (`lab`);
  Block BESTAND gleich dem Vorher-Ergebnis.

## Rücknahme

Nur auf Anweisung von Stephan, ausgeführt von Lovable als eigene Migration. Stellt den Platzhalter für `lab` wieder her:

```sql
CREATE OR REPLACE FUNCTION public.stift_since(_realm text) RETURNS timestamptz
 LANGUAGE sql IMMUTABLE SET search_path TO 'public'
AS $$ SELECT timestamptz '2100-01-04 00:00:00+00' $$;
```

Folge: neue Aktionen (Öffnen, Einzahlen, Stiften) werden mit `not now` abgelehnt, die Karte verschwindet. Bereits
Gebuchtes bleibt gebucht; eine laufende Stiftungszeit wirkt bis zu ihrem Ende. Eingezahlte Beträge einer offenen Stufe
werden nicht erstattet (Einzahlungen sind endgültig). Der Client braucht dafür keine Änderung.

## Zuständigkeiten und Stand

- Dieser PR liefert Code, Migrationen, Tests, Prüfpaket und Dokumentation. Er spielt nichts ein und aktiviert nichts.
- Einspielen, alle Datenbankabfragen, Publish, Screenshots und die Abnahme im Spiel: ausschließlich Lovable
  (Auftrag unten).
- **Lab gilt erst als aktiviert**, wenn Lovables Nachher-Prüfung 23/23 zeigt, und **als abgenommen**, wenn die
  Spielabnahme A1–A12 auf Desktop und Mobil mit Screenshots vorliegt.
- Stand der Spielabnahme: `docs/p4-abnahmeprotokoll.md` (28.11.2026: A1, A2, A12 bestanden; A3–A11 offen).

## Lokale Tests

`src/lib/stiftung-lab.pg.test.ts` (vollständiges Schema, kein Schalter überschrieben): L1 Schalter je Welt in Datenbank
und TypeScript; L2 Isolation (zehn öffentliche Karten abgelehnt, Lab-Ablauf Öffnen → Einzahlen → Stiften, Kontorpreis
173 statt 204 nur im Lab); L3 keine rückwirkende Buchung; M1 0169 ändert genau `stift_since`, Prüfpaket 6/6 und 23/23;
M2 wiederholbar; M3 Rücknahme; M4 Abbruch bei unerwartetem Stand oder fehlender 0165.
`src/game/stiftung.test.ts`: Schalter im Client. Die Regeln selbst: `src/lib/stiftung.pg.test.ts` (unverändert, 27 Tests).

## Auftrag an Lovable

Siehe `docs/p4-lab-aktivierung-lovable.md`.
