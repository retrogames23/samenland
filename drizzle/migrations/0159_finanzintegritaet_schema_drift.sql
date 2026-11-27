-- 0159 Finanzintegrität und Schema-Drift
--
-- Zweck (fachlich unverändert): Wird ein Dorf gelöscht (abandon_village, purge_user_data oder jede andere Löschung der
-- seeds-Zeile), bleiben die finanziellen Gegenbuchungen ANDERER Dörfer erhalten. Bisher verschwanden sie mit, und der
-- Kassenstand der anderen Spieler änderte sich rückwirkend.
--
-- Wer bucht was (village_balance_walk / village_balance_legacy / village_capped_tax_fast):
--   gifts           from_seed zahlt, to_seed erhält          -> beide Seiten buchen
--   referrals       referrer_seed und referee_seed erhalten  -> beide Seiten buchen
--   village_visits  nur visitor_seed erhält                  -> visited_seed ist nur ein Verweis
--   twin_works      nur seed_id zahlt (jede Seite eigene Zeile) -> partner_id ist nur ein Verweis
--
-- Daraus die FK-Regeln (alle auf public.seeds(id)):
--   gifts.from_seed, gifts.to_seed                    ON DELETE SET NULL  (Zeile bleibt für die andere Seite)
--   referrals.referrer_seed, referrals.referee_seed   ON DELETE SET NULL
--   village_visits.visitor_seed                       ON DELETE CASCADE   (eigene Buchung geht mit dem eigenen Dorf)
--   village_visits.visited_seed                       ON DELETE SET NULL  (Einnahme des Besuchers bleibt)
--   twin_works.seed_id                                ON DELETE CASCADE   (unverändert)
--   twin_works.partner_id                             ON DELETE SET NULL  (Ausgabe des Partners bleibt)
-- Eine gifts-/referrals-Zeile, deren BEIDE Seiten gelöscht sind, bucht für niemanden mehr und wird entfernt
-- (Trigger finance_orphan_cleanup).
--
-- Schema-Drift: public.princely_errands existiert in der Live-Datenbank (generierte Typen), aber in keiner Migration,
-- und hat dort keine Fremdschlüssel (wohl aber: Primärschlüssel, CHECK errand in (gardener, groom), UNIQUE (task_id, errand)). abandon_village räumt sie nicht ab, sodass verwaiste Zeilen entstehen.
--   princely_errands.seed_id -> seeds(id)           ON DELETE CASCADE
--   princely_errands.task_id -> princely_tasks(id)  ON DELETE CASCADE
--
-- Als EIN Skript in EINER Transaktion ausführen. Jede Abweichung vom erwarteten Ist-Zustand bricht ab, bevor etwas
-- geändert ist. Erneutes Ausführen ändert nichts (jeder Schritt prüft den Zielzustand).
-- Historische Schäden (bereits mitgelöschte Gegenbuchungen) werden NICHT rekonstruiert.

-- ---------------------------------------------------------------------------------------------------------------
-- 0) Hilfsfunktionen der Migration (nur in dieser Sitzung)
-- ---------------------------------------------------------------------------------------------------------------
-- Alle Fremdschlüssel einer Tabelle, die die Spalte _col enthalten, vollständig beschrieben.
CREATE OR REPLACE FUNCTION pg_temp.m0159_fks(_tbl regclass, _col text)
RETURNS TABLE (conname name, ncols int, reftable text, refcol text, deltype "char", updtype "char", validated boolean, is_deferrable boolean)
LANGUAGE sql STABLE AS $$
  SELECT c.conname, cardinality(c.conkey), c.confrelid::regclass::text,
         (SELECT a.attname::text FROM pg_attribute a WHERE a.attrelid = c.confrelid AND a.attnum = c.confkey[1]),
         c.confdeltype, c.confupdtype, c.convalidated, c.condeferrable
    FROM pg_constraint c
   WHERE c.conrelid = _tbl AND c.contype = 'f'
     AND EXISTS (SELECT 1 FROM unnest(c.conkey) k JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = k WHERE a.attname = _col)
$$;

-- Prüft einen Fremdschlüssel vollständig: genau einer auf der Spalte, einspaltig, erwarteter Name, referenzierte
-- Tabelle und Spalte, gültig, nicht aufschiebbar, ON UPDATE NO ACTION, Löschverhalten = Ist (_from) oder Ziel (_to).
-- Gibt true zurück, wenn der Zielzustand schon erreicht ist.
CREATE OR REPLACE FUNCTION pg_temp.m0159_check_fk(_tbl regclass, _col text, _name text, _reftable text, _refcol text, _from "char", _to "char")
RETURNS boolean LANGUAGE plpgsql STABLE AS $$
DECLARE n int; f record;
BEGIN
  SELECT count(*) INTO n FROM pg_temp.m0159_fks(_tbl, _col);
  IF n <> 1 THEN RAISE EXCEPTION '0159: %.%: % Fremdschlüssel statt genau einem', _tbl, _col, n; END IF;
  SELECT * INTO f FROM pg_temp.m0159_fks(_tbl, _col);
  IF f.conname <> _name THEN RAISE EXCEPTION '0159: %.%: Fremdschlüssel heißt % statt %', _tbl, _col, f.conname, _name; END IF;
  IF f.ncols <> 1 THEN RAISE EXCEPTION '0159: %: mehrspaltiger Fremdschlüssel', f.conname; END IF;
  IF f.reftable IS DISTINCT FROM _reftable OR f.refcol IS DISTINCT FROM _refcol THEN
    RAISE EXCEPTION '0159: % verweist auf %(%) statt %(%)', f.conname, f.reftable, f.refcol, _reftable, _refcol; END IF;
  IF NOT f.validated THEN RAISE EXCEPTION '0159: % ist NOT VALID', f.conname; END IF;
  IF f.is_deferrable THEN RAISE EXCEPTION '0159: % ist DEFERRABLE', f.conname; END IF;
  IF f.updtype <> 'a' THEN RAISE EXCEPTION '0159: % hat ON UPDATE % statt NO ACTION', f.conname, f.updtype; END IF;
  IF f.deltype = _to THEN RETURN true; END IF;
  IF f.deltype <> _from THEN RAISE EXCEPTION '0159: % hat Löschverhalten % – erwartet % (Ist) oder % (Ziel)', f.conname, f.deltype, _from, _to; END IF;
  RETURN false;
END $$;

-- Spalte vorhanden, vom erwarteten Typ; gibt zurück, ob sie NOT NULL ist.
CREATE OR REPLACE FUNCTION pg_temp.m0159_col(_tbl regclass, _col text, _type text)
RETURNS boolean LANGUAGE plpgsql STABLE AS $$
DECLARE a record;
BEGIN
  SELECT format_type(atttypid, atttypmod) AS typ, attnotnull INTO a FROM pg_attribute
   WHERE attrelid = _tbl AND attname = _col AND attnum > 0 AND NOT attisdropped;
  IF NOT FOUND THEN RAISE EXCEPTION '0159: Spalte %.% fehlt', _tbl, _col; END IF;
  IF a.typ <> _type THEN RAISE EXCEPTION '0159: %.% ist % statt %', _tbl, _col, a.typ, _type; END IF;
  RETURN a.attnotnull;
END $$;

-- Setzt einen einspaltigen Fremdschlüssel auf seeds(id) mit neuem Löschverhalten (im selben Schritt geprüft).
CREATE OR REPLACE FUNCTION pg_temp.m0159_set_fk(_tbl regclass, _col text, _name text, _action text)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I', _tbl, _name);
  EXECUTE format('ALTER TABLE %s ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES public.seeds(id) ON DELETE %s', _tbl, _name, _col, _action);
END $$;

-- Ersetzt in einem Funktionstext genau eine Stelle. Leerraum in _old ist beliebiger Leerraum, Groß-/Kleinschreibung
-- zählt. 0 oder mehrere Treffer brechen ab.
CREATE OR REPLACE FUNCTION pg_temp.m0159_replace(_src text, _fn text, _old text, _new text)
RETURNS text LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE pat text; n int;
BEGIN
  pat := regexp_replace(regexp_replace(_old, '([\\.\(\)\[\]\{\}\*\+\?\^\$\|])', '\\\1', 'g'), '\s+', '\\s+', 'g');
  SELECT count(*) INTO n FROM regexp_matches(_src, pat, 'g');
  IF n <> 1 THEN RAISE EXCEPTION '0159: % enthält die erwartete Stelle % mal statt einmal: %', _fn, n, _old; END IF;
  RETURN regexp_replace(_src, pat, replace(_new, '\', '\\'));
END $$;

-- ---------------------------------------------------------------------------------------------------------------
-- 1) Preflight: nur lesend. Bricht bei jeder Abweichung ab.
-- ---------------------------------------------------------------------------------------------------------------
DO $$
DECLARE n bigint; t text; r record;
BEGIN
  -- 1a) Tabellen, Spalten und Typen
  FOREACH t IN ARRAY ARRAY['seeds', 'gifts', 'referrals', 'village_visits', 'twin_works', 'princely_tasks', 'gift_reads'] LOOP
    IF to_regclass('public.' || t) IS NULL THEN RAISE EXCEPTION '0159: Tabelle public.% fehlt', t; END IF;
  END LOOP;
  PERFORM pg_temp.m0159_col('public.seeds', 'id', 'uuid');
  PERFORM pg_temp.m0159_col('public.princely_tasks', 'id', 'uuid');
  PERFORM pg_temp.m0159_col('public.princely_tasks', 'seed_id', 'uuid');
  FOR r IN SELECT * FROM (VALUES ('gifts', 'from_seed'), ('gifts', 'to_seed'), ('referrals', 'referrer_seed'), ('referrals', 'referee_seed'),
      ('village_visits', 'visitor_seed'), ('village_visits', 'visited_seed'), ('twin_works', 'seed_id'), ('twin_works', 'partner_id')) v(tbl, col) LOOP
    PERFORM pg_temp.m0159_col(('public.' || r.tbl)::regclass, r.col, 'uuid');
  END LOOP;
  -- Buchungsseiten, die NOT NULL bleiben müssen (eigene Buchung, CASCADE)
  IF NOT pg_temp.m0159_col('public.village_visits', 'visitor_seed', 'uuid') THEN RAISE EXCEPTION '0159: village_visits.visitor_seed ist nicht NOT NULL'; END IF;
  IF NOT pg_temp.m0159_col('public.twin_works', 'seed_id', 'uuid') THEN RAISE EXCEPTION '0159: twin_works.seed_id ist nicht NOT NULL'; END IF;

  -- 1b) die acht Fremdschlüssel: Name, Spalte, referenzierte Tabelle und Spalte, Gültigkeit, Löschverhalten Ist/Ziel
  PERFORM pg_temp.m0159_check_fk('public.gifts', 'from_seed', 'gifts_from_seed_fkey', 'seeds', 'id', 'c', 'n');
  PERFORM pg_temp.m0159_check_fk('public.gifts', 'to_seed', 'gifts_to_seed_fkey', 'seeds', 'id', 'c', 'n');
  PERFORM pg_temp.m0159_check_fk('public.referrals', 'referrer_seed', 'referrals_referrer_seed_fkey', 'seeds', 'id', 'c', 'n');
  PERFORM pg_temp.m0159_check_fk('public.referrals', 'referee_seed', 'referrals_referee_seed_fkey', 'seeds', 'id', 'c', 'n');
  PERFORM pg_temp.m0159_check_fk('public.village_visits', 'visitor_seed', 'village_visits_visitor_seed_fkey', 'seeds', 'id', 'a', 'c');
  PERFORM pg_temp.m0159_check_fk('public.village_visits', 'visited_seed', 'village_visits_visited_seed_fkey', 'seeds', 'id', 'a', 'n');
  PERFORM pg_temp.m0159_check_fk('public.twin_works', 'seed_id', 'twin_works_seed_id_fkey', 'seeds', 'id', 'c', 'c');
  PERFORM pg_temp.m0159_check_fk('public.twin_works', 'partner_id', 'twin_works_partner_id_fkey', 'seeds', 'id', 'c', 'n');

  -- 1c) Zusatz-Constraints, auf die sich die neue Semantik stützt
  -- eindeutige Schlüssel: mit NULL auf der Verweisseite kollidieren sie nicht (NULLS DISTINCT), müssen aber genau so vorliegen
  FOR r IN SELECT * FROM (VALUES ('village_visits', ARRAY['visitor_seed', 'visited_seed']), ('twin_works', ARRAY['seed_id', 'partner_id']),
      ('referrals', ARRAY['referee_user'])) v(tbl, cols) LOOP
    SELECT count(*) INTO n FROM pg_index i
     WHERE i.indrelid = ('public.' || r.tbl)::regclass AND i.indisunique AND i.indisvalid AND i.indpred IS NULL
       AND (SELECT array_agg(a.attname::text ORDER BY k.ord) FROM unnest(i.indkey::int2[]) WITH ORDINALITY k(attnum, ord)
              JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = k.attnum) = r.cols;
    IF n <> 1 THEN RAISE EXCEPTION '0159: eindeutiger Schlüssel %(%) liegt % mal vor statt einmal', r.tbl, r.cols, n; END IF;
  END LOOP;
  -- kein eindeutiger Index mit NULLS NOT DISTINCT auf einer Spalte, die NULL werden darf (PostgreSQL 15+)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'pg_catalog' AND table_name = 'pg_index' AND column_name = 'indnullsnotdistinct') THEN
    EXECUTE $q$ SELECT count(*) FROM pg_index i WHERE i.indisunique AND i.indnullsnotdistinct
      AND i.indrelid IN ('public.gifts'::regclass, 'public.referrals'::regclass, 'public.village_visits'::regclass, 'public.twin_works'::regclass) $q$ INTO n;
    IF n > 0 THEN RAISE EXCEPTION '0159: % eindeutige Indizes mit NULLS NOT DISTINCT auf den betroffenen Tabellen', n; END IF;
  END IF;
  -- CHECK-Constraints, die eine der künftig leeren Spalten verwenden, würden SET NULL scheitern lassen
  FOR r IN SELECT c.conrelid::regclass::text AS tbl, c.conname, pg_get_constraintdef(c.oid) AS def FROM pg_constraint c
      WHERE c.contype = 'c' AND c.conrelid IN ('public.gifts'::regclass, 'public.referrals'::regclass, 'public.village_visits'::regclass, 'public.twin_works'::regclass)
        AND EXISTS (SELECT 1 FROM unnest(c.conkey) k JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = k
                    WHERE a.attname IN ('from_seed', 'to_seed', 'referrer_seed', 'referee_seed', 'visited_seed', 'partner_id')) LOOP
    RAISE EXCEPTION '0159: CHECK-Constraint %.% verwendet eine Spalte, die NULL werden soll: %', r.tbl, r.conname, r.def;
  END LOOP;
  -- die Spalten dürfen nicht Teil eines Primärschlüssels sein
  SELECT count(*) INTO n FROM pg_index i JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY (i.indkey::int2[])
   WHERE i.indisprimary AND i.indrelid IN ('public.gifts'::regclass, 'public.referrals'::regclass, 'public.village_visits'::regclass, 'public.twin_works'::regclass)
     AND a.attname IN ('from_seed', 'to_seed', 'referrer_seed', 'referee_seed', 'visited_seed', 'partner_id');
  IF n > 0 THEN RAISE EXCEPTION '0159: eine Spalte, die NULL werden soll, ist Teil eines Primärschlüssels'; END IF;
  -- Verweise AUF die vier Tabellen: nur gift_reads -> gifts, ON DELETE CASCADE (sonst scheitert das Entfernen ganz verwaister Geschenke)
  FOR r IN SELECT c.conrelid::regclass::text AS tbl, c.conname, c.confrelid::regclass::text AS ref, c.confdeltype FROM pg_constraint c
      WHERE c.contype = 'f' AND c.confrelid IN ('public.gifts'::regclass, 'public.referrals'::regclass, 'public.village_visits'::regclass, 'public.twin_works'::regclass) LOOP
    IF NOT (r.tbl = 'gift_reads' AND r.conname = 'gift_reads_gift_id_fkey' AND r.ref = 'gifts' AND r.confdeltype = 'c') THEN
      RAISE EXCEPTION '0159: unerwarteter Verweis % (%) auf % mit Löschverhalten %', r.conname, r.tbl, r.ref, r.confdeltype;
    END IF;
  END LOOP;
  SELECT count(*) INTO n FROM pg_constraint WHERE conname = 'gift_reads_gift_id_fkey' AND conrelid = 'public.gift_reads'::regclass AND confdeltype = 'c';
  IF n <> 1 THEN RAISE EXCEPTION '0159: gift_reads_gift_id_fkey (ON DELETE CASCADE) fehlt'; END IF;

  -- 1d) Daten: keine Zeile verweist auf ein fehlendes Dorf (NULL-sicher über NOT EXISTS; NULL heißt „Seite gelöscht“
  --     und ist nur im Zielzustand möglich)
  FOR r IN SELECT * FROM (VALUES ('gifts', 'from_seed'), ('gifts', 'to_seed'), ('referrals', 'referrer_seed'), ('referrals', 'referee_seed'),
      ('village_visits', 'visitor_seed'), ('village_visits', 'visited_seed'), ('twin_works', 'seed_id'), ('twin_works', 'partner_id')) v(tbl, col) LOOP
    EXECUTE format('SELECT count(*) FROM public.%I x WHERE x.%I IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.seeds s WHERE s.id = x.%I)', r.tbl, r.col, r.col) INTO n;
    IF n > 0 THEN RAISE EXCEPTION '0159: %.%: % Zeilen verweisen auf ein fehlendes Dorf', r.tbl, r.col, n; END IF;
  END LOOP;

  -- 1e) princely_errands (falls vorhanden): Spalten wie in den generierten Typen; vorhandene Fremdschlüssel nur im Zielzustand
  IF to_regclass('public.princely_errands') IS NOT NULL THEN
    PERFORM pg_temp.m0159_col('public.princely_errands', 'id', 'uuid');
    PERFORM pg_temp.m0159_col('public.princely_errands', 'seed_id', 'uuid');
    PERFORM pg_temp.m0159_col('public.princely_errands', 'task_id', 'uuid');
    PERFORM pg_temp.m0159_col('public.princely_errands', 'errand', 'text');
    -- die drei Constraints der Produktion: vorhanden, gültig, inhaltlich richtig
    -- Primärschlüssel princely_errands_pkey auf (id)
    SELECT count(*) INTO n FROM pg_constraint c WHERE c.conrelid = 'public.princely_errands'::regclass AND c.contype = 'p'
       AND c.conname = 'princely_errands_pkey' AND c.convalidated
       AND (SELECT array_agg(a.attname::text ORDER BY k.ord) FROM unnest(c.conkey) WITH ORDINALITY k(attnum, ord)
              JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = k.attnum) = ARRAY['id'];
    IF n <> 1 THEN RAISE EXCEPTION '0159: princely_errands: Primärschlüssel princely_errands_pkey auf (id) fehlt oder weicht ab'; END IF;
    -- CHECK princely_errands_errand_check: nur die Spalte errand, erlaubt genau gardener und groom
    SELECT count(*) INTO n FROM pg_constraint c WHERE c.conrelid = 'public.princely_errands'::regclass AND c.contype = 'c'
       AND c.conname = 'princely_errands_errand_check';
    IF n <> 1 THEN RAISE EXCEPTION '0159: princely_errands: CHECK-Constraint princely_errands_errand_check fehlt'; END IF;
    SELECT c.convalidated AS ok, pg_get_constraintdef(c.oid) AS def,
           (SELECT array_agg(a.attname::text ORDER BY a.attname) FROM unnest(c.conkey) k JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = k) AS cols,
           (SELECT array_agg(m[1] ORDER BY m[1]) FROM regexp_matches(pg_get_constraintdef(c.oid), '''([^'']*)''', 'g') m) AS vals
      INTO r FROM pg_constraint c WHERE c.conrelid = 'public.princely_errands'::regclass AND c.conname = 'princely_errands_errand_check';
    IF NOT r.ok THEN RAISE EXCEPTION '0159: princely_errands_errand_check ist NOT VALID'; END IF;
    IF r.cols IS DISTINCT FROM ARRAY['errand'] OR r.vals IS DISTINCT FROM ARRAY['gardener', 'groom']
       OR (r.def !~ '^CHECK \(\(errand = ANY \(ARRAY\[''(gardener|groom)''::text, ''(gardener|groom)''::text\]\)\)\)$'
           AND r.def !~ '^CHECK \(\(\(errand = ''(gardener|groom)''::text\) OR \(errand = ''(gardener|groom)''::text\)\)\)$') THEN
      RAISE EXCEPTION '0159: princely_errands_errand_check weicht ab (erwartet: errand nur gardener oder groom): %', r.def;
    END IF;
    -- UNIQUE princely_errands_task_id_errand_key auf (task_id, errand), ohne NULLS NOT DISTINCT, nicht aufschiebbar
    SELECT count(*) INTO n FROM pg_constraint c WHERE c.conrelid = 'public.princely_errands'::regclass AND c.contype = 'u'
       AND c.conname = 'princely_errands_task_id_errand_key';
    IF n <> 1 THEN RAISE EXCEPTION '0159: princely_errands: UNIQUE-Constraint princely_errands_task_id_errand_key fehlt'; END IF;
    SELECT count(*) INTO n FROM pg_constraint c JOIN pg_index i ON i.indexrelid = c.conindid
     WHERE c.conrelid = 'public.princely_errands'::regclass AND c.conname = 'princely_errands_task_id_errand_key'
       AND c.convalidated AND NOT c.condeferrable AND i.indisvalid AND i.indisunique AND i.indpred IS NULL
       AND (SELECT array_agg(a.attname::text ORDER BY k.ord) FROM unnest(c.conkey) WITH ORDINALITY k(attnum, ord)
              JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = k.attnum) = ARRAY['task_id', 'errand'];
    IF n <> 1 THEN RAISE EXCEPTION '0159: princely_errands_task_id_errand_key weicht ab (erwartet: UNIQUE (task_id, errand), gültig)'; END IF;
    FOR r IN SELECT c.conname, pg_get_constraintdef(c.oid) AS def FROM pg_constraint c WHERE c.conrelid = 'public.princely_errands'::regclass AND c.contype = 'f' LOOP
      IF NOT ((r.conname = 'princely_errands_seed_id_fkey' AND r.def = 'FOREIGN KEY (seed_id) REFERENCES seeds(id) ON DELETE CASCADE')
           OR (r.conname = 'princely_errands_task_id_fkey' AND r.def = 'FOREIGN KEY (task_id) REFERENCES princely_tasks(id) ON DELETE CASCADE')) THEN
        RAISE EXCEPTION '0159: unerwarteter Fremdschlüssel % auf princely_errands: %', r.conname, r.def;
      END IF;
    END LOOP;
    -- Zeilen mit vorhandenem Dorf, aber fehlendem Auftrag (oder ohne Auftrag) gehören einem lebenden Spieler und lassen
    -- sich nicht eindeutig zuordnen: nicht raten, abbrechen. (Zeilen ohne Dorf werden in Schritt 5 entfernt.)
    SELECT count(*) INTO n FROM public.princely_errands e
     WHERE EXISTS (SELECT 1 FROM public.seeds s WHERE s.id = e.seed_id)
       AND NOT EXISTS (SELECT 1 FROM public.princely_tasks t WHERE t.id = e.task_id);
    IF n > 0 THEN RAISE EXCEPTION '0159: princely_errands: % Zeilen eines bestehenden Dorfes ohne zugehörigen Auftrag – von Hand klären', n; END IF;
    -- ein Auftrag gehört zum selben Dorf wie der Botengang (nur für Zeilen bestehender Dörfer; die ohne Dorf werden entfernt)
    SELECT count(*) INTO n FROM public.princely_errands e JOIN public.princely_tasks t ON t.id = e.task_id
     WHERE EXISTS (SELECT 1 FROM public.seeds s WHERE s.id = e.seed_id) AND t.seed_id IS DISTINCT FROM e.seed_id;
    IF n > 0 THEN RAISE EXCEPTION '0159: princely_errands: % Zeilen, deren Auftrag einem anderen Dorf gehört – von Hand klären', n; END IF;
  END IF;

  -- 1f) die beiden Funktionen: vorhanden, eindeutig, SECURITY DEFINER, fester search_path
  FOR r IN SELECT * FROM (VALUES ('abandon_village'), ('purge_user_data')) v(fn) LOOP
    SELECT count(*) INTO n FROM pg_proc p WHERE p.pronamespace = 'public'::regnamespace AND p.proname = r.fn;
    IF n <> 1 THEN RAISE EXCEPTION '0159: public.% liegt % mal vor statt einmal', r.fn, n; END IF;
    SELECT count(*) INTO n FROM pg_proc p WHERE p.pronamespace = 'public'::regnamespace AND p.proname = r.fn
       AND p.prosecdef AND pg_get_function_identity_arguments(p.oid) IN ('_seed uuid', '_uid uuid')
       AND EXISTS (SELECT 1 FROM unnest(p.proconfig) c WHERE c LIKE 'search_path=%');
    IF n <> 1 THEN RAISE EXCEPTION '0159: public.% ist nicht SECURITY DEFINER mit festem search_path und einem uuid-Argument', r.fn; END IF;
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------------------------------------------
-- 2) Ganz verwaiste Buchungszeilen entfernen: beide Seiten gelöscht -> bucht für niemanden mehr
-- ---------------------------------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.finance_orphan_cleanup() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF TG_TABLE_NAME = 'gifts' THEN
    DELETE FROM public.gifts WHERE id = NEW.id AND from_seed IS NULL AND to_seed IS NULL;
  ELSIF TG_TABLE_NAME = 'referrals' THEN
    DELETE FROM public.referrals WHERE id = NEW.id AND referrer_seed IS NULL AND referee_seed IS NULL;
  ELSE
    RAISE EXCEPTION 'finance_orphan_cleanup: unexpected table %', TG_TABLE_NAME;
  END IF;
  RETURN NULL;
END $$;
-- Neue Funktion: Trigger-Funktionen brauchen kein EXECUTE-Recht (beim Feuern nicht geprüft). Die Supabase-Standardrechte
-- und PostgreSQLs PUBLIC-EXECUTE würden sie sonst jeder API-Rolle gewähren.
REVOKE ALL ON FUNCTION public.finance_orphan_cleanup() FROM PUBLIC, anon, authenticated, service_role;

-- ---------------------------------------------------------------------------------------------------------------
-- 3) gifts, referrals, village_visits, twin_works: Verweisseiten dürfen NULL werden, Löschverhalten nach obiger Regel
-- ---------------------------------------------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT pg_temp.m0159_check_fk('public.gifts', 'from_seed', 'gifts_from_seed_fkey', 'seeds', 'id', 'c', 'n') THEN
    ALTER TABLE public.gifts ALTER COLUMN from_seed DROP NOT NULL;
    PERFORM pg_temp.m0159_set_fk('public.gifts', 'from_seed', 'gifts_from_seed_fkey', 'SET NULL');
  END IF;
  IF NOT pg_temp.m0159_check_fk('public.gifts', 'to_seed', 'gifts_to_seed_fkey', 'seeds', 'id', 'c', 'n') THEN
    ALTER TABLE public.gifts ALTER COLUMN to_seed DROP NOT NULL;
    PERFORM pg_temp.m0159_set_fk('public.gifts', 'to_seed', 'gifts_to_seed_fkey', 'SET NULL');
  END IF;
  IF NOT pg_temp.m0159_check_fk('public.referrals', 'referrer_seed', 'referrals_referrer_seed_fkey', 'seeds', 'id', 'c', 'n') THEN
    ALTER TABLE public.referrals ALTER COLUMN referrer_seed DROP NOT NULL;
    PERFORM pg_temp.m0159_set_fk('public.referrals', 'referrer_seed', 'referrals_referrer_seed_fkey', 'SET NULL');
  END IF;
  IF NOT pg_temp.m0159_check_fk('public.referrals', 'referee_seed', 'referrals_referee_seed_fkey', 'seeds', 'id', 'c', 'n') THEN
    ALTER TABLE public.referrals ALTER COLUMN referee_seed DROP NOT NULL;
    PERFORM pg_temp.m0159_set_fk('public.referrals', 'referee_seed', 'referrals_referee_seed_fkey', 'SET NULL');
  END IF;
  IF NOT pg_temp.m0159_check_fk('public.village_visits', 'visitor_seed', 'village_visits_visitor_seed_fkey', 'seeds', 'id', 'a', 'c') THEN
    PERFORM pg_temp.m0159_set_fk('public.village_visits', 'visitor_seed', 'village_visits_visitor_seed_fkey', 'CASCADE');
  END IF;
  IF NOT pg_temp.m0159_check_fk('public.village_visits', 'visited_seed', 'village_visits_visited_seed_fkey', 'seeds', 'id', 'a', 'n') THEN
    ALTER TABLE public.village_visits ALTER COLUMN visited_seed DROP NOT NULL;
    PERFORM pg_temp.m0159_set_fk('public.village_visits', 'visited_seed', 'village_visits_visited_seed_fkey', 'SET NULL');
  END IF;
  -- twin_works.seed_id bleibt ON DELETE CASCADE (in 1b geprüft)
  IF NOT pg_temp.m0159_check_fk('public.twin_works', 'partner_id', 'twin_works_partner_id_fkey', 'seeds', 'id', 'c', 'n') THEN
    ALTER TABLE public.twin_works ALTER COLUMN partner_id DROP NOT NULL;
    PERFORM pg_temp.m0159_set_fk('public.twin_works', 'partner_id', 'twin_works_partner_id_fkey', 'SET NULL');
  END IF;
END $$;

-- Zeilen, die bereits ganz verwaist wären, kann es vor dieser Migration nicht geben (NOT NULL + gültige FKs); nach
-- einem erneuten Lauf hat sie der Trigger schon entfernt. Der Trigger feuert auch bei den SET-NULL-Aktionen der FKs.
DROP TRIGGER IF EXISTS gifts_orphan_cleanup ON public.gifts;
CREATE TRIGGER gifts_orphan_cleanup AFTER UPDATE OF from_seed, to_seed ON public.gifts
  FOR EACH ROW WHEN (NEW.from_seed IS NULL AND NEW.to_seed IS NULL) EXECUTE FUNCTION public.finance_orphan_cleanup();
DROP TRIGGER IF EXISTS referrals_orphan_cleanup ON public.referrals;
CREATE TRIGGER referrals_orphan_cleanup AFTER UPDATE OF referrer_seed, referee_seed ON public.referrals
  FOR EACH ROW WHEN (NEW.referrer_seed IS NULL AND NEW.referee_seed IS NULL) EXECUTE FUNCTION public.finance_orphan_cleanup();

-- ---------------------------------------------------------------------------------------------------------------
-- 4) abandon_village und purge_user_data: Gegenbuchungen anderer Dörfer nicht mehr löschen
--    Aus der LIVE-Definition gepatcht (CREATE OR REPLACE): Eigentümer, Rechte (ACL), SECURITY DEFINER und search_path
--    bleiben unverändert; unbekannte Live-Abweichungen an anderen Stellen bleiben erhalten; fehlt eine erwartete Stelle,
--    bricht die Migration ab. Keine GRANT-/REVOKE-Änderung an diesen Funktionen.
-- ---------------------------------------------------------------------------------------------------------------
DO $$
DECLARE def text; marker constant text := '-- 0159: Gegenbuchungen anderer Dörfer bleiben';
BEGIN
  -- abandon_village(_seed)
  def := pg_get_functiondef('public.abandon_village(uuid)'::regprocedure);
  IF position(marker IN def) = 0 THEN
    def := pg_temp.m0159_replace(def, 'abandon_village', 'DELETE FROM village_visits WHERE visitor_seed = _seed OR visited_seed = _seed;',
      marker || E' (FK ON DELETE SET NULL; ganz verwaiste Zeilen entfernt finance_orphan_cleanup)\n  DELETE FROM village_visits WHERE visitor_seed = _seed;');
    def := pg_temp.m0159_replace(def, 'abandon_village', 'DELETE FROM gifts WHERE from_seed = _seed OR to_seed = _seed;', '');
    def := pg_temp.m0159_replace(def, 'abandon_village', 'DELETE FROM twin_works WHERE seed_id = _seed OR partner_id = _seed;',
      'DELETE FROM twin_works WHERE seed_id = _seed;');
    EXECUTE def;
  END IF;
  -- purge_user_data(_uid)
  def := pg_get_functiondef('public.purge_user_data(uuid)'::regprocedure);
  IF position(marker IN def) = 0 THEN
    def := pg_temp.m0159_replace(def, 'purge_user_data', 'DELETE FROM village_visits WHERE visitor_seed = _seed OR visited_seed = _seed;',
      marker || E' (FK ON DELETE SET NULL; ganz verwaiste Zeilen entfernt finance_orphan_cleanup)\n    DELETE FROM village_visits WHERE visitor_seed = _seed;');
    def := pg_temp.m0159_replace(def, 'purge_user_data', 'DELETE FROM referrals WHERE referrer_seed = _seed OR referee_seed = _seed;', '');
    def := pg_temp.m0159_replace(def, 'purge_user_data', 'DELETE FROM gift_reads WHERE gift_id IN (SELECT id FROM gifts WHERE from_seed = _seed OR to_seed = _seed);', '');
    def := pg_temp.m0159_replace(def, 'purge_user_data', 'DELETE FROM gifts WHERE from_seed = _seed OR to_seed = _seed;', '');
    def := pg_temp.m0159_replace(def, 'purge_user_data', 'DELETE FROM twin_works WHERE seed_id = _seed OR partner_id = _seed;',
      'DELETE FROM twin_works WHERE seed_id = _seed;');
    EXECUTE def;
  END IF;
END $$;

-- ---------------------------------------------------------------------------------------------------------------
-- 5) princely_errands: Tabelle ins Repo holen, Verwaiste entfernen, Fremdschlüssel setzen
-- ---------------------------------------------------------------------------------------------------------------
DO $$
DECLARE n bigint;
BEGIN
  IF to_regclass('public.princely_errands') IS NULL THEN
    -- Nur wo die Tabelle fehlt (lokale/neue Datenbanken). Spalten wie in den generierten Typen der Live-Datenbank,
    -- Constraints wie live bestätigt (princely_errands_pkey, _errand_check, _task_id_errand_key);
    -- Lesen nur für den Eigentümer des Dorfes („owner-only rows“), geschrieben wird über die Funktion princely_errand.
    CREATE TABLE public.princely_errands (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      seed_id uuid NOT NULL,
      task_id uuid NOT NULL,
      errand text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT princely_errands_errand_check CHECK (errand = ANY (ARRAY['gardener'::text, 'groom'::text])),
      CONSTRAINT princely_errands_task_id_errand_key UNIQUE (task_id, errand)
    );
    ALTER TABLE public.princely_errands ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Owners see their errands" ON public.princely_errands FOR SELECT TO authenticated
      USING (EXISTS (SELECT 1 FROM public.seeds s WHERE s.id = princely_errands.seed_id AND s.user_id = auth.uid()));
    REVOKE ALL ON TABLE public.princely_errands FROM PUBLIC, anon, authenticated;
    GRANT SELECT ON TABLE public.princely_errands TO authenticated;
    GRANT ALL ON TABLE public.princely_errands TO service_role;
  END IF;

  -- Verwaiste Zeilen: das Dorf fehlt (oder ist nicht gesetzt). Der Auftrag ist dann per CASCADE ebenfalls weg; die Zeile
  -- gehört niemandem und bucht nichts. (Dorf vorhanden + Auftrag fehlt hat der Preflight schon abgewiesen.)
  DELETE FROM public.princely_errands e WHERE NOT EXISTS (SELECT 1 FROM public.seeds s WHERE s.id = e.seed_id);
  GET DIAGNOSTICS n = ROW_COUNT;
  RAISE NOTICE '0159: % verwaiste princely_errands entfernt', n;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.princely_errands'::regclass AND conname = 'princely_errands_seed_id_fkey') THEN
    ALTER TABLE public.princely_errands ADD CONSTRAINT princely_errands_seed_id_fkey FOREIGN KEY (seed_id) REFERENCES public.seeds(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.princely_errands'::regclass AND conname = 'princely_errands_task_id_fkey') THEN
    ALTER TABLE public.princely_errands ADD CONSTRAINT princely_errands_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.princely_tasks(id) ON DELETE CASCADE;
  END IF;
  IF NOT pg_temp.m0159_col('public.princely_errands', 'seed_id', 'uuid') THEN ALTER TABLE public.princely_errands ALTER COLUMN seed_id SET NOT NULL; END IF;
  IF NOT pg_temp.m0159_col('public.princely_errands', 'task_id', 'uuid') THEN ALTER TABLE public.princely_errands ALTER COLUMN task_id SET NOT NULL; END IF;
END $$;

-- ---------------------------------------------------------------------------------------------------------------
-- 6) Abschlussprüfung: Zielzustand vollständig erreicht (sonst Abbruch und Rollback der ganzen Migration)
-- ---------------------------------------------------------------------------------------------------------------
DO $$
DECLARE r record; def text;
BEGIN
  FOR r IN SELECT * FROM (VALUES
      ('gifts', 'from_seed', 'gifts_from_seed_fkey', 'n', false), ('gifts', 'to_seed', 'gifts_to_seed_fkey', 'n', false),
      ('referrals', 'referrer_seed', 'referrals_referrer_seed_fkey', 'n', false), ('referrals', 'referee_seed', 'referrals_referee_seed_fkey', 'n', false),
      ('village_visits', 'visitor_seed', 'village_visits_visitor_seed_fkey', 'c', true), ('village_visits', 'visited_seed', 'village_visits_visited_seed_fkey', 'n', false),
      ('twin_works', 'seed_id', 'twin_works_seed_id_fkey', 'c', true), ('twin_works', 'partner_id', 'twin_works_partner_id_fkey', 'n', false),
      ('princely_errands', 'seed_id', 'princely_errands_seed_id_fkey', 'c', true)) v(tbl, col, name, del, nn) LOOP
    IF NOT pg_temp.m0159_check_fk(('public.' || r.tbl)::regclass, r.col, r.name, 'seeds', 'id', r.del::"char", r.del::"char") THEN
      RAISE EXCEPTION '0159: % nicht im Zielzustand', r.name; END IF;
    IF pg_temp.m0159_col(('public.' || r.tbl)::regclass, r.col, 'uuid') <> r.nn THEN
      RAISE EXCEPTION '0159: %.% NOT NULL = % erwartet', r.tbl, r.col, r.nn; END IF;
  END LOOP;
  IF NOT pg_temp.m0159_check_fk('public.princely_errands', 'task_id', 'princely_errands_task_id_fkey', 'princely_tasks', 'id', 'c', 'c') THEN
    RAISE EXCEPTION '0159: princely_errands_task_id_fkey nicht im Zielzustand'; END IF;
  IF (SELECT count(*) FROM pg_constraint c WHERE c.conrelid = 'public.princely_errands'::regclass AND c.convalidated
        AND c.conname IN ('princely_errands_pkey', 'princely_errands_errand_check', 'princely_errands_task_id_errand_key')) <> 3 THEN
    RAISE EXCEPTION '0159: princely_errands: die drei Constraints (pkey, errand_check, task_id_errand_key) sind nicht vollständig'; END IF;
  FOR r IN SELECT * FROM (VALUES ('public.abandon_village(uuid)'), ('public.purge_user_data(uuid)')) v(fn) LOOP
    def := pg_get_functiondef(r.fn::regprocedure);
    IF def ~ 'village_visits\s+WHERE[^;]*visited_seed' OR def ~ 'twin_works\s+WHERE[^;]*partner_id'
       OR def ~ 'FROM\s+gifts\M' OR def ~ 'DELETE\s+FROM\s+referrals\M' THEN
      RAISE EXCEPTION '0159: % löscht weiterhin Gegenbuchungen', r.fn; END IF;
  END LOOP;
END $$;

COMMENT ON FUNCTION public.finance_orphan_cleanup() IS
  '0159: entfernt gifts-/referrals-Zeilen, deren beide Dörfer gelöscht sind (feuert auch bei den ON DELETE SET NULL-Aktionen).';
COMMENT ON TABLE public.princely_errands IS
  'Hofdienst-Botengänge je fürstlichem Auftrag. 0159: seed_id -> seeds und task_id -> princely_tasks, beide ON DELETE CASCADE.';
