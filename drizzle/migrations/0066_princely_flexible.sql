ALTER TABLE public.princely_tasks ADD COLUMN IF NOT EXISTS swapped_at timestamptz;

CREATE OR REPLACE FUNCTION public.princely_task_met(_seed uuid, _task text, _since timestamptz)
 RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  RETURN CASE _task
    WHEN 'wonder' THEN EXISTS (SELECT 1 FROM wonder_finds WHERE seed_id=_seed AND created_at>_since)
      OR (SELECT count(*) FROM wonder_finds WHERE seed_id=_seed) >= 6
    WHEN 'letter' THEN EXISTS (SELECT 1 FROM letters WHERE from_seed=_seed AND created_at>_since)
    WHEN 'visit' THEN EXISTS (SELECT 1 FROM village_visits WHERE visitor_seed=_seed AND created_at>_since)
    WHEN 'build' THEN EXISTS (SELECT 1 FROM purchases WHERE seed_id=_seed AND created_at>_since)
      OR (SELECT count(*) FROM purchases WHERE seed_id=_seed) >= 8
    WHEN 'gift' THEN EXISTS (SELECT 1 FROM gifts WHERE from_seed=_seed AND created_at>_since)
    WHEN 'road' THEN EXISTS (SELECT 1 FROM first_roads WHERE seed_id=_seed AND created_at>_since)
      OR (SELECT count(*) FROM first_roads WHERE seed_id=_seed OR target_id=_seed) >= 2
    WHEN 'court' THEN now() >= _since + interval '8 hours'
    ELSE false END;
END $$;
REVOKE EXECUTE ON FUNCTION public.princely_task_met(uuid, text, timestamptz) FROM anon, public;

-- swap an open decree for court service (always achievable), at most once per 24 h
CREATE OR REPLACE FUNCTION public.princely_swap(_seed uuid)
 RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE me public.seeds; open public.princely_tasks; lastswap timestamptz;
BEGIN
  SELECT * INTO me FROM seeds WHERE id=_seed;
  IF me.id IS NULL OR me.user_id IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'not your village'; END IF;
  PERFORM pg_advisory_xact_lock(hashtext('princely' || _seed::text));
  SELECT * INTO open FROM princely_tasks WHERE seed_id=_seed AND done_at IS NULL LIMIT 1;
  IF open.id IS NULL THEN RETURN 'none'; END IF;
  IF open.task = 'court' THEN RETURN 'same'; END IF;
  SELECT max(swapped_at) INTO lastswap FROM princely_tasks WHERE seed_id=_seed;
  IF lastswap IS NOT NULL AND lastswap > now() - interval '24 hours' THEN RETURN 'wait'; END IF;
  UPDATE princely_tasks SET task='court', accepted_at=now(), swapped_at=now() WHERE id=open.id;
  RETURN 'swapped';
END $$;
REVOKE EXECUTE ON FUNCTION public.princely_swap(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.princely_swap(uuid) TO authenticated;