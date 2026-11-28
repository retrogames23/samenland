-- P4 Schritt 2b, Migration 0169 (Lab-Aktivierung der Stiftungen) – 02 NACHHER-Prüfung. NUR LESEND.
-- Ausführen unmittelbar NACH dem Einspielen von 0169/0170. Jede Zeile der Art "pruefung" muss ok = true zeigen.
-- Der Block SCHALTER muss genau eine aktive Welt zeigen: lab. Der Block BESTAND muss dem Vorher-Ergebnis gleichen.
BEGIN TRANSACTION READ ONLY;

SELECT 'identitaet' AS art, current_database() AS datenbank,
       (SELECT d.oid FROM pg_database d WHERE d.datname = current_database()) AS datenbank_oid,
       current_setting('server_version') AS version, now() AS zeit,
       (SELECT max(id) FROM drizzle.__drizzle_migrations) AS hoechste_live_id;

SELECT 'pruefung' AS art, p.pruefung, p.ok, p.befund FROM (
  SELECT 'stift_since(lab) = 2026-11-28 00:00 UTC (aktiv)' AS pruefung,
         public.stift_since('lab') = timestamptz '2026-11-28 00:00:00+00' AND public.stift_since('lab') <= now() AS ok, public.stift_since('lab')::text AS befund
  UNION ALL
  SELECT 'europe, us-west, us-east, asia und alle Überlaufkarten weiter auf 2100-01-04 (abgeschaltet)',
         (SELECT bool_and(public.stift_since(w.welt) = timestamptz '2100-01-04 00:00:00+00') FROM (VALUES ('lab'), ('europe'), ('us-west'), ('us-east'), ('asia'), ('europe-2'), ('europe-3'), ('europe-4'), ('us-west-2'), ('us-east-2'), ('asia-2')) AS w(welt) WHERE w.welt <> 'lab'),
         (SELECT string_agg(w.welt || '=' || public.stift_since(w.welt)::date::text, ', ') FROM (VALUES ('lab'), ('europe'), ('us-west'), ('us-east'), ('asia'), ('europe-2'), ('europe-3'), ('europe-4'), ('us-west-2'), ('us-east-2'), ('asia-2')) AS w(welt) WHERE w.welt <> 'lab')
  UNION ALL
  SELECT 'jede Welt, in der ein Dorf steht, außer lab: abgeschaltet',
         NOT EXISTS (SELECT 1 FROM public.seeds s WHERE s.realm <> 'lab' AND public.stift_since(s.realm) <= now()),
         (SELECT coalesce(string_agg(DISTINCT s.realm, ', '), '-') FROM public.seeds s WHERE s.realm <> 'lab' AND public.stift_since(s.realm) <= now())
  UNION ALL
  SELECT 'stift_since nach 0169 = erwarteter Funktionskörper', md5(pg_get_functiondef('public.stift_since(text)'::regprocedure)) = 'a2d1c129d2f91efa3abb5737525a580f', md5(pg_get_functiondef('public.stift_since(text)'::regprocedure))
  UNION ALL
  SELECT 'Rechte von stift_since unverändert (authenticated nein, anon nein, service_role ja)',
         NOT has_function_privilege('authenticated', 'public.stift_since(text)', 'EXECUTE') AND NOT has_function_privilege('anon', 'public.stift_since(text)', 'EXECUTE')
           AND has_function_privilege('service_role', 'public.stift_since(text)', 'EXECUTE'), '-'
  UNION ALL
  SELECT '0169 im Live-Journal mit dem Hash der Datei aus main', EXISTS (SELECT 1 FROM drizzle.__drizzle_migrations m WHERE m.hash = '889ed3397227cdc560cb30c0425959fa796201a2268e287300f76ed11eda6482'),
         (SELECT coalesce(string_agg(m.id::text || ' @ ' || m.created_at::text, ', '), 'kein Eintrag') FROM drizzle.__drizzle_migrations m WHERE m.hash = '889ed3397227cdc560cb30c0425959fa796201a2268e287300f76ed11eda6482')
  UNION ALL
  SELECT 'keine Stiftung in einer öffentlichen Welt',
         NOT EXISTS (SELECT 1 FROM public.stift_stages t JOIN public.seeds s ON s.id = t.seed_id WHERE s.realm <> 'lab'), '-'
  UNION ALL
  SELECT 'unverändert: princely_task_met', md5(pg_get_functiondef('public.princely_task_met(uuid,text,timestamp with time zone)'::regprocedure)) = '9bcb0b346f1e5a0a417c4d6d4339ab2e', md5(pg_get_functiondef('public.princely_task_met(uuid,text,timestamp with time zone)'::regprocedure))
  UNION ALL
  SELECT 'unverändert: purchase_guard', md5(pg_get_functiondef('public.purchase_guard()'::regprocedure)) = '5b8e437b9a71396d4ad286b6b5d3dc5c', md5(pg_get_functiondef('public.purchase_guard()'::regprocedure))
  UNION ALL
  SELECT 'unverändert: quest_guard', md5(pg_get_functiondef('public.quest_guard()'::regprocedure)) = '12079d1be6e286776fd536ed6b39f7c9', md5(pg_get_functiondef('public.quest_guard()'::regprocedure))
  UNION ALL
  SELECT 'unverändert: resource_kontor_at', md5(pg_get_functiondef('public.resource_kontor_at(uuid,integer,integer,timestamp with time zone)'::regprocedure)) = '2d3bcff5b99e7002d1e1a195d51b8cc5', md5(pg_get_functiondef('public.resource_kontor_at(uuid,integer,integer,timestamp with time zone)'::regprocedure))
  UNION ALL
  SELECT 'unverändert: stift_close', md5(pg_get_functiondef('public.stift_close(uuid,text,integer,integer)'::regprocedure)) = 'd93b291c8b95aca4163a5ca9209d68a2', md5(pg_get_functiondef('public.stift_close(uuid,text,integer,integer)'::regprocedure))
  UNION ALL
  SELECT 'unverändert: stift_deposit', md5(pg_get_functiondef('public.stift_deposit(uuid,text,integer,integer,integer)'::regprocedure)) = '0eef02a4c11f7722b49e3dcd9c6f3bf2', md5(pg_get_functiondef('public.stift_deposit(uuid,text,integer,integer,integer)'::regprocedure))
  UNION ALL
  SELECT 'unverändert: stift_endowed_at', md5(pg_get_functiondef('public.stift_endowed_at(uuid,text,timestamp with time zone)'::regprocedure)) = '9d12904b10aaa379708fff257d2f6ade', md5(pg_get_functiondef('public.stift_endowed_at(uuid,text,timestamp with time zone)'::regprocedure))
  UNION ALL
  SELECT 'unverändert: stift_enter', md5(pg_get_functiondef('public.stift_enter(uuid,text,integer)'::regprocedure)) = '489c0586911ceb5535fbb67a2a76e798', md5(pg_get_functiondef('public.stift_enter(uuid,text,integer)'::regprocedure))
  UNION ALL
  SELECT 'unverändert: stift_free_quota', md5(pg_get_functiondef('public.stift_free_quota(uuid)'::regprocedure)) = '209a071e86aabef440dd2a051e864834', md5(pg_get_functiondef('public.stift_free_quota(uuid)'::regprocedure))
  UNION ALL
  SELECT 'unverändert: stift_open', md5(pg_get_functiondef('public.stift_open(uuid,text,integer)'::regprocedure)) = 'a74e62ae26e070102e5bf9cbcc07e707', md5(pg_get_functiondef('public.stift_open(uuid,text,integer)'::regprocedure))
  UNION ALL
  SELECT 'unverändert: stift_overview', md5(pg_get_functiondef('public.stift_overview(uuid,integer)'::regprocedure)) = '9e5ebc9fae781b60e6fec6e054b1b9bd', md5(pg_get_functiondef('public.stift_overview(uuid,integer)'::regprocedure))
  UNION ALL
  SELECT 'unverändert: stift_reserved', md5(pg_get_functiondef('public.stift_reserved(uuid)'::regprocedure)) = '206b59449eb35f9bb8278eca557fb4c4', md5(pg_get_functiondef('public.stift_reserved(uuid)'::regprocedure))
  UNION ALL
  SELECT 'unverändert: stift_row_price', md5(pg_get_functiondef('public.stift_row_price(uuid,text,integer)'::regprocedure)) = 'd5fbb024e26c97aba0a7df891e720822', md5(pg_get_functiondef('public.stift_row_price(uuid,text,integer)'::regprocedure))
  UNION ALL
  SELECT 'unverändert: stift_stages_keep', md5(pg_get_functiondef('public.stift_stages_keep()'::regprocedure)) = '4bbe590442fc370b7f86ba7b630426db', md5(pg_get_functiondef('public.stift_stages_keep()'::regprocedure))
  UNION ALL
  SELECT 'unverändert: stift_until_at', md5(pg_get_functiondef('public.stift_until_at(uuid,text,timestamp with time zone)'::regprocedure)) = '777646423f853bc3feb97c7ffd2302bb', md5(pg_get_functiondef('public.stift_until_at(uuid,text,timestamp with time zone)'::regprocedure))
  UNION ALL
  SELECT 'unverändert: stift_vorrang', md5(pg_get_functiondef('public.stift_vorrang(uuid)'::regprocedure)) = 'e26ba300c85a121b1008c948c2aae91f', md5(pg_get_functiondef('public.stift_vorrang(uuid)'::regprocedure))
) p;

-- Die letzten Einträge des Live-Journals (für das Protokoll: Live-IDs und Hashes von 0169 und 0170).
SELECT 'journal' AS art, m.id AS live_id, m.created_at, m.hash FROM drizzle.__drizzle_migrations m ORDER BY m.id DESC LIMIT 4;

-- SCHALTER je Welt (die fünf Welten und ihre Überlaufkarten). Diese Zeilen gehören ins Protokoll.
SELECT 'schalter' AS art, w.welt, public.stift_since(w.welt) AS stift_since, public.stift_since(w.welt) <= now() AS aktiv
  FROM (VALUES ('lab'), ('europe'), ('us-west'), ('us-east'), ('asia'), ('europe-2'), ('europe-3'), ('europe-4'), ('us-west-2'), ('us-east-2'), ('asia-2')) AS w(welt);

-- BESTAND (in 01 und 02 wortgleich; muss vorher und nachher gleich sein, sofern dazwischen kein Spieler etwas gebucht hat).
SELECT 'bestand' AS art, x.name, x.wert FROM (
  SELECT 1 AS n, 'stift_stages: Zeilen' AS name, (SELECT count(*)::text FROM public.stift_stages) AS wert
  UNION ALL SELECT 2, 'purchases: Stiftungszeilen', (SELECT count(*)::text FROM public.purchases WHERE item LIKE 'stift:%')
  UNION ALL SELECT 3, 'purchases: Anzahl | Summe cost (vor heute, UTC)', (SELECT count(*)::text || ' | ' || coalesce(sum(cost), 0)::text FROM public.purchases WHERE created_at < date_trunc('day', now()))
  UNION ALL SELECT 4, 'tax_receipts: Anzahl | Summe income (vor heute, UTC)', (SELECT count(*)::text || ' | ' || coalesce(sum(income), 0)::text FROM public.tax_receipts WHERE assessed_at < date_trunc('day', now()))
  UNION ALL SELECT 5, 'seeds: Anzahl | davon lab', (SELECT count(*)::text || ' | ' || count(*) FILTER (WHERE realm = 'lab')::text FROM public.seeds)
  UNION ALL SELECT 6, 'Lab-Dörfer mit Spital 1 oder Waage 1 (können nach der Aktivierung stiften)',
    (SELECT count(DISTINCT s.id)::text FROM public.seeds s JOIN public.purchases p ON p.seed_id = s.id WHERE s.realm = 'lab' AND p.item IN ('spital1', 'waage1') AND p.created_at <= now())
) x ORDER BY x.n;

ROLLBACK;
