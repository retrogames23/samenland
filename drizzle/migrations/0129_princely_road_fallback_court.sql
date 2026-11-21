CREATE OR REPLACE FUNCTION public.princely_road_open(_seed uuid) RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE a public.seeds; reach double precision;
BEGIN
  SELECT * INTO a FROM seeds WHERE id=_seed;
  IF a.id IS NULL THEN RETURN false; END IF;
  reach := CASE WHEN (SELECT count(*) FROM seeds o WHERE o.id<>a.id AND o.realm IS NOT DISTINCT FROM a.realm
    AND sqrt(power(o.x-a.x,2)+power(o.y-a.y,2)) <= 80) < 2 THEN 120 ELSE 80 END;
  RETURN EXISTS (SELECT 1 FROM seeds o WHERE o.id<>a.id AND o.realm IS NOT DISTINCT FROM a.realm
    AND NOT EXISTS (SELECT 1 FROM first_roads r WHERE (r.seed_id=a.id AND r.target_id=o.id) OR (r.seed_id=o.id AND r.target_id=a.id))
    AND sqrt(power(o.x-a.x,2)+power(o.y-a.y,2)) <= reach);
END $$;
REVOKE EXECUTE ON FUNCTION public.princely_road_open(uuid) FROM anon, public;

CREATE OR REPLACE FUNCTION public.princely_audience(_seed uuid)
 RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE me public.seeds; open public.princely_tasks; last timestamptz; n integer; d record;
BEGIN
  SELECT * INTO me FROM seeds WHERE id=_seed;
  IF me.id IS NULL OR me.user_id IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'not your village'; END IF;
  PERFORM pg_advisory_xact_lock(hashtext('princely' || _seed::text));
  SELECT * INTO open FROM princely_tasks WHERE seed_id=_seed AND done_at IS NULL LIMIT 1;
  IF open.id IS NOT NULL THEN
    IF public.princely_task_met(_seed, open.task, open.accepted_at) THEN
      UPDATE princely_tasks SET done_at=now() WHERE id=open.id; RETURN 'done';
    END IF;
    IF open.task='road' AND NOT public.princely_road_open(_seed) THEN
      UPDATE princely_tasks SET task='court', accepted_at=now() WHERE id=open.id;
    END IF;
    RETURN 'open';
  END IF;
  SELECT count(*), max(done_at) INTO n, last FROM princely_tasks WHERE seed_id=_seed;
  IF n >= 12 THEN RETURN 'all'; END IF;
  IF last IS NOT NULL AND last >= public.realm_day_start(_seed) THEN RETURN 'rest'; END IF;
  SELECT * INTO d FROM public.princely_task_def(n+1);
  IF d.task='road' AND NOT public.princely_road_open(_seed) THEN d.task := 'court'; END IF;
  INSERT INTO princely_tasks(seed_id, step, task, reward) VALUES (_seed, n+1, d.task, d.reward);
  RETURN 'new';
END $function$;