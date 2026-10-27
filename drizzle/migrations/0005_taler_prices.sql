CREATE OR REPLACE FUNCTION public.purchase_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE price integer; created timestamptz; spent integer;
BEGIN
  price := CASE NEW.item WHEN 'fisher' THEN 120 WHEN 'granary' THEN 300 WHEN 'healer' THEN 900 WHEN 'school' THEN 3000 ELSE NULL END;
  IF price IS NULL THEN RAISE EXCEPTION 'unknown item'; END IF;
  NEW.cost := price; NEW.created_at := now();
  SELECT s.created_at INTO created FROM public.seeds s WHERE s.id = NEW.seed_id;
  SELECT coalesce(sum(p.cost), 0) INTO spent FROM public.purchases p WHERE p.seed_id = NEW.seed_id;
  IF 150 + public.village_tax(created, now()) - spent < price THEN RAISE EXCEPTION 'not enough money'; END IF;
  RETURN NEW;
END $$;