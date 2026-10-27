ALTER TABLE public.purchases ADD COLUMN x integer, ADD COLUMN y integer;
CREATE OR REPLACE FUNCTION public.purchase_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE price integer; created timestamptz; spent integer; sx integer; sy integer;
BEGIN
  price := CASE NEW.item WHEN 'fisher' THEN 120 WHEN 'granary' THEN 300 WHEN 'healer' THEN 900 WHEN 'school' THEN 3000 ELSE NULL END;
  IF price IS NULL THEN RAISE EXCEPTION 'unknown item'; END IF;
  NEW.cost := price; NEW.created_at := now();
  SELECT s.created_at, s.x, s.y INTO created, sx, sy FROM public.seeds s WHERE s.id = NEW.seed_id;
  IF (NEW.x IS NULL) <> (NEW.y IS NULL) THEN RAISE EXCEPTION 'bad position'; END IF;
  IF NEW.x IS NOT NULL AND sqrt(power(NEW.x - sx, 2) + power(NEW.y - sy, 2)) > 40 THEN RAISE EXCEPTION 'too far'; END IF;
  SELECT coalesce(sum(p.cost), 0) INTO spent FROM public.purchases p WHERE p.seed_id = NEW.seed_id;
  IF 150 + public.village_tax(created, now()) - spent < price THEN RAISE EXCEPTION 'not enough money'; END IF;
  RETURN NEW;
END $$;