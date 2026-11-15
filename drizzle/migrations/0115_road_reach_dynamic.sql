CREATE OR REPLACE FUNCTION public.first_road_guard()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE a public.seeds; b public.seeds; dist double precision; near_n integer;
BEGIN
  SELECT * INTO a FROM public.seeds WHERE id = NEW.seed_id;
  SELECT * INTO b FROM public.seeds WHERE id = NEW.target_id;
  IF a.id IS NULL OR b.id IS NULL OR a.id = b.id OR a.realm IS DISTINCT FROM b.realm THEN
    RAISE EXCEPTION 'target out of reach';
  END IF;
  dist := sqrt(power(a.x - b.x, 2) + power(a.y - b.y, 2));
  IF dist > 120 THEN RAISE EXCEPTION 'target out of reach'; END IF;
  IF dist > 80 AND NOT EXISTS (SELECT 1 FROM public.first_roads r WHERE r.seed_id = b.id AND r.target_id = a.id) THEN
    SELECT count(*) INTO near_n FROM public.seeds o
      WHERE o.id <> a.id AND o.realm IS NOT DISTINCT FROM a.realm
        AND sqrt(power(o.x - a.x, 2) + power(o.y - a.y, 2)) <= 80;
    IF near_n >= 2 THEN RAISE EXCEPTION 'target out of reach'; END IF;
  END IF;
  IF EXISTS (SELECT 1 FROM public.first_roads r WHERE r.seed_id = a.id AND r.target_id = b.id) THEN
    RAISE EXCEPTION 'road exists';
  END IF;
  IF EXISTS (SELECT 1 FROM public.first_roads r WHERE r.seed_id = a.id AND public.road_done(r.seed_id, r.target_id) > now()) THEN
    RAISE EXCEPTION 'road under construction';
  END IF;
  NEW.created_at := now();
  RETURN NEW;
END $function$;