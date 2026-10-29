ALTER TABLE public.first_roads DROP CONSTRAINT IF EXISTS first_roads_seed_id_key;
CREATE INDEX IF NOT EXISTS first_roads_seed_idx ON public.first_roads(seed_id, created_at);
CREATE OR REPLACE FUNCTION public.first_road_guard()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE a public.seeds; b public.seeds;
BEGIN
  SELECT * INTO a FROM public.seeds WHERE id = NEW.seed_id;
  SELECT * INTO b FROM public.seeds WHERE id = NEW.target_id;
  IF a.id IS NULL OR b.id IS NULL OR a.id = b.id OR a.realm IS DISTINCT FROM b.realm
     OR sqrt(power(a.x - b.x, 2) + power(a.y - b.y, 2)) > 80 THEN
    RAISE EXCEPTION 'target out of reach';
  END IF;
  IF EXISTS (SELECT 1 FROM public.first_roads r WHERE (r.seed_id = a.id AND r.target_id = b.id) OR (r.seed_id = b.id AND r.target_id = a.id)) THEN
    RAISE EXCEPTION 'road exists';
  END IF;
  IF EXISTS (SELECT 1 FROM public.first_roads r WHERE r.seed_id = a.id AND r.created_at > now() - interval '24 hours') THEN
    RAISE EXCEPTION 'road under construction';
  END IF;
  NEW.created_at := now();
  RETURN NEW;
END $function$;