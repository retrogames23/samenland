# Hochzeitspaket – doppelte Buchführung beenden

Stand 26.11.2026 · Branch `claude/hochzeitspaket` · Migration `0159_hochzeitspaket`

## 1. Read-only-Audit (Ergebnis)

| Baustein | Befund |
|---|---|
| `wedStage` (weddings.ts) | Gesundheitsseite zählt nur Kräuterhütte + Heiler; Nahrung = `FOOD_CRAFTS` (4). Aufrufer: `wedPop`, `wedGapHours`, `weddingDates` (→ economy.ts Kassenprognose, people.ts Hochzeitszug, chronicle.ts, encounters.ts `weddingLive`, sickness.ts `festJoy`, wedding-receipts.ts, Simulation). |
| `village_wedding_list` (0107) | Exakte SQL-Kopie der alten Regel (Käufe je Artikel per `min(created_at)`), Mitgift aus `village_civic_wealth` (0044 + In-place-Patches 0046/0050). |
| Leser der SQL-Hochzeiten | `village_balance_walk` (0118, Kasse ab 12.11.2026), `village_weddings` → `_fast` (0096/0107) → `encounter_guard` (0141, Fenster 3 h), `village_weddings_legacy` (nur vor 12.11., Sechs-Artikel-Liste), `wedding_receipt_diff` (0127). |
| Belege | `wedding_receipts` (0127): PK `(seed_id, wedding_index)`, UNIQUE `(seed_id, occurred_at)`, nur `service_role` schreibt; geschrieben von `settleWeddings` beim Kassen-Sync des Eigentümers. Bisher reiner Schatten. |
| `receipt_at IS NULL` | Die SQL-Rechnung kennt eine Hochzeit, für die noch kein Beleg geschrieben wurde. Belege entstehen nur beim Kassen-Sync des Eigentümers; die 84 Dörfer sind Dörfer, deren Spieler seit ihrer letzten Hochzeit nicht mehr synchronisiert haben. Kein Fehler, sondern „noch nicht abgerechnet“. |
| Lab | `weddingReceiptRows` schreibt für `lab` keine Belege (Steuerpult-Testhochzeiten). |
| Tests vorher | `weddings.test.ts`, `wedding-receipts.test.ts`, `wedding-crowd.test.ts`; **kein** Test gegen das echte SQL. |

**Kernbefund:** Die vereinbarte neue Regel (Gemeinwesen + Dom/Universität/Klostergarten wie im Pflege-Tor) hängt beim Dom und bei der Universität an der **physischen Fertigstellung** von Abschnitt 3 (`cathedralDone`/`universityDone`: Bauketten mit Sägekuhle, Zunftturm, Arbeitszeitfenster, Segnungen). Das ist in SQL nicht exakt nachbaubar. Eine SQL-Kopie der neuen Regel wäre also wieder eine zweite Rechnung, die nur ungefähr gleich ist.

Nebenbefund: `village_civic_wealth` (Mitgift) wird nicht mit TS verglichen, weil Straßen (`road_done` ↔ `civicRoads`) nicht im Testaufbau sind. Live ist das durch `weicht_ab = 0` gedeckt; ändert sich hier nicht.

## 2. Umsetzung

**Eine Regel, eine Rechnung.** Ab einem Umschaltzeitpunkt *T* je Karte (`weddingSwitchSince(realm)` ↔ `wedding_switch_since(realm)`, geprüft gegen den Zeitpunkt der Hochzeit selbst):

- **Gesundheitsseite = Gemeinwesen-Zählung des Pflege-Tors:** `gemeinwesenGate` (ab `gemeinwesenSince` die fünf Gemeinwesen Kräuterhütte, Heiler, Bibliothek, Badestube, Beginenhof; davor Kräuterhütte, Heiler, Bibliothek) **plus** `careHealthExtra` (Dom Abschnitt 3 fertig gebaut, Universität Abschnitt 3 fertig gebaut, Klostergarten ab bezahltem Abschnitt 2 ohne Kräuterhütte). Belege: die Zurückstellung in `gemeinwesen.ts`/AGENTS.md („moves to gemeinwesenGate“) und die Spielertexte in `i18n.ts` („zählt als Gemeinwesen-Einrichtung“ bei Dom 3, Universität 3, Klostergarten 2).
- **Nahrungsseite bleibt `FOOD_CRAFTS`.** Beleg: AGENTS.md („FOOD_CRAFTS for every money-bearing count (TAX_FOOD, weddings)“, „weddings keep their own FOOD list“). Keine neue Gewichtung übernommen.
- **Nur TypeScript rechnet** (`weddingCalendar`). Der vertrauenswürdige Server friert jede Hochzeit als Beleg ein (Version 2). Die Datenbank liest ab *T* **nur Belege**: `village_wedding_list` rechnet die alte Regel bis vor *T* (wörtlich wie 0107) und liefert danach die Belege. Damit folgen Kasse (`village_balance_walk`), `village_weddings` und `encounter_guard` gleichzeitig, ohne dass sie selbst geändert werden.
- **Vor *T* ändert sich nichts:** alte Regel in TS (eingefrorene Referenz im Test) und SQL identisch; die erste Hochzeit nach *T* behält ihren Zeitpunkt (die Lücke wird bei der Hochzeit davor festgelegt).
- *T* steht für alle Karten auf dem **Platzhalter 2100-01-04**. Nach dem Merge ist das Paket wirkungslos, bis die Daten freigegeben werden.

Geänderte/neue Dateien: `src/game/weddings.ts`, `src/game/wedding-receipts.ts`, `src/game/gemeinwesen.ts` (Kommentar), `src/lib/treasury.server.ts` (`settleWeddings`), `src/lib/encounter.server.ts` (Beleg vor Hochzeitsantwort), `src/lib/wedding-sweep.server.ts`, `src/routes/api/public/wedding-sweep.ts`, `drizzle/migrations/0159_hochzeitspaket.sql` (+ Journal/Snapshot), AGENTS.md ×2, Tests.

## 3. Sicherheits- und Migrationskonzept

**Transaktional / Batches.** Der Sweep (`POST /api/public/wedding-sweep`, Cron-Secret) lädt eine Karte einmal und bearbeitet je Aufruf höchstens 25 Dörfer (max. 100) in ID-Reihenfolge. Je Dorf ist das Schreiben ein einziges `INSERT … ON CONFLICT DO NOTHING` (≤ 500 Zeilen, praktisch 1–3) und damit atomar. Standard ist der Probelauf (`apply` fehlt → nur Bericht).

**Parallele Aufrufe.** PK `(seed_id, wedding_index)` + `ignoreDuplicates`: ein zweiter Schreiber kann denselben Index nicht noch einmal anlegen. UNIQUE `(seed_id, occurred_at)` verhindert zwei Belege für denselben Zeitpunkt. Sync, Hochzeitsantwort und Sweep dürfen gleichzeitig laufen (getestet mit drei parallelen Sweeps und fünf parallelen Transaktionen auf echtem PostgreSQL).

**Vorhandene Belege schützen.** Gesendet werden nur Indizes ohne Beleg (`missingReceipts`). Weicht ein vorhandener Beleg vom Kalender ab (`receiptMismatches`), wird für das Dorf **nichts** geschrieben und der Sweep hält an (`halted`, HTTP 409). Neuer DB-Trigger `wedding_receipts_guard`: `UPDATE` ist verboten, Belege mit Zeitpunkt in der Zukunft werden abgewiesen. Löschen bleibt nur über die bestehende Dorf-Löschung (CASCADE) möglich.

**Teilabbruch.** Ein Fehler beendet den Aufruf mit `errors` und `next` = letztes vollständig erledigtes Dorf. Wiederaufnahme mit `after: next` oder einfach von vorn: Bereits gebuchte Belege werden erkannt und übersprungen.

**Nachweis 202 Dörfer.** `select * from wedding_receipt_inventory()` (nur `service_role`, lesend) liefert je bewohntem Dorf `belege, fehlt, weicht_ab, luecken, doppelt`. Ziel: für alle Zeilen `fehlt = weicht_ab = luecken = doppelt = 0`. Dazu ein zweiter Sweep-Probelauf mit `missing = 0` je Karte.

**Sicher stoppen.**
- Vor *T*: Datum zurück auf 2100-01-04 (TS-Konstante + Migration). Ohne Wirkung auf Geld.
- **Sperre gegen falsche Reihenfolge beim Ausrollen:** `settleWeddings` fragt `wedding_switch_since` der Datenbank ab. Stimmen TS und DB nicht überein (ein Deploy fehlt), werden nur Hochzeiten **vor dem früheren** der beiden Daten gebucht, und der Sweep hält mit `switchMismatch` an. So kann kein Beleg unter der falschen Regel eingefroren werden.
- Nach *T*: keine Rückabwicklung gebuchter Belege; Fehler werden vorwärts behoben (siehe 6).

**Lab.** Vor seinem *T* zahlt im Lab weiter die SQL-Rechnung (keine Belege). Ab *T* schreibt der Server Lab-Belege aus dem reinen Kalender (`weddingCalendar`, ohne Steuerpult-Testhochzeit).

**Gutschriften ohne Dorf-Sperre.** Wie `tax_receipts` sind Hochzeitsbelege Einnahmen; ein gleichzeitiger Kauf sieht im ungünstigsten Fall eine Mitgift noch nicht. Das ist die sichere Richtung (nie zu viel Geld).

**Bewusste Folge nach *T*:** Eine Mitgift zählt erst, wenn ihr Beleg geschrieben ist (beim nächsten Kassen-Sync des Spielers, bei der Hochzeitsantwort oder beim Sweep), genau wie heute die Steuertage. Für abwesende Spieler empfehle ich nach *T* einen täglichen Sweep (Entscheidung D3).

## 4. Tests

| Test | Inhalt | Ergebnis |
|---|---|---|
| `src/game/hochzeitspaket.test.ts` (neu, 13) | eingefrorene Kopie der alten Regel: 160 Kombinationen (0–4 Nahrung × alle 32 Gemeinwesen-Teilmengen) vor *T* identisch; Dom/Universität/Klostergarten; alle Stufen nach *T*; `wedStage = careStage` bei gleicher Nahrung; erste Hochzeit nach *T* unverändert; Version 1/2; Lab | grün |
| `src/game/wedding-receipts.test.ts` (erweitert) | fehlende/abweichende Belege, Lab ab *T* | grün |
| `src/lib/wedding-sweep.test.ts` (neu, 9) | echtes `settleWeddings` gegen In-Memory-Tabelle mit PK/UNIQUE: Probelauf schreibt nichts; fehlende genau einmal; vorhandene bytegleich; Wiederholung bucht nichts; drei parallele Sweeps; Abbruch + Wiederaufnahme; Abweichung hält an; Sperre bei abweichendem Umschaltdatum; Zustand vor 0159 | grün |
| `src/lib/hochzeitspaket.pg.test.ts` (neu, 8, echtes PostgreSQL 16) | Parität SQL ↔ TS für 162 Dörfer (alle Kombinationen, Charta, Ränge, Titel, Prestige); 0159 = 0107 bei Platzhalter (Liste, Kassen-Walk, Guard-Eingabe); über *T* hinweg TS-Belege = SQL-Liste (auch Lab, unbewohnt); *T* aktiv: Walk/`village_weddings`/`encounter_guard` folgen nur Belegen; Unveränderlichkeit, Zukunft, Doppelbuchung parallel; Inventur meldet fehlt/weicht_ab | grün |
| Mutationsprobe | alte Regel in TS absichtlich um Bibliothek erweitert → 3 Tests schlagen an (Parität SQL, Referenz, Regel) | wie erwartet |
| Gesamtsuite `npx vitest run` | 262 Dateien, 1824 Tests (DB-Tests übersprungen) | grün |
| Alle DB-Tests seriell mit PostgreSQL | 14/16 Dateien grün; `civic.pg.test.ts` (4) und `resources.pg.test.ts` (1) rot – **identisch auf unverändertem main** (Uhrzeit-/Datumsabhängigkeit, nicht Teil dieses Pakets) | s. Bericht |
| `tsc --noEmit`, `vite build` | | grün |
| ESLint | nur Prettier-Formatierung, wie im übrigen Bestand | – |

## 5. TypeScript/SQL-Parität

- **Vor *T*:** gleiche Regel, getestet mit echtem SQL für 162 Dörfer und 160 Kombinationen; die Mutationsprobe zeigt, dass ein Abweichen auffällt.
- **Ab *T*:** SQL rechnet keine Hochzeit mehr, es liest die von TS geschriebenen Belege. End-to-end-Test: `village_wedding_list` über *T* hinweg = `weddingCalendar` (Zeitpunkt und Mitgift jeder Hochzeit). Damit gibt es keine zweite Fassung der neuen Regel, die auseinanderlaufen könnte.
- `wedding_switch_since` in 0159 = `WEDDING_SWITCH_*` in weddings.ts (Test liest beide).

## 6. Produktionsausführung (erst nach Stephans Prüfung und ausdrücklicher Freigabe)

Karten: `us-west`, `us-west-2`, `us-east`, `us-east-2`, `europe`, `europe-2`, `europe-3`, `europe-4`, `asia`, `asia-2`, `lab`.

1. **Merge + Migration 0159 einspielen** (Freigabe 1). Danach prüfen:
   `select public.wedding_switch_since('europe'), public.wedding_switch_since('lab');` → beide 2100-01-04.
   `select count(*) filter (where weicht_ab > 0) as abw, count(*) filter (where fehlt > 0) as offen from public.wedding_receipt_inventory();` → `abw = 0`, `offen` ≈ 84.
2. **Probelauf je Karte** (schreibt nichts):
   `curl -sX POST https://<app>/api/public/wedding-sweep -H "Authorization: Bearer $LOVABLE_CRON_SECRET" -H "Content-Type: application/json" -d '{"realm":"europe"}'`
   Mit `"after":"<next>"` wiederholen, bis `next` null ist. Erwartung: `halted` null, `errors` leer, Summe `missing` = Summe `fehlt` aus Schritt 1. Bei `halted`: **Stopp**, Dorf melden.
   (Das Cron-Secret verwaltet Lovable. Falls es dir nicht zugänglich ist, kann Lovable den Aufruf einmalig auslösen.)
3. **Abrechnungssweep** (Freigabe 2): wie 2 mit `"apply":true`, Karte für Karte, Schleife über `next`.
4. **Nachweis:** `select * from public.wedding_receipt_inventory() where fehlt + weicht_ab + luecken + doppelt > 0;` → 0 Zeilen. Treffer nur mit `fehlt` bei Hochzeiten der letzten Minuten → Schritt 3 für diese Karte wiederholen. Danach Probelauf je Karte: `missing = 0`.
5. **Umschaltung Lab** (Freigabe 3): ein PR mit neuer Migration (`CREATE OR REPLACE FUNCTION public.wedding_switch_since` mit Lab-Datum) **und** gleichem Wert in `WEDDING_SWITCH_LAB_SINCE`. Das Datum muss **mindestens 24 h nach** dem Ausrollen von Code und Migration liegen, auf einem UTC-Tagesbeginn. Die Sperre verhindert Fehlbuchungen auch bei falscher Reihenfolge; der Abstand verhindert, dass Anzeige und Buchung kurz auseinanderlaufen. Einige Tage beobachten: Inventur sauber, Hochzeitsantwort im Lab spielbar.
6. **Umschaltung öffentliche Karten** (Freigabe 4): wie 5 mit `WEDDING_SWITCH_SINCE`. Vorher Schritt 4 wiederholen. Danach täglichen Sweep einrichten (Entscheidung D3).

## 7. Rollback und Wiederanlauf

- **Vor *T*:** Migration/Code zurücknehmen oder Datum wieder auf 2100-01-04 setzen. Kein Geld bewegt sich, weil vor *T* die SQL-Rechnung zahlt und die Belege nur Schatten sind.
- **Sweep-Abbruch:** jederzeit gefahrlos; mit `next` oder von vorn neu starten.
- **`halted` (Abweichung):** Dorf nicht anfassen, Beleg und Kalender vergleichen (`wedding_receipt_diff`), Ursache klären. Kein automatisches Überschreiben, auch nicht manuell (Trigger).
- **`switchMismatch`:** Ein Deploy fehlt (Code oder Migration). Fehlenden Teil ausrollen und Sweep neu starten.
- **Nach *T* ein Fehler in der neuen Regel:** Belege nach *T* bleiben gültige Buchungen (keine rückwirkende Änderung). Korrektur vorwärts: neue Regelversion ab einem späteren Zeitpunkt *T₂* nach demselben Muster (Version 3, Migration mit Erklärung). Notbremse für neue Belege: Datum *T* in beiden Teilen auf einen Zeitpunkt nach heute verschieben, aber nur, solange nach dem alten *T* noch keine Hochzeit gebucht wurde (Inventur: keine Belege mit `occurred_at ≥ T`). Sonst ist *T₂* der Weg.

## 8. Entscheidungen für Stephan

- **D1** Dom, Universität und Klostergarten zählen für die Hochzeitsstufe genau wie im Pflege-Tor (`careHealthExtra`). Begründung siehe 2. Alternative wäre: nur die fünf Gemeinwesen.
- **D2** Umschaltdaten Lab und öffentliche Karten (Platzhalter bis dahin).
- **D3** Täglicher Sweep nach *T* (Cron wie idle-sweep), damit Mitgiften abwesender Spieler zeitnah gebucht werden.
- **D4** Ob `encounter_guard` künftig nur „große“ Hochzeiten (`is_grand`) annimmt, wie es der Client anzeigt. Heute prüft der Guard das nicht; das Paket ändert es bewusst nicht.
