CREATE OR REPLACE FUNCTION public.village_estate_tax(_seed uuid, _at timestamptz)
RETURNS integer LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE created timestamptz; days integer; d integer; h double precision; r double precision; p integer; a integer; at_d timestamptz; m integer; rate double precision; herbs timestamptz; healer timestamptz; total integer:=0;
BEGIN
 SELECT created_at INTO created FROM public.seeds WHERE id=_seed;
 IF created IS NULL THEN RETURN 0; END IF;
 SELECT min(created_at) INTO herbs FROM public.purchases WHERE seed_id=_seed AND item='herbs';
 SELECT min(created_at) INTO healer FROM public.purchases WHERE seed_id=_seed AND item IN ('healer','infirmary');
 days:=greatest(0,floor(extract(epoch FROM (_at-created))/86400)::integer);
 FOR d IN 1..days LOOP
  h:=d*24; r:=1.6+0.18*sqrt(h)+3*ln(1+h/60);
  p:=floor(3+0.9*power(r,1.6))::integer;
  at_d:=created+make_interval(days=>d);
  a:=public.estate_assessment(p,public.village_civic_wealth(_seed,at_d));
  m:=extract(month FROM (at_d AT TIME ZONE 'UTC'))::integer;
  rate:=0.06+(CASE WHEN m IN (12,1,2) THEN 0.03 ELSE 0 END)
    -(CASE WHEN herbs IS NOT NULL AND herbs<=at_d THEN 0.015 ELSE 0 END)
    -(CASE WHEN healer IS NOT NULL AND healer<=at_d THEN 0.035 ELSE 0 END);
  rate:=greatest(0.01,rate);
  total:=total+a-floor(a*rate*0.4)::integer;
 END LOOP;
 RETURN total;
END $$;
REVOKE ALL ON FUNCTION public.village_estate_tax(uuid,timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.village_estate_tax(uuid,timestamptz) TO authenticated, service_role;