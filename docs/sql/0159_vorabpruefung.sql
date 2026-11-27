-- Migration 0159 – lesende Vorabprüfung der Live-Datenbank. NUR LESEND, erst nach Stephans Freigabe ausführen:
--   BEGIN READ ONLY;  … Abfragen …  ROLLBACK;
-- Die Ergebnisse entscheiden, ob 0159 so eingespielt werden kann. 0159 prüft dasselbe selbst und bricht bei
-- Abweichung ab, bevor etwas geändert ist; diese Datei zeigt die Befunde vorher.

-- 1) Die acht Fremdschlüssel. Erwartet: je genau eine Zeile, Ziel seeds(id);
--    gifts/referrals/twin_works: ON DELETE CASCADE, village_visits: ohne Löschregel.
SELECT c.conrelid::regclass AS tabelle, c.conname, pg_get_constraintdef(c.oid) AS definition, c.convalidated
  FROM pg_constraint c
 WHERE c.contype = 'f' AND c.conrelid IN ('public.gifts'::regclass, 'public.referrals'::regclass, 'public.village_visits'::regclass, 'public.twin_works'::regclass)
 ORDER BY 1, 2;

-- 2) Verweise auf diese Tabellen. Erwartet: nur gift_reads_gift_id_fkey … ON DELETE CASCADE.
SELECT c.conrelid::regclass AS von, c.conname, pg_get_constraintdef(c.oid) AS definition
  FROM pg_constraint c
 WHERE c.contype = 'f' AND c.confrelid IN ('public.gifts'::regclass, 'public.referrals'::regclass, 'public.village_visits'::regclass, 'public.twin_works'::regclass);

-- 3) princely_errands: Spalten, Constraints, Policies, Rechte (die Tabelle steht in keiner Migration).
--    Erwartet: id, seed_id, task_id (uuid), errand (text), created_at; keine Fremdschlüssel.
SELECT a.attname, format_type(a.atttypid, a.atttypmod) AS typ, a.attnotnull, pg_get_expr(d.adbin, d.adrelid) AS standard
  FROM pg_attribute a LEFT JOIN pg_attrdef d ON d.adrelid = a.attrelid AND d.adnum = a.attnum
 WHERE a.attrelid = to_regclass('public.princely_errands') AND a.attnum > 0 AND NOT a.attisdropped ORDER BY a.attnum;
SELECT conname, pg_get_constraintdef(oid) AS definition FROM pg_constraint WHERE conrelid = to_regclass('public.princely_errands');
SELECT policyname, cmd, roles, qual, with_check FROM pg_policies WHERE schemaname = 'public' AND tablename = 'princely_errands';
SELECT relrowsecurity AS rls, relacl AS rechte FROM pg_class WHERE oid = to_regclass('public.princely_errands');

-- 4) princely_errands: Zeilen nach Zustand. 0159 entfernt „ohne Dorf“; bei „Dorf da, Auftrag fehlt“ oder
--    „Auftrag eines anderen Dorfes“ > 0 bricht 0159 ab (von Hand klären).
SELECT count(*) FILTER (WHERE s.id IS NOT NULL AND t.id IS NOT NULL AND t.seed_id = e.seed_id) AS gueltig,
       count(*) FILTER (WHERE s.id IS NULL) AS ohne_dorf_wird_entfernt,
       count(*) FILTER (WHERE s.id IS NOT NULL AND t.id IS NULL) AS dorf_da_auftrag_fehlt_blockiert,
       count(*) FILTER (WHERE s.id IS NOT NULL AND t.id IS NOT NULL AND t.seed_id <> e.seed_id) AS auftrag_anderes_dorf_blockiert
  FROM public.princely_errands e
  LEFT JOIN public.seeds s ON s.id = e.seed_id
  LEFT JOIN public.princely_tasks t ON t.id = e.task_id;

-- 5) Die Funktionen, die 0159 patcht, und die Funktion, die im Repo fehlt. Erwartet für die ersten beiden: Text wie im
--    Repo (0086 bzw. 0062), Eigentümer postgres. princely_errand: Definition bitte vollständig zurückgeben.
SELECT p.proname, pg_get_function_identity_arguments(p.oid) AS argumente, pg_get_userbyid(p.proowner) AS eigentuemer,
       p.proacl AS rechte, pg_get_functiondef(p.oid) AS definition
  FROM pg_proc p
 WHERE p.pronamespace = 'public'::regnamespace AND p.proname IN ('abandon_village', 'purge_user_data', 'princely_errand')
 ORDER BY 1;

-- 6) Zuletzt eingespielte Migration (0159 setzt 0158 voraus).
SELECT hash, created_at, to_timestamp(created_at / 1000.0) AS zeit FROM drizzle.__drizzle_migrations ORDER BY created_at DESC LIMIT 3;
