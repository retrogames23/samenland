CREATE OR REPLACE FUNCTION public.village_raids(_seed uuid, _created timestamptz, _at timestamptz)
RETURNS integer LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE n integer; k integer; loss integer := 0; g timestamptz; t timestamptz;
BEGIN
  IF extract(epoch FROM (_at - _created)) < 10*86400 THEN RETURN 0; END IF;
  n := floor((extract(epoch FROM (_at - _created)) - 10*86400) / (17*86400))::integer + 1;
  SELECT min(created_at) INTO g FROM public.purchases WHERE seed_id = _seed AND item = 'guard';
  FOR k IN 0..n-1 LOOP
    t := _created + make_interval(days => 10 + 17*k);
    IF g IS NULL OR g > t THEN loss := loss + 25; END IF;
  END LOOP;
  RETURN loss;
END $$;

CREATE OR REPLACE FUNCTION public.village_balance(_seed uuid)
 RETURNS integer LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE created timestamptz; cpath text; cat timestamptz; spent integer; ev integer; tw integer;
BEGIN
  SELECT s.created_at INTO created FROM public.seeds s WHERE s.id = _seed;
  SELECT c.path, c.created_at INTO cpath, cat FROM public.charters c WHERE c.seed_id = _seed;
  SELECT coalesce(sum(cost),0) INTO spent FROM public.purchases WHERE seed_id = _seed;
  SELECT coalesce(sum(cost),0) INTO ev FROM public.encounters WHERE seed_id = _seed;
  SELECT coalesce(sum(cost),0) INTO tw FROM public.twin_works WHERE seed_id = _seed;
  RETURN 150 + public.village_tax(created, now()) + public.village_dowry(created, now()) + (CASE WHEN cpath = 'trade' THEN public.charter_tax(created, cat, now()) ELSE 0 END) - spent - ev - tw - public.village_raids(_seed, created, now());
END $function$;

CREATE OR REPLACE FUNCTION public.purchase_guard()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE price integer; need text; sx integer; sy integer; cpath text;
BEGIN
  price := CASE NEW.item WHEN 'fisher' THEN 120 WHEN 'granary' THEN 300 WHEN 'healer' THEN 900 WHEN 'school' THEN 3000
    WHEN 'markethall' THEN 450 WHEN 'guildhall' THEN 450 WHEN 'library' THEN 450 WHEN 'dairy' THEN 450
    WHEN 'firehouse' THEN 600 WHEN 'guard' THEN 800 ELSE NULL END;
  IF price IS NULL THEN RAISE EXCEPTION 'unknown item'; END IF;
  need := CASE NEW.item WHEN 'markethall' THEN 'trade' WHEN 'guildhall' THEN 'craft' WHEN 'library' THEN 'culture' WHEN 'dairy' THEN 'farm' ELSE NULL END;
  NEW.cost := price; NEW.created_at := now();
  SELECT s.x, s.y INTO sx, sy FROM public.seeds s WHERE s.id = NEW.seed_id;
  SELECT c.path INTO cpath FROM public.charters c WHERE c.seed_id = NEW.seed_id;
  IF need IS NOT NULL AND cpath IS DISTINCT FROM need THEN RAISE EXCEPTION 'wrong charter'; END IF;
  IF (NEW.x IS NULL) <> (NEW.y IS NULL) THEN RAISE EXCEPTION 'bad position'; END IF;
  IF NEW.x IS NOT NULL AND sqrt(power(NEW.x - sx, 2) + power(NEW.y - sy, 2)) > 40 THEN RAISE EXCEPTION 'too far'; END IF;
  IF public.village_balance(NEW.seed_id) < price THEN RAISE EXCEPTION 'not enough money'; END IF;
  RETURN NEW;
END $function$;