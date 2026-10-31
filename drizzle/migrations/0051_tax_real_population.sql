CREATE OR REPLACE FUNCTION public.village_tax_pop(_seed uuid, _h double precision, _at timestamptz)
RETURNS integer LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE r double precision; p integer; owner uuid; f integer; hl integer;
BEGIN
 r:=1.6+0.18*sqrt(_h)+3*ln(1+_h/60);
 p:=floor(3+0.9*power(r,1.6))::integer;
 SELECT user_id INTO owner FROM public.seeds WHERE id=_seed;
 IF owner IS NULL THEN RETURN p; END IF;
 SELECT count(DISTINCT item) INTO f FROM public.purchases WHERE seed_id=_seed AND item IN ('fisher','hunter','granary','dairy') AND created_at<=_at;
 SELECT count(DISTINCT item) INTO hl FROM public.purchases WHERE seed_id=_seed AND item IN ('herbs','healer') AND created_at<=_at;
 RETURN least(p, 85+25*f+15*hl);
END $$;

CREATE OR REPLACE FUNCTION public.village_estate_tax(_seed uuid, _at timestamptz)
RETURNS integer LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE created timestamptz; days integer; d integer; p integer; a integer; at_d timestamptz; m integer; rate double precision; herbs timestamptz; healer timestamptz; cpath text; cat timestamptz; total integer:=0;
BEGIN
 SELECT s.created_at INTO created FROM public.seeds s WHERE s.id=_seed;
 IF created IS NULL THEN RETURN 0; END IF;
 SELECT c.path, c.created_at INTO cpath, cat FROM public.charters c WHERE c.seed_id=_seed LIMIT 1;
 SELECT min(created_at) INTO herbs FROM public.purchases WHERE seed_id=_seed AND item='herbs';
 SELECT min(created_at) INTO healer FROM public.purchases WHERE seed_id=_seed AND item IN ('healer','infirmary');
 days:=greatest(0,floor(extract(epoch FROM (_at-created))/86400)::integer);
 FOR d IN 1..days LOOP
  at_d:=created+make_interval(days=>d);
  p:=public.village_tax_pop(_seed, d*24, at_d);
  a:=public.estate_assessment(p,public.village_civic_wealth(_seed,at_d));
  m:=extract(month FROM (at_d AT TIME ZONE 'UTC'))::integer;
  rate:=0.06+(CASE WHEN m IN (12,1,2) THEN 0.03 ELSE 0 END)
    -(CASE WHEN herbs IS NOT NULL AND herbs<=at_d THEN 0.015 ELSE 0 END)
    -(CASE WHEN healer IS NOT NULL AND healer<=at_d THEN 0.035 ELSE 0 END);
  rate:=greatest(0.01,rate);
  total:=total+a-floor(a*rate*0.4)::integer;
  IF cpath='trade' AND at_d>=cat THEN total:=total+floor(0.15*p)::integer; END IF;
 END LOOP;
 RETURN total;
END $$;

DO $$ DECLARE definition text; BEGIN
 SELECT pg_get_functiondef('public.village_balance(uuid)'::regprocedure) INTO definition;
 IF position('RETURN 150 + public.village_estate_tax(_seed, now())' in definition)=0 THEN RAISE EXCEPTION 'unexpected balance start'; END IF;
 IF position('(CASE WHEN cpath = ''trade'' THEN public.charter_tax(created, cat, now()) ELSE 0 END)' in definition)=0 THEN RAISE EXCEPTION 'unexpected charter tax'; END IF;
 definition:=replace(definition,'RETURN 150 + public.village_estate_tax(_seed, now())','RETURN 160 + public.village_estate_tax(_seed, now())');
 definition:=replace(definition,'(CASE WHEN cpath = ''trade'' THEN public.charter_tax(created, cat, now()) ELSE 0 END)','0');
 EXECUTE definition;
END $$;
REVOKE ALL ON FUNCTION public.village_tax_pop(uuid,double precision,timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.village_tax_pop(uuid,double precision,timestamptz) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.village_estate_tax(uuid,timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.village_estate_tax(uuid,timestamptz) TO authenticated, service_role;