CREATE OR REPLACE FUNCTION public.first_road_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE a public.seeds; b public.seeds;
BEGIN
  SELECT * INTO a FROM public.seeds WHERE id = NEW.seed_id;
  SELECT * INTO b FROM public.seeds WHERE id = NEW.target_id;
  IF a.id IS NULL OR b.id IS NULL OR a.id = b.id OR a.realm IS DISTINCT FROM b.realm
     OR sqrt(power(a.x - b.x, 2) + power(a.y - b.y, 2)) > 80 THEN
    RAISE EXCEPTION 'target out of reach';
  END IF;
  -- one decision per direction; the neighbour may join an existing road from the other side
  IF EXISTS (SELECT 1 FROM public.first_roads r WHERE r.seed_id = a.id AND r.target_id = b.id) THEN
    RAISE EXCEPTION 'road exists';
  END IF;
  IF EXISTS (SELECT 1 FROM public.first_roads r WHERE r.seed_id = a.id AND r.created_at > now() - interval '24 hours') THEN
    RAISE EXCEPTION 'road under construction';
  END IF;
  NEW.created_at := now();
  RETURN NEW;
END $$;