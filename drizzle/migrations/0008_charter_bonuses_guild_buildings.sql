CREATE OR REPLACE FUNCTION public.charter_tax(_created timestamptz, _charter timestamptz, _at timestamptz)
RETURNS integer LANGUAGE plpgsql IMMUTABLE SET search_path = public AS $$
DECLARE days integer := floor(extract(epoch FROM (_at - _created)) / 86400); total integer := 0; d integer; h double precision; r double precision;
BEGIN
  IF _charter IS NULL THEN RETURN 0; END IF;
  FOR d IN 1..greatest(days, 0) LOOP
    IF _created + make_interval(days => d) < _charter THEN CONTINUE; END IF;
    h := d * 24;
    r := 1.6 + 0.18 * sqrt(h) + 3 * ln(1 + h / 60);
    total := total + floor(0.15 * floor(3 + 0.9 * power(r, 1.6)))::integer;
  END LOOP;
  RETURN total;
END $$;

CREATE OR REPLACE FUNCTION public.purchase_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE price integer; need text; created timestamptz; spent integer; sx integer; sy integer; cpath text; cat timestamptz;
BEGIN
  price := CASE NEW.item WHEN 'fisher' THEN 120 WHEN 'granary' THEN 300 WHEN 'healer' THEN 900 WHEN 'school' THEN 3000
    WHEN 'markethall' THEN 450 WHEN 'guildhall' THEN 450 WHEN 'library' THEN 450 WHEN 'dairy' THEN 450 ELSE NULL END;
  IF price IS NULL THEN RAISE EXCEPTION 'unknown item'; END IF;
  need := CASE NEW.item WHEN 'markethall' THEN 'trade' WHEN 'guildhall' THEN 'craft' WHEN 'library' THEN 'culture' WHEN 'dairy' THEN 'farm' ELSE NULL END;
  NEW.cost := price; NEW.created_at := now();
  SELECT s.created_at, s.x, s.y INTO created, sx, sy FROM public.seeds s WHERE s.id = NEW.seed_id;
  SELECT c.path, c.created_at INTO cpath, cat FROM public.charters c WHERE c.seed_id = NEW.seed_id;
  IF need IS NOT NULL AND cpath IS DISTINCT FROM need THEN RAISE EXCEPTION 'wrong charter'; END IF;
  IF (NEW.x IS NULL) <> (NEW.y IS NULL) THEN RAISE EXCEPTION 'bad position'; END IF;
  IF NEW.x IS NOT NULL AND sqrt(power(NEW.x - sx, 2) + power(NEW.y - sy, 2)) > 40 THEN RAISE EXCEPTION 'too far'; END IF;
  SELECT coalesce(sum(p.cost), 0) INTO spent FROM public.purchases p WHERE p.seed_id = NEW.seed_id;
  IF 150 + public.village_tax(created, now()) + (CASE WHEN cpath = 'trade' THEN public.charter_tax(created, cat, now()) ELSE 0 END) - spent < price THEN RAISE EXCEPTION 'not enough money'; END IF;
  RETURN NEW;
END $$;