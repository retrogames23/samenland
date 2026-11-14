ALTER TABLE public.rank_certificates ADD COLUMN IF NOT EXISTS ways integer NOT NULL DEFAULT 0;
DO $mig$
DECLARE d text;
BEGIN
  d := pg_get_functiondef('public.first_road_guard()'::regprocedure);
  IF position('power(a.y - b.y, 2)) > 80' in d) = 0 THEN RAISE EXCEPTION 'unexpected road guard'; END IF;
  EXECUTE replace(d, 'power(a.y - b.y, 2)) > 80', 'power(a.y - b.y, 2)) > 120');
  d := pg_get_functiondef('public.quest_guard()'::regprocedure);
  IF position('power(o.y - me.y, 2)) <= 80' in d) = 0 THEN RAISE EXCEPTION 'unexpected quest guard'; END IF;
  EXECUTE replace(d, 'power(o.y - me.y, 2)) <= 80', 'power(o.y - me.y, 2)) <= 120');
  d := pg_get_functiondef('public.purchase_guard()'::regprocedure);
  IF position('IF nroads < 2 THEN' in d) = 0 THEN RAISE EXCEPTION 'unexpected purchase guard'; END IF;
  EXECUTE replace(d, 'IF nroads < 2 THEN', 'IF nroads + least(2, coalesce((SELECT rc.ways FROM public.rank_certificates rc WHERE rc.seed_id = NEW.seed_id AND rc.certified_at > now() - interval ''15 minutes''), 0)) < 2 THEN');
END $mig$;