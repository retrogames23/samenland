-- Hochzeitspaket – Vorabprüfung vor der Aktivierung (Paket C, Abschnitt 8)
-- NUR LESEND. Ausführen erst, wenn Stephan es für die Produktion ausdrücklich freigibt; bis dahin nur lokal mit
-- Testdaten (paket-c.pg.test.ts führt genau diese Datei aus, Test „C-I“).
-- Ausführung: als service_role bzw. im SQL-Editor, am besten in einer Nur-Lesen-Transaktion:
--   BEGIN READ ONLY;  … die Abfragen …  ROLLBACK;
-- Jede Abfrage steht für sich; erwartete Ergebnisse stehen jeweils darüber. Weicht ein Ergebnis ab: NICHT aktivieren,
-- nichts reparieren, Befund an Claude/ChatGPT geben (Forward-Recovery-Plan in docs/hochzeitspaket-betrieb.md).

-- 1) Stand der Migrationen und des Schalters.
--    Erwartet: alle vier Zeilen true; schalter = 2100-01-04 00:00:00+00 für beide Reiche (Platzhalter, noch nicht aktiviert).
SELECT to_regprocedure('public.wedding_receipts_book(uuid,jsonb)') IS NOT NULL AS m0160,
       to_regclass('public.wedding_settlement') IS NOT NULL AS m0162,
       to_regprocedure('public.wedding_activation_inventory()') IS NOT NULL AS m0163,
       EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'wedding_receipts_keep' AND NOT tgisinternal AND tgenabled = 'O') AS h7_aktiv,
       public.wedding_switch_since('europe') AS schalter_europe,
       public.wedding_switch_since('lab') AS schalter_lab;

-- 2) Übersicht nach Status.
--    Erwartet für die Aktivierung: nur die Status bereit, jung und nachholen. blockiert = 0.
SELECT status, klasse, count(*) AS doerfer
  FROM public.wedding_activation_inventory()
 GROUP BY status, klasse
 ORDER BY status, klasse;

-- 3) Die Blocker im Einzelnen (Dorf, Klasse, Grund).
--    Erwartet: keine Zeile. Jede Zeile blockiert die Aktivierung, bis sie erklärt und von Hand geklärt ist.
SELECT seed_id, realm, klasse, belege, abweichungen, quarantaene, status, grund
  FROM public.wedding_activation_inventory()
 WHERE status = 'blockiert'
 ORDER BY klasse, seed_id;

-- 4) Dörfer, die noch Hochzeiten nachholen (Anker vorhanden, eine fällige Hochzeit ist noch nicht gebucht).
--    Erwartet: wenige Zeilen, deren anker_naechste in der jüngsten Vergangenheit liegt. Nach dem nächsten Sweep
--    erneut prüfen: Steht dasselbe Dorf nach zwei Sweeps noch hier, gilt es als Blocker.
SELECT seed_id, realm, belege, anker_naechste, grund
  FROM public.wedding_activation_inventory()
 WHERE status = 'nachholen'
 ORDER BY anker_naechste;

-- 5) Offene Quarantänen.
--    Erwartet: keine Zeile.
SELECT q.seed_id, q.reason, q.detected_at
  FROM public.wedding_quarantine q
 WHERE q.released_at IS NULL
 ORDER BY q.detected_at;

-- 6) Abweichungen der Belege vom SQL-Kalender (fehlt = fällig ohne Beleg, weicht_ab, Lücken, Doppelte, falsche Version).
--    Erwartet: weicht_ab = luecken = doppelt = falsche_version = 0 in jeder Zeile; fehlt > 0 nur bei Dörfern aus Abfrage 4.
SELECT seed_id, realm, belege, fehlt, weicht_ab, luecken, doppelt, falsche_version
  FROM public.wedding_receipt_inventory()
 WHERE fehlt + weicht_ab + luecken + doppelt + falsche_version > 0
 ORDER BY weicht_ab + luecken + doppelt + falsche_version DESC, seed_id;

-- 7) Jedes Dorf mit Eigentümer ist klassifiziert (keines fehlt im Inventar).
--    Erwartet: ohne_klasse = 0.
SELECT count(*) AS ohne_klasse
  FROM public.seeds s
 WHERE s.user_id IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM public.wedding_activation_inventory() a WHERE a.seed_id = s.id);

-- 8) Rechte der Belegtabelle (H7).
--    Erwartet: anon_schreiben = auth_schreiben = srv_schreiben = false, auth_lesen = srv_lesen = true.
SELECT has_table_privilege('anon', 'public.wedding_receipts', 'INSERT,UPDATE,DELETE,TRUNCATE') AS anon_schreiben,
       has_table_privilege('authenticated', 'public.wedding_receipts', 'INSERT,UPDATE,DELETE,TRUNCATE') AS auth_schreiben,
       has_table_privilege('service_role', 'public.wedding_receipts', 'INSERT,UPDATE,DELETE,TRUNCATE') AS srv_schreiben,
       has_table_privilege('authenticated', 'public.wedding_receipts', 'SELECT') AS auth_lesen,
       has_table_privilege('service_role', 'public.wedding_receipts', 'SELECT') AS srv_lesen;

-- 9) Genau eine Signatur je versionierter Client-RPC; alte Signaturen vorhanden (für alte Clients bis T−7d).
--    Erwartet: vier Zeilen mit signaturen = 1.
SELECT p.proname, count(*) AS signaturen
  FROM pg_proc p
 WHERE p.pronamespace = 'public'::regnamespace
   AND p.proname IN ('civic_raise_budget', 'civic_raise_budget_v2', 'resource_overview', 'resource_overview_v2')
 GROUP BY p.proname
 ORDER BY p.proname;
