DO $$ DECLARE d text; BEGIN
 SELECT pg_get_functiondef('public.purchase_guard()'::regprocedure) INTO d;
 IF position('WHEN ''hunter'' THEN 110 WHEN ''fisher'' THEN 120 WHEN ''woodcamp'' THEN 180' in d)=0 OR position('WHEN ''library'' THEN 450 WHEN ''dairy'' THEN 450' in d)=0 OR position('WHEN ''guard'' THEN 800' in d)=0 THEN RAISE EXCEPTION 'unexpected guard'; END IF;
 d := replace(d,'WHEN ''hunter'' THEN 110 WHEN ''fisher'' THEN 120 WHEN ''woodcamp'' THEN 180','WHEN ''hunter'' THEN 100 WHEN ''fisher'' THEN 140 WHEN ''woodcamp'' THEN 240');
 d := replace(d,'WHEN ''library'' THEN 450 WHEN ''dairy'' THEN 450','WHEN ''library'' THEN 380 WHEN ''dairy'' THEN 350');
 d := replace(d,'WHEN ''guard'' THEN 800','WHEN ''guard'' THEN 750');
 EXECUTE d;
 SELECT pg_get_functiondef('public.village_civic_wealth(uuid,timestamptz)'::regprocedure) INTO d;
 IF position('WHEN ''library'' THEN 5 WHEN' in d)=0 OR position('WHEN ''university4'' THEN 10' in d)=0 THEN RAISE EXCEPTION 'unexpected civic'; END IF;
 d := replace(d,'WHEN ''library'' THEN 5 WHEN','WHEN ''library'' THEN 10 WHEN ''dairy'' THEN 5 WHEN');
 d := replace(d,'WHEN ''university4'' THEN 10','WHEN ''university4'' THEN 15 WHEN ''orangery3'' THEN 10');
 EXECUTE d;
END $$;