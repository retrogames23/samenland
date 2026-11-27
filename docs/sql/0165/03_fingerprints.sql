-- P4 Stiftungen, Migration 0165 – 03 Fingerabdrücke. NUR LESEND. Vor und nach dem Einspielen ausführbar; das Ergebnis gehört ins Protokoll.
-- md5 über pg_get_functiondef. Repository-Werte (lokal aus den Migrationsdateien gebaut, PostgreSQL 16):
--   vor 0165:  purchase_guard d753319b71a43fb5df971825f88847df · resource_kontor_at c4ccdc584432cbe2feeba7c6a07285c8
--              quest_guard b3a88daf86262d8a86dbf489b1c10c18 · princely_task_met 6cd37e0a0cbb4348b6911c6cd6e0473f
--   nach 0165: purchase_guard 5b8e437b9a71396d4ad286b6b5d3dc5c · resource_kontor_at 2d3bcff5b99e7002d1e1a195d51b8cc5
--              quest_guard 12079d1be6e286776fd536ed6b39f7c9 · princely_task_met 9bcb0b346f1e5a0a417c4d6d4339ab2e
-- SHA-256 der Migrationsdateien (so steht es nach dem Einspielen in drizzle.__drizzle_migrations.hash):
--   0165_stiftungen_p4.sql          9b5fc4d0fa1ba375cdc6af3e687dca7538c7041080da7876dae565cc4bd88851
--   0166_begleitmigration_0166.sql  17db4fd369edb9244b9f91d9aeed145c3d04ad8ba6e95d06247f07a63527d11a   (Inhalt byte-genau: SELECT 1;)
BEGIN TRANSACTION READ ONLY;

SELECT 'funktion' AS art, p.oid::regprocedure::text AS objekt, md5(pg_get_functiondef(p.oid)) AS md5,
       pg_get_userbyid(p.proowner) AS eigentuemer, p.prosecdef AS definer, p.provolatile AS volatil, coalesce(p.proacl::text, '(Standard)') AS rechte
  FROM pg_proc p
 WHERE p.pronamespace = 'public'::regnamespace AND p.prokind = 'f'
   AND (p.proname IN ('purchase_guard', 'resource_kontor_at', 'quest_guard', 'princely_task_met', 'wedding_money_check', 'resource_refresh_try',
                      'civic_day', 'civic_deposit_price', 'civic_paid', 'resource_book', 'village_balance_walk', 'client_protocol_min')
        OR p.proname LIKE 'stift%')
 ORDER BY 2;

SELECT 'tabelle' AS art, a.attname AS spalte, format_type(a.atttypid, a.atttypmod) AS typ, a.attnotnull AS pflicht, pg_get_expr(d.adbin, d.adrelid) AS standard
  FROM pg_attribute a LEFT JOIN pg_attrdef d ON d.adrelid = a.attrelid AND d.adnum = a.attnum
 WHERE a.attrelid = to_regclass('public.stift_stages') AND a.attnum > 0 AND NOT a.attisdropped ORDER BY a.attnum;
SELECT 'constraint' AS art, conname, pg_get_constraintdef(oid) AS definition FROM pg_constraint WHERE conrelid = to_regclass('public.stift_stages') ORDER BY conname;
SELECT 'index' AS art, indexrelid::regclass::text AS name, pg_get_indexdef(indexrelid) AS definition FROM pg_index WHERE indrelid = to_regclass('public.stift_stages') ORDER BY 2;
SELECT 'policy' AS art, policyname, cmd, roles::text, qual FROM pg_policies WHERE schemaname = 'public' AND tablename = 'stift_stages';
SELECT 'trigger' AS art, tgname, pg_get_triggerdef(oid) AS definition FROM pg_trigger WHERE tgrelid = to_regclass('public.stift_stages') AND NOT tgisinternal;
SELECT 'tabellenrechte' AS art, coalesce(relacl::text, '(Standard)') AS rechte, relrowsecurity AS rls FROM pg_class WHERE oid = to_regclass('public.stift_stages');

ROLLBACK;
