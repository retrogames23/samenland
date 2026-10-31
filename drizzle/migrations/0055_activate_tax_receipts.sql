DO $$ DECLARE definition text; BEGIN
 SELECT pg_get_functiondef('public.village_capped_tax(uuid,timestamptz)'::regprocedure) INTO definition;
 definition:=replace(definition,'c2 timestamptz; c3 timestamptz;','cut timestamptz; first_day integer; c2 timestamptz; c3 timestamptz;');
 definition:=replace(definition,' days:=greatest(0,floor(extract(epoch FROM (_at-created))/86400)::integer);',
  ' days:=greatest(0,floor(extract(epoch FROM (_at-created))/86400)::integer);
 cut:=public.tax_receipt_start();
 first_day:=CASE WHEN cut IS NULL THEN 2147483647 ELSE greatest(1,ceil(extract(epoch FROM (cut-created))/86400)::integer) END;');
 definition:=replace(definition,'  IF cpath=''trade'' AND at_d>=cat THEN a:=a+floor(0.15*p)::integer; END IF;',
  '  IF cpath=''trade'' AND at_d>=cat THEN a:=a+floor(0.15*p)::integer; END IF;
  IF d>=first_day THEN a:=coalesce((SELECT t.income FROM public.tax_receipts t WHERE t.seed_id=_seed AND t.day=d),0); END IF;');
 IF position('first_day' in definition)=0 THEN RAISE EXCEPTION 'patch failed'; END IF;
 EXECUTE definition;
END $$;
INSERT INTO public.tax_cutover(singleton, at) VALUES (true, now()) ON CONFLICT (singleton) DO NOTHING;