-- P4 Stiftungen, Migration 0165 – 01 VORHER-Prüfung. NUR LESEND (die Transaktion ist READ ONLY und endet mit ROLLBACK).
-- Ausführen erst nach Stephans Freigabe für das Einspielen, unmittelbar vor 0165. Ergebnis mit DB-ID und Zeit ablegen.
-- Jede Zeile der Art "pruefung" muss ok = true zeigen; die Zeilen "hinweis" sind Befunde ohne Sperrwirkung.
-- Bei ok = false: NICHT einspielen, nichts reparieren, Befund an Claude geben. 0165 prüft die Patch-Stellen selbst noch
-- einmal und bricht vor jeder Änderung ab; diese Datei zeigt den Befund vorher.
BEGIN TRANSACTION READ ONLY;

-- IDENTITÄT der Datenbank und Zeitpunkt (für das Protokoll: DB-ID und Hash). Die zuletzt eingespielte Migration steht in
-- drizzle.__drizzle_migrations (hash = SHA-256 der Migrationsdatei); fehlt die Tabelle (lokale Testdatenbank), bleibt das Feld leer.
SELECT 'identitaet' AS art, current_database() AS datenbank,
       (SELECT d.oid FROM pg_database d WHERE d.datname = current_database()) AS datenbank_oid,
       pg_postmaster_start_time() AS server_start, current_setting('server_version') AS version, now() AS zeit,
       CASE WHEN to_regclass('drizzle.__drizzle_migrations') IS NULL THEN NULL
            ELSE (xpath('/row/h/text()', query_to_xml('select string_agg(hash || '' @ '' || created_at::text, '' ; '' order by created_at desc) as h from (select hash, created_at from drizzle.__drizzle_migrations order by created_at desc limit 3) t', false, true, '')))[1]::text END AS letzte_migrationen;

-- PRÜFUNGEN vor dem Einspielen.
SELECT 'pruefung' AS art, p.pruefung, p.ok, p.befund FROM (
  SELECT '0165 noch nicht eingespielt: keine stift_*-Funktion' AS pruefung,
         (SELECT count(*) FROM pg_proc WHERE pronamespace = 'public'::regnamespace AND proname LIKE 'stift%') = 0 AS ok,
         (SELECT count(*)::text FROM pg_proc WHERE pronamespace = 'public'::regnamespace AND proname LIKE 'stift%') AS befund
  UNION ALL
  SELECT '0165 noch nicht eingespielt: keine Tabelle stift_stages', to_regclass('public.stift_stages') IS NULL, coalesce(to_regclass('public.stift_stages')::text, '-')
  UNION ALL
  SELECT 'keine Kaufzeile trägt schon einen Stiftungsnamen (stift:…)',
         (SELECT count(*) FROM public.purchases WHERE item LIKE 'stift:%') = 0, (SELECT count(*)::text FROM public.purchases WHERE item LIKE 'stift:%')
  UNION ALL
  SELECT 'Voraussetzungen 0147–0163 vorhanden (Geldprüfung, Tagesbuchung, Protokoll, Buchung, Gemeindebau-Tabellen)',
         to_regprocedure('public.wedding_money_check(uuid,integer)') IS NOT NULL AND to_regprocedure('public.resource_refresh_try(uuid,date)') IS NOT NULL
           AND to_regprocedure('public.client_protocol_min()') IS NOT NULL AND to_regprocedure('public.resource_book(uuid,text,integer,text,text,timestamp with time zone)') IS NOT NULL
           AND to_regclass('public.civic_stages') IS NOT NULL AND to_regclass('public.civic_quota') IS NOT NULL AND to_regclass('public.tax_receipts') IS NOT NULL,
         'wedding_money_check ' || (to_regprocedure('public.wedding_money_check(uuid,integer)') IS NOT NULL)::text || ', resource_refresh_try ' || (to_regprocedure('public.resource_refresh_try(uuid,date)') IS NOT NULL)::text
           || ', client_protocol_min ' || (to_regprocedure('public.client_protocol_min()') IS NOT NULL)::text
  UNION ALL
  SELECT 'die vier zu patchenden Funktionen existieren',
         to_regprocedure('public.purchase_guard()') IS NOT NULL AND to_regprocedure('public.resource_kontor_at(uuid,integer,integer,timestamp with time zone)') IS NOT NULL
           AND to_regprocedure('public.quest_guard()') IS NOT NULL AND to_regprocedure('public.princely_task_met(uuid,text,timestamp with time zone)') IS NOT NULL, '-'
  UNION ALL
  SELECT 'Patch-Stelle in purchase_guard: genau 1 mal' AS pruefung,
         (SELECT (length(d) - length(replace(d, a, ''))) / length(a) FROM (SELECT pg_get_functiondef(to_regprocedure('public.purchase_guard()')) AS d, '  IF price IS NULL THEN RAISE EXCEPTION ''unknown item''; END IF;'::text AS a) q) = 1 AS ok,
         (SELECT ((length(d) - length(replace(d, a, ''))) / length(a))::text || ' mal' FROM (SELECT pg_get_functiondef(to_regprocedure('public.purchase_guard()')) AS d, '  IF price IS NULL THEN RAISE EXCEPTION ''unknown item''; END IF;'::text AS a) q) AS befund
  UNION ALL
  SELECT 'Patch-Stelle in purchase_guard: genau 1 mal' AS pruefung,
         (SELECT (length(d) - length(replace(d, a, ''))) / length(a) FROM (SELECT pg_get_functiondef(to_regprocedure('public.purchase_guard()')) AS d, 'WHEN current_setting(''samenland.ankauf'', true) = ''on'' AND NEW.item ~ ''^ankauf:[0-9]{8}$'' THEN NEW.created_at ELSE now() END;'::text AS a) q) = 1 AS ok,
         (SELECT ((length(d) - length(replace(d, a, ''))) / length(a))::text || ' mal' FROM (SELECT pg_get_functiondef(to_regprocedure('public.purchase_guard()')) AS d, 'WHEN current_setting(''samenland.ankauf'', true) = ''on'' AND NEW.item ~ ''^ankauf:[0-9]{8}$'' THEN NEW.created_at ELSE now() END;'::text AS a) q) AS befund
  UNION ALL
  SELECT 'Patch-Stelle in resource_kontor_at: genau 1 mal' AS pruefung,
         (SELECT (length(d) - length(replace(d, a, ''))) / length(a) FROM (SELECT pg_get_functiondef(to_regprocedure('public.resource_kontor_at(uuid,integer,integer,timestamp with time zone)')) AS d, 'AND p.item = ''waage1'' AND p.created_at <= _at) THEN 0.85 ELSE 1 END)::integer'::text AS a) q) = 1 AS ok,
         (SELECT ((length(d) - length(replace(d, a, ''))) / length(a))::text || ' mal' FROM (SELECT pg_get_functiondef(to_regprocedure('public.resource_kontor_at(uuid,integer,integer,timestamp with time zone)')) AS d, 'AND p.item = ''waage1'' AND p.created_at <= _at) THEN 0.85 ELSE 1 END)::integer'::text AS a) q) AS befund
  UNION ALL
  SELECT 'Patch-Stelle in quest_guard: genau 1 mal' AS pruefung,
         (SELECT (length(d) - length(replace(d, a, ''))) / length(a) FROM (SELECT pg_get_functiondef(to_regprocedure('public.quest_guard()')) AS d, 'item !~ ''^(spital|waage)[1-9][0-9]*:(r[1-9][0-9]*|k[0-9]{8})$'''::text AS a) q) = 1 AS ok,
         (SELECT ((length(d) - length(replace(d, a, ''))) / length(a))::text || ' mal' FROM (SELECT pg_get_functiondef(to_regprocedure('public.quest_guard()')) AS d, 'item !~ ''^(spital|waage)[1-9][0-9]*:(r[1-9][0-9]*|k[0-9]{8})$'''::text AS a) q) AS befund
  UNION ALL
  SELECT 'Patch-Stelle in princely_task_met: genau 2 mal' AS pruefung,
         (SELECT (length(d) - length(replace(d, a, ''))) / length(a) FROM (SELECT pg_get_functiondef(to_regprocedure('public.princely_task_met(uuid,text,timestamp with time zone)')) AS d, 'item !~ ''^(spital|waage)[1-9][0-9]*:(r[1-9][0-9]*|k[0-9]{8})$'''::text AS a) q) = 2 AS ok,
         (SELECT ((length(d) - length(replace(d, a, ''))) / length(a))::text || ' mal' FROM (SELECT pg_get_functiondef(to_regprocedure('public.princely_task_met(uuid,text,timestamp with time zone)')) AS d, 'item !~ ''^(spital|waage)[1-9][0-9]*:(r[1-9][0-9]*|k[0-9]{8})$'''::text AS a) q) AS befund
) p;

-- HINWEISE: stimmen die Live-Definitionen Zeichen für Zeichen mit dem Repository-Stand vor 0165 überein? Ein "false" sperrt
-- das Einspielen nicht (maßgeblich sind die Patch-Stellen oben), muss aber vor dem Einspielen erklärt sein: dann bitte
-- 04_funktionstexte.sql ausführen und die Texte zurückgeben.
SELECT 'hinweis' AS art, p.pruefung, p.ok, p.befund FROM (
  SELECT 'Fingerabdruck purchase_guard = Repository (Stand 0164)' AS pruefung,
         md5(pg_get_functiondef(to_regprocedure('public.purchase_guard()'))) = 'd753319b71a43fb5df971825f88847df' AS ok, md5(pg_get_functiondef(to_regprocedure('public.purchase_guard()'))) AS befund
  UNION ALL
  SELECT 'Fingerabdruck resource_kontor_at = Repository (Stand 0164)' AS pruefung,
         md5(pg_get_functiondef(to_regprocedure('public.resource_kontor_at(uuid,integer,integer,timestamp with time zone)'))) = 'c4ccdc584432cbe2feeba7c6a07285c8' AS ok, md5(pg_get_functiondef(to_regprocedure('public.resource_kontor_at(uuid,integer,integer,timestamp with time zone)'))) AS befund
  UNION ALL
  SELECT 'Fingerabdruck quest_guard = Repository (Stand 0164)' AS pruefung,
         md5(pg_get_functiondef(to_regprocedure('public.quest_guard()'))) = 'b3a88daf86262d8a86dbf489b1c10c18' AS ok, md5(pg_get_functiondef(to_regprocedure('public.quest_guard()'))) AS befund
  UNION ALL
  SELECT 'Fingerabdruck princely_task_met = Repository (Stand 0164)' AS pruefung,
         md5(pg_get_functiondef(to_regprocedure('public.princely_task_met(uuid,text,timestamp with time zone)'))) = '6cd37e0a0cbb4348b6911c6cd6e0473f' AS ok, md5(pg_get_functiondef(to_regprocedure('public.princely_task_met(uuid,text,timestamp with time zone)'))) AS befund
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
