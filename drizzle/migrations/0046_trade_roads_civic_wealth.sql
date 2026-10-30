DO $$ DECLARE definition text; BEGIN
 SELECT pg_get_functiondef('public.village_civic_wealth(uuid,timestamp with time zone)'::regprocedure) INTO definition;
 IF position('wealth := 25 + stage*5' in definition)=0 THEN RAISE EXCEPTION 'unexpected civic formula'; END IF;
 EXECUTE replace(definition, 'wealth := 25 + stage*5', 'wealth := least(30, (SELECT count(DISTINCT CASE WHEN r.seed_id = _seed THEN r.target_id ELSE r.seed_id END)::integer * 10 FROM public.first_roads r WHERE (r.seed_id = _seed OR r.target_id = _seed) AND public.road_done(r.seed_id, r.target_id) <= _at)) + 25 + stage*5');
END $$;