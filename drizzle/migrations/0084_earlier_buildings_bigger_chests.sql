DO $$ DECLARE d text; f text; BEGIN
 FOREACH f IN ARRAY ARRAY['public.village_capped_tax(uuid,timestamptz)','public.village_balance(uuid)'] LOOP
  SELECT pg_get_functiondef(f::regprocedure) INTO d;
  IF position('15000' in d)=0 THEN RAISE EXCEPTION 'unexpected %', f; END IF;
  d:=replace(d,'THEN 15000','THEN 25000'); d:=replace(d,'THEN 6000','THEN 10000'); d:=replace(d,'THEN 2500 ELSE 800','THEN 4000 ELSE 1200');
  d:=replace(d,'coalesce(cap, 800)','coalesce(cap, 1200)');
  IF position('ELSE 1200' in d)=0 THEN RAISE EXCEPTION 'cap not replaced %', f; END IF;
  EXECUTE d;
 END LOOP;
 SELECT pg_get_functiondef(p.oid) INTO d FROM pg_proc p WHERE p.proname='purchase_guard' AND p.pronamespace='public'::regnamespace;
 IF position('THEN interval ''168 hours'' ELSE interval ''4380 hours'' END' in d)=0 OR position('WHEN ''beginen'' THEN interval ''2160 hours'' ELSE interval ''168 hours'' END' in d)=0 THEN RAISE EXCEPTION 'unexpected guard'; END IF;
 d:=replace(d,'THEN interval ''168 hours'' ELSE interval ''4380 hours'' END','THEN interval ''24 hours'' ELSE interval ''2160 hours'' END');
 d:=replace(d,'WHEN ''beginen'' THEN interval ''2160 hours'' ELSE interval ''168 hours'' END','WHEN ''beginen'' THEN interval ''168 hours'' ELSE interval ''24 hours'' END');
 EXECUTE d;
END $$;