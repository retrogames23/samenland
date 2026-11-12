DO $mig$
DECLARE d text;
BEGIN
  SELECT pg_get_functiondef('public.purchase_guard()'::regprocedure) INTO d;
  IF position('WHEN ''firehouse'' THEN 600' IN d) = 0 OR position('WHEN ''firehouse'' THEN 3' IN d) = 0 OR position('-- community buildings: once per village' IN d) = 0 THEN RAISE EXCEPTION 'guard anchors not found'; END IF;
  d := replace(d, 'WHEN ''firehouse'' THEN 600', 'WHEN ''fireorder'' THEN 400 WHEN ''firehouse'' THEN 600');
  d := replace(d, 'WHEN ''firehouse'' THEN 3', 'WHEN ''fireorder'' THEN 2 WHEN ''firehouse'' THEN 3');
  d := replace(d, '-- community buildings: once per village', '-- village fire order: an ordinance, no building site, once per village
  IF NEW.item = ''fireorder'' THEN
    IF NEW.x IS NOT NULL THEN RAISE EXCEPTION ''bad position''; END IF;
    IF EXISTS (SELECT 1 FROM purchases WHERE seed_id = NEW.seed_id AND item = ''fireorder'') THEN RAISE EXCEPTION ''already built''; END IF;
  END IF;
  -- community buildings: once per village');
  EXECUTE d;
END $mig$;