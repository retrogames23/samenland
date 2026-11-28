# Hochzeitspaket – Betrieb: Einspielen, Aktivieren, Vorwärts-Korrektur (Paket C)

Stand (berichtigt am 28.11.2026, Paket M des Masterplans v7.0): in `main` integriert, Migrationen `0160`–`0163` (nach `0159` Finanzintegrität).
**Eingespielt laut Lovable-Begleitcommit `9814824` („Migrations 0159–0164 eingespielt“, 27.11.2026, 13:28 UTC). Nicht aktiviert.**
Die frühere Angabe dieses Dokuments „Nichts davon ist eingespielt“ stammte von vor diesem Commit und ist überholt.
**0159–0164 nie erneut einspielen.** Abschnitt 3 („Einspielreihenfolge“) beschreibt den Ablauf vor dem Einspielen und ist insoweit Geschichte.

| Migration | Stand der Nachweise |
|---|---|
| `0159`–`0163` | eingespielt laut Begleitcommit; neu erzeugte Supabase-Typen im selben Commit enthalten die Objekte des Pakets. **Live-Journal-ID und Hash noch nicht zurückgelesen** (die lesende Abfrage steht aus). **Eine paketeigene Nachher-Prüfung mit dokumentiertem Ergebnis ist im Repository nicht vorhanden**; das Prüfpaket nach `docs/hochzeitspaket.md` wurde nicht erstellt. Eine gesonderte Freigabe zum Einspielen ist nicht dokumentiert. |
| `0164` (Begleitmigration, `SELECT 1;`) | Live-ID 166, Zeitstempel `1795785998705`, SHA-256 `17db4fd369edb9244b9f91d9aeed145c3d04ad8ba6e95d06247f07a63527d11a` (P4-Installationsbericht vom 28.11.2026). |

Mittelbarer Hinweis, kein Ersatz für ID und Hash: In der P4-Vorher-Prüfung vom 28.11.2026 entsprach `purchase_guard` in der echten Datenbank
dem Repository-Stand vor 0165, also dem Stand nach 0162.

Erwartete Journalwerte (SHA-256 der Dateien in `main`, `created_at` = `when` im Migrationsjournal), zum Abgleich mit `drizzle.__drizzle_migrations`:

| Migration | `created_at` | SHA-256 |
|---|---|---|
| `0159_finanzintegritaet_schema_drift` | `1795765179249` | `18fd32a5ddb7dfd31c14a85bf1eb6eade44484c1977f7fd02cb4e33bb27bf572` |
| `0160_hochzeit_anker` | `1795768676950` | `c3fb3fdf6b0edbfa89b02e69715d156786afca204351a0379284432977b48e9c` |
| `0161_hochzeit_belegschutz` | `1795768678640` | `a0a903599bec1cc3d2ab7a168664e5c854e798e34d6e9a7449a4629e41130174` |
| `0162_hochzeit_vollstaendigkeit` | `1795768680345` | `89314dc921979f8182c2e6981dd5abb475b10823737cb362188d496eeb8256e0` |
| `0163_hochzeit_rechte_gates` | `1795768682088` | `89b9b3e23249620e902779873b19325d60adbed3272c46d8f387e57976997aff` |

Die lesende Abfrage dafür liegt bereit: `docs/sql/paket-m_live-journal.sql` (READ ONLY; enthält zusätzlich `0168_restrict_role_lookup`).

Migrationen (bei der Integration nach `main` umnummeriert; unter den früheren Nummern nie eingespielt gewesen): `0159` Finanzintegrität · `0160_hochzeit_anker` (Grundlage Hochzeitspaket + Paket A2) · `0161_hochzeit_belegschutz` (H7) · `0162_hochzeit_vollstaendigkeit` (Paket B) · `0163_hochzeit_rechte_gates` (Paket C: Rechte, RPC-Gates, Vorabprüfung).
Der Umschaltzeitpunkt *T* bleibt der Platzhalter `2100-01-04` (TS `weddingSwitchSince` ↔ DB `wedding_switch_since`).
Die Zielregel (Dom/Universität/Klostergarten) ist weiterhin offen. Ob und wann etwas in die Produktion geht, entscheidet Stephan.

## 1. Was 0161 (H7) und 0163 (Rechte, Client-Wege, Inventar) ändern

| Teil | Änderung | Begründet durch (Aufrufweg) | Test |
|---|---|---|---|
| H7 | Trigger `wedding_receipts_keep` (DELETE je Zeile) und `wedding_receipts_no_truncate` (TRUNCATE): verweigern mit `wedding receipts are kept`. Rechte auf `wedding_receipts`: nur noch `SELECT` für `authenticated` (über RLS) und `service_role` | Geschrieben wird nur über `wedding_receipts_book` / `wedding_settle` (SECURITY DEFINER, Eigentümer `postgres`). Kein Client und kein Server schreibt direkt | `paket-c.pg.test.ts` C-H7 |
| CASCADE | **bleibt.** Ein DELETE wird zugelassen, wenn das Dorf (`seeds`-Zeile) schon weg ist – also genau beim FK-CASCADE aus `abandon_village` und `purge_user_data` | Entscheidung: keine Archivarchitektur | C-H7 CASCADE |
| Rechte | `village_weddings(uuid,timestamptz)`: PUBLIC/anon/authenticated entzogen. `claim_visit(uuid,uuid)`: PUBLIC/anon entzogen | `village_weddings`: kein Client-Aufruf, intern nur aus DEFINER-Funktionen. `claim_visit`: nur angemeldeter Client (`Game.tsx`) | C-R |
| Client-Wege | `civic_raise_budget_v2(…, _client)` und `resource_overview_v2(…, _client)`; alte Signaturen leiten bis *T*−7 Tage an v2 weiter, danach `client outdated`. `client_protocol_min()`=2, `client_gate_lead()`=7 Tage, `client_gate_open(seed)` | Die einzigen direkt erreichbaren RPCs, die Ressourcen buchen und `pending` kennen | C-K, `client-rpc-registry.test.ts` |
| Inventar | `wedding_activation_inventory()` (nur lesend, nur `service_role`) | Vorabprüfung, Abschnitt 4 | C-I |

**Folge für Datenkorrekturen:** Ein einzelner Beleg lässt sich nicht mehr löschen, auch nicht mit dem Service-Key. Der
Tabelleneigentümer könnte die Trigger ausdrücklich abschalten (`ALTER TABLE … DISABLE TRIGGER` oder
`session_replication_role = replica`). Das ist **kein** vorgesehener Betriebsweg: Er würde Kasse und Nachweis
rückwirkend verändern, und `wedding_settled_at` gilt danach als unvollständig (Test B13).

**Datenverlust durch CASCADE (bewusst, dokumentiert):** Wird ein Dorf gelöscht – Dorfaufgabe durch den Spieler
(`abandon_village`) oder Kontolöschung bzw. Inaktivitäts-Bereinigung (`purge_user_data`) –, gehen seine Hochzeitsbelege,
sein Vollständigkeitsnachweis (`wedding_settlement`) und ein Quarantäne-Datensatz unwiederbringlich mit verloren.
Die Aufbewahrungsfrage ist offen und nicht technisch entschieden.

## 2. Alle direkten Client-Wege (vollständige Liste)

Quelle: `src/lib/client-rpc-registry.ts`. Zwei Tests halten die Liste vollständig:
- statisch: jeder RPC-Name und jeder Tabellenschreibzugriff im Client-Code;
- gegen die Datenbank: jede VOLATILE-Funktion, die `authenticated`/`anon` ausführen dürfen, und jede Tabelle, die
  `authenticated` wirksam beschreiben darf (Recht **und** RLS-Policy), auch wenn der heutige Client sie nicht aufruft.

| Weg | Geld/Ressourcen | pending möglich | Schutz |
|---|---|---|---|
| RPC `civic_raise_budget_v2` | Ressourcen (Kontor-Budget) | ja | Protokoll ≥ 2; `resource_refresh_try` vor jeder Änderung, `pending` bricht ohne Teilbuchung ab; Client `retryOnPending` |
| RPC `civic_raise_budget` (alt) | Ressourcen | ja | bis *T*−7d Weiterleitung an v2, danach `client outdated` vor jedem Zugriff |
| RPC `resource_overview_v2` | Ressourcen (bucht fällige Tage) | ja (`pending: true`) | Protokoll ≥ 2; bei pending wird nichts gebucht |
| RPC `resource_overview` (alt) | Ressourcen | ja | wie `civic_raise_budget` (alt) |
| RPC `civic_open` | keins (legt Stufe mit Budget an) | nein | nur das eigene Dorf |
| RPC `claim_visit`, `claim_referral`, `claim_wonder`, `princely_audience` | Einnahme | nein | nur angemeldet; Einnahmen ohne Kassenprüfung, Kassendeckel |
| RPC `princely_knight`, `princely_swap`, `rename_seed`, `send_letter`, `survey_submit`, `touch_activity`, `update_mayor` | keins | nein | nur angemeldet / eigenes Dorf |
| RPC `abandon_village` | Löschung (CASCADE) | nein | nur das eigene Dorf |
| RPC `princely_errand` | **unbekannt** | ? | Siehe Abschnitt 8: in keiner Migration |
| Tabelle `purchases`, `gifts`, `twin_works`, `building_moves` | Ausgabe | ja | Wächter → `wedding_money_check`; Client `prepareSpend` → `settleTreasury` (Gate für alte Clients ab *T*−7d) |
| Tabelle `market_sales`, `quest_claims` | Einnahme | nein | Wächter; keine Kassenprüfung |
| übrige Tabellen (Chat, Lesemarken, Wegweiser, Hunde, Gründung …) | keins | nein | RLS / Wächter |

Begegnungen, Hochzeitsbuchung und Kassenabrechnung laufen nur auf dem Server (`service_role`).

## 3. Reihenfolge des Einspielens (erst nach Stephans Freigabe)

Grundlage sind die echten Dateien im Journal: `0159_finanzintegritaet_schema_drift`, `0160_hochzeit_anker`,
`0161_hochzeit_belegschutz`, `0162_hochzeit_vollstaendigkeit`, `0163_hochzeit_rechte_gates`. Keine bereits
eingespielte Migration verändert. Vorher lesend feststellen, welche Migration live zuletzt eingespielt ist; alles
dazwischen (z. B. 0147–0158) muss **vorher** und in Journal-Reihenfolge eingespielt sein.

1. **Vorher lesend prüfen** (Prüfpaket nach Masterplan 3.2):
   - Live-Definition von `village_wedding_list` = Text aus 0107 (0160 ersetzt sie).
   - Live-Definitionen von `purchase_material`, `resource_overview`, `civic_raise_budget` = Repo-Stand
     (0162 und 0163 patchen sie und brechen bei Abweichung kontrolliert ab).
   - `princely_errand` und `build_mail` lesend ansehen (Abschnitt 8).
2. **Migrationen 0159 → 0160 → 0161 → 0162 → 0163**, jede **atomar** als ganzes Skript (SQL-Editor führt ein Skript als eine
   Transaktion aus; sonst `BEGIN; … COMMIT;` oder `psql --single-transaction`). Nach jeder Migration lesend prüfen,
   ob ihre Objekte da sind (Checkliste Abfrage 1, Abfrage 9).
   - Bricht eine Migration ab: **nicht** weitermachen, keine Teil-Reparatur, Befund melden (Abschnitt 6).
   - Bereits eingespielte Migrationen **nie erneut** einspielen. Lokal geprüft (Log `migration_rerun.log`):
     - 0159, 0160, 0161 und 0163 laufen ein zweites Mal durch und lassen den Katalog unverändert.
     - 0162 bricht nach 0163 kontrolliert ab und wird ganz zurückgerollt.
3. **Schema-Cache neu laden:** `NOTIFY pgrst, 'reload schema';`. Danach prüfen, dass PostgREST
   `civic_raise_budget_v2` und `resource_overview_v2` anbietet. **Lokal nicht geprüft** (Abschnitt 7).
4. **Server und Client gemeinsam ausliefern** (ein Deploy dieses Branches). Server und Client kommen aus demselben
   Build; der Client ruft nur die v2-Namen.
5. **Sweep und Inventar:** Sweep je Karte erst trocken, dann `apply`, Charge für Charge (`/api/public/wedding-sweep`).
   Bei `halted` oder `errors` stoppen. Danach die Checkliste `docs/sql/hochzeit_vorabpruefung.sql` (nur lesend).
6. **Erst danach** ein eigener PR für den echten Umschaltzeitpunkt (Abschnitt 5).

### Zeitfenster und alte Stände

| Zustand | Was passiert | Bewertung |
|---|---|---|
| Neue Migrationen, **alter Server/Client** (zwischen 2 und 4) | Alte Clients rufen `resource_overview`/`civic_raise_budget` (alt): Weiterleitung an v2, weil *T*=2100. Geld-Wächter rechnen mit `wedding_money_check`; vor *T* nie pending (B13). Der alte Server schreibt Schattenbelege direkt per Upsert: ab 0163 fehlt ihm das Recht, er protokolliert den Fehler und bucht nichts. Vor *T* zählen Schattenbelege nicht für Geld; der Sweep holt sie nach | sicher, solange *T* weit weg ist |
| **Neuer Code vor den Migrationen** | Der Client ruft v2-Funktionen, die es noch nicht gibt; der Server ruft `wedding_receipts_book`/`wedding_settle`/`resource_refresh_try`, die es noch nicht gibt → Fehler; Kassen-Sync fail-closed | **verboten** – darum erst Migrationen, dann Code |
| Migrationen da, **Schema-Cache alt** | PostgREST kennt v2 nicht → 404 für die Budget-Erhöhung und die Ressourcenanzeige im neuen Client | Schritt 3 vor Schritt 4; ungetestet |
| Alter Server-Isolate läuft nach dem Deploy weiter (Cloudflare) | Geldwege sind DB-geschützt (Wächter, `wedding_money_check`, H7-Rechte). Vor *T* bucht er höchstens Schattenbelege nicht | sicher vor *T* |
| Alte Browser-Tabs nach dem Deploy | bis *T*−7d wie oben; ab *T*−7d lehnen die Server-Gates (`settleTreasury`, `decideEncounter`, `callNothilfe`) und die alten RPC-Signaturen ab, der Tab lädt neu | Restgrenze: ein alter Tab kann kurz alte Texte zeigen |

## 4. Vorabprüfung (Inventar/Sweep)

Datei: `docs/sql/hochzeit_vorabpruefung.sql`. Nur lesend; erwartete Ergebnisse stehen über jeder Abfrage. Lokal mit
Testdaten ausgeführt (Test C-I, Ergebnis `vorabpruefung_testlauf.json`). **Keine produktive Inventarabfrage, kein
Live-Sweep in diesem Paket.**

Klassen (`wedding_activation_inventory`):

| Auftrag | Klasse | Status | blockiert? |
|---|---|---|---|
| vollständig | `verankert`, alle fälligen Hochzeiten gebucht | `bereit` | nein |
| vollständig (noch keine Hochzeit möglich) | `ohne_belege`, jünger als 2 Tage | `jung` | nein |
| vollständig, Sweep holt nach | `verankert`, eine fällige Hochzeit ungebucht | `nachholen` | nein; nach zwei Sweeps noch da → ja |
| rekonstruierbar | `alt_rekonstruierbar`, `ohne_belege` älter als 2 Tage | `blockiert` | ja, bis der Sweep sie verankert hat |
| widersprüchlich | `widerspruechlich` | `blockiert` | ja – von Hand klären, nichts reparieren |
| Quarantäne | `quarantaene` | `blockiert` | ja – von Hand klären |

Die Aktivierung ist blockiert bei jeder Zeile in Abfrage 3, jeder offenen Quarantäne (Abfrage 5), jeder Abweichung
außer `fehlt` (Abfrage 6), jedem nicht klassifizierten Dorf (Abfrage 7) und bei falschen Rechten (Abfrage 8).

## 5. Aktivierungs-Checkliste (nicht ausgeführt, kein Datum gesetzt)

Alle Punkte müssen erfüllt sein. Jeder Punkt ist ein Stopp-Kriterium.

1. [ ] Stephan hat die Zielregel (H1) entschieden und die Aktivierung ausdrücklich freigegeben.
2. [ ] 0159–0163 sind eingespielt; Checkliste Abfrage 1 und 9 wie erwartet; Schema-Cache neu geladen.
3. [ ] Dieser Code-Stand ist **mindestens 20 Tage vor *T*** live (Server und Client).
4. [ ] Sweep beider Karten mit `apply` vollständig, ohne `halted`/`errors`.
5. [ ] Checkliste vollständig wie erwartet: keine Blocker, keine Quarantäne, keine unerklärte Abweichung, jedes Dorf klassifiziert.
6. [ ] Ein eigener PR mit einer **neuen** Migration (nächste freie Nummer) setzt `wedding_switch_since` und die
       TS-Konstante `weddingSwitchSince` gemeinsam auf dasselbe *T* in der Zukunft. Vorher geprüft: kein Beleg mit `occurred_at ≥ T`.
7. [ ] *T* ist so gewählt, dass das 7-Tage-Gate (*T*−7d) erst nach dem Deploy aus Punkt 6 beginnt. Zwischen Migration
       und Deploy aus Punkt 6 wird *T* nicht erreicht.
8. [ ] Ab *T*−7d: alte Clients werden abgewiesen bzw. neu geladen. Ein Nachweis „keine alten Tabs mehr“ ist **nicht**
       erforderlich: Die Datenbank schützt die Geldwege.
9. [ ] Nach *T*: Checkliste erneut (lesend); bei Befund → Abschnitt 6.

## 6. Vorwärts-Korrektur (keine automatische Reparatur, keine destruktive Rück-Migration)

Grundsätze: Daten werden nie automatisch rekonstruiert. Belege werden nie gelöscht oder überschrieben. Korrekturen
laufen nur über neuen Code oder eine neue Migration mit der nächsten freien Nummer.

| Lage | Vorgehen |
|---|---|
| Fehler im Server-/Client-Code, Schema in Ordnung | **Redeploy** (vorheriger oder korrigierter Stand). Die Migrationen bleiben. Vor *T* ist ein Rückschritt auf den alten Code ohne Geldfolgen (Schattenbelege). Nach *T* darf kein Stand vor diesem Paket mehr live gehen (er kann keine Version-2-Belege schreiben → Kassen-Sync stoppt fail-closed) |
| Fehler in einer Funktion der Datenbank | **Neue Vorwärts-Migration**, die die Funktion ersetzt; nie 0160–0163 ändern oder zurückdrehen |
| Migration bricht beim Einspielen ab | Atomar eingespielt → nichts geändert. Befund (Fehlermeldung, abweichende Live-Definition) melden; Korrektur als neue Migration oder angepasster PR **vor** dem Einspielen. Code nicht ausliefern |
| Teilweise eingespielt (z. B. 0160–0162 live, 0163 nicht) | Code dieses Branches **nicht** ausliefern (der Client braucht v2). Der alte Code läuft auf 0160–0162 vor *T* sicher weiter. 0163 nachholen, dann Code |
| Quarantäne-Fälle | Dorf bleibt in Quarantäne, Kassen-Sync und Hochzeitsantwort dieses Dorfes stoppen fail-closed. Von Hand klären, Freigabe nur mit Begründung (`wedding_quarantine_release`). Nie nachbuchen oder erfinden |
| Alte Server weiter aktiv | Vor *T* unkritisch. Nach *T* schreiben sie keine Belege (Version-1-Belege nach *T* verweigert der Wächter; direktes Schreiben fehlt das Recht). Ihre Geldwege prüft die Datenbank. Gegenmittel: Deploy erzwingen, alte Versionen in Cloudflare zurückziehen (Stephan) |
| *T* muss verschoben werden | Vor *T*: neue Migration + TS-Konstante zurück auf den Platzhalter. Nach *T*: keine Rückabwicklung, nur ein späteres *T₂* mit neuer Version |

## 7. PostgREST: nicht ausgeführt

Eine echte lokale PostgREST-Integration war in dieser Umgebung **nicht ausführbar**. Das Ausführen des offiziellen
PostgREST-Binärprogramms wurde von der Sandbox-Richtlinie verweigert; ein Supabase-Stack (Docker) ist hier nicht
verfügbar. Alle Tests dieses Pakets sind **PostgreSQL-Tests**: echte Rollen, RLS, `auth.uid()` über eine Test-Ersatzfunktion,
Supabase-Standardrechte nachgebildet. Sie sind keine PostgREST-Tests.

Deshalb **nicht getestet**:
- HTTP-Aufrufe `POST /rpc/civic_raise_budget_v2` und `/rpc/resource_overview_v2` mit Anon-Key + Spieler-JWT;
  Abbildung JWT → Rolle `authenticated` und `auth.uid()`.
- Sichtbarkeit neuer Funktionen nach `NOTIFY pgrst, 'reload schema'` und das Verhalten mit altem Schema-Cache.
- Auflösung der Funktionsnamen durch PostgREST (die eigenen Namen statt Überladungen sollen Mehrdeutigkeit
  vermeiden; der Test prüft nur, dass es je Name genau eine Signatur gibt).
- Dass anon über HTTP keine Hochzeits-RPC und keine Schreibvorgänge auf `wedding_receipts` erreicht.
- Dass die Fehlermeldungen (`client outdated`, `wedding settlement pending`, `wedding receipts are kept`) unverändert
  im `message`-Feld der PostgREST-Antwort ankommen. Der Client erkennt `pending` am Text.
- `DELETE`/`PATCH` auf `/wedding_receipts` mit dem Service-Key (erwartet: 401/403 „permission denied“).

Nachholen: lokal mit `supabase start` (Supabase CLI, Docker) gegen eine Kopie des Schemas oder mit dem PostgREST-Binary,
wenn Stephan es zulässt. Niemals gegen die produktive Instanz.

## 8. Risiken und ungeprüfte Punkte

- **Schema-Drift:** `princely_errand` (Funktion, vom Client aufgerufen) und `build_mail` (Tabelle, vom Client
  beschrieben) stehen in den generierten Typen, werden aber von **keiner** Migration angelegt. Ihre Rechte und ihr
  Geldverhalten sind lokal nicht prüfbar. (`princely_errands` legt seit 0159 eine Migration an.)
- **Rechte live unbekannt:** Die Supabase-Standardrechte sind nachgebildet. Die echten ACLs der Produktion wurden nicht
  gelesen. Die REVOKEs in 0163 wirken unabhängig davon; nur zusätzliche Live-GRANTs außerhalb des Repos wären nicht erfasst.
- **Rest-GRANTs ohne PostgREST-Weg (unverändert gelassen):** `anon`/`authenticated` haben auf fast allen Tabellen
  TRUNCATE, REFERENCES und TRIGGER sowie Schreibrechte, die RLS ohne Policy wirkungslos macht (Supabase-Standard).
  PostgREST bietet kein TRUNCATE an; wirksam ist nur, was die Policies erlauben (Rechteübersicht, Spalte „wirksam“).
  Ein pauschaler Entzug ohne Aufrufweg war nicht Auftrag.
- **anon-ausführbare DEFINER-Funktionen (unverändert):** `has_role` (für RLS nötig), `road_done`, `tax_receipt_start`,
  `village_raids`. Alle sind STABLE, nur lesend und aus öffentlich lesbaren Daten abgeleitet.
- **Erledigt durch Migration 0159 (Finanzintegrität):** `abandon_village` und `purge_user_data` löschen keine
  Gegenbuchungen anderer Spieler mehr (Geschenke, Besuche, Empfehlungen, Partnerwerke).
- Die DB-Gate-Konstanten (`client_protocol_min`, `client_gate_lead`) müssen mit `src/lib/client-protocol.ts` gemeinsam
  geändert werden (Test C-K vergleicht sie).
- Datums- bzw. uhrzeitabhängige Fehlschläge in `civic.pg.test.ts`, `resources.pg.test.ts`, `steingrube.pg.test.ts` und
  `steingrube-platz.pg.test.ts` bestehen unverändert. Beim Lauf um etwa 01 Uhr UTC waren es 12; dieselben 12 schlagen
  zur selben Zeit auch auf `eafa73d` fehl (Log `baseline_eafa73d_datumsabhaengig.log`). Mit Paket C haben sie nichts zu tun.
