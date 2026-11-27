-- P4 Stiftungen, Migration 0165 – 02 NACHHER-Prüfung. NUR LESEND (READ ONLY, endet mit ROLLBACK).
-- Ausführen unmittelbar nach dem Einspielen von 0165 und der Begleitmigration 0166. Ergebnis mit DB-ID und Zeit ablegen.
-- Jede Zeile der Art "pruefung" muss ok = true zeigen. Der Block BESTAND muss Zeile für Zeile dem Ergebnis aus
-- 01_vorher.sql gleichen (gleicher UTC-Tag, keine Spielerbuchung dazwischen).
BEGIN TRANSACTION READ ONLY;

-- IDENTITÄT der Datenbank und Zeitpunkt (für das Protokoll: DB-ID und Hash). Die zuletzt eingespielte Migration steht in
-- drizzle.__drizzle_migrations (hash = SHA-256 der Migrationsdatei); fehlt die Tabelle (lokale Testdatenbank), bleibt das Feld leer.
SELECT 'identitaet' AS art, current_database() AS datenbank,
       (SELECT d.oid FROM pg_database d WHERE d.datname = current_database()) AS datenbank_oid,
       pg_postmaster_start_time() AS server_start, current_setting('server_version') AS version, now() AS zeit,
       CASE WHEN to_regclass('drizzle.__drizzle_migrations') IS NULL THEN NULL
            ELSE (xpath('/row/h/text()', query_to_xml('select string_agg(hash || '' @ '' || created_at::text, '' ; '' order by created_at desc) as h from (select hash, created_at from drizzle.__drizzle_migrations order by created_at desc limit 3) t', false, true, '')))[1]::text END AS letzte_migrationen;

SELECT 'pruefung' AS art, p.pruefung, p.ok, p.befund FROM (
  SELECT '0165 eingespielt: 13 stift_*-Funktionen' AS pruefung,
         (SELECT count(*) FROM pg_proc WHERE pronamespace = 'public'::regnamespace AND proname LIKE 'stift%') = 13 AS ok,
         (SELECT count(*)::text FROM pg_proc WHERE pronamespace = 'public'::regnamespace AND proname LIKE 'stift%') AS befund
  UNION ALL
  SELECT 'Tabelle stift_stages vorhanden, RLS an, leer',
         to_regclass('public.stift_stages') IS NOT NULL AND (SELECT c.relrowsecurity FROM pg_class c WHERE c.oid = to_regclass('public.stift_stages'))
           AND (xpath('/row/c/text()', query_to_xml('select count(*) as c from public.stift_stages', false, true, '')))[1]::text = '0',
         'Zeilen: ' || (xpath('/row/c/text()', query_to_xml('select count(*) as c from public.stift_stages', false, true, '')))[1]::text
  UNION ALL
  SELECT 'KEINE AKTIVIERUNG: stift_since = 2100-01-04 für lab und öffentlich',
         public.stift_since('lab') = timestamptz '2100-01-04 00:00:00+00' AND public.stift_since('europe') = timestamptz '2100-01-04 00:00:00+00'
           AND public.stift_since('us-west') = timestamptz '2100-01-04 00:00:00+00' AND public.stift_since('asia') = timestamptz '2100-01-04 00:00:00+00',
         'lab ' || public.stift_since('lab')::text || ', europe ' || public.stift_since('europe')::text
  UNION ALL
  SELECT 'keine Stiftungszeile in purchases', (SELECT count(*) FROM public.purchases WHERE item LIKE 'stift:%') = 0, (SELECT count(*)::text FROM public.purchases WHERE item LIKE 'stift:%')
  UNION ALL
  SELECT 'Tabellenrechte stift_stages: authenticated nur lesend, anon nichts',
         has_table_privilege('authenticated', 'public.stift_stages', 'SELECT') AND NOT has_table_privilege('authenticated', 'public.stift_stages', 'INSERT')
           AND NOT has_table_privilege('authenticated', 'public.stift_stages', 'UPDATE') AND NOT has_table_privilege('authenticated', 'public.stift_stages', 'DELETE')
           AND NOT has_table_privilege('anon', 'public.stift_stages', 'SELECT'), '-'
  UNION ALL
  SELECT 'Index "eine offene Stufe je Bau" und Unveränderlichkeits-Trigger vorhanden',
         to_regclass('public.stift_stages_one_open') IS NOT NULL AND EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'stift_stages_keep' AND NOT tgisinternal AND tgenabled = 'O'), '-'
  UNION ALL
  SELECT 'purchase_guard kennt die Stiftungszeilen und ruft weiter wedding_money_check',
         position('public.stift_row_price(NEW.seed_id, NEW.item, NEW.cost)' in pg_get_functiondef('public.purchase_guard()'::regprocedure)) > 0
           AND position('PERFORM public.wedding_money_check(NEW.seed_id, price);' in pg_get_functiondef('public.purchase_guard()'::regprocedure)) > 0, '-'
  UNION ALL
  SELECT 'resource_kontor_at rechnet die gestiftete Waage', position('public.stift_endowed_at(_seed, ''waage'', _at)' in pg_get_functiondef('public.resource_kontor_at(uuid,integer,integer,timestamp with time zone)'::regprocedure)) > 0, '-'
  UNION ALL
  SELECT 'quest_guard und princely_task_met zählen keine Stiftungszeile',
         position('^stift:' in pg_get_functiondef('public.quest_guard()'::regprocedure)) > 0 AND position('^stift:' in pg_get_functiondef('public.princely_task_met(uuid,text,timestamp with time zone)'::regprocedure)) > 0, '-'
  UNION ALL
  SELECT 'nur stift_deposit und stift_close schalten das Server-Setting ein',
         (SELECT string_agg(p.proname, ',' ORDER BY p.proname) FROM pg_proc p WHERE p.pronamespace = 'public'::regnamespace AND p.prosrc LIKE '%set_config(''samenland.stift'', ''on''%') = 'stift_close,stift_deposit',
         (SELECT string_agg(p.proname, ',' ORDER BY p.proname) FROM pg_proc p WHERE p.pronamespace = 'public'::regnamespace AND p.prosrc LIKE '%set_config(''samenland.stift'', ''on''%')
  UNION ALL
  SELECT 'Rechte public.stift_open(uuid,text,integer): authenticated ja, anon nein',
         has_function_privilege('authenticated', 'public.stift_open(uuid,text,integer)', 'EXECUTE') = true AND NOT has_function_privilege('anon', 'public.stift_open(uuid,text,integer)', 'EXECUTE'),
         'authenticated ' || has_function_privilege('authenticated', 'public.stift_open(uuid,text,integer)', 'EXECUTE')::text || ', anon ' || has_function_privilege('anon', 'public.stift_open(uuid,text,integer)', 'EXECUTE')::text
  UNION ALL
  SELECT 'Rechte public.stift_deposit(uuid,text,integer,integer,integer): authenticated ja, anon nein',
         has_function_privilege('authenticated', 'public.stift_deposit(uuid,text,integer,integer,integer)', 'EXECUTE') = true AND NOT has_function_privilege('anon', 'public.stift_deposit(uuid,text,integer,integer,integer)', 'EXECUTE'),
         'authenticated ' || has_function_privilege('authenticated', 'public.stift_deposit(uuid,text,integer,integer,integer)', 'EXECUTE')::text || ', anon ' || has_function_privilege('anon', 'public.stift_deposit(uuid,text,integer,integer,integer)', 'EXECUTE')::text
  UNION ALL
  SELECT 'Rechte public.stift_close(uuid,text,integer,integer): authenticated ja, anon nein',
         has_function_privilege('authenticated', 'public.stift_close(uuid,text,integer,integer)', 'EXECUTE') = true AND NOT has_function_privilege('anon', 'public.stift_close(uuid,text,integer,integer)', 'EXECUTE'),
         'authenticated ' || has_function_privilege('authenticated', 'public.stift_close(uuid,text,integer,integer)', 'EXECUTE')::text || ', anon ' || has_function_privilege('anon', 'public.stift_close(uuid,text,integer,integer)', 'EXECUTE')::text
  UNION ALL
  SELECT 'Rechte public.stift_overview(uuid,integer): authenticated ja, anon nein',
         has_function_privilege('authenticated', 'public.stift_overview(uuid,integer)', 'EXECUTE') = true AND NOT has_function_privilege('anon', 'public.stift_overview(uuid,integer)', 'EXECUTE'),
         'authenticated ' || has_function_privilege('authenticated', 'public.stift_overview(uuid,integer)', 'EXECUTE')::text || ', anon ' || has_function_privilege('anon', 'public.stift_overview(uuid,integer)', 'EXECUTE')::text
  UNION ALL
  SELECT 'Rechte public.stift_row_price(uuid,text,integer): authenticated nein, anon nein',
         has_function_privilege('authenticated', 'public.stift_row_price(uuid,text,integer)', 'EXECUTE') = false AND NOT has_function_privilege('anon', 'public.stift_row_price(uuid,text,integer)', 'EXECUTE'),
         'authenticated ' || has_function_privilege('authenticated', 'public.stift_row_price(uuid,text,integer)', 'EXECUTE')::text || ', anon ' || has_function_privilege('anon', 'public.stift_row_price(uuid,text,integer)', 'EXECUTE')::text
  UNION ALL
  SELECT 'Rechte public.stift_enter(uuid,text,integer): authenticated nein, anon nein',
         has_function_privilege('authenticated', 'public.stift_enter(uuid,text,integer)', 'EXECUTE') = false AND NOT has_function_privilege('anon', 'public.stift_enter(uuid,text,integer)', 'EXECUTE'),
         'authenticated ' || has_function_privilege('authenticated', 'public.stift_enter(uuid,text,integer)', 'EXECUTE')::text || ', anon ' || has_function_privilege('anon', 'public.stift_enter(uuid,text,integer)', 'EXECUTE')::text
  UNION ALL
  SELECT 'Rechte public.stift_until_at(uuid,text,timestamp with time zone): authenticated nein, anon nein',
         has_function_privilege('authenticated', 'public.stift_until_at(uuid,text,timestamp with time zone)', 'EXECUTE') = false AND NOT has_function_privilege('anon', 'public.stift_until_at(uuid,text,timestamp with time zone)', 'EXECUTE'),
         'authenticated ' || has_function_privilege('authenticated', 'public.stift_until_at(uuid,text,timestamp with time zone)', 'EXECUTE')::text || ', anon ' || has_function_privilege('anon', 'public.stift_until_at(uuid,text,timestamp with time zone)', 'EXECUTE')::text
  UNION ALL
  SELECT 'Rechte public.stift_endowed_at(uuid,text,timestamp with time zone): authenticated nein, anon nein',
         has_function_privilege('authenticated', 'public.stift_endowed_at(uuid,text,timestamp with time zone)', 'EXECUTE') = false AND NOT has_function_privilege('anon', 'public.stift_endowed_at(uuid,text,timestamp with time zone)', 'EXECUTE'),
         'authenticated ' || has_function_privilege('authenticated', 'public.stift_endowed_at(uuid,text,timestamp with time zone)', 'EXECUTE')::text || ', anon ' || has_function_privilege('anon', 'public.stift_endowed_at(uuid,text,timestamp with time zone)', 'EXECUTE')::text
  UNION ALL
  SELECT 'Rechte public.stift_vorrang(uuid): authenticated nein, anon nein',
         has_function_privilege('authenticated', 'public.stift_vorrang(uuid)', 'EXECUTE') = false AND NOT has_function_privilege('anon', 'public.stift_vorrang(uuid)', 'EXECUTE'),
         'authenticated ' || has_function_privilege('authenticated', 'public.stift_vorrang(uuid)', 'EXECUTE')::text || ', anon ' || has_function_privilege('anon', 'public.stift_vorrang(uuid)', 'EXECUTE')::text
  UNION ALL
  SELECT 'Rechte public.stift_reserved(uuid): authenticated nein, anon nein',
         has_function_privilege('authenticated', 'public.stift_reserved(uuid)', 'EXECUTE') = false AND NOT has_function_privilege('anon', 'public.stift_reserved(uuid)', 'EXECUTE'),
         'authenticated ' || has_function_privilege('authenticated', 'public.stift_reserved(uuid)', 'EXECUTE')::text || ', anon ' || has_function_privilege('anon', 'public.stift_reserved(uuid)', 'EXECUTE')::text
  UNION ALL
  SELECT 'Rechte public.stift_free_quota(uuid): authenticated nein, anon nein',
         has_function_privilege('authenticated', 'public.stift_free_quota(uuid)', 'EXECUTE') = false AND NOT has_function_privilege('anon', 'public.stift_free_quota(uuid)', 'EXECUTE'),
         'authenticated ' || has_function_privilege('authenticated', 'public.stift_free_quota(uuid)', 'EXECUTE')::text || ', anon ' || has_function_privilege('anon', 'public.stift_free_quota(uuid)', 'EXECUTE')::text
  UNION ALL
  SELECT 'Rechte public.stift_since(text): authenticated nein, anon nein',
         has_function_privilege('authenticated', 'public.stift_since(text)', 'EXECUTE') = false AND NOT has_function_privilege('anon', 'public.stift_since(text)', 'EXECUTE'),
         'authenticated ' || has_function_privilege('authenticated', 'public.stift_since(text)', 'EXECUTE')::text || ', anon ' || has_function_privilege('anon', 'public.stift_since(text)', 'EXECUTE')::text
  UNION ALL
  SELECT 'Rechte public.stift_stages_keep(): authenticated nein, anon nein',
         has_function_privilege('authenticated', 'public.stift_stages_keep()', 'EXECUTE') = false AND NOT has_function_privilege('anon', 'public.stift_stages_keep()', 'EXECUTE'),
         'authenticated ' || has_function_privilege('authenticated', 'public.stift_stages_keep()', 'EXECUTE')::text || ', anon ' || has_function_privilege('anon', 'public.stift_stages_keep()', 'EXECUTE')::text
) p;

-- HINWEISE: Fingerabdrücke der vier gepatchten Funktionen gegen den Repository-Stand nach 0165 (lokal gebaut). "false" ist
-- nur dann unbedenklich, wenn schon der Vorher-Hinweis für dieselbe Funktion "false" war (abweichende Live-Definition).
SELECT 'hinweis' AS art, p.pruefung, p.ok, p.befund FROM (
  SELECT 'Fingerabdruck purchase_guard = Repository (Stand 0165)' AS pruefung,
         md5(pg_get_functiondef(to_regprocedure('public.purchase_guard()'))) = '5b8e437b9a71396d4ad286b6b5d3dc5c' AS ok, md5(pg_get_functiondef(to_regprocedure('public.purchase_guard()'))) AS befund
  UNION ALL
  SELECT 'Fingerabdruck resource_kontor_at = Repository (Stand 0165)' AS pruefung,
         md5(pg_get_functiondef(to_regprocedure('public.resource_kontor_at(uuid,integer,integer,timestamp with time zone)'))) = '2d3bcff5b99e7002d1e1a195d51b8cc5' AS ok, md5(pg_get_functiondef(to_regprocedure('public.resource_kontor_at(uuid,integer,integer,timestamp with time zone)'))) AS befund
  UNION ALL
  SELECT 'Fingerabdruck quest_guard = Repository (Stand 0165)' AS pruefung,
         md5(pg_get_functiondef(to_regprocedure('public.quest_guard()'))) = '12079d1be6e286776fd536ed6b39f7c9' AS ok, md5(pg_get_functiondef(to_regprocedure('public.quest_guard()'))) AS befund
  UNION ALL
  SELECT 'Fingerabdruck princely_task_met = Repository (Stand 0165)' AS pruefung,
         md5(pg_get_functiondef(to_regprocedure('public.princely_task_met(uuid,text,timestamp with time zone)'))) = '9bcb0b346f1e5a0a417c4d6d4339ab2e' AS ok, md5(pg_get_functiondef(to_regprocedure('public.princely_task_met(uuid,text,timestamp with time zone)'))) AS befund
) p;

-- ---------------------------------------------------------------------------------------------------------------------
-- BESTAND (in 01_vorher.sql und 02_nachher.sql wortgleich): Zeilenzahlen, Summen und Prüfsummen der Tabellen, die P4
-- nicht anfassen darf, dazu Kontostände, Lager und Kontorpreise aller Dörfer zum heutigen Tagesbeginn (UTC).
-- Erwartet: vorher und nachher Zeile für Zeile gleich — sofern beide Läufe am selben UTC-Tag stattfinden und dazwischen
-- kein Spieler etwas gebucht hat. Weicht eine Zeile ab: zuerst prüfen, ob eine neue Spielerbuchung dazwischen lag.
SELECT 'bestand' AS art, x.name, x.wert FROM (
  SELECT 1 AS n, 'seeds: Anzahl' AS name, count(*)::text AS wert FROM public.seeds
  UNION ALL SELECT 2, 'purchases: Anzahl | Summe cost | Prüfsumme',
    count(*)::text || ' | ' || coalesce(sum(cost), 0)::text || ' | ' || coalesce(md5(string_agg(id::text || ':' || item || ':' || cost::text || ':' || created_at::text, ',' ORDER BY id)), '-')
    FROM public.purchases WHERE created_at < date_trunc('day', now())
  UNION ALL SELECT 3, 'tax_receipts: Anzahl | Summe income | Prüfsumme',
    count(*)::text || ' | ' || coalesce(sum(income), 0)::text || ' | ' || coalesce(md5(string_agg(seed_id::text || ':' || day::text || ':' || income::text || ':' || population::text || ':' || households::text, ',' ORDER BY seed_id, day)), '-')
    FROM public.tax_receipts WHERE assessed_at < date_trunc('day', now())
  UNION ALL SELECT 4, 'resource_ledger: Anzahl | Summe amount',
    count(*)::text || ' | ' || coalesce(sum(amount), 0)::text FROM public.resource_ledger WHERE at < date_trunc('day', now())
  UNION ALL SELECT 5, 'civic_stages: Anzahl | Summe price | bezahlt | Material vollständig',
    count(*)::text || ' | ' || coalesce(sum(price), 0)::text || ' | ' || count(funded_at)::text || ' | ' || count(material_at)::text FROM public.civic_stages
  UNION ALL SELECT 6, 'civic_quota: Anzahl', count(*)::text FROM public.civic_quota
  UNION ALL SELECT 7, 'Kontostände aller Dörfer zum Tagesbeginn: Summe | Prüfsumme',
    coalesce(sum(b), 0)::text || ' | ' || coalesce(md5(string_agg(id::text || ':' || b::text, ',' ORDER BY id)), '-')
    FROM (SELECT s.id, public.village_balance_walk(s.id, timestamptz '2026-11-12 00:00:00+00', date_trunc('day', now())) AS b FROM public.seeds s) k
  UNION ALL SELECT 8, 'Kontorpreis 30 Holz + 20 Stein je Dorf mit Standort zum Tagesbeginn: Summe | Prüfsumme',
    coalesce(sum(c), 0)::text || ' | ' || coalesce(md5(string_agg(seed_id::text || ':' || c::text, ',' ORDER BY seed_id)), '-')
    FROM (SELECT v.seed_id, public.resource_kontor_at(v.seed_id, 30, 20, date_trunc('day', now())) AS c FROM public.village_sites v) k
  UNION ALL SELECT 9, 'Erlass "build" erfüllt (seit 30 Tagen) je Dorf: Anzahl true | Prüfsumme',
    count(*) FILTER (WHERE m)::text || ' | ' || coalesce(md5(string_agg(id::text || ':' || m::text, ',' ORDER BY id)), '-')
    FROM (SELECT s.id, public.princely_task_met(s.id, 'build', date_trunc('day', now()) - interval '30 days') AS m FROM public.seeds s) k
) x ORDER BY x.n;

ROLLBACK;
