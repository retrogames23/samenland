DO $mig$
DECLARE d text;
DECLARE old_block text := $old$  -- village fire order: an ordinance, no building site, once per village
  IF NEW.item = 'fireorder' THEN
    IF NEW.x IS NOT NULL THEN RAISE EXCEPTION 'bad position'; END IF;
    IF EXISTS (SELECT 1 FROM purchases WHERE seed_id = NEW.seed_id AND item = 'fireorder') THEN RAISE EXCEPTION 'already built'; END IF;
  END IF;$old$;
DECLARE new_block text := $new$  -- village fire order: placeable rack, once per village; legacy unpositioned purchases remain valid
  IF NEW.item = 'fireorder' THEN
    IF EXISTS (SELECT 1 FROM purchases WHERE seed_id = NEW.seed_id AND item = 'fireorder') THEN RAISE EXCEPTION 'already built'; END IF;
  END IF;$new$;
BEGIN
  SELECT pg_get_functiondef('public.purchase_guard()'::regprocedure) INTO d;
  IF position(old_block IN d) = 0 THEN RAISE EXCEPTION 'fire order placement anchor not found'; END IF;
  EXECUTE replace(d, old_block, new_block);
END $mig$;