CREATE OR REPLACE FUNCTION public.purchase_guard()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE price integer; need text; sx integer; sy integer; cpath text; prev text;
BEGIN
  price := CASE NEW.item WHEN 'herbs' THEN 90 WHEN 'hunter' THEN 110 WHEN 'fisher' THEN 120 WHEN 'woodcamp' THEN 180
    WHEN 'granary' THEN 300 WHEN 'healer' THEN 550 WHEN 'school' THEN 3000
    WHEN 'markethall' THEN 450 WHEN 'guildhall' THEN 450 WHEN 'library' THEN 450 WHEN 'dairy' THEN 450
    WHEN 'firehouse' THEN 600 WHEN 'guard' THEN 800
    WHEN 'belfry1' THEN 400 WHEN 'belfry2' THEN 500 WHEN 'belfry3' THEN 600 WHEN 'belfry4' THEN 700 ELSE NULL END;
  IF price IS NULL THEN RAISE EXCEPTION 'unknown item'; END IF;
  need := CASE NEW.item WHEN 'markethall' THEN 'trade' WHEN 'guildhall' THEN 'craft' WHEN 'library' THEN 'culture' WHEN 'dairy' THEN 'farm' ELSE NULL END;
  prev := CASE NEW.item WHEN 'belfry2' THEN 'belfry1' WHEN 'belfry3' THEN 'belfry2' WHEN 'belfry4' THEN 'belfry3' ELSE NULL END;
  IF NEW.item LIKE 'belfry%' AND EXISTS (SELECT 1 FROM purchases WHERE seed_id = NEW.seed_id AND item = NEW.item) THEN RAISE EXCEPTION 'step already paid'; END IF;
  IF prev IS NOT NULL AND NOT EXISTS (SELECT 1 FROM purchases WHERE seed_id = NEW.seed_id AND item = prev AND created_at <= now() - interval '3 hours') THEN RAISE EXCEPTION 'previous step open'; END IF;
  NEW.cost := price; NEW.created_at := now();
  SELECT s.x, s.y INTO sx, sy FROM public.seeds s WHERE s.id = NEW.seed_id;
  SELECT c.path INTO cpath FROM public.charters c WHERE c.seed_id = NEW.seed_id;
  IF need IS NOT NULL AND cpath IS DISTINCT FROM need THEN RAISE EXCEPTION 'wrong charter'; END IF;
  IF (NEW.x IS NULL) <> (NEW.y IS NULL) THEN RAISE EXCEPTION 'bad position'; END IF;
  IF NEW.x IS NOT NULL AND sqrt(power(NEW.x - sx, 2) + power(NEW.y - sy, 2)) > 60 THEN RAISE EXCEPTION 'too far'; END IF;
  IF public.village_balance(NEW.seed_id) < price THEN RAISE EXCEPTION 'not enough money'; END IF;
  RETURN NEW;
END $function$;