CREATE OR REPLACE FUNCTION public.purchase_guard()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE price integer; need text; sx integer; sy integer; cpath text; prev text; created timestamptz; guildb text; nroads integer; mkey text; mstep integer;
BEGIN
  price := CASE NEW.item WHEN 'herbs' THEN 90 WHEN 'hunter' THEN 110 WHEN 'fisher' THEN 120 WHEN 'woodcamp' THEN 180
    WHEN 'granary' THEN 300 WHEN 'healer' THEN 550 WHEN 'school' THEN 3000
    WHEN 'markethall' THEN 450 WHEN 'guildhall' THEN 450 WHEN 'library' THEN 450 WHEN 'dairy' THEN 450
    WHEN 'firehouse' THEN 600 WHEN 'guard' THEN 800
    WHEN 'belfry1' THEN 400 WHEN 'belfry2' THEN 500 WHEN 'belfry3' THEN 600 WHEN 'belfry4' THEN 700
    WHEN 'theater1' THEN 500 WHEN 'theater2' THEN 700 WHEN 'theater3' THEN 900
    WHEN 'cathedral1' THEN 800 WHEN 'cathedral2' THEN 1000 WHEN 'cathedral3' THEN 1200 WHEN 'cathedral4' THEN 1400 WHEN 'cathedral5' THEN 1600
    WHEN 'university1' THEN 700 WHEN 'university2' THEN 900 WHEN 'university3' THEN 1100 WHEN 'university4' THEN 1300
    WHEN 'exchange1' THEN 700 WHEN 'exchange2' THEN 900 WHEN 'exchange3' THEN 1100 WHEN 'exchange4' THEN 1300
    WHEN 'orangery1' THEN 500 WHEN 'orangery2' THEN 700 WHEN 'orangery3' THEN 900
    WHEN 'opera1' THEN 1200 WHEN 'opera2' THEN 1500 WHEN 'opera3' THEN 1800 WHEN 'opera4' THEN 2100
    WHEN 'rank2' THEN 250 WHEN 'rank3' THEN 800 ELSE NULL END;
  IF price IS NULL THEN RAISE EXCEPTION 'unknown item'; END IF;
  need := CASE NEW.item WHEN 'markethall' THEN 'trade' WHEN 'guildhall' THEN 'craft' WHEN 'library' THEN 'culture' WHEN 'dairy' THEN 'farm' ELSE NULL END;
  mkey := substring(NEW.item from '^(belfry|theater|cathedral|university|exchange|orangery|opera)[0-9]$');
  IF mkey IS NOT NULL THEN
    mstep := substring(NEW.item from '([0-9])$')::integer;
    IF mstep > 1 THEN prev := mkey || (mstep - 1)::text; END IF;
    IF mstep = 1 AND NEW.x IS NULL THEN RAISE EXCEPTION 'bad position'; END IF;
    IF mstep > 1 AND NEW.x IS NOT NULL THEN RAISE EXCEPTION 'bad position'; END IF;
  END IF;
  IF (mkey IS NOT NULL OR NEW.item LIKE 'rank%') AND EXISTS (SELECT 1 FROM purchases WHERE seed_id = NEW.seed_id AND item = NEW.item) THEN RAISE EXCEPTION 'step already paid'; END IF;
  IF prev IS NOT NULL AND NOT EXISTS (SELECT 1 FROM purchases WHERE seed_id = NEW.seed_id AND item = prev AND created_at <= now() - interval '3 hours') THEN RAISE EXCEPTION 'previous step open'; END IF;
  NEW.cost := price; NEW.created_at := now();
  SELECT s.x, s.y, s.created_at INTO sx, sy, created FROM public.seeds s WHERE s.id = NEW.seed_id;
  SELECT c.path INTO cpath FROM public.charters c WHERE c.seed_id = NEW.seed_id;
  IF need IS NOT NULL AND cpath IS DISTINCT FROM need THEN RAISE EXCEPTION 'wrong charter'; END IF;
  IF NEW.item IN ('rank2', 'rank3') THEN
    IF cpath IS NULL THEN RAISE EXCEPTION 'no charter'; END IF;
    IF NEW.x IS NOT NULL THEN RAISE EXCEPTION 'bad position'; END IF;
    guildb := CASE cpath WHEN 'trade' THEN 'markethall' WHEN 'craft' THEN 'guildhall' WHEN 'culture' THEN 'library' ELSE 'dairy' END;
    IF NEW.item = 'rank2' THEN
      IF now() - created < interval '168 hours' THEN RAISE EXCEPTION 'too young'; END IF;
      IF NOT EXISTS (SELECT 1 FROM purchases WHERE seed_id = NEW.seed_id AND item = guildb) THEN RAISE EXCEPTION 'guild building missing'; END IF;
    ELSE
      IF now() - created < interval '4380 hours' THEN RAISE EXCEPTION 'too young'; END IF;
      IF NOT EXISTS (SELECT 1 FROM purchases WHERE seed_id = NEW.seed_id AND item = 'rank2') THEN RAISE EXCEPTION 'previous step open'; END IF;
      IF NOT EXISTS (SELECT 1 FROM purchases WHERE seed_id = NEW.seed_id AND item = 'belfry4') THEN RAISE EXCEPTION 'belfry missing'; END IF;
      SELECT count(DISTINCT CASE WHEN r.seed_id = NEW.seed_id THEN r.target_id ELSE r.seed_id END) INTO nroads
        FROM public.first_roads r WHERE (r.seed_id = NEW.seed_id OR r.target_id = NEW.seed_id) AND public.road_done(r.seed_id, r.target_id) <= now();
      IF nroads < 2 THEN RAISE EXCEPTION 'roads missing'; END IF;
    END IF;
  END IF;
  IF (NEW.x IS NULL) <> (NEW.y IS NULL) THEN RAISE EXCEPTION 'bad position'; END IF;
  IF NEW.x IS NOT NULL AND sqrt(power(NEW.x - sx, 2) + power(NEW.y - sy, 2)) > 60 THEN RAISE EXCEPTION 'too far'; END IF;
  IF public.village_balance(NEW.seed_id) < price THEN RAISE EXCEPTION 'not enough money'; END IF;
  RETURN NEW;
END $function$;