DO $do$
DECLARE d text;
BEGIN
  d := pg_get_functiondef('public.purchase_guard()'::regprocedure);
  IF position('backhaus2' in d) > 0 THEN RETURN; END IF;
  d := replace(d, $s$WHEN 'fountain3' THEN 12000 ELSE NULL END;$s$,
    $s$WHEN 'fountain3' THEN 12000 WHEN 'backhaus2' THEN 400 WHEN 'backhaus3' THEN 900 WHEN 'herberge2' THEN 500 WHEN 'herberge3' THEN 1100 WHEN 'granary2' THEN 450 WHEN 'granary3' THEN 1000 ELSE NULL END;$s$);
  d := replace(d, $s$  NEW.cost := price; NEW.created_at := now();$s$,
    $s$  IF NEW.item IN ('backhaus2','backhaus3','herberge2','herberge3','granary2','granary3') THEN
    IF NEW.x IS NOT NULL OR NEW.y IS NOT NULL THEN RAISE EXCEPTION 'bad position'; END IF;
    IF EXISTS (SELECT 1 FROM purchases WHERE seed_id = NEW.seed_id AND item = NEW.item) THEN RAISE EXCEPTION 'step already paid'; END IF;
    IF NOT EXISTS (SELECT 1 FROM purchases WHERE seed_id = NEW.seed_id AND item = CASE NEW.item WHEN 'backhaus2' THEN 'backhaus' WHEN 'herberge2' THEN 'herberge' WHEN 'granary2' THEN 'granary' WHEN 'backhaus3' THEN 'backhaus2' WHEN 'herberge3' THEN 'herberge2' ELSE 'granary2' END) THEN RAISE EXCEPTION 'previous step open'; END IF;
  END IF;
  NEW.cost := price; NEW.created_at := now();$s$);
  d := replace(d, $s$WHEN 'fountain1' THEN 4 ELSE 0 END;$s$,
    $s$WHEN 'fountain1' THEN 4 WHEN 'backhaus2' THEN 2 WHEN 'herberge2' THEN 2 WHEN 'granary2' THEN 2 WHEN 'backhaus3' THEN 3 WHEN 'herberge3' THEN 3 WHEN 'granary3' THEN 3 ELSE 0 END;$s$);
  IF (length(d) - length(replace(d, 'backhaus2', ''))) / 9 < 4 THEN RAISE EXCEPTION 'purchase_guard patch did not apply'; END IF;
  EXECUTE d;
END $do$;
CREATE UNIQUE INDEX IF NOT EXISTS purchases_ausbau_once ON public.purchases (seed_id, item) WHERE item IN ('backhaus2','backhaus3','herberge2','herberge3','granary2','granary3');