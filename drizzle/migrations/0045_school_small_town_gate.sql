DO $$ DECLARE definition text; BEGIN
 SELECT pg_get_functiondef('public.purchase_guard()'::regprocedure) INTO definition;
 IF position('IF need IS NOT NULL AND cpath IS DISTINCT FROM need' in definition)=0 THEN RAISE EXCEPTION 'unexpected purchase guard'; END IF;
 EXECUTE replace(definition, 'IF need IS NOT NULL AND cpath IS DISTINCT FROM need', 'IF NEW.item = ''school'' AND now() - created < interval ''2160 hours'' THEN RAISE EXCEPTION ''too young''; END IF;
  IF need IS NOT NULL AND cpath IS DISTINCT FROM need');
END $$;