CREATE OR REPLACE FUNCTION public.road_done(_a uuid, _b uuid) RETURNS timestamptz LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE a public.seeds; b public.seeds; ta timestamptz; tb timestamptz; t0 timestamptz; t1 timestamptz; fin timestamptz;
BEGIN
  SELECT * INTO a FROM public.seeds WHERE id = _a;
  SELECT * INTO b FROM public.seeds WHERE id = _b;
  SELECT min(created_at) INTO ta FROM public.first_roads WHERE seed_id = _a AND target_id = _b;
  SELECT min(created_at) INTO tb FROM public.first_roads WHERE seed_id = _b AND target_id = _a;
  t0 := LEAST(ta, tb); t1 := GREATEST(ta, tb);
  IF t0 IS NULL OR a.id IS NULL OR b.id IS NULL THEN RETURN NULL; END IF;
  fin := t0 + make_interval(hours => GREATEST(8, round(sqrt(power(a.x - b.x, 2) + power(a.y - b.y, 2)) * 0.5))::int);
  IF ta IS NOT NULL AND tb IS NOT NULL AND t1 < fin THEN RETURN t1 + (fin - t1) / 2; END IF;
  RETURN fin;
END $$;

CREATE OR REPLACE FUNCTION public.first_road_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE a public.seeds; b public.seeds;
BEGIN
  SELECT * INTO a FROM public.seeds WHERE id = NEW.seed_id;
  SELECT * INTO b FROM public.seeds WHERE id = NEW.target_id;
  IF a.id IS NULL OR b.id IS NULL OR a.id = b.id OR a.realm IS DISTINCT FROM b.realm
     OR sqrt(power(a.x - b.x, 2) + power(a.y - b.y, 2)) > 80 THEN
    RAISE EXCEPTION 'target out of reach';
  END IF;
  IF EXISTS (SELECT 1 FROM public.first_roads r WHERE r.seed_id = a.id AND r.target_id = b.id) THEN
    RAISE EXCEPTION 'road exists';
  END IF;
  IF EXISTS (SELECT 1 FROM public.first_roads r WHERE r.seed_id = a.id AND public.road_done(r.seed_id, r.target_id) > now()) THEN
    RAISE EXCEPTION 'road under construction';
  END IF;
  NEW.created_at := now();
  RETURN NEW;
END $$;