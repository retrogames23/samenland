CREATE OR REPLACE FUNCTION public.village_capped_tax(_seed uuid, _at timestamptz)
RETURNS integer LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE created timestamptz; days integer; d integer; p integer; a integer; at_d timestamptz; m integer; rate double precision;
 herbs timestamptz; healer timestamptz; cpath text; cat timestamptz; owner uuid; total integer:=0; run integer:=160; cap integer;
 c2 timestamptz; c3 timestamptz; c4 timestamptz; deltas integer[]; r record;
BEGIN
 SELECT s.created_at, s.user_id INTO created, owner FROM public.seeds s WHERE s.id=_seed;
 IF created IS NULL THEN RETURN 0; END IF;
 SELECT c.path, c.created_at INTO cpath, cat FROM public.charters c WHERE c.seed_id=_seed LIMIT 1;
 SELECT min(created_at) INTO herbs FROM public.purchases WHERE seed_id=_seed AND item='herbs';
 SELECT min(created_at) INTO healer FROM public.purchases WHERE seed_id=_seed AND item IN ('healer','infirmary');
 SELECT min(created_at) INTO c2 FROM public.purchases WHERE seed_id=_seed AND item='chest2';
 SELECT min(created_at) INTO c3 FROM public.purchases WHERE seed_id=_seed AND item='chest3';
 SELECT min(created_at) INTO c4 FROM public.purchases WHERE seed_id=_seed AND item='chest4';
 days:=greatest(0,floor(extract(epoch FROM (_at-created))/86400)::integer);
 deltas:=array_fill(0, ARRAY[days+1]);
 FOR r IN SELECT greatest(0,floor(extract(epoch FROM (e.t-created))/86400))::integer k, sum(e.v)::integer v FROM (
   SELECT created_at t, -cost v FROM public.purchases WHERE seed_id=_seed
   UNION ALL SELECT created_at, -cost FROM public.encounters WHERE seed_id=_seed
   UNION ALL SELECT created_at, -cost FROM public.twin_works WHERE seed_id=_seed
   UNION ALL SELECT created_at, CASE WHEN to_seed=_seed THEN amount ELSE -amount END FROM public.gifts WHERE to_seed=_seed OR from_seed=_seed
   UNION ALL SELECT created_at, reward FROM public.quest_claims WHERE seed_id=_seed
   UNION ALL SELECT created_at, reward FROM public.market_sales WHERE seed_id=_seed
   UNION ALL SELECT created_at, reward FROM public.referrals WHERE referrer_seed=_seed OR referee_seed=_seed
   UNION ALL SELECT created_at, reward FROM public.village_visits WHERE visitor_seed=_seed
 ) e GROUP BY 1 LOOP
   IF r.k < days THEN deltas[r.k+1]:=r.v; END IF;
 END LOOP;
 FOR d IN 1..days LOOP
  run:=run+deltas[d];
  at_d:=created+make_interval(days=>d);
  p:=public.village_tax_pop(_seed, d*24, at_d);
  a:=public.estate_assessment(p,public.village_civic_wealth(_seed,at_d));
  m:=extract(month FROM (at_d AT TIME ZONE 'UTC'))::integer;
  rate:=0.06+(CASE WHEN m IN (12,1,2) THEN 0.03 ELSE 0 END)
    -(CASE WHEN herbs IS NOT NULL AND herbs<=at_d THEN 0.015 ELSE 0 END)
    -(CASE WHEN healer IS NOT NULL AND healer<=at_d THEN 0.035 ELSE 0 END);
  rate:=greatest(0.01,rate);
  a:=a-floor(a*rate*0.4)::integer;
  IF cpath='trade' AND at_d>=cat THEN a:=a+floor(0.15*p)::integer; END IF;
  IF owner IS NOT NULL AND at_d >= timestamptz '2026-10-31 00:00:00+00' THEN
   cap:=CASE WHEN c4 IS NOT NULL AND c4<=at_d THEN 15000 WHEN c3 IS NOT NULL AND c3<=at_d THEN 6000 WHEN c2 IS NOT NULL AND c2<=at_d THEN 2500 ELSE 800 END;
   a:=least(a, greatest(0, cap-run));
  END IF;
  run:=run+a; total:=total+a;
 END LOOP;
 RETURN total;
END $$;
REVOKE ALL ON FUNCTION public.village_capped_tax(uuid,timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.village_capped_tax(uuid,timestamptz) TO authenticated, service_role;

DO $$ DECLARE definition text; BEGIN
 SELECT pg_get_functiondef('public.village_balance(uuid)'::regprocedure) INTO definition;
 IF position('public.village_estate_tax(_seed, now())' in definition)=0 THEN RAISE EXCEPTION 'unexpected balance'; END IF;
 definition:=replace(definition,'public.village_estate_tax(_seed, now())','public.village_capped_tax(_seed, now())');
 EXECUTE definition;
 SELECT pg_get_functiondef(p.oid) INTO definition FROM pg_proc p WHERE p.proname='purchase_guard' AND p.pronamespace='public'::regnamespace;
 IF position('WHEN ''title3'' THEN 2500' in definition)=0 OR position('IF (NEW.x IS NULL) <> (NEW.y IS NULL)' in definition)=0 THEN RAISE EXCEPTION 'unexpected guard'; END IF;
 definition:=replace(definition,'WHEN ''title3'' THEN 2500','WHEN ''title3'' THEN 2500 WHEN ''chest2'' THEN 250 WHEN ''chest3'' THEN 800 WHEN ''chest4'' THEN 2000');
 definition:=replace(definition,'IF (NEW.x IS NULL) <> (NEW.y IS NULL)',
 'IF NEW.item IN (''chest2'',''chest3'',''chest4'') THEN
    IF NEW.x IS NOT NULL THEN RAISE EXCEPTION ''bad position''; END IF;
    IF EXISTS (SELECT 1 FROM purchases WHERE seed_id = NEW.seed_id AND item = NEW.item) THEN RAISE EXCEPTION ''step already paid''; END IF;
    IF NEW.item <> ''chest2'' AND NOT EXISTS (SELECT 1 FROM purchases WHERE seed_id = NEW.seed_id AND item = CASE NEW.item WHEN ''chest3'' THEN ''chest2'' ELSE ''chest3'' END) THEN RAISE EXCEPTION ''previous step open''; END IF;
    IF now() - created < (CASE NEW.item WHEN ''chest2'' THEN interval ''168 hours'' WHEN ''chest3'' THEN interval ''2160 hours'' ELSE interval ''4380 hours'' END) THEN RAISE EXCEPTION ''too young''; END IF;
  END IF;
  IF (NEW.x IS NULL) <> (NEW.y IS NULL)');
 EXECUTE definition;
END $$;

CREATE TABLE public.chest_mail (
  user_id uuid PRIMARY KEY,
  enabled boolean NOT NULL DEFAULT true,
  lang text NOT NULL DEFAULT 'de',
  last_sent_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.chest_mail TO authenticated;
GRANT ALL ON public.chest_mail TO service_role;
ALTER TABLE public.chest_mail ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own chest mail read" ON public.chest_mail FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own chest mail insert" ON public.chest_mail FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own chest mail update" ON public.chest_mail FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);