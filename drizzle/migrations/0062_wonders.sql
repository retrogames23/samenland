CREATE TABLE public.wonder_sites (
  key text PRIMARY KEY,
  kind text NOT NULL,
  x integer NOT NULL,
  y integer NOT NULL
);
GRANT SELECT ON public.wonder_sites TO anon, authenticated;
GRANT ALL ON public.wonder_sites TO service_role;
ALTER TABLE public.wonder_sites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can see wonder sites" ON public.wonder_sites FOR SELECT TO anon, authenticated USING (true);
INSERT INTO public.wonder_sites(key, kind, x, y) VALUES
('caravan:277:112','caravan',277,112),
('spring:374:170','spring',374,170),
('ruin:397:179','ruin',397,179),
('caravan:536:136','caravan',536,136),
('wreck:654:163','wreck',654,163),
('wreck:704:154','wreck',704,154),
('wreck:780:165','wreck',780,165),
('oak:168:241','oak',168,241),
('ruin:210:233','ruin',210,233),
('wreck:305:230','wreck',305,230),
('cave:420:208','cave',420,208),
('oak:553:269','oak',553,269),
('oak:607:271','oak',607,271),
('wreck:708:216','wreck',708,216),
('wreck:821:239','wreck',821,239),
('oak:873:265','oak',873,265),
('oak:47:362','oak',47,362),
('wreck:109:300','wreck',109,300),
('oak:246:375','oak',246,375),
('oak:332:377','oak',332,377),
('cave:427:296','cave',427,296),
('oak:510:295','oak',510,295),
('oak:592:366','oak',592,366),
('ruin:687:326','ruin',687,326),
('spring:804:339','spring',804,339),
('caravan:898:301','caravan',898,301),
('caravan:59:401','caravan',59,401),
('caravan:181:445','caravan',181,445),
('wreck:243:436','wreck',243,436),
('oak:339:462','oak',339,462),
('cave:429:428','cave',429,428),
('cave:492:445','cave',492,445),
('ruin:600:440','ruin',600,440),
('oak:734:439','oak',734,439),
('wreck:830:392','wreck',830,392),
('wreck:877:423','wreck',877,423),
('oak:185:564','oak',185,564),
('cave:260:545','cave',260,545),
('cave:313:546','cave',313,546),
('oak:395:525','oak',395,525),
('caravan:561:565','caravan',561,565),
('oak:629:527','oak',629,527),
('ruin:752:558','ruin',752,558),
('ruin:791:508','ruin',791,508),
('oak:882:503','oak',882,503),
('oak:87:619','oak',87,619),
('wreck:126:606','wreck',126,606),
('oak:214:601','oak',214,601),
('oak:335:651','oak',335,651),
('oak:431:658','oak',431,658),
('caravan:568:619','caravan',568,619),
('ruin:664:638','ruin',664,638),
('cave:737:589','cave',737,589),
('ruin:848:649','ruin',848,649),
('oak:919:663','oak',919,663),
('oak:89:678','oak',89,678),
('caravan:180:749','caravan',180,749),
('oak:240:742','oak',240,742),
('oak:343:753','oak',343,753),
('caravan:411:689','caravan',411,689),
('caravan:507:712','caravan',507,712),
('oak:585:761','oak',585,761),
('oak:742:706','oak',742,706),
('caravan:813:739','caravan',813,739),
('oak:931:683','oak',931,683),
('caravan:177:780','caravan',177,780),
('wreck:216:857','wreck',216,857),
('oak:294:848','oak',294,848),
('cave:458:814','cave',458,814),
('oak:555:854','oak',555,854),
('oak:640:805','oak',640,805),
('caravan:713:813','caravan',713,813),
('oak:792:782','oak',792,782),
('caravan:241:873','caravan',241,873),
('wreck:359:909','wreck',359,909),
('wreck:443:915','wreck',443,915),
('spring:505:883','spring',505,883),
('wreck:655:911','wreck',655,911),
('wreck:684:901','wreck',684,901);

CREATE TABLE public.wonder_finds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seed_id uuid NOT NULL REFERENCES public.seeds(id),
  site text NOT NULL REFERENCES public.wonder_sites(key),
  realm text NOT NULL,
  first boolean NOT NULL DEFAULT false,
  reward integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (seed_id, site)
);
CREATE UNIQUE INDEX wonder_finds_first ON public.wonder_finds(site, realm) WHERE first;
GRANT SELECT ON public.wonder_finds TO anon, authenticated;
GRANT ALL ON public.wonder_finds TO service_role;
ALTER TABLE public.wonder_finds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can see wonder finds" ON public.wonder_finds FOR SELECT TO anon, authenticated USING (true);

CREATE OR REPLACE FUNCTION public.claim_wonder(_seed uuid, _site text)
 RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE me public.seeds; w public.wonder_sites; isfirst boolean; r integer;
BEGIN
  SELECT * INTO me FROM public.seeds WHERE id = _seed;
  IF me.id IS NULL OR me.user_id IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'not your village'; END IF;
  SELECT * INTO w FROM public.wonder_sites WHERE key = _site;
  IF w.key IS NULL THEN RAISE EXCEPTION 'unknown site'; END IF;
  IF (SELECT count(*) FROM public.wonder_finds WHERE seed_id = _seed AND created_at > now() - interval '1 day') >= 6 THEN RAISE EXCEPTION 'too many'; END IF;
  PERFORM pg_advisory_xact_lock(hashtext(_site || coalesce(me.realm, '')));
  isfirst := NOT EXISTS (SELECT 1 FROM public.wonder_finds WHERE site = _site AND realm = coalesce(me.realm, 'europe') AND first);
  r := CASE WHEN isfirst THEN 100 ELSE 40 END;
  INSERT INTO public.wonder_finds(seed_id, site, realm, first, reward) VALUES (_seed, _site, coalesce(me.realm, 'europe'), isfirst, r) ON CONFLICT DO NOTHING;
  IF NOT FOUND THEN RETURN 0; END IF;
  RETURN r;
END $$;
REVOKE EXECUTE ON FUNCTION public.claim_wonder(uuid, text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.claim_wonder(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.village_balance(_seed uuid)
 RETURNS integer
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE created timestamptz; owner uuid; spent integer; ev integer; tw integer; gi integer; qr integer; mk integer; rf integer; vv integer; wf integer;
 dw integer; dold integer:=0; dnew integer; base integer; cap integer; since timestamptz := timestamptz '2026-10-31 00:00:00+00';
BEGIN
  SELECT s.created_at, s.user_id INTO created, owner FROM public.seeds s WHERE s.id = _seed;
  SELECT coalesce(sum(cost),0) INTO spent FROM public.purchases WHERE seed_id = _seed;
  SELECT coalesce(sum(cost),0) INTO ev FROM public.encounters WHERE seed_id = _seed;
  SELECT coalesce(sum(cost),0) INTO tw FROM public.twin_works WHERE seed_id = _seed;
  SELECT coalesce(sum(CASE WHEN to_seed = _seed THEN amount ELSE -amount END),0) INTO gi FROM public.gifts WHERE to_seed = _seed OR from_seed = _seed;
  SELECT coalesce(sum(reward),0) INTO qr FROM public.quest_claims WHERE seed_id = _seed;
  SELECT coalesce(sum(reward),0) INTO mk FROM public.market_sales WHERE seed_id = _seed;
  SELECT coalesce(sum(reward),0) INTO rf FROM public.referrals WHERE referrer_seed = _seed OR referee_seed = _seed;
  SELECT coalesce(sum(reward),0) INTO vv FROM public.village_visits WHERE visitor_seed = _seed;
  SELECT coalesce(sum(reward),0) INTO wf FROM public.wonder_finds WHERE seed_id = _seed;
  SELECT coalesce(w.dowry,0) INTO dw FROM public.village_weddings(_seed, now()) w;
  IF created < since THEN SELECT coalesce(w.dowry,0) INTO dold FROM public.village_weddings(_seed, least(now(), since)) w; END IF;
  dw := coalesce(dw,0); dold := coalesce(dold,0); dnew := dw - dold;
  base := 160 + public.village_capped_tax(_seed, now()) - spent - ev - tw + gi + qr + mk + rf + vv + wf;
  IF owner IS NOT NULL THEN
    SELECT CASE WHEN bool_or(item='chest4') THEN 15000 WHEN bool_or(item='chest3') THEN 6000 WHEN bool_or(item='chest2') THEN 2500 ELSE 800 END
      INTO cap FROM public.purchases WHERE seed_id = _seed AND item LIKE 'chest%';
    cap := coalesce(cap, 800);
    dnew := least(dnew, greatest(0, cap - base - dold));
  END IF;
  -- robbers can never push the chest below zero
  RETURN greatest(0, base + dold + dnew - public.village_raids(_seed, created, now()));
END $function$;

CREATE OR REPLACE FUNCTION public.village_capped_tax(_seed uuid, _at timestamp with time zone)
 RETURNS integer
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE created timestamptz; days integer; d integer; p integer; a integer; at_d timestamptz; m integer; rate double precision;
 herbs timestamptz; healer timestamptz; cpath text; cat timestamptz; owner uuid; total integer:=0; run integer:=160; cap integer;
 cut timestamptz; first_day integer; c2 timestamptz; c3 timestamptz; c4 timestamptz; deltas integer[]; r record;
 h bigint; rk integer := 0; rd integer := 4; g timestamptz; rt timestamptz; ri integer;
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
 cut:=public.tax_receipt_start();
 first_day:=CASE WHEN cut IS NULL THEN 2147483647 ELSE greatest(1,ceil(extract(epoch FROM (cut-created))/86400)::integer) END;
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
   UNION ALL SELECT created_at, reward FROM public.wonder_finds WHERE seed_id=_seed
 ) e GROUP BY 1 LOOP
   IF r.k < days THEN deltas[r.k+1]:=deltas[r.k+1]+r.v; END IF;
 END LOOP;
 -- raids empty the chest too, so later taxes may refill it (mirrors village_raids)
 h := ('x' || substr(replace(_seed::text, '-', ''), 1, 8))::bit(32)::bigint;
 SELECT min(created_at) INTO g FROM public.purchases WHERE seed_id = _seed AND item = 'guard';
 LOOP
   rd := rd + 6 + ((h + rk * 7919) % 19)::integer;
   rt := created + make_interval(days => rd, hours => ((h + rk * 31) % 24)::integer);
   EXIT WHEN rt > _at OR rk > 2000;
   IF g IS NULL OR g > rt THEN
     ri := greatest(0, floor(extract(epoch FROM (rt-created))/86400)::integer);
     IF ri < days THEN deltas[ri+1] := deltas[ri+1] - (12 + ((h + rk * 104729) % 34)::integer); END IF;
   END IF;
   rk := rk + 1;
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
  IF d>=first_day THEN a:=coalesce((SELECT t.income FROM public.tax_receipts t WHERE t.seed_id=_seed AND t.day=d),0); END IF;
  IF owner IS NOT NULL AND at_d >= timestamptz '2026-10-31 00:00:00+00' THEN
   cap:=CASE WHEN c4 IS NOT NULL AND c4<=at_d THEN 15000 WHEN c3 IS NOT NULL AND c3<=at_d THEN 6000 WHEN c2 IS NOT NULL AND c2<=at_d THEN 2500 ELSE 800 END;
   a:=least(a, greatest(0, cap-run));
  END IF;
  run:=run+a; total:=total+a;
 END LOOP;
 RETURN total;
END $function$;

CREATE OR REPLACE FUNCTION public.abandon_village(_seed uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (SELECT 1 FROM seeds WHERE id = _seed AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'not your village';
  END IF;
  DELETE FROM village_visits WHERE visitor_seed = _seed OR visited_seed = _seed;
  DELETE FROM wonder_finds WHERE seed_id = _seed;
  DELETE FROM letters WHERE from_seed = _seed OR to_seed = _seed;
  DELETE FROM market_sales WHERE seed_id = _seed;
  DELETE FROM quest_claims WHERE seed_id = _seed;
  DELETE FROM blessings WHERE seed_id = _seed;
  DELETE FROM charters WHERE seed_id = _seed;
  DELETE FROM encounters WHERE seed_id = _seed;
  DELETE FROM first_roads WHERE seed_id = _seed OR target_id = _seed;
  DELETE FROM gifts WHERE from_seed = _seed OR to_seed = _seed;
  DELETE FROM plantings WHERE seed_id = _seed;
  DELETE FROM purchases WHERE seed_id = _seed;
  DELETE FROM signposts WHERE seed_id = _seed OR target_id = _seed;
  DELETE FROM twin_votes WHERE seed_id = _seed OR partner_id = _seed;
  DELETE FROM twin_works WHERE seed_id = _seed OR partner_id = _seed;
  DELETE FROM seeds WHERE id = _seed;
END $function$;

CREATE OR REPLACE FUNCTION public.purge_user_data(_uid uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE _seed uuid;
BEGIN
  FOR _seed IN SELECT id FROM seeds WHERE user_id = _uid LOOP
    DELETE FROM village_visits WHERE visitor_seed = _seed OR visited_seed = _seed;
    DELETE FROM wonder_finds WHERE seed_id = _seed;
    DELETE FROM referrals WHERE referrer_seed = _seed OR referee_seed = _seed;
    DELETE FROM letter_bodies WHERE letter_id IN (SELECT id FROM letters WHERE from_seed = _seed OR to_seed = _seed);
    DELETE FROM letters WHERE from_seed = _seed OR to_seed = _seed;
    DELETE FROM chat_messages WHERE sender_seed = _seed;
    DELETE FROM market_sales WHERE seed_id = _seed;
    DELETE FROM quest_claims WHERE seed_id = _seed;
    DELETE FROM blessings WHERE seed_id = _seed;
    DELETE FROM charters WHERE seed_id = _seed;
    DELETE FROM encounters WHERE seed_id = _seed;
    DELETE FROM first_roads WHERE seed_id = _seed OR target_id = _seed;
    DELETE FROM gift_reads WHERE gift_id IN (SELECT id FROM gifts WHERE from_seed = _seed OR to_seed = _seed);
    DELETE FROM gifts WHERE from_seed = _seed OR to_seed = _seed;
    DELETE FROM plantings WHERE seed_id = _seed;
    DELETE FROM purchases WHERE seed_id = _seed;
    DELETE FROM signposts WHERE seed_id = _seed OR target_id = _seed;
    DELETE FROM twin_votes WHERE seed_id = _seed OR partner_id = _seed;
    DELETE FROM twin_works WHERE seed_id = _seed OR partner_id = _seed;
    DELETE FROM seeds WHERE id = _seed;
  END LOOP;
  DELETE FROM chat_blocks WHERE blocker_id = _uid OR blocked_id = _uid;
  DELETE FROM build_mail WHERE user_id = _uid;
  DELETE FROM user_activity WHERE user_id = _uid;
END $function$;
