DO $mig$
DECLARE d text;
BEGIN
  SELECT pg_get_functiondef('public.purchase_guard()'::regprocedure) INTO d;
  IF position('WHEN ''badestube'' THEN 3' IN d) = 0 THEN RAISE EXCEPTION 'badestube gate not found'; END IF;
  d := replace(d, 'WHEN ''badestube'' THEN 3', 'WHEN ''badestube'' THEN 2');
  EXECUTE d;
END $mig$;