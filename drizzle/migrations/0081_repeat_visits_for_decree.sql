ALTER TABLE public.village_visits ADD COLUMN IF NOT EXISTS last_at timestamptz;

CREATE OR REPLACE FUNCTION public.claim_visit(_seed uuid, _visited uuid) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE me public.seeds; them public.seeds; r integer;
BEGIN
  SELECT * INTO me FROM public.seeds WHERE id = _seed;
  SELECT * INTO them FROM public.seeds WHERE id = _visited;
  IF me.id IS NULL OR me.user_id IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'not your village'; END IF;
  IF them.id IS NULL OR them.id = me.id OR them.realm <> me.realm THEN RAISE EXCEPTION 'bad village'; END IF;
  IF sqrt(power(me.x - them.x, 2) + power(me.y - them.y, 2)) > 200 THEN RAISE EXCEPTION 'too far'; END IF;
  r := public.visit_reward(extract(epoch FROM (now() - them.created_at)) / 3600);
  INSERT INTO public.village_visits(visitor_seed, visited_seed, reward) VALUES (_seed, _visited, r) ON CONFLICT DO NOTHING;
  IF NOT FOUND THEN
    -- repeat visit: no second welcome gift, but it counts for the prince's "visit" decree
    UPDATE public.village_visits SET last_at = now() WHERE visitor_seed = _seed AND visited_seed = _visited;
    RETURN 0;
  END IF;
  RETURN r;
END $$;

CREATE OR REPLACE FUNCTION public.princely_task_met(_seed uuid, _task text, _since timestamptz) RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN CASE _task
    WHEN 'wonder' THEN EXISTS (SELECT 1 FROM wonder_finds WHERE seed_id=_seed AND created_at>_since)
      OR (SELECT count(*) FROM wonder_finds WHERE seed_id=_seed) >= 6
    WHEN 'letter' THEN EXISTS (SELECT 1 FROM letters WHERE from_seed=_seed AND created_at>_since)
    WHEN 'visit' THEN EXISTS (SELECT 1 FROM village_visits WHERE visitor_seed=_seed AND (created_at>_since OR last_at>_since))
    WHEN 'build' THEN EXISTS (SELECT 1 FROM purchases WHERE seed_id=_seed AND created_at>_since)
      OR (SELECT count(*) FROM purchases WHERE seed_id=_seed) >= 8
    WHEN 'gift' THEN EXISTS (SELECT 1 FROM gifts WHERE from_seed=_seed AND created_at>_since)
    WHEN 'road' THEN EXISTS (SELECT 1 FROM first_roads WHERE seed_id=_seed AND created_at>_since)
      OR (SELECT count(*) FROM first_roads WHERE seed_id=_seed OR target_id=_seed) >= 2
    WHEN 'court' THEN (SELECT count(DISTINCT e.errand) FROM princely_errands e JOIN princely_tasks t ON t.id = e.task_id
      WHERE e.seed_id=_seed AND t.done_at IS NULL AND t.task='court') >= 2
    ELSE false END;
END $$;